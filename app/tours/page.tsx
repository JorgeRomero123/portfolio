'use client';

import { useEffect, useState } from 'react';
import TourEmbed from '@/components/TourEmbed';
import type { Tour } from '@/lib/types';

export default function ToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);

  useEffect(() => {
    fetch('/api/tours')
      .then((res) => res.json())
      .then((data) => setTours(data.tours))
      .catch(() => setTours([]));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          360° Tours
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Experience immersive virtual tours. Click on a tour to explore it in full screen.
        </p>
      </div>

      {selectedTour ? (
        <div className="mb-8">
          <button
            onClick={() => setSelectedTour(null)}
            className="mb-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Back to Tours
          </button>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedTour.title}</h2>
          {selectedTour.description && (
            <p className="text-gray-600 mb-6">{selectedTour.description}</p>
          )}
          <TourEmbed src={selectedTour.iframeUrl} title={selectedTour.title} />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tours.map((tour) => (
            <div
              key={tour.id}
              className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
              onClick={() => setSelectedTour(tour)}
            >
              {tour.thumbnailUrl ? (
                <div className="aspect-video bg-gray-200 relative">
                  <img
                    src={tour.thumbnailUrl}
                    alt={tour.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-6xl">🌐</span>
                </div>
              )}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {tour.title}
                </h3>
                {tour.description && (
                  <p className="text-gray-600">{tour.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
