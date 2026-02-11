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
import {
  type ColorAdjustments,
  DEFAULT_ADJUSTMENTS,
  isDefaultAdjustments,
  applyAllAdjustments,
  downsampleImage,
} from '@/lib/photo-color-enhancer';
import {
  TransformPanel,
  GridPanel,
  CropPanel,
  AutoColorPanel,
  ManualColorPanel,
  PresetsPanel,
} from './photo-editor/EditorPanels';

type CropAction =
  | { type: 'resize'; handle: HandleName; originCrop: CropRect }
  | { type: 'move'; startX: number; startY: number; originCrop: CropRect }
  | { type: 'draw'; startX: number; startY: number };

export default function PhotoEditor() {
  // --- State ---
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
  const [showOriginal, setShowOriginal] = useState(false);

  const [canvasDisplaySize, setCanvasDisplaySize] = useState({ width: 800, height: 600 });
  const [adjustments, setAdjustments] = useState<ColorAdjustments>(DEFAULT_ADJUSTMENTS);
  const [activeTab, setActiveTab] = useState<'transform' | 'color'>('transform');

  // --- Refs ---
  const originalImageDataRef = useRef<ImageData | null>(null);
  const previewImageDataRef = useRef<ImageData | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isPanningRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const cropActionRef = useRef<CropAction | null>(null);

  // Compute display size when image loads
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
        const fullCanvas = document.createElement('canvas');
        fullCanvas.width = img.width;
        fullCanvas.height = img.height;
        const fullCtx = fullCanvas.getContext('2d')!;
        fullCtx.drawImage(img, 0, 0);
        originalImageDataRef.current = fullCtx.getImageData(0, 0, img.width, img.height);
        previewImageDataRef.current = downsampleImage(img, 1000);

        setOriginalImage(img);
        setFileName(file.name.replace(/\.[^/.]+$/, ''));
        setTransform(DEFAULT_TRANSFORM);
        setAutoAlignResult(null);
        setCrop(null);
        setCropMode(false);
        setAdjustments(DEFAULT_ADJUSTMENTS);
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

    if (showOriginal) {
      drawTransformedImage(ctx, originalImage, cw, ch, DEFAULT_TRANSFORM);
    } else {
      const defaultAdj = isDefaultAdjustments(adjustments);
      if (!defaultAdj && previewImageDataRef.current) {
        const processed = applyAllAdjustments(previewImageDataRef.current, adjustments);
        const tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = processed.width;
        tmpCanvas.height = processed.height;
        const tmpCtx = tmpCanvas.getContext('2d')!;
        tmpCtx.putImageData(processed, 0, 0);
        drawTransformedImage(ctx, tmpCanvas, cw, ch, transform);
      } else {
        drawTransformedImage(ctx, originalImage, cw, ch, transform);
      }
      drawGrid(ctx, cw, ch, grid);
      if (crop) {
        drawCropOverlay(ctx, cw, ch, crop);
      }
    }
  }, [originalImage, transform, grid, canvasDisplaySize, crop, showOriginal, adjustments]);

  // ---------- Pointer events ----------
  const getCanvasCoords = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

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
      cropActionRef.current = { type: 'draw', startX: x, startY: y };
      setCrop({ x, y, width: 0, height: 0 });
      return;
    }

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
        setCrop({
          x: Math.max(0, Math.min(oc.x + dx, cw - oc.width)),
          y: Math.max(0, Math.min(oc.y + dy, ch - oc.height)),
          width: oc.width,
          height: oc.height,
        });
        return;
      }

      if (action.type === 'resize') {
        const oc = action.originCrop;
        let { x: cx, y: cy, width: cWidth, height: cHeight } = oc;
        const handle = action.handle;

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
        if (handle === 'leftMid' || handle === 'rightMid') {
          cy = oc.y;
          cHeight = oc.height;
        }
        if (handle === 'topMid' || handle === 'bottomMid') {
          cx = oc.x;
          cWidth = oc.width;
        }

        setCrop({ x: cx, y: cy, width: cWidth, height: cHeight });
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

    const cropW = inscribed.width * fitScale * transform.scale;
    const cropH = inscribed.height * fitScale * transform.scale;
    const cx = cw / 2 + transform.translateX - cropW / 2;
    const cy = ch / 2 + transform.translateY - cropH / 2;

    const clampedX = Math.max(0, cx);
    const clampedY = Math.max(0, cy);
    setCrop({ x: clampedX, y: clampedY, width: Math.min(cropW, cw - clampedX), height: Math.min(cropH, ch - clampedY) });
    setCropMode(true);
  }, [originalImage, canvasDisplaySize, transform]);

  // ---------- Download ----------
  const downloadImage = useCallback(() => {
    if (!originalImage) return;

    const defaultAdj = isDefaultAdjustments(adjustments);
    let source: HTMLImageElement | HTMLCanvasElement = originalImage;

    if (!defaultAdj && originalImageDataRef.current) {
      const processed = applyAllAdjustments(originalImageDataRef.current, adjustments);
      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = processed.width;
      tmpCanvas.height = processed.height;
      const tmpCtx = tmpCanvas.getContext('2d')!;
      tmpCtx.putImageData(processed, 0, 0);
      source = tmpCanvas;
    }

    const outCanvas = renderForExport(source, transform, canvasDisplaySize.width, canvasDisplaySize.height, crop);
    const link = document.createElement('a');
    link.download = `${fileName}_edited.png`;
    link.href = outCanvas.toDataURL('image/png');
    link.click();
  }, [originalImage, transform, fileName, crop, canvasDisplaySize, adjustments]);

  // ---------- Reset ----------
  const reset = () => {
    setOriginalImage(null);
    setFileName('');
    setTransform(DEFAULT_TRANSFORM);
    setGrid(DEFAULT_GRID);
    setAutoAlignResult(null);
    setCrop(null);
    setCropMode(false);
    setShowOriginal(false);
    setAdjustments(DEFAULT_ADJUSTMENTS);
    originalImageDataRef.current = null;
    previewImageDataRef.current = null;
  };

  // ---------- Render ----------
  return (
    <div className="w-full max-w-5xl mx-auto">
      {!originalImage ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload Image</h2>
          <p className="text-gray-600 mb-6">
            Upload a photo to align and enhance. Supports PNG, JPG, WebP, and other formats.
          </p>

          <div
            className={`relative ${dragActive ? 'ring-2 ring-blue-500' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <label
              htmlFor="photo-editor-upload"
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
                id="photo-editor-upload"
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
            <h2 className="text-xl font-bold text-gray-900">Photo Editor</h2>
            <button onClick={reset} className="text-gray-500 hover:text-gray-700 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('transform')}
              className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeTab === 'transform'
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              Transform & Grid
            </button>
            <button
              onClick={() => setActiveTab('color')}
              className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeTab === 'color'
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              Color
            </button>
          </div>

          {/* Transform / Grid / Crop tab */}
          {activeTab === 'transform' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TransformPanel
                transform={transform}
                setTransform={setTransform}
                isAutoAligning={isAutoAligning}
                autoAlignResult={autoAlignResult}
                setAutoAlignResult={setAutoAlignResult}
                onAutoAlign={autoAlign}
              />
              <GridPanel grid={grid} setGrid={setGrid} />
              <CropPanel
                crop={crop}
                setCrop={setCrop}
                cropMode={cropMode}
                setCropMode={setCropMode}
                onAutoFitCrop={autoFitCrop}
              />
            </div>
          )}

          {/* Color tab */}
          {activeTab === 'color' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AutoColorPanel adjustments={adjustments} setAdjustments={setAdjustments} />
              <ManualColorPanel adjustments={adjustments} setAdjustments={setAdjustments} />
              <PresetsPanel setAdjustments={setAdjustments} />
            </div>
          )}

          {/* Canvas preview */}
          <div ref={containerRef} className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">
                {cropMode ? 'Draw / drag crop rect' : 'Drag to pan'} &middot; Scroll to zoom
              </p>
              <button
                onPointerDown={() => setShowOriginal(true)}
                onPointerUp={() => setShowOriginal(false)}
                onPointerLeave={() => setShowOriginal(false)}
                className={`px-3 py-1 text-xs rounded-md transition-colors font-medium select-none ${
                  showOriginal
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {showOriginal ? 'Original' : 'Hold to compare'}
              </button>
            </div>
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
            {crop ? 'Download Cropped PNG' : 'Download PNG'} (no grid)
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
              Grid alignment uses Sobel edge detection for auto-align. Color adjustments include auto-levels,
              white balance, brightness, contrast, saturation, and temperature.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
