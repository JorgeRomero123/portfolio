'use client';

// The looping path: a dirt road ribbon joining raised, two-tone slabs (dark side + light top, tinted
// per section), bigger ringed slabs for landmark tiles, direction chevrons on one tile per section,
// and a little blue start gate on tile 0.
import { useEffect, useMemo } from 'react';
import {
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  Euler,
  Float32BufferAttribute,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  Shape,
  ShapeGeometry,
  TorusGeometry,
  Vector3,
} from 'three';
import { START_TILE, TILES, TILE_THICKNESS, groundHeight } from './layout';
import { hash } from './noise';
import { ACCENT, SECTION_COLORS, tone } from './palette';

interface Inst {
  x: number;
  y: number;
  z: number;
  rotX?: number;
  rotY: number;
  color: Color;
}

const ROAD_HALF = 0.13;
const SINK = 0.03;
/** Top cap thickness; the rest of the slab is the darker side. */
const CAP = 0.028;

function instanced(list: Inst[], geo: BufferGeometry, mat: MeshStandardMaterial, shadow = true) {
  const im = new InstancedMesh(geo, mat, list.length);
  const m = new Matrix4();
  const q = new Quaternion();
  const e = new Euler();
  const one = new Vector3(1, 1, 1);
  const p = new Vector3();
  list.forEach((v, k) => {
    q.setFromEuler(e.set(v.rotX ?? 0, v.rotY, 0, 'YXZ'));
    p.set(v.x, v.y, v.z);
    m.compose(p, q, one);
    im.setMatrixAt(k, m);
    im.setColorAt(k, v.color);
  });
  im.castShadow = shadow;
  im.receiveShadow = true;
  return im;
}

/** Dirt road ribbon along the closed loop through the tile centres, draped on the terrain. */
function buildRoad(): BufferGeometry {
  const curve = new CatmullRomCurve3(
    TILES.map((t) => new Vector3(t.x, 0, t.z)),
    true,
    'centripetal',
  );
  const N = 520;
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const p = new Vector3();
  const tan = new Vector3();
  const mid = new Color('#d4b47e');
  const edge = new Color('#a88a5a');
  for (let k = 0; k <= N; k++) {
    const u = (k % N) / N;
    curve.getPointAt(u, p);
    curve.getTangentAt(u, tan);
    const nx = tan.z;
    const nz = -tan.x;
    const l = Math.hypot(nx, nz) || 1;
    // Three lanes of vertices (edge, centre, edge) so the road darkens at its rims.
    for (const [off, c] of [
      [-ROAD_HALF, edge],
      [0, mid],
      [ROAD_HALF, edge],
    ] as const) {
      const x = p.x + (nx / l) * off;
      const z = p.z + (nz / l) * off;
      pos.push(x, groundHeight(x, z) + 0.018, z);
      col.push(c.r, c.g, c.b);
    }
    if (k < N) {
      const a = k * 3;
      const b = a + 3;
      idx.push(a, b, a + 1, a + 1, b, b + 1, a + 1, b + 1, a + 2, a + 2, b + 1, b + 2);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function chevronGeometry(): BufferGeometry {
  // A ">" pointing along +z, lying flat.
  const s = new Shape();
  s.moveTo(-0.075, -0.04);
  s.lineTo(0, 0.035);
  s.lineTo(0.075, -0.04);
  s.lineTo(0.075, 0.005);
  s.lineTo(0, 0.08);
  s.lineTo(-0.075, 0.005);
  s.closePath();
  const g = new ShapeGeometry(s);
  // Lay it flat facing up (-π/2 about x sends the shape's +y to -z), then turn it to point along +z.
  g.rotateX(-Math.PI / 2);
  g.rotateY(Math.PI);
  g.translate(0, 0, -0.02);
  return g;
}

export function Tiles() {
  const { meshes, road } = useMemo(() => {
    const sides: Inst[] = [];
    const tops: Inst[] = [];
    const bigSides: Inst[] = [];
    const bigTops: Inst[] = [];
    const rings: Inst[] = [];
    const chevrons: Inst[] = [];
    const cream = new Color('#fdf9f0');
    for (const t of TILES) {
      const base = SECTION_COLORS[t.sectionIndex];
      const rotY = hash(t.index, 3) * Math.PI;
      const sideH = TILE_THICKNESS + SINK - CAP;
      const sideY = t.y - CAP - sideH / 2;
      const capY = t.y - CAP / 2;
      const dark = tone(base, 0.42, 0.42);
      if (t.isLandmark) {
        bigSides.push({ x: t.x, y: sideY, z: t.z, rotY, color: dark });
        bigTops.push({ x: t.x, y: capY, z: t.z, rotY, color: cream });
        rings.push({ x: t.x, y: t.y + 0.004, z: t.z, rotX: Math.PI / 2, rotY: 0, color: base.clone() });
      } else {
        sides.push({ x: t.x, y: sideY, z: t.z, rotY, color: dark });
        tops.push({ x: t.x, y: capY, z: t.z, rotY, color: tone(base, 0.6, 0.9).offsetHSL(0, 0, (hash(t.index, 9) - 0.5) * 0.03) });
        if (t.index % 4 === 1) chevrons.push({ x: t.x, y: t.y + 0.003, z: t.z, rotY: t.heading, color: tone(base, 0.55, 0.5) });
      }
    }
    const mat = () => new MeshStandardMaterial({ color: '#ffffff', flatShading: true, roughness: 0.7 });
    const sideH = TILE_THICKNESS + SINK - CAP;
    return {
      meshes: [
        instanced(sides, new CylinderGeometry(0.195, 0.215, sideH, 7), mat()),
        instanced(tops, new CylinderGeometry(0.182, 0.195, CAP, 7), mat()),
        instanced(bigSides, new CylinderGeometry(0.26, 0.28, sideH + 0.01, 8), mat()),
        instanced(bigTops, new CylinderGeometry(0.245, 0.26, CAP, 8), mat()),
        instanced(rings, new TorusGeometry(0.265, 0.024, 4, 20), mat()),
        instanced(chevrons, chevronGeometry(), new MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 }), false),
      ],
      road: buildRoad(),
    };
  }, []);
  useEffect(
    () => () => {
      meshes.forEach((m) => {
        m.geometry.dispose();
        (m.material as MeshStandardMaterial).dispose();
        m.dispose();
      });
      road.dispose();
    },
    [meshes, road],
  );

  const start = TILES[START_TILE];
  return (
    <group>
      <mesh geometry={road} receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.95} polygonOffset polygonOffsetFactor={-2} />
      </mesh>
      {meshes.map((m, i) => (
        <primitive key={i} object={m} />
      ))}
      {/* start gate straddling tile 0 */}
      <group position={[start.x, start.y, start.z]} rotation-y={start.heading}>
        {[-0.27, 0.27].map((dx) => (
          <mesh key={dx} position={[dx, 0.24, 0]} castShadow>
            <cylinderGeometry args={[0.018, 0.022, 0.48, 6]} />
            <meshStandardMaterial color="#fbf7ee" flatShading />
          </mesh>
        ))}
        <mesh position={[0, 0.48, 0]} castShadow>
          <boxGeometry args={[0.64, 0.08, 0.035]} />
          <meshStandardMaterial color={ACCENT} flatShading roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}
