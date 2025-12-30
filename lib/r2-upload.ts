/**
 * R2 Upload Utilities
 *
 * Handles pre-signed URL generation for direct browser → R2 uploads
 */

import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import r2Client, { R2_BUCKET_NAME } from './r2';

/**
 * Generate a pre-signed URL for uploading to R2
 *
 * This allows the browser to upload directly to R2 without going through
 * the serverless function, bypassing Vercel's 4.5MB body size limit.
 *
 * @param contentType - MIME type of the file (e.g., 'image/png')
 * @param fileExtension - File extension (e.g., 'png', 'jpg')
 * @returns Object with uploadUrl and key
 */
export async function generatePresignedUploadUrl(
  contentType: string,
  fileExtension: string
): Promise<{ uploadUrl: string; key: string }> {
  // Generate unique key for the file
  // Format: photos360/uploads/{uuid}.{ext}
  const uniqueId = uuidv4();
  const key = `photos360/uploads/${uniqueId}.${fileExtension}`;

  // Create PUT command for S3/R2
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  // Generate pre-signed URL (valid for 1 hour)
  const uploadUrl = await getSignedUrl(r2Client, command, {
    expiresIn: 3600, // 1 hour
  });

  return {
    uploadUrl,
    key,
  };
}

/**
 * Get public URL for an R2 object
 *
 * @param key - The R2 object key
 * @returns Public URL to access the file
 */
export function getPublicUrl(key: string): string {
  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

  if (!publicUrl) {
    throw new Error('NEXT_PUBLIC_R2_PUBLIC_URL is not configured');
  }

  return `${publicUrl}/${key}`;
}
