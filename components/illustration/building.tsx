import { useId, type CSSProperties } from 'react';
import { C, InkSvg } from './ink';

/**
 * Pieces of the building the homepage scrolls down. The strips (slab, railing, slat
 * wall) only ink their long edges and skip the wobble — its noise differs at opposite
 * edges, which would break every line at a tile seam. The rest are drawn whole.
 */

type Props = { className?: string; style?: CSSProperties };

const SLAT = '#E8B98C';

/* --------------------------------------------------------------- floor slab */

/** Concrete slab between floors: floor finish on top, halftone underside. Tiles horizontally. */
export function FloorSlab(p: Props) {
  return (
    <InkSvg viewBox="0 0 400 40" label="" wobble={0} {...p}>
      {(ids) => (
        <>
          <rect x={-4} y={0} width={408} height={9} fill={C.peach} stroke="none" />
          <rect x={-4} y={9} width={408} height={25} fill={C.steel} stroke="none" />
          <rect x={-4} y={22} width={408} height={12} fill={`url(#${ids.dots})`} stroke="none" opacity={0.4} />
          <path d="M 0 1 L 400 1 M 0 9 L 400 9 M 0 34 L 400 34" />
        </>
      )}
    </InkSvg>
  );
}

/* ---------------------------------------------------------- balcony railing */

/** Wooden handrail over thin balusters. Tiles horizontally. */
export function Railing(p: Props) {
  return (
    <InkSvg viewBox="0 0 400 90" label="" wobble={0} {...p}>
      {() => (
        <>
          {Array.from({ length: 20 }, (_, i) => 10 + i * 20).map((x) => (
            <path key={x} d={`M ${x} 18 L ${x} 80`} strokeWidth={3} />
          ))}
          {[[8, 10], [78, 8]].map(([y, h]) => (
            <g key={y}>
              <rect x={-4} y={y} width={408} height={h} fill={C.bark} stroke="none" />
              <path d={`M 0 ${y} L 400 ${y} M 0 ${y + h} L 400 ${y + h}`} />
            </g>
          ))}
        </>
      )}
    </InkSvg>
  );
}

/* ---------------------------------------------------------------- slat wall */

/** Exterior cladding of vertical wooden slats. Tiles in both directions. */
export function SlatWall(p: Props) {
  return (
    <InkSvg viewBox="0 0 200 260" label="" wobble={0} {...p}>
      {(ids) => (
        <>
          <rect x={-4} y={-4} width={208} height={268} fill={C.peach} stroke="none" />
          {/* six wide slats on a 33-unit rhythm; 200 = 6 × 33 + 2, so the gap repeats across tiles */}
          {Array.from({ length: 6 }, (_, i) => 6 + i * 33).map((x) => (
            <g key={x}>
              <rect x={x} y={-4} width={22} height={268} fill={SLAT} stroke="none" />
              <rect x={x + 15} y={-4} width={7} height={268} fill={`url(#${ids.dots})`} stroke="none" opacity={0.4} />
              <path d={`M ${x} 0 L ${x} 260 M ${x + 22} 0 L ${x + 22} 260`} strokeWidth={3} />
            </g>
          ))}
        </>
      )}
    </InkSvg>
  );
}

/* ------------------------------------------------------------------ window */

export function Window({ curtains = true, ...p }: Props & { curtains?: boolean }) {
  const clip = `pane-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <InkSvg viewBox="0 0 160 180" label="" {...p}>
      {(ids) => (
        <>
          <defs>
            <clipPath id={clip}><rect x={24} y={22} width={112} height={122} /></clipPath>
          </defs>
          <rect x={14} y={12} width={132} height={142} fill={C.cream} />
          <rect x={24} y={22} width={112} height={122} fill={C.cornflower} />
          <g clipPath={`url(#${clip})`}>
            {/* a cloud drifting past, and glare */}
            <path d="M 40 70 q 0 -14 14 -12 q 6 -12 20 -6 q 14 -4 14 10 q 10 2 6 10 L 44 72 Q 36 74 40 70 Z" fill={C.cream} strokeWidth={2.2} />
            <path d="M 30 140 L 70 96 M 92 140 L 132 96" stroke={C.cream} strokeWidth={6} opacity={0.35} />
            <rect x={24} y={120} width={112} height={24} fill={`url(#${ids.dots})`} stroke="none" opacity={0.3} />
          </g>
          <path d="M 80 22 L 80 144 M 24 83 L 136 83" strokeWidth={5} stroke={C.cream} />
          <path d="M 80 22 L 80 144 M 24 83 L 136 83" fill="none" strokeWidth={1.5} />
          <rect x={24} y={22} width={112} height={122} fill="none" strokeWidth={3} />
          {curtains && (
            <>
              <path d="M 14 12 L 46 12 Q 34 70 42 150 L 14 150 Z" fill={C.pink} />
              <path d="M 146 12 L 114 12 Q 126 70 118 150 L 146 150 Z" fill={C.pink} />
              <path d="M 28 20 Q 24 80 30 146 M 132 20 Q 136 80 130 146" fill="none" strokeWidth={1.8} />
            </>
          )}
          <rect x={6} y={150} width={148} height={14} rx={3} fill={C.bark} />
        </>
      )}
    </InkSvg>
  );
}

/* -------------------------------------------------------------------- room */

/**
 * One storey seen with its front wall removed: back wall, side walls, ceiling, floor.
 * Rooms are 400×260 so a floor is a row of them; props and Jorge go on top.
 */
export function Room({ wall = C.lavender, window: hasWindow = false, lamp = true, ...p }: Props & {
  wall?: string;
  window?: boolean;
  lamp?: boolean;
}) {
  return (
    <InkSvg viewBox="0 0 400 260" label="" {...p}>
      {(ids) => (
        <>
          <rect x={0} y={0} width={400} height={260} fill={wall} stroke="none" />
          <rect x={0} y={170} width={400} height={74} fill={`url(#${ids.dots})`} stroke="none" opacity={0.18} />
          {/* skirting and a picture rail give the wall some depth */}
          <path d="M 18 230 L 382 230 M 18 46 L 382 46" strokeWidth={2.2} />
          {hasWindow && (
            <g transform="translate(150 54) scale(0.62)">
              <rect x={14} y={12} width={132} height={142} fill={C.cream} />
              <rect x={24} y={22} width={112} height={122} fill={C.cornflower} />
              <path d="M 80 22 L 80 144 M 24 83 L 136 83" stroke={C.cream} strokeWidth={6} />
              <rect x={24} y={22} width={112} height={122} fill="none" strokeWidth={4} />
              <rect x={6} y={150} width={148} height={14} rx={3} fill={C.bark} />
            </g>
          )}
          {lamp && (
            <>
              <path d="M 300 18 L 300 52" strokeWidth={2.2} />
              <path d="M 284 66 Q 300 44 316 66 Z" fill={C.mustard} />
              <path d="M 284 66 L 268 120 L 332 120 L 316 66 Z" fill={C.mustard} stroke="none" opacity={0.18} />
            </>
          )}
          {/* ceiling, side walls, floor */}
          <rect x={0} y={0} width={400} height={18} fill={C.steel} />
          <rect x={0} y={0} width={18} height={260} fill={C.peach} />
          <rect x={382} y={0} width={18} height={260} fill={C.peach} />
          <rect x={382} y={0} width={18} height={260} fill={`url(#${ids.dots})`} stroke="none" opacity={0.3} />
          <rect x={0} y={244} width={400} height={16} fill={C.peach} />
          <path d="M 18 244 L 382 244" strokeWidth={3.5} />
        </>
      )}
    </InkSvg>
  );
}

/* ---------------------------------------------------------------- rooftop */

const BULBS = [C.pink, C.mustard, C.cornflower, C.green, C.pink, C.mustard, C.cornflower];

/** The roof terrace: water tank, antenna, string lights, parapet. The hero floor. */
export function Rooftop(p: Props) {
  return (
    <InkSvg viewBox="0 0 400 220" label="" {...p}>
      {(ids) => (
        <>
          {/* water tank on legs */}
          <path d="M 52 150 L 46 180 M 108 150 L 114 180 M 80 150 L 80 180" fill="none" strokeWidth={5} />
          <path d="M 38 66 L 38 146 Q 80 162 122 146 L 122 66 Z" fill={C.terracotta} />
          <path d="M 98 66 L 122 66 L 122 146 Q 112 150 98 152 Z" fill={`url(#${ids.dots})`} stroke="none" opacity={0.35} />
          <ellipse cx={80} cy={66} rx={42} ry={10} fill={C.terracotta} />
          <path d="M 38 96 Q 80 110 122 96 M 38 124 Q 80 138 122 124" fill="none" strokeWidth={2.4} />
          <path d="M 58 58 L 80 32 L 102 58" fill={C.charcoal} />

          {/* antenna */}
          <path d="M 330 180 L 330 40 M 306 60 L 354 60 M 312 84 L 348 84 M 318 108 L 342 108" fill="none" strokeWidth={3.5} />
          <circle cx={330} cy={36} r={5} fill={C.pink} strokeWidth={2} />

          {/* string lights from tank to antenna */}
          <path d="M 122 76 Q 226 132 330 66" fill="none" strokeWidth={2} />
          {BULBS.map((color, i) => {
            const t = (i + 1) / (BULBS.length + 1);
            const x = (1 - t) * (1 - t) * 122 + 2 * (1 - t) * t * 226 + t * t * 330;
            const y = (1 - t) * (1 - t) * 76 + 2 * (1 - t) * t * 132 + t * t * 66;
            return <ellipse key={i} cx={x} cy={y + 8} rx={5} ry={7} fill={color} strokeWidth={2} />;
          })}

          {/* vent pipe */}
          <path d="M 250 180 L 250 150 Q 250 138 262 138 L 270 138" fill="none" strokeWidth={12} />
          <path d="M 250 180 L 250 150 Q 250 138 262 138 L 270 138" fill="none" stroke={C.steel} strokeWidth={6} />

          {/* parapet with coping */}
          <rect x={0} y={176} width={400} height={44} fill={C.peach} />
          <rect x={0} y={176} width={400} height={44} fill={`url(#${ids.dots})`} stroke="none" opacity={0.15} />
          <rect x={-4} y={170} width={408} height={10} rx={2} fill={C.steel} />
        </>
      )}
    </InkSvg>
  );
}
