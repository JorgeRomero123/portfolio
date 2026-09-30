'use client';

// 360° content: a tall, slim 360 camera (two opposite fisheye lenses, violet band) on a tripod,
// inside a faint wireframe sphere that slowly turns, with a stitch ring on the plinth.
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { IcosahedronGeometry, MeshBasicMaterial, SphereGeometry, type Mesh } from 'three';
import { Baked, Kit, PLINTH, addPlinth, box, cyl, mat, once, strut, torus } from './kit';

const HUB = 0.36;
const CAM_Y = 0.6; // camera body centre

function build(color: string) {
  const k = new Kit();
  addPlinth(k, color);
  const dark = mat('#262a33');
  const accent = mat(color, { roughness: 0.5 });
  k.add(accent, torus(0.4, 0.008, 3, 40), [0, PLINTH + 0.004, 0], [Math.PI / 2, 0, 0]);
  // Tripod
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3 + 0.5;
    k.add(dark, strut([0, HUB, 0], [Math.cos(a) * 0.22, PLINTH, Math.sin(a) * 0.22], 0.011));
    k.add(dark, cyl(0.016, 0.02, 0.014, 6), [Math.cos(a) * 0.22, PLINTH + 0.007, Math.sin(a) * 0.22]);
  }
  k.add(dark, cyl(0.035, 0.03, 0.045, 8), [0, HUB, 0]);
  k.add(mat('#9ca3af'), cyl(0.013, 0.013, 0.15, 6), [0, HUB + 0.08, 0]);
  // Camera body: tall, slim, rounded-ish
  k.add(dark, box(0.1, 0.27, 0.055), [0, CAM_Y, 0]);
  k.add(dark, cyl(0.05, 0.05, 0.055, 10), [0, CAM_Y + 0.135, 0], [Math.PI / 2, 0, 0], [1, 1, 1]);
  k.add(accent, box(0.103, 0.03, 0.058), [0, CAM_Y - 0.07, 0]);
  k.add(accent, cyl(0.012, 0.012, 0.006, 8), [0, CAM_Y - 0.01, 0.029], [Math.PI / 2, 0, 0]);
  // Lens rings (front and back)
  const ring = mat('#cbd5e1', { roughness: 0.35 });
  for (const sz of [1, -1]) k.add(ring, cyl(0.045, 0.045, 0.012, 12), [0, CAM_Y + 0.12, sz * 0.031], [Math.PI / 2, 0, 0]);
  return k.bake();
}

export default function Pano360({ color, reducedMotion }: { color: string; reducedMotion: boolean }) {
  const parts = once(`pano360:${color}`, () => build(color));
  const lens = once('pano360:lens', () => {
    const g = new SphereGeometry(0.038, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    g.rotateX(Math.PI / 2);
    return g;
  });
  const lensMat = once('pano360:lensMat', () => mat('#1e1b4b', { roughness: 0.15, metalness: 0.3, flatShading: false }));
  const wire = once(`pano360:wire:${color}`, () => ({
    geo: new IcosahedronGeometry(0.34, 1),
    mat: new MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.38, depthWrite: false }),
  }));
  const sphere = useRef<Mesh>(null);
  useFrame((_, dt) => {
    if (reducedMotion || !sphere.current) return;
    sphere.current.rotation.y += Math.min(dt, 0.05) * 0.25;
  });
  return (
    <group>
      <Baked parts={parts} />
      <mesh geometry={lens} material={lensMat} position={[0, CAM_Y + 0.12, 0.037]} />
      <mesh geometry={lens} material={lensMat} position={[0, CAM_Y + 0.12, -0.037]} rotation-y={Math.PI} />
      <mesh ref={sphere} geometry={wire.geo} material={wire.mat} position={[0, 0.46, 0]} />
    </group>
  );
}
