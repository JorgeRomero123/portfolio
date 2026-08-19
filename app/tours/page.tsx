'use client';

import { useEffect, useState } from 'react';
import TourEmbed from '@/components/TourEmbed';
import type { Tour } from '@/lib/types';

type LoadState = 'loading' | 'ready' | 'error';

export default function ToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [state, setState] = useState<LoadState>('loading');

  useEffect(() => {
    let active = true;
    fetch('/api/tours')
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        setTours(Array.isArray(data.tours) ? data.tours : []);
        setState('ready');
      })
      .catch(() => {
        if (!active) return;
        setTours([]);
        setState('error');
      });
    return () => {
      active = false;
    };
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
      ) : state === 'loading' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8" aria-busy="true" aria-label="Loading tours">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="aspect-video bg-gray-200 animate-pulse" />
              <div className="p-6">
                <div className="h-5 w-2/3 rounded bg-gray-200 animate-pulse" />
                <div className="mt-3 h-4 w-full rounded bg-gray-100 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : state === 'error' ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-900 font-semibold mb-1">We couldn&rsquo;t load the tours.</p>
          <p className="text-gray-600">
            Something went wrong on our side. Please refresh the page to try again.
          </p>
        </div>
      ) : tours.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-900 font-semibold mb-1">No tours published yet.</p>
          <p className="text-gray-600">Check back soon — new virtual tours are on the way.</p>
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
                <div className="aspect-video bg-gray-100 border-b border-gray-200 flex items-center justify-center p-6">
                  <span className="text-lg font-semibold text-gray-700 text-center text-balance">
                    {tour.title}
                  </span>
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
