'use client';

// A few drifting low-poly clouds. They live in a band beyond the far edge of the board (outside
// its footprint) and above it, so from the whole-board views (landscape looks along -z, portrait
// along -x) and the follow view they read as sky behind the diorama and never pass in front of a
// tile or landmark. Static with reduced motion.
import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { Group } from 'three';
import { BOARD } from './layout';
import { hash } from './noise';

const COUNT = 6;

export function Clouds({ reducedMotion }: { reducedMotion: boolean }) {
  const clouds = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => ({
        // a: along the far edge (drift axis, -1..1), b: distance beyond the far edge.
        a: -1 + (2 * (i + hash(i, 1) * 0.6)) / COUNT,
        y: 1.05 + hash(i, 2) * 0.7,
        b: 0.75 + hash(i, 3) * 1.1,
        v: 0.1 + hash(i, 4) * 0.1,
        puffs: Array.from({ length: 3 }, (_, k) => ({
          r: 0.2 + hash(i, 10 + k) * 0.16,
          x: k * 0.26 - 0.27,
          y: hash(i, 20 + k) * 0.1,
          z: (hash(i, 30 + k) - 0.5) * 0.2,
        })),
      })),
    [],
  );
  const portrait = useThree((st) => st.size.width / st.size.height < 1.2);
  const spanA = portrait ? BOARD.halfD + 1 : BOARD.halfW + 1;
  const place = (c: (typeof clouds)[number]) =>
    portrait
      ? { x: -BOARD.halfW - BOARD.wallThickness - c.b, z: c.a * spanA }
      : { x: c.a * spanA, z: -BOARD.halfD - BOARD.wallThickness - c.b };
  const refs = useRef<(Group | null)[]>([]);

  useFrame((_, dt) => {
    if (reducedMotion) return;
    const d = Math.min(dt, 0.05);
    refs.current.forEach((g, i) => {
      if (!g) return;
      if (portrait) {
        g.position.z += clouds[i].v * d;
        if (g.position.z > spanA) g.position.z = -spanA;
      } else {
        g.position.x += clouds[i].v * d;
        if (g.position.x > spanA) g.position.x = -spanA;
      }
    });
  });

  return (
    <group>
      {clouds.map((c, i) => (
        <group
          key={`${portrait ? 'p' : 'l'}${i}`}
          ref={(g) => {
            refs.current[i] = g;
          }}
          position={[place(c).x, c.y, place(c).z]}
        >
          {c.puffs.map((p, k) => (
            <mesh key={k} position={[p.x, p.y, p.z]} scale={[p.r, p.r * 0.7, p.r]}>
              <icosahedronGeometry args={[1, 0]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.35} transparent opacity={0.85} roughness={1} flatShading />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
