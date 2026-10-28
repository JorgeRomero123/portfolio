import Link from 'next/link'
import MapperControl from '@/components/tools/projection-mapper/MapperControlClient'

export const metadata = {
  title: 'Projection Mapper - Jorge Romero',
  description:
    'Map animated surfaces onto real objects with any projector. Drag the corners from your phone; the projector window warps everything to fit.',
}

export default function ProjectionMapperPage() {
  return (
    <div className="max-w-4xl lg:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-4">
      <div className="mb-5 lg:mb-3 flex items-center justify-between gap-4">
        <Link
          href="/tools"
          className="inline-flex items-center text-sm font-medium text-gray-400 hover:text-gray-900 transition-colors"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Tools
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Projection Mapper</h1>
      </div>

      <MapperControl />
    </div>
  )
}
