'use client';

// Placeholder landmark: a low-poly pedestal with a flag in the section colour.
// Real per-section models replace this via ./index.tsx. Local space: origin on the pad surface,
// +z faces the path; keep models inside a ~0.45 radius and under ~0.8 tall.
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

export default function Placeholder({ color, reducedMotion }: { color: string; reducedMotion: boolean }) {
  const flag = useRef<Group>(null);
  const t = useRef(color.charCodeAt(1) + color.charCodeAt(3)); // per-colour phase so flags don't wave in sync
  useFrame((_, dt) => {
    if (reducedMotion || !flag.current) return;
    t.current += Math.min(dt, 0.05);
    flag.current.rotation.y = Math.sin(t.current * 1.8) * 0.18;
  });
  return (
    <group>
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.24, 0.1, 6]} />
        <meshStandardMaterial color="#fbf7ee" flatShading roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.13, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.14, 0.17, 0.06, 6]} />
        <meshStandardMaterial color={color} flatShading roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.42, 0]} castShadow>
        <cylinderGeometry args={[0.01, 0.012, 0.56, 5]} />
        <meshStandardMaterial color="#374151" flatShading />
      </mesh>
      <mesh position={[0, 0.71, 0]}>
        <icosahedronGeometry args={[0.022, 0]} />
        <meshStandardMaterial color="#fbf7ee" flatShading />
      </mesh>
      <group ref={flag} position={[0, 0.6, 0]}>
        <mesh position={[0.12, 0, 0]} castShadow>
          <boxGeometry args={[0.24, 0.15, 0.01]} />
          <meshStandardMaterial color={color} flatShading roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}
