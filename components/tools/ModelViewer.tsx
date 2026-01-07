'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Center, Environment } from '@react-three/drei'
import { Suspense, useState } from 'react'
import { STLModel } from './STLModel'

interface Model {
  name: string
  url: string
  description: string
}

const models: Model[] = [
  {
    name: 'Sample Model',
    url: 'https://cdn.jorgeromeroromanis.com/stl/1_7_2026.stl',
    description: 'Your 3D model from R2',
  },
]

export default function ModelViewer() {
  const [selectedModel, setSelectedModel] = useState<Model>(models[0])
  const [wireframe, setWireframe] = useState(false)
  const [customUrl, setCustomUrl] = useState('')

  const handleLoadCustomModel = () => {
    if (customUrl.trim()) {
      const newModel: Model = {
        name: 'Custom Model',
        url: customUrl.trim(),
        description: 'Loaded from custom URL',
      }
      setSelectedModel(newModel)
    }
  }

  return (
    <div className="space-y-6">
      {/* Custom URL Input */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Load Model from URL</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="Paste STL file URL here..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleLoadCustomModel()}
          />
          <button
            onClick={handleLoadCustomModel}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Load Model
          </button>
        </div>
      </div>

      {/* Model Selector */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Select Model</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {models.map((model) => (
            <button
              key={model.url}
              onClick={() => setSelectedModel(model)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedModel.url === model.url
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h3 className="font-semibold text-gray-900">{model.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{model.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Viewer Controls */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={wireframe}
              onChange={(e) => setWireframe(e.target.checked)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm font-medium text-gray-700">Wireframe Mode</span>
          </label>
          <div className="text-sm text-gray-500 ml-auto">
            Left click + drag to rotate • Right click + drag to pan • Scroll to zoom
          </div>
        </div>
      </div>

      {/* 3D Viewer */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-xl overflow-hidden">
        <div className="h-[600px] w-full">
          <Canvas
            camera={{ position: [0, 0, 100], fov: 50 }}
            gl={{ antialias: true }}
          >
            <Suspense
              fallback={
                <mesh>
                  <boxGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial color="gray" />
                </mesh>
              }
            >
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              <directionalLight position={[-10, -10, -5]} intensity={0.5} />
              <Environment preset="studio" />

              <Center>
                <STLModel url={selectedModel.url} wireframe={wireframe} />
              </Center>

              <OrbitControls
                enableDamping
                dampingFactor={0.05}
                rotateSpeed={0.5}
                panSpeed={0.5}
                zoomSpeed={0.5}
              />
            </Suspense>
          </Canvas>
        </div>
      </div>

      {/* Model Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">
          {selectedModel.name}
        </h3>
        <p className="text-blue-700">{selectedModel.description}</p>
      </div>
    </div>
  )
}
