'use client';

import { useState } from 'react';
import JSZip from 'jszip';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function PinterestDownloader() {
  const [url, setUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState('');
  const [zipSize, setZipSize] = useState(0);

  const fetchImages = async () => {
    if (!url.trim() || isLoading) return;

    setIsLoading(true);
    setError('');
    setImages([]);
    setZipSize(0);

    try {
      const res = await fetch('/api/pinterest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to fetch images');
        return;
      }

      setImages(data.images);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadAll = async () => {
    if (images.length === 0 || isDownloading) return;

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const zip = new JSZip();

      for (let i = 0; i < images.length; i++) {
        try {
          const res = await fetch(
            `/api/pinterest/proxy?url=${encodeURIComponent(images[i])}`
          );
          if (res.ok) {
            const blob = await res.blob();
            const filename =
              images[i].split('/').pop() || `image-${i + 1}.jpg`;
            zip.file(filename, blob);
          }
        } catch {
          // Skip failed images
        }
        setDownloadProgress(((i + 1) / images.length) * 100);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      setZipSize(content.size);
      const blobUrl = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'pinterest-images.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      setError('Failed to create zip file.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* URL Input */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchImages()}
            placeholder="https://www.pinterest.com/username/board-name/"
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={fetchImages}
            disabled={isLoading || !url.trim()}
            className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm whitespace-nowrap"
          >
            {isLoading ? 'Fetching...' : 'Fetch Images'}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="bg-white rounded-lg shadow-md p-8 flex items-center justify-center">
          <div className="flex items-center gap-3 text-gray-500">
            <svg
              className="w-5 h-5 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-sm">Fetching images from Pinterest...</span>
          </div>
        </div>
      )}

      {/* Results */}
      {images.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Found {images.length} images
            </h3>
            <button
              onClick={downloadAll}
              disabled={isDownloading}
              className="px-5 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {isDownloading ? 'Downloading...' : 'Download All as ZIP'}
            </button>
          </div>

          {/* Download progress */}
          {(isDownloading || zipSize > 0) && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>
                  {isDownloading
                    ? 'Downloading images...'
                    : `Downloaded — ${formatFileSize(zipSize)}`}
                </span>
                <span>{Math.round(downloadProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-200"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Image grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {images.map((src, i) => (
              <div
                key={i}
                className="aspect-square bg-gray-100 rounded-lg overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Pin ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-700">
          <span className="font-semibold">Note</span> — Only images from the
          initial page load are fetched (typically 25–50 pins). Private boards
          are not supported. Pinterest may block requests at any time.
        </p>
      </div>
    </div>
  );
}
