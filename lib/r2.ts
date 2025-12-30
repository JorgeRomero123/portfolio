/**
 * Cloudflare R2 Client Configuration
 *
 * R2 is S3-compatible, so we use AWS SDK with R2 endpoints
 */

import { S3Client } from '@aws-sdk/client-s3';

// Validate required environment variables
const requiredEnvVars = [
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_ENDPOINT',
  'R2_BUCKET_NAME',
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Export configuration constants
export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
export const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

/**
 * Initialize S3 client configured for Cloudflare R2
 *
 * Uses R2's S3-compatible API with custom endpoint
 */
const r2Client = new S3Client({
  region: 'auto', // R2 uses 'auto' as region
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export default r2Client;
