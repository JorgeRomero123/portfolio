'use client';

import { useState, useMemo } from 'react';
import Pannellum360Viewer from './Pannellum360Viewer';
import type { Photo360 } from '@/lib/types';

interface Gallery360ClientProps {
  photos: Photo360[];
}

export default function Gallery360Client({ photos }: Gallery360ClientProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo360>(photos[0]);

  // Convert photo URLs to use proxy if they're from R2
  const proxiedPhoto = useMemo(() => {
    if (selectedPhoto.url.includes('r2.dev')) {
      return {
        ...selectedPhoto,
        url: `/api/proxy-360?url=${encodeURIComponent(selectedPhoto.url)}`,
      };
    }
    return selectedPhoto;
  }, [selectedPhoto]);

  return (
    <div className="space-y-8">
      {/* Main 360 Viewer */}
      <div className="bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="h-[500px] sm:h-[600px] lg:h-[700px]">
          <Pannellum360Viewer photo={proxiedPhoto} className="w-full h-full" />
        </div>

        {/* Photo info */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {selectedPhoto.title}
          </h2>
          {selectedPhoto.description && (
            <p className="text-gray-600">{selectedPhoto.description}</p>
          )}
          {selectedPhoto.category && (
            <span className="inline-block mt-3 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {selectedPhoto.category}
            </span>
          )}
        </div>
      </div>

      {/* Thumbnail selector (if more than one photo) */}
      {photos.length > 1 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Browse Gallery ({photos.length} photos)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {photos.map((photo) => (
              <button
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className={`relative aspect-video rounded-lg overflow-hidden transition-all ${
                  selectedPhoto.id === photo.id
                    ? 'ring-4 ring-blue-600 shadow-lg scale-105'
                    : 'ring-2 ring-gray-300 hover:ring-blue-400 hover:shadow-md'
                }`}
              >
                {/* Thumbnail preview (using a scaled down version of the 360 image) */}
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${photo.url})` }}
                />

                {/* Overlay with title */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2">
                  <p className="text-white text-xs font-semibold truncate w-full">
                    {photo.title}
                  </p>
                </div>

                {/* 360° indicator */}
                <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                  360°
                </div>

                {/* Selected indicator */}
                {selectedPhoto.id === photo.id && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white rounded-full p-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
