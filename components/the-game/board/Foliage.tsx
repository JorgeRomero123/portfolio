'use client';

// Instanced low-poly trees and rocks, clustered into groves per section theme (dense forest by the
// drone field, an orchard by the kitchen, none at the stadium) and kept off the road, tiles and pads.
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
import { SECTION_IDS, type SectionId } from '../types';
import { BOARD, SECTION_LAYOUT, TILES, distToPath, groundHeight, lakeDist, sectionAt } from './layout';
import { fbm, hash, smooth } from './noise';
import { SECTION_GROUND } from './palette';

interface Spot {
  x: number;
  y: number;
  z: number;
  s: number;
  rot: number;
  color: Color;
}

/**
 * Tree character per section, so each district reads as a place rather than uniform noise:
 * `trees` peak density inside a grove, `grove` share of the patch covered by groves (0 = none),
 * `pine` share of conifers, `rocks` rock density, `tint` optional canopy colour (blossom, orchard).
 */
const THEME: Record<SectionId, { trees: number; grove: number; pine: number; rocks: number; tint?: string }> = {
  software: { trees: 0.55, grove: 0.3, pine: 0.3, rocks: 0.05 },
  drone: { trees: 0.95, grove: 0.75, pine: 0.8, rocks: 0.15 },
  spurs: { trees: 0, grove: 0, pine: 0, rocks: 0 },
  pano360: { trees: 0.6, grove: 0.35, pine: 0.95, rocks: 0.45 },
  boardgames: { trees: 0.5, grove: 0.3, pine: 0.2, rocks: 0.05 },
  music: { trees: 0.45, grove: 0.25, pine: 0.5, rocks: 0.1 },
  beer: { trees: 0.3, grove: 0.15, pine: 0, rocks: 0.02, tint: '#b9c95a' },
  artoverlay: { trees: 0.45, grove: 0.25, pine: 0.3, rocks: 0.15 },
  myalbumlink: { trees: 0.7, grove: 0.45, pine: 0.55, rocks: 0.1 },
  emarts: { trees: 0.55, grove: 0.3, pine: 0, rocks: 0.02, tint: '#f4a3c4' },
  kitchen: { trees: 0.35, grove: 0.15, pine: 0, rocks: 0, tint: '#e9a04f' },
};
/** Outer hills (weak section weight): forested slopes, bare rock and snow above. */
const WILD: { trees: number; grove: number; pine: number; rocks: number; tint?: string } = { trees: 0.7, grove: 0.5, pine: 0.75, rocks: 0.25 };

const PADS = SECTION_IDS.map((id) => SECTION_LAYOUT[id].landmark);

function clearOf(x: number, z: number): boolean {
  if (Math.abs(x) > BOARD.halfW - 0.15 || Math.abs(z) > BOARD.halfD - 0.15) return false;
  for (const t of TILES) if ((x - t.x) ** 2 + (z - t.z) ** 2 < 0.42 * 0.42) return false;
  for (const p of PADS) if ((x - p.x) ** 2 + (z - p.z) ** 2 < 0.8 * 0.8) return false;
  return distToPath(x, z) > 0.3;
}

function scatter() {
  const pines: Spot[] = [];
  const round: Spot[] = [];
  const rocks: Spot[] = [];
  const STEP = 0.2;
  const rockBase = new Color('#b3ab9c');
  for (let z = -BOARD.halfD + 0.2; z < BOARD.halfD - 0.2; z += STEP) {
    for (let x = -BOARD.halfW + 0.2; x < BOARD.halfW - 0.2; x += STEP) {
      const px = x + (hash(x * 3.1, z * 1.7) - 0.5) * STEP * 0.9;
      const pz = z + (hash(z * 2.3, x * 4.1) - 0.5) * STEP * 0.9;
      const h = groundHeight(px, pz);
      if (h < 0.07 || lakeDist(px, pz) < 1.15 || !clearOf(px, pz)) continue;
      const sec = sectionAt(px, pz);
      const id = SECTION_IDS[sec.index];
      const wild = sec.weight < 0.35 || h > 0.45;
      const cfg = wild && id !== 'spurs' ? WILD : THEME[id];
      // Groves: only where a low-frequency noise clears the section's grove threshold.
      const g = fbm(px * 0.95 + 13, pz * 0.95 - 7);
      const inGrove = cfg.grove > 0 ? smooth(0.66 - cfg.grove * 0.3, 0.72 - cfg.grove * 0.3, g) : 0;
      const r = hash(px * 0.91, pz * 1.7);
      const r2 = hash(pz * 1.3, px * 0.77);
      const s = 0.75 + hash(px, pz) * 0.6;
      const rot = hash(pz, px) * Math.PI * 2;
      const leaf = new Color()
        .setHSL(0.29 + (r2 - 0.5) * 0.05, 0.4, 0.34 + (hash(px * 2, pz) - 0.5) * 0.08)
        .lerp(SECTION_GROUND[sec.index], 0.12);
      if (h > 0.95) continue; // snow line
      if (h > 0.62) {
        if (r < 0.12) rocks.push({ x: px, y: h, z: pz, s, rot, color: rockBase.clone().offsetHSL(0, 0, (r2 - 0.5) * 0.1) });
        else if (r < 0.3) pines.push({ x: px, y: h, z: pz, s: s * 0.9, rot, color: leaf });
        continue;
      }
      if (r < cfg.trees * inGrove) {
        const pine = r2 < cfg.pine || h > 0.5;
        const tint = !wild && cfg.tint ? new Color(cfg.tint) : null;
        const color = pine ? leaf : tint ? leaf.clone().lerp(tint, 0.6) : leaf.clone().offsetHSL(0.02, 0.04, 0.06);
        (pine ? pines : round).push({ x: px, y: h, z: pz, s, rot, color });
      } else if (r2 < cfg.rocks * 0.2) {
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
