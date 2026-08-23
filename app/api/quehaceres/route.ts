import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sesionValida } from '@/lib/quehaceres-auth';
import { calcular, hoyCDMX, ordenarPorUrgencia, type Quehacer } from '@/lib/quehaceres';
import { resumenDelJuego, xpDeQuehacer, type Registro } from '@/lib/quehaceres-juego';
import { ZONA_POR_DEFECTO, leerUbicacion } from '@/lib/depa-mapa';

const noAutorizado = () => NextResponse.json({ error: 'No autorizado.' }, { status: 401 });

/**
 * GET /api/quehaceres → la lista calculada y ordenada por urgencia, más el
 * estado del juego (XP y nivel del depa, reparto de la semana).
 *
 * El XP se deriva de la bitácora completa en cada lectura; no hay contador
 * guardado que se pueda desincronizar.
 */
export async function GET() {
  if (!(await sesionValida())) return noAutorizado();

  const [activos, todos, bitacora] = await Promise.all([
    supabase.from('quehaceres').select('*').eq('activo', true).order('orden', { ascending: true }),
    supabase.from('quehaceres').select('id, frecuencia_dias'),
    supabase.from('quehaceres_bitacora').select('quehacer_id, hecho_el, quien'),
  ]);

  const fallo = activos.error ?? todos.error ?? bitacora.error;
  if (fallo) return NextResponse.json({ error: fallo.message }, { status: 500 });

  const hoy = hoyCDMX();
  const quehaceres = ordenarPorUrgencia((activos.data as Quehacer[]).map((q) => calcular(q, hoy)));

  // Incluye los archivados: lo que ya hiciste sigue contando aunque hayas
  // quitado el quehacer de la lista.
  const xpPorQuehacer = new Map(
    (todos.data as { id: string; frecuencia_dias: number }[]).map((q) => [
      q.id,
      xpDeQuehacer(q.frecuencia_dias),
    ])
  );

  const juego = resumenDelJuego(bitacora.data as Registro[], xpPorQuehacer, hoy);

  return NextResponse.json({ hoy, quehaceres, juego });
}

// POST /api/quehaceres → crea un quehacer nuevo.
export async function POST(req: NextRequest) {
  if (!(await sesionValida())) return noAutorizado();

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
  const frecuencia = Number(body.frecuencia_dias);

  if (!nombre) {
    return NextResponse.json({ error: 'Ponle nombre al quehacer.' }, { status: 400 });
  }
  if (!Number.isInteger(frecuencia) || frecuencia < 1 || frecuencia > 365) {
    return NextResponse.json(
      { error: 'La frecuencia debe ser un número entero de 1 a 365 días.' },
      { status: 400 }
    );
  }

  const ubicacion = leerUbicacion(body);
  if (ubicacion.error) return NextResponse.json({ error: ubicacion.error }, { status: 400 });

  // Va al final de la lista.
  const { data: ultimo } = await supabase
    .from('quehaceres')
    .select('orden')
    .order('orden', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from('quehaceres')
    .insert({
      nombre,
      emoji: typeof body.emoji === 'string' && body.emoji ? body.emoji.slice(0, 8) : '🧽',
      frecuencia_dias: frecuencia,
      notas: typeof body.notas === 'string' && body.notas.trim() ? body.notas.trim() : null,
      zona: ubicacion.zona ?? ZONA_POR_DEFECTO,
      punto: ubicacion.punto ?? null,
      orden: ((ultimo?.orden as number | undefined) ?? 0) + 1,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(calcular(data as Quehacer), { status: 201 });
}
