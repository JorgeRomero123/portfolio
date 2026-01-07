'use client'

import { useEffect, useRef } from 'react'
import { useLoader } from '@react-three/fiber'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import * as THREE from 'three'

interface STLModelProps {
  url: string
  wireframe?: boolean
}

export function STLModel({ url, wireframe = false }: STLModelProps) {
  const geometry = useLoader(STLLoader, url)
  const meshRef = useRef<THREE.Mesh>(null)

  useEffect(() => {
    if (meshRef.current) {
      // Center the geometry
      geometry.computeBoundingBox()
      const boundingBox = geometry.boundingBox
      if (boundingBox) {
        const center = new THREE.Vector3()
        boundingBox.getCenter(center)
        geometry.translate(-center.x, -center.y, -center.z)
      }

      // Compute normals for proper lighting
      geometry.computeVertexNormals()
    }
  }, [geometry])

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        color="#3b82f6"
        wireframe={wireframe}
        side={THREE.DoubleSide}
        flatShading={false}
        metalness={0.3}
        roughness={0.4}
      />
    </mesh>
  )
}
