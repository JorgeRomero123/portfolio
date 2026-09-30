'use client';

// The looping path: instanced low-poly stepping-stone slabs tinted per section, bigger ringed
// slabs for landmark tiles, and a little blue start gate on tile 0.
import { useEffect, useMemo } from 'react';
import {
  Color,
  CylinderGeometry,
  Euler,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  TorusGeometry,
  Vector3,
  type BufferGeometry,
} from 'three';
import { START_TILE, TILES, TILE_THICKNESS } from './layout';
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

function instanced(list: Inst[], geo: BufferGeometry, mat: MeshStandardMaterial) {
  const im = new InstancedMesh(geo, mat, list.length);
  const m = new Matrix4();
  const q = new Quaternion();
  const e = new Euler();
  const one = new Vector3(1, 1, 1);
  const p = new Vector3();
  list.forEach((v, k) => {
    q.setFromEuler(e.set(v.rotX ?? 0, v.rotY, 0));
    p.set(v.x, v.y, v.z);
    m.compose(p, q, one);
    im.setMatrixAt(k, m);
    im.setColorAt(k, v.color);
  });
  im.castShadow = true;
  im.receiveShadow = true;
  return im;
}

export function Tiles() {
  const meshes = useMemo(() => {
    const slabs: Inst[] = [];
    const bigSlabs: Inst[] = [];
    const rings: Inst[] = [];
    const cream = new Color('#fbf7ee');
    for (const t of TILES) {
      const base = SECTION_COLORS[t.sectionIndex];
      const y = t.y - TILE_THICKNESS / 2;
      const rotY = hash(t.index, 3) * Math.PI;
      if (t.isLandmark) {
        bigSlabs.push({ x: t.x, y: y + 0.005, z: t.z, rotY, color: cream });
        rings.push({ x: t.x, y: t.y + 0.004, z: t.z, rotX: Math.PI / 2, rotY: 0, color: base.clone() });
      } else {
        slabs.push({ x: t.x, y, z: t.z, rotY, color: tone(base, 0.55, 0.9).offsetHSL(0, 0, (hash(t.index, 9) - 0.5) * 0.03) });
      }
    }
    const mat = () => new MeshStandardMaterial({ color: '#ffffff', flatShading: true, roughness: 0.7 });
    return [
      instanced(slabs, new CylinderGeometry(0.17, 0.19, TILE_THICKNESS, 7), mat()),
      instanced(bigSlabs, new CylinderGeometry(0.235, 0.26, TILE_THICKNESS + 0.01, 8), mat()),
      instanced(rings, new TorusGeometry(0.27, 0.022, 4, 20), mat()),
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

  const start = TILES[START_TILE];
  return (
    <group>
      {meshes.map((m, i) => (
        <primitive key={i} object={m} />
      ))}
      {/* start gate straddling tile 0 */}
      <group position={[start.x, start.y, start.z]} rotation-y={start.heading}>
        {[-0.25, 0.25].map((dx) => (
          <mesh key={dx} position={[dx, 0.24, 0]} castShadow>
            <cylinderGeometry args={[0.018, 0.022, 0.48, 6]} />
            <meshStandardMaterial color="#fbf7ee" flatShading />
          </mesh>
        ))}
        <mesh position={[0, 0.48, 0]} castShadow>
          <boxGeometry args={[0.6, 0.08, 0.035]} />
          <meshStandardMaterial color={ACCENT} flatShading roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}
