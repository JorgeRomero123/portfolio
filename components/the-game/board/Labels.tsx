'use client';

// Localized section labels pinned just above each landmark model (drei Html, no occlusion, no
// pointer events). Each label sits on a thin stem whose foot touches the model's top.
// One rule for every section: full titles on wide screens, short names on narrow ones; the
// section the pawn is in is emphasised. Every frame, labels are:
//  - hidden when their anchor is off-screen, and clamped horizontally when only the text would be cut;
//  - decluttered: nearer labels are placed first, and any later label that would overlap one gets a
//    longer stem, so it stacks above instead of covering it (e.g. Kitchen / e.marts on phones).
// On narrow (near top-down) views the base stem is longer, so the label clears its own model.
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Vector3, type Camera, type Object3D } from 'three';
import { sectionById } from '../content';
import { SHORT_LABELS, STRINGS } from '../strings';
import { SECTION_IDS, type Lang } from '../types';
import { landmarkLabelAnchor } from './landmarks';
import { SECTION_COUNT, START_TILE, TILES } from './layout';

const HALO = '0 0 2px #fff, 0 0 3px #fff, 0 0 6px #fff, 0 0 9px #fff';
const EDGE = 6; // px kept clear of the canvas edges
const GAP = 3; // px between stacked labels
const MAX_STEM = 140;

const V = new Vector3();

function project(obj: Object3D, camera: Camera, w: number, h: number): [number, number, boolean] {
  V.setFromMatrixPosition(obj.matrixWorld).project(camera);
  const x = ((V.x + 1) / 2) * w;
  const y = ((1 - V.y) / 2) * h;
  return [x, y, V.z < 1 && x >= 0 && x <= w && y >= 0 && y <= h];
}

export function Labels({ lang, narrow, pawnSection }: { lang: Lang; narrow: boolean; pawnSection: number }) {
  const start = TILES[START_TILE];
  const baseStem = narrow ? 20 : 8;
  const labelH = narrow ? 15 : 19;

  const wraps = useRef<(HTMLDivElement | null)[]>([]);
  const stems = useRef<(HTMLSpanElement | null)[]>([]);
  const anchors = useRef<(Object3D | null)[]>([]);
  const state = useRef({
    widths: new Float32Array(SECTION_COUNT),
    stem: new Float32Array(SECTION_COUNT).fill(-1),
    sx: new Float32Array(SECTION_COUNT),
    sy: new Float32Array(SECTION_COUNT),
    on: new Uint8Array(SECTION_COUNT),
    order: Array.from({ length: SECTION_COUNT }, (_, i) => i),
    // placed rects: left, right, top, bottom
    rect: new Float32Array(SECTION_COUNT * 4),
  });
  // Re-measure widths whenever the text or its size changes.
  useEffect(() => {
    state.current.widths.fill(0);
    state.current.stem.fill(-1);
  }, [lang, narrow, pawnSection]);

  // Horizontal clamp so a label near the edge stays fully readable (used by drei's positioning).
  const calc = useMemo(
    () =>
      SECTION_IDS.map((_, i) => (el: Object3D, camera: Camera, size: { width: number; height: number }) => {
        const [x, y] = project(el, camera, size.width, size.height);
        const half = (state.current.widths[i] || 60) / 2;
        return [Math.min(size.width - half - EDGE, Math.max(half + EDGE, x)), y];
      }),
    [],
  );

  useFrame(({ camera, size }) => {
    const s = state.current;
    for (let i = 0; i < SECTION_COUNT; i++) {
      const a = anchors.current[i];
      if (!a) continue;
      const [x, y, on] = project(a, camera, size.width, size.height);
      s.sx[i] = x;
      s.sy[i] = y;
      s.on[i] = on ? 1 : 0;
      const wrap = wraps.current[i];
      if (wrap && !s.widths[i]) s.widths[i] = wrap.offsetWidth;
    }
    // Nearest (lowest on screen) first.
    s.order.sort((p, q) => s.sy[q] - s.sy[p]);
    let placed = 0;
    for (const i of s.order) {
      const wrap = wraps.current[i];
      if (!wrap) continue;
      const vis = s.on[i] ? 'visible' : 'hidden';
      if (wrap.style.visibility !== vis) wrap.style.visibility = vis;
      if (!s.on[i]) continue;
      const w = s.widths[i] || 60;
      const cx = Math.min(size.width - w / 2 - EDGE, Math.max(w / 2 + EDGE, s.sx[i]));
      let stem = baseStem;
      for (let pass = 0; pass < SECTION_COUNT; pass++) {
        const bottom = s.sy[i] - stem;
        const top = bottom - labelH;
        let bumped = false;
        for (let k = 0; k < placed; k++) {
          const l = s.rect[k * 4];
          const r = s.rect[k * 4 + 1];
          const t = s.rect[k * 4 + 2];
          const b = s.rect[k * 4 + 3];
          if (cx + w / 2 + GAP > l && cx - w / 2 - GAP < r && top < b + GAP && bottom > t - GAP) {
            stem = s.sy[i] - (t - GAP);
            bumped = true;
          }
        }
        if (!bumped) break;
      }
      stem = Math.min(stem, MAX_STEM);
      s.rect[placed * 4] = cx - w / 2;
      s.rect[placed * 4 + 1] = cx + w / 2;
      s.rect[placed * 4 + 2] = s.sy[i] - stem - labelH;
      s.rect[placed * 4 + 3] = s.sy[i] - stem;
      placed++;
      const el = stems.current[i];
      if (el && Math.abs(s.stem[i] - stem) > 0.5) {
        s.stem[i] = stem;
        el.style.height = `${stem}px`;
      }
    }
  });

  return (
    <group>
      {SECTION_IDS.map((id, i) => {
        const sec = sectionById(id);
        const here = i === pawnSection;
        return (
          <group
            key={id}
            position={landmarkLabelAnchor(id)}
            ref={(g) => {
              anchors.current[i] = g;
            }}
          >
            <Html pointerEvents="none" zIndexRange={[10, 0]} calculatePosition={calc[i]}>
              <div
                aria-hidden
                ref={(d) => {
                  wraps.current[i] = d;
                }}
                className="flex flex-col items-center select-none"
                style={{ transform: 'translate(-50%, -100%)' }}
              >
                <div
                  className={`flex items-center gap-1 whitespace-nowrap font-semibold tracking-[0.01em] text-gray-900 ${
                    narrow ? (here ? 'text-[11px]' : 'text-[9.5px]') : here ? 'text-[13.5px]' : 'text-[12px]'
                  }`}
                  style={{ textShadow: HALO }}
                >
                  <span
                    className={`inline-block shrink-0 rounded-full ${narrow ? 'h-1.5 w-1.5' : 'h-2 w-2'}`}
                    style={{ background: sec.color, boxShadow: '0 0 0 1.5px #fff' }}
                  />
                  {narrow ? SHORT_LABELS[id][lang] : sec.title[lang]}
                </div>
                <span
                  ref={(el) => {
                    stems.current[i] = el;
                  }}
                  className="block w-px"
                  style={{ height: baseStem, background: sec.color, boxShadow: '0 0 0 1px rgba(255,255,255,.8)' }}
                />
              </div>
            </Html>
          </group>
        );
      })}
      <Html position={[start.x, start.y + 0.78, start.z]} center pointerEvents="none" zIndexRange={[10, 0]}>
        <div
          aria-hidden
          className="whitespace-nowrap font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#0070f3] select-none"
          style={{ textShadow: HALO }}
        >
          {STRINGS[lang].start}
        </div>
      </Html>
    </group>
  );
}
