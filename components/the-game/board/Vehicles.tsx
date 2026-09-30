'use client';

// Two tiny animated vehicles: a sailboat circling the lake and a little plane looping high above it.
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { ACCENT } from './palette';

function Boat() {
  return (
    <group>
      <mesh rotation-y={Math.PI / 4} scale={[1, 1, 2.2]} castShadow>
        <cylinderGeometry args={[0.07, 0.045, 0.05, 4]} />
        <meshStandardMaterial color="#8a5a3a" flatShading roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.1, 0]} castShadow>
        <coneGeometry args={[0.06, 0.17, 3]} />
        <meshStandardMaterial color="#fbf8f0" flatShading roughness={0.7} />
      </mesh>
    </group>
  );
}

function Plane() {
  return (
    <group>
      <mesh rotation-x={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.034, 0.024, 0.34, 6]} />
        <meshStandardMaterial color="#fbf8f0" flatShading roughness={0.5} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[0, 0, 0.21]} castShadow>
        <coneGeometry args={[0.034, 0.08, 6]} />
        <meshStandardMaterial color="#fbf8f0" flatShading roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.02]} castShadow>
        <boxGeometry args={[0.4, 0.012, 0.075]} />
        <meshStandardMaterial color={ACCENT} flatShading roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, -0.15]} castShadow>
        <boxGeometry args={[0.14, 0.01, 0.045]} />
        <meshStandardMaterial color={ACCENT} flatShading roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.04, -0.15]} castShadow>
        <boxGeometry args={[0.01, 0.08, 0.055]} />
        <meshStandardMaterial color="#fbf8f0" flatShading roughness={0.5} />
      </mesh>
    </group>
  );
}

// Parametric loops: position at angle a, heading = derivative direction.
const BOAT = { rx: 1.3, rz: 0.5, speed: 0.16 };
// The plane circles high over the lake only (never over the path or a landmark), at half scale.
const PLANE = { rx: 1.6, rz: 0.5, cz: 0.3, y: 1.55, speed: 0.22, scale: 0.5 };

export function Vehicles({ reducedMotion }: { reducedMotion: boolean }) {
  const boat = useRef<Group>(null);
  const plane = useRef<Group>(null);
  const t = useRef(1.3);

  useFrame((_, dt) => {
    if (!reducedMotion) t.current += Math.min(dt, 0.05);
    const tt = t.current;
    if (boat.current) {
      const a = tt * BOAT.speed;
      boat.current.position.set(Math.cos(a) * BOAT.rx, 0.02 + (reducedMotion ? 0 : Math.sin(tt * 2.2) * 0.012), Math.sin(a) * BOAT.rz);
      boat.current.rotation.y = Math.atan2(-Math.sin(a) * BOAT.rx, Math.cos(a) * BOAT.rz);
    }
    if (plane.current) {
      const a = -tt * PLANE.speed + 2;
      plane.current.position.set(Math.cos(a) * PLANE.rx, PLANE.y + Math.sin(tt * 0.7) * 0.08, PLANE.cz + Math.sin(a) * PLANE.rz);
      plane.current.rotation.set(0, Math.atan2(Math.sin(a) * PLANE.rx, -Math.cos(a) * PLANE.rz), 0);
      plane.current.rotateZ(0.35);
    }
  });

  return (
    <>
      <group ref={boat}>
        <Boat />
      </group>
      <group ref={plane}>
        <group scale={PLANE.scale}>
          <Plane />
        </group>
      </group>
    </>
  );
}
