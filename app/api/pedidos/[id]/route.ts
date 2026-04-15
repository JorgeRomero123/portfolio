import { NextRequest, NextResponse } from 'next/server';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { supabase } from '@/lib/supabase';
import r2Client, { R2_BUCKET_NAME } from '@/lib/r2';

// Extrae el R2 object key desde un archivo_url canónico almacenado.
// Ej: "cdn.jorgeromeroromanis.com/print/<uuid>.pdf" → "print/<uuid>.pdf"
// Devuelve null si la URL no pertenece a nuestro bucket (archivos externos).
function extractR2Key(archivoUrl: string): string | null {
  if (!archivoUrl) return null;
  const clean = archivoUrl.replace(/^https?:\/\//, '');
  const idx = clean.indexOf('/print/');
  if (idx === -1) return null;
  return clean.slice(idx + 1);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const update: Record<string, unknown> = {};
  if (body.status !== undefined) update.status = body.status;
  if (body.processing !== undefined) update.processing = body.processing;
  if (body.error !== undefined) update.error = body.error;
  if (body.printedAt !== undefined) update.printed_at = body.printedAt;
  if (body.printer !== undefined) update.printer = body.printer;
  if (body.tipo !== undefined) update.tipo = body.tipo;
  if (body.copias !== undefined) update.copias = body.copias;

  const { data, error } = await supabase
    .from('pedidos')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Si el pedido quedó como "done", borramos el archivo de R2 (cleanup).
  // Tolerante a fallos: si la eliminación falla, el pedido sigue marcado
  // como done y dejamos solo un log.
  if (body.status === 'done' && data?.archivo_url) {
    const key = extractR2Key(data.archivo_url as string);
    if (key) {
      try {
        await r2Client.send(
          new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key })
        );
      } catch (delErr) {
        console.error(`R2 delete failed for pedido ${id} key ${key}:`, delErr);
      }
    }
  }

  return NextResponse.json(data);
}
