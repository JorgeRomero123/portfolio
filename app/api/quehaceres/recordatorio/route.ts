import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sesionValida } from '@/lib/quehaceres-auth';
import { EmailNoConfigurado, enviarCorreo } from '@/lib/email';
import {
  calcular,
  etiquetaEstado,
  fechaLarga,
  hoyCDMX,
  ordenarPorUrgencia,
  type Quehacer,
  type QuehacerCalculado,
} from '@/lib/quehaceres';

// El cron de Vercel corre a las 14:00 UTC = 8:00 a.m. en CDMX (sin horario de verano).
export const dynamic = 'force-dynamic';

const COLOR = {
  vencido: '#dc2626',
  hoy: '#0070f3',
  pronto: '#b45309',
  ok: '#6b7280',
} as const;

function filaHTML(q: QuehacerCalculado): string {
  return `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;font-size:22px;width:40px;vertical-align:top;">${q.emoji}</td>
      <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;vertical-align:top;">
        <div style="font-size:16px;font-weight:600;color:#111827;">${escapar(q.nombre)}</div>
        <div style="font-size:13px;color:${COLOR[q.estado]};margin-top:2px;font-weight:500;">${etiquetaEstado(q)}</div>
        ${q.notas ? `<div style="font-size:13px;color:#6b7280;margin-top:4px;">${escapar(q.notas)}</div>` : ''}
      </td>
    </tr>`;
}

function escapar(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

function seccion(titulo: string, lista: QuehacerCalculado[]): string {
  if (lista.length === 0) return '';
  return `
    <h2 style="font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:#9ca3af;margin:28px 0 4px;">${titulo}</h2>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">${lista.map(filaHTML).join('')}</table>`;
}

function construirCorreo(hoy: string, pendientes: QuehacerCalculado[], proximos: QuehacerCalculado[]) {
  const vencidos = pendientes.filter((q) => q.estado === 'vencido');
  const deHoy = pendientes.filter((q) => q.estado === 'hoy');

  let subject: string;
  if (vencidos.length > 0) {
    const n = pendientes.length;
    subject = `🧹 ${n} quehacer${n === 1 ? '' : 'es'} pendiente${n === 1 ? '' : 's'} (${vencidos.length} atrasado${vencidos.length === 1 ? '' : 's'})`;
  } else if (deHoy.length > 0) {
    subject = `🧹 Hoy toca: ${deHoy.map((q) => q.nombre.toLowerCase()).join(', ')}`;
  } else {
    // Solo pasa con un envío forzado desde el tool.
    subject = '🧹 Todo al día en el depa';
  }

  const sitio = process.env.NEXT_PUBLIC_SITE_URL || 'https://jorgeromeroromanis.com';

  const html = `<!doctype html>
<html lang="es-MX"><body style="margin:0;padding:24px;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,.08);" cellpadding="0" cellspacing="0" role="presentation">
        <tr><td>
          <div style="font-size:13px;color:#9ca3af;text-transform:capitalize;">${fechaLarga(hoy)}</div>
          <h1 style="font-size:26px;font-weight:700;color:#111827;margin:6px 0 0;">Quehaceres del depa</h1>
          ${seccion('Atrasados', vencidos)}
          ${seccion('Toca hoy', deHoy)}
          ${seccion('Ya casi', proximos)}
          ${pendientes.length === 0 && proximos.length === 0 ? '<p style="font-size:15px;color:#6b7280;margin:24px 0 0;">Nada pendiente por ahora. 🎉</p>' : ''}
          <a href="${sitio}/tools/quehaceres" style="display:inline-block;margin-top:28px;background:#0070f3;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px;">Marcar como hechos →</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = [
    `Quehaceres del depa — ${fechaLarga(hoy)}`,
    '',
    ...pendientes.map((q) => `• ${q.nombre} — ${etiquetaEstado(q)}`),
    ...(proximos.length ? ['', 'Ya casi:', ...proximos.map((q) => `• ${q.nombre} — ${etiquetaEstado(q)}`)] : []),
    '',
    `${sitio}/tools/quehaceres`,
  ].join('\n');

  return { subject, html, text };
}

/**
 * Cron diario. Solo manda correo si hay algo vencido o que toca hoy.
 *
 * Autoriza el cron de Vercel (Bearer CRON_SECRET) o una sesión con PIN válida,
 * para poder dispararlo a mano desde el tool.
 */
export async function GET(req: NextRequest) {
  const secreto = process.env.CRON_SECRET;
  const esCron = !!secreto && req.headers.get('authorization') === `Bearer ${secreto}`;

  if (!esCron && !(await sesionValida())) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const destinatario = process.env.QUEHACERES_EMAIL || process.env.ADMIN_EMAIL;
  if (!destinatario) {
    return NextResponse.json(
      { error: 'Falta QUEHACERES_EMAIL (o ADMIN_EMAIL) en el entorno.' },
      { status: 503 }
    );
  }

  const { data, error } = await supabase.from('quehaceres').select('*').eq('activo', true);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const hoy = hoyCDMX();
  const todos = ordenarPorUrgencia((data as Quehacer[]).map((q) => calcular(q, hoy)));
  const pendientes = todos.filter((q) => q.dias_restantes <= 0);
  const proximos = todos.filter((q) => q.estado === 'pronto');

  // Forzar el envío sirve para probar la plantilla desde el tool.
  const forzar = req.nextUrl.searchParams.get('forzar') === '1' && !esCron;

  if (pendientes.length === 0 && !forzar) {
    return NextResponse.json({ enviado: false, motivo: 'Nada pendiente hoy.', hoy });
  }

  const { subject, html, text } = construirCorreo(
    hoy,
    pendientes.length ? pendientes : proximos,
    pendientes.length ? proximos : []
  );

  try {
    const id = await enviarCorreo({ to: destinatario, subject, html, text });
    return NextResponse.json({ enviado: true, id, hoy, pendientes: pendientes.length });
  } catch (e) {
    const sinConfigurar = e instanceof EmailNoConfigurado;
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Falló el envío.' },
      { status: sinConfigurar ? 503 : 502 }
    );
  }
}
