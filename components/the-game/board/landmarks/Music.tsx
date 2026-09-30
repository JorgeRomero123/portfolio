'use client';

// Music: a calm listening corner. A rug, an oatmeal sofa with fuchsia cushions, a pair of walnut
// floorstanding speakers (two woofers + tweeter each, gently pulsing) and a turntable spinning a
// record on a low table.
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, Mesh } from 'three';
import { Baked, Kit, PLINTH, addPlinth, box, cone, cyl, mat, once, torus } from './kit';

const SPK = [
  { x: -0.35, z: -0.1, ry: 0.3 },
  { x: 0.35, z: -0.1, ry: -0.3 },
];
const SPK_H = 0.4;
const SPK_D = 0.12;
const WOOFERS = [0.12, 0.25];

function build(color: string) {
  const k = new Kit();
  addPlinth(k, color);
  // Rug
  k.add(mat(color, { roughness: 0.95 }), box(0.66, 0.01, 0.46), [0, PLINTH + 0.005, 0.02]);
  k.add(mat('#f6d9f4', { roughness: 0.95 }), box(0.56, 0.012, 0.36), [0, PLINTH + 0.006, 0.02]);
  // Sofa
  const sofa = mat('#d8c9b1');
  k.add(sofa, box(0.46, 0.1, 0.17), [0, PLINTH + 0.07, -0.25]);
  k.add(sofa, box(0.46, 0.15, 0.06), [0, PLINTH + 0.16, -0.31], [-0.08, 0, 0]);
  for (const sx of [-1, 1]) k.add(sofa, box(0.05, 0.14, 0.18), [sx * 0.25, PLINTH + 0.09, -0.25]);
  const cushion = mat(color, { roughness: 0.9 });
  k.add(cushion, box(0.1, 0.1, 0.03), [-0.15, PLINTH + 0.17, -0.26], [-0.3, 0.2, 0.1]);
  k.add(mat('#fbbf24', { roughness: 0.9 }), box(0.09, 0.09, 0.03), [0.16, PLINTH + 0.165, -0.26], [-0.3, -0.25, -0.1]);
  // Speaker cabinets + baffles + tweeters (static parts)
  const walnut = mat('#6e4a32');
  const baffle = mat('#1d1d22');
  const silver = mat('#d4d7dd', { roughness: 0.4 });
  for (const s of SPK) {
    const c = Math.cos(s.ry);
    const sn = Math.sin(s.ry);
    const fz = SPK_D / 2 + 0.002;
    k.add(walnut, box(0.13, SPK_H, SPK_D), [s.x, PLINTH + SPK_H / 2 + 0.02, s.z], [0, s.ry, 0]);
    k.add(baffle, box(0.115, SPK_H - 0.02, 0.006), [s.x + sn * fz, PLINTH + SPK_H / 2 + 0.02, s.z + c * fz], [0, s.ry, 0]);
    // plinth feet
    k.add(baffle, box(0.15, 0.02, 0.14), [s.x, PLINTH + 0.01, s.z], [0, s.ry, 0]);
    const ty = PLINTH + 0.02 + 0.34;
    k.add(silver, cyl(0.022, 0.022, 0.008, 12), [s.x + sn * (fz + 0.004), ty, s.z + c * (fz + 0.004)], [Math.PI / 2, 0, -s.ry]);
    k.add(baffle, cyl(0.012, 0.012, 0.01, 10), [s.x + sn * (fz + 0.007), ty, s.z + c * (fz + 0.007)], [Math.PI / 2, 0, -s.ry]);
  }
  // Low table + turntable plinth + tonearm
  const oak = mat('#c89f6e');
  k.add(oak, box(0.26, 0.022, 0.15), [0, PLINTH + 0.1, 0.13]);
  for (const x of [-0.11, 0.11]) for (const z of [0.07, 0.19]) k.add(oak, box(0.018, 0.09, 0.018), [x, PLINTH + 0.045, z]);
  k.add(mat('#f5f5f4'), box(0.17, 0.028, 0.13), [0, PLINTH + 0.125, 0.13]);
  k.add(silver, box(0.008, 0.008, 0.08), [0.06, PLINTH + 0.148, 0.12], [0, 0.35, 0]);
  k.add(silver, cyl(0.01, 0.01, 0.02, 8), [0.07, PLINTH + 0.145, 0.08]);
  // Record sleeves leaning on the table
  k.add(mat('#fb7185'), box(0.1, 0.1, 0.006), [-0.19, PLINTH + 0.05, 0.2], [-0.15, 0.3, 0]);
  k.add(mat('#38bdf8'), box(0.1, 0.1, 0.006), [-0.2, PLINTH + 0.05, 0.215], [-0.2, 0.2, 0]);
  return k.bake();
}

function buildWoofers() {
  // Cones pointing into the cabinet (local +z is out of the baffle), one speaker's worth.
  const k = new Kit();
  const cone1 = mat('#d9dbe0', { roughness: 0.6 });
  const surround = mat('#2e2e35');
  for (const y of WOOFERS) {
    k.add(surround, torus(0.036, 0.006, 4, 14), [0, y, 0.004]);
    k.add(cone1, cone(0.034, 0.018, 12), [0, y, 0.006], [-Math.PI / 2, 0, 0]);
  }
  return k.bake();
}

export default function Music({ color, reducedMotion }: { color: string; reducedMotion: boolean }) {
  const parts = once(`music:${color}`, () => build(color));
  const woofers = once('music:woofers', buildWoofers);
  const cones = useRef<(Group | null)[]>([]);
  const platter = useRef<Mesh>(null);
  const t = useRef(0);
  useFrame((_, dt) => {
    if (reducedMotion) return;
    t.current += Math.min(dt, 0.05);
    const tt = t.current;
    // Soft beat: two pulses per bar.
    const beat = Math.pow(Math.max(0, Math.sin(tt * 7.2)), 6);
    cones.current.forEach((g) => g && g.scale.set(1 + beat * 0.08, 1 + beat * 0.08, 1 + beat * 0.9));
    if (platter.current) platter.current.rotation.y = -tt * 3.5;
  });
  return (
    <group>
      <Baked parts={parts} />
      {SPK.map((s, i) => (
        <group
          key={i}
          ref={(g) => {
            cones.current[i] = g;
          }}
          position={[s.x + Math.sin(s.ry) * (SPK_D / 2 + 0.005), PLINTH + 0.02, s.z + Math.cos(s.ry) * (SPK_D / 2 + 0.005)]}
          rotation-y={s.ry}
        >
          <Baked parts={woofers} castShadow={false} />
        </group>
      ))}
      <group ref={platter} position={[-0.02, PLINTH + 0.143, 0.14]}>
        <mesh material={mat('#18181b', { roughness: 0.35 })} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.007, 16]} />
        </mesh>
        <mesh position={[0.018, 0.004, 0]} material={mat(color, { roughness: 0.6 })}>
          <cylinderGeometry args={[0.016, 0.016, 0.004, 10]} />
        </mesh>
      </group>
    </group>
  );
}
