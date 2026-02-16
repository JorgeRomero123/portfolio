'use client';

import { useState, useCallback } from 'react';

interface TranscriptEntry {
  text: string;
  offset: number;
  duration: number;
}

function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function YouTubeTranscript() {
  const [url, setUrl] = useState('');
  const [transcript, setTranscript] = useState<TranscriptEntry[] | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(true);

  const fetchTranscript = useCallback(async () => {
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setTranscript(null);
    setVideoId(null);

    try {
      const res = await fetch('/api/youtube-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to fetch transcript');
        return;
      }

      setTranscript(data.transcript);
      setVideoId(data.videoId);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [url]);

  const getPlainText = useCallback(() => {
    if (!transcript) return '';
    if (showTimestamps) {
      return transcript.map((entry) => `[${formatTimestamp(entry.offset)}] ${entry.text}`).join('\n');
    }
    return transcript.map((entry) => entry.text).join(' ');
  }, [transcript, showTimestamps]);

  const handleCopy = useCallback(async () => {
    const text = getPlainText();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [getPlainText]);

  const handleDownload = useCallback(() => {
    const text = getPlainText();
    const blob = new Blob([text], { type: 'text/plain' });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `transcript-${videoId || 'youtube'}.txt`;
    a.click();
    URL.revokeObjectURL(downloadUrl);
  }, [getPlainText, videoId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTranscript();
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* URL Input */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-3">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste YouTube URL here (e.g. https://youtube.com/watch?v=...)"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="px-8 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
          >
            {loading ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                Fetching...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16l13-8L7 4z" />
                </svg>
                Get Transcript
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-medium">Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Results */}
      {transcript && (
        <div>
          {/* Video Preview */}
          {videoId && (
            <div className="mb-6 rounded-lg overflow-hidden shadow-md">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {transcript.length} segments
              </span>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTimestamps}
                  onChange={(e) => setShowTimestamps(e.target.checked)}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                Show timestamps
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download .txt
              </button>
            </div>
          </div>

          {/* Transcript Content */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm max-h-[600px] overflow-y-auto">
            {showTimestamps ? (
              <div className="divide-y divide-gray-100">
                {transcript.map((entry, i) => (
                  <div key={i} className="flex gap-4 px-4 py-3 hover:bg-gray-50">
                    <span className="text-xs font-mono text-red-600 bg-red-50 px-2 py-1 rounded h-fit whitespace-nowrap">
                      {formatTimestamp(entry.offset)}
                    </span>
                    <span className="text-gray-800 text-sm leading-relaxed">{entry.text}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-6 text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                {transcript.map((entry) => entry.text).join(' ')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!transcript && !error && !loading && (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="text-lg">Paste a YouTube URL above to get started</p>
          <p className="text-sm mt-2">Supports youtube.com, youtu.be, and YouTube Shorts links</p>
        </div>
      )}
    </div>
  );
}
