import Link from 'next/link'
import GuitarraApp from '@/components/tools/guitarra/GuitarraApp'

export const metadata = {
  title: 'Aprende Guitarra - Jorge Romero',
  description:
    'Aprende guitarra desde cero por niveles: teoría, oído y práctica verificada con el micrófono. Todo en el navegador.',
}

export default function GuitarraPage() {
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
        <h1 className="text-lg font-bold text-gray-900">Aprende Guitarra</h1>
      </div>

      <GuitarraApp />
    </div>
  )
}
