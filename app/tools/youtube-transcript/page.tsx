import Link from 'next/link';
import YouTubeTranscript from '@/components/tools/YouTubeTranscript';
import PasswordGate from '@/components/PasswordGate';

export const metadata = {
  title: 'YouTube Transcript | Jorge Romero Romanis',
  description: 'Extract transcripts and captions from any YouTube video',
};

export default function YouTubeTranscriptPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/tools"
        className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8 group"
      >
        <svg
          className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Tools
      </Link>

      <PasswordGate password="1234" storageKey="youtube-transcript-access">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            YouTube Transcript
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Paste a YouTube link and instantly get the full transcript with timestamps.
            Copy it as plain text or download as a file.
          </p>
        </div>

        <YouTubeTranscript />
      </PasswordGate>
    </div>
  );
}
