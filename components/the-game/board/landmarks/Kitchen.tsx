'use client';

// Kitchen: a cabinet block with a stove (pan + red pot with steam puffs), an oven, a red range
// hood, a backsplash with a rail of hanging utensils, and a little prep island with a cutting
// board and tomatoes.
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshStandardMaterial, type Mesh } from 'three';
import { Baked, Kit, PLINTH, addPlinth, ball, box, cyl, mat, once, torus } from './kit';

const CAB_H = 0.24;
const TOP = PLINTH + CAB_H + 0.025;
const BACK_Z = -0.2;
const POT: [number, number] = [0.07, -0.15];
const PUFFS = 3;

function build(color: string) {
  const k = new Kit();
  addPlinth(k, color);
  const cabinet = mat('#f7f3ec');
  const stone = mat('#d6d3d1');
  const steel = mat('#b8bec8', { roughness: 0.35, metalness: 0.3 });
  const dark = mat('#26272b');
  const red = mat(color, { roughness: 0.5 });
  // Cabinets + worktop
  k.add(cabinet, box(0.72, CAB_H, 0.2), [0, PLINTH + CAB_H / 2, BACK_Z]);
  k.add(stone, box(0.76, 0.025, 0.23), [0, PLINTH + CAB_H + 0.0125, BACK_Z]);
  for (const x of [-0.27, -0.15, 0.27]) k.add(dark, box(0.012, 0.05, 0.008), [x, PLINTH + CAB_H - 0.06, BACK_Z + 0.103]);
  // Oven front under the stove
  k.add(dark, box(0.24, 0.16, 0.006), [0.07, PLINTH + 0.11, BACK_Z + 0.102]);
  k.add(mat('#fb923c', { emissive: '#f97316', emissiveIntensity: 0.35 }), box(0.18, 0.08, 0.004), [0.07, PLINTH + 0.1, BACK_Z + 0.106]);
  k.add(steel, box(0.2, 0.012, 0.012), [0.07, PLINTH + 0.175, BACK_Z + 0.11]);
  // Cooktop
  k.add(dark, box(0.28, 0.008, 0.19), [0.07, TOP + 0.004, BACK_Z]);
  // Backsplash + range hood + rail
  k.add(mat('#fdfcf9'), box(0.76, 0.3, 0.03), [0, TOP + 0.15, BACK_Z - 0.115]);
  k.add(red, box(0.76, 0.03, 0.032), [0, TOP + 0.05, BACK_Z - 0.114]);
  k.add(red, box(0.26, 0.07, 0.12), [0.07, TOP + 0.33, BACK_Z - 0.06]);
  k.add(red, box(0.1, 0.16, 0.08), [0.07, TOP + 0.44, BACK_Z - 0.08]);
  k.add(steel, cyl(0.006, 0.006, 0.3, 5), [-0.2, TOP + 0.25, BACK_Z - 0.085], [0, 0, Math.PI / 2]);
  // Utensils hanging off the rail: ladle, spatula, whisk
  k.add(steel, box(0.008, 0.12, 0.006), [-0.3, TOP + 0.18, BACK_Z - 0.085]);
  k.add(steel, cyl(0.022, 0.01, 0.02, 8), [-0.3, TOP + 0.12, BACK_Z - 0.08]);
  k.add(steel, box(0.008, 0.1, 0.006), [-0.21, TOP + 0.19, BACK_Z - 0.085]);
  k.add(dark, box(0.04, 0.05, 0.006), [-0.21, TOP + 0.13, BACK_Z - 0.085]);
  k.add(steel, box(0.008, 0.06, 0.006), [-0.12, TOP + 0.21, BACK_Z - 0.085]);
  k.add(steel, ball(0.028, 0), [-0.12, TOP + 0.15, BACK_Z - 0.085], [0, 0, 0], [0.8, 1.4, 0.8]);
  // Frying pan (back burner) + pot (front burner)
  k.add(dark, cyl(0.06, 0.05, 0.022, 12), [0.14, TOP + 0.02, BACK_Z - 0.03]);
  k.add(dark, box(0.1, 0.012, 0.018), [0.25, TOP + 0.028, BACK_Z - 0.03]);
  k.add(mat('#fde68a'), cyl(0.028, 0.028, 0.006, 10), [0.14, TOP + 0.03, BACK_Z - 0.03]);
  k.add(red, cyl(0.058, 0.052, 0.085, 12), [POT[0] - 0.06, TOP + 0.05, POT[1]]);
  k.add(red, cyl(0.06, 0.06, 0.01, 12), [POT[0] - 0.06, TOP + 0.098, POT[1]]);
  k.add(dark, ball(0.012, 0), [POT[0] - 0.06, TOP + 0.108, POT[1]]);
  for (const sx of [-1, 1]) k.add(dark, torus(0.014, 0.004, 3, 8), [POT[0] - 0.06 + sx * 0.062, TOP + 0.075, POT[1]], [0, Math.PI / 2, 0]);
  // Prep island in front with cutting board + tomatoes + knife
  k.add(cabinet, box(0.34, 0.2, 0.13), [-0.1, PLINTH + 0.1, 0.18]);
  k.add(stone, box(0.37, 0.022, 0.15), [-0.1, PLINTH + 0.211, 0.18]);
  k.add(mat('#c8955f'), box(0.15, 0.014, 0.09), [-0.15, PLINTH + 0.229, 0.18]);
  const tomato = mat('#ef4444', { roughness: 0.4 });
  k.add(tomato, ball(0.022, 1), [-0.17, PLINTH + 0.256, 0.18]);
  k.add(tomato, ball(0.02, 1), [-0.12, PLINTH + 0.254, 0.195]);
  k.add(mat('#4d9a52'), box(0.012, 0.006, 0.012), [-0.17, PLINTH + 0.279, 0.18]);
  k.add(steel, box(0.08, 0.004, 0.014), [-0.05, PLINTH + 0.225, 0.19], [0, 0.4, 0]);
  return k.bake();
}

export default function Kitchen({ color, reducedMotion }: { color: string; reducedMotion: boolean }) {
  const parts = once(`kitchen:${color}`, () => build(color));
  const puffGeo = once('kitchen:puff', () => ball(0.038, 1));
  // One material per puff so each can fade independently.
  const puffMats = useMemo(
    () => Array.from({ length: PUFFS }, () => new MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.4, transparent: true, opacity: 0.7, flatShading: true, depthWrite: false })),
    [],
  );
  useEffect(() => () => puffMats.forEach((m) => m.dispose()), [puffMats]);
  const puffs = useRef<(Mesh | null)[]>([]);
  const t = useRef(0);
  useFrame((_, dt) => {
    if (!reducedMotion) t.current += Math.min(dt, 0.05);
    puffs.current.forEach((p, i) => {
      if (!p) return;
      const u = reducedMotion ? 0.35 + i * 0.2 : (t.current * 0.45 + i / PUFFS) % 1;
      p.position.set(POT[0] - 0.06 + Math.sin(u * 6 + i) * 0.02, TOP + 0.13 + u * 0.28, POT[1] + 0.02 + u * 0.05);
      p.scale.setScalar(0.6 + u * 1.1);
      puffMats[i].opacity = reducedMotion ? 0.45 : 0.9 * Math.sin(Math.PI * u);
    });
  });
  return (
    <group>
      <Baked parts={parts} />
      {puffMats.map((m, i) => (
        <mesh
          key={i}
          ref={(p) => {
            puffs.current[i] = p;
          }}
          geometry={puffGeo}
          material={m}
        />
      ))}
    </group>
  );
}
