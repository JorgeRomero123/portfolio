import Link from 'next/link';
import type { Viewport } from 'next';
import CameraTracer from '@/components/tools/CameraTracer';

export const metadata = {
  title: 'Camera Tracer | Jorge Romero Romanis',
  description: 'Overlay a reference image on your live camera with an opacity slider to trace real-world objects by hand. 100% local processing, optimized for iPhone.',
};

// viewport-fit=cover lets the full-screen camera view draw under the notch
// and home indicator, so the app/tools layout can pad it with safe-area insets.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function CameraTracerPage() {
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
          Camera Tracer
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Point your camera at a surface, overlay a reference image with adjustable opacity,
          and trace it by hand. Drag with one finger to move, pinch to resize.
        </p>
      </div>

      <CameraTracer />
    </div>
  );
}
