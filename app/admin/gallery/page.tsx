import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import PhotoUpload from '@/components/admin/PhotoUpload';
import { promises as fs } from 'fs';
import path from 'path';

export const metadata = {
  title: 'Gallery Management | Admin',
  description: 'Upload and manage gallery photos',
};

// Revalidate every time to show new uploads immediately
export const revalidate = 0;

interface GalleryPhoto {
  id: string;
  url: string;
  title: string;
  description?: string;
  category: string;
}

interface GalleryData {
  photos: GalleryPhoto[];
}

async function getGalleryPhotos(): Promise<GalleryData> {
  const filePath = path.join(process.cwd(), 'content', 'gallery.json');
  const fileContents = await fs.readFile(filePath, 'utf8');
  return JSON.parse(fileContents);
}

export default async function GalleryAdminPage() {
  const session = await auth();

  if (!session) {
    redirect('/admin/login');
  }

  const data = await getGalleryPhotos();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Gallery Management</h1>
          <p className="text-gray-600">Upload, process, and manage your gallery photos</p>
        </div>

        {/* Upload Component */}
        <PhotoUpload />

        {/* Current Gallery Photos */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Current Gallery Photos ({data.photos.length})
          </h2>
          {data.photos.length === 0 ? (
            <p className="text-gray-600 text-sm">No photos uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.photos.map((photo) => (
                <div key={photo.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div
                    className="h-48 bg-cover bg-center"
                    style={{ backgroundImage: `url(${photo.url})` }}
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 truncate">{photo.title}</h3>
                    {photo.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{photo.description}</p>
                    )}
                    {photo.category && (
                      <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {photo.category}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
