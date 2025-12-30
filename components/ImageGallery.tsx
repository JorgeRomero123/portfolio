'use client';

import Image from 'next/image';
import { useState, useMemo } from 'react';
import type { Photo } from '@/lib/types';

interface ImageGalleryProps {
  photos: Photo[];
}

export default function ImageGallery({ photos }: ImageGalleryProps) {
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
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const handleImageLoad = (photoId: string) => {
    setLoadedImages(prev => new Set(prev).add(photoId));
  };

  const currentIndex = selectedPhoto ? photos.findIndex(p => p.id === selectedPhoto.id) : -1;

  const goToNext = () => {
    if (currentIndex < photos.length - 1) {
      setSelectedPhoto(photos[currentIndex + 1]);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setSelectedPhoto(photos[currentIndex - 1]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'Escape') setSelectedPhoto(null);
  };

  return (
    <>
      <div className="space-y-12">
        {Object.entries(photosByCategory).map(([category, categoryPhotos]) => (
          <section key={category}>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-blue-600">
              {category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryPhotos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-gray-200"
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
        ))}
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
          {currentIndex < photos.length - 1 && (
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
                {currentIndex + 1} / {photos.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
