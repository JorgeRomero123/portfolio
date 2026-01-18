import Link from 'next/link';
import BackgroundRemover from '@/components/tools/BackgroundRemover';

export const metadata = {
  title: 'Background Remover | Jorge Romero Romanis',
  description: 'Remove image backgrounds with AI. Automatic detection with manual refinement tools. 100% free, runs locally in your browser.',
};

export default function BackgroundRemoverPage() {
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
          Background Remover
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Remove backgrounds from images using AI. The model automatically detects subjects,
          then you can refine the result with brush tools. Completely free and private.
        </p>
      </div>

      <BackgroundRemover />
    </div>
  );
}
