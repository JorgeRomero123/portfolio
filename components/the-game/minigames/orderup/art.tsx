// Flat low-poly SVG art for "Order up": ingredients (drawn centred on 0,0, ~40 units tall),
// the pan, the finished dishes and the service bell. Pure, stateless, no randomness.
import type { ReactNode } from 'react';

export const INGS = ['oil', 'onion', 'tomato', 'chile', 'cilantro', 'egg', 'tortilla', 'cheese'] as const;
export type Ing = (typeof INGS)[number];
export type Dish = 'eggs' | 'chilaquiles' | 'quesadilla';

const S = { stroke: '#1f2937', strokeWidth: 1.2, strokeLinejoin: 'round' as const };

const ICONS: Record<Ing, ReactNode> = {
  oil: (
    <>
      <polygon points="-10,-5 -4,-11 -4,-18 4,-18 4,-11 10,-5 10,18 -10,18" fill="#facc15" {...S} />
      <polygon points="-10,-5 -4,-11 -4,-18 0,-18 0,18 -10,18" fill="#fde047" />
      <polygon points="-10,-5 -4,-11 -4,-18 4,-18 4,-11 10,-5 10,18 -10,18" fill="none" {...S} />
      <rect x="-5.5" y="-23" width="11" height="6" rx="1" fill="#15803d" {...S} />
      <rect x="-10" y="1" width="20" height="9" fill="#fefce8" {...S} />
      <polygon points="-3,3 3,3 0,8" fill="#84cc16" />
    </>
  ),
  onion: (
    <>
      <polygon points="0,-18 7,-9 14,-1 12,10 5,17 -5,17 -12,10 -14,-1 -7,-9" fill="#f5f3ff" {...S} />
      <polygon points="0,-18 7,-9 14,-1 12,10 5,17 0,17" fill="#ddd6fe" />
      <polygon points="0,-18 7,-9 14,-1 12,10 5,17 -5,17 -12,10 -14,-1 -7,-9" fill="none" {...S} />
      <polyline points="0,-12 -5,-1 -3,12" fill="none" stroke="#c4b5fd" strokeWidth="1.4" />
      <polyline points="0,-12 5,-1 3,12" fill="none" stroke="#a78bfa" strokeWidth="1.4" />
      <polygon points="-2,-18 0,-25 2,-18" fill="#65a30d" {...S} />
    </>
  ),
  tomato: (
    <>
      <polygon points="0,-15 11,-11 16,0 12,11 0,16 -12,11 -16,0 -11,-11" fill="#ef4444" {...S} />
      <polygon points="0,-15 11,-11 16,0 12,11 0,16" fill="#dc2626" />
      <polygon points="0,-15 11,-11 16,0 12,11 0,16 -12,11 -16,0 -11,-11" fill="none" {...S} />
      <polygon points="-7,-6 -3,-3 -9,1" fill="#fca5a5" />
      <polygon points="0,-18 3,-13 9,-14 4,-10 6,-6 0,-9 -6,-6 -4,-10 -9,-14 -3,-13" fill="#16a34a" {...S} />
    </>
  ),
  chile: (
    <>
      <polygon points="-11,-12 -4,-13 3,-7 9,2 12,12 9,19 5,14 -3,4 -11,-5" fill="#16a34a" {...S} />
      <polygon points="-11,-12 -4,-13 3,-7 9,2 12,12 9,19 5,14 -1,1 -7,-8" fill="#22c55e" />
      <polygon points="-11,-12 -4,-13 3,-7 9,2 12,12 9,19 5,14 -3,4 -11,-5" fill="none" {...S} />
      <polygon points="-12,-11 -16,-18 -12,-20 -8,-13" fill="#4d7c0f" {...S} />
    </>
  ),
  cilantro: (
    <>
      <polyline points="0,20 0,2 -8,-8" fill="none" stroke="#15803d" strokeWidth="2" />
      <polyline points="0,6 8,-6" fill="none" stroke="#15803d" strokeWidth="2" />
      <polygon points="-8,-8 -16,-10 -15,-17 -9,-20 -3,-15 -3,-9" fill="#22c55e" {...S} />
      <polygon points="8,-6 3,-12 5,-19 12,-20 16,-14 14,-7" fill="#16a34a" {...S} />
      <polygon points="0,1 -6,-3 -5,-9 1,-12 6,-8 5,-2" fill="#4ade80" {...S} />
    </>
  ),
  egg: (
    <>
      <polygon points="0,-19 8,-14 12,-3 11,8 6,15 0,17 -6,15 -11,8 -12,-3 -8,-14" fill="#fffbeb" {...S} />
      <polygon points="0,-19 8,-14 12,-3 11,8 6,15 0,17" fill="#fde7c2" />
      <polygon points="0,-19 8,-14 12,-3 11,8 6,15 0,17 -6,15 -11,8 -12,-3 -8,-14" fill="none" {...S} />
      <polygon points="-6,-9 -3,-12 -4,-5" fill="#ffffff" />
    </>
  ),
  tortilla: (
    <>
      <polygon points="0,-17 12,-12 17,0 12,12 0,17 -12,12 -17,0 -12,-12" fill="#f3d9a4" {...S} />
      <polygon points="0,-17 12,-12 17,0 12,12 0,17" fill="#e9c585" />
      <polygon points="0,-17 12,-12 17,0 12,12 0,17 -12,12 -17,0 -12,-12" fill="none" {...S} />
      <polygon points="-7,-6 -4,-8 -3,-4" fill="#b7793a" />
      <polygon points="5,-9 8,-7 6,-5" fill="#b7793a" />
      <polygon points="3,5 7,4 6,8" fill="#b7793a" />
      <polygon points="-8,6 -5,5 -6,9" fill="#b7793a" />
    </>
  ),
  cheese: (
    <>
      <polygon points="-17,-4 10,-12 17,-3 17,11 -17,11" fill="#f59e0b" {...S} />
      <polygon points="-17,-4 17,-3 17,11 -17,11" fill="#fcd34d" />
      <polygon points="-17,-4 10,-12 17,-3 17,11 -17,11" fill="none" {...S} />
      <line x1="-17" y1="-4" x2="17" y2="-3" {...S} />
      <circle cx="-8" cy="3" r="2.6" fill="#f59e0b" />
      <circle cx="6" cy="6" r="2" fill="#f59e0b" />
      <circle cx="11" cy="1" r="1.5" fill="#f59e0b" />
    </>
  ),
};

export function IngIcon({ ing }: { ing: Ing }) {
  return <g>{ICONS[ing]}</g>;
}

/** Stand-alone icon for HTML (the ticket). */
export function IngSvg({ ing, size = 28 }: { ing: Ing; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="-22 -26 44 48" aria-hidden focusable="false">
      <IngIcon ing={ing} />
    </svg>
  );
}

/** Pan in side view, rim centred at (0,0); `contents` are drawn inside it. */
export function Pan({ contents, accent }: { contents: Ing[]; accent: string }) {
  const shown = contents.slice(-5);
  return (
    <g>
      <polygon points="46,-3 80,-8 82,-2 46,4" fill="#111827" {...S} />
      <rect x="71" y="-8" width="6" height="7" fill={accent} transform="rotate(-7 74 -4)" />
      {shown.map((ing, i) => (
        <g key={i} transform={`translate(${(i - (shown.length - 1) / 2) * 17} ${-4 - (i % 2) * 3}) scale(0.6)`}>
          <IngIcon ing={ing} />
        </g>
      ))}
      <polygon points="-50,-4 50,-4 42,14 -42,14" fill="#374151" {...S} />
      <polygon points="0,-4 50,-4 42,14 0,14" fill="#1f2937" />
      <polygon points="-50,-4 50,-4 42,14 -42,14" fill="none" {...S} />
      <rect x="-52" y="-7" width="104" height="5" rx="2" fill="#6b7280" {...S} />
      <polygon points="-40,1 -18,1 -22,5 -39,5" fill="#4b5563" />
    </g>
  );
}

/** Finished dish on a plate, centred on (0,0), ~120 wide. */
export function DishArt({ dish }: { dish: Dish }) {
  return (
    <g>
      <ellipse cx="0" cy="12" rx="62" ry="18" fill="#e5e7eb" {...S} />
      <ellipse cx="0" cy="8" rx="56" ry="15" fill="#ffffff" {...S} />
      {dish === 'eggs' && (
        <>
          <polygon points="-38,8 -28,-6 -12,-12 6,-11 24,-6 38,4 26,14 -4,17 -28,15" fill="#fde047" {...S} />
          <polygon points="-12,-12 6,-11 24,-6 38,4 26,14 6,10" fill="#facc15" />
          <polygon points="-18,0 -13,-3 -12,2" fill="#dc2626" />
          <polygon points="8,2 13,-1 14,4" fill="#dc2626" />
          <polygon points="-2,8 3,6 2,11" fill="#16a34a" />
          <polygon points="20,4 24,2 23,7" fill="#16a34a" />
          <polygon points="-28,6 -24,4 -25,9" fill="#f5f3ff" />
        </>
      )}
      {dish === 'chilaquiles' && (
        <>
          <polygon points="-40,10 -30,-8 -16,4" fill="#dc2626" {...S} />
          <polygon points="-24,8 -12,-14 -2,6" fill="#ef4444" {...S} />
          <polygon points="-6,10 8,-12 16,8" fill="#dc2626" {...S} />
          <polygon points="10,10 26,-6 36,10" fill="#ef4444" {...S} />
          <polygon points="-30,12 -18,0 -8,14" fill="#b91c1c" {...S} />
          <polygon points="-14,-2 -6,-5 -2,0 -10,2" fill="#fef3c7" />
          <polygon points="12,-2 20,-4 22,1 14,2" fill="#fef3c7" />
          <polygon points="-26,4 -20,2 -18,6" fill="#fef3c7" />
          <polygon points="2,4 5,1 7,5" fill="#16a34a" />
        </>
      )}
      {dish === 'quesadilla' && (
        <>
          <polygon points="-40,10 -36,-6 -24,-16 -6,-20 12,-18 28,-10 38,2 40,10" fill="#f3d9a4" {...S} />
          <polygon points="-6,-20 12,-18 28,-10 38,2 40,10 4,10" fill="#e9c585" />
          <polygon points="-34,10 -30,6 30,6 34,10" fill="#fcd34d" />
          <polygon points="-18,-8 -14,-11 -12,-6" fill="#b7793a" />
          <polygon points="10,-10 14,-12 15,-8" fill="#b7793a" />
          <polygon points="-2,6 3,3 5,8" fill="#16a34a" />
          <polygon points="18,6 22,4 23,9" fill="#16a34a" />
          <polygon points="-40,10 -36,-6 -24,-16 -6,-20 12,-18 28,-10 38,2 40,10" fill="none" {...S} />
        </>
      )}
    </g>
  );
}

/** Service bell, base centred on (0,0). */
export function Bell() {
  return (
    <g>
      <rect x="-22" y="-3" width="44" height="6" rx="1.5" fill="#6b7280" {...S} />
      <polygon points="-18,-3 -16,-13 -9,-21 0,-23 9,-21 16,-13 18,-3" fill="#facc15" {...S} />
      <polygon points="0,-23 9,-21 16,-13 18,-3 0,-3" fill="#eab308" />
      <polygon points="-18,-3 -16,-13 -9,-21 0,-23 9,-21 16,-13 18,-3" fill="none" {...S} />
      <rect x="-2.5" y="-28" width="5" height="5" fill="#374151" {...S} />
    </g>
  );
}
