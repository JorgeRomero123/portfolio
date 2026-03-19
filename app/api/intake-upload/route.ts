import { NextRequest, NextResponse } from 'next/server';
import { generatePresignedUploadUrl, getPublicUrl } from '@/lib/r2-upload';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename, contentType } = body;

    if (!filename || typeof filename !== 'string') {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    if (!contentType || typeof contentType !== 'string') {
      return NextResponse.json({ error: 'Content type is required' }, { status: 400 });
    }

    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    const fileExtension = filename.split('.').pop()?.toLowerCase() || 'jpg';
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'svg'];
    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: `Invalid file extension. Allowed: ${allowedExtensions.join(', ')}` },
        { status: 400 }
      );
    }

    const { uploadUrl, key } = await generatePresignedUploadUrl(
      contentType,
      fileExtension,
      'client-intake/uploads'
    );

    const publicUrl = getPublicUrl(key);

    return NextResponse.json({ uploadUrl, key, publicUrl });
  } catch (error) {
    console.error('Intake upload URL generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
