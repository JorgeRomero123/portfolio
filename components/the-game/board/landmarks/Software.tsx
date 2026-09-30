'use client';

// Software engineering: a desk with a glowing monitor (coloured code lines), keyboard, mug, a plant,
// a blue drawer unit and a chair pushed back as if someone just stepped away. The cursor blinks.
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import { Baked, Kit, PLINTH, addPlinth, ball, box, canvasTexture, cyl, glow, mat, once, torus } from './kit';

const TOP = PLINTH + 0.3 + 0.0175; // desk top surface

function screenTexture() {
  return canvasTexture('software-screen', 256, 152, (g, w, h) => {
    g.fillStyle = '#0f172a';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#1e293b';
    g.fillRect(0, 0, w, 16);
    ['#f87171', '#fbbf24', '#34d399'].forEach((c, i) => {
      g.fillStyle = c;
      g.beginPath();
      g.arc(10 + i * 12, 8, 3.5, 0, Math.PI * 2);
      g.fill();
    });
    const colors = ['#60a5fa', '#f472b6', '#34d399', '#fbbf24', '#a78bfa', '#e2e8f0'];
    const rows: [number, number, number][] = [
      [0, 70, 0], [1, 40, 1], [1, 90, 5], [2, 60, 2], [2, 30, 3], [1, 50, 4], [0, 24, 0],
      [0, 80, 1], [1, 56, 5], [2, 72, 2], [1, 38, 3],
    ];
    rows.forEach(([ind, len, c], i) => {
      const y = 24 + i * 11.5;
      g.fillStyle = '#475569';
      g.fillRect(6, y, 8, 6);
      g.fillStyle = colors[c];
      g.fillRect(22 + ind * 16, y, len, 6);
      g.fillStyle = colors[(c + 2) % colors.length];
      g.fillRect(26 + ind * 16 + len, y, len * 0.45, 6);
    });
  });
}

function build(color: string) {
  const k = new Kit();
  addPlinth(k, color);
  const white = mat('#f7f5f0');
  const dark = mat('#2c3240');
  const accent = mat(color, { roughness: 0.55 });
  // Desk
  k.add(white, box(0.66, 0.035, 0.3), [0, TOP - 0.0175, -0.06]);
  for (const x of [-0.3, 0.3]) for (const z of [-0.18, 0.06]) k.add(dark, box(0.03, 0.3, 0.03), [x, PLINTH + 0.15, z]);
  k.add(accent, box(0.16, 0.24, 0.24), [0.2, PLINTH + 0.13, -0.07]);
  k.add(white, box(0.12, 0.012, 0.005), [0.2, PLINTH + 0.19, 0.052]);
  k.add(white, box(0.12, 0.012, 0.005), [0.2, PLINTH + 0.1, 0.052]);
  // Monitor
  k.add(dark, box(0.13, 0.012, 0.09), [0, TOP + 0.006, -0.14]);
  k.add(dark, box(0.03, 0.12, 0.02), [0, TOP + 0.07, -0.155]);
  k.add(dark, box(0.46, 0.28, 0.024), [0, TOP + 0.21, -0.14]);
  // Keyboard + mouse
  k.add(mat('#e5e7eb'), box(0.28, 0.016, 0.09), [-0.02, TOP + 0.008, 0.02]);
  k.add(dark, box(0.25, 0.004, 0.065), [-0.02, TOP + 0.017, 0.02]);
  k.add(mat('#e5e7eb'), box(0.035, 0.014, 0.055), [0.19, TOP + 0.007, 0.03]);
  // Mug
  k.add(white, cyl(0.03, 0.027, 0.065, 10), [-0.25, TOP + 0.0325, 0.0]);
  k.add(accent, cyl(0.0305, 0.0295, 0.016, 10), [-0.25, TOP + 0.04, 0.0]);
  k.add(white, torus(0.018, 0.006, 4, 10), [-0.218, TOP + 0.034, 0.0]);
  // Plant
  k.add(mat('#c8734a'), cyl(0.035, 0.028, 0.05, 7), [-0.27, TOP + 0.025, -0.15]);
  k.add(mat('#4d9a52'), ball(0.055), [-0.27, TOP + 0.09, -0.15], [0, 0.4, 0], [1, 1.2, 1]);
  // Chair, pushed back and turned
  const chair = mat('#23324d');
  const cx = 0.27;
  const cz = 0.25;
  const rot = -0.55;
  const cs = Math.sin(rot);
  const cc = Math.cos(rot);
  const loc = (x: number, y: number, z: number): [number, number, number] => [cx + x * cc + z * cs, y, cz - x * cs + z * cc];
  k.add(chair, box(0.2, 0.035, 0.19), loc(0, PLINTH + 0.18, 0), [0, rot, 0]);
  k.add(chair, box(0.2, 0.2, 0.035), loc(0, PLINTH + 0.3, 0.095), [-0.12, rot, 0]);
  k.add(dark, cyl(0.014, 0.014, 0.14, 6), loc(0, PLINTH + 0.09, 0));
  k.add(dark, box(0.2, 0.018, 0.03), loc(0, PLINTH + 0.02, 0), [0, rot + 0.5, 0]);
  k.add(dark, box(0.2, 0.018, 0.03), loc(0, PLINTH + 0.02, 0), [0, rot - 1.07, 0]);
  return k.bake();
}

export default function Software({ color, reducedMotion }: { color: string; reducedMotion: boolean }) {
  const parts = once(`software:${color}`, () => build(color));
  const screen = once('software:screen', () => {
    const t = screenTexture();
    return mat('#ffffff', { map: t, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: 0.85, roughness: 0.4, flatShading: false });
  });
  const cursor = useRef<Mesh>(null);
  const t = useRef(0);
  useFrame((_, dt) => {
    if (!cursor.current) return;
    if (reducedMotion) {
      cursor.current.visible = true;
      return;
    }
    t.current += Math.min(dt, 0.05);
    cursor.current.visible = t.current % 1.06 < 0.6;
  });
  return (
    <group>
      <Baked parts={parts} />
      <mesh position={[0, TOP + 0.21, -0.1275]} material={screen}>
        <planeGeometry args={[0.42, 0.245]} />
      </mesh>
      <mesh ref={cursor} position={[0.07, TOP + 0.13, -0.126]} material={glow('#e2e8f0', 1.2)}>
        <planeGeometry args={[0.016, 0.022]} />
      </mesh>
    </group>
  );
}
