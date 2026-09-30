'use client';

// Instanced low-poly trees and rocks, scattered per section character and kept off the path and pads.
import { useEffect, useMemo } from 'react';
import {
  Color,
  ConeGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
  type BufferGeometry,
} from 'three';
import { SECTION_IDS } from '../types';
import { BOARD, SECTION_LAYOUT, SECTION_TERRAIN, TILES, groundHeight, sectionAt } from './layout';
import { hash } from './noise';
import { SECTION_COLORS } from './palette';

interface Spot {
  x: number;
  y: number;
  z: number;
  s: number;
  rot: number;
  color: Color;
}

const PADS = SECTION_IDS.map((id) => SECTION_LAYOUT[id].landmark);

function clearOf(x: number, z: number): boolean {
  for (const t of TILES) if ((x - t.x) ** 2 + (z - t.z) ** 2 < 0.36 * 0.36) return false;
  for (const p of PADS) if ((x - p.x) ** 2 + (z - p.z) ** 2 < 0.64 * 0.64) return false;
  return true;
}

function scatter() {
  const pines: Spot[] = [];
  const round: Spot[] = [];
  const rocks: Spot[] = [];
  const STEP = 0.24;
  const rockBase = new Color('#b3ab9c');
  for (let z = -BOARD.halfD + 0.2; z < BOARD.halfD - 0.2; z += STEP) {
    for (let x = -BOARD.halfW + 0.2; x < BOARD.halfW - 0.2; x += STEP) {
      const px = x + (hash(x * 3.1, z * 1.7) - 0.5) * STEP * 0.9;
      const pz = z + (hash(z * 2.3, x * 4.1) - 0.5) * STEP * 0.9;
      const h = groundHeight(px, pz);
      if (h < 0.07 || !clearOf(px, pz)) continue;
      const sec = sectionAt(px, pz);
      const cfg = SECTION_TERRAIN[SECTION_IDS[sec.index]];
      const r = hash(px * 0.91, pz * 1.7);
      const r2 = hash(pz * 1.3, px * 0.77);
      const s = 0.75 + hash(px, pz) * 0.6;
      const rot = hash(pz, px) * Math.PI * 2;
      const leaf = new Color()
        .setHSL(0.29 + (r2 - 0.5) * 0.05, 0.36, 0.33 + (hash(px * 2, pz) - 0.5) * 0.08)
        .lerp(SECTION_COLORS[sec.index], 0.12);
      if (h > 0.5) {
        if (r < 0.1 + cfg.rocks * 0.3) rocks.push({ x: px, y: h, z: pz, s, rot, color: rockBase.clone().offsetHSL(0, 0, (r2 - 0.5) * 0.1) });
        else if (r < 0.28) pines.push({ x: px, y: h, z: pz, s, rot, color: leaf });
        continue;
      }
      if (r < cfg.trees * 0.75) {
        const pine = h > 0.3 || r2 < cfg.pine;
        (pine ? pines : round).push({ x: px, y: h, z: pz, s, rot, color: pine ? leaf : leaf.clone().offsetHSL(0.02, 0.04, 0.06) });
      } else if (r2 < cfg.rocks * 0.25) {
        rocks.push({ x: px, y: h, z: pz, s: s * 0.8, rot, color: rockBase.clone().offsetHSL(0, 0, (r - 0.5) * 0.1) });
      }
    }
  }
  return { pines, round, rocks };
}

function makeInstances(list: Spot[], geo: BufferGeometry, lift: number, colorOf?: (s: Spot) => Color): InstancedMesh {
  const mat = new MeshStandardMaterial({ color: '#ffffff', flatShading: true, roughness: 0.85 });
  const im = new InstancedMesh(geo, mat, Math.max(1, list.length));
  im.count = list.length;
  const m = new Matrix4();
  const q = new Quaternion();
  const up = new Vector3(0, 1, 0);
  const p = new Vector3();
  const sc = new Vector3();
  list.forEach((v, k) => {
    q.setFromAxisAngle(up, v.rot);
    p.set(v.x, v.y + lift * v.s, v.z);
    sc.setScalar(v.s);
    m.compose(p, q, sc);
    im.setMatrixAt(k, m);
    im.setColorAt(k, colorOf ? colorOf(v) : v.color);
  });
  im.castShadow = true;
  im.receiveShadow = true;
  return im;
}

export function Foliage() {
  const meshes = useMemo(() => {
    const { pines, round, rocks } = scatter();
    const trunk = new Color('#8a6a4f');
    return [
      makeInstances(pines, new ConeGeometry(0.075, 0.24, 5), 0.13),
      makeInstances(round, new IcosahedronGeometry(0.085, 0), 0.15),
      makeInstances(round, new CylinderGeometry(0.014, 0.02, 0.09, 5), 0.045, () => trunk),
      makeInstances(rocks, new DodecahedronGeometry(0.07, 0), 0.025),
    ];
  }, []);
  useEffect(
    () => () =>
      meshes.forEach((m) => {
        m.geometry.dispose();
        (m.material as MeshStandardMaterial).dispose();
        m.dispose();
      }),
    [meshes],
  );
  return (
    <group>
      {meshes.map((m, i) => (
        <primitive key={i} object={m} />
      ))}
    </group>
  );
}
