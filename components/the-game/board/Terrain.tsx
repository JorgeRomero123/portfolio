'use client';

// Faceted, flat-shaded terrain generated around the board layout (prototype technique):
// jittered grid, per-face colour from its section patch, per-face lightness jitter.
// Relief (plateaus, back-corner peaks) comes from layout.rawHeight; a sand beach rings the lake.
import { useEffect, useMemo } from 'react';
import { BufferGeometry, Color, Float32BufferAttribute } from 'three';
import { BOARD, SECTION_COUNT, groundHeight, lakeDist, sectionWeights } from './layout';
import { hash, smooth } from './noise';
import { SECTION_GROUND } from './palette';

const CS = 0.19;
const MEADOW = new Color('#adc98e');
const FOREST = new Color('#7fa06a');
const SAND = new Color('#f1dfae');
const WET_SAND = new Color('#e2cf98');
const SHALLOW = new Color('#98cfcb');
const DEEP = new Color('#2d7c8e');
const ROCK = new Color('#a79d8c');
const SNOW = new Color('#f8f6f0');

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
  const tint = new Color();
  const w = new Float32Array(SECTION_COUNT);
  const faceColor = (a: GV, b: GV, d: GV) => {
    const h = (a.h + b.h + d.h) / 3;
    const x = (a.x + b.x + d.x) / 3;
    const z = (a.z + b.z + d.z) / 3;
    const ld = lakeDist(x, z);
    if (h < -0.01) {
      c.lerpColors(SHALLOW, DEEP, Math.pow(Math.min(1, -h / 0.45), 0.7));
    } else if (ld < 1.13 && h < 0.2) {
      // Lake beach: wet band at the waterline, dry sand behind.
      c.copy(h < 0.03 ? WET_SAND : SAND);
    } else if (h < 0.045) {
      c.copy(SAND);
    } else {
      // Smoothly blended patch colour (no seams), fading to meadow / forest on the outer hills.
      const strength = sectionWeights(x, z, w);
      tint.setRGB(0, 0, 0);
      for (let i = 0; i < SECTION_COUNT; i++) {
        tint.r += SECTION_GROUND[i].r * w[i];
        tint.g += SECTION_GROUND[i].g * w[i];
        tint.b += SECTION_GROUND[i].b * w[i];
      }
      c.copy(MEADOW).lerp(FOREST, smooth(0.3, 0.75, h) * (1 - strength));
      c.lerp(tint, 0.12 + 0.7 * strength);
      if (h > 0.62) c.lerp(ROCK, smooth(0.62, 0.95, h));
      if (h > 1.0) c.lerp(SNOW, smooth(1.0, 1.15, h));
    }
    c.offsetHSL(0, 0, (hash(a.x * 0.37, b.z * 0.53) - 0.5) * 0.025);
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
