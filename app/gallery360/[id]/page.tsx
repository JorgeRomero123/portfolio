import { promises as fs } from 'fs';
import path from 'path';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Photo360Data } from '@/lib/types';
import Gallery360Single from '@/components/Gallery360Single';

export const revalidate = 0;

async function get360Photos(): Promise<Photo360Data> {
  const filePath = path.join(process.cwd(), 'content', 'photos360.json');
  const fileContents = await fs.readFile(filePath, 'utf8');
  return JSON.parse(fileContents);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await get360Photos();
  const photo = data.photos.find((p) => p.id === id);

  if (!photo) {
    return { title: '360° Photo Not Found' };
  }

  return {
    title: `${photo.title} — 360° Photo | Jorge Romero Romanis`,
    description: photo.description || `Explore ${photo.title} in immersive 360°`,
  };
}

export default async function Photo360Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await get360Photos();
  const photo = data.photos.find((p) => p.id === id);

  if (!photo) {
    notFound();
  }

  // Find prev/next for navigation
  const index = data.photos.indexOf(photo);
  const prev = index > 0 ? data.photos[index - 1] : null;
  const next = index < data.photos.length - 1 ? data.photos[index + 1] : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <Link
          href="/gallery360"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 group"
        >
          <svg
            className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Gallery
        </Link>

        {/* Viewer */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="h-[400px] sm:h-[550px] lg:h-[700px]">
            <Gallery360Single photo={photo} />
          </div>

          {/* Photo info + nav */}
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {photo.title}
                </h1>
                {photo.description && (
                  <p className="text-gray-600">{photo.description}</p>
                )}
                {photo.category && photo.category !== 'Uncategorized' && (
                  <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {photo.category}
                  </span>
                )}
              </div>

              {/* Prev/Next */}
              <div className="flex gap-2 shrink-0">
                {prev ? (
                  <Link
                    href={`/gallery360/${prev.id}`}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
                    title={prev.title}
                  >
                    ← Prev
                  </Link>
                ) : (
                  <span className="px-3 py-2 bg-gray-100 text-gray-400 rounded-md text-sm">
                    ← Prev
                  </span>
                )}
                {next ? (
                  <Link
                    href={`/gallery360/${next.id}`}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
                    title={next.title}
                  >
                    Next →
                  </Link>
                ) : (
                  <span className="px-3 py-2 bg-gray-100 text-gray-400 rounded-md text-sm">
                    Next →
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
