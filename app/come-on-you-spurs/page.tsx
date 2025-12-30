'use client';

import { useState, useEffect } from 'react';

export default function ComeonYouSpurs() {
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('Try looking in another tab...');
  }, []);

  // The password is hidden in the HTML source of the /coys page
  const correctPassword = 'Harry Potter 7';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password === correctPassword) {
      setIsUnlocked(true);
      setError('');
    } else {
      setError('Incorrect password. Keep searching...');
      setPassword('');
    }
  };

  if (isUnlocked) {
    const whatsappMessage = encodeURIComponent("dame mi premio por favor, Harry Potter 7");
    const whatsappLink = `https://wa.me/527771343900?text=${whatsappMessage}`;

    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-blue-900 to-gray-900 text-white flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            🎉 Congratulations! 🎉
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-12">
            You've successfully completed the puzzle!
          </p>

          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-lg text-lg"
          >
            Claim Your Prize 🎁
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 text-white flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
              🔐 Access Required
            </h1>
            <p className="text-gray-300">
              To continue, you must find the password.
            </p>
            <p className="text-sm text-gray-400 mt-2">
              The password is hidden somewhere here...
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="text"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                placeholder="Enter the secret password..."
                autoComplete="off"
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
            >
              Unlock
            </button>
          </form>

          {/* Hidden password - only visible in HTML source */}
          <div style={{ display: 'none' }} data-secret="password">
            Harry Potter 7
          </div>

        </div>
      </div>
    </div>
  );
}
