'use client';

// Faceted lake surface, gently animated with three summed sines (static with reduced motion).
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { PlaneGeometry, type BufferGeometry, type Mesh } from 'three';
import { hash } from './noise';

const W = 6.2;
const D = 3.4;

function wave(p: Float32Array, base: Float32Array, t: number) {
  for (let k = 0; k < base.length; k += 3) {
    const x = base[k];
    const z = base[k + 2];
    p[k + 1] = 0.022 * Math.sin(x * 1.25 + t * 0.9) + 0.016 * Math.sin(z * 1.7 - t * 1.15) + 0.01 * Math.sin((x + z) * 2.3 + t * 1.6);
  }
}

export function Water({ reducedMotion }: { reducedMotion: boolean }) {
  const { geometry, base } = useMemo(() => {
    const g: BufferGeometry = new PlaneGeometry(W, D, 52, 28).toNonIndexed();
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const x = p.getX(k);
      const z = p.getZ(k);
      if (Math.abs(Math.abs(x) - W / 2) > 1e-3 && Math.abs(Math.abs(z) - D / 2) > 1e-3) {
        p.setX(k, x + (hash(x * 3.1, z * 2.7) - 0.5) * 0.07);
        p.setZ(k, z + (hash(z * 2.3, x * 3.9) - 0.5) * 0.07);
      }
    }
    const b = Float32Array.from(p.array as Float32Array);
    wave(p.array as Float32Array, b, 0);
    g.computeVertexNormals();
    return { geometry: g, base: b };
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const t = useRef(0);
  const mesh = useRef<Mesh>(null);
  useFrame((_, dt) => {
    const g = mesh.current?.geometry;
    if (reducedMotion || !g) return;
    t.current += Math.min(dt, 0.05);
    const p = g.attributes.position;
    wave(p.array as Float32Array, base, t.current);
    p.needsUpdate = true;
    g.computeVertexNormals();
  });

  return (
    <mesh ref={mesh} geometry={geometry} receiveShadow>
      <meshStandardMaterial color="#48acc4" transparent opacity={0.8} roughness={0.3} metalness={0.05} flatShading />
    </mesh>
  );
}
