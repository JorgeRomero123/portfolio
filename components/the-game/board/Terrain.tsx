'use client';

// Faceted, flat-shaded terrain generated around the board layout (prototype technique):
// jittered grid, per-face colour from its section patch, per-face lightness jitter.
import { useEffect, useMemo } from 'react';
import { BufferGeometry, Color, Float32BufferAttribute } from 'three';
import { BOARD, groundHeight, sectionAt } from './layout';
import { hash, smooth } from './noise';
import { SECTION_COLORS, tone } from './palette';

const CS = 0.2;
const NEUTRAL = new Color('#a9c784');
const SAND = new Color('#efe4c2');
const SHALLOW = new Color('#e2dcbb');
const DEEP = new Color('#5b98a3');
const ROCK = new Color('#b9b1a2');
const SNOW = new Color('#f7f5ef');
const LAND = SECTION_COLORS.map((c) => tone(c, 0.5, 0.66));

interface GV {
  x: number;
  z: number;
  h: number;
}

function buildTerrain(): BufferGeometry {
  const { halfW, halfD } = BOARD;
  const NX = Math.round((2 * halfW) / CS);
  const NZ = Math.round((2 * halfD) / CS);
  const cx = (2 * halfW) / NX;
  const cz = (2 * halfD) / NZ;
  const gv: GV[] = [];
  for (let j = 0; j <= NZ; j++) {
    for (let i = 0; i <= NX; i++) {
      const edge = i === 0 || j === 0 || i === NX || j === NZ;
      const x = -halfW + i * cx + (edge ? 0 : (hash(i + 0.5, j) - 0.5) * cx * 0.8);
      const z = -halfD + j * cz + (edge ? 0 : (hash(i, j + 0.5) - 0.5) * cz * 0.8);
      gv.push({ x, z, h: groundHeight(x, z) });
    }
  }
  const V = (i: number, j: number) => gv[j * (NX + 1) + i];
  const pos: number[] = [];
  const col: number[] = [];
  const c = new Color();
  const faceColor = (a: GV, b: GV, d: GV) => {
    const h = (a.h + b.h + d.h) / 3;
    const x = (a.x + b.x + d.x) / 3;
    const z = (a.z + b.z + d.z) / 3;
    if (h < -0.01) {
      c.lerpColors(SHALLOW, DEEP, Math.pow(Math.min(1, -h / 0.5), 0.6));
    } else if (h < 0.045) {
      c.copy(SAND);
    } else {
      const s = sectionAt(x, z);
      c.copy(NEUTRAL).lerp(LAND[s.index], 0.18 + 0.5 * s.weight);
      if (h > 0.34) c.lerp(ROCK, smooth(0.34, 0.6, h));
      if (h > 0.66) c.lerp(SNOW, smooth(0.66, 0.8, h));
    }
    c.offsetHSL(0, 0, (hash(a.x * 0.37, b.z * 0.53) - 0.5) * 0.055);
    return c;
  };
  const push = (a: GV, b: GV, d: GV) => {
    const fc = faceColor(a, b, d);
    for (const v of [a, b, d]) {
      pos.push(v.x, v.h, v.z);
      col.push(fc.r, fc.g, fc.b);
    }
  };
  for (let j = 0; j < NZ; j++) {
    for (let i = 0; i < NX; i++) {
      const a = V(i, j);
      const b = V(i, j + 1);
      const cc = V(i + 1, j);
      const d = V(i + 1, j + 1);
      if (hash(i * 1.3, j * 0.7) < 0.5) {
        push(a, b, cc);
        push(cc, b, d);
      } else {
        push(a, d, cc);
        push(a, b, d);
      }
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

export function Terrain() {
  const geometry = useMemo(() => buildTerrain(), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial vertexColors flatShading roughness={0.92} />
    </mesh>
  );
}
