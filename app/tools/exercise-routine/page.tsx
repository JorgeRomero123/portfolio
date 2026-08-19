import Link from 'next/link';
import Rutina from '@/components/tools/Rutina';

export const metadata = {
  title: 'Mi Rutina - Jorge Romero',
  description: 'Rutina diaria con racha, niveles y modo depa o parque',
};

export default function RutinaPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/tools" className="mb-8 inline-flex items-center text-blue-600 hover:text-blue-800">
        <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Tools
      </Link>

      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-900 md:text-5xl">Mi Rutina</h1>
        <p className="mt-3 text-lg text-gray-600">
          Cinco minutos al día no se negocian. Todo lo demás depende de cómo amanezcas.
        </p>
      </div>

      <Rutina />
    </div>
  );
}
