'use client';

// Drone videography: a landing pad with a cyan ring, an "H", corner lights and a windsock, and a
// small quadcopter circling above it (spinning props, gentle bob and bank, gimbal camera).
// The orbit stays inside the pad radius so it never passes over the path or the pawn.
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, Mesh } from 'three';
import { Baked, Kit, ball, box, cone, cyl, glow, mat, once } from './kit';

const ORBIT_R = 0.26;
const ORBIT_Y = 0.52;
const ORBIT_Z = -0.06;
const ARM = 0.11;

function buildPad(color: string) {
  const k = new Kit();
  const dark = mat('#3b4150');
  k.add(mat('#f6efe2'), cyl(0.46, 0.47, 0.03, 8), [0, 0.015, 0], [0, Math.PI / 8, 0]);
  k.add(dark, cyl(0.36, 0.37, 0.04, 8), [0, 0.02, 0], [0, Math.PI / 8, 0]);
  k.add(mat(color, { roughness: 0.5 }), cyl(0.3, 0.3, 0.044, 24), [0, 0.022, 0]);
  k.add(dark, cyl(0.26, 0.26, 0.046, 24), [0, 0.023, 0]);
  const white = mat('#f8fafc');
  k.add(white, box(0.04, 0.01, 0.22), [-0.075, 0.047, 0]);
  k.add(white, box(0.04, 0.01, 0.22), [0.075, 0.047, 0]);
  k.add(white, box(0.11, 0.01, 0.04), [0, 0.047, 0]);
  const lamp = glow('#fef3c7', 1.1);
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    k.add(lamp, ball(0.02), [Math.cos(a) * 0.33, 0.05, Math.sin(a) * 0.33]);
  }
  // Windsock
  k.add(mat('#d1d5db'), cyl(0.007, 0.009, 0.36, 5), [-0.38, 0.2, -0.2]);
  k.add(mat('#f97316'), cone(0.028, 0.14, 6), [-0.31, 0.35, -0.2], [0, 0, Math.PI / 2 + 0.25]);
  return k.bake();
}

function buildDrone(color: string) {
  const k = new Kit();
  const white = mat('#f8fafc', { roughness: 0.45 });
  const dark = mat('#2b303b');
  k.add(white, box(0.12, 0.045, 0.16), [0, 0, 0]);
  k.add(mat(color, { roughness: 0.45 }), box(0.085, 0.02, 0.11), [0, 0.03, -0.01]);
  k.add(dark, box(0.3, 0.018, 0.024), [0, 0.005, 0], [0, Math.PI / 4, 0]);
  k.add(dark, box(0.3, 0.018, 0.024), [0, 0.005, 0], [0, -Math.PI / 4, 0]);
  for (const [x, z] of [[ARM, ARM], [-ARM, ARM], [ARM, -ARM], [-ARM, -ARM]]) {
    k.add(dark, cyl(0.02, 0.022, 0.035, 8), [x, 0.02, z]);
    k.add(white, box(0.012, 0.045, 0.012), [x * 0.8, -0.035, z * 0.8]);
  }
  // Gimbal + camera
  k.add(dark, box(0.03, 0.03, 0.02), [0, -0.035, 0.075]);
  k.add(dark, box(0.05, 0.04, 0.045), [0, -0.06, 0.085]);
  k.add(mat('#0f172a', { roughness: 0.2 }), cyl(0.014, 0.014, 0.012, 10), [0, -0.06, 0.111], [Math.PI / 2, 0, 0]);
  return k.bake();
}

export default function Drone({ color, reducedMotion }: { color: string; reducedMotion: boolean }) {
  const pad = once(`drone:pad:${color}`, () => buildPad(color));
  const body = once(`drone:body:${color}`, () => buildDrone(color));
  const drone = useRef<Group>(null);
  const props = useRef<(Mesh | null)[]>([]);
  const t = useRef(0.8);
  useFrame((_, dt) => {
    if (!reducedMotion) t.current += Math.min(dt, 0.05);
    const tt = t.current;
    const g = drone.current;
    if (!g) return;
    const a = tt * 0.55;
    g.position.set(Math.cos(a) * ORBIT_R, ORBIT_Y + Math.sin(tt * 1.7) * 0.025, ORBIT_Z + Math.sin(a) * ORBIT_R);
    // Face along the orbit tangent, banked a little into the turn.
    g.rotation.set(0, -a, reducedMotion ? 0 : 0.12, 'YXZ');
    if (!reducedMotion) props.current.forEach((p, i) => p && (p.rotation.y = tt * 38 + i));
  });
  const propMat = mat('#cbd5e1', { transparent: true, opacity: 0.75 });
  return (
    <group>
      <Baked parts={pad} />
      <group ref={drone}>
        <group scale={1.25}>
          <Baked parts={body} />
          {[
            [ARM, ARM],
            [-ARM, ARM],
            [ARM, -ARM],
            [-ARM, -ARM],
          ].map(([x, z], i) => (
            <mesh
              key={i}
              ref={(m) => {
                props.current[i] = m;
              }}
              position={[x, 0.042, z]}
              material={propMat}
            >
              <boxGeometry args={[0.13, 0.004, 0.018]} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}
