'use client';

// 360° content: a tall, slim 360 camera (two opposite fisheye lenses, violet band) on a tripod,
// inside a faint wireframe sphere that slowly turns, with a stitch ring on the plinth.
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { IcosahedronGeometry, MeshBasicMaterial, SphereGeometry, type Mesh } from 'three';
import { Baked, Kit, PLINTH, addPlinth, box, cyl, mat, once, strut, torus } from './kit';

const HUB = 0.36;
const CAM_Y = 0.56; // camera body centre

function build(color: string) {
  const k = new Kit();
  addPlinth(k, color);
  const dark = mat('#262a33');
  const accent = mat(color, { roughness: 0.5 });
  k.add(accent, torus(0.4, 0.008, 3, 40), [0, PLINTH + 0.004, 0], [Math.PI / 2, 0, 0]);
  // Tripod
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3 + 0.5;
    k.add(dark, strut([0, HUB, 0], [Math.cos(a) * 0.24, PLINTH, Math.sin(a) * 0.24], 0.017));
    k.add(dark, cyl(0.024, 0.028, 0.016, 6), [Math.cos(a) * 0.24, PLINTH + 0.008, Math.sin(a) * 0.24]);
  }
  k.add(dark, cyl(0.05, 0.04, 0.05, 8), [0, HUB, 0]);
  k.add(mat('#9ca3af'), cyl(0.02, 0.02, 0.1, 6), [0, HUB + 0.06, 0]);
  // Camera body: tall, slim, rounded-ish
  k.add(dark, box(0.14, 0.3, 0.075), [0, CAM_Y, 0]);
  k.add(dark, cyl(0.07, 0.07, 0.075, 12), [0, CAM_Y + 0.15, 0], [Math.PI / 2, 0, 0]);
  k.add(accent, box(0.144, 0.045, 0.079), [0, CAM_Y - 0.08, 0]);
  k.add(accent, cyl(0.016, 0.016, 0.008, 8), [0, CAM_Y - 0.01, 0.039], [Math.PI / 2, 0, 0]);
  // Lens rings (front and back)
  const ring = mat('#cbd5e1', { roughness: 0.35 });
  for (const sz of [1, -1]) k.add(ring, cyl(0.06, 0.06, 0.016, 14), [0, CAM_Y + 0.13, sz * 0.041], [Math.PI / 2, 0, 0]);
  return k.bake();
}

export default function Pano360({ color, reducedMotion }: { color: string; reducedMotion: boolean }) {
  const parts = once(`pano360:${color}`, () => build(color));
  const lens = once('pano360:lens', () => {
    const g = new SphereGeometry(0.05, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2);
    g.rotateX(Math.PI / 2);
    return g;
  });
  const lensMat = once('pano360:lensMat', () => mat('#1e1b4b', { roughness: 0.15, metalness: 0.3, flatShading: false }));
  const wire = once(`pano360:wire:${color}`, () => ({
    geo: new IcosahedronGeometry(0.36, 1),
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
      <mesh geometry={lens} material={lensMat} position={[0, CAM_Y + 0.13, 0.049]} />
      <mesh geometry={lens} material={lensMat} position={[0, CAM_Y + 0.13, -0.049]} rotation-y={Math.PI} />
      <mesh ref={sphere} geometry={wire.geo} material={wire.mat} position={[0, 0.46, 0]} />
    </group>
  );
}
