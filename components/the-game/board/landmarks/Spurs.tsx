'use client';

// Tottenham Hotspur: a generic low-poly football stadium in navy and white (tiered stands, striped
// pitch with lines, four floodlights) and a hand-lettered "COYS" banner on the main stand.
// Deliberately no club crest, cockerel, sponsor names or official artwork.
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { Baked, Kit, box, canvasTexture, cyl, glow, mat, once } from './kit';

const BASE = 0.03;

function pitchTexture() {
  return canvasTexture('spurs-pitch', 256, 160, (g, w, h) => {
    for (let i = 0; i < 10; i++) {
      g.fillStyle = i % 2 ? '#5fae4e' : '#6cbd59';
      g.fillRect((i * w) / 10, 0, w / 10 + 1, h);
    }
    g.strokeStyle = '#ffffff';
    g.lineWidth = 4;
    g.strokeRect(8, 8, w - 16, h - 16);
    g.beginPath();
    g.moveTo(w / 2, 8);
    g.lineTo(w / 2, h - 8);
    g.stroke();
    g.beginPath();
    g.arc(w / 2, h / 2, 22, 0, Math.PI * 2);
    g.stroke();
    g.strokeRect(8, h / 2 - 34, 34, 68);
    g.strokeRect(w - 42, h / 2 - 34, 34, 68);
  });
}

function bannerTexture() {
  return canvasTexture('spurs-banner', 256, 72, (g, w, h) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#132257';
    g.fillRect(0, 0, w, 7);
    g.fillRect(0, h - 7, w, 7);
    g.font = '900 50px system-ui, -apple-system, "Segoe UI", Arial, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('COYS', w / 2, h / 2 + 2);
  });
}

function build(color: string) {
  const k = new Kit();
  const navy = mat(color, { roughness: 0.6 });
  const white = mat('#f8fafc');
  const concrete = mat('#e4e4e9');
  const grey = mat('#9ca3af');
  k.add(concrete, box(0.82, BASE, 0.6), [0, BASE / 2, 0]);
  // Main stand (back): three tiers, white seat stripes, roof.
  const tiers: [number, number][] = [
    [0.07, -0.19],
    [0.13, -0.245],
    [0.19, -0.295],
  ];
  tiers.forEach(([h, z]) => {
    k.add(navy, box(0.64, h, 0.06), [0, BASE + h / 2, z]);
    k.add(white, box(0.64, 0.008, 0.012), [0, BASE + h + 0.002, z + 0.024]);
  });
  k.add(white, box(0.7, 0.018, 0.16), [0, BASE + 0.27, -0.24], [0.12, 0, 0]);
  for (const x of [-0.33, 0.33]) k.add(white, box(0.02, 0.26, 0.02), [x, BASE + 0.13, -0.31]);
  // Side stands (two tiers each).
  for (const sx of [-1, 1]) {
    k.add(navy, box(0.06, 0.07, 0.32), [sx * 0.3, BASE + 0.035, 0.02]);
    k.add(navy, box(0.06, 0.12, 0.32), [sx * 0.36, BASE + 0.06, 0.02]);
    k.add(white, box(0.012, 0.008, 0.32), [sx * 0.276, BASE + 0.072, 0.02]);
    k.add(white, box(0.012, 0.008, 0.32), [sx * 0.336, BASE + 0.122, 0.02]);
  }
  // Low front stand so the pitch stays visible.
  k.add(navy, box(0.5, 0.045, 0.05), [0, BASE + 0.0225, 0.21]);
  k.add(white, box(0.5, 0.008, 0.012), [0, BASE + 0.047, 0.19]);
  // Floodlights
  const lamp = glow('#fffbe8', 1.3);
  for (const [x, z] of [[-0.37, -0.25], [0.37, -0.25], [-0.37, 0.24], [0.37, 0.24]]) {
    k.add(grey, cyl(0.008, 0.012, 0.52, 5), [x, BASE + 0.26, z]);
    const ry = Math.atan2(-x, -z); // face the centre spot
    const l = Math.hypot(x, z);
    k.add(mat('#4b5563'), box(0.09, 0.065, 0.02), [x, BASE + 0.53, z], [0, ry, 0]);
    k.add(lamp, box(0.075, 0.05, 0.006), [x - (x / l) * 0.012, BASE + 0.53, z - (z / l) * 0.012], [0, ry, 0]);
  }
  // Banner posts on the roof
  for (const x of [-0.17, 0.17]) k.add(navy, box(0.015, 0.1, 0.015), [x, BASE + 0.33, -0.27]);
  return k.bake();
}

export default function Spurs({ color, reducedMotion }: { color: string; reducedMotion: boolean }) {
  const parts = once(`spurs:${color}`, () => build(color));
  const pitch = once('spurs:pitch', () => mat('#ffffff', { map: pitchTexture(), roughness: 0.9, flatShading: false }));
  const banner = once('spurs:banner', () => mat('#ffffff', { map: bannerTexture(), roughness: 0.7, flatShading: false }));
  const flag = useRef<Group>(null);
  const t = useRef(0);
  useFrame((_, dt) => {
    if (reducedMotion || !flag.current) return;
    t.current += Math.min(dt, 0.05);
    flag.current.rotation.x = Math.sin(t.current * 1.6) * 0.06;
  });
  return (
    <group>
      <Baked parts={parts} />
      <mesh position={[0, BASE + 0.007, 0.0]} material={pitch} receiveShadow>
        <boxGeometry args={[0.5, 0.014, 0.3]} />
      </mesh>
      <group ref={flag} position={[0, BASE + 0.38, -0.262]}>
        <mesh position={[0, -0.04, 0]} material={banner} castShadow>
          <boxGeometry args={[0.4, 0.11, 0.008]} />
        </mesh>
      </group>
    </group>
  );
}
