import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { toPublicUrl } from '@/lib/archivo-url';

type Row = { archivo_url: string } & Record<string, unknown>;
const hydrate = (rows: Row[]) =>
  rows.map((r) => ({ ...r, archivo_url: toPublicUrl(r.archivo_url) }));

// GET /api/pedidos                       → todos, ordenados por creación
// GET /api/pedidos?status=pending         → filtra por status (SIN reclamar)
// GET /api/pedidos?status=pending&claim=1 → filtra y reclama atómicamente (processing=true)
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status');
  const claim = req.nextUrl.searchParams.get('claim') === '1';

  if (!claim) {
    let query = supabase
      .from('pedidos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(hydrate((data ?? []) as Row[]));
  }

  // Reclamo atómico: busca candidatos y los marca processing=true uno por uno
  const { data: candidatos, error: err1 } = await supabase
    .from('pedidos')
    .select('*')
    .eq('status', status ?? 'pending')
    .eq('processing', false)
    .order('created_at', { ascending: true })
    .limit(10);

  if (err1) return NextResponse.json({ error: err1.message }, { status: 500 });

  const reclamados: Row[] = [];
  for (const p of candidatos ?? []) {
    const { data: claimed, error: err2 } = await supabase
      .from('pedidos')
      .update({ processing: true })
      .eq('id', p.id)
      .eq('processing', false)
      .select()
      .single();
    if (!err2 && claimed) reclamados.push(claimed as Row);
  }

  return NextResponse.json(hydrate(reclamados));
}
