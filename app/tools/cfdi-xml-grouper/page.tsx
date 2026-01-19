import Link from 'next/link';
import CfdiXmlGrouper from '@/components/tools/CfdiXmlGrouper';
import PasswordGate from '@/components/PasswordGate';

export const metadata = {
  title: 'CFDI XML Grouper | Jorge Romero Romanis',
  description: 'Agrupa facturas electrónicas CFDI por RFC del emisor y descarga como ZIP. Procesamiento 100% local en el navegador.',
};

export default function CfdiXmlGrouperPage() {
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
        Volver a Herramientas
      </Link>

      <PasswordGate password="1234" storageKey="cfdi-xml-grouper-access">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Agrupador de CFDI por RFC
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Sube múltiples archivos XML de facturas electrónicas CFDI y agrúpalos
            automáticamente por el RFC del emisor. Descarga cada grupo como un
            archivo ZIP.
          </p>
        </div>

        <CfdiXmlGrouper />
      </PasswordGate>
    </div>
  );
}
