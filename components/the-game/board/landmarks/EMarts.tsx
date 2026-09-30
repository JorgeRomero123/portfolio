'use client';

// e.marts: a painting-workshop table with a pink runner, three mini easels holding small canvases
// with pre-sketched designs (each half painted), a jar of brushes, a palette with paint dabs and a
// stool.
import { useEffect, useMemo } from 'react';
import { Color, InstancedMesh, Matrix4, Quaternion, Vector3 } from 'three';
import { Baked, Kit, PLINTH, addPlinth, ball, box, canvasTexture, cyl, mat, once, strut } from './kit';

const TOP = PLINTH + 0.22; // table top surface
const EASELS = [
  { x: -0.2, ry: 0.25 },
  { x: 0.0, ry: 0 },
  { x: 0.2, ry: -0.25 },
];
const EASEL_Z = -0.07;
const DABS = ['#ec4899', '#f59e0b', '#3b82f6', '#22c55e', '#ffffff'];

type Sketch = (g: CanvasRenderingContext2D, w: number, h: number) => void;
const SKETCHES: { paint: Sketch; line: Sketch }[] = [
  {
    // Heart
    paint: (g, w, h) => {
      g.fillStyle = '#f472b6';
      g.beginPath();
      g.moveTo(w / 2, h * 0.8);
      g.bezierCurveTo(w * 0.1, h * 0.5, w * 0.25, h * 0.15, w / 2, h * 0.35);
      g.lineTo(w / 2, h * 0.8);
      g.fill();
    },
    line: (g, w, h) => {
      g.beginPath();
      g.moveTo(w / 2, h * 0.8);
      g.bezierCurveTo(w * 0.1, h * 0.5, w * 0.25, h * 0.15, w / 2, h * 0.35);
      g.bezierCurveTo(w * 0.75, h * 0.15, w * 0.9, h * 0.5, w / 2, h * 0.8);
      g.stroke();
    },
  },
  {
    // Mountains + sun
    paint: (g, w, h) => {
      g.fillStyle = '#93c5fd';
      g.fillRect(0, 0, w, h * 0.55);
      g.fillStyle = '#fbbf24';
      g.beginPath();
      g.arc(w * 0.7, h * 0.28, h * 0.12, 0, Math.PI * 2);
      g.fill();
    },
    line: (g, w, h) => {
      g.beginPath();
      g.moveTo(0, h * 0.85);
      g.lineTo(w * 0.35, h * 0.4);
      g.lineTo(w * 0.55, h * 0.65);
      g.lineTo(w * 0.72, h * 0.48);
      g.lineTo(w, h * 0.85);
      g.stroke();
      g.beginPath();
      g.arc(w * 0.7, h * 0.28, h * 0.12, 0, Math.PI * 2);
      g.stroke();
    },
  },
  {
    // Flower
    paint: (g, w, h) => {
      g.fillStyle = '#fb923c';
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
        g.beginPath();
        g.arc(w / 2 + Math.cos(a) * h * 0.14, h * 0.4 + Math.sin(a) * h * 0.14, h * 0.09, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = '#86efac';
      g.fillRect(w / 2 - 2, h * 0.5, 4, h * 0.38);
    },
    line: (g, w, h) => {
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
        g.beginPath();
        g.arc(w / 2 + Math.cos(a) * h * 0.14, h * 0.4 + Math.sin(a) * h * 0.14, h * 0.09, 0, Math.PI * 2);
        g.stroke();
      }
      g.beginPath();
      g.moveTo(w / 2, h * 0.5);
      g.lineTo(w / 2, h * 0.9);
      g.stroke();
    },
  },
];

function build(color: string) {
  const k = new Kit();
  addPlinth(k, color);
  const tableTop = mat('#f4ebdd');
  const legs = mat('#a47551');
  const wood = mat('#c1915e');
  k.add(tableTop, box(0.68, 0.03, 0.36), [0, TOP - 0.015, -0.02]);
  k.add(mat(color, { roughness: 0.9 }), box(0.7, 0.034, 0.1), [0, TOP - 0.015, -0.02]);
  for (const x of [-0.3, 0.3]) for (const z of [-0.17, 0.13]) k.add(legs, box(0.03, TOP - PLINTH - 0.03, 0.03), [x, PLINTH + (TOP - PLINTH - 0.03) / 2, z]);
  // Mini easels
  for (const e of EASELS) {
    const c = Math.cos(e.ry);
    const s = Math.sin(e.ry);
    const P = (x: number, y: number, z: number): [number, number, number] => [e.x + x * c + z * s, y, EASEL_Z - x * s + z * c];
    k.add(wood, strut(P(-0.05, TOP, 0.02), P(0, TOP + 0.21, -0.01), 0.006, 'box'));
    k.add(wood, strut(P(0.05, TOP, 0.02), P(0, TOP + 0.21, -0.01), 0.006, 'box'));
    k.add(wood, strut(P(0, TOP, -0.07), P(0, TOP + 0.2, -0.015), 0.005, 'box'));
    k.add(wood, box(0.13, 0.01, 0.02), P(0, TOP + 0.05, 0.022), [0, e.ry, 0]);
  }
  // Brush jar + brushes
  k.add(mat('#bae6fd', { roughness: 0.2, transparent: true, opacity: 0.8 }), cyl(0.032, 0.028, 0.07, 8), [0.27, TOP + 0.035, 0.1]);
  const handle = mat('#8b5e3c');
  const tips: [number, number, number, number][] = [
    [0.262, 0.094, -0.15, 0.1],
    [0.28, 0.106, 0.12, -0.08],
    [0.268, 0.1, 0.05, 0.15],
    [0.278, 0.092, -0.1, -0.12],
  ];
  for (const [x, z, rz, rx] of tips) k.add(handle, cyl(0.004, 0.005, 0.15, 5), [x, TOP + 0.085, z], [rx, 0, rz]);
  // Palette
  k.add(mat('#e7c9a0'), cyl(0.085, 0.085, 0.008, 12), [-0.2, TOP + 0.004, 0.1], [0, 0, 0], [1, 1, 0.7]);
  // Stool in front
  const stool = mat(color, { roughness: 0.6 });
  k.add(stool, cyl(0.06, 0.055, 0.025, 10), [0.08, PLINTH + 0.15, 0.3]);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    k.add(legs, strut([0.08 + Math.cos(a) * 0.05, PLINTH, 0.3 + Math.sin(a) * 0.05], [0.08 + Math.cos(a) * 0.025, PLINTH + 0.14, 0.3 + Math.sin(a) * 0.025], 0.007));
  }
  return k.bake();
}

function sketchMaterial(i: number) {
  const tex = canvasTexture(`emarts-${i}`, 96, 120, (g, w, h) => {
    g.fillStyle = '#fffdf8';
    g.fillRect(0, 0, w, h);
    // Paint only the left half so each piece reads as work in progress.
    g.save();
    g.beginPath();
    g.rect(0, 0, w * 0.55, h);
    g.clip();
    SKETCHES[i].paint(g, w, h);
    g.restore();
    g.strokeStyle = '#57534e';
    g.lineWidth = 3;
    g.lineJoin = 'round';
    SKETCHES[i].line(g, w, h);
  });
  return mat('#ffffff', { map: tex, roughness: 0.9, flatShading: false });
}

export default function EMarts({ color }: { color: string; reducedMotion: boolean }) {
  const parts = once(`emarts:${color}`, () => build(color));
  const canvases = once('emarts:canvases', () => SKETCHES.map((_, i) => sketchMaterial(i)));
  const dabGeo = once('emarts:dab', () => ball(0.014, 0));
  const tipGeo = once('emarts:tip', () => cyl(0.007, 0.004, 0.02, 5));
  const inst = useMemo(() => {
    const dabs = new InstancedMesh(dabGeo, mat('#ffffff', { roughness: 0.4 }), DABS.length);
    const tips = new InstancedMesh(tipGeo, mat('#ffffff', { roughness: 0.5 }), 4);
    const m = new Matrix4();
    const q = new Quaternion();
    const p = new Vector3();
    const s = new Vector3(1, 0.5, 1);
    const c = new Color();
    DABS.forEach((col, i) => {
      const a = -0.9 + i * 0.55;
      dabs.setMatrixAt(i, m.compose(p.set(-0.2 + Math.cos(a) * 0.05, TOP + 0.01, 0.1 + Math.sin(a) * 0.035), q, s));
      dabs.setColorAt(i, c.set(col));
    });
    const tipCols = ['#ec4899', '#3b82f6', '#f59e0b', '#22c55e'];
    const pos: [number, number][] = [
      [0.262, 0.094],
      [0.28, 0.106],
      [0.268, 0.1],
      [0.278, 0.092],
    ];
    pos.forEach(([x, z], i) => {
      tips.setMatrixAt(i, m.compose(p.set(x, TOP + 0.165, z), q, s.set(1, 1, 1)));
      tips.setColorAt(i, c.set(tipCols[i]));
    });
    dabs.castShadow = tips.castShadow = true;
    return [dabs, tips];
  }, [dabGeo, tipGeo]);
  useEffect(() => () => inst.forEach((m) => m.dispose()), [inst]);
  return (
    <group>
      <Baked parts={parts} />
      {inst.map((m, i) => (
        <primitive key={i} object={m} />
      ))}
      {EASELS.map((e, i) => (
        <mesh
          key={i}
          position={[e.x + Math.sin(e.ry) * 0.02, TOP + 0.13, EASEL_Z + Math.cos(e.ry) * 0.02]}
          rotation={[-0.14, e.ry, 0, 'YXZ']}
          material={canvases[i]}
          castShadow
        >
          <boxGeometry args={[0.12, 0.15, 0.008]} />
        </mesh>
      ))}
    </group>
  );
}
