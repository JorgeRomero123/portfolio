'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Image Opacity Tool
 *
 * Allows users to adjust the opacity of an image and download the result.
 * All processing happens client-side using the Canvas API.
 */
export default function ImageOpacity() {
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [opacity, setOpacity] = useState<number>(100);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * Load image from file
   */
  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        setFileName(file.name.replace(/\.[^/.]+$/, ''));
        setOpacity(100);
        setIsProcessing(false);
      };
      img.onerror = () => {
        setIsProcessing(false);
      };
      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  }, []);

  /**
   * Draw image with opacity on canvas
   */
  useEffect(() => {
    if (!originalImage || !previewCanvasRef.current) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match image
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;

    // Clear canvas with transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw checkered pattern to show transparency
    const patternSize = 20;
    for (let x = 0; x < canvas.width; x += patternSize) {
      for (let y = 0; y < canvas.height; y += patternSize) {
        ctx.fillStyle = ((x + y) / patternSize) % 2 === 0 ? '#e0e0e0' : '#ffffff';
        ctx.fillRect(x, y, patternSize, patternSize);
      }
    }

    // Draw image with opacity
    ctx.globalAlpha = opacity / 100;
    ctx.drawImage(originalImage, 0, 0);
    ctx.globalAlpha = 1;
  }, [originalImage, opacity]);

  /**
   * Download the processed image
   */
  const downloadImage = useCallback(() => {
    if (!originalImage) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;

    // Clear with transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image with opacity (no checkered pattern for download)
    ctx.globalAlpha = opacity / 100;
    ctx.drawImage(originalImage, 0, 0);

    // Download as PNG
    const link = document.createElement('a');
    link.download = `${fileName}_opacity_${opacity}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [originalImage, opacity, fileName]);

  /**
   * Handle file input
   */
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadImage(file);
    }
    e.target.value = '';
  };

  /**
   * Drag and drop handlers
   */
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      loadImage(file);
    }
  }, [loadImage]);

  /**
   * Reset to upload new image
   */
  const reset = () => {
    setOriginalImage(null);
    setFileName('');
    setOpacity(100);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Hidden canvas for download */}
      <canvas ref={canvasRef} className="hidden" />

      {!originalImage ? (
        /* Upload Section */
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Upload Image
          </h2>
          <p className="text-gray-600 mb-6">
            Upload an image to adjust its opacity. Supports PNG, JPG, WebP, and other formats.
          </p>

          <div
            className={`relative ${dragActive ? 'ring-2 ring-blue-500' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <label
              htmlFor="image-upload"
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
                <p className="text-xs text-gray-500">
                  PNG, JPG, WebP, GIF
                </p>
              </div>
              <input
                id="image-upload"
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
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Loading image...
            </div>
          )}
        </div>
      ) : (
        /* Editor Section */
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Adjust Opacity
            </h2>
            <button
              onClick={reset}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Opacity Slider */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Opacity
              </label>
              <span className="text-sm font-bold text-blue-600">
                {opacity}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Transparent</span>
              <span>Opaque</span>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex gap-2 mb-6">
            {[0, 25, 50, 75, 100].map((preset) => (
              <button
                key={preset}
                onClick={() => setOpacity(preset)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  opacity === preset
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {preset}%
              </button>
            ))}
          </div>

          {/* Preview */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center p-4">
              <canvas
                ref={previewCanvasRef}
                className="max-w-full max-h-96 rounded shadow-sm"
                style={{ imageRendering: 'auto' }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Checkered pattern shows transparent areas
            </p>
          </div>

          {/* Download Button */}
          <button
            onClick={downloadImage}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PNG ({opacity}% opacity)
          </button>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-gray-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-gray-600">
            <p className="font-semibold text-gray-700 mb-1">
              100% Local Processing
            </p>
            <p>
              Your images are processed entirely in your browser. Nothing is uploaded to any server.
              The output is always PNG to preserve transparency.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
