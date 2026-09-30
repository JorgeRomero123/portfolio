'use client';

// Localized section labels pinned to the top of each landmark model (drei Html, no occlusion, no
// pointer events): the label's bottom-centre sits on a short stem that touches the model, so it
// stays on its landmark at any zoom. One rule for every section: full titles on wide screens,
// short names on narrow ones; the section the pawn is in is emphasised.
import { Html } from '@react-three/drei';
import { sectionById } from '../content';
import { SHORT_LABELS, STRINGS } from '../strings';
import { SECTION_IDS, type Lang } from '../types';
import { LANDMARK_TOP } from './landmarks';
import { SECTION_LAYOUT, START_TILE, TILES } from './layout';

const HALO = '0 0 2px #fff, 0 0 3px #fff, 0 0 6px #fff, 0 0 9px #fff';

export function Labels({ lang, narrow, pawnSection }: { lang: Lang; narrow: boolean; pawnSection: number }) {
  const start = TILES[START_TILE];
  return (
    <group>
      {SECTION_IDS.map((id, i) => {
        const { x, y, z } = SECTION_LAYOUT[id].landmark;
        const sec = sectionById(id);
        const here = i === pawnSection;
        return (
          <Html key={id} position={[x, y + LANDMARK_TOP[id], z]} pointerEvents="none" zIndexRange={[10, 0]}>
            <div
              aria-hidden
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
              <span className="block h-2 w-px" style={{ background: sec.color, boxShadow: '0 0 0 1px rgba(255,255,255,.8)' }} />
            </div>
          </Html>
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
