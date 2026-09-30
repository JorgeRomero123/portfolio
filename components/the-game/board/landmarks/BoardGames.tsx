'use client';

// Board games: a game room with a wooden shelf of stacked boxes in many colours, a table with a
// board, meeples and dice, and a big green meeple standing guard.
import { useEffect, useMemo } from 'react';
import { Color, InstancedMesh, Matrix4, Quaternion, Euler, Vector3, type BufferGeometry } from 'three';
import { Baked, Kit, PLINTH, addPlinth, box, canvasTexture, mat, once, ball } from './kit';

const BOX_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#f97316', '#eab308', '#0ea5e9', '#16a34a', '#64748b'];
const TABLE_Y = PLINTH + 0.2;

function boardTexture() {
  return canvasTexture('boardgames-board', 128, 128, (g, w, h) => {
    g.fillStyle = '#f8f1dc';
    g.fillRect(0, 0, w, h);
    const cols = ['#ef4444', '#3b82f6', '#eab308', '#16a34a'];
    const n = 8;
    const s = w / n;
    for (let i = 0; i < n; i++) {
      for (const [x, y] of [[i, 0], [n - 1, i], [n - 1 - i, n - 1], [0, n - 1 - i]]) {
        g.fillStyle = cols[(i + x + y) % 4];
        g.fillRect(x * s + 2, y * s + 2, s - 4, s - 4);
      }
    }
    g.fillStyle = '#16a34a';
    g.beginPath();
    g.arc(w / 2, h / 2, 22, 0, Math.PI * 2);
    g.fill();
  });
}

/** Meeple silhouette, ~1 unit tall, feet on y = 0. */
function meeple(): BufferGeometry {
  const k = new Kit();
  const m = mat('#ffffff');
  k.add(m, box(0.5, 0.55, 0.28), [0, 0.275, 0]);
  k.add(m, box(1.0, 0.24, 0.28), [0, 0.6, 0]);
  k.add(m, box(0.34, 0.2, 0.28), [0, 0.62, 0]);
  k.add(m, ball(0.2, 0), [0, 0.86, 0], [0, 0, 0], [1, 1, 0.75]);
  k.add(m, box(0.2, 0.3, 0.28), [-0.18, 0.15, 0], [0, 0, 0.25]);
  k.add(m, box(0.2, 0.3, 0.28), [0.18, 0.15, 0], [0, 0, -0.25]);
  return k.bake()[0].geometry;
}

interface Inst {
  p: [number, number, number];
  s: [number, number, number];
  ry?: number;
  c: string;
}

function instanced(geo: BufferGeometry, list: Inst[], roughness = 0.7) {
  const im = new InstancedMesh(geo, mat('#ffffff', { roughness }), list.length);
  const m = new Matrix4();
  const q = new Quaternion();
  const e = new Euler();
  const p = new Vector3();
  const s = new Vector3();
  const c = new Color();
  list.forEach((v, i) => {
    m.compose(p.set(...v.p), q.setFromEuler(e.set(0, v.ry ?? 0, 0)), s.set(...v.s));
    im.setMatrixAt(i, m);
    im.setColorAt(i, c.set(v.c));
  });
  im.castShadow = true;
  im.receiveShadow = true;
  return im;
}

function build(color: string) {
  const k = new Kit();
  addPlinth(k, color);
  const wood = mat('#b7865a');
  const woodLight = mat('#d9b889');
  // Shelf against the back
  const shelfZ = -0.27;
  for (const x of [-0.27, 0.27]) k.add(wood, box(0.03, 0.52, 0.15), [x, PLINTH + 0.26, shelfZ]);
  for (const y of [0.01, 0.17, 0.33, 0.51]) k.add(wood, box(0.57, 0.022, 0.15), [0, PLINTH + y, shelfZ]);
  k.add(mat('#9a6d45'), box(0.57, 0.52, 0.012), [0, PLINTH + 0.26, shelfZ - 0.07]);
  // Table
  k.add(woodLight, box(0.42, 0.03, 0.3), [-0.04, TABLE_Y, 0.1]);
  for (const x of [-0.22, 0.14]) for (const z of [-0.03, 0.23]) k.add(wood, box(0.025, 0.2, 0.025), [x, PLINTH + 0.1, z]);
  // Dice
  const white = mat('#fafafa');
  k.add(white, box(0.035, 0.035, 0.035), [0.1, TABLE_Y + 0.033, 0.18], [0, 0.5, 0]);
  k.add(white, box(0.035, 0.035, 0.035), [0.13, TABLE_Y + 0.033, 0.12], [0, 1.1, 0]);
  return k.bake();
}

function buildBoxes(): Inst[] {
  const out: Inst[] = [];
  let ci = 0;
  const next = () => BOX_COLORS[ci++ % BOX_COLORS.length];
  const shelves = [0.021, 0.181, 0.341];
  shelves.forEach((y, si) => {
    // A flat pile on one side, upright boxes on the other.
    const pileX = si % 2 ? 0.14 : -0.14;
    let py = y;
    for (let j = 0; j < 3 - (si === 2 ? 1 : 0); j++) {
      const hgt = 0.035;
      out.push({ p: [pileX + (j % 2 ? 0.01 : -0.008), 0.045 + py + hgt / 2 + 0.001, -0.27], s: [0.2, hgt, 0.12], c: next() });
      py += hgt;
    }
    for (let j = 0; j < 4; j++) {
      const x = -pileX * 0.3 + (si % 2 ? -1 : 1) * (0.02 + j * 0.05) - (si % 2 ? 0.05 : -0.05);
      const hgt = 0.1 + ((j * 7 + si * 3) % 4) * 0.012;
      out.push({ p: [x, 0.045 + y + hgt / 2 + 0.001, -0.27], s: [0.04, hgt, 0.12], c: next() });
    }
  });
  return out;
}

export default function BoardGames({ color }: { color: string; reducedMotion: boolean }) {
  const parts = once(`boardgames:${color}`, () => build(color));
  const board = once('boardgames:boardMat', () => mat('#ffffff', { map: boardTexture(), roughness: 0.8, flatShading: false }));
  const meepleGeo = once('boardgames:meeple', meeple);
  const cube = once('boardgames:cube', () => box(1, 1, 1));
  const boxes = useMemo(() => instanced(cube, buildBoxes()), [cube]);
  const meeples = useMemo(
    () =>
      instanced(
        meepleGeo,
        [
          { p: [-0.12, TABLE_Y + 0.027, 0.05], s: [0.05, 0.05, 0.05], ry: 0.3, c: '#ef4444' },
          { p: [-0.02, TABLE_Y + 0.027, 0.16], s: [0.05, 0.05, 0.05], ry: -0.4, c: '#3b82f6' },
          { p: [0.04, TABLE_Y + 0.027, 0.03], s: [0.05, 0.05, 0.05], ry: 0.9, c: '#eab308' },
          { p: [0.3, PLINTH, 0.2], s: [0.2, 0.22, 0.2], ry: -0.5, c: color },
        ],
        0.55,
      ),
    [meepleGeo, color],
  );
  useEffect(
    () => () => {
      boxes.dispose();
      meeples.dispose();
    },
    [boxes, meeples],
  );
  return (
    <group>
      <Baked parts={parts} />
      <primitive object={boxes} />
      <primitive object={meeples} />
      <mesh position={[-0.06, TABLE_Y + 0.021, 0.1]} material={board} castShadow receiveShadow>
        <boxGeometry args={[0.24, 0.012, 0.22]} />
      </mesh>
    </group>
  );
}
