'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Camera Tracer
 *
 * Overlays a reference image on top of the live device camera with an
 * opacity slider, so you can trace real-world objects by hand. Built
 * camera-first for iPhone Safari:
 * - playsInline/muted/autoPlay avoids iOS's native fullscreen video takeover
 * - camera start is gated behind a tap (iOS requires a user gesture)
 * - layout uses `dvh` + safe-area insets so the collapsing Safari toolbar
 *   and the notch/home-indicator never clip the controls
 * - one-finger drag / two-finger pinch reposition the overlay, with
 *   touch-action: none so Safari's page-zoom gesture doesn't fight it
 */

type FacingMode = 'environment' | 'user';

interface Transform {
  x: number;
  y: number;
  scale: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function CameraTracer() {
  const [referenceImage, setReferenceImage] = useState<HTMLImageElement | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [cameraState, setCameraState] = useState<'idle' | 'requesting' | 'active' | 'error'>('idle');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>('environment');

  const [opacity, setOpacity] = useState(50);
  const [mirrored, setMirrored] = useState(false);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const transformRef = useRef(transform);
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const gestureRef = useRef<{
    baseX: number;
    baseY: number;
    baseScale: number;
    startMidX: number;
    startMidY: number;
    startDist: number;
  } | null>(null);

  const updateTransform = useCallback((patch: Partial<Transform>) => {
    transformRef.current = { ...transformRef.current, ...patch };
    setTransform(transformRef.current);
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async (mode: FacingMode) => {
    setCameraState('requesting');
    setCameraError(null);
    stopCamera();

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('error');
      setCameraError('This browser does not support camera access.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setFacingMode(mode);
      setCameraState('active');
    } catch (err) {
      setCameraState('error');
      const name = err instanceof Error ? err.name : '';
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setCameraError(
          "Camera access was denied. On iPhone: Settings → Safari → Camera (or Settings → your Home Screen app) → Allow, then reload this page."
        );
      } else if (name === 'NotFoundError') {
        setCameraError('No camera was found on this device.');
      } else {
        setCameraError('Could not start the camera. Try reloading the page.');
      }
    }
  }, [stopCamera]);

  const flipCamera = useCallback(() => {
    startCamera(facingMode === 'environment' ? 'user' : 'environment');
  }, [facingMode, startCamera]);

  useEffect(() => stopCamera, [stopCamera]);

  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setReferenceImage(img);
        updateTransform({ x: 0, y: 0, scale: 1 });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [updateTransform]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadImage(file);
    e.target.value = '';
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadImage(file);
  }, [loadImage]);

  /** Recompute the gesture baseline whenever the number of active touches changes, so lifting/adding a finger mid-gesture never causes a jump. */
  const recomputeGestureBase = useCallback(() => {
    const pts = Array.from(pointersRef.current.values());
    const t = transformRef.current;
    if (pts.length === 1) {
      gestureRef.current = {
        baseX: t.x,
        baseY: t.y,
        baseScale: t.scale,
        startMidX: pts[0].x,
        startMidY: pts[0].y,
        startDist: 0,
      };
    } else if (pts.length === 2) {
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      gestureRef.current = {
        baseX: t.x,
        baseY: t.y,
        baseScale: t.scale,
        startMidX: (pts[0].x + pts[1].x) / 2,
        startMidY: (pts[0].y + pts[1].y) / 2,
        startDist: dist,
      };
    } else {
      gestureRef.current = null;
    }
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    recomputeGestureBase();
  }, [recomputeGestureBase]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gestureRef.current;
    if (!g) return;

    const pts = Array.from(pointersRef.current.values());
    if (pts.length === 1) {
      updateTransform({
        x: g.baseX + (pts[0].x - g.startMidX),
        y: g.baseY + (pts[0].y - g.startMidY),
      });
    } else if (pts.length === 2) {
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const midX = (pts[0].x + pts[1].x) / 2;
      const midY = (pts[0].y + pts[1].y) / 2;
      updateTransform({
        scale: clamp(g.baseScale * (dist / g.startDist), 0.2, 6),
        x: g.baseX + (midX - g.startMidX),
        y: g.baseY + (midY - g.startMidY),
      });
    }
  }, [updateTransform]);

  const handlePointerEnd = useCallback((e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId);
    recomputeGestureBase();
  }, [recomputeGestureBase]);

  const resetPosition = () => updateTransform({ x: 0, y: 0, scale: 1 });

  const tracerReady = referenceImage !== null && cameraState === 'active';

  if (tracerReady) {
    return (
      <div
        className="fixed inset-0 bg-black overflow-hidden"
        style={{ height: '100dvh' }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: mirrored ? 'scaleX(-1)' : undefined }}
        />

        {/* Full-screen gesture surface: drag with 1 finger, pinch-zoom with 2 */}
        <div
          className="absolute inset-0 touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
        >
          <img
            src={referenceImage.src}
            alt="Reference overlay"
            draggable={false}
            className="absolute top-1/2 left-1/2 max-w-none pointer-events-none select-none"
            style={{
              width: '70vw',
              opacity: opacity / 100,
              transform: `translate(-50%, -50%) translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              WebkitTouchCallout: 'none',
              willChange: 'transform',
            }}
          />
        </div>

        {/* Controls, padded for the iPhone home-indicator / notch */}
        <div
          className="absolute inset-x-0 bottom-0 z-20 bg-black/70 backdrop-blur-sm px-4 pt-3"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="text-white text-xs w-16 flex-shrink-0">Opacity</span>
            <input
              type="range"
              min="0"
              max="100"
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-white text-xs w-9 text-right flex-shrink-0">{opacity}%</span>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <span className="text-white text-xs w-16 flex-shrink-0">Size</span>
            <input
              type="range"
              min="20"
              max="400"
              value={Math.round(transform.scale * 100)}
              onChange={(e) => updateTransform({ scale: Number(e.target.value) / 100 })}
              className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-white text-xs w-9 text-right flex-shrink-0">
              {Math.round(transform.scale * 100)}%
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              onClick={resetPosition}
              className="flex-1 px-3 py-2 rounded-lg bg-white/10 text-white text-xs font-medium active:bg-white/20"
            >
              Reset
            </button>
            <button
              onClick={flipCamera}
              className="flex-1 px-3 py-2 rounded-lg bg-white/10 text-white text-xs font-medium active:bg-white/20"
            >
              Flip camera
            </button>
            {facingMode === 'user' && (
              <button
                onClick={() => setMirrored((m) => !m)}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium active:bg-white/20 ${mirrored ? 'bg-blue-600 text-white' : 'bg-white/10 text-white'}`}
              >
                Mirror
              </button>
            )}
            <label className="flex-1 px-3 py-2 rounded-lg bg-white/10 text-white text-xs font-medium text-center active:bg-white/20 cursor-pointer">
              New image
              <input type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
            </label>
            <button
              onClick={() => {
                stopCamera();
                setCameraState('idle');
              }}
              className="flex-1 px-3 py-2 rounded-lg bg-red-600/80 text-white text-xs font-medium active:bg-red-600"
            >
              Stop
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Step 1: reference image */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">1. Upload a reference image</h2>
        <p className="text-gray-600 text-sm mb-4">This is the image you&apos;ll trace over the camera view.</p>

        <div
          className={`relative ${dragActive ? 'ring-2 ring-blue-500' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <label
            htmlFor="tracer-upload"
            className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
            }`}
          >
            {referenceImage ? (
              <img src={referenceImage.src} alt="Reference preview" className="max-h-32 rounded shadow-sm" />
            ) : (
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-gray-700">Click to upload</span> or drag and drop
              </p>
            )}
            <input
              id="tracer-upload"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileInput}
            />
          </label>
        </div>
      </div>

      {/* Step 2: camera */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">2. Enable your camera</h2>
        <p className="text-gray-600 text-sm mb-4">
          iPhone requires a tap to grant camera access — nothing happens automatically.
        </p>

        <button
          onClick={() => startCamera(facingMode)}
          disabled={cameraState === 'requesting'}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          {cameraState === 'requesting' ? 'Requesting access…' : 'Start camera'}
        </button>

        {cameraState === 'error' && cameraError && (
          <p className="mt-3 text-sm text-red-600">{cameraError}</p>
        )}
        {cameraState === 'active' && !referenceImage && (
          <p className="mt-3 text-sm text-green-600">Camera is ready — upload a reference image above to start tracing.</p>
        )}
      </div>

      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-600">
        <p className="font-semibold text-gray-700 mb-1">100% local processing</p>
        <p>The camera stream and your image never leave your device — everything happens directly in the browser.</p>
      </div>
    </div>
  );
}
