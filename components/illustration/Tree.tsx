import { useId, type CSSProperties } from 'react';
import { C, InkSvg } from './ink';

/**
 * Ink-and-halftone tree for the building illustration. The canopy outline is generated
 * so it stays bumpy but deterministic.
 */

/** Scalloped canopy: points on an ellipse joined by outward arcs of uneven size. */
export function canopyPath(cx: number, cy: number, rx: number, ry: number) {
  // uneven steps so the bumps don't look stamped
  const steps = [0, 0.55, 1.05, 1.5, 2.1, 2.6, 3.05, 3.6, 4.15, 4.7, 5.25, 5.8];
  const pts = steps.map((a, i) => {
    const wobble = 1 + ((i * 37) % 7) / 60; // 1.00–1.10, fixed per point
    return [cx + Math.cos(a) * rx * wobble, cy + Math.sin(a) * ry * wobble] as const;
  });
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    const r = Math.hypot(x2 - x1, y2 - y1) * 0.6;
    d += ` A ${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }
  return d + ' Z';
}

const CANOPY = canopyPath(200, 170, 150, 118);

/** Little cup-shaped strokes that read as clumps of leaves. */
const LEAF_MARKS: [number, number, number][] = [
  [120, 120, 1], [175, 95, 0.9], [250, 110, 1.1], [300, 160, 0.9],
  [140, 190, 1], [215, 175, 1.15], [270, 225, 1], [170, 245, 0.85], [95, 210, 0.9],
];

export default function Tree({
  className,
  style,
  sway = true,
}: {
  className?: string;
  style?: CSSProperties;
  /** Gentle idle sway; switched off automatically under reduced motion. */
  sway?: boolean;
}) {
  const clip = `canopy-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <InkSvg viewBox="0 0 400 480" label="A tree" className={className} style={style} strokeWidth={3.5} dotSize={7}>
      {(ids) => (
        <>
          <defs>
            <clipPath id={clip}>
              <path d={CANOPY} />
            </clipPath>
          </defs>
          <style>{`
            .tree-sway { transform-origin: 200px 470px; animation: tree-sway 6s ease-in-out infinite; }
            @keyframes tree-sway { 0%,100% { transform: rotate(-0.8deg); } 50% { transform: rotate(0.8deg); } }
            @media (prefers-reduced-motion: reduce) { .tree-sway { animation: none; } }
          `}</style>

          {/* ground shadow */}
          <ellipse cx="205" cy="462" rx="120" ry="14" fill={C.lavender} />
          <ellipse cx="205" cy="462" rx="120" ry="14" fill={`url(#${ids.dots})`} stroke="none" opacity={0.35} />

          <g className={sway ? 'tree-sway' : undefined}>
            {/* trunk: flared roots, splitting into two limbs that show below the canopy */}
            <path
              d="M 158 468 C 176 458, 182 430, 184 395 C 186 360, 182 335, 170 312 L 138 282 L 152 272 L 186 304
                 C 192 290, 194 270, 192 250 L 210 250 C 210 272, 212 290, 216 300 L 252 268 L 264 280 L 228 318
                 C 220 340, 218 365, 220 395 C 222 430, 228 458, 248 468 Z"
              fill={C.bark}
            />
            {/* bark lines */}
            <path d="M 200 330 C 198 360, 199 390, 202 425" fill="none" strokeWidth={2.2} />
            <path d="M 212 400 C 213 418, 215 435, 218 448" fill="none" strokeWidth={2.2} />

            {/* canopy: dark halftone base, the lit green shifted up-left on top of it, so the
                shade is a crescent that follows the bumps along the lower right */}
            <path d={CANOPY} fill={C.greenDark} />
            <g clipPath={`url(#${clip})`} stroke="none">
              <path d={CANOPY} fill={`url(#${ids.dots})`} opacity={0.4} />
              <path d={CANOPY} fill={C.green} transform="translate(-26 -22)" />
            </g>
            <path d={CANOPY} fill="none" strokeWidth={4} />

            {LEAF_MARKS.map(([x, y, s], i) => (
              <path
                key={i}
                d={`M ${x - 14 * s} ${y} Q ${x} ${y + 14 * s} ${x + 14 * s} ${y}`}
                fill="none"
                strokeWidth={2.6}
              />
            ))}
          </g>
        </>
      )}
    </InkSvg>
  );
}

const TALL_CANOPY = canopyPath(120, 200, 70, 166);

const TALL_LEAF_MARKS: [number, number][] = [
  [104, 80], [134, 112], [100, 156], [136, 196], [102, 238], [132, 280], [108, 322],
];

/** Tall, narrow tree — a cypress shape for filling gaps between rooms. */
export function TallTree({ className, style }: { className?: string; style?: CSSProperties }) {
  const clip = `tall-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <InkSvg viewBox="0 0 240 480" label="A tall tree" className={className} style={style} strokeWidth={3.5} dotSize={7}>
      {(ids) => (
        <>
          <defs>
            <clipPath id={clip}>
              <path d={TALL_CANOPY} />
            </clipPath>
          </defs>
          <ellipse cx="122" cy="464" rx="70" ry="10" fill={C.lavender} />
          <path d="M 108 468 C 112 440, 114 400, 114 360 L 126 360 C 126 400, 128 440, 132 468 Z" fill={C.bark} />
          <path d={TALL_CANOPY} fill={C.greenDark} />
          <g clipPath={`url(#${clip})`} stroke="none">
            <path d={TALL_CANOPY} fill={`url(#${ids.dots})`} opacity={0.4} />
            <path d={TALL_CANOPY} fill={C.green} transform="translate(-18 -14)" />
          </g>
          <path d={TALL_CANOPY} fill="none" strokeWidth={4} />
          {TALL_LEAF_MARKS.map(([x, y], i) => (
            <path key={i} d={`M ${x - 12} ${y} Q ${x} ${y + 12} ${x + 12} ${y}`} fill="none" strokeWidth={2.6} />
          ))}
        </>
      )}
    </InkSvg>
  );
}
