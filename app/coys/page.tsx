'use client';

import Image from 'next/image';

export default function CoysPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-slate-800 to-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <Image
            src="https://play-lh.googleusercontent.com/IdbW0FQfRtGD_XSGG-lpbS5gi-S-GCqVuNkbj8X3lG3FEDdBYCEZMM9gOzhigTAqoWM"
            alt="COYS"
            width={200}
            height={200}
            className="mx-auto rounded-lg"
            unoptimized
          />
        </div>

        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          COYS
        </h1>

        <p className="text-xl text-gray-300 mb-8">
          Come On You Spurs!
        </p>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <p className="text-gray-400 text-sm">
            Sometimes the answer is right in front of you...
            <br />
            Try expanding what you see.
          </p>
        </div>
      </div>
    </div>
  );
}
