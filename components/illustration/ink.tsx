import { useId, type CSSProperties, type ReactNode } from 'react';

/**
 * Shared look for every illustration asset: one palette, one hand-drawn wobble, one
 * halftone. Each asset renders inside <InkSvg>, which gives it per-instance filter and
 * pattern ids so many assets can share a page without their defs colliding.
 */

export const INK = '#1B1B1B';
export const C = {
  paper: '#F4EDE1',
  cream: '#FFFAF2',
  peach: '#F0C49B',
  lavender: '#B8B6EA',
  green: '#3F8F45',
  greenDark: '#2E6B33',
  mustard: '#E5A23C',
  pink: '#D98580',
  cornflower: '#6C7DE0',
  bark: '#8A5A3B',
  coffee: '#6B4430',
  steel: '#CFCBC3',
  charcoal: '#3A3A3A',
  graphite: '#4A4A4A',
  navy: '#24305E',
  terracotta: '#C9714F',
};

export type InkIds = { wobble: string; dots: string };

export function InkSvg({
  viewBox = '0 0 240 240',
  label,
  className,
  style,
  strokeWidth = 3,
  wobble = 3,
  dotSize = 6,
  children,
}: {
  viewBox?: string;
  label: string;
  className?: string;
  style?: CSSProperties;
  strokeWidth?: number;
  /** Displacement of the hand-drawn wobble, in viewBox units. */
  wobble?: number;
  /** Halftone grid size, in viewBox units. */
  dotSize?: number;
  children: (ids: InkIds) => ReactNode;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const ids = { wobble: `wobble-${uid}`, dots: `dots-${uid}` };
  return (
    <svg
      viewBox={viewBox}
      className={className}
      style={style}
      // an empty label marks the asset as decoration
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      <defs>
        <filter id={ids.wobble} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale={wobble} />
        </filter>
        <pattern id={ids.dots} width={dotSize} height={dotSize} patternUnits="userSpaceOnUse">
          <circle cx={dotSize / 2} cy={dotSize / 2} r={dotSize * 0.19} fill={INK} />
        </pattern>
      </defs>
      <g filter={`url(#${ids.wobble})`} stroke={INK} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {children(ids)}
      </g>
    </svg>
  );
}

/** A thick stroke with an ink outline: legs, handles, straps. */
export function InkLine({ d, width, color }: { d: string; width: number; color: string }) {
  return (
    <>
      <path d={d} fill="none" strokeWidth={width + 6} />
      <path d={d} fill="none" stroke={color} strokeWidth={width} />
    </>
  );
}

export const pts = (p: [number, number][]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
