'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  type PBNConfig,
  type PBNResult,
  type PaletteEntry,
  DEFAULT_CONFIG,
  DIFFICULTY_PRESETS,
  downsampleImage,
  imageToImageData,
  generatePaintByNumbers,
} from '@/lib/paint-by-numbers';

export default function PaintByNumbers() {
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [difficulty, setDifficulty] = useState(1); // 0=Easy, 1=Medium, 2=Hard
  const [colorCount, setColorCount] = useState(DIFFICULTY_PRESETS[1].colorCount);
  const [showTint, setShowTint] = useState(DEFAULT_CONFIG.showTint);
  const [result, setResult] = useState<PBNResult | null>(null);
  const [sliderPos, setSliderPos] = useState(50); // percentage 0–100
  const [isDragging, setIsDragging] = useState(false);
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const leftCanvasRef = useRef<HTMLCanvasElement>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement>(null);

  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        setFileName(file.name.replace(/\.[^/.]+$/, ''));
        setResult(null);
        setIsProcessing(false);
      };
      img.onerror = () => setIsProcessing(false);
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDifficultyChange = useCallback((idx: number) => {
    setDifficulty(idx);
    setColorCount(DIFFICULTY_PRESETS[idx].colorCount);
    setResult(null);
  }, []);

  const generate = useCallback(() => {
    if (!originalImage) return;
    setIsProcessing(true);
    setResult(null);

    // Use setTimeout to let the UI paint the spinner before heavy computation
    setTimeout(() => {
      const imageData = downsampleImage(originalImage, DEFAULT_CONFIG.maxPreviewDim);
      const config: PBNConfig = {
        colorCount,
        minRegionSize: DIFFICULTY_PRESETS[difficulty].minRegionSize,
        showTint,
        maxPreviewDim: DEFAULT_CONFIG.maxPreviewDim,
      };
      const pbnResult = generatePaintByNumbers(imageData, config);
      setResult(pbnResult);
      setSliderPos(50);
      setIsProcessing(false);
    }, 50);
  }, [originalImage, colorCount, difficulty, showTint]);

  const downloadCanvas = useCallback((canvas: HTMLCanvasElement, suffix: string) => {
    const link = document.createElement('a');
    link.download = `${fileName}_${suffix}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [fileName]);

  const downloadFullRes = useCallback(() => {
    if (!originalImage) return;
    setIsExporting(true);

    setTimeout(() => {
      const imageData = imageToImageData(originalImage);
      const config: PBNConfig = {
        colorCount,
        minRegionSize: DIFFICULTY_PRESETS[difficulty].minRegionSize,
        showTint,
        maxPreviewDim: DEFAULT_CONFIG.maxPreviewDim,
      };
      const fullResult = generatePaintByNumbers(imageData, config);
      downloadCanvas(fullResult.outlineCanvas, 'outline_full');
      setIsExporting(false);
    }, 50);
  }, [originalImage, colorCount, difficulty, showTint, downloadCanvas]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadImage(file);
    e.target.value = '';
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) loadImage(file);
    },
    [loadImage]
  );

  const reset = () => {
    setOriginalImage(null);
    setFileName('');
    setResult(null);
    setDifficulty(1);
    setColorCount(DIFFICULTY_PRESETS[1].colorCount);
    setShowTint(true);
  };

  // Paint canvases when result changes
  useEffect(() => {
    if (!result || !originalImage) return;

    // Left canvas: quantized preview (color version)
    if (leftCanvasRef.current) {
      const target = leftCanvasRef.current;
      target.width = result.quantizedCanvas.width;
      target.height = result.quantizedCanvas.height;
      const ctx = target.getContext('2d');
      if (ctx) ctx.drawImage(result.quantizedCanvas, 0, 0);
    }

    // Right canvas: outline template
    if (rightCanvasRef.current) {
      const target = rightCanvasRef.current;
      target.width = result.outlineCanvas.width;
      target.height = result.outlineCanvas.height;
      const ctx = target.getContext('2d');
      if (ctx) ctx.drawImage(result.outlineCanvas, 0, 0);
    }
  }, [result, originalImage]);

  // Slider drag handlers
  const handleSliderMove = useCallback((clientX: number) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    handleSliderMove(e.clientX);
  }, [handleSliderMove]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    handleSliderMove(e.clientX);
  }, [isDragging, handleSliderMove]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const Spinner = () => (
    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );

  return (
    <div className="w-full max-w-5xl mx-auto">
      {!originalImage ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload Image</h2>
          <p className="text-gray-600 mb-6">
            Upload a photo to generate a paint-by-numbers template with numbered outline zones and acrylic paint mixing recipes.
          </p>

          <div
            className={`relative ${dragActive ? 'ring-2 ring-blue-500' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <label
              htmlFor="pbn-upload"
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
                <p className="text-xs text-gray-500">PNG, JPG, WebP</p>
              </div>
              <input
                id="pbn-upload"
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
              <Spinner />
              Loading image...
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Paint by Numbers</h2>
              <p className="text-sm text-gray-500 mt-1">
                {fileName} &middot; {originalImage.width} x {originalImage.height}px
              </p>
            </div>
            <button onClick={reset} className="text-gray-500 hover:text-gray-700 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {/* Difficulty */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Difficulty</label>
              <div className="flex gap-1">
                {DIFFICULTY_PRESETS.map((preset, idx) => (
                  <button
                    key={preset.label}
                    onClick={() => handleDifficultyChange(idx)}
                    className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      difficulty === idx
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color count */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Colors: {colorCount}
              </label>
              <input
                type="range"
                min={4}
                max={30}
                value={colorCount}
                onChange={(e) => {
                  setColorCount(Number(e.target.value));
                  setResult(null);
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>4</span>
                <span>30</span>
              </div>
            </div>

            {/* Show tint toggle */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Options</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTint}
                  onChange={(e) => {
                    setShowTint(e.target.checked);
                    setResult(null);
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Show color tint in regions</span>
              </label>
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={isProcessing}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center mb-6"
          >
            {isProcessing ? (
              <>
                <Spinner />
                Generating...
              </>
            ) : (
              'Generate'
            )}
          </button>

          {/* Results */}
          {result && (
            <>
              {/* Comparison slider hint */}
              <p className="text-sm text-gray-500 text-center mb-3">
                Drag the slider to compare the color preview with the numbered template
              </p>

              {/* Before / After comparison slider */}
              <div
                ref={sliderContainerRef}
                className="relative border border-gray-200 rounded-lg overflow-hidden bg-gray-100 mb-6 select-none touch-none"
                style={{ aspectRatio: `${result.width} / ${result.height}` }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              >
                {/* Right side: outline (full width, behind) */}
                <canvas
                  ref={rightCanvasRef}
                  className="absolute inset-0 w-full h-full"
                  style={{ objectFit: 'contain' }}
                />

                {/* Left side: quantized (clipped to slider position) */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPos}%` }}
                >
                  <canvas
                    ref={leftCanvasRef}
                    className="absolute inset-0 w-full h-full"
                    style={{
                      objectFit: 'contain',
                      /* The canvas must span the full container width so the image
                         aligns pixel-for-pixel with the right canvas; only the
                         wrapper div clips it. */
                      width: sliderContainerRef.current
                        ? `${sliderContainerRef.current.offsetWidth}px`
                        : '100%',
                      minWidth: sliderContainerRef.current
                        ? `${sliderContainerRef.current.offsetWidth}px`
                        : '100%',
                    }}
                  />
                </div>

                {/* Slider line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white z-10 pointer-events-none"
                  style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
                >
                  {/* Shadow for contrast */}
                  <div className="absolute inset-0 w-1 -translate-x-[1px] bg-black/20" />
                </div>

                {/* Slider handle */}
                <div
                  className="absolute top-1/2 z-20 -translate-y-1/2 -translate-x-1/2 pointer-events-none"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="w-10 h-10 rounded-full bg-white shadow-lg border border-gray-300 flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-gray-500">
                      <path d="M5 9L2 6M2 6L5 3M2 6H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M13 9L16 6M16 6L13 3M16 6H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M5 15L2 12M2 12L5 9M2 12H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0" />
                    </svg>
                  </div>
                </div>

                {/* Labels */}
                <div className="absolute top-2 left-2 z-10 bg-black/50 text-white text-xs px-2 py-1 rounded pointer-events-none">
                  Color
                </div>
                <div className="absolute top-2 right-2 z-10 bg-black/50 text-white text-xs px-2 py-1 rounded pointer-events-none">
                  Template
                </div>
              </div>

              {/* Download buttons */}
              <div className="flex flex-wrap gap-3 mb-8">
                <button
                  onClick={() => downloadCanvas(result.outlineCanvas, 'outline')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center text-sm"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Outline
                </button>
                <button
                  onClick={() => downloadCanvas(result.quantizedCanvas, 'quantized')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center text-sm"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Quantized
                </button>
                <button
                  onClick={() => downloadCanvas(result.paletteCardCanvas, 'palette')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center text-sm"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Palette Card
                </button>
                <button
                  onClick={downloadFullRes}
                  disabled={isExporting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center text-sm"
                >
                  {isExporting ? (
                    <>
                      <Spinner />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Full-Res Export
                    </>
                  )}
                </button>
              </div>

              {/* Color palette grid */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Color Palette ({result.palette.length} colors)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.palette.map((entry: PaletteEntry) => (
                    <div
                      key={entry.index}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
                    >
                      {/* Swatch */}
                      <div
                        className="w-10 h-10 rounded-md border border-gray-300 flex-shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: entry.hex }}
                      >
                        <span className="text-xs font-bold" style={{
                          color: (entry.r * 0.299 + entry.g * 0.587 + entry.b * 0.114) > 150 ? '#000' : '#fff',
                        }}>
                          {entry.index}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">#{entry.index}</span>
                          <span className="text-xs text-gray-500 font-mono">{entry.hex}</span>
                        </div>
                        <p className="text-xs text-gray-600 truncate">
                          {entry.recipe.parts.map(p => `${p.amount} ${p.paint}`).join(' + ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Info Section */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-gray-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-gray-600">
            <p className="font-semibold text-gray-700 mb-1">100% Local Processing</p>
            <p>
              Your images are processed entirely in your browser. Nothing is uploaded to any server.
              The outline template and palette card are exported as PNG files.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
