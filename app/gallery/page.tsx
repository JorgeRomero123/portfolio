import { getGalleryData } from '@/lib/content';
import ImageGallery from '@/components/ImageGallery';

export const metadata = {
  title: 'Photo Gallery | Jorge Romero Romanis',
  description: 'Browse my collection of photography',
};

export default async function GalleryPage() {
  const data = await getGalleryData();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Photo Gallery
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          A curated collection of my favorite photographs. Click on any image to view it in full size.
        </p>
      </div>
      <ImageGallery photos={data.photos} />
    </div>
  );
}
