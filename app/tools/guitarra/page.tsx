import Link from 'next/link'
import GuitarraApp from '@/components/tools/guitarra/GuitarraApp'

export const metadata = {
  title: 'Aprende Guitarra - Jorge Romero',
  description:
    'Afinador por micrófono, biblioteca de acordes, entrenador de cambios, diapasón interactivo y rutina diaria de práctica. Todo en el navegador.',
}

export default function GuitarraPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/tools"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-8"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Tools
      </Link>

      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Aprende Guitarra
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Afinador, acordes, diapasón y una rutina diaria. Desde cero y sin salir del navegador.
        </p>
      </div>

      <GuitarraApp />
    </div>
  )
}
