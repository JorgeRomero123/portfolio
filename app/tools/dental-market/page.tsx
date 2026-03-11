import Link from 'next/link';
import DentalMarketDashboard from '@/components/tools/DentalMarketDashboard';
import PasswordGate from '@/components/PasswordGate';

export const metadata = {
  title: 'Estudio de Mercado Dental en México | Jorge Romero Romanis',
  description: 'Panorama del mercado dental y de laboratorios dentales en México — métricas, estructura, servicios y tendencias',
};

export default function DentalMarketPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/tools"
        className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8 group"
      >
        <svg
          className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver a Herramientas
      </Link>

      <PasswordGate password="1234" storageKey="dental-market-access">
        <DentalMarketDashboard />
      </PasswordGate>
    </div>
  );
}
