# Jorge Romero Romanis - Portfolio

A modern, creative portfolio website built with Next.js 15, showcasing photography, 360° virtual tours, videos, and interactive web tools.

## Features

- **Photo Gallery**: Responsive image grid with lightbox viewing
- **Video Showcase**: Embedded YouTube videos
- **360° Tours**: Immersive virtual tour experiences from recorrido360.mx
- **Interactive Tools**: Fun web applications (Wheel of Fortune, and more to come!)
- **About Page**: Markdown-based bio and information
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **File-based Content**: Easy content management via JSON and Markdown files

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Markdown Rendering**: react-markdown
- **Image Storage**: Cloudflare R2 (optional)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd portfolio
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) to view the site

## Content Management

All content is managed through files in the `/content` directory:

### Gallery (`content/gallery.json`)

Add or edit photos:
```json
{
  "photos": [
    {
      "id": "1",
      "url": "https://your-image-url.com/photo.jpg",
      "title": "Photo Title",
      "description": "Optional description",
      "category": "landscape"
    }
  ]
}
```

### Videos (`content/videos.json`)

Add YouTube videos:
```json
{
  "videos": [
    {
      "id": "1",
      "youtubeId": "your-video-id",
      "title": "Video Title",
      "description": "Video description"
    }
  ]
}
```

### 360° Tours (`content/tours.json`)

Add virtual tours:
```json
{
  "tours": [
    {
      "id": "1",
      "slug": "tour-name",
      "title": "Tour Title",
      "description": "Tour description",
      "iframeUrl": "https://recorrido360.mx/tours/your-tour",
      "thumbnailUrl": "https://your-thumbnail-url.com/thumb.jpg"
    }
  ]
}
```

### About Page (`content/about.md`)

Edit the Markdown file to update your bio:
```markdown
# About Me

Your content here...
```

## Image Storage with Cloudflare R2

For optimal performance and cost-effectiveness, this portfolio supports Cloudflare R2 for image storage:

- **10 GB free storage** per month
- **Zero egress fees**
- S3-compatible API

See [R2_SETUP.md](./R2_SETUP.md) for detailed setup instructions.

## Project Structure

```
portfolio/
├── app/                    # Next.js app router pages
│   ├── about/             # About page
│   ├── gallery/           # Photo gallery
│   ├── videos/            # Video showcase
│   ├── tours/             # 360° tours
│   └── tools/             # Interactive tools
├── components/            # React components
│   ├── Navigation.tsx     # Site navigation
│   ├── ImageGallery.tsx   # Photo gallery component
│   ├── VideoEmbed.tsx     # YouTube embed
│   ├── TourEmbed.tsx      # 360° tour iframe
│   └── tools/             # Tool components
├── content/               # Content files (JSON/Markdown)
├── lib/                   # Utility functions
└── public/                # Static assets
```

## Adding New Tools

To add a new interactive tool:

1. Create a new folder: `app/tools/your-tool-name/`
2. Create `page.tsx` in that folder
3. Create your tool component in `components/tools/`
4. Add it to the tools list in `app/tools/page.tsx`

## Customization

### Colors & Theme

Edit `tailwind.config.ts` to customize the color scheme.

### Navigation

Modify `components/Navigation.tsx` to add or remove navigation links.

### Metadata

Update `app/layout.tsx` for site-wide SEO metadata.

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Configure environment variables (if using R2)
4. Deploy!

The site will automatically deploy on every push to your main branch.

### Environment Variables

If using Cloudflare R2, add these to your deployment:

```
R2_ACCESS_KEY_ID=your_key
R2_SECRET_ACCESS_KEY=your_secret
R2_ENDPOINT=your_endpoint
R2_BUCKET_NAME=your_bucket
```

## Building for Production

```bash
npm run build
npm run start
```

## License

This project is open source and available for personal use.

## Contact

Jorge Romero Romanis
- Portfolio: [Your URL here]
- recorrido360.mx

---

Built with Next.js, Tailwind CSS, and ❤️
