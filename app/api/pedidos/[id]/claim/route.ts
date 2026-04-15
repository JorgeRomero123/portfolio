import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { toPublicUrl } from '@/lib/archivo-url';

// POST /api/pedidos/:id/claim
// Reclama atómicamente un pedido específico. Si está libre (processing=false)
// lo marca processing=true y lo devuelve. Si ya fue reclamado por otro, 409.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data, error } = await supabase
    .from('pedidos')
    .update({ processing: true })
    .eq('id', id)
    .eq('processing', false)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'pedido no disponible (ya reclamado o inexistente)' },
      { status: 409 }
    );
  }

  return NextResponse.json({
    ...data,
    archivo_url: toPublicUrl(data.archivo_url as string),
  });
}
