'use client';

// Tiny low-poly hats for the pawn. Coordinates are in the pawn's unscaled space:
// head centre at y = HEAD_Y, head radius HEAD_R. Keep each hat a handful of meshes.
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import type { HatId } from '../types';

export const HEAD_Y = 0.255;
export const HEAD_R = 0.058;
const TOP = HEAD_Y + HEAD_R;

function M({ color, rough = 0.6 }: { color: string; rough?: number }) {
  return <meshStandardMaterial color={color} flatShading roughness={rough} />;
}

function Propeller({ spin }: { spin: boolean }) {
  const blades = useRef<Group>(null);
  useFrame((_, dt) => {
    if (spin && blades.current) blades.current.rotation.y += Math.min(dt, 0.05) * 9;
  });
  return (
    <group position={[0, TOP - 0.03, 0]}>
      <mesh castShadow>
        <sphereGeometry args={[0.052, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <M color="#facc15" />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.03, 4]} />
        <M color="#374151" />
      </mesh>
      <group ref={blades} position={[0, 0.075, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.13, 0.004, 0.022]} />
          <M color="#ef4444" />
        </mesh>
        <mesh rotation-y={Math.PI / 2} castShadow>
          <boxGeometry args={[0.13, 0.004, 0.022]} />
          <M color="#0070f3" />
        </mesh>
      </group>
    </group>
  );
}

function Chef() {
  return (
    <group position={[0, TOP - 0.02, 0]}>
      <mesh position={[0, 0.03, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.048, 0.06, 7]} />
        <M color="#ffffff" rough={0.9} />
      </mesh>
      <mesh position={[0, 0.075, 0]} scale={[1, 0.7, 1]} castShadow>
        <icosahedronGeometry args={[0.06, 0]} />
        <M color="#ffffff" rough={0.9} />
      </mesh>
    </group>
  );
}

function Scarf() {
  // Navy and white only.
  return (
    <group position={[0, 0.197, 0]}>
      <mesh rotation-x={Math.PI / 2} castShadow>
        <torusGeometry args={[0.052, 0.018, 4, 10]} />
        <M color="#132257" />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[0, 0.012, 0]}>
        <torusGeometry args={[0.055, 0.007, 4, 10]} />
        <M color="#ffffff" />
      </mesh>
      <mesh position={[0.03, -0.045, 0.045]} rotation-z={0.15} castShadow>
        <boxGeometry args={[0.028, 0.08, 0.012]} />
        <M color="#132257" />
      </mesh>
      <mesh position={[0.036, -0.08, 0.046]} rotation-z={0.15}>
        <boxGeometry args={[0.029, 0.01, 0.013]} />
        <M color="#ffffff" />
      </mesh>
    </group>
  );
}

function Headphones() {
  return (
    <group position={[0, HEAD_Y, 0]}>
      <mesh castShadow>
        <torusGeometry args={[0.066, 0.009, 4, 12, Math.PI]} />
        <M color="#1f2937" rough={0.4} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.064, -0.005, 0]} rotation-z={Math.PI / 2} castShadow>
          <cylinderGeometry args={[0.026, 0.026, 0.022, 8]} />
          <M color="#c026d3" rough={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function Beanie() {
  return (
    <group position={[0, HEAD_Y + 0.012, 0]}>
      <mesh castShadow>
        <sphereGeometry args={[0.062, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <M color="#dc2626" rough={0.95} />
      </mesh>
      <mesh position={[0, 0.006, 0]}>
        <cylinderGeometry args={[0.064, 0.064, 0.02, 8]} />
        <M color="#f3ecdc" rough={0.95} />
      </mesh>
      <mesh position={[0, 0.066, 0]} castShadow>
        <icosahedronGeometry args={[0.018, 0]} />
        <M color="#f3ecdc" rough={0.95} />
      </mesh>
    </group>
  );
}

function Beret() {
  return (
    <group position={[0.008, TOP - 0.008, 0]} rotation-z={-0.28}>
      <mesh scale={[1, 0.28, 1]} castShadow>
        <icosahedronGeometry args={[0.068, 1]} />
        <M color="#1f2937" rough={0.95} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.004, 0.006, 0.018, 4]} />
        <M color="#1f2937" />
      </mesh>
    </group>
  );
}

export function Hat({ id, reducedMotion }: { id: HatId; reducedMotion: boolean }) {
  switch (id) {
    case 'propeller':
      return <Propeller spin={!reducedMotion} />;
    case 'chef':
      return <Chef />;
    case 'scarf':
      return <Scarf />;
    case 'headphones':
      return <Headphones />;
    case 'beanie':
      return <Beanie />;
    case 'beret':
      return <Beret />;
  }
}
