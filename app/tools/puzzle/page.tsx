'use client';

import { useEffect } from 'react';

export default function PuzzlePage() {
  useEffect(() => {
    // Make the API call so users can inspect it in the network tab
    fetch('/api/please-dont-hack-me')
      .then(res => res.json())
      .then(data => {
        console.log('Response:', data);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 text-white flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <div className="mb-8 flex items-center justify-center gap-4">
          <h1 className="text-6xl md:text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-pink-600">
            🧩
          </h1>
          <svg
            className="w-16 h-16 md:w-20 md:h-20 opacity-30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 12.55a11 11 0 0 1 14.08 0" />
            <path d="M1.42 9a16 16 0 0 1 21.16 0" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <circle cx="12" cy="20" r="1" fill="currentColor" />
          </svg>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          The Puzzle
        </h2>
        <p className="text-xl text-gray-300">
          Can you solve it?
        </p>
      </div>
    </div>
  );
}
