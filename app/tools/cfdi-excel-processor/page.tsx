import Link from 'next/link';
import CfdiExcelProcessor from '@/components/tools/CfdiExcelProcessor';
import PasswordGate from '@/components/PasswordGate';

export const metadata = {
  title: 'Procesador de Excel CFDI | Jorge Romero Romanis',
  description: 'Procesa archivos Excel con datos CFDI, elimina columnas innecesarias y calcula totales automáticamente. 100% local en el navegador.',
};

export default function CfdiExcelProcessorPage() {
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

      <PasswordGate password="1234" storageKey="cfdi-excel-processor-access">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Procesador de Excel CFDI
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Sube múltiples archivos Excel con datos de facturas CFDI. Cada archivo
            se mostrará en pestañas organizadas por RFC Receptor, con totales
            calculados y opción de descarga individual.
          </p>
        </div>

        <CfdiExcelProcessor />
      </PasswordGate>
    </div>
  );
}
