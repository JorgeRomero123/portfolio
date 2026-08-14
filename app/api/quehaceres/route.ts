import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sesionValida } from '@/lib/quehaceres-auth';
import { calcular, hoyCDMX, ordenarPorUrgencia, type Quehacer } from '@/lib/quehaceres';

const noAutorizado = () => NextResponse.json({ error: 'No autorizado.' }, { status: 401 });

// GET /api/quehaceres → lista activa, ya calculada y ordenada por urgencia.
export async function GET() {
  if (!(await sesionValida())) return noAutorizado();

  const { data, error } = await supabase
    .from('quehaceres')
    .select('*')
    .eq('activo', true)
    .order('orden', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const hoy = hoyCDMX();
  const quehaceres = ordenarPorUrgencia((data as Quehacer[]).map((q) => calcular(q, hoy)));

  return NextResponse.json({ hoy, quehaceres });
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
      orden: ((ultimo?.orden as number | undefined) ?? 0) + 1,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(calcular(data as Quehacer), { status: 201 });
}
