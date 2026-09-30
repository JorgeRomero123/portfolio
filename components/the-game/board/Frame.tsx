'use client';

// Cream diorama frame with a thin blue lip on the inner edge, sitting on a light table.
import { BOARD } from './layout';
import { ACCENT, CREAM, PAGE_BG, TABLE_SHADOW } from './palette';

export function Frame() {
  const { halfW, halfD, wallThickness: T, wallTop: top, wallBottom: bot } = BOARD;
  const BW = halfW * 2;
  const BD = halfD * 2;
  const hgt = top - bot;
  const y = (top + bot) / 2;
  const lip = 0.05;
  const walls: [number, number, number, number, number][] = [
    [BW + 2 * T, T, 0, -halfD - T / 2, 0],
    [BW + 2 * T, T, 0, halfD + T / 2, 0],
    [T, BD, -halfW - T / 2, 0, 0],
    [T, BD, halfW + T / 2, 0, 0],
  ];
  const lips: [number, number, number, number][] = [
    [BW + 2 * lip, lip, 0, -halfD - lip / 2],
    [BW + 2 * lip, lip, 0, halfD + lip / 2],
    [lip, BD, -halfW - lip / 2, 0],
    [lip, BD, halfW + lip / 2, 0],
  ];
  return (
    <group>
      {walls.map(([w, d, x, z], k) => (
        <mesh key={k} position={[x, y, z]} castShadow receiveShadow>
          <boxGeometry args={[w, hgt, d]} />
          <meshStandardMaterial color={CREAM} flatShading roughness={0.85} />
        </mesh>
      ))}
      {lips.map(([w, d, x, z], k) => (
        <mesh key={k} position={[x, top + 0.015, z]}>
          <boxGeometry args={[w, 0.03, d]} />
          <meshStandardMaterial color={ACCENT} roughness={0.6} />
        </mesh>
      ))}
      {/* base slab under the diorama */}
      <mesh position={[0, bot - 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[BW + 2 * T, 0.12, BD + 2 * T]} />
        <meshStandardMaterial color={CREAM} flatShading roughness={0.85} />
      </mesh>
      {/* Table: unlit page colour so the diorama sits on the page's white space, plus a
          shadow-only layer for its soft contact shadow. Kept clear of the slab's bottom face. */}
      <mesh rotation-x={-Math.PI / 2} position={[0, bot - 0.14, 0]}>
        <planeGeometry args={[160, 160]} />
        <meshBasicMaterial color={PAGE_BG} toneMapped={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, bot - 0.13, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <shadowMaterial color={TABLE_SHADOW} opacity={0.16} transparent />
      </mesh>
    </group>
  );
}
