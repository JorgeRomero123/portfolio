import { NextRequest, NextResponse } from 'next/server';
import convert from 'heic-convert';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check file type
    if (!file.name.toLowerCase().endsWith('.heic') && !file.name.toLowerCase().endsWith('.heif')) {
      return NextResponse.json({ error: 'File must be HEIC or HEIF format' }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // Convert HEIC to PNG
    const outputBuffer = await convert({
      buffer: inputBuffer,
      format: 'PNG',
      quality: 1, // Maximum quality
    });

    // Return PNG image
    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${file.name.replace(/\.(heic|heif)$/i, '.png')}"`,
      },
    });
  } catch (error) {
    console.error('HEIC conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert HEIC file' },
      { status: 500 }
    );
  }
}
