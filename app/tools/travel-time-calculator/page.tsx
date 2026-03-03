import Link from 'next/link';
import TravelTimeCalculator from '@/components/tools/TravelTimeCalculator';
import PasswordGate from '@/components/PasswordGate';

export const metadata = {
  title: 'Travel Time Calculator | Jorge Romero Romanis',
  description: 'Set a target on the map, add origin points, and calculate driving times from each origin to the target.',
};

export default function TravelTimeCalculatorPage() {
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

      <PasswordGate password="1234" storageKey="travel-time-calculator-access">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Travel Time Calculator
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Set a destination on the map, add multiple origin points by clicking,
            and calculate the driving time from each origin to the target.
          </p>
        </div>

        <TravelTimeCalculator />
      </PasswordGate>
    </div>
  );
}
