'use client';

// Low-poly d6. The result is decided first; the tumble is animated so the settled top face
// matches it (spin decays onto a precomputed final orientation).
import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { CylinderGeometry, Quaternion, Vector3, type BufferGeometry, type Group } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { DieValue } from './types';
import { TILES, groundHeight, wrapTile } from './layout';
import { ACCENT } from './palette';

export interface DieController {
  roll(value: DieValue, nearTile: number): Promise<void>;
  hide(): void;
}

const S = 0.2;
const UP = new Vector3(0, 1, 0);
// value → local face normal, and the in-face axes (u, v) used to lay out pips. Opposite faces sum to 7.
const FACES: Record<DieValue, { n: [number, number, number]; u: [number, number, number]; v: [number, number, number] }> = {
  1: { n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1] },
  6: { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1] },
  2: { n: [1, 0, 0], u: [0, 0, 1], v: [0, 1, 0] },
  5: { n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0] },
  3: { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
  4: { n: [0, 0, -1], u: [1, 0, 0], v: [0, 1, 0] },
};
const PIPS: Record<DieValue, [number, number][]> = {
  1: [[0, 0]],
  2: [[-1, -1], [1, 1]],
  3: [[-1, -1], [0, 0], [1, 1]],
  4: [[-1, -1], [-1, 1], [1, -1], [1, 1]],
  5: [[-1, -1], [-1, 1], [0, 0], [1, -1], [1, 1]],
  6: [[-1, -1], [-1, 0], [-1, 1], [1, -1], [1, 0], [1, 1]],
};

function buildPips(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const g = S * 0.24;
  const q = new Quaternion();
  for (const key of [1, 2, 3, 4, 5, 6] as DieValue[]) {
    const f = FACES[key];
    const n = new Vector3(...f.n);
    const u = new Vector3(...f.u);
    const v = new Vector3(...f.v);
    q.setFromUnitVectors(UP, n);
    for (const [a, b] of PIPS[key]) {
      const pip = new CylinderGeometry(0.021, 0.021, 0.012, 8);
      pip.applyQuaternion(q);
      const p = n.clone().multiplyScalar(S / 2 - 0.003).addScaledVector(u, a * g).addScaledVector(v, b * g);
      pip.translate(p.x, p.y, p.z);
      parts.push(pip);
    }
  }
  const merged = mergeGeometries(parts);
  parts.forEach((p) => p.dispose());
  return merged;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function Die({ ctlRef, reducedMotion }: { ctlRef: RefObject<DieController | null>; reducedMotion: boolean }) {
  const pips = useMemo(() => buildPips(), []);
  useEffect(() => () => pips.dispose(), [pips]);
  const group = useRef<Group>(null);
  const reduced = useRef(reducedMotion);
  useEffect(() => {
    reduced.current = reducedMotion;
  }, [reducedMotion]);

  const st = useRef({
    active: false,
    t: 0,
    dur: 1.3,
    hold: 0,
    from: new Vector3(),
    rest: new Vector3(),
    final: new Quaternion(),
    spinAxis: new Vector3(1, 0, 0),
    spin: 0,
    tmpQ: new Quaternion(),
    resolve: null as (() => void) | null,
  });

  useEffect(() => {
    ctlRef.current = {
      roll(value, nearTile) {
        return new Promise<void>((resolve) => {
          const g = group.current;
          if (!g) return resolve();
          const s = st.current;
          s.resolve?.();
          const tile = TILES[wrapTile(nearTile)];
          // Rest spot: just outside the loop from the pawn, a little towards the camera.
          const rx = tile.x - tile.inward[0] * 0.42 + 0.12;
          const rz = tile.z - tile.inward[1] * 0.42 + 0.18;
          s.rest.set(rx, Math.max(groundHeight(rx, rz), 0.02) + S / 2, rz);
          const f = FACES[value];
          s.final
            .setFromAxisAngle(UP, Math.random() * Math.PI * 2)
            .multiply(s.tmpQ.setFromUnitVectors(new Vector3(...f.n), UP));
          s.spinAxis.set(Math.random() - 0.5, 0.3, Math.random() - 0.5).normalize();
          s.spin = Math.PI * (5 + Math.random() * 2);
          s.from.set(rx + 0.7, s.rest.y + 1.7, rz + 0.6);
          s.t = 0;
          s.hold = 0;
          s.dur = reduced.current ? 0.01 : 1.3;
          s.active = true;
          s.resolve = resolve;
          g.visible = true;
        });
      },
      hide() {
        const s = st.current;
        s.active = false;
        s.resolve?.();
        s.resolve = null;
        if (group.current) group.current.visible = false;
      },
    };
    return () => {
      ctlRef.current = null;
    };
  }, [ctlRef]);

  useFrame((_, delta) => {
    const g = group.current;
    const s = st.current;
    if (!g || !s.active) return;
    const dt = Math.min(delta, 0.05);
    if (s.t < 1) {
      s.t = Math.min(1, s.t + dt / s.dur);
      const k = s.t;
      const e = easeOutCubic(k);
      g.position.lerpVectors(s.from, s.rest, e);
      // Fall, then two decaying bounces, ending exactly at rest.
      g.position.y = s.rest.y + (s.from.y - s.rest.y) * (1 - k) * (1 - k) * Math.abs(Math.cos(k * Math.PI * 2.5));
      g.quaternion.setFromAxisAngle(s.spinAxis, s.spin * (1 - e)).multiply(s.final);
      return;
    }
    // Settled: hold briefly so the face reads, then resolve (the die stays until hide()).
    s.hold += dt;
    if (s.hold >= (reduced.current ? 0.7 : 0.35)) {
      s.active = false;
      const r = s.resolve;
      s.resolve = null;
      r?.();
    }
  });

  return (
    <group ref={group} visible={false}>
      <RoundedBox args={[S, S, S]} radius={0.03} smoothness={2} castShadow>
        <meshStandardMaterial color="#fffdf8" flatShading roughness={0.5} />
      </RoundedBox>
      <mesh geometry={pips}>
        <meshStandardMaterial color={ACCENT} roughness={0.5} />
      </mesh>
    </group>
  );
}
