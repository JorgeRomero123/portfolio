import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sesionValida } from '@/lib/quehaceres-auth';
import { EmailNoConfigurado, enviarCorreo } from '@/lib/email';
import { fechaLarga, hoyCDMX } from '@/lib/quehaceres';
import { resumir, type Sesion } from '@/lib/rutina';

// El cron de Vercel corre a las 21:30 UTC = 3:30 p.m. en CDMX (sin horario de verano).
export const dynamic = 'force-dynamic';

function escapar(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

function construirCorreo(r: ReturnType<typeof resumir>) {
  const sitio = process.env.NEXT_PUBLIC_SITE_URL || 'https://jorgeromeroromanis.com';

  // El asunto lleva lo único que importa: cuánto llevas y qué cuesta mantenerlo.
  const subject =
    r.racha.actual > 0
      ? `🏋️ Racha de ${r.racha.actual} día${r.racha.actual === 1 ? '' : 's'} — 5 minutos y sigue viva`
      : '🏋️ 5 minutos y arrancamos la racha';

  const comodin = r.racha.comodinDisponible
    ? 'Te queda comodín esta semana, pero mejor no lo gastes hoy.'
    : 'Ya usaste el comodín de esta semana — si fallas hoy, la racha se reinicia.';

  const html = `<!doctype html>
<html lang="es-MX"><body style="margin:0;padding:24px;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,.08);" cellpadding="0" cellspacing="0" role="presentation">
        <tr><td>
          <div style="font-size:13px;color:#9ca3af;text-transform:capitalize;">${fechaLarga(r.hoy)}</div>
          <h1 style="font-size:26px;font-weight:700;color:#111827;margin:6px 0 0;">Hoy toca moverte</h1>

          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:24px 0 0;">
            <tr>
              <td style="padding:14px 0;border-top:1px solid #f1f5f9;">
                <div style="font-size:32px;font-weight:700;color:#0070f3;">${r.racha.actual} 🔥</div>
                <div style="font-size:13px;color:#6b7280;margin-top:2px;">días seguidos · mejor: ${r.racha.mejor}</div>
              </td>
              <td style="padding:14px 0;border-top:1px solid #f1f5f9;text-align:right;vertical-align:top;">
                <div style="font-size:15px;font-weight:600;color:#111827;">Nivel ${r.nivel.nivel}</div>
                <div style="font-size:13px;color:#6b7280;margin-top:2px;">${r.nivel.hasta === null ? 'nivel máximo' : `faltan ${r.nivel.faltan} XP`}</div>
              </td>
            </tr>
          </table>

          <p style="font-size:15px;line-height:1.6;color:#374151;margin:20px 0 0;">
            El mínimo son <b>5 minutos</b>: sentadillas, flexiones, plancha, puente y bicho muerto.
            Con eso el día ya cuenta. Todo lo demás es opcional.
          </p>
          <p style="font-size:14px;line-height:1.6;color:#6b7280;margin:12px 0 0;">${escapar(comodin)}</p>
          ${r.parqueEstaSemana < r.metaParque
            ? `<p style="font-size:14px;line-height:1.6;color:#6b7280;margin:12px 0 0;">Llevas ${r.parqueEstaSemana} de ${r.metaParque} salidas al parque esta semana.</p>`
            : `<p style="font-size:14px;line-height:1.6;color:#059669;margin:12px 0 0;">Ya cumpliste tus ${r.metaParque} salidas al parque. 🌳</p>`}

          <a href="${sitio}/tools/exercise-routine" style="display:inline-block;margin-top:28px;background:#0070f3;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px;">Registrar la de hoy →</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = [
    `Hoy toca moverte — ${fechaLarga(r.hoy)}`,
    '',
    `Racha: ${r.racha.actual} días (mejor: ${r.racha.mejor})`,
    `Nivel ${r.nivel.nivel}${r.nivel.hasta === null ? '' : ` — faltan ${r.nivel.faltan} XP`}`,
    '',
    'El mínimo son 5 minutos: sentadillas, flexiones, plancha, puente y bicho muerto.',
    comodin,
    `Parque: ${r.parqueEstaSemana} de ${r.metaParque} esta semana.`,
    '',
    `${sitio}/tools/exercise-routine`,
  ].join('\n');

  return { subject, html, text };
}

/**
 * Cron diario a las 3:30 p.m. Solo manda correo si HOY sigue sin registrarse —
 * un recordatorio que llega cuando ya entrenaste enseña a ignorarlo.
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

  const { data, error } = await supabase.from('rutina_bitacora').select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const hoy = hoyCDMX();
  const resumen = resumir((data ?? []) as Sesion[], hoy);

  const forzar = req.nextUrl.searchParams.get('forzar') === '1' && !esCron;

  if (resumen.racha.hoyHecho && !forzar) {
    return NextResponse.json({ enviado: false, motivo: 'Ya entrenaste hoy.', hoy });
  }

  const { subject, html, text } = construirCorreo(resumen);

  try {
    const id = await enviarCorreo({ to: destinatario, subject, html, text });
    return NextResponse.json({ enviado: true, id, hoy, racha: resumen.racha.actual });
  } catch (e) {
    const sinConfigurar = e instanceof EmailNoConfigurado;
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Falló el envío.' },
      { status: sinConfigurar ? 503 : 502 }
    );
  }
}
