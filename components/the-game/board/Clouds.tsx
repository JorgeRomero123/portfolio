'use client';

// A few high, drifting low-poly clouds with soft shadow blobs beneath them (real shadow-map shadows
// from the puffs rendered as hard dark polygons). Static with reduced motion.
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CanvasTexture, type Group, type Mesh } from 'three';
import { BOARD } from './layout';
import { hash } from './noise';

const COUNT = 6;
const SPAN = BOARD.halfW - 0.4;
// Shadow offset along the sun direction (sun at (-9, 15, 7)), per unit of cloud height.
const SX = 9 / 15;
const SZ = -7 / 15;
const BLOB_Y = 0.85;

const onBoard = (x: number, z: number) => Math.abs(x) < BOARD.halfW - 0.7 && Math.abs(z) < BOARD.halfD - 0.5;

function blobTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(0,0,0,1)');
  grd.addColorStop(0.5, 'rgba(0,0,0,0.6)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return new CanvasTexture(c);
}

export function Clouds({ reducedMotion }: { reducedMotion: boolean }) {
  const clouds = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => ({
        // a: along the far edge (drift axis), b: depth into the back band.
        a: -1 + (2 * (i + hash(i, 1) * 0.6)) / COUNT,
        y: 3.1 + hash(i, 2) * 0.6,
        b: 0.6 + hash(i, 3) * 2.4,
        v: 0.1 + hash(i, 4) * 0.1,
        puffs: Array.from({ length: 3 }, (_, k) => ({
          r: 0.18 + hash(i, 10 + k) * 0.14,
          x: k * 0.24 - 0.25,
          y: hash(i, 20 + k) * 0.1,
          z: (hash(i, 30 + k) - 0.5) * 0.2,
        })),
      })),
    [],
  );
  // Clouds live over the band behind the far edge of the current view, so from the default views
  // they read as sky and never sit over a landmark. Landscape looks along -z, portrait along -x.
  const portrait = useThree((st) => st.size.width / st.size.height < 1.2);
  const place = (c: (typeof clouds)[number]) =>
    portrait
      ? { x: -BOARD.halfW + c.b, z: c.a * (BOARD.halfD - 0.4) }
      : { x: c.a * SPAN, z: -BOARD.halfD + c.b };
  const refs = useRef<(Group | null)[]>([]);
  const blobs = useRef<(Mesh | null)[]>([]);
  const tex = useMemo(() => blobTexture(), []);
  useEffect(() => () => tex.dispose(), [tex]);

  useFrame((_, dt) => {
    if (reducedMotion) return;
    const d = Math.min(dt, 0.05);
    refs.current.forEach((g, i) => {
      if (!g) return;
      if (portrait) {
        g.position.z += clouds[i].v * d;
        if (g.position.z > BOARD.halfD - 0.4) g.position.z = -BOARD.halfD + 0.4;
      } else {
        g.position.x += clouds[i].v * d;
        if (g.position.x > SPAN) g.position.x = -SPAN;
      }
      const b = blobs.current[i];
      if (b) {
        b.position.x = g.position.x + (g.position.y - BLOB_Y) * SX;
        b.position.z = g.position.z + (g.position.y - BLOB_Y) * SZ;
        b.visible = onBoard(b.position.x, b.position.z);
      }
    });
  });

  return (
    <group>
      {clouds.map((c, i) => (
        <group
          key={i}
          ref={(g) => {
            refs.current[i] = g;
          }}
          position={[place(c).x, c.y, place(c).z]}
        >
          {c.puffs.map((p, k) => (
            <mesh key={k} position={[p.x, p.y, p.z]} scale={[p.r, p.r * 0.7, p.r]}>
              <icosahedronGeometry args={[1, 0]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.35} transparent opacity={0.82} roughness={1} flatShading />
            </mesh>
          ))}
        </group>
      ))}
      {clouds.map((c, i) => (
        <mesh
          key={`b${i}`}
          ref={(m) => {
            blobs.current[i] = m;
          }}
          position={[place(c).x + (c.y - BLOB_Y) * SX, BLOB_Y, place(c).z + (c.y - BLOB_Y) * SZ]}
          visible={onBoard(place(c).x + (c.y - BLOB_Y) * SX, place(c).z + (c.y - BLOB_Y) * SZ)}
          rotation-x={-Math.PI / 2}
          renderOrder={2}
        >
          <planeGeometry args={[1.5, 1.1]} />
          <meshBasicMaterial map={tex} color="#1e293b" transparent opacity={0.13} depthWrite={false} depthTest={false} />
        </mesh>
      ))}
    </group>
  );
}
