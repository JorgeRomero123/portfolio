'use client';

// Localized section labels floating over each landmark (drei Html, no occlusion, no pointer events),
// with a halo so they read on any terrain. Narrow screens get short labels, only near the pawn.
import { Html } from '@react-three/drei';
import { sectionById } from '../content';
import { SHORT_LABELS, STRINGS } from '../strings';
import { SECTION_IDS, type Lang } from '../types';
import { SECTION_COUNT, SECTION_LAYOUT, START_TILE, TILES } from './layout';

const HALO = '0 0 2px #fff, 0 0 3px #fff, 0 0 6px #fff, 0 0 9px #fff';

export function Labels({ lang, narrow, pawnSection }: { lang: Lang; narrow: boolean; pawnSection: number }) {
  const start = TILES[START_TILE];
  return (
    <group>
      {SECTION_IDS.map((id, i) => {
        const d = Math.min(Math.abs(i - pawnSection), SECTION_COUNT - Math.abs(i - pawnSection));
        if (narrow && d > 2) return null;
        const { x, y, z } = SECTION_LAYOUT[id].landmark;
        const sec = sectionById(id);
        return (
          <Html key={id} position={[x, y + 0.8, z]} center pointerEvents="none" zIndexRange={[10, 0]}>
            <div
              aria-hidden
              className={`flex items-center gap-1.5 whitespace-nowrap font-semibold tracking-[0.01em] text-gray-900 select-none ${
                narrow ? 'text-[11px]' : 'text-[12.5px]'
              }`}
              style={{ textShadow: HALO }}
            >
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ background: sec.color, boxShadow: '0 0 0 1.5px #fff' }}
              />
              {narrow ? SHORT_LABELS[id][lang] : sec.title[lang]}
            </div>
          </Html>
        );
      })}
      <Html position={[start.x, start.y + 0.68, start.z]} center pointerEvents="none" zIndexRange={[10, 0]}>
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
