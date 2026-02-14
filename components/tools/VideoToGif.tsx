'use client';

import { useState, useRef, useCallback } from 'react';
import { extractFrames, encodeGif } from '@/lib/gif-encoder';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function VideoToGif() {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [fps, setFps] = useState(12);
  const [outputWidth, setOutputWidth] = useState(480);
  const [gifBlob, setGifBlob] = useState<Blob | null>(null);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('video/')) return;
    if (videoSrc) URL.revokeObjectURL(videoSrc);
    if (gifUrl) URL.revokeObjectURL(gifUrl);
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setFileName(file.name);
    setGifBlob(null);
    setGifUrl(null);
    setProgress(0);
    setStartTime(0);
    setEndTime(0);
  }, [videoSrc, gifUrl]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleVideoLoaded = () => {
    const video = videoRef.current;
    if (!video) return;
    setVideoDuration(video.duration);
    setEndTime(Math.min(video.duration, 5));
  };

  const close = () => {
    if (videoSrc) URL.revokeObjectURL(videoSrc);
    if (gifUrl) URL.revokeObjectURL(gifUrl);
    setVideoSrc(null);
    setFileName('');
    setGifBlob(null);
    setGifUrl(null);
    setProgress(0);
    setStartTime(0);
    setEndTime(0);
    setVideoDuration(0);
  };

  const generate = async () => {
    const video = videoRef.current;
    if (!video || isProcessing) return;

    setIsProcessing(true);
    setProgress(0);
    if (gifUrl) URL.revokeObjectURL(gifUrl);
    setGifBlob(null);
    setGifUrl(null);

    try {
      // Pause video during frame extraction
      video.pause();

      const frames = await extractFrames(
        video,
        startTime,
        endTime,
        fps,
        outputWidth,
        (p) => setProgress(p * 0.5) // 0-50%
      );

      if (frames.length === 0) {
        setIsProcessing(false);
        return;
      }

      const width = frames[0].width;
      const height = frames[0].height;

      const gifBytes = encodeGif(frames, width, height, fps, (p) =>
        setProgress(50 + p * 0.5) // 50-100%
      );

      const blob = new Blob([gifBytes.buffer as ArrayBuffer], { type: 'image/gif' });
      const url = URL.createObjectURL(blob);
      setGifBlob(blob);
      setGifUrl(url);
      setProgress(100);
    } catch {
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const download = () => {
    if (!gifUrl) return;
    const a = document.createElement('a');
    a.href = gifUrl;
    a.download = fileName.replace(/\.[^.]+$/, '') + '.gif';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Upload screen
  if (!videoSrc) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <label
            htmlFor="video-upload"
            className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              dragActive
                ? 'border-violet-500 bg-violet-50'
                : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
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
                  strokeWidth="2"
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">MP4, WebM, MOV, or other video formats</p>
            </div>
            <input
              id="video-upload"
              type="file"
              className="hidden"
              accept="video/*"
              onChange={handleFileInput}
            />
          </label>
        </div>
      </div>
    );
  }

  // Editor screen
  const clipDuration = endTime - startTime;
  const estimatedFrames = Math.max(1, Math.floor(clipDuration * fps));

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 truncate">{fileName}</h2>
        <button
          onClick={close}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Video Preview */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            src={videoSrc}
            controls
            onLoadedMetadata={handleVideoLoaded}
            className="max-h-[400px] w-auto"
          />
        </div>
      </div>

      {/* Settings Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Time Range */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Time Range</h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-gray-500">Start (s)</label>
                <button
                  onClick={() => videoRef.current && setStartTime(Number(videoRef.current.currentTime.toFixed(2)))}
                  className="text-xs text-violet-600 hover:text-violet-700"
                  title="Use current video time"
                >
                  Use current time
                </button>
              </div>
              <input
                type="number"
                min={0}
                max={endTime}
                step={0.1}
                value={startTime}
                onChange={(e) => setStartTime(Math.max(0, Math.min(Number(e.target.value), endTime)))}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-gray-500">End (s)</label>
                <button
                  onClick={() => videoRef.current && setEndTime(Number(videoRef.current.currentTime.toFixed(2)))}
                  className="text-xs text-violet-600 hover:text-violet-700"
                  title="Use current video time"
                >
                  Use current time
                </button>
              </div>
              <input
                type="number"
                min={startTime}
                max={videoDuration}
                step={0.1}
                value={endTime}
                onChange={(e) => setEndTime(Math.max(startTime, Math.min(Number(e.target.value), videoDuration)))}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <p className="text-xs text-gray-400">
              Duration: {clipDuration.toFixed(1)}s &middot; ~{estimatedFrames} frames
            </p>
          </div>
        </div>

        {/* Output Settings */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Output</h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-gray-500">FPS</label>
                <span className="text-xs font-medium text-gray-700">{fps}</span>
              </div>
              <input
                type="range"
                min={5}
                max={30}
                value={fps}
                onChange={(e) => setFps(Number(e.target.value))}
                className="w-full accent-violet-600"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-gray-500">Width (px)</label>
                <span className="text-xs font-medium text-gray-700">{outputWidth}</span>
              </div>
              <input
                type="range"
                min={100}
                max={800}
                step={10}
                value={outputWidth}
                onChange={(e) => setOutputWidth(Number(e.target.value))}
                className="w-full accent-violet-600"
              />
            </div>
          </div>
        </div>

        {/* Generate */}
        <div className="bg-white rounded-lg shadow-md p-4 flex flex-col">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Generate</h3>
          <button
            onClick={generate}
            disabled={isProcessing || clipDuration <= 0}
            className="w-full px-4 py-2.5 bg-violet-600 text-white rounded-lg font-semibold hover:bg-violet-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {isProcessing ? 'Processing...' : 'Generate GIF'}
          </button>
          {(isProcessing || progress > 0) && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>{progress < 50 ? 'Extracting frames...' : 'Encoding GIF...'}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-violet-600 h-2 rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          <div className="mt-auto pt-3">
            <p className="text-xs text-gray-400">
              ~{estimatedFrames} frames at {fps} FPS, {outputWidth}px wide
            </p>
          </div>
        </div>
      </div>

      {/* GIF Preview */}
      {gifUrl && gifBlob && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Generated GIF</h3>
            <span className="text-sm text-gray-500">{formatFileSize(gifBlob.size)}</span>
          </div>
          <div className="flex justify-center bg-gray-100 rounded-lg p-4 mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={gifUrl} alt="Generated GIF" className="max-w-full max-h-[400px] rounded" />
          </div>
          <button
            onClick={download}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Download GIF
          </button>
        </div>
      )}

      {/* Info */}
      <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
        <p className="text-sm text-violet-700">
          <span className="font-semibold">100% Local Processing</span> — Your video is never uploaded. All frame extraction and GIF encoding happens in your browser.
        </p>
      </div>
    </div>
  );
}
