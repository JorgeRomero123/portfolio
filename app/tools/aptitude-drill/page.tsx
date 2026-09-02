import Link from 'next/link';
import AptitudeDrill from '@/components/tools/AptitudeDrill';

export const metadata = {
  title: 'Cognitive Aptitude Drill | Jorge Romero Romanis',
  description:
    'A timed 40-question cognitive aptitude practice test in the UCAT format — numerical reasoning, number series, deductive logic, spatial patterns and error checking, with every question worked through afterwards.',
};

export default function AptitudeDrillPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/tools"
        className="group mb-8 inline-flex items-center text-blue-600 hover:text-blue-700"
      >
        <svg
          className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Tools
      </Link>

      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
          Cognitive Aptitude Drill
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600">
          Forty questions in twenty minutes, in the shape employers actually send:
          numerical reasoning, number series, deductive logic, spatial patterns and
          error checking, with no verbal section. Every question is generated fresh,
          so no two runs repeat — and every answer is worked through afterwards.
        </p>
      </div>

      <AptitudeDrill />
    </div>
  );
}
