'use client';

import Image from 'next/image';
import { useState, useMemo } from 'react';
import type { Photo } from '@/lib/types';

interface ImageGalleryProps {
  photos: Photo[];
}

export default function ImageGallery({ photos }: ImageGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  // Group photos by category
  const photosByCategory = useMemo(() => {
    const grouped: { [key: string]: Photo[] } = {};
    photos.forEach(photo => {
      const category = photo.category || 'Uncategorized';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(photo);
    });
    return grouped;
  }, [photos]);

  // Get all categories
  const categories = useMemo(() => {
    return ['All', ...Object.keys(photosByCategory).sort()];
  }, [photosByCategory]);

  // Filter photos based on selected category
  const filteredPhotos = useMemo(() => {
    if (selectedCategory === 'All') {
      return photos;
    }
    return photosByCategory[selectedCategory] || [];
  }, [selectedCategory, photos, photosByCategory]);

  const handleImageLoad = (photoId: string) => {
    setLoadedImages(prev => new Set(prev).add(photoId));
  };

  const currentIndex = selectedPhoto ? filteredPhotos.findIndex(p => p.id === selectedPhoto.id) : -1;

  const goToNext = () => {
    if (currentIndex < filteredPhotos.length - 1) {
      setSelectedPhoto(filteredPhotos[currentIndex + 1]);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setSelectedPhoto(filteredPhotos[currentIndex - 1]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'Escape') setSelectedPhoto(null);
  };

  return (
    <>
      {/* Category Filter Navigation */}
      <div className="mb-8 sticky top-0 z-10 bg-gray-50 py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {category}
              {category !== 'All' && (
                <span className="ml-2 text-xs opacity-75">
                  ({photosByCategory[category]?.length || 0})
                </span>
              )}
              {category === 'All' && (
                <span className="ml-2 text-xs opacity-75">
                  ({photos.length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Photo Grid */}
      <div className="space-y-12">
        {selectedCategory === 'All' ? (
          Object.entries(photosByCategory).map(([category, categoryPhotos]) => (
            <section key={category}>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-blue-600">
                {category}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryPhotos.map((photo, index) => (
                <div
                  key={photo.id}
                  className={`group relative cursor-pointer overflow-hidden rounded-lg bg-gray-200 ${
                    photo.isPortrait ? 'aspect-[3/4]' : 'aspect-square'
                  }`}
                  onClick={() => setSelectedPhoto(photo)}
                >
                  {!loadedImages.has(photo.id) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                      <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                  )}
                  <Image
                    src={photo.url}
                    alt={photo.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    unoptimized
                    loading={index < 4 ? 'eager' : 'lazy'}
                    onLoad={() => handleImageLoad(photo.id)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end pointer-events-none">
                    <div className="p-4 text-white w-full">
                      <h3 className="font-semibold">{photo.title}</h3>
                      {photo.description && (
                        <p className="text-sm mt-1">{photo.description}</p>
                      )}
                    </div>
                  </div>
                </div>
                ))}
              </div>
            </section>
          ))
        ) : (
          <section>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-blue-600">
              {selectedCategory}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPhotos.map((photo, index) => (
                <div
                  key={photo.id}
                  className={`group relative cursor-pointer overflow-hidden rounded-lg bg-gray-200 ${
                    photo.isPortrait ? 'aspect-[3/4]' : 'aspect-square'
                  }`}
                  onClick={() => setSelectedPhoto(photo)}
                >
                  {!loadedImages.has(photo.id) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                      <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                  )}
                  <Image
                    src={photo.url}
                    alt={photo.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    unoptimized
                    loading={index < 4 ? 'eager' : 'lazy'}
                    onLoad={() => handleImageLoad(photo.id)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end pointer-events-none">
                    <div className="p-4 text-white w-full">
                      <h3 className="font-semibold">{photo.title}</h3>
                      {photo.description && (
                        <p className="text-sm mt-1">{photo.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 text-white text-4xl font-bold hover:text-gray-300 z-10"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPhoto(null);
            }}
          >
            ×
          </button>

          {/* Previous button */}
          {currentIndex > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-5xl font-bold hover:text-gray-300 bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center z-10"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
            >
              ‹
            </button>
          )}

          {/* Next button */}
          {currentIndex < filteredPhotos.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-5xl font-bold hover:text-gray-300 bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center z-10"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
            >
              ›
            </button>
          )}

          {/* Image container */}
          <div className="relative max-w-7xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <Image
              src={selectedPhoto.url}
              alt={selectedPhoto.title}
              width={1920}
              height={1080}
              className="max-w-full max-h-[90vh] w-auto h-auto object-contain"
              unoptimized
            />
            <div className="mt-4 text-white text-center">
              <h3 className="text-xl font-semibold">{selectedPhoto.title}</h3>
              {selectedPhoto.description && (
                <p className="mt-2 text-gray-300">{selectedPhoto.description}</p>
              )}
              <p className="mt-2 text-sm text-gray-400">
                {currentIndex + 1} / {filteredPhotos.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
