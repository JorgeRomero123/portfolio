'use client';

// A pawn: a low-poly lathe piece with a hat slot. The visitor's is blue and walks the middle of the
// path; Jorge's (the rival in the race) is dark, carries a flag and keeps to one side of it.
// Moves via an imperative controller (hop / jump) whose promises resolve when the animation lands.
import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { LatheGeometry, Vector2, Vector3, type Group, type Mesh, type MeshBasicMaterial } from 'three';
import type { HatId } from '../types';
import { Hat, HEAD_R, HEAD_Y } from './Hats';
import { TILES, wrapTile } from './layout';
import { ACCENT, INK } from './palette';

export const PAWN_SCALE = 1.85;
const FLAG = '#dc2626';

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

/** Where a pawn stands on `tile`, `lane` world units towards the inside of the loop. */
const spot = (tile: number, lane: number) => {
  const t = TILES[wrapTile(tile)];
  return { x: t.x + t.inward[0] * lane, y: t.y, z: t.z + t.inward[1] * lane, heading: t.heading };
};

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
  color = ACCENT,
  lane = 0,
  scale = PAWN_SCALE,
  flag = false,
}: {
  tile: number;
  hat: HatId | null;
  reducedMotion: boolean;
  ctlRef: RefObject<PawnController | null>;
  groupRef: RefObject<Group | null>;
  color?: string;
  /** Sideways offset from the middle of the path, towards the inside of the loop (world units). */
  lane?: number;
  scale?: number;
  /** A little pennant on the head: marks Jorge's pawn. */
  flag?: boolean;
}) {
  const lathe = useMemo(() => new LatheGeometry(PROFILE, 7), []);
  useEffect(() => () => lathe.dispose(), [lathe]);
  const body = useRef<Group>(null);
  const halo = useRef<Mesh>(null);
  const pulse = useRef(0);
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
    const t = spot(tile, lane);
    g.position.set(t.x, t.y, t.z);
    g.rotation.y = t.heading;
  }, [tile, lane, groupRef]);

  useEffect(() => {
    const start = (target: number, kind: 'hop' | 'jump') =>
      new Promise<void>((resolve) => {
        const g = groupRef.current;
        const t = spot(target, lane);
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
    ctlRef.current = {
      hopTo: (i) => start(i, 'hop'),
      jumpTo: (i) => start(i, 'jump'),
    };
    return () => {
      ctlRef.current = null;
    };
  }, [ctlRef, groupRef, lane]);

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
    // Soft ground ring under the pawn (stays on the ground during hops; pulses unless reduced motion).
    const ring = halo.current;
    if (ring) {
      const k = s.active ? Math.min(1, s.t) : 1;
      ring.position.set(g.position.x, (s.active ? s.from.y + (s.to.y - s.from.y) * k : g.position.y) + 0.006, g.position.z);
      const m = ring.material as MeshBasicMaterial;
      if (reduced.current) {
        ring.scale.setScalar(1);
        m.opacity = 0.5;
      } else {
        pulse.current = (pulse.current + dt / 1.6) % 1;
        const u = pulse.current;
        ring.scale.setScalar(0.85 + 0.45 * u);
        m.opacity = 0.6 * (1 - u) * (s.active ? 0.4 : 1);
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
    <>
      <mesh ref={halo} rotation-x={-Math.PI / 2} renderOrder={1}>
        <ringGeometry args={[0.2, 0.26, 28]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} depthWrite={false} />
      </mesh>
      <group ref={groupRef}>
        <group ref={body} scale={1}>
          <group scale={scale}>
            <mesh geometry={lathe} castShadow receiveShadow>
              <meshStandardMaterial color={color} flatShading roughness={0.45} />
            </mesh>
            <mesh position={[0, HEAD_Y, 0]} castShadow receiveShadow>
              <icosahedronGeometry args={[HEAD_R, 1]} />
              <meshStandardMaterial color={color} flatShading roughness={0.45} />
            </mesh>
            {hat && <Hat id={hat} reducedMotion={reducedMotion} />}
            {flag && (
              <group position={[0, HEAD_Y + HEAD_R - 0.01, 0]}>
                <mesh position={[0, 0.075, 0]} castShadow>
                  <cylinderGeometry args={[0.007, 0.007, 0.15, 5]} />
                  <meshStandardMaterial color={INK} flatShading />
                </mesh>
                <mesh position={[0.045, 0.12, 0]} castShadow>
                  <boxGeometry args={[0.09, 0.055, 0.006]} />
                  <meshStandardMaterial color={FLAG} flatShading roughness={0.6} />
                </mesh>
              </group>
            )}
          </group>
        </group>
      </group>
    </>
  );
}
