'use client';

import { useState } from 'react';

interface UploadedPhoto {
  id: string;
  url: string;
  title: string;
  stats: {
    originalSize: number;
    optimizedSize: number;
    compressionRatio: string;
  };
}

interface FileWithMetadata {
  file: File;
  title: string;
  description: string;
  category: string;
}

export default function PhotoUpload() {
  const [files, setFiles] = useState<FileWithMetadata[]>([]);
  const [defaultCategory, setDefaultCategory] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const newFiles: FileWithMetadata[] = selectedFiles.map((file) => ({
      file,
      title: file.name.replace(/\.[^.]+$/, ''), // Auto-generate title from filename
      description: '',
      category: defaultCategory,
    }));

    setFiles(newFiles);
    setError(null);
    setUploadedPhotos([]);
  };

  const updateFileMetadata = (index: number, field: keyof FileWithMetadata, value: string) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, [field]: value } : f))
    );
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const uploadSingleFile = async (fileData: FileWithMetadata): Promise<UploadedPhoto> => {
    const { file, title, description, category } = fileData;

    // Step 1: Request pre-signed upload URL
    setCurrentStep('Requesting upload URL...');
    setUploadProgress(10);

    const urlResponse = await fetch('/api/gallery/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
      }),
    });

    if (!urlResponse.ok) {
      const errorData = await urlResponse.json();
      throw new Error(errorData.error || 'Failed to get upload URL');
    }

    const { uploadUrl, key } = await urlResponse.json();

    // Step 2: Upload file directly to R2
    setCurrentStep('Uploading to R2...');
    setUploadProgress(30);

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file to R2');
    }

    setUploadProgress(60);

    // Step 3: Process the uploaded image
    setCurrentStep('Processing image (converting to WebP)...');
    setUploadProgress(70);

    const processResponse = await fetch('/api/gallery/process-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key,
        title: title.trim(),
        description: description.trim() || undefined,
        category: category.trim() || 'Uncategorized',
      }),
    });

    if (!processResponse.ok) {
      const errorData = await processResponse.json();
      throw new Error(errorData.error || 'Failed to process image');
    }

    const result = await processResponse.json();
    setUploadProgress(100);

    return {
      id: result.photo.id,
      url: result.photo.url,
      title: result.photo.title,
      stats: result.stats,
    };
  };

  const handleBulkUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one file');
      return;
    }

    // Validate all files have titles
    const missingTitles = files.some((f) => !f.title.trim());
    if (missingTitles) {
      setError('All files must have a title');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadedPhotos([]);
    setCurrentFileIndex(0);

    const uploadedResults: UploadedPhoto[] = [];

    for (let i = 0; i < files.length; i++) {
      setCurrentFileIndex(i);
      try {
        const result = await uploadSingleFile(files[i]);
        uploadedResults.push(result);
        setUploadedPhotos([...uploadedResults]);
      } catch (err) {
        console.error(`Upload error for file ${i + 1}:`, err);
        setError(`Failed to upload "${files[i].title}": ${err instanceof Error ? err.message : 'Unknown error'}`);
        setIsUploading(false);
        return;
      }
    }

    // All uploads successful
    setCurrentStep('All uploads complete!');
    setIsUploading(false);

    // Reset form
    setFiles([]);
    const fileInput = document.getElementById('bulk-file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Bulk File Upload */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Upload Gallery Photos</h2>

        <div className="space-y-4">
          {/* Default Category */}
          <div>
            <label htmlFor="default-category" className="block text-sm font-medium text-gray-700 mb-2">
              Default Category (optional)
            </label>
            <input
              id="default-category"
              type="text"
              value={defaultCategory}
              onChange={(e) => setDefaultCategory(e.target.value)}
              disabled={isUploading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Travel, Nature, Architecture"
            />
            <p className="text-xs text-gray-500 mt-1">
              This category will be applied to all uploaded photos (you can change it per photo below)
            </p>
          </div>

          {/* File Input */}
          <div>
            <label
              htmlFor="bulk-file-upload"
              className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg
                  className="w-12 h-12 mb-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                {files.length > 0 ? (
                  <div className="text-center">
                    <p className="mb-2 text-sm font-semibold text-gray-700">
                      {files.length} file{files.length > 1 ? 's' : ''} selected
                    </p>
                    <p className="text-xs text-gray-500">
                      Total: {formatFileSize(files.reduce((sum, f) => sum + f.file.size, 0))}
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">Multiple photos (PNG, JPG, HEIC)</p>
                  </>
                )}
              </div>
              <input
                id="bulk-file-upload"
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                disabled={isUploading}
              />
            </label>
          </div>

          {/* File List with Metadata */}
          {files.length > 0 && !isUploading && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              <h3 className="font-medium text-gray-900">Files to Upload ({files.length})</h3>
              {files.map((fileData, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{fileData.file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(fileData.file.size)}</p>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    type="text"
                    value={fileData.title}
                    onChange={(e) => updateFileMetadata(index, 'title', e.target.value)}
                    placeholder="Title *"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    value={fileData.description}
                    onChange={(e) => updateFileMetadata(index, 'description', e.target.value)}
                    placeholder="Description (optional)"
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={fileData.category}
                    onChange={(e) => updateFileMetadata(index, 'category', e.target.value)}
                    placeholder="Category (optional)"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Upload Button */}
          {files.length > 0 && (
            <button
              onClick={handleBulkUpload}
              disabled={isUploading || files.some((f) => !f.title.trim())}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading
                ? `Uploading ${currentFileIndex + 1}/${files.length}...`
                : `Upload ${files.length} Photo${files.length > 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      {isUploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-900 mb-2">
              Processing: {files[currentFileIndex]?.title} ({currentFileIndex + 1} of {files.length})
            </p>
            <div className="flex justify-between text-sm text-gray-700 mb-1">
              <span>{currentStep}</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
          {/* Overall Progress */}
          <div>
            <p className="text-xs text-gray-600 mb-1">Overall Progress</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentFileIndex / files.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Success */}
      {uploadedPhotos.length > 0 && !isUploading && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start mb-4">
            <svg
              className="w-6 h-6 text-green-600 mt-0.5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <div className="flex-1">
              <p className="font-semibold text-green-900 mb-2">
                {uploadedPhotos.length} photo{uploadedPhotos.length > 1 ? 's' : ''} uploaded successfully!
              </p>
            </div>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {uploadedPhotos.map((photo) => (
              <div key={photo.id} className="text-sm bg-white rounded p-3">
                <p className="font-medium text-gray-900">{photo.title}</p>
                <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                  <p>Original: {formatFileSize(photo.stats.originalSize)}</p>
                  <p>Optimized: {formatFileSize(photo.stats.optimizedSize)}</p>
                  <p>Compression: {photo.stats.compressionRatio}</p>
                </div>
              </div>
            ))}
          </div>
          <a
            href="/gallery"
            target="_blank"
            className="inline-block mt-4 text-sm text-blue-600 hover:text-blue-700 font-semibold"
          >
            View in Gallery →
          </a>
        </div>
      )}
    </div>
  );
}
