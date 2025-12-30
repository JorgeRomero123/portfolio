import { NextRequest, NextResponse } from 'next/server';
import { processImage } from '@/lib/image-processing';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // Process image (convert to WebP + generate thumbnail)
    const processed = await processImage(inputBuffer, file.name);

    // Calculate compression ratio
    const compressionRatio = ((1 - processed.metadata.size / inputBuffer.length) * 100).toFixed(1) + '%';

    // Return processed images as base64 (to avoid multiple response issue)
    return NextResponse.json({
      image: processed.image.toString('base64'),
      thumbnail: processed.thumbnail.toString('base64'),
      metadata: processed.metadata,
      thumbnailMetadata: processed.thumbnailMetadata,
      compressionRatio,
    });
  } catch (error) {
    console.error('WebP conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert image to WebP' },
      { status: 500 }
    );
  }
}
