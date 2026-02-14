'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface TileData {
  row: number;
  col: number;
  url: string;
  blob: Blob;
}

export default function ImageSplitter() {
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rows, setRows] = useState<number>(1);
  const [cols, setCols] = useState<number>(3);
  const [tiles, setTiles] = useState<TileData[]>([]);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        setFileName(file.name.replace(/\.[^/.]+$/, ''));
        setRows(1);
        setCols(3);
        setTiles([]);
        setIsProcessing(false);
      };
      img.onerror = () => setIsProcessing(false);
      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  }, []);

  // Draw preview with grid overlay
  useEffect(() => {
    if (!originalImage || !previewCanvasRef.current) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Scale to fit container while preserving aspect ratio
    const maxW = 900;
    const maxH = 600;
    const scale = Math.min(maxW / originalImage.width, maxH / originalImage.height, 1);
    canvas.width = originalImage.width * scale;
    canvas.height = originalImage.height * scale;

    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

    // Draw grid lines
    const tileW = canvas.width / cols;
    const tileH = canvas.height / rows;

    ctx.lineWidth = 2;

    // Draw vertical lines
    for (let c = 1; c < cols; c++) {
      const x = Math.round(c * tileW);
      // Dark stroke
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
      // White dashed overlay
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Draw horizontal lines
    for (let r = 1; r < rows; r++) {
      const y = Math.round(r * tileH);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    ctx.setLineDash([]);
  }, [originalImage, rows, cols]);

  const splitImage = useCallback(async () => {
    if (!originalImage) return;

    setIsProcessing(true);

    // Revoke old tile URLs
    tiles.forEach((t) => URL.revokeObjectURL(t.url));

    const tileW = Math.floor(originalImage.width / cols);
    const tileH = Math.floor(originalImage.height / rows);

    const newTiles: TileData[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const sx = c * tileW;
        const sy = r * tileH;
        // Last column/row picks up remaining pixels
        const sw = c === cols - 1 ? originalImage.width - sx : tileW;
        const sh = r === rows - 1 ? originalImage.height - sy : tileH;

        const tileCanvas = document.createElement('canvas');
        tileCanvas.width = sw;
        tileCanvas.height = sh;
        const tileCtx = tileCanvas.getContext('2d');
        if (!tileCtx) continue;

        tileCtx.drawImage(originalImage, sx, sy, sw, sh, 0, 0, sw, sh);

        const blob = await new Promise<Blob>((resolve) => {
          tileCanvas.toBlob((b) => resolve(b!), 'image/png');
        });

        newTiles.push({
          row: r,
          col: c,
          url: URL.createObjectURL(blob),
          blob,
        });
      }
    }

    setTiles(newTiles);
    setIsProcessing(false);
  }, [originalImage, rows, cols, tiles]);

  const downloadTile = useCallback(
    (tile: TileData) => {
      const link = document.createElement('a');
      link.download = `${fileName}_r${tile.row + 1}_c${tile.col + 1}.png`;
      link.href = tile.url;
      link.click();
    },
    [fileName]
  );

  const downloadAll = useCallback(() => {
    tiles.forEach((tile, i) => {
      setTimeout(() => downloadTile(tile), i * 150);
    });
  }, [tiles, downloadTile]);

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
    tiles.forEach((t) => URL.revokeObjectURL(t.url));
    setOriginalImage(null);
    setFileName('');
    setRows(1);
    setCols(3);
    setTiles([]);
  };

  const tileW = originalImage ? Math.floor(originalImage.width / cols) : 0;
  const tileH = originalImage ? Math.floor(originalImage.height / rows) : 0;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {!originalImage ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload Image</h2>
          <p className="text-gray-600 mb-6">
            Upload a large image (e.g. a panorama) to split into a grid of smaller images.
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
                <p className="text-xs text-gray-500">PNG, JPG, WebP, GIF</p>
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
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Loading image...
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Split Image</h2>
              <p className="text-sm text-gray-500 mt-1">{fileName}</p>
            </div>
            <button
              onClick={reset}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Preview */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center p-4">
              <canvas
                ref={previewCanvasRef}
                className="max-w-full rounded shadow-sm"
                style={{ imageRendering: 'auto' }}
              />
            </div>
          </div>

          {/* Grid Controls */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Rows</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRows((r) => Math.max(1, r - 1))}
                  disabled={rows <= 1}
                  className="w-9 h-9 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold text-lg flex items-center justify-center"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={rows}
                  onChange={(e) => {
                    const v = Math.max(1, Math.min(10, Number(e.target.value) || 1));
                    setRows(v);
                    setTiles([]);
                  }}
                  className="w-16 text-center border border-gray-300 rounded-md py-1.5 text-gray-900"
                />
                <button
                  onClick={() => setRows((r) => Math.min(10, r + 1))}
                  disabled={rows >= 10}
                  className="w-9 h-9 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold text-lg flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Columns</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCols((c) => Math.max(1, c - 1))}
                  disabled={cols <= 1}
                  className="w-9 h-9 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold text-lg flex items-center justify-center"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={cols}
                  onChange={(e) => {
                    const v = Math.max(1, Math.min(10, Number(e.target.value) || 1));
                    setCols(v);
                    setTiles([]);
                  }}
                  className="w-16 text-center border border-gray-300 rounded-md py-1.5 text-gray-900"
                />
                <button
                  onClick={() => setCols((c) => Math.min(10, c + 1))}
                  disabled={cols >= 10}
                  className="w-9 h-9 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold text-lg flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Tile dimensions */}
          <p className="text-sm text-gray-500 mb-6">
            Each tile: {tileW} x {tileH} px &middot; {rows * cols} tiles total
          </p>

          {/* Split button */}
          <button
            onClick={splitImage}
            disabled={isProcessing}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center mb-6"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Splitting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                Split Image
              </>
            )}
          </button>

          {/* Tile previews */}
          {tiles.length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Tiles ({tiles.length})
                </h3>
                <button
                  onClick={downloadAll}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center text-sm"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download All
                </button>
              </div>

              <div
                className="grid gap-3"
                style={{
                  gridTemplateColumns: `repeat(${cols}, 1fr)`,
                }}
              >
                {tiles.map((tile) => (
                  <div
                    key={`${tile.row}-${tile.col}`}
                    className="group relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={tile.url}
                      alt={`Tile R${tile.row + 1} C${tile.col + 1}`}
                      className="w-full h-auto block"
                    />
                    <button
                      onClick={() => downloadTile(tile)}
                      className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                    >
                      <span className="bg-white text-gray-900 px-3 py-1.5 rounded-md text-xs font-semibold shadow">
                        Download
                      </span>
                    </button>
                    <p className="text-[10px] text-gray-400 text-center py-1">
                      R{tile.row + 1} C{tile.col + 1}
                    </p>
                  </div>
                ))}
              </div>
            </div>
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
              Tiles are exported as PNG files.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
