import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import r2Client, { R2_BUCKET_NAME } from '@/lib/r2';
import { processImage } from '@/lib/image-processing';
import { getPublicUrl } from '@/lib/r2-upload';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Process Uploaded Gallery Photo
 *
 * This endpoint handles post-upload processing of gallery images:
 * 1. Downloads the original from R2
 * 2. Converts to WebP format (85% quality)
 * 3. Generates thumbnail (300px wide)
 * 4. Uploads optimized versions back to R2
 * 5. Deletes the original unprocessed file
 * 6. Updates gallery.json
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { key, title, description, category } = body;

    // Validation
    if (!key || typeof key !== 'string') {
      return NextResponse.json({ error: 'R2 key is required' }, { status: 400 });
    }

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    console.log(`Processing uploaded gallery image: ${key}`);

    // Step 1: Download original file from R2
    const getCommand = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    const response = await r2Client.send(getCommand);

    if (!response.Body) {
      throw new Error('No data returned from R2');
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    console.log(`Downloaded original: ${buffer.length} bytes`);

    // Step 2: Process image (WebP conversion + thumbnail)
    const processed = await processImage(buffer, key.split('/').pop() || 'image.jpg');

    console.log(`Image processed: ${processed.metadata.size} bytes (WebP)`);

    // Step 3: Generate keys for optimized files
    // Original key: gallery/uploads/{uuid}.{ext}
    // New keys: gallery/{uuid}.webp, gallery/{uuid}-thumb.webp
    const keyParts = key.split('/');
    const filename = keyParts[keyParts.length - 1];
    const uniqueId = filename.split('.')[0];

    const imageKey = `gallery/${uniqueId}.webp`;
    const thumbnailKey = `gallery/${uniqueId}-thumb.webp`;

    // Step 4: Upload optimized image to R2
    const imageUpload = r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: imageKey,
        Body: processed.image,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000, immutable',
      })
    );

    // Upload thumbnail to R2
    const thumbnailUpload = r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: thumbnailKey,
        Body: processed.thumbnail,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000, immutable',
      })
    );

    // Delete original unprocessed file
    const deleteOriginal = r2Client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );

    // Execute all R2 operations in parallel
    await Promise.all([imageUpload, thumbnailUpload, deleteOriginal]);

    console.log(`Uploaded optimized images and deleted original`);

    // Step 5: Update gallery.json
    const contentPath = path.join(process.cwd(), 'content', 'gallery.json');
    const fileContents = await fs.readFile(contentPath, 'utf8');
    const data = JSON.parse(fileContents);

    // Generate new photo entry
    const newPhoto = {
      id: uniqueId,
      url: getPublicUrl(imageKey),
      title: title.trim(),
      description: description?.trim() || undefined,
      category: category?.trim() || 'Uncategorized',
    };

    // Add to photos array
    data.photos.push(newPhoto);

    // Write back to file
    await fs.writeFile(contentPath, JSON.stringify(data, null, 2), 'utf8');

    console.log(`Updated gallery.json with new photo: ${newPhoto.id}`);

    // Calculate compression ratio
    const compressionRatio = ((1 - processed.metadata.size / buffer.length) * 100).toFixed(1) + '%';

    return NextResponse.json(
      {
        photo: newPhoto,
        stats: {
          originalSize: buffer.length,
          optimizedSize: processed.metadata.size,
          thumbnailSize: processed.thumbnailMetadata.size,
          compressionRatio,
        },
        message: 'Gallery photo processed and added successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Process upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process uploaded file' },
      { status: 500 }
    );
  }
}
