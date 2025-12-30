import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generatePresignedUploadUrl } from '@/lib/r2-upload';

/**
 * Generate Pre-signed Upload URL for 360° Photos
 *
 * This endpoint creates a temporary URL that allows the browser to upload
 * files directly to R2, bypassing Vercel's 4.5MB serverless function limit.
 *
 * Flow:
 * 1. Client requests pre-signed URL with file metadata
 * 2. Server generates URL valid for 1 hour
 * 3. Client uploads file directly to R2 using the URL
 * 4. Client then calls /process-upload to convert and optimize
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
    if (!filename || typeof filename !== 'string') {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    if (!contentType || typeof contentType !== 'string') {
      return NextResponse.json({ error: 'Content type is required' }, { status: 400 });
    }

    // Validate it's an image
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Extract file extension
    const fileExtension = filename.split('.').pop()?.toLowerCase() || 'jpg';

    // Validate extension
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];
    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: `Invalid file extension. Allowed: ${allowedExtensions.join(', ')}` },
        { status: 400 }
      );
    }

    // Generate pre-signed upload URL
    const { uploadUrl, key } = await generatePresignedUploadUrl(contentType, fileExtension);

    console.log(`Generated pre-signed URL for: ${filename} → ${key}`);

    return NextResponse.json({
      uploadUrl,
      key,
      message: 'Pre-signed URL generated successfully',
    });
  } catch (error) {
    console.error('Upload URL generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
