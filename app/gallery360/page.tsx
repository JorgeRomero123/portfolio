import { promises as fs } from 'fs';
import path from 'path';
import Link from 'next/link';
import type { Photo360Data } from '@/lib/types';

export const metadata = {
  title: '360° Photo Gallery | Jorge Romero Romanis',
  description: 'Explore immersive 360° panoramic photographs',
};

export const revalidate = 0;

async function get360Photos(): Promise<Photo360Data> {
  const filePath = path.join(process.cwd(), 'content', 'photos360.json');
  const fileContents = await fs.readFile(filePath, 'utf8');
  return JSON.parse(fileContents);
}

export default async function Gallery360Page() {
  const data = await get360Photos();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            360° Photo Gallery
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Immersive panoramic photographs. Tap on a photo to explore it in full 360°.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.photos.map((photo) => (
            <Link key={photo.id} href={`/gallery360/${photo.id}`}>
              <div className="group relative aspect-video rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer">
                {/* Thumbnail — uses a low-res proxy preview */}
                <div
                  className="w-full h-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                  style={{
                    backgroundImage: `url(/api/proxy-360?url=${encodeURIComponent(photo.url)})`,
                  }}
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                  <div>
                    <p className="text-white font-semibold text-lg">{photo.title}</p>
                    {photo.category && photo.category !== 'Uncategorized' && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-blue-600/80 text-white text-xs rounded-full">
                        {photo.category}
                      </span>
                    )}
                  </div>
                </div>

                {/* 360° badge */}
                <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs px-2.5 py-1 rounded-full font-semibold shadow-lg">
                  360°
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">How to Navigate</h2>
          <div className="grid md:grid-cols-3 gap-4 text-gray-700">
            <div>
              <p className="font-semibold mb-1">🖱️ Mouse</p>
              <p className="text-sm">Click and drag to look around</p>
            </div>
            <div>
              <p className="font-semibold mb-1">🔍 Zoom</p>
              <p className="text-sm">Scroll wheel or pinch to zoom in/out</p>
            </div>
            <div>
              <p className="font-semibold mb-1">📱 Touch</p>
              <p className="text-sm">Swipe to pan, pinch to zoom</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
