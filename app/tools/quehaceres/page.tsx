import Link from 'next/link';
import QuehaceresTracker from '@/components/tools/QuehaceresTracker';

export const metadata = {
  title: 'Quehaceres del Depa - Jorge Romero',
  description: 'Tracker de limpieza del departamento con recordatorios por correo',
  robots: { index: false, follow: false },
};

export default function QuehaceresPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/tools"
        className="mb-8 inline-flex items-center text-blue-600 hover:text-blue-800"
      >
        <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Tools
      </Link>

      <div className="mb-10 text-center">
        <h1 className="mb-3 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
          Quehaceres del Depa
        </h1>
        <p className="mx-auto max-w-xl text-lg text-gray-600">
          Cada quehacer tiene su propia frecuencia. Márcalo como hecho y el reloj se reinicia solo.
        </p>
      </div>

      <QuehaceresTracker />
    </div>
  );
}
