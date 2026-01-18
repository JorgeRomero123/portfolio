'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { removeBackground } from '@imgly/background-removal';

type Tool = 'erase' | 'restore';

/**
 * Background Remover Tool
 *
 * Hybrid approach: AI-powered automatic removal + manual brush refinement.
 * All processing happens client-side.
 */
export default function BackgroundRemover() {
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [processedImageData, setProcessedImageData] = useState<ImageData | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manual refinement state
  const [activeTool, setActiveTool] = useState<Tool>('erase');
  const [brushSize, setBrushSize] = useState(20);
  const [isDrawing, setIsDrawing] = useState(false);

  // Zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const lastDrawPointRef = useRef<{ x: number; y: number } | null>(null);

  // Canvas refs
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const downloadCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  /**
   * Zoom controls
   */
  const zoomIn = () => setZoom((z) => Math.min(z + 0.25, 4));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const resetZoom = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  /**
   * Draw checkered pattern for transparency preview
   */
  const drawCheckeredPattern = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const patternSize = 15;
    for (let x = 0; x < width; x += patternSize) {
      for (let y = 0; y < height; y += patternSize) {
        ctx.fillStyle = ((x + y) / patternSize) % 2 === 0 ? '#e0e0e0' : '#ffffff';
        ctx.fillRect(x, y, patternSize, patternSize);
      }
    }
  };

  /**
   * Update the preview canvas
   */
  const updatePreview = useCallback(() => {
    if (!originalImage || !processedImageData || !previewCanvasRef.current || !maskCanvasRef.current) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const maskCanvas = maskCanvasRef.current;
    const maskCtx = maskCanvas.getContext('2d');
    if (!ctx || !maskCtx) return;

    // Clear and draw checkered pattern
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCheckeredPattern(ctx, canvas.width, canvas.height);

    // Get mask data
    const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);

    // Create composite image
    const compositeData = ctx.createImageData(processedImageData.width, processedImageData.height);

    for (let i = 0; i < processedImageData.data.length; i += 4) {
      // Use mask alpha to determine visibility
      const maskAlpha = maskData.data[i + 3];

      if (maskAlpha > 0) {
        compositeData.data[i] = processedImageData.data[i];     // R
        compositeData.data[i + 1] = processedImageData.data[i + 1]; // G
        compositeData.data[i + 2] = processedImageData.data[i + 2]; // B
        compositeData.data[i + 3] = processedImageData.data[i + 3]; // A from processed
      } else {
        compositeData.data[i + 3] = 0; // Fully transparent
      }
    }

    // Draw composite on preview
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = compositeData.width;
    tempCanvas.height = compositeData.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.putImageData(compositeData, 0, 0);
      ctx.drawImage(tempCanvas, 0, 0);
    }
  }, [originalImage, processedImageData]);

  /**
   * Initialize mask from processed image
   */
  const initializeMask = useCallback((imageData: ImageData) => {
    if (!maskCanvasRef.current) return;

    const maskCanvas = maskCanvasRef.current;
    maskCanvas.width = imageData.width;
    maskCanvas.height = imageData.height;

    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;

    // Create mask from alpha channel of processed image
    const maskData = maskCtx.createImageData(imageData.width, imageData.height);

    for (let i = 0; i < imageData.data.length; i += 4) {
      const alpha = imageData.data[i + 3];
      // White where visible, black where transparent
      maskData.data[i] = 255;     // R
      maskData.data[i + 1] = 255; // G
      maskData.data[i + 2] = 255; // B
      maskData.data[i + 3] = alpha > 10 ? 255 : 0; // A
    }

    maskCtx.putImageData(maskData, 0, 0);
  }, []);

  useEffect(() => {
    updatePreview();
  }, [updatePreview]);

  /**
   * Load image from file
   */
  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setError(null);
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        setFileName(file.name.replace(/\.[^/.]+$/, ''));
        setProcessedImageData(null);

        // Initialize preview canvas
        if (previewCanvasRef.current) {
          previewCanvasRef.current.width = img.width;
          previewCanvasRef.current.height = img.height;
          const ctx = previewCanvasRef.current.getContext('2d');
          if (ctx) {
            drawCheckeredPattern(ctx, img.width, img.height);
            ctx.drawImage(img, 0, 0);
          }
        }
      };
      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  }, []);

  /**
   * Remove background using AI
   */
  const removeBackgroundAI = async () => {
    if (!originalImage) return;

    setIsProcessing(true);
    setError(null);
    setProcessingStatus('Loading AI model...');

    try {
      // Convert image to blob
      const canvas = document.createElement('canvas');
      canvas.width = originalImage.width;
      canvas.height = originalImage.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      ctx.drawImage(originalImage, 0, 0);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('Could not create blob'));
        }, 'image/png');
      });

      setProcessingStatus('Processing image...');

      // Remove background
      const resultBlob = await removeBackground(blob, {
        progress: (key, current, total) => {
          if (key === 'compute:inference') {
            const percent = Math.round((current / total) * 100);
            setProcessingStatus(`Removing background... ${percent}%`);
          }
        },
      });

      // Convert result to ImageData
      const resultUrl = URL.createObjectURL(resultBlob);
      const resultImg = new Image();

      await new Promise<void>((resolve, reject) => {
        resultImg.onload = () => resolve();
        resultImg.onerror = () => reject(new Error('Failed to load result'));
        resultImg.src = resultUrl;
      });

      const resultCanvas = document.createElement('canvas');
      resultCanvas.width = resultImg.width;
      resultCanvas.height = resultImg.height;
      const resultCtx = resultCanvas.getContext('2d');
      if (!resultCtx) throw new Error('Could not get result context');

      resultCtx.drawImage(resultImg, 0, 0);
      const imageData = resultCtx.getImageData(0, 0, resultCanvas.width, resultCanvas.height);

      setProcessedImageData(imageData);
      initializeMask(imageData);

      // Set up preview canvas
      if (previewCanvasRef.current) {
        previewCanvasRef.current.width = imageData.width;
        previewCanvasRef.current.height = imageData.height;
      }

      URL.revokeObjectURL(resultUrl);
      setProcessingStatus('');
    } catch (err) {
      console.error('Background removal error:', err);
      setError('Failed to remove background. Please try again.');
      setProcessingStatus('');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Get canvas coordinates accounting for zoom and pan
   */
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!previewCanvasRef.current || !canvasContainerRef.current) return { x: 0, y: 0 };

    const canvas = previewCanvasRef.current;
    const container = canvasContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    // Mouse position relative to container
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;

    // Canvas position within container (accounting for centering)
    const canvasLeft = canvasRect.left - containerRect.left;
    const canvasTop = canvasRect.top - containerRect.top;

    // Mouse position relative to the scaled canvas
    const relativeX = mouseX - canvasLeft;
    const relativeY = mouseY - canvasTop;

    // The displayed size of the canvas (after zoom)
    const displayedWidth = canvasRect.width;
    const displayedHeight = canvasRect.height;

    // Convert to canvas pixel coordinates
    // canvasRect already accounts for the CSS transform, so we just need to scale
    const x = (relativeX / displayedWidth) * canvas.width;
    const y = (relativeY / displayedHeight) * canvas.height;

    return { x, y };
  };

  /**
   * Handle brush drawing for manual refinement
   */
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Right click or middle mouse button - start panning
    if (e.button === 2 || e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    if (!processedImageData) return;
    setIsDrawing(true);
    draw(e);
  };

  // Prevent context menu on right click
  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Handle panning
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      setPanOffset((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    if (!isDrawing || !processedImageData) return;
    draw(e);
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
    setIsPanning(false);
    lastDrawPointRef.current = null;
  };

  const handleCanvasMouseLeave = () => {
    setIsDrawing(false);
    setIsPanning(false);
    lastDrawPointRef.current = null;
  };

  /**
   * Handle mouse wheel for zooming
   */
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!processedImageData) return;
    e.preventDefault();

    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.max(0.5, Math.min(4, z + delta)));
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!maskCanvasRef.current || !previewCanvasRef.current) return;

    const maskCanvas = maskCanvasRef.current;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;

    const { x, y } = getCanvasCoordinates(e);

    // Set up the composite operation
    if (activeTool === 'erase') {
      maskCtx.globalCompositeOperation = 'destination-out';
    } else {
      maskCtx.globalCompositeOperation = 'source-over';
    }

    maskCtx.fillStyle = 'white';

    // If we have a previous point, fill circles along the path for smooth strokes
    if (lastDrawPointRef.current) {
      const lastX = lastDrawPointRef.current.x;
      const lastY = lastDrawPointRef.current.y;
      const dist = Math.sqrt((x - lastX) ** 2 + (y - lastY) ** 2);
      const steps = Math.max(1, Math.ceil(dist / (brushSize / 4)));

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const interpX = lastX + (x - lastX) * t;
        const interpY = lastY + (y - lastY) * t;

        maskCtx.beginPath();
        maskCtx.arc(interpX, interpY, brushSize, 0, Math.PI * 2);
        maskCtx.fill();
      }
    } else {
      // First point - draw a single circle
      maskCtx.beginPath();
      maskCtx.arc(x, y, brushSize, 0, Math.PI * 2);
      maskCtx.fill();
    }

    maskCtx.globalCompositeOperation = 'source-over';
    lastDrawPointRef.current = { x, y };

    updatePreview();
  };

  /**
   * Download the result
   */
  const downloadImage = useCallback(() => {
    if (!processedImageData || !maskCanvasRef.current || !downloadCanvasRef.current) return;

    const canvas = downloadCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const maskCanvas = maskCanvasRef.current;
    const maskCtx = maskCanvas.getContext('2d');
    if (!ctx || !maskCtx) return;

    canvas.width = processedImageData.width;
    canvas.height = processedImageData.height;

    // Get mask data
    const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);

    // Create final image
    const finalData = ctx.createImageData(processedImageData.width, processedImageData.height);

    for (let i = 0; i < processedImageData.data.length; i += 4) {
      const maskAlpha = maskData.data[i + 3];

      if (maskAlpha > 0) {
        finalData.data[i] = processedImageData.data[i];
        finalData.data[i + 1] = processedImageData.data[i + 1];
        finalData.data[i + 2] = processedImageData.data[i + 2];
        finalData.data[i + 3] = processedImageData.data[i + 3];
      } else {
        finalData.data[i + 3] = 0;
      }
    }

    ctx.putImageData(finalData, 0, 0);

    // Download
    const link = document.createElement('a');
    link.download = `${fileName}_no_bg.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [processedImageData, fileName]);

  /**
   * Reset everything
   */
  const reset = () => {
    setOriginalImage(null);
    setProcessedImageData(null);
    setFileName('');
    setError(null);
    setProcessingStatus('');
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  /**
   * Handle file input
   */
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadImage(file);
  }, [loadImage]);

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Hidden canvases */}
      <canvas ref={downloadCanvasRef} className="hidden" />
      <canvas ref={maskCanvasRef} className="hidden" />

      {!originalImage ? (
        /* Upload Section */
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload Image</h2>
          <p className="text-gray-600 mb-6">
            Upload an image to remove its background. The AI will automatically detect and remove the background,
            then you can refine the result with manual brush tools.
          </p>

          <div
            className={`relative ${dragActive ? 'ring-2 ring-blue-500' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <label
              htmlFor="bg-image-upload"
              className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className={`w-12 h-12 mb-4 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, WebP</p>
              </div>
              <input
                id="bg-image-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileInput}
              />
            </label>
          </div>
        </div>
      ) : (
        /* Editor Section */
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Background Remover</h2>
            <button onClick={reset} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Step 1: AI Removal */}
          {!processedImageData && (
            <div className="mb-6">
              <button
                onClick={removeBackgroundAI}
                disabled={isProcessing}
                className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {processingStatus || 'Processing...'}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    Remove Background with AI
                  </>
                )}
              </button>
              <p className="text-sm text-gray-500 mt-2 text-center">
                First-time use downloads a ~5MB AI model (cached for future use)
              </p>
            </div>
          )}

          {/* Step 2: Manual Refinement Tools */}
          {processedImageData && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-3">Refine Result</h3>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTool('erase')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTool === 'erase'
                        ? 'bg-red-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Erase
                  </button>
                  <button
                    onClick={() => setActiveTool('restore')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTool === 'restore'
                        ? 'bg-green-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Restore
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <span className="text-sm text-gray-600">Brush:</span>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <span className="text-sm text-gray-600 w-12">{brushSize}px</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {activeTool === 'erase' ? 'Click and drag to remove more areas' : 'Click and drag to restore removed areas'}
              </p>
            </div>
          )}

          {/* Zoom Controls */}
          {processedImageData && (
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Zoom:</span>
                <button
                  onClick={zoomOut}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Zoom out"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                  </svg>
                </button>
                <span className="text-sm font-medium w-16 text-center">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={zoomIn}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Zoom in"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <button
                  onClick={resetZoom}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Reset
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Scroll to zoom • Right-click drag to pan
              </p>
            </div>
          )}

          {/* Preview Canvas */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">
              {processedImageData ? 'Preview (click and drag to refine)' : 'Original Image'}
            </p>
            <div
              ref={canvasContainerRef}
              className="border border-gray-200 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center p-4"
              style={{ minHeight: '300px', maxHeight: '500px' }}
            >
              <canvas
                ref={previewCanvasRef}
                className={`max-w-full max-h-[500px] rounded shadow-sm ${processedImageData ? 'cursor-crosshair' : ''}`}
                style={{
                  transform: processedImageData ? `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)` : 'none',
                  transformOrigin: 'center center',
                  cursor: isPanning
                    ? 'grabbing'
                    : processedImageData
                      ? `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="${Math.max(8, brushSize * 2)}" height="${Math.max(8, brushSize * 2)}" viewBox="0 0 ${Math.max(8, brushSize * 2)} ${Math.max(8, brushSize * 2)}"><circle cx="${Math.max(4, brushSize)}" cy="${Math.max(4, brushSize)}" r="${Math.max(3, brushSize - 1)}" fill="none" stroke="${activeTool === 'erase' ? '%23ef4444' : '%2322c55e'}" stroke-width="2"/></svg>') ${Math.max(4, brushSize)} ${Math.max(4, brushSize)}, crosshair`
                      : 'default',
                }}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseLeave}
                onWheel={handleWheel}
                onContextMenu={handleContextMenu}
              />
            </div>
            {processedImageData && (
              <p className="text-xs text-gray-500 mt-2">Checkered pattern shows transparent areas</p>
            )}
          </div>

          {/* Download Button */}
          {processedImageData && (
            <button
              onClick={downloadImage}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PNG (Transparent)
            </button>
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
              Everything runs in your browser using AI. Your images are never uploaded to any server.
              The AI model is downloaded once (~5MB) and cached for future use.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
