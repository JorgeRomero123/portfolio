import WheelOfFortune from '@/components/tools/WheelOfFortune';
import Link from 'next/link';

export const metadata = {
  title: 'Wheel of Fortune | Jorge Romero Romanis',
  description: 'Spin the wheel to make random decisions',
};

export default function WheelOfFortunePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link
          href="/tools"
          className="text-blue-600 hover:text-blue-700 font-semibold"
        >
          ← Back to Tools
        </Link>
      </div>

      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Wheel of Fortune
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Can't decide? Let fate choose for you! Add your options and spin the wheel.
        </p>
      </div>

      <WheelOfFortune />
    </div>
  );
}
