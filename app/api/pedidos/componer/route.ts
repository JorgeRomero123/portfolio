import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import r2Client, { R2_BUCKET_NAME } from '@/lib/r2';
import { getPublicUrl } from '@/lib/r2-upload';
import { supabase } from '@/lib/supabase';
import { composeImagesToPdf } from '@/lib/compose-images';
import { toStorageFormat, toPublicUrl } from '@/lib/archivo-url';

// POST /api/pedidos/componer
// Body: { ids: string[], copias?: number, tipo?: "color"|"bn", printer?: string, perPage?: number }
// - Descarga las imágenes de todos los pedidos
// - Compone un PDF carta con grid auto
// - Sube el PDF a R2
// - Crea un pedido compuesto (pending) con el PDF
// - Marca los pedidos originales como merged con parent_id
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
    const copias: number = Number.isInteger(body?.copias) && body.copias > 0 ? body.copias : 1;
    const tipo: 'color' | 'bn' = body?.tipo === 'bn' ? 'bn' : 'color';
    const printer: string | null = typeof body?.printer === 'string' ? body.printer : null;
    const perPage: number | undefined =
      Number.isInteger(body?.perPage) && body.perPage > 0 ? body.perPage : undefined;

    if (ids.length < 1) {
      return NextResponse.json({ error: 'Se necesita al menos 1 id' }, { status: 400 });
    }

    // 1. Traer los pedidos originales
    const { data: pedidos, error: selErr } = await supabase
      .from('pedidos')
      .select('*')
      .in('id', ids);

    if (selErr || !pedidos || pedidos.length !== ids.length) {
      return NextResponse.json(
        { error: `Pedidos no encontrados (${pedidos?.length ?? 0}/${ids.length})` },
        { status: 404 }
      );
    }

    // Preservar el orden del request
    const byId = new Map(pedidos.map((p) => [p.id, p]));
    const ordered = ids.map((id) => byId.get(id)!).filter(Boolean);

    // Validar que no haya PDFs — solo imágenes
    const firstNonImage = ordered.find((p) => {
      const url = (p.archivo_url as string) || '';
      return /\.pdf($|\?)/i.test(url);
    });
    if (firstNonImage) {
      return NextResponse.json(
        { error: `El pedido ${firstNonImage.id} no es imagen, no se puede componer` },
        { status: 400 }
      );
    }

    // 2. Descargar cada imagen desde el CDN
    const imageBuffers: Buffer[] = [];
    for (const p of ordered) {
      const url = toPublicUrl(p.archivo_url as string);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`No se pudo descargar ${p.id}: ${res.status}`);
      imageBuffers.push(Buffer.from(await res.arrayBuffer()));
    }

    // 3. Componer PDF
    const pdfBytes = await composeImagesToPdf(imageBuffers, { perPage });

    // 4. Subir a R2
    const key = `print/${uuidv4()}.pdf`;
    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: Buffer.from(pdfBytes),
        ContentType: 'application/pdf',
      })
    );

    const archivoUrl = toStorageFormat(getPublicUrl(key));

    // 5. Crear pedido compuesto
    const telefono = (ordered[0].telefono as string) || 'desconocido';
    const { data: nuevo, error: insErr } = await supabase
      .from('pedidos')
      .insert({
        telefono,
        archivo_url: archivoUrl,
        copias,
        tipo,
        printer,
        status: 'pending',
        processing: false,
      })
      .select()
      .single();

    if (insErr || !nuevo) {
      return NextResponse.json(
        { error: `Error creando pedido compuesto: ${insErr?.message}` },
        { status: 500 }
      );
    }

    // 6. Marcar los originales como merged con parent_id (solo si hay >1)
    if (ids.length > 1) {
      const { error: updErr } = await supabase
        .from('pedidos')
        .update({ status: 'merged', parent_id: nuevo.id, processing: false })
        .in('id', ids);

      if (updErr) {
        console.error('Error marcando merged:', updErr);
        // No rollbackeamos el compuesto — ya existe y es útil
      }
    } else {
      // Con 1 sola imagen, marcar como done (el PDF compuesto la reemplaza)
      await supabase
        .from('pedidos')
        .update({ status: 'done', processing: false, printed_at: new Date().toISOString() })
        .eq('id', ids[0]);
    }

    return NextResponse.json({
      ...nuevo,
      archivo_url: toPublicUrl(nuevo.archivo_url as string),
    });
  } catch (err) {
    console.error('componer error:', err);
    const message = err instanceof Error ? err.message : 'error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
