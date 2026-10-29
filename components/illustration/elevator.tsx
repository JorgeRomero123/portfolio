import { useId, type CSSProperties } from 'react';
import { C, InkSvg } from './ink';
import { WavingFigure } from './Jorge';

/**
 * The elevator that carries visitors down the building: car, shaft, the floor dial over
 * the doors, the button panel that doubles as navigation, and the arrival "ding".
 * Doors and needle animate through CSS transitions, so a client component only has to
 * change the props; the site-wide reduced-motion rule turns the transitions off.
 */

type Props = { className?: string; style?: CSSProperties };

const EASE = 'cubic-bezier(.6,0,.3,1)';
const uid = (raw: string) => raw.replace(/[^a-zA-Z0-9_-]/g, '');

/* --------------------------------------------------------------------- car */

export function ElevatorCar({ doors = 'open', occupied = true, ...p }: Props & {
  doors?: 'open' | 'closed';
  /** Jorge inside, waving. */
  occupied?: boolean;
}) {
  const clip = `cab-${uid(useId())}`;
  const shift = doors === 'open' ? 64 : 0;
  return (
    <InkSvg viewBox="0 0 200 280" label={occupied ? 'Elevator car with Jorge inside' : 'Elevator car'} {...p}>
      {(ids) => (
        <>
          <defs>
            <clipPath id={clip}><rect x={28} y={56} width={144} height={196} /></clipPath>
          </defs>
          {/* cable and hanger */}
          <path d="M 100 0 L 100 22" strokeWidth={3} />
          <rect x={86} y={16} width={28} height={14} rx={3} fill={C.charcoal} />

          {/* cab shell, with the arrival light in the top band */}
          <rect x={14} y={28} width={172} height={236} rx={8} fill={C.steel} />
          <rect x={14} y={240} width={172} height={24} rx={6} fill={`url(#${ids.dots})`} stroke="none" opacity={0.3} />
          <circle cx={100} cy={42} r={6} fill={C.mustard} strokeWidth={2.2} />

          {/* interior: back wall, handrail, passenger, floor */}
          <rect x={28} y={56} width={144} height={196} fill={C.peach} />
          <rect x={28} y={170} width={144} height={82} fill={`url(#${ids.dots})`} stroke="none" opacity={0.18} />
          <path d="M 28 172 L 172 172" strokeWidth={4} />
          {occupied && (
            <g transform="translate(40 65) scale(0.5)">
              <WavingFigure ids={ids} />
            </g>
          )}
          <rect x={28} y={246} width={144} height={6} fill={C.charcoal} />

          {/* sliding doors, clipped to the opening so they vanish into the frame */}
          <g clipPath={`url(#${clip})`}>
            {[{ x: 28, dir: -1 }, { x: 100, dir: 1 }].map(({ x, dir }) => (
              <g key={x} style={{ transform: `translateX(${dir * shift}px)`, transition: `transform .7s ${EASE}` }}>
                <rect x={x} y={56} width={72} height={196} fill={C.cornflower} />
                <rect x={x + 8} y={66} width={56} height={176} rx={4} fill="none" strokeWidth={2} />
                <rect x={x} y={200} width={72} height={52} fill={`url(#${ids.dots})`} stroke="none" opacity={0.3} />
              </g>
            ))}
          </g>
          <rect x={28} y={56} width={144} height={196} fill="none" strokeWidth={4} />
        </>
      )}
    </InkSvg>
  );
}

/* ------------------------------------------------------------------- shaft */

/**
 * One storey of glass shaft. Tiles vertically without seams: the rails have no top or
 * bottom edge, and the beam sits mid-tile.
 */
export function ElevatorShaft(p: Props) {
  return (
    <InkSvg viewBox="0 0 200 300" label="" {...p}>
      {() => (
        <>
          <rect x={18} y={0} width={164} height={300} fill={C.lavender} stroke="none" opacity={0.35} />
          {/* counterweight cables */}
          <path d="M 92 0 L 92 300 M 108 0 L 108 300" strokeWidth={2} />
          {/* glare on the glass */}
          <path d="M 36 120 L 84 60 M 44 150 L 120 56 M 120 260 L 164 206" stroke={C.cream} strokeWidth={7} opacity={0.7} />
          {/* rails: filled strips with only their long edges inked */}
          {[6, 182].map((x) => (
            <g key={x}>
              <rect x={x} y={-4} width={12} height={308} fill={C.steel} stroke="none" />
              <path d={`M ${x} 0 L ${x} 300 M ${x + 12} 0 L ${x + 12} 300`} />
              {[40, 260].map((y) => <circle key={y} cx={x + 6} cy={y} r={2.2} fill={C.charcoal} strokeWidth={1} />)}
            </g>
          ))}
          <rect x={6} y={146} width={188} height={8} fill={C.steel} />
        </>
      )}
    </InkSvg>
  );
}

/* --------------------------------------------------------------- floor dial */

/** Half-moon dial over the doors; the needle swings to `current` (an index into `floors`). */
export function FloorDial({ floors = ['1', '2', '3', '4', 'R'], current = 0, ...p }: Props & {
  floors?: string[];
  current?: number;
}) {
  const cx = 110, cy = 112;
  // spread over 200°–340° rather than the full half-circle, so the end labels clear the baseline
  const angleOf = (i: number) => 200 + (i * 140) / Math.max(1, floors.length - 1);
  return (
    <InkSvg viewBox="0 0 220 132" label={`Floor dial showing ${floors[current] ?? ''}`} {...p}>
      {(ids) => (
        <>
          <path d={`M 12 ${cy} A 98 98 0 0 1 208 ${cy} Z`} fill={C.mustard} />
          <path d={`M 12 ${cy} A 98 98 0 0 1 208 ${cy} Z`} fill={`url(#${ids.dots})`} stroke="none" opacity={0.25} />
          <path d={`M 28 ${cy} A 82 82 0 0 1 192 ${cy} Z`} fill={C.cream} />
          {floors.map((f, i) => {
            const a = (angleOf(i) * Math.PI) / 180;
            const on = i === current;
            return (
              <text
                key={f}
                x={cx + Math.cos(a) * 64}
                y={cy + Math.sin(a) * 64 + 6}
                textAnchor="middle"
                stroke="none"
                fill={on ? C.pink : '#1B1B1B'}
                style={{ fontFamily: 'inherit', fontWeight: 800, fontSize: on ? 20 : 16, transition: 'fill .3s' }}
              >
                {f}
              </text>
            );
          })}
          <g style={{ transform: `rotate(${angleOf(current)}deg)`, transformOrigin: `${cx}px ${cy}px`, transition: `transform .9s ${EASE}` }}>
            <path d={`M ${cx} ${cy - 3} L ${cx + 50} ${cy} L ${cx} ${cy + 3} Z`} fill={C.charcoal} strokeWidth={2} />
          </g>
          <circle cx={cx} cy={cy} r={8} fill={C.charcoal} />
          <path d={`M 12 ${cy} L 208 ${cy}`} strokeWidth={4} />
        </>
      )}
    </InkSvg>
  );
}

/* ------------------------------------------------------------- button panel */

export type PanelFloor = { key: string; label: string };

/**
 * The car's button panel, drawn. On the page it sits behind real buttons/links, so the
 * labels here are decoration and the panel is hidden from assistive tech.
 */
export function ButtonPanel({ floors, active = 0, ...p }: Props & { floors: PanelFloor[]; active?: number }) {
  const h = 56 + floors.length * 46;
  return (
    <InkSvg viewBox={`0 0 170 ${h}`} label="" {...p}>
      {(ids) => (
        <>
          <rect x={8} y={8} width={154} height={h - 16} rx={12} fill={C.steel} />
          <rect x={8} y={h - 40} width={154} height={32} rx={10} fill={`url(#${ids.dots})`} stroke="none" opacity={0.3} />
          {[[20, 20], [150, 20], [20, h - 20], [150, h - 20]].map(([x, y]) => (
            <g key={`${x}-${y}`} strokeWidth={1.4}>
              <circle cx={x} cy={y} r={4} fill={C.cream} />
              <path d={`M ${x - 2.5} ${y} L ${x + 2.5} ${y}`} />
            </g>
          ))}
          {floors.map((f, i) => {
            const y = 46 + i * 46;
            const on = i === active;
            return (
              <g key={f.key}>
                {on && <circle cx={40} cy={y} r={20} fill={C.mustard} stroke="none" opacity={0.35} />}
                <circle cx={40} cy={y} r={15} fill={on ? C.mustard : C.cream} style={{ transition: 'fill .3s' }} />
                <text x={40} y={y + 5} textAnchor="middle" stroke="none" fill="#1B1B1B" style={{ fontFamily: 'inherit', fontWeight: 800, fontSize: 14 }}>
                  {f.key}
                </text>
                <text x={66} y={y + 5} stroke="none" fill="#1B1B1B" style={{ fontFamily: 'inherit', fontWeight: on ? 800 : 500, fontSize: 15 }}>
                  {f.label}
                </text>
              </g>
            );
          })}
        </>
      )}
    </InkSvg>
  );
}

/* -------------------------------------------------------------------- ding */

const BURST = Array.from({ length: 24 }, (_, i) => {
  const a = (i * Math.PI) / 12;
  const r = i % 2 ? 0.74 : 1;
  return `${(70 + Math.cos(a) * 62 * r).toFixed(1)},${(50 + Math.sin(a) * 42 * r).toFixed(1)}`;
}).join(' ');

/** Comic burst for an arrival. */
export function Ding(p: Props) {
  return (
    <InkSvg viewBox="0 0 140 100" label="Ding!" {...p}>
      {() => (
        <g transform="rotate(-8 70 50)">
          <polygon points={BURST} fill={C.mustard} />
          <text x={70} y={58} textAnchor="middle" stroke="none" fill="#1B1B1B" style={{ fontFamily: 'inherit', fontWeight: 800, fontSize: 24 }}>
            ding!
          </text>
        </g>
      )}
    </InkSvg>
  );
}
