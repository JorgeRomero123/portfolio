import sharp from 'sharp';

/**
 * Image Processing Configuration
 */
const CONFIG = {
  // WebP quality (0-100, lower = smaller file, 80 is good balance)
  webpQuality: 85,

  // Thumbnail dimensions
  thumbnailWidth: 400,
  thumbnailHeight: 400,

  // Maximum image dimensions (to prevent extremely large uploads)
  maxWidth: 8192,
  maxHeight: 8192,
};

export interface ProcessedImage {
  /** Optimized WebP image buffer */
  image: Buffer;
  /** Small thumbnail buffer */
  thumbnail: Buffer;
  /** Original file extension */
  originalExtension: string;
  /** Processed image metadata */
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number; // in bytes
  };
  /** Thumbnail metadata */
  thumbnailMetadata: {
    width: number;
    height: number;
    size: number;
  };
}

/**
 * Process an uploaded image: convert to WebP and generate thumbnail
 *
 * @param buffer - Original image buffer
 * @param originalFilename - Original filename (for extension detection)
 * @returns Processed image and thumbnail with metadata
 */
export async function processImage(
  buffer: Buffer,
  originalFilename: string
): Promise<ProcessedImage> {
  // Get original file extension
  const originalExtension = originalFilename.split('.').pop()?.toLowerCase() || 'jpg';

  // Load image with Sharp
  let image = sharp(buffer);

  // Get metadata
  const originalMetadata = await image.metadata();

  // Resize if image is too large
  if (
    originalMetadata.width &&
    originalMetadata.height &&
    (originalMetadata.width > CONFIG.maxWidth || originalMetadata.height > CONFIG.maxHeight)
  ) {
    image = image.resize(CONFIG.maxWidth, CONFIG.maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // Convert to WebP with optimized quality
  const optimizedBuffer = await image
    .webp({
      quality: CONFIG.webpQuality,
      effort: 4, // 0-6, higher = better compression but slower (4 is good balance)
    })
    .toBuffer({ resolveWithObject: true });

  // Generate thumbnail
  const thumbnailBuffer = await sharp(buffer)
    .resize(CONFIG.thumbnailWidth, CONFIG.thumbnailHeight, {
      fit: 'cover', // Crop to exact dimensions
      position: 'center',
    })
    .webp({ quality: 75 }) // Lower quality for thumbnails
    .toBuffer({ resolveWithObject: true });

  return {
    image: optimizedBuffer.data,
    thumbnail: thumbnailBuffer.data,
    originalExtension,
    metadata: {
      width: optimizedBuffer.info.width,
      height: optimizedBuffer.info.height,
      format: 'webp',
      size: optimizedBuffer.data.length,
    },
    thumbnailMetadata: {
      width: thumbnailBuffer.info.width,
      height: thumbnailBuffer.info.height,
      size: thumbnailBuffer.data.length,
    },
  };
}
