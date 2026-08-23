import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sesionValida } from '@/lib/quehaceres-auth';
import { calcular, hoyCDMX, type Quehacer } from '@/lib/quehaceres';
import { esPersonaId } from '@/lib/personas';
import { leerUbicacion, mueble } from '@/lib/depa-mapa';

const noAutorizado = () => NextResponse.json({ error: 'No autorizado.' }, { status: 401 });

const ES_FECHA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * PATCH /api/quehaceres/[id]
 *
 * Con `{ hecho: true }` marca el quehacer como hecho hoy (o en `fecha`) y lo
 * anota en la bitácora junto con `quien` lo hizo. También acepta ediciones de
 * nombre, emoji, frecuencia, notas y ubicación (zona y punto).
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await sesionValida())) return noAutorizado();

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const update: Record<string, unknown> = {};

  if (body.hecho === true) {
    const fecha = typeof body.fecha === 'string' && ES_FECHA.test(body.fecha) ? body.fecha : hoyCDMX();
    update.ultima_vez = fecha;

    const { error: errorBitacora } = await supabase
      .from('quehaceres_bitacora')
      .insert({
        quehacer_id: id,
        hecho_el: fecha,
        // Sin persona el registro sigue contando para el depa; solo no entra
        // en el reparto de la semana.
        quien: esPersonaId(body.quien) ? body.quien : null,
      });
    if (errorBitacora) {
      return NextResponse.json({ error: errorBitacora.message }, { status: 500 });
    }
  }

  if (typeof body.nombre === 'string') {
    const nombre = body.nombre.trim();
    if (!nombre) return NextResponse.json({ error: 'El nombre no puede ir vacío.' }, { status: 400 });
    update.nombre = nombre;
  }

  if (typeof body.emoji === 'string' && body.emoji) update.emoji = body.emoji.slice(0, 8);

  if (body.frecuencia_dias !== undefined) {
    const frecuencia = Number(body.frecuencia_dias);
    if (!Number.isInteger(frecuencia) || frecuencia < 1 || frecuencia > 365) {
      return NextResponse.json(
        { error: 'La frecuencia debe ser un número entero de 1 a 365 días.' },
        { status: 400 }
      );
    }
    update.frecuencia_dias = frecuencia;
  }

  if (body.notas !== undefined) {
    update.notas = typeof body.notas === 'string' && body.notas.trim() ? body.notas.trim() : null;
  }

  const ubicacion = leerUbicacion(body);
  if (ubicacion.error) return NextResponse.json({ error: ubicacion.error }, { status: 400 });
  if (ubicacion.zona !== undefined) update.zona = ubicacion.zona;
  if (ubicacion.punto !== undefined) update.punto = ubicacion.punto;

  // Cambiar de cuarto sin decir a qué mueble deja la burbuja en el cuarto
  // anterior. Se suelta el mueble en vez de dejarlo inconsistente.
  if (ubicacion.zona !== undefined && ubicacion.punto === undefined) {
    const { data: actual } = await supabase
      .from('quehaceres')
      .select('punto')
      .eq('id', id)
      .maybeSingle();

    const previo = (actual?.punto as string | null | undefined) ?? null;
    if (previo && mueble(previo)?.zona !== ubicacion.zona) update.punto = null;
  }

  // Permite deshacer un "hecho" dejando la fecha en null.
  if (body.ultima_vez === null) update.ultima_vez = null;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No hay nada que actualizar.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('quehaceres')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'No existe ese quehacer.' }, { status: 404 });

  return NextResponse.json(calcular(data as Quehacer));
}

// DELETE /api/quehaceres/[id] → archiva (activo = false), conserva la bitácora.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await sesionValida())) return noAutorizado();

  const { id } = await params;
  const { error } = await supabase.from('quehaceres').update({ activo: false }).eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
