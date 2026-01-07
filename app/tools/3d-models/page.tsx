import Link from 'next/link'
import ModelViewer from '@/components/tools/ModelViewer'

export const metadata = {
  title: '3D Model Viewer - Jorge Romero',
  description: 'View and interact with 3D models stored in R2',
}

export default function ThreeDModelsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/tools"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-8"
      >
        <svg
          className="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Tools
      </Link>

      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          3D Model Viewer
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Interactive 3D model viewer powered by Three.js
        </p>
      </div>

      <ModelViewer />
    </div>
  )
}
