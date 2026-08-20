import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sesionValida } from '@/lib/quehaceres-auth';
import { hoyCDMX } from '@/lib/quehaceres';
import {
  resumir,
  xpDeSesion,
  XP,
  META_PARQUE,
  numeroOpcional,
  semanaDe,
  type Esfuerzo,
  type Modo,
  type Sesion,
  type Variante,
} from '@/lib/rutina';
import { bloquePorId } from '@/lib/rutina-ejercicios';

const noAutorizado = () => NextResponse.json({ error: 'No autorizado.' }, { status: 401 });

const MODOS: Modo[] = ['depa', 'parque'];
const ESFUERZOS: Esfuerzo[] = ['minimo', 'normal', 'energia'];

async function cargar() {
  const [bitacora, config] = await Promise.all([
    supabase.from('rutina_bitacora').select('*').order('fecha', { ascending: false }),
    supabase.from('rutina_config').select('*').eq('id', 1).maybeSingle(),
  ]);
  return { bitacora, config };
}

// GET /api/rutina → todo lo que la pantalla necesita, ya calculado.
export async function GET() {
  if (!(await sesionValida())) return noAutorizado();

  const { bitacora, config } = await cargar();
  if (bitacora.error) return NextResponse.json({ error: bitacora.error.message }, { status: 500 });

  const sesiones = (bitacora.data ?? []) as Sesion[];
  const resumen = resumir(sesiones, hoyCDMX());

  return NextResponse.json({
    ...resumen,
    variante: (config.data?.variante_flexiones ?? 'rodillas') as Variante,
    historial: sesiones.slice(0, 30),
  });
}

// POST /api/rutina → registra la sesión de hoy.
export async function POST(req: NextRequest) {
  if (!(await sesionValida())) return noAutorizado();

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const modo = body.modo as Modo;
  if (!MODOS.includes(modo)) {
    return NextResponse.json({ error: 'Modo inválido.' }, { status: 400 });
  }

  const esfuerzo = (body.esfuerzo ?? 'minimo') as Esfuerzo;
  if (!ESFUERZOS.includes(esfuerzo)) {
    return NextResponse.json({ error: 'Esfuerzo inválido.' }, { status: 400 });
  }

  const bloques = Array.isArray(body.bloques)
    ? body.bloques.filter((b): b is string => typeof b === 'string' && !!bloquePorId(b))
    : [];

  const m = numeroOpcional(body.minutos, { min: 1, max: 600 });
  if (!m.ok) {
    return NextResponse.json({ error: 'Los minutos deben ir de 1 a 600.' }, { status: 400 });
  }
  const minutos = m.valor;

  const v = numeroOpcional(body.vueltas, { min: 1, max: 100, entero: true });
  if (!v.ok) {
    return NextResponse.json({ error: 'Las vueltas deben ir de 1 a 100.' }, { status: 400 });
  }
  // Las vueltas son de la pista del parque; en el depa no significan nada.
  const vueltasReales = modo === 'parque' ? v.valor : null;

  const hoy = hoyCDMX();

  // El estado de antes decide los bonus, así que se lee antes de insertar.
  const { data: previas, error: errPrevias } = await supabase
    .from('rutina_bitacora')
    .select('*');
  if (errPrevias) return NextResponse.json({ error: errPrevias.message }, { status: 500 });

  const sesiones = (previas ?? []) as Sesion[];
  const antes = resumir(sesiones, hoy);

  let xp = xpDeSesion({
    modo,
    esfuerzo,
    bloques,
    barras: bloques.includes('barras'),
    vueltas: vueltasReales,
  });
  const bonus: string[] = [];

  // Cerrar un múltiplo de 7 días de racha. Solo cuenta si hoy no estaba hecho:
  // una segunda sesión el mismo día no vuelve a pagar el bonus.
  if (!antes.racha.hoyHecho) {
    const rachaNueva = antes.racha.actual + 1;
    if (rachaNueva > 0 && rachaNueva % 7 === 0) {
      xp += XP.racha7;
      bonus.push(`racha de ${rachaNueva} días`);
    }
  }

  // Meta semanal del parque: se paga exactamente al llegar a la meta.
  if (modo === 'parque') {
    const enSemana = sesiones.filter(
      (s) => s.modo === 'parque' && semanaDe(s.fecha) === semanaDe(hoy)
    ).length;
    if (enSemana + 1 === META_PARQUE) {
      xp += XP.metaParque;
      bonus.push(`${META_PARQUE} salidas esta semana`);
    }
  }

  const { error } = await supabase.from('rutina_bitacora').insert({
    fecha: hoy,
    modo,
    esfuerzo,
    bloques,
    minutos,
    vueltas: vueltasReales,
    xp,
    notas: typeof body.notas === 'string' && body.notas.trim() ? body.notas.trim() : null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { bitacora } = await cargar();
  const despues = resumir((bitacora.data ?? []) as Sesion[], hoy);

  return NextResponse.json({
    ...despues,
    ganado: xp,
    bonus,
    subioDeNivel: despues.nivel.nivel > antes.nivel.nivel,
  });
}

// PATCH /api/rutina → cambia la variante de flexión.
export async function PATCH(req: NextRequest) {
  if (!(await sesionValida())) return noAutorizado();

  const { variante } = (await req.json().catch(() => ({}))) as { variante?: unknown };
  const validas: Variante[] = ['pared', 'inclinadas', 'rodillas', 'completas', 'declinadas'];
  if (typeof variante !== 'string' || !validas.includes(variante as Variante)) {
    return NextResponse.json({ error: 'Variante inválida.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('rutina_config')
    .update({ variante_flexiones: variante })
    .eq('id', 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ variante });
}

// DELETE /api/rutina?id=… → borra una sesión mal registrada.
export async function DELETE(req: NextRequest) {
  if (!(await sesionValida())) return noAutorizado();

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Falta el id.' }, { status: 400 });

  const { error } = await supabase.from('rutina_bitacora').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { bitacora } = await cargar();
  return NextResponse.json(resumir((bitacora.data ?? []) as Sesion[], hoyCDMX()));
}
