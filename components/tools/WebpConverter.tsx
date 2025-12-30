'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ConvertedFile {
  name: string;
  url: string;
  thumbnailUrl: string;
  size: number;
  thumbnailSize: number;
  originalSize: number;
  compressionRatio: string;
}

export default function WebpConverter() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [convertedFiles, setConvertedFiles] = useState<ConvertedFile[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file =>
      file.type.startsWith('image/')
    );

    if (imageFiles.length === 0) {
      setError('Please select image files only');
      return;
    }

    setSelectedFiles(imageFiles);
    setError(null);
    setConvertedFiles([]);
  };

  const convertFiles = async () => {
    if (selectedFiles.length === 0) return;

    setIsConverting(true);
    setError(null);
    setProgress({ current: 0, total: selectedFiles.length });
    const converted: ConvertedFile[] = [];

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setProgress({ current: i + 1, total: selectedFiles.length });

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/convert-webp', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to convert ${file.name}`);
        }

        const data = await response.json();

        // Convert base64 to blob URLs
        const imageBlob = await fetch(`data:image/webp;base64,${data.image}`).then(r => r.blob());
        const thumbnailBlob = await fetch(`data:image/webp;base64,${data.thumbnail}`).then(r => r.blob());

        const imageUrl = URL.createObjectURL(imageBlob);
        const thumbnailUrl = URL.createObjectURL(thumbnailBlob);
        const fileName = file.name.replace(/\.[^.]+$/, '.webp');

        converted.push({
          name: fileName,
          url: imageUrl,
          thumbnailUrl,
          size: data.metadata.size,
          thumbnailSize: data.thumbnailMetadata.size,
          originalSize: file.size,
          compressionRatio: data.compressionRatio,
        });
      }

      setConvertedFiles(converted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
    } finally {
      setIsConverting(false);
      setProgress(null);
    }
  };

  const downloadFile = (file: ConvertedFile, isThumbnail = false) => {
    const a = document.createElement('a');
    a.href = isThumbnail ? file.thumbnailUrl : file.url;
    a.download = isThumbnail ? file.name.replace('.webp', '-thumb.webp') : file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAll = () => {
    convertedFiles.forEach(file => downloadFile(file));
  };

  const reset = () => {
    setSelectedFiles([]);
    setConvertedFiles([]);
    setError(null);
    setProgress(null);
    // Revoke object URLs to free memory
    convertedFiles.forEach(file => {
      URL.revokeObjectURL(file.url);
      URL.revokeObjectURL(file.thumbnailUrl);
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload Images</h2>

        <div className="mb-6">
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg
                className="w-12 h-12 mb-4 text-gray-400"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 16"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                />
              </svg>
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">Any image format (JPG, PNG, HEIC, etc.)</p>
            </div>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
            />
          </label>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Selected Files ({selectedFiles.length})
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-sm text-gray-700 truncate">{file.name}</span>
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                      {file.type.split('/')[1]?.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 ml-2">{formatFileSize(file.size)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={convertFiles}
            disabled={selectedFiles.length === 0 || isConverting}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isConverting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Converting {progress?.current || 0}/{progress?.total || 0}...
              </span>
            ) : (
              `Convert to WebP`
            )}
          </button>

          {(selectedFiles.length > 0 || convertedFiles.length > 0) && (
            <button
              onClick={reset}
              disabled={isConverting}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {convertedFiles.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">
              Converted Files ({convertedFiles.length})
            </h3>
            <button
              onClick={downloadAll}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors text-sm"
            >
              Download All Images
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {convertedFiles.map((file, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="relative aspect-square bg-gray-100">
                  <Image
                    src={file.url}
                    alt={file.name}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold text-gray-900 truncate mb-2">{file.name}</p>

                  {/* Stats */}
                  <div className="space-y-1 mb-3 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Original:</span>
                      <span className="font-medium">{formatFileSize(file.originalSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Optimized:</span>
                      <span className="font-medium text-green-600">{formatFileSize(file.size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saved:</span>
                      <span className="font-medium text-blue-600">{file.compressionRatio}</span>
                    </div>
                  </div>

                  {/* Download Buttons */}
                  <div className="space-y-2">
                    <button
                      onClick={() => downloadFile(file)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
                    >
                      Download Image
                    </button>
                    <button
                      onClick={() => downloadFile(file, true)}
                      className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors text-sm"
                    >
                      Download Thumbnail
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
