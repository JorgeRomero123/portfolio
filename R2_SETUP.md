# Cloudflare R2 Setup Guide

This guide will help you set up Cloudflare R2 for storing your portfolio images.

## Why R2?

- **10 GB free storage** per month
- **Zero egress fees** (no charges for bandwidth)
- S3-compatible API (easy to integrate)
- Perfect for hosting your photo gallery images

## Setup Steps

### 1. Create Cloudflare Account

1. Go to [cloudflare.com](https://cloudflare.com) and sign up for a free account
2. Navigate to the R2 section in your dashboard

### 2. Create an R2 Bucket

1. Click "Create bucket"
2. Choose a name for your bucket (e.g., `portfolio-images`)
3. Select a location (choose closest to your target audience)
4. Click "Create bucket"

### 3. Generate API Tokens

1. Go to R2 → Manage R2 API Tokens
2. Click "Create API token"
3. Give it a name (e.g., `portfolio-access`)
4. Set permissions to "Object Read & Write"
5. Click "Create API token"
6. **Save these credentials** (you won't see them again):
   - Access Key ID
   - Secret Access Key
   - Endpoint URL

### 4. Configure Environment Variables

Create a `.env.local` file in your project root:

```bash
# Cloudflare R2 Configuration
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_BUCKET_NAME=portfolio-images
```

**Important**: Add `.env.local` to your `.gitignore` to keep credentials secure!

### 5. Install AWS SDK (S3-Compatible)

```bash
npm install @aws-sdk/client-s3
```

### 6. Upload Images to R2

You have several options for uploading images:

#### Option A: Using Cloudflare Dashboard (Easiest)

1. Go to your R2 bucket in the Cloudflare dashboard
2. Click "Upload"
3. Drag and drop your images
4. Copy the public URL for each image

#### Option B: Using AWS CLI

1. Install AWS CLI
2. Configure with your R2 credentials:
   ```bash
   aws configure --profile r2
   # Enter your Access Key ID and Secret Access Key
   ```
3. Upload files:
   ```bash
   aws s3 cp ./my-photo.jpg s3://portfolio-images/ --endpoint-url https://your-account-id.r2.cloudflarestorage.com --profile r2
   ```

#### Option C: Create an Upload API Route (Advanced)

Create `app/api/upload/route.ts` for programmatic uploads (useful for future admin features).

### 7. Make Bucket Public (Optional)

If you want direct public access to your images:

1. Go to your bucket settings
2. Enable "Public Access"
3. Configure CORS if needed

Alternatively, use R2's "Public Bucket" domain or connect a custom domain.

### 8. Update Content Files

Once you've uploaded images, update `content/gallery.json` with your R2 URLs:

```json
{
  "photos": [
    {
      "id": "1",
      "url": "https://your-bucket-url.r2.dev/photo1.jpg",
      "title": "My Photo",
      "description": "Description here"
    }
  ]
}
```

## Image URL Formats

Your images will be accessible via:

- **R2 Public URL**: `https://your-bucket.r2.dev/image.jpg`
- **Custom Domain**: `https://cdn.yourdomain.com/image.jpg` (if configured)

## Next.js Image Optimization

The portfolio uses Next.js Image component which automatically optimizes images. To allow R2 domains:

Add to `next.config.ts`:

```typescript
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.dev',
      },
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
      },
      // Add your custom domain if you use one
      {
        protocol: 'https',
        hostname: 'cdn.yourdomain.com',
      },
    ],
  },
};
```

## Cost Considerations

### Free Tier Limits (as of 2024)
- **Storage**: 10 GB/month
- **Class A Operations** (writes): 1 million/month
- **Class B Operations** (reads): 10 million/month
- **Egress**: FREE (no bandwidth charges)

### If You Exceed Free Tier
- Storage: $0.015/GB/month
- Very affordable for a portfolio site

## Tips

1. **Optimize images before uploading**: Compress images using tools like TinyPNG or ImageOptim
2. **Use consistent naming**: e.g., `photo-001.jpg`, `photo-002.jpg`
3. **Create folders**: Organize by category (landscapes/, portraits/, etc.)
4. **Set cache headers**: Configure long cache times for better performance
5. **Use WebP format**: Modern format with better compression

## Troubleshooting

### Images not loading?
- Check CORS settings in R2 bucket
- Verify bucket is public or URLs are signed
- Check Next.js image remote patterns configuration

### Slow loading?
- Ensure images are optimized (not too large)
- Use Next.js Image component for automatic optimization
- Consider using a CDN (Cloudflare CDN works great with R2)

## Alternative: Using Placeholder Images

For testing, the portfolio currently uses Unsplash URLs. You can continue using these or replace with your R2 URLs when ready.

## Need Help?

- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [AWS S3 SDK Docs](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_s3_code_examples.html)
