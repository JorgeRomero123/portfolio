'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import type { Photo360 } from '@/lib/types';

interface Pannellum360ViewerProps {
  photo: Photo360;
  className?: string;
}

declare global {
  interface Window {
    pannellum: any;
  }
}

export default function Pannellum360Viewer({ photo, className = '' }: Pannellum360ViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const pannellumInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!scriptLoaded || !viewerRef.current || typeof window === 'undefined' || !window.pannellum) {
      return;
    }

    let mounted = true;

    const initViewer = () => {
      try {
        if (!mounted || !viewerRef.current) return;

        // Clean up existing viewer if any
        if (pannellumInstanceRef.current) {
          try {
            pannellumInstanceRef.current.destroy();
          } catch (e) {
            // Ignore cleanup errors
          }
        }

        // Initialize Pannellum viewer
        pannellumInstanceRef.current = window.pannellum.viewer(viewerRef.current, {
          type: 'equirectangular',
          panorama: photo.url,
          autoLoad: true,
          showControls: true,
          showFullscreenCtrl: true,
          showZoomCtrl: true,
          mouseZoom: true,
          draggable: true,
          keyboardZoom: true,
          autoRotate: -2, // Auto-rotate speed (negative = counterclockwise)
          autoRotateInactivityDelay: 3000, // Start auto-rotate after 3s of inactivity
          compass: false,
          yaw: photo.initialYaw || 0,
          pitch: photo.initialPitch || 0,
          hfov: photo.initialHfov || 100,
          minHfov: 50,
          maxHfov: 120,
        });

        // Handle load events
        pannellumInstanceRef.current.on('load', () => {
          if (mounted) setIsLoading(false);
        });

        pannellumInstanceRef.current.on('error', (err: string) => {
          if (mounted) {
            setError(err || 'Failed to load 360° image');
            setIsLoading(false);
          }
        });
      } catch (err) {
        console.error('Pannellum initialization error:', err);
        if (mounted) {
          setError('Failed to initialize 360° viewer');
          setIsLoading(false);
        }
      }
    };

    initViewer();

    return () => {
      mounted = false;
      if (pannellumInstanceRef.current) {
        try {
          pannellumInstanceRef.current.destroy();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [photo, scriptLoaded]);

  return (
    <>
      {/* Load Pannellum library */}
      <Script
        src="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js"
        strategy="lazyOnload"
        onLoad={() => setScriptLoaded(true)}
      />
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css"
      />

      <div className={`relative ${className}`}>
        {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading 360° photo...</p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <div className="text-center text-white p-6">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-lg font-semibold mb-2">Failed to load 360° photo</p>
            <p className="text-sm text-gray-400">{error}</p>
          </div>
        </div>
      )}

      {/* Pannellum viewer container */}
      <div ref={viewerRef} className="w-full h-full bg-black" />

        {/* Instructions overlay (fades out) */}
        {!isLoading && !error && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm animate-fade-in pointer-events-none">
            Click and drag to look around • Scroll to zoom
          </div>
        )}
      </div>
    </>
  );
}
