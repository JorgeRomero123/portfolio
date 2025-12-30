import HeicConverter from '@/components/tools/HeicConverter';

export const metadata = {
  title: 'HEIC to PNG Converter - Jorge Romero Romanis',
  description: 'Convert iPhone HEIC photos to PNG format for easy sharing and web use',
};

export default function HeicConverterPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          HEIC to PNG Converter
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
          Convert your iPhone photos (HEIC/HEIF format) to PNG files for universal compatibility.
          All conversions happen locally in your browser - your photos never leave your device.
        </p>
      </div>

      <HeicConverter />

      <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">About HEIC Format</h2>
        <div className="space-y-2 text-gray-700">
          <p>
            <strong>HEIC (High Efficiency Image Container)</strong> is Apple&apos;s default photo format
            for iOS devices. While it saves storage space with better compression, many platforms
            and devices don&apos;t support it.
          </p>
          <p className="mt-3">
            <strong>Why convert to PNG?</strong>
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Universal compatibility across all devices and platforms</li>
            <li>Works on websites and web applications</li>
            <li>No quality loss during conversion</li>
            <li>Easy to share and upload</li>
          </ul>
          <p className="mt-3 text-sm text-gray-600">
            <strong>Privacy:</strong> All conversions are performed on your device using your browser.
            Your photos are never uploaded to any server.
          </p>
        </div>
      </div>
    </div>
  );
}
