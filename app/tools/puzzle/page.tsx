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
        <h1 className="text-6xl md:text-8xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-pink-600">
          🧩
        </h1>
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
