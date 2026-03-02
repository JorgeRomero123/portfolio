'use client';

import { useState, useRef, useCallback } from 'react';
import React from 'react';
import ReactMarkdown from 'react-markdown';

export default function CVTailor() {
  const [vacancy, setVacancy] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }
    setCvFile(file);
    setError('');
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleGenerate = async () => {
    if (!vacancy.trim()) {
      setError('Please paste a job vacancy description.');
      return;
    }
    if (!cvFile) {
      setError('Please upload your CV as a PDF.');
      return;
    }

    setLoading(true);
    setError('');
    setMarkdown('');

    try {
      const formData = new FormData();
      formData.append('vacancy', vacancy);
      formData.append('cv', cvFile);

      const res = await fetch('/api/tailor-cv', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        return;
      }

      setMarkdown(data.markdown);
    } catch {
      setError('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = async () => {
    const { pdf } = await import('@react-pdf/renderer');
    const { default: CVPdfDocument } = await import('./cv-pdf');
    const doc = React.createElement(CVPdfDocument, { markdown });
    const blob = await pdf(doc as any).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tailored-cv.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Vacancy Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Job Vacancy Description
        </label>
        <textarea
          value={vacancy}
          onChange={(e) => setVacancy(e.target.value)}
          placeholder="Paste the full job posting here..."
          rows={8}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y text-gray-900"
        />
      </div>

      {/* CV Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your CV (PDF)
        </label>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dragging
              ? 'border-blue-500 bg-blue-50'
              : cvFile
                ? 'border-green-400 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          {cvFile ? (
            <div className="text-green-700">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <p className="font-medium">{cvFile.name}</p>
              <p className="text-sm text-green-600 mt-1">Click or drop to replace</p>
            </div>
          ) : (
            <div className="text-gray-500">
              <svg className="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="font-medium">Drop your CV here or click to browse</p>
              <p className="text-sm mt-1">PDF files only</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            Generating...
          </>
        ) : (
          'Generate Tailored CV'
        )}
      </button>

      {/* Output */}
      {markdown && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Download as PDF
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 prose prose-sm max-w-none">
            <ReactMarkdown>{markdown}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
