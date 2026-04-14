import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import r2Client, { R2_BUCKET_NAME } from '@/lib/r2';
import { getPublicUrl } from '@/lib/r2-upload';
import { supabase } from '@/lib/supabase';
import { parseMessage } from '@/lib/parse-message';
import { v4 as uuidv4 } from 'uuid';

function validateTwilioSignature(req: NextRequest, params: Record<string, string>): boolean {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token) return true; // skip validation if not configured

  const signature = req.headers.get('x-twilio-signature');
  if (!signature) return false;

  const url = process.env.TWILIO_WEBHOOK_URL || req.nextUrl.href;
  const sorted = Object.keys(params).sort();
  const data = url + sorted.map((k) => k + params[k]).join('');
  const expected = crypto.createHmac('sha1', token).update(data).digest('base64');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

async function downloadFromTwilio(mediaUrl: string): Promise<{ buffer: Buffer; contentType: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const auth = Buffer.from(`${sid}:${token}`).toString('base64');

  const res = await fetch(mediaUrl, { headers: { Authorization: `Basic ${auth}` }, redirect: 'follow' });
  if (!res.ok) throw new Error(`Twilio download failed: ${res.status}`);

  const contentType = res.headers.get('content-type') || 'application/pdf';
  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, contentType };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const params: Record<string, string> = {};
    formData.forEach((v, k) => {
      params[k] = typeof v === 'string' ? v : '';
    });

    if (!validateTwilioSignature(req, params)) {
      return NextResponse.json({ error: 'invalid signature' }, { status: 403 });
    }

    const from = params.From || '';
    const body = params.Body || '';
    const numMedia = parseInt(params.NumMedia || '0', 10);

    if (!from) {
      return new NextResponse('<Response></Response>', {
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    if (numMedia === 0) {
      return new NextResponse(
        '<Response><Message>Hola! Mandá el archivo PDF que querés imprimir con un mensaje tipo "5 copias color" o "2 bn".</Message></Response>',
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    const { copias, tipo } = parseMessage(body);
    const createdIds: string[] = [];

    for (let i = 0; i < numMedia; i++) {
      const mediaUrl = params[`MediaUrl${i}`];
      const mediaType = params[`MediaContentType${i}`] || 'application/pdf';
      if (!mediaUrl) continue;

      const { buffer } = await downloadFromTwilio(mediaUrl);

      const ext = mediaType.includes('pdf') ? 'pdf' : mediaType.split('/')[1] || 'bin';
      const key = `print/${uuidv4()}.${ext}`;

      await r2Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: mediaType,
        })
      );

      const publicUrl = getPublicUrl(key);

      const { data, error } = await supabase
        .from('pedidos')
        .insert({
          telefono: from,
          archivo_url: publicUrl,
          copias,
          tipo,
          status: 'pending',
          processing: false,
        })
        .select()
        .single();

      if (error) throw error;
      createdIds.push(data.id);
    }

    return new NextResponse(
      `<Response><Message>Recibido! ${createdIds.length} archivo(s) en cola: ${copias} copia(s) ${tipo === 'color' ? 'color' : 'blanco y negro'}.</Message></Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    );
  } catch (err) {
    console.error('whatsapp webhook error:', err);
    return new NextResponse(
      '<Response><Message>Hubo un error procesando tu archivo. Probá de nuevo.</Message></Response>',
      { headers: { 'Content-Type': 'text/xml' }, status: 200 }
    );
  }
}
