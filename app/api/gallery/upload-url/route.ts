import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generatePresignedUploadUrl } from '@/lib/r2-upload';

/**
 * Generate Pre-signed Upload URL for Gallery Photos
 *
 * This endpoint creates a temporary upload URL that allows the browser
 * to upload files directly to R2, bypassing Vercel's 4.5MB serverless limit.
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { filename, contentType } = body;

    // Validation
    if (!filename || !contentType) {
      return NextResponse.json(
        { error: 'Missing filename or contentType' },
        { status: 400 }
      );
    }

    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Get file extension
    const fileExtension = filename.split('.').pop()?.toLowerCase() || 'jpg';

    // Validate extension
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic'];
    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: `File type not allowed. Allowed: ${allowedExtensions.join(', ')}` },
        { status: 400 }
      );
    }

    // Generate pre-signed URL with custom path for gallery
    const { uploadUrl, key } = await generatePresignedUploadUrl(
      contentType,
      fileExtension,
      'gallery/uploads' // Different path for gallery photos
    );

    return NextResponse.json({
      uploadUrl,
      key,
    });
  } catch (error) {
    console.error('Upload URL generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
