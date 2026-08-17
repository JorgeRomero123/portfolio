import Link from 'next/link'
import CantoApp from '@/components/tools/canto/CantoApp'

export const metadata = {
  title: 'Aprende a Cantar - Jorge Romero',
  description:
    'Aprende a cantar desde cero por niveles: teoría, oído y afinación verificada con el micrófono. Los ejercicios se transponen a tu rango vocal.',
}

export default function CantoPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-2xl mx-auto mb-5 flex items-center justify-between gap-4">
        <Link
          href="/tools"
          className="inline-flex items-center text-sm font-medium text-gray-400 hover:text-gray-900 transition-colors"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Tools
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Aprende a Cantar</h1>
      </div>

      <CantoApp />
    </div>
  )
}
