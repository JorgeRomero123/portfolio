'use client';

import { useEffect, useRef, useState, type HTMLAttributes } from 'react';
import Script from 'next/script';
import type { Photo360 } from '@/lib/types';

/** A Pannellum hot spot config (see pannellum docs). Only used when the viewer initialises. */
export interface PannellumHotSpot {
  pitch: number;
  yaw: number;
  id?: string;
  type?: 'info' | 'scene';
  text?: string;
  cssClass?: string;
  createTooltipFunc?: (div: HTMLDivElement, args: unknown) => void;
  createTooltipArgs?: unknown;
  clickHandlerFunc?: (e: MouseEvent, args: unknown) => void;
  clickHandlerArgs?: unknown;
  scale?: boolean;
}

/** The subset of the Pannellum viewer API that callers of `onReady` can rely on. */
export interface PannellumViewer {
  getYaw(): number;
  getPitch(): number;
  getHfov(): number;
  lookAt(pitch?: number, yaw?: number, hfov?: number, animated?: boolean | number): PannellumViewer;
  addHotSpot(hs: PannellumHotSpot): PannellumViewer;
  removeHotSpot(id: string): boolean;
  mouseEventToCoords(e: MouseEvent): [number, number];
  getContainer(): HTMLElement;
  stopAutoRotate(): PannellumViewer;
  stopMovement(): void;
}

interface Pannellum360ViewerProps {
  photo: Photo360;
  className?: string;
  // All optional; the defaults reproduce the original /gallery360 behaviour exactly.
  /** Hot spots added when the viewer initialises (later changes are ignored; use the viewer API). */
  hotSpots?: PannellumHotSpot[];
  /** Called once the panorama has loaded, with the live Pannellum viewer instance. */
  onReady?: (viewer: PannellumViewer) => void;
  /** Called if the library or the panorama fails to load. */
  onError?: (message: string) => void;
  /** Auto-rotate speed in °/s (negative = counterclockwise), or false to disable. Default -2. */
  autoRotate?: number | false;
  /** Show the "Click and drag to look around" hint. Default true. */
  showInstructions?: boolean;
  /** Show the built-in zoom/fullscreen controls. Default true. */
  showControls?: boolean;
  /** Render the built-in (dark) loading and error overlays. Default true. */
  showStatus?: boolean;
  /** Extra attributes for the element Pannellum renders into (e.g. aria-label, data-autofocus). */
  viewerProps?: HTMLAttributes<HTMLDivElement> & Record<`data-${string}`, string | boolean | undefined>;
}

declare global {
  interface Window {
    pannellum: any;
  }
}

export default function Pannellum360Viewer({
  photo,
  className = '',
  hotSpots,
  onReady,
  onError,
  autoRotate = -2,
  showInstructions = true,
  showControls = true,
  showStatus = true,
  viewerProps,
}: Pannellum360ViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const pannellumInstanceRef = useRef<any>(null);
  // Init-time options live in refs so changing them never re-creates the viewer.
  const optsRef = useRef({ hotSpots, onReady, onError, autoRotate, showControls });
  useEffect(() => {
    optsRef.current = { hotSpots, onReady, onError, autoRotate, showControls };
  });

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

        const opts = optsRef.current;
        // Initialize Pannellum viewer
        pannellumInstanceRef.current = window.pannellum.viewer(viewerRef.current, {
          type: 'equirectangular',
          panorama: photo.url,
          autoLoad: true,
          showControls: opts.showControls,
          showFullscreenCtrl: true,
          showZoomCtrl: true,
          mouseZoom: true,
          draggable: true,
          keyboardZoom: true,
          ...(opts.autoRotate === false
            ? {}
            : {
                autoRotate: opts.autoRotate, // Auto-rotate speed (negative = counterclockwise)
                autoRotateInactivityDelay: 3000, // Start auto-rotate after 3s of inactivity
              }),
          compass: false,
          yaw: photo.initialYaw || 0,
          pitch: photo.initialPitch || 0,
          hfov: photo.initialHfov || 100,
          minHfov: 50,
          maxHfov: 120,
          ...(opts.hotSpots ? { hotSpots: opts.hotSpots } : {}),
        });

        // Handle load events
        const instance = pannellumInstanceRef.current;
        instance.on('load', () => {
          if (mounted) {
            setIsLoading(false);
            optsRef.current.onReady?.(instance);
          }
        });

        instance.on('error', (err: string) => {
          if (mounted) {
            setError(err || 'Failed to load 360° image');
            setIsLoading(false);
            optsRef.current.onError?.(err || 'Failed to load 360° image');
          }
        });
      } catch (err) {
        console.error('Pannellum initialization error:', err);
        if (mounted) {
          setError('Failed to initialize 360° viewer');
          setIsLoading(false);
          optsRef.current.onError?.('Failed to initialize 360° viewer');
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
        onReady={() => setScriptLoaded(true)}
        onError={() => optsRef.current.onError?.('Failed to load the 360° viewer')}
      />
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css"
      />

      <div className={`relative ${className}`}>
        {/* Loading indicator */}
      {showStatus && isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading 360° photo...</p>
          </div>
        </div>
      )}

      {/* Error message */}
      {showStatus && error && (
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
      <div {...viewerProps} ref={viewerRef} className="w-full h-full bg-black" />

        {/* Instructions overlay (fades out) */}
        {showInstructions && !isLoading && !error && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm animate-fade-in pointer-events-none">
            Click and drag to look around • Scroll to zoom
          </div>
        )}
      </div>
    </>
  );
}
