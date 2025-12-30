import WebpConverter from '@/components/tools/WebpConverter';

export const metadata = {
  title: 'Image to WebP Converter - Jorge Romero Romanis',
  description: 'Convert any image to optimized WebP format with automatic thumbnail generation',
};

export default function WebpConverterPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          Image to WebP Converter
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
          Convert your images to WebP format for maximum compression and quality.
          Automatically generates optimized images plus thumbnails. Perfect for web use!
        </p>
      </div>

      <WebpConverter />

      <div className="mt-12 grid md:grid-cols-2 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Why WebP?</h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <span><strong>Smaller files:</strong> Up to 30% smaller than JPEG/PNG</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <span><strong>Better quality:</strong> Superior compression algorithm</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <span><strong>Universal support:</strong> Works on all modern browsers</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <span><strong>Faster loading:</strong> Smaller files = faster websites</span>
            </li>
          </ul>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">What You Get</h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="text-green-600 mr-2">→</span>
              <span><strong>Optimized image:</strong> High-quality WebP conversion</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">→</span>
              <span><strong>Thumbnail:</strong> 400x400px preview image</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">→</span>
              <span><strong>Compression stats:</strong> See how much space you saved</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">→</span>
              <span><strong>Batch processing:</strong> Convert multiple images at once</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Supported Formats</h2>
        <p className="text-gray-700 mb-2">
          Convert from: <strong>JPG, JPEG, PNG, HEIC, HEIF, GIF, BMP, TIFF, SVG</strong> and more
        </p>
        <p className="text-sm text-gray-600 mt-3">
          <strong>Privacy:</strong> All conversions are performed on the server with secure processing.
          Your images are immediately deleted after conversion and never stored.
        </p>
      </div>
    </div>
  );
}
