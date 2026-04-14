import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/pedidos              → lista completa (dashboard)
// GET /api/pedidos?status=pending → reclamo atómico para cliente local
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status');

  if (!status) {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Reclamo atómico: busca candidatos y los marca processing=true uno por uno
  const { data: candidatos, error: err1 } = await supabase
    .from('pedidos')
    .select('*')
    .eq('status', status)
    .eq('processing', false)
    .order('created_at', { ascending: true })
    .limit(10);

  if (err1) return NextResponse.json({ error: err1.message }, { status: 500 });

  const reclamados = [];
  for (const p of candidatos ?? []) {
    const { data: claimed, error: err2 } = await supabase
      .from('pedidos')
      .update({ processing: true })
      .eq('id', p.id)
      .eq('processing', false)
      .select()
      .single();
    if (!err2 && claimed) reclamados.push(claimed);
  }

  return NextResponse.json(reclamados);
}
