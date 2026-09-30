'use client';

// artoverlay.com: a phone on a little stand projects a design (translucent light cone) onto a wall
// panel, where a line drawing traces itself in from left to right; beside it an easel holds the
// same design, half painted.
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferGeometry, DoubleSide, Float32BufferAttribute, MeshBasicMaterial, type Mesh } from 'three';
import { Baked, Kit, PLINTH, addPlinth, box, canvasTexture, glow, mat, once, strut } from './kit';

const WALL_Z = -0.3;
const WALL_W = 0.5;
const WALL_H = 0.36;
const WALL_Y = PLINTH + 0.3;
const PHONE: [number, number, number] = [0.14, PLINTH + 0.17, 0.2];
const ART_W = 0.44;
const ART_H = 0.3;

function drawDesign(g: CanvasRenderingContext2D, w: number, h: number, stroke: string, fills: boolean) {
  g.lineCap = 'round';
  g.lineJoin = 'round';
  // Sun
  if (fills) {
    g.fillStyle = '#fdba74';
    g.beginPath();
    g.arc(w * 0.78, h * 0.26, h * 0.12, 0, Math.PI * 2);
    g.fill();
    // Half-painted hills (left half only)
    g.fillStyle = '#86efac';
    g.beginPath();
    g.moveTo(0, h);
    g.lineTo(0, h * 0.72);
    g.quadraticCurveTo(w * 0.25, h * 0.5, w * 0.5, h * 0.74);
    g.lineTo(w * 0.5, h);
    g.fill();
    g.fillStyle = '#fca5a5';
    g.beginPath();
    g.arc(w * 0.34, h * 0.42, h * 0.1, 0, Math.PI * 2);
    g.fill();
  }
  g.strokeStyle = stroke;
  g.lineWidth = Math.max(3, w * 0.018);
  g.beginPath();
  g.arc(w * 0.78, h * 0.26, h * 0.12, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.moveTo(w * 0.02, h * 0.72);
  g.quadraticCurveTo(w * 0.25, h * 0.5, w * 0.5, h * 0.74);
  g.quadraticCurveTo(w * 0.72, h * 0.95, w * 0.98, h * 0.66);
  g.stroke();
  // Flower
  g.beginPath();
  g.moveTo(w * 0.34, h * 0.9);
  g.quadraticCurveTo(w * 0.3, h * 0.7, w * 0.34, h * 0.52);
  g.stroke();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    g.beginPath();
    g.ellipse(w * 0.34 + Math.cos(a) * h * 0.1, h * 0.42 + Math.sin(a) * h * 0.1, h * 0.06, h * 0.035, a, 0, Math.PI * 2);
    g.stroke();
  }
  g.beginPath();
  g.ellipse(w * 0.4, h * 0.72, h * 0.07, h * 0.03, -0.5, 0, Math.PI * 2);
  g.stroke();
}

function build(color: string) {
  const k = new Kit();
  addPlinth(k, color);
  const white = mat('#fdfaf4');
  const graphite = mat('#2b2f38');
  // Wall panel on two feet
  k.add(white, box(WALL_W + 0.04, WALL_H + 0.04, 0.03), [0, WALL_Y, WALL_Z]);
  k.add(mat(color, { roughness: 0.6 }), box(WALL_W + 0.06, 0.02, 0.035), [0, WALL_Y - WALL_H / 2 - 0.03, WALL_Z]);
  for (const x of [-0.2, 0.2]) k.add(graphite, box(0.03, WALL_Y - WALL_H / 2 - 0.02 - PLINTH, 0.08), [x, PLINTH + (WALL_Y - WALL_H / 2 - 0.02 - PLINTH) / 2, WALL_Z]);
  // Phone stand: base, stem, cradle; phone faces the wall (-z), tilted slightly up.
  k.add(graphite, box(0.1, 0.012, 0.08), [PHONE[0], PLINTH + 0.006, PHONE[2]]);
  k.add(graphite, strut([PHONE[0], PLINTH, PHONE[2]], [PHONE[0], PHONE[1] - 0.05, PHONE[2] + 0.01], 0.008));
  k.add(mat('#111827'), box(0.07, 0.13, 0.01), PHONE, [-0.12, 0, 0]);
  k.add(mat('#9ca3af'), box(0.012, 0.012, 0.006), [PHONE[0] - 0.02, PHONE[1] + 0.045, PHONE[2] + 0.004], [-0.12, 0, 0]);
  // Easel (front left), facing the viewer
  const wood = mat('#b98352');
  const ex = -0.25;
  const ez = 0.14;
  k.add(wood, strut([ex - 0.08, PLINTH, ez + 0.03], [ex, PLINTH + 0.5, ez - 0.02], 0.009, 'box'));
  k.add(wood, strut([ex + 0.08, PLINTH, ez + 0.03], [ex, PLINTH + 0.5, ez - 0.02], 0.009, 'box'));
  k.add(wood, strut([ex, PLINTH, ez - 0.14], [ex, PLINTH + 0.46, ez - 0.02], 0.008, 'box'));
  k.add(wood, box(0.2, 0.015, 0.03), [ex, PLINTH + 0.18, ez + 0.01], [-0.1, 0, 0]);
  // Paint pots by the easel
  k.add(mat(color), box(0.05, 0.04, 0.05), [ex + 0.15, PLINTH + 0.02, ez + 0.14]);
  k.add(mat('#60a5fa'), box(0.045, 0.035, 0.045), [ex + 0.21, PLINTH + 0.0175, ez + 0.1], [0, 0.4, 0]);
  return k.bake();
}

/** Open pyramid from the phone to the drawing's corners. */
function beamGeometry() {
  const [px, py, pz] = PHONE;
  const z = WALL_Z + 0.017;
  const c = [
    [-ART_W / 2, WALL_Y - ART_H / 2],
    [ART_W / 2, WALL_Y - ART_H / 2],
    [ART_W / 2, WALL_Y + ART_H / 2],
    [-ART_W / 2, WALL_Y + ART_H / 2],
  ];
  const pos: number[] = [];
  for (let i = 0; i < 4; i++) {
    const a = c[i];
    const b = c[(i + 1) % 4];
    pos.push(px, py, pz - 0.006, a[0], a[1], z, b[0], b[1], z);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

export default function ArtOverlay({ color, reducedMotion }: { color: string; reducedMotion: boolean }) {
  const parts = once(`artoverlay:${color}`, () => build(color));
  const wallTex = once('artoverlay:wallTex', () =>
    canvasTexture('artoverlay-wall', 256, 176, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      drawDesign(g, w, h, color, false);
    }),
  );
  const wallArt = once('artoverlay:wallArt', () => new MeshBasicMaterial({ map: wallTex, transparent: true, toneMapped: false }));
  const canvasMat = once('artoverlay:canvas', () =>
    mat('#ffffff', {
      map: canvasTexture('artoverlay-easel', 192, 140, (g, w, h) => {
        g.fillStyle = '#fffdf8';
        g.fillRect(0, 0, w, h);
        drawDesign(g, w, h, '#57534e', true);
      }),
      roughness: 0.9,
      flatShading: false,
    }),
  );
  const beam = once('artoverlay:beam', () => ({
    geo: beamGeometry(),
    mat: new MeshBasicMaterial({ color: '#fef3c7', transparent: true, opacity: 0.5, side: DoubleSide, depthWrite: false }),
  }));
  const art = useRef<Mesh>(null);
  const beamRef = useRef<Mesh>(null);
  const t = useRef(2.5);
  useFrame((_, dt) => {
    const m = art.current;
    if (!m) return;
    if (!reducedMotion) t.current += Math.min(dt, 0.05);
    // Trace in over 3s, hold 2.5s, loop. Reveal by shrinking the plane from the right while
    // cropping the texture to match (no distortion).
    const cycle = t.current % 5.5;
    const r = reducedMotion ? 1 : Math.min(1, Math.max(0.001, cycle / 3));
    m.scale.x = r;
    m.position.x = -ART_W / 2 + (ART_W * r) / 2;
    (m.material as MeshBasicMaterial).map!.repeat.x = r;
    const b = beamRef.current;
    if (b) (b.material as MeshBasicMaterial).opacity = reducedMotion ? 0.5 : 0.4 + 0.18 * Math.sin(t.current * 3) ** 2;
  });
  return (
    <group>
      <Baked parts={parts} />
      <mesh ref={art} position={[0, WALL_Y, WALL_Z + 0.016]} material={wallArt}>
        <planeGeometry args={[ART_W, ART_H]} />
      </mesh>
      <mesh ref={beamRef} geometry={beam.geo} material={beam.mat} renderOrder={3} />
      <mesh position={[PHONE[0], PHONE[1], PHONE[2] - 0.0055]} rotation={[-0.12, Math.PI, 0]} material={glow('#fed7aa', 1)}>
        <planeGeometry args={[0.06, 0.115]} />
      </mesh>
      <mesh position={[-0.25, PLINTH + 0.3, 0.155]} rotation-x={-0.1} material={canvasMat} castShadow>
        <boxGeometry args={[0.26, 0.19, 0.012]} />
      </mesh>
    </group>
  );
}
