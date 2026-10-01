'use client';

// The 3D diorama board. Loaded only through next/dynamic (ssr: false) so three/fiber/drei stay out
// of the page's initial bundle. Driven imperatively by GameShell via `apiRef` (see ./types.ts).
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { sectionById } from '../content';
import { SECTION_IDS } from '../types';
import { CameraRig, type RigController } from './CameraRig';
import { Clouds } from './Clouds';
import { Die, type DieController } from './Die';
import { Foliage } from './Foliage';
import { Frame } from './Frame';
import { Labels } from './Labels';
import { LANDMARKS, landmarkYaw } from './landmarks';
import { BOARD, SECTION_LAYOUT, TILES, wrapTile } from './layout';
import { PAGE_BG } from './palette';
import { Pawn, type PawnController } from './Pawn';
import { Terrain } from './Terrain';
import { Tiles } from './Tiles';
import type { BoardProps } from './types';
import { Vehicles } from './Vehicles';
import { Water } from './Water';

const SUN: [number, number, number] = [-9, 15, 7];

function useNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const apply = () => setNarrow(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  return narrow;
}

/** Reports readiness after the first rendered frame (so the loading veil lifts on a drawn board). */
function FirstFrame({ onFrame }: { onFrame?: () => void }) {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    onFrame?.();
  });
  return null;
}

function Landmarks({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <group>
      {SECTION_IDS.map((id) => {
        const L = LANDMARKS[id];
        const { x, y, z } = SECTION_LAYOUT[id].landmark;
        return (
          <group key={id} position={[x, y, z]} rotation-y={landmarkYaw(id)}>
            <L color={sectionById(id).color} reducedMotion={reducedMotion} />
          </group>
        );
      })}
    </group>
  );
}

export default function BoardScene({ apiRef, pawnTile, hat, lang, reducedMotion, active, onReady }: BoardProps) {
  const narrow = useNarrow();
  const pawnRef = useRef<Group>(null);
  const pawnCtl = useRef<PawnController | null>(null);
  const dieCtl = useRef<DieController | null>(null);
  const rigCtl = useRef<RigController | null>(null);
  const tileRef = useRef(pawnTile);
  useEffect(() => {
    tileRef.current = pawnTile;
  }, [pawnTile]);

  useEffect(() => {
    apiRef.current = {
      hopTo: (t) => pawnCtl.current?.hopTo(t) ?? Promise.resolve(),
      jumpTo: (t) => pawnCtl.current?.jumpTo(t) ?? Promise.resolve(),
      rollDie: (v) => dieCtl.current?.roll(v, tileRef.current) ?? Promise.resolve(),
      hideDie: () => dieCtl.current?.hide(),
      setView: (m) => rigCtl.current?.setView(m),
    };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef]);

  const shadowSize = narrow ? 1024 : 2048;
  const pawnSection = TILES[wrapTile(pawnTile)].sectionIndex;
  const dpr = useMemo<[number, number]>(() => [1, narrow ? 1.5 : 1.75], [narrow]);

  return (
    <Canvas
      shadows="soft"
      dpr={dpr}
      // Paused ('demand', not 'never'): no continuous rendering, but the scene still draws when the
      // canvas mounts or resizes, so the last frame stays visible behind dialogs instead of a blank
      // canvas (e.g. a mini-game opened before the first frame, or a resize while it is open).
      frameloop={active ? 'always' : 'demand'}
      camera={{ fov: 36, near: 0.1, far: 200, position: [0, 12, 12] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.05;
      }}
      style={{ isolation: 'isolate' }}
    >
      <color attach="background" args={[PAGE_BG]} />
      <fog attach="fog" args={[PAGE_BG, 34, 70]} />
      <hemisphereLight args={['#fff4e0', '#6b7b82', 1.25]} />
      <directionalLight
        position={SUN}
        intensity={2.1}
        color="#ffedd2"
        castShadow
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-BOARD.halfW - 2}
        shadow-camera-right={BOARD.halfW + 2}
        shadow-camera-top={BOARD.halfW}
        shadow-camera-bottom={-BOARD.halfW}
        shadow-camera-near={1}
        shadow-camera-far={45}
      />
      <Frame />
      <Terrain />
      <Water reducedMotion={reducedMotion} />
      <Foliage />
      <Tiles />
      <Landmarks reducedMotion={reducedMotion} />
      <Clouds reducedMotion={reducedMotion} />
      <Vehicles reducedMotion={reducedMotion} />
      <Pawn tile={pawnTile} hat={hat} reducedMotion={reducedMotion} ctlRef={pawnCtl} groupRef={pawnRef} />
      <Die ctlRef={dieCtl} reducedMotion={reducedMotion} />
      <Labels lang={lang} narrow={narrow} pawnSection={pawnSection} />
      <FirstFrame onFrame={onReady} />
      <CameraRig ctlRef={rigCtl} pawnRef={pawnRef} reducedMotion={reducedMotion} initialView="board" />
    </Canvas>
  );
}
