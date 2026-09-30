'use client';

// Craft beer: a small taproom. A wooden bar with a chrome tap tower and a row of colourful tap
// handles, pints with foam heads, a back shelf of bottles, three stools and a hooped barrel.
import { useEffect, useMemo } from 'react';
import { Color, InstancedMesh, Matrix4, Quaternion, Vector3, type BufferGeometry } from 'three';
import { Baked, Kit, PLINTH, addPlinth, box, cyl, mat, once, torus } from './kit';

const BAR_H = 0.24;
const TOP = PLINTH + BAR_H + 0.025;
const TAPS = ['#f59e0b', '#dc2626', '#16a34a', '#2563eb', '#f5f5f4', '#7c3aed'];
const BOTTLES = ['#166534', '#92400e', '#1e3a8a', '#b45309', '#166534', '#7f1d1d', '#92400e', '#0f766e'];

function build(color: string) {
  const k = new Kit();
  addPlinth(k, color);
  const woodDark = mat('#6f4428');
  const woodLight = mat('#c58d58');
  const chrome = mat('#d1d5db', { roughness: 0.3, metalness: 0.4 });
  const iron = mat('#374151');
  // Bar
  k.add(woodDark, box(0.66, BAR_H, 0.15), [0, PLINTH + BAR_H / 2, -0.12]);
  k.add(woodLight, box(0.72, 0.025, 0.2), [0, PLINTH + BAR_H + 0.0125, -0.12]);
  k.add(mat(color, { roughness: 0.55 }), box(0.66, 0.035, 0.006), [0, PLINTH + BAR_H - 0.04, -0.043]);
  k.add(iron, box(0.66, 0.012, 0.012), [0, PLINTH + 0.05, -0.035]);
  // Tap tower
  k.add(chrome, box(0.44, 0.03, 0.03), [0, TOP + 0.13, -0.16]);
  for (const x of [-0.2, 0.2]) k.add(chrome, cyl(0.012, 0.012, 0.13, 6), [x, TOP + 0.065, -0.16]);
  for (let i = 0; i < TAPS.length; i++) k.add(chrome, cyl(0.006, 0.006, 0.04, 5), [-0.175 + i * 0.07, TOP + 0.1, -0.145]);
  // Pints (glass + foam)
  const amber = mat('#e89a24', { roughness: 0.25 });
  const foam = mat('#fff7e6', { roughness: 0.9 });
  for (const [x, z] of [[-0.22, -0.07], [-0.1, -0.06], [0.14, -0.07]]) {
    k.add(amber, cyl(0.028, 0.022, 0.085, 8), [x, TOP + 0.0425, z]);
    k.add(foam, cyl(0.03, 0.028, 0.024, 8), [x, TOP + 0.096, z]);
  }
  // Back shelf
  k.add(woodDark, box(0.6, 0.02, 0.07), [0, PLINTH + 0.36, -0.33]);
  k.add(woodDark, box(0.6, 0.38, 0.015), [0, PLINTH + 0.19, -0.37]);
  // Stools
  const seat = mat(color, { roughness: 0.6 });
  for (const x of [-0.2, 0, 0.2]) {
    k.add(seat, cyl(0.048, 0.044, 0.025, 8), [x, PLINTH + 0.19, 0.08]);
    k.add(iron, cyl(0.009, 0.012, 0.18, 5), [x, PLINTH + 0.09, 0.08]);
    k.add(iron, torus(0.03, 0.005, 3, 10), [x, PLINTH + 0.07, 0.08], [Math.PI / 2, 0, 0]);
    k.add(iron, cyl(0.04, 0.045, 0.01, 8), [x, PLINTH + 0.005, 0.08]);
  }
  // Barrel
  const barrel = mat('#a8693a');
  k.add(barrel, cyl(0.07, 0.062, 0.08, 10), [0.36, PLINTH + 0.12, 0.2]);
  k.add(barrel, cyl(0.062, 0.07, 0.08, 10), [0.36, PLINTH + 0.04, 0.2]);
  for (const y of [0.025, 0.08, 0.135]) k.add(iron, torus(0.07, 0.006, 3, 16), [0.36, PLINTH + y, 0.2], [Math.PI / 2, 0, 0]);
  return k.bake();
}

function instanced(list: { p: [number, number, number]; c: string }[], geo: BufferGeometry, roughness: number) {
  const im = new InstancedMesh(geo, mat('#ffffff', { roughness }), list.length);
  const m = new Matrix4();
  const q = new Quaternion();
  const one = new Vector3(1, 1, 1);
  const p = new Vector3();
  const c = new Color();
  list.forEach((v, i) => {
    im.setMatrixAt(i, m.compose(p.set(...v.p), q, one));
    im.setColorAt(i, c.set(v.c));
  });
  im.castShadow = true;
  im.receiveShadow = true;
  return im;
}

export default function Beer({ color }: { color: string; reducedMotion: boolean }) {
  const parts = once(`beer:${color}`, () => build(color));
  const handleGeo = once('beer:handle', () => box(0.024, 0.075, 0.024));
  const bottleGeo = once('beer:bottle', () => {
    const k = new Kit();
    const m = mat('#ffffff');
    k.add(m, cyl(0.016, 0.016, 0.07, 7), [0, 0.035, 0]);
    k.add(m, cyl(0.006, 0.016, 0.035, 7), [0, 0.087, 0]);
    return k.bake()[0].geometry;
  });
  const taps = useMemo(() => instanced(TAPS.map((c, i) => ({ p: [-0.175 + i * 0.07, TOP + 0.18, -0.145], c })), handleGeo, 0.5), [handleGeo]);
  const bottles = useMemo(
    () => instanced(BOTTLES.map((c, i) => ({ p: [-0.26 + i * 0.074, PLINTH + 0.37, -0.33], c })), bottleGeo, 0.3),
    [bottleGeo],
  );
  useEffect(
    () => () => {
      taps.dispose();
      bottles.dispose();
    },
    [taps, bottles],
  );
  return (
    <group>
      <Baked parts={parts} />
      <primitive object={taps} />
      <primitive object={bottles} />
    </group>
  );
}
