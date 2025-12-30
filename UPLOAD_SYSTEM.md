# 360° Photo Upload System

## Overview

This system handles large 360° photo uploads (>20MB) by bypassing Vercel's 4.5MB serverless function body limit using pre-signed URLs for direct browser → R2 uploads.

## Architecture

### The 3-Step Upload Flow

```
┌─────────┐     1. Request URL      ┌──────────┐
│ Browser │ ───────────────────────> │ Next.js  │
│         │                          │ API      │
│         │ <─────────────────────── │          │
│         │    Pre-signed URL        └──────────┘
│         │
│         │     2. Direct Upload     ┌──────────┐
│         │ ───────────────────────> │    R2    │
│         │                          │ Storage  │
│         │ <─────────────────────── │          │
│         │      Upload Success      └──────────┘
│         │
│         │     3. Process Image     ┌──────────┐
│         │ ───────────────────────> │ Next.js  │
└─────────┘                          │ API      │
                                     └──────────┘
                                          │
                                          ▼
                                     Download → Process → Upload
                                          │
                                          ▼
                                     Update photos360.json
```

## Components

### 1. R2 Client (`lib/r2.ts`)
- Configures AWS S3 Client for R2
- Validates environment variables
- Exports bucket configuration

### 2. Upload Utilities (`lib/r2-upload.ts`)
- `generatePresignedUploadUrl()`: Creates temporary upload URLs
- `getPublicUrl()`: Converts R2 keys to public URLs
- Handles UUID generation for unique filenames

### 3. Pre-signed URL API (`/api/photos360/upload-url`)
**What it does:**
- Authenticates the request
- Validates file type and extension
- Generates a pre-signed URL valid for 1 hour
- Returns URL + R2 key to the client

**Request:**
```json
{
  "filename": "panorama.png",
  "contentType": "image/png"
}
```

**Response:**
```json
{
  "uploadUrl": "https://...",
  "key": "photos360/uploads/{uuid}.png"
}
```

### 4. Process Upload API (`/api/photos360/process-upload`)
**What it does:**
- Downloads original from R2
- Processes with Sharp:
  - Converts to WebP (85% quality)
  - Generates 300px wide thumbnail
- Uploads optimized versions to R2
- Deletes original unprocessed file
- Updates `photos360.json`

**Request:**
```json
{
  "key": "photos360/uploads/{uuid}.png",
  "title": "Mountain Panorama",
  "description": "Beautiful view",
  "category": "Nature"
}
```

**Response:**
```json
{
  "photo": { /* Photo object */ },
  "stats": {
    "originalSize": 22840320,    // ~22MB
    "optimizedSize": 1048576,    // ~1MB
    "compressionRatio": "95.4%"
  }
}
```

### 5. Image Processing (`lib/image-processing.ts`)
- **WebP Quality**: 85% (good balance)
- **Thumbnail**: 300px wide, maintains aspect ratio
- **Max Dimensions**: 8192x8192px
- Uses Sharp library for fast processing

### 6. Upload Component (`components/admin/Photo360Upload.tsx`)
**Features:**
- Drag & drop file upload
- Real-time progress indicator
- Three-step upload flow
- Error handling with clear messages
- Success stats display

**User Flow:**
1. Select 360° image file
2. Enter title (required), description, category
3. Click "Upload and Process"
4. Progress: Request URL (10%) → Upload to R2 (60%) → Process (100%)
5. View success with compression stats

## Environment Variables

Required in `.env.local`:

```bash
# NextAuth
AUTH_SECRET=<generate with: openssl rand -base64 32>
ADMIN_USERNAME=your-username
ADMIN_PASSWORD=your-password

# R2 Configuration
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_ENDPOINT=https://xxxxx.r2.cloudflarestorage.com
R2_BUCKET_NAME=your-bucket
NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

### Getting R2 Credentials

1. Go to Cloudflare Dashboard → R2
2. Create a bucket
3. Go to "Manage R2 API Tokens"
4. Create API token with R2 permissions
5. Copy Access Key ID and Secret Access Key
6. Get endpoint from bucket details
7. Enable Public URL for your bucket

## File Structure

```
lib/
├── r2.ts                  # R2 client configuration
├── r2-upload.ts           # Pre-signed URL utilities
└── image-processing.ts    # Sharp image processing

app/api/photos360/
├── upload-url/route.ts    # Generate pre-signed URLs
└── process-upload/route.ts # Process uploaded images

components/admin/
└── Photo360Upload.tsx     # Upload UI component

content/
└── photos360.json         # Photo metadata storage
```

## Typical File Sizes

| Stage | Size | Format |
|-------|------|--------|
| Original | ~22 MB | PNG |
| Optimized | ~1 MB | WebP |
| Thumbnail | ~50 KB | WebP |
| **Savings** | **~95%** | - |

## Why This Architecture?

### Problem: Vercel Limits
- Vercel serverless functions have 4.5MB body size limit
- Large 360° photos are 20-50MB
- Can't upload through traditional API routes

### Solution: Pre-signed URLs
- Browser uploads directly to R2
- Bypasses serverless function entirely
- No size limits (R2 supports up to 5TB per object)
- Faster upload (direct to CDN)

### Processing Happens After
- Download happens server-side (no limits)
- Sharp processing is fast (<5 seconds)
- Optimized files are much smaller
- Original is deleted (saves storage)

## Production Considerations

### Already Configured
✅ Turbopack disabled in production build (Sharp compatibility)
✅ WebP quality optimized (85%)
✅ Thumbnail generation
✅ Automatic cleanup of originals
✅ CORS configured for R2

### Security
✅ Authentication required
✅ File type validation
✅ Extension whitelist
✅ Pre-signed URLs expire after 1 hour

### Performance
✅ Direct browser → R2 upload
✅ Parallel R2 operations
✅ Efficient image processing
✅ Cache headers set for 1 year

## Usage

1. **Login** to admin panel: `/admin/login`
2. **Navigate** to 360° Photos: `/admin/photos360`
3. **Upload** your 360° image:
   - Select file (PNG, JPG, HEIC)
   - Enter title and optional metadata
   - Click "Upload and Process"
4. **Wait** for processing (10-30 seconds)
5. **View** in gallery: `/gallery360`

## Troubleshooting

### Upload fails at step 1 (Request URL)
- Check authentication (logged in?)
- Verify API route is accessible
- Check browser console for errors

### Upload fails at step 2 (R2 Upload)
- Check R2 credentials in `.env.local`
- Verify bucket exists
- Check CORS configuration on R2 bucket

### Upload fails at step 3 (Processing)
- Check Sharp is installed correctly
- Verify R2 download permissions
- Check server logs for processing errors

### Image doesn't appear in gallery
- Check `photos360.json` was updated
- Verify public URL is correct
- Check CORS proxy is working

## Future Enhancements

Possible improvements:
- [ ] Bulk upload support
- [ ] Edit/delete existing photos
- [ ] Automatic EXIF data extraction
- [ ] Progress persistence (resume uploads)
- [ ] Image preview before processing
- [ ] Duplicate detection
- [ ] Category management UI
