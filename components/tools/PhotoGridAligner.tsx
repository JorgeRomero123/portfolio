'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  type Transform,
  type GridSettings,
  type CropRect,
  type HandleName,
  DEFAULT_TRANSFORM,
  DEFAULT_GRID,
  detectSkewAngle,
  computeInscribedCrop,
  drawCheckerboard,
  drawGrid,
  drawTransformedImage,
  drawCropOverlay,
  hitTestHandle,
  isInsideCrop,
  renderForExport,
} from '@/lib/photo-grid-aligner';

type CropAction =
  | { type: 'resize'; handle: HandleName; originCrop: CropRect }
  | { type: 'move'; startX: number; startY: number; originCrop: CropRect }
  | { type: 'draw'; startX: number; startY: number };

export default function PhotoGridAligner() {
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [transform, setTransform] = useState<Transform>(DEFAULT_TRANSFORM);
  const [grid, setGrid] = useState<GridSettings>(DEFAULT_GRID);

  const [isAutoAligning, setIsAutoAligning] = useState(false);
  const [autoAlignResult, setAutoAlignResult] = useState<string | null>(null);

  const [crop, setCrop] = useState<CropRect | null>(null);
  const [cropMode, setCropMode] = useState(false);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isPanningRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const cropActionRef = useRef<CropAction | null>(null);

  const [canvasDisplaySize, setCanvasDisplaySize] = useState({ width: 800, height: 600 });

  // Compute display size when image loads or container resizes
  useEffect(() => {
    if (!originalImage || !containerRef.current) return;
    const maxW = containerRef.current.clientWidth;
    const maxH = 600;
    const imgAspect = originalImage.width / originalImage.height;
    let w = maxW;
    let h = w / imgAspect;
    if (h > maxH) {
      h = maxH;
      w = h * imgAspect;
    }
    setCanvasDisplaySize({ width: Math.round(w), height: Math.round(h) });
  }, [originalImage]);

  // ---------- Image loading ----------
  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        setFileName(file.name.replace(/\.[^/.]+$/, ''));
        setTransform(DEFAULT_TRANSFORM);
        setAutoAlignResult(null);
        setCrop(null);
        setCropMode(false);
        setIsProcessing(false);
      };
      img.onerror = () => setIsProcessing(false);
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

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

  // ---------- Canvas rendering ----------
  useEffect(() => {
    if (!originalImage || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width: cw, height: ch } = canvasDisplaySize;
    canvas.width = cw;
    canvas.height = ch;

    ctx.clearRect(0, 0, cw, ch);
    drawCheckerboard(ctx, cw, ch);
    drawTransformedImage(ctx, originalImage, cw, ch, transform);
    drawGrid(ctx, cw, ch, grid);

    if (crop) {
      drawCropOverlay(ctx, cw, ch, crop);
    }
  }, [originalImage, transform, grid, canvasDisplaySize, crop]);

  // ---------- Canvas pointer helpers ----------
  const getCanvasCoords = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  // ---------- Pointer events ----------
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);

    if (cropMode) {
      const { x, y } = getCanvasCoords(e);

      if (crop) {
        const handle = hitTestHandle(crop, x, y);
        if (handle) {
          cropActionRef.current = { type: 'resize', handle, originCrop: { ...crop } };
          return;
        }
        if (isInsideCrop(crop, x, y)) {
          cropActionRef.current = { type: 'move', startX: x, startY: y, originCrop: { ...crop } };
          return;
        }
      }
      // Draw new crop
      cropActionRef.current = { type: 'draw', startX: x, startY: y };
      setCrop({ x, y, width: 0, height: 0 });
      return;
    }

    // Pan mode
    isPanningRef.current = true;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
  }, [cropMode, crop, getCanvasCoords]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (cropMode && cropActionRef.current) {
      const { x, y } = getCanvasCoords(e);
      const { width: cw, height: ch } = canvasDisplaySize;
      const action = cropActionRef.current;

      if (action.type === 'draw') {
        const nx = Math.max(0, Math.min(x, cw));
        const ny = Math.max(0, Math.min(y, ch));
        setCrop({
          x: Math.min(action.startX, nx),
          y: Math.min(action.startY, ny),
          width: Math.abs(nx - action.startX),
          height: Math.abs(ny - action.startY),
        });
        return;
      }

      if (action.type === 'move') {
        const dx = x - action.startX;
        const dy = y - action.startY;
        const oc = action.originCrop;
        const nx = Math.max(0, Math.min(oc.x + dx, cw - oc.width));
        const ny = Math.max(0, Math.min(oc.y + dy, ch - oc.height));
        setCrop({ x: nx, y: ny, width: oc.width, height: oc.height });
        return;
      }

      if (action.type === 'resize') {
        const oc = action.originCrop;
        let { x: cx, y: cy, width: cWidth, height: cHeight } = oc;
        const handle = action.handle;

        // Adjust edges based on which handle is dragged
        if (handle.includes('Left')) {
          const newX = Math.max(0, Math.min(x, cx + cWidth - 1));
          cWidth = cx + cWidth - newX;
          cx = newX;
        }
        if (handle.includes('Right') || handle === 'rightMid') {
          cWidth = Math.max(1, Math.min(x - cx, cw - cx));
        }
        if (handle.includes('top') || handle === 'topMid') {
          const newY = Math.max(0, Math.min(y, cy + cHeight - 1));
          cHeight = cy + cHeight - newY;
          cy = newY;
        }
        if (handle.includes('bottom') || handle === 'bottomMid') {
          cHeight = Math.max(1, Math.min(y - cy, ch - cy));
        }

        // Edge midpoints only move one axis
        if (handle === 'leftMid' || handle === 'rightMid') {
          cy = oc.y;
          cHeight = oc.height;
        }
        if (handle === 'topMid' || handle === 'bottomMid') {
          cx = oc.x;
          cWidth = oc.width;
        }

        setCrop({ x: cx, y: cy, width: cWidth, height: cHeight });
        return;
      }
      return;
    }

    if (!isPanningRef.current) return;
    const dx = e.clientX - lastPointerRef.current.x;
    const dy = e.clientY - lastPointerRef.current.y;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    setTransform((t) => ({ ...t, translateX: t.translateX + dx, translateY: t.translateY + dy }));
  }, [cropMode, getCanvasCoords, canvasDisplaySize]);

  const handlePointerUp = useCallback(() => {
    isPanningRef.current = false;
    cropActionRef.current = null;
  }, []);

  // ---------- Scroll to zoom ----------
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setTransform((t) => ({ ...t, scale: Math.min(5, Math.max(0.1, t.scale + delta)) }));
  }, []);

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !originalImage) return;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel, originalImage]);

  // ---------- Auto-align ----------
  const autoAlign = useCallback(() => {
    if (!originalImage) return;
    setIsAutoAligning(true);
    setAutoAlignResult(null);

    setTimeout(() => {
      try {
        const angle = detectSkewAngle(originalImage);
        if (angle === null) {
          setAutoAlignResult('No dominant alignment detected');
        } else {
          setTransform((t) => ({ ...t, rotation: t.rotation - angle }));
          setAutoAlignResult(`Corrected ${Math.abs(angle).toFixed(1)}° skew`);
        }
      } catch {
        setAutoAlignResult('Auto-align failed');
      }
      setIsAutoAligning(false);
    }, 50);
  }, [originalImage]);

  // ---------- Auto-fit crop ----------
  const autoFitCrop = useCallback(() => {
    if (!originalImage) return;
    const { width: cw, height: ch } = canvasDisplaySize;
    const fitScale = Math.min(cw / originalImage.width, ch / originalImage.height);

    const inscribed = computeInscribedCrop(originalImage.width, originalImage.height, transform.rotation);

    // Scale inscribed dimensions to canvas-display space
    const cropW = inscribed.width * fitScale * transform.scale;
    const cropH = inscribed.height * fitScale * transform.scale;

    // Center in canvas (offset by translate)
    const cx = cw / 2 + transform.translateX - cropW / 2;
    const cy = ch / 2 + transform.translateY - cropH / 2;

    // Clamp to canvas bounds
    const clampedX = Math.max(0, cx);
    const clampedY = Math.max(0, cy);
    const clampedW = Math.min(cropW, cw - clampedX);
    const clampedH = Math.min(cropH, ch - clampedY);

    setCrop({ x: clampedX, y: clampedY, width: clampedW, height: clampedH });
    setCropMode(true);
  }, [originalImage, canvasDisplaySize, transform]);

  // ---------- Download ----------
  const downloadImage = useCallback(() => {
    if (!originalImage) return;

    const outCanvas = renderForExport(
      originalImage,
      transform,
      canvasDisplaySize.width,
      canvasDisplaySize.height,
      crop,
    );

    const link = document.createElement('a');
    link.download = `${fileName}_aligned.png`;
    link.href = outCanvas.toDataURL('image/png');
    link.click();
  }, [originalImage, transform, fileName, crop, canvasDisplaySize]);

  // ---------- Reset ----------
  const reset = () => {
    setOriginalImage(null);
    setFileName('');
    setTransform(DEFAULT_TRANSFORM);
    setGrid(DEFAULT_GRID);
    setAutoAlignResult(null);
    setCrop(null);
    setCropMode(false);
  };

  // ---------- Render ----------
  return (
    <div className="w-full max-w-5xl mx-auto">
      {!originalImage ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload Image</h2>
          <p className="text-gray-600 mb-6">
            Upload a photo to align it to a grid. Supports PNG, JPG, WebP, and other formats.
          </p>

          <div
            className={`relative ${dragActive ? 'ring-2 ring-blue-500' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <label
              htmlFor="grid-image-upload"
              className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg
                  className={`w-12 h-12 mb-4 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, WebP, GIF</p>
              </div>
              <input
                id="grid-image-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileInput}
                disabled={isProcessing}
              />
            </label>
          </div>

          {isProcessing && (
            <div className="mt-4 flex items-center justify-center text-blue-600">
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Loading image...
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Grid Aligner</h2>
            <button onClick={reset} className="text-gray-500 hover:text-gray-700 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Controls row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Transform controls */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Transform</h3>

              {/* Rotation */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-600">Rotation</label>
                  <span className="text-xs font-bold text-blue-600">{transform.rotation.toFixed(1)}°</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTransform((t) => ({ ...t, rotation: Math.max(-180, t.rotation - 0.1) }))}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    -0.1
                  </button>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="0.1"
                    value={transform.rotation}
                    onChange={(e) => setTransform((t) => ({ ...t, rotation: Number(e.target.value) }))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <button
                    onClick={() => setTransform((t) => ({ ...t, rotation: Math.min(180, t.rotation + 0.1) }))}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    +0.1
                  </button>
                </div>
              </div>

              {/* Scale */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-600">Scale</label>
                  <span className="text-xs font-bold text-blue-600">{transform.scale.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.01"
                  value={transform.scale}
                  onChange={(e) => setTransform((t) => ({ ...t, scale: Number(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setTransform(DEFAULT_TRANSFORM);
                    setAutoAlignResult(null);
                  }}
                  className="flex-1 px-3 py-2 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md transition-colors font-medium"
                >
                  Reset
                </button>
                <button
                  onClick={autoAlign}
                  disabled={isAutoAligning}
                  className="flex-1 px-3 py-2 text-xs bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 rounded-md transition-colors font-medium"
                >
                  {isAutoAligning ? 'Detecting...' : 'Auto-Align'}
                </button>
              </div>

              {autoAlignResult && (
                <p className="mt-2 text-xs text-center text-gray-600 bg-gray-50 rounded p-1.5">
                  {autoAlignResult}
                </p>
              )}
            </div>

            {/* Grid settings */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Grid</h3>
                <button
                  onClick={() => setGrid((g) => ({ ...g, visible: !g.visible }))}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    grid.visible ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {grid.visible ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Cell size */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-600">Cell Size</label>
                  <span className="text-xs font-bold text-blue-600">{grid.cellSize}px</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={grid.cellSize}
                  onChange={(e) => setGrid((g) => ({ ...g, cellSize: Number(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Color + opacity row */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Color</label>
                  <input
                    type="color"
                    value={grid.color}
                    onChange={(e) => setGrid((g) => ({ ...g, color: e.target.value }))}
                    className="w-full h-8 rounded cursor-pointer border border-gray-200"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-gray-600">Opacity</label>
                    <span className="text-xs font-bold text-blue-600">{grid.opacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={grid.opacity}
                    onChange={(e) => setGrid((g) => ({ ...g, opacity: Number(e.target.value) }))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>

              {/* Line width */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-600">Line Width</label>
                  <span className="text-xs font-bold text-blue-600">{grid.lineWidth}px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={grid.lineWidth}
                  onChange={(e) => setGrid((g) => ({ ...g, lineWidth: Number(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>

            {/* Crop settings */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Crop</h3>
                <button
                  onClick={() => {
                    setCropMode((m) => !m);
                    if (cropMode) setCrop(null);
                  }}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    cropMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {cropMode ? 'ON' : 'OFF'}
                </button>
              </div>

              <button
                onClick={autoFitCrop}
                className="w-full px-3 py-2 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors font-medium mb-3"
              >
                Auto-fit (inscribed rect)
              </button>

              {crop && (
                <>
                  <div className="text-xs text-gray-600 space-y-1 mb-3">
                    <p>
                      <span className="font-medium">Position:</span>{' '}
                      {Math.round(crop.x)}, {Math.round(crop.y)}
                    </p>
                    <p>
                      <span className="font-medium">Size:</span>{' '}
                      {Math.round(crop.width)} &times; {Math.round(crop.height)} px
                    </p>
                  </div>
                  <button
                    onClick={() => setCrop(null)}
                    className="w-full px-3 py-2 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md transition-colors font-medium"
                  >
                    Clear Crop
                  </button>
                </>
              )}

              {!crop && cropMode && (
                <p className="text-xs text-gray-500">
                  Draw a crop rectangle on the canvas, or use Auto-fit.
                </p>
              )}
            </div>
          </div>

          {/* Canvas preview */}
          <div ref={containerRef} className="bg-white rounded-lg shadow-md p-4">
            <p className="text-xs text-gray-500 mb-2">
              {cropMode ? 'Draw / drag crop rect' : 'Drag to pan'} &middot; Scroll to zoom
            </p>
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
              <canvas
                ref={previewCanvasRef}
                width={canvasDisplaySize.width}
                height={canvasDisplaySize.height}
                className={cropMode ? 'cursor-crosshair touch-none' : 'cursor-grab active:cursor-grabbing touch-none'}
                style={{ width: canvasDisplaySize.width, height: canvasDisplaySize.height }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              />
            </div>
          </div>

          {/* Download */}
          <button
            onClick={downloadImage}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {crop ? 'Download Cropped PNG' : 'Download Aligned PNG'} (no grid)
          </button>
        </div>
      )}

      {/* Info section */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-gray-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-gray-600">
            <p className="font-semibold text-gray-700 mb-1">100% Local Processing</p>
            <p>
              Your images are processed entirely in your browser using the Canvas API. Nothing is uploaded to any server.
              Auto-align uses Sobel edge detection to find and correct dominant skew angles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
