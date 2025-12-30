# R2 CORS Configuration for 360° Photos

## The Problem

Pannellum (the 360° photo viewer) runs in the browser and needs to load images from your R2 bucket. However, browsers block cross-origin requests by default for security. This causes the error:

```
The file https://pub-c6faca8f6749486e847757ed977f50fe.r2.dev/... could not be accessed.
```

## The Solution

You need to configure CORS (Cross-Origin Resource Sharing) on your R2 bucket to allow browser access.

## How to Configure CORS on Cloudflare R2

### Option 1: Via Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2** → Select your bucket
3. Go to **Settings** tab
4. Scroll down to **CORS Policy**
5. Click **Add CORS Policy** or **Edit**
6. Add the following CORS configuration:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://yourdomain.com"
    ],
    "AllowedMethods": [
      "GET",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

**Important:**
- Replace `https://yourdomain.com` with your actual portfolio domain
- Keep `http://localhost:3000` for local development
- For production, you can use `"*"` for AllowedOrigins if you want to allow all domains (public portfolio)

### Option 2: Via Wrangler CLI

If you're using Wrangler (Cloudflare's CLI tool):

1. Create a file called `cors.json`:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

2. Apply the CORS policy:

```bash
wrangler r2 bucket cors put YOUR_BUCKET_NAME --cors-config cors.json
```

## Public Access Alternative

If your 360° photos are meant to be publicly accessible (like in a portfolio), you can also enable **Public URL Access** on your R2 bucket:

1. In R2 bucket settings
2. Enable **Public URL Access**
3. This will give you a public URL like `https://pub-xxxxx.r2.dev`
4. Then apply CORS policy to allow cross-origin requests

## For Development (Temporary Workaround)

For now, during local development, you can:

1. Use a CORS proxy (not recommended for production)
2. Or host sample 360° images elsewhere temporarily (like Unsplash or a public CDN)

## Verify CORS is Working

After configuring CORS, test it by:

1. Open your browser's Developer Tools (F12)
2. Go to the Network tab
3. Refresh the 360° gallery page
4. Look for the image request
5. Check the Response Headers - you should see:
   - `Access-Control-Allow-Origin: *` (or your domain)
   - `Access-Control-Allow-Methods: GET, HEAD`

## Example: Public Portfolio CORS (Recommended)

For a public portfolio where anyone can view your 360° photos:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

This allows anyone to view your images, which is perfect for a portfolio website!

## Next Steps

1. Set up CORS on your R2 bucket using one of the methods above
2. Upload your 360° photos to R2
3. Update `content/photos360.json` with the R2 URLs
4. The 360° gallery will work perfectly!

## Resources

- [Cloudflare R2 CORS Documentation](https://developers.cloudflare.com/r2/buckets/cors/)
- [MDN CORS Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
