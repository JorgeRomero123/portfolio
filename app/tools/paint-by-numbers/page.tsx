import Link from 'next/link';
import PaintByNumbers from '@/components/tools/PaintByNumbers';

export const metadata = {
  title: 'Paint by Numbers | Jorge Romero Romanis',
  description: 'Generate a paint-by-numbers template from any photo with numbered outline zones and acrylic paint mixing recipes. 100% local processing.',
};

export default function PaintByNumbersPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/tools"
        className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8 group"
      >
        <svg
          className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Back to Tools
      </Link>

      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Paint by Numbers
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Upload a photo to generate a paint-by-numbers template with numbered
          outline zones and acrylic paint mixing recipes — all processed locally
          in your browser.
        </p>
      </div>

      <PaintByNumbers />
    </div>
  );
}
