'use client';

// Camera: drei CameraControls. 'board' frames the whole diorama for the current aspect ratio
// (portrait gets a more top-down framing); 'follow' keeps the pawn centred while still letting the
// visitor orbit/zoom. Wheel zoom only engages after the visitor clicks the board, so the page still
// scrolls; on touch, vertical drags scroll the page and horizontal drags orbit.
import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CameraControls, CameraControlsImpl } from '@react-three/drei';
import { Box3, Vector3, type Fog, type Group, type PerspectiveCamera } from 'three';
import type { ViewMode } from './types';
import { BOARD, SECTION_LAYOUT } from './layout';
import { landmarkYaw } from './landmarks';
import { SECTION_IDS, type SectionId } from '../types';

export interface RigController {
  setView(mode: ViewMode): void;
}

const { ACTION } = CameraControlsImpl;
/** Follow-view target offset from the pawn (x, z), away from the camera. */
const FOLLOW_LEAD: [number, number] = [0, -0.5];
const FOLLOW_LEAD_PORTRAIT: [number, number] = [-0.45, 0];
const BOUNDS = new Box3(new Vector3(-BOARD.halfW - 1, -0.5, -BOARD.halfD - 1), new Vector3(BOARD.halfW + 1, 3, BOARD.halfD + 1));

// Dev-only debug view: /the-game?lm=<sectionId> frames that landmark in a close 3/4 view (for
// screenshots while modelling). Ignored in production builds.
let debugLm: SectionId | null | undefined;
function debugLandmark(): SectionId | null {
  if (process.env.NODE_ENV === 'production' || typeof window === 'undefined') return null;
  if (debugLm === undefined) {
    const id = new URLSearchParams(window.location.search).get('lm');
    debugLm = id && (SECTION_IDS as readonly string[]).includes(id) ? (id as SectionId) : null;
  }
  return debugLm;
}

function frameLandmark(c: CameraControlsImpl, id: SectionId) {
  const { x, y, z } = SECTION_LAYOUT[id].landmark;
  const yaw = landmarkYaw(id) + 0.55;
  const d = 2.3;
  const el = 0.55;
  c.setLookAt(x + d * Math.cos(el) * Math.sin(yaw), y + 0.32 + d * Math.sin(el), z + d * Math.cos(el) * Math.cos(yaw), x, y + 0.32, z, false);
}

export function CameraRig({
  ctlRef,
  pawnRef,
  reducedMotion,
  initialView,
}: {
  ctlRef: RefObject<RigController | null>;
  pawnRef: RefObject<Group | null>;
  reducedMotion: boolean;
  initialView: ViewMode;
}) {
  const controls = useRef<CameraControlsImpl>(null);
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const get = useThree((s) => s.get);
  const connected = useThree((s) => s.events.connected) as HTMLElement | undefined;
  const gl = useThree((s) => s.gl);
  const mode = useRef<ViewMode>(initialView);
  const reduced = useRef(reducedMotion);
  const lastFollow = useRef(new Vector3(Infinity, 0, 0));
  const tmp = useRef(new Vector3());
  useEffect(() => {
    reduced.current = reducedMotion;
  }, [reducedMotion]);

  const portrait = size.width / size.height < 1.2;
  const portraitRef = useRef(portrait);
  useEffect(() => {
    portraitRef.current = portrait;
  }, [portrait]);

  const frameBoard = useCallback(
    (transition: boolean) => {
      const c = controls.current;
      if (!c) return;
      const lm = debugLandmark();
      if (lm) return frameLandmark(c, lm);
      const aspect = size.width / size.height;
      const halfW = BOARD.halfW + BOARD.wallThickness;
      const halfD = BOARD.halfD + BOARD.wallThickness;
      if (aspect >= 1.2) {
        // Landscape: fov 36, fit width and depth, target nudged forward so the board clears the HUD.
        const tilt = 0.72;
        const vHalf = (camera.fov * Math.PI) / 360;
        const hHalf = Math.atan(Math.tan(vHalf) * aspect);
        const dW = (1.32 * (halfW + 0.2)) / Math.tan(hHalf);
        const dD = (1.2 * (halfD * Math.cos(tilt) + 0.6)) / Math.tan(vHalf);
        const d = Math.max(dW, dD);
        const tz = 0.45;
        c.setLookAt(0, -0.3 + d * Math.cos(tilt), tz + d * Math.sin(tilt), 0, -0.3, tz, transition);
      } else {
        // Portrait: look along the board's long axis (camera on the +x side) so it fills the
        // tall screen. Steep, near top-down tilt so the long axis isn't foreshortened, and the
        // board interior spans the full width (the cream wall may bleed off the edges), leaving
        // room for the HUD bars (~90px top, ~110px bottom).
        const half = Math.atan(Math.tan((25 * Math.PI) / 180) * aspect);
        const d = (1.04 * (halfD - BOARD.wallThickness + 0.12)) / Math.tan(half);
        const tilt = 0.3;
        const tx = 0.6;
        c.setLookAt(tx + d * Math.sin(tilt), -0.3 + d * Math.cos(tilt), 0, tx, -0.3, 0, transition);
      }
    },
    [camera, size.width, size.height],
  );

  const follow = useCallback(
    (transition: boolean) => {
      const c = controls.current;
      const p = pawnRef.current?.position;
      if (!c || !p) return;
      const lm = debugLandmark();
      if (lm) return frameLandmark(c, lm);
      // Steep enough that the view past the pawn is board, not the near frame wall; the target
      // leads a little away from the camera so the board also fills the area behind the HUD bar.
      const d = portrait ? 10 : 7.8;
      const tilt = portrait ? 0.42 : 0.64;
      const ox = portrait ? d * Math.sin(tilt) : 0;
      const oz = portrait ? 0 : d * Math.sin(tilt);
      const [lx, lz] = portrait ? FOLLOW_LEAD_PORTRAIT : FOLLOW_LEAD;
      c.setLookAt(p.x + lx + ox, p.y + 0.15 + d * Math.cos(tilt), p.z + lz + oz, p.x + lx, p.y + 0.15, p.z + lz, transition);
      lastFollow.current.copy(p);
    },
    [pawnRef, portrait],
  );

  // fov per orientation + re-frame on resize.
  useEffect(() => {
    const cam = get().camera as PerspectiveCamera;
    cam.fov = portrait ? 50 : 36;
    cam.updateProjectionMatrix();
    if (mode.current === 'board') frameBoard(false);
    else follow(false);
  }, [get, portrait, frameBoard, follow]);

  useEffect(() => {
    ctlRef.current = {
      setView(m) {
        mode.current = m;
        if (m === 'board') frameBoard(!reduced.current);
        else follow(!reduced.current);
      },
    };
    return () => {
      ctlRef.current = null;
    };
  }, [ctlRef, frameBoard, follow]);

  // Input tuning: wheel engages on click; touch keeps vertical page scrolling.
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    c.mouseButtons.left = ACTION.ROTATE;
    c.mouseButtons.right = ACTION.TRUCK;
    c.mouseButtons.middle = ACTION.DOLLY;
    c.mouseButtons.wheel = ACTION.NONE;
    c.touches.one = ACTION.TOUCH_ROTATE;
    c.touches.two = ACTION.TOUCH_DOLLY_ROTATE;
    c.touches.three = ACTION.NONE;
    c.setBoundary(BOUNDS);
    const els = [gl.domElement, connected].filter((e): e is HTMLElement => !!e && 'style' in e);
    els.forEach((e) => (e.style.touchAction = 'pan-y'));
    const engage = () => (c.mouseButtons.wheel = ACTION.DOLLY);
    const release = () => (c.mouseButtons.wheel = ACTION.NONE);
    const el = els[els.length - 1];
    el?.addEventListener('pointerdown', engage);
    el?.addEventListener('pointerleave', release);
    return () => {
      el?.removeEventListener('pointerdown', engage);
      el?.removeEventListener('pointerleave', release);
    };
  }, [gl, connected]);

  useFrame((state) => {
    const c = controls.current;
    if (!c) return;
    c.smoothTime = reduced.current ? 0 : 0.35;
    if (mode.current === 'follow' && !debugLandmark()) {
      const p = pawnRef.current?.position;
      if (p && p.distanceToSquared(lastFollow.current) > 1e-6) {
        const [lx, lz] = portraitRef.current ? FOLLOW_LEAD_PORTRAIT : FOLLOW_LEAD;
        c.moveTo(p.x + lx, p.y + 0.15, p.z + lz, !reduced.current);
        lastFollow.current.copy(p);
      }
    }
    // Fog relative to viewing distance (a fixed fog washes out the far phone view).
    const fog = state.scene.fog as Fog | null;
    if (fog) {
      const d = Math.max(state.camera.position.distanceTo(c.getTarget(tmp.current)), 6);
      fog.near = d * 1.6;
      fog.far = d * 3.2;
    }
  });

  return (
    <CameraControls
      ref={controls}
      makeDefault
      minDistance={2}
      maxDistance={26}
      minPolarAngle={0}
      maxPolarAngle={1.22}
      dollySpeed={0.6}
    />
  );
}
