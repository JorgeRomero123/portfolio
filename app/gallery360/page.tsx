import { promises as fs } from 'fs';
import path from 'path';
import Gallery360Client from '@/components/Gallery360Client';
import type { Photo360Data } from '@/lib/types';

export const metadata = {
  title: '360° Photo Gallery | Jorge Romero Romanis',
  description: 'Explore immersive 360° panoramic photographs',
};

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
            Immersive panoramic photographs. Click and drag to look around, scroll to zoom.
          </p>
        </div>

        <Gallery360Client photos={data.photos} />

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
          <p className="text-sm text-gray-600 mt-4">
            💡 Tip: The photo will auto-rotate after a few seconds of inactivity. Click the fullscreen button for an immersive experience!
          </p>
        </div>
      </div>
    </div>
  );
}
