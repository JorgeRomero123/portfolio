'use client';

// The player's pawn: a low-poly lathe piece in blue with a hat slot. Moves via an imperative
// controller (hop / jump) whose promises resolve when the animation lands.
import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { LatheGeometry, Vector2, Vector3, type Group } from 'three';
import type { HatId } from '../types';
import { Hat, HEAD_R, HEAD_Y } from './Hats';
import { TILES, wrapTile } from './layout';
import { ACCENT } from './palette';

export const PAWN_SCALE = 1.25;

export interface PawnController {
  hopTo(tile: number): Promise<void>;
  jumpTo(tile: number): Promise<void>;
}

const PROFILE = [
  [0, 0],
  [0.1, 0],
  [0.1, 0.03],
  [0.07, 0.05],
  [0.05, 0.13],
  [0.075, 0.17],
  [0.075, 0.19],
  [0.04, 0.2],
  [0, 0.2],
].map(([x, y]) => new Vector2(x, y));

const angleLerp = (a: number, b: number, t: number) => {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
};
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

interface Tween {
  active: boolean;
  from: Vector3;
  to: Vector3;
  t: number;
  dur: number;
  arc: number;
  spin: number;
  fromYaw: number;
  toYaw: number;
  squash: number;
  resolve: (() => void) | null;
}

export function Pawn({
  tile,
  hat,
  reducedMotion,
  ctlRef,
  groupRef,
}: {
  tile: number;
  hat: HatId | null;
  reducedMotion: boolean;
  ctlRef: RefObject<PawnController | null>;
  groupRef: RefObject<Group | null>;
}) {
  const lathe = useMemo(() => new LatheGeometry(PROFILE, 7), []);
  useEffect(() => () => lathe.dispose(), [lathe]);
  const body = useRef<Group>(null);
  const tw = useRef<Tween>({
    active: false,
    from: new Vector3(),
    to: new Vector3(),
    t: 0,
    dur: 0.3,
    arc: 0,
    spin: 0,
    fromYaw: 0,
    toYaw: 0,
    squash: 1,
    resolve: null,
  });
  const reduced = useRef(reducedMotion);
  useEffect(() => {
    reduced.current = reducedMotion;
  }, [reducedMotion]);

  // Snap to the tile from props whenever we're not mid-animation (initial load, restored progress).
  useLayoutEffect(() => {
    const g = groupRef.current;
    if (!g || tw.current.active) return;
    const t = TILES[wrapTile(tile)];
    g.position.set(t.x, t.y, t.z);
    g.rotation.y = t.heading;
  }, [tile, groupRef]);

  useEffect(() => {
    const start = (target: number, kind: 'hop' | 'jump') =>
      new Promise<void>((resolve) => {
        const g = groupRef.current;
        const t = TILES[wrapTile(target)];
        if (!g) return resolve();
        const s = tw.current;
        s.resolve?.();
        s.from.copy(g.position);
        s.to.set(t.x, t.y, t.z);
        s.fromYaw = g.rotation.y;
        const dx = t.x - g.position.x;
        const dz = t.z - g.position.z;
        s.toYaw = kind === 'hop' && dx * dx + dz * dz > 1e-6 ? Math.atan2(dx, dz) : t.heading;
        if (reduced.current) {
          s.dur = kind === 'hop' ? 0.16 : 0.01;
          s.arc = 0;
          s.spin = 0;
        } else if (kind === 'hop') {
          s.dur = 0.3;
          s.arc = 0.2;
          s.spin = 0;
        } else {
          s.dur = 1.35;
          s.arc = 1.6 + Math.hypot(dx, dz) * 0.18;
          s.spin = Math.PI * 2;
        }
        s.t = 0;
        s.active = true;
        s.resolve = resolve;
      });
    ctlRef.current = { hopTo: (i) => start(i, 'hop'), jumpTo: (i) => start(i, 'jump') };
    return () => {
      ctlRef.current = null;
    };
  }, [ctlRef, groupRef]);

  useFrame((_, delta) => {
    const g = groupRef.current;
    const s = tw.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);
    if (s.active) {
      s.t += dt / s.dur;
      const k = Math.min(1, s.t);
      const e = s.arc > 0.5 ? easeInOut(k) : k;
      g.position.lerpVectors(s.from, s.to, e);
      g.position.y += s.arc * 4 * k * (1 - k);
      g.rotation.y = angleLerp(s.fromYaw, s.toYaw, Math.min(1, k * 2.5)) + s.spin * e;
      if (k >= 1) {
        g.rotation.y = s.toYaw;
        s.active = false;
        s.squash = 0;
        const r = s.resolve;
        s.resolve = null;
        r?.();
      }
    }
    if (body.current) {
      if (s.squash < 1 && !reduced.current) {
        s.squash = Math.min(1, s.squash + dt / 0.2);
        const q = Math.sin(Math.PI * s.squash);
        body.current.scale.set(1 + 0.12 * q, 1 - 0.18 * q, 1 + 0.12 * q);
      } else if (body.current.scale.y !== 1) {
        body.current.scale.set(1, 1, 1);
      }
    }
  });

  return (
    <group ref={groupRef}>
      <group ref={body} scale={1}>
        <group scale={PAWN_SCALE}>
          <mesh geometry={lathe} castShadow receiveShadow>
            <meshStandardMaterial color={ACCENT} flatShading roughness={0.45} />
          </mesh>
          <mesh position={[0, HEAD_Y, 0]} castShadow receiveShadow>
            <icosahedronGeometry args={[HEAD_R, 1]} />
            <meshStandardMaterial color={ACCENT} flatShading roughness={0.45} />
          </mesh>
          {hat && <Hat id={hat} reducedMotion={reducedMotion} />}
        </group>
      </group>
    </group>
  );
}
