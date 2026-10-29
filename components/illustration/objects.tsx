import { useId, type CSSProperties } from 'react';
import { C, InkLine, InkSvg, pts } from './ink';

/**
 * Small props for the building rooms. Every one is drawn on a 240×240 viewBox at the
 * same stroke weight, so they can be dropped into any room at a consistent scale.
 */

type Props = { className?: string; style?: CSSProperties };

const clipId = (raw: string) => raw.replace(/[^a-zA-Z0-9_-]/g, '');

/* ------------------------------------------------------------------ glasses */

export function Glasses(p: Props) {
  return (
    <InkSvg label="Glasses" {...p}>
      {(ids) => (
        <>
          <path d="M 28 108 L 10 98" fill="none" strokeWidth={5} />
          <path d="M 212 108 L 230 98" fill="none" strokeWidth={5} />
          {[28, 132].map((x) => (
            <g key={x}>
              <rect x={x} y={92} width={80} height={60} rx={24} fill={C.lavender} strokeWidth={6} />
              <rect x={x + 3} y={95} width={74} height={54} rx={21} fill={`url(#${ids.dots})`} stroke="none" opacity={0.25} />
              <path d={`M ${x + 20} ${130} L ${x + 36} ${110}`} stroke={C.cream} strokeWidth={4} />
              <path d={`M ${x + 34} ${136} L ${x + 44} ${124}`} stroke={C.cream} strokeWidth={4} />
            </g>
          ))}
          <path d="M 108 112 Q 120 98 132 112" fill="none" strokeWidth={6} />
        </>
      )}
    </InkSvg>
  );
}

/* ------------------------------------------------------------------- coffee */

export function Coffee(p: Props) {
  return (
    <InkSvg label="A cup of coffee" {...p}>
      {(ids) => (
        <>
          <ellipse cx={112} cy={204} rx={80} ry={14} fill={C.cream} />
          <InkLine d="M 158 118 C 198 118, 198 174, 158 174" width={10} color={C.pink} />
          <path d="M 62 92 L 62 180 Q 62 202 84 202 L 138 202 Q 160 202 160 180 L 160 92 Z" fill={C.pink} />
          <path d="M 132 96 L 158 96 L 158 182 Q 156 198 138 199 L 132 199 Z" fill={`url(#${ids.dots})`} stroke="none" opacity={0.35} />
          <ellipse cx={111} cy={92} rx={49} ry={12} fill={C.pink} />
          <ellipse cx={111} cy={93} rx={41} ry={8} fill={C.coffee} />
          {/* a heart on the mug */}
          <path d="M 98 142 C 90 132, 100 122, 106 132 C 112 122, 122 132, 114 142 L 106 152 Z" fill={C.cream} strokeWidth={2.5} />
          {/* steam */}
          {[88, 110, 132].map((x, i) => (
            <path key={x} d={`M ${x} ${72 - i * 3} C ${x - 10} ${60 - i * 3}, ${x + 10} ${50 - i * 3}, ${x} ${36 - i * 3}`} fill="none" strokeWidth={3} />
          ))}
        </>
      )}
    </InkSvg>
  );
}

/* ------------------------------------------------------------------- pencil */

export function Pencil(p: Props) {
  return (
    <InkSvg label="A pencil" {...p}>
      {(ids) => (
        <g transform="rotate(-35 120 120)">
          <rect x={40} y={106} width={132} height={28} fill={C.mustard} />
          <rect x={40} y={125} width={132} height={9} fill={`url(#${ids.dots})`} stroke="none" opacity={0.4} />
          <path d="M 40 115.5 L 172 115.5 M 40 124.5 L 172 124.5" strokeWidth={1.8} />
          <rect x={172} y={104} width={20} height={32} fill={C.steel} />
          <path d="M 179 104 L 179 136 M 186 104 L 186 136" strokeWidth={1.8} />
          <path d="M 192 104 L 206 104 Q 216 104 216 114 L 216 126 Q 216 136 206 136 L 192 136 Z" fill={C.pink} />
          <polygon points="40,106 12,120 40,134" fill={C.peach} />
          <polygon points="22,115 12,120 22,125" fill={C.graphite} />
        </g>
      )}
    </InkSvg>
  );
}

/* -------------------------------------------------------------- soccer ball */

const BALL = (() => {
  const cx = 120, cy = 120;
  const poly = (r: number, ox: number, oy: number, rot: number) =>
    Array.from({ length: 5 }, (_, j) => {
      const a = rot + (j * 2 * Math.PI) / 5;
      return [ox + Math.cos(a) * r, oy + Math.sin(a) * r] as [number, number];
    });
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / 5;
  const center = poly(26, cx, cy, -Math.PI / 2);
  // outer patches sit in line with the centre's corners, one corner pointing inward
  const outer = center.map((_, i) =>
    poly(24, cx + Math.cos(angle(i)) * 88, cy + Math.sin(angle(i)) * 88, angle(i) + Math.PI));
  const seams: [number, number][][] = center.map((c, i) => [c, outer[i][0]]);
  outer.forEach((pent, i) => {
    const next = outer[(i + 1) % 5];
    let best: [number, number][] = [pent[0], next[0]];
    let bestD = Infinity;
    for (const a of pent) for (const b of next) {
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (d < bestD) { bestD = d; best = [a, b]; }
    }
    seams.push(best);
  });
  return { center, outer, seams };
})();

export function SoccerBall(p: Props) {
  const clip = `ball-${clipId(useId())}`;
  return (
    <InkSvg label="A football" {...p}>
      {(ids) => (
        <>
          <defs>
            <clipPath id={clip}><circle cx={120} cy={120} r={84} /></clipPath>
          </defs>
          <ellipse cx={124} cy={214} rx={70} ry={10} fill={C.lavender} />
          <circle cx={120} cy={120} r={84} fill={C.steel} />
          <g clipPath={`url(#${clip})`}>
            <circle cx={120} cy={120} r={84} fill={`url(#${ids.dots})`} stroke="none" opacity={0.35} />
            <circle cx={106} cy={106} r={84} fill={C.cream} stroke="none" />
            {BALL.seams.map((s, i) => (
              <path key={i} d={`M ${pts([s[0]])} L ${pts([s[1]])}`} fill="none" strokeWidth={2.5} />
            ))}
            <polygon points={pts(BALL.center)} fill={C.charcoal} />
            {BALL.outer.map((o, i) => <polygon key={i} points={pts(o)} fill={C.charcoal} />)}
          </g>
          <circle cx={120} cy={120} r={84} fill="none" strokeWidth={3.5} />
        </>
      )}
    </InkSvg>
  );
}

/* --------------------------------------------------------------- 360 camera */

export function Camera360(p: Props) {
  return (
    <InkSvg label="A 360° camera on a tripod" {...p}>
      {(ids) => (
        <>
          {/* panorama bubbles */}
          {([[50, 70, 17, C.peach], [192, 52, 12, C.lavender], [198, 122, 10, C.pink]] as const).map(([x, y, r, fill]) => (
            <g key={`${x}-${y}`} strokeWidth={2}>
              <circle cx={x} cy={y} r={r} fill={fill} />
              <ellipse cx={x} cy={y} rx={r} ry={r * 0.35} fill="none" />
              <ellipse cx={x} cy={y} rx={r * 0.35} ry={r} fill="none" />
            </g>
          ))}
          {/* tripod */}
          <path d="M 120 162 L 72 226 M 120 162 L 168 226 M 120 162 L 120 230" fill="none" strokeWidth={5} />
          <rect x={110} y={140} width={20} height={24} rx={3} fill={C.steel} />
          {/* body */}
          <rect x={98} y={36} width={44} height={108} rx={20} fill={C.charcoal} />
          <rect x={124} y={40} width={16} height={100} rx={8} fill={`url(#${ids.dots})`} stroke="none" opacity={0.5} />
          {/* fisheye lens, with the back lens peeking out at the side */}
          <path d="M 98 64 Q 88 74 98 84" fill={C.lavender} />
          <circle cx={120} cy={74} r={17} fill={C.lavender} />
          <circle cx={120} cy={74} r={8} fill={C.cornflower} strokeWidth={2} />
          <path d="M 110 68 Q 113 62 119 61" fill="none" stroke={C.cream} strokeWidth={3} />
          {/* shutter + status light */}
          <circle cx={120} cy={112} r={7} fill={C.mustard} strokeWidth={2.5} />
          <circle cx={120} cy={128} r={3} fill={C.green} strokeWidth={1.5} />
        </>
      )}
    </InkSvg>
  );
}

/* -------------------------------------------------------------------- drone */

export function Drone(p: Props) {
  return (
    <InkSvg label="A drone" {...p}>
      {(ids) => (
        <>
          {/* back rotors, smaller and higher for depth */}
          <path d="M 98 112 L 70 92 M 142 112 L 170 92" fill="none" strokeWidth={6} />
          {[70, 170].map((x) => (
            <g key={x}>
              <path d={`M ${x} 92 L ${x} 84`} strokeWidth={3} />
              <ellipse cx={x} cy={83} rx={28} ry={4.5} fill={C.lavender} strokeWidth={2.5} />
            </g>
          ))}
          {/* front arms and rotors */}
          <rect x={42} y={113} width={156} height={10} rx={5} fill={C.charcoal} />
          {[46, 194].map((x) => (
            <g key={x}>
              <rect x={x - 9} y={102} width={18} height={16} rx={4} fill={C.charcoal} />
              <path d={`M ${x} 102 L ${x} 96`} strokeWidth={3} />
              <ellipse cx={x} cy={95} rx={34} ry={6} fill={C.lavender} />
              <ellipse cx={x} cy={95} rx={34} ry={6} fill={`url(#${ids.dots})`} stroke="none" opacity={0.3} />
              {/* spin marks */}
              <path d={`M ${x - 26} 84 Q ${x} 78 ${x + 26} 84`} fill="none" strokeWidth={2} />
            </g>
          ))}
          {/* landing legs */}
          <path d="M 98 136 L 90 162 L 76 164 M 142 136 L 150 162 L 164 164" fill="none" strokeWidth={3.5} />
          {/* body */}
          <rect x={82} y={102} width={76} height={36} rx={15} fill={C.mustard} />
          <rect x={82} y={124} width={76} height={14} rx={7} fill={`url(#${ids.dots})`} stroke="none" opacity={0.35} />
          <circle cx={96} cy={116} r={3.5} fill={C.green} strokeWidth={1.5} />
          <circle cx={144} cy={116} r={3.5} fill={C.pink} strokeWidth={1.5} />
          {/* gimbal camera */}
          <rect x={111} y={138} width={18} height={8} fill={C.charcoal} />
          <circle cx={120} cy={156} r={13} fill={C.charcoal} />
          <circle cx={120} cy={156} r={6} fill={C.lavender} strokeWidth={2} />
        </>
      )}
    </InkSvg>
  );
}

/* --------------------------------------------------------------- board game */

const BOARD = (() => {
  const A: [number, number] = [20, 128];
  const B: [number, number] = [128, 90];
  const D: [number, number] = [112, 170];
  const P = (u: number, v: number): [number, number] =>
    [A[0] + (B[0] - A[0]) * u + (D[0] - A[0]) * v, A[1] + (B[1] - A[1]) * u + (D[1] - A[1]) * v];
  const N = 6;
  const ring = [C.peach, C.mustard, C.cornflower, C.pink];
  const cells: { poly: [number, number][]; fill: string }[] = [];
  let k = 0;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    if (i !== 0 && i !== N - 1 && j !== 0 && j !== N - 1) continue;
    cells.push({
      poly: [P(i / N, j / N), P((i + 1) / N, j / N), P((i + 1) / N, (j + 1) / N), P(i / N, (j + 1) / N)],
      fill: ring[k++ % ring.length],
    });
  }
  return { P, cells };
})();

export function BoardGame(p: Props) {
  const { P, cells } = BOARD;
  const t = 10; // board thickness
  const down = ([x, y]: [number, number]): [number, number] => [x, y + t];
  const [a, , c, d] = [P(0, 0), P(1, 0), P(1, 1), P(0, 1)];
  // five-pointed star in board space, visiting every second point so it self-intersects
  const star = [0, 2, 4, 1, 3].map((k) => {
    const ang = -Math.PI / 2 + (k * 2 * Math.PI) / 5;
    return P(0.5 + Math.cos(ang) * 0.17, 0.5 + Math.sin(ang) * 0.17);
  });
  return (
    <InkSvg label="A board game with a pawn and a die" {...p}>
      {(ids) => (
        <>
          {/* board edges, then the top */}
          <polygon points={pts([a, d, down(d), down(a)])} fill={C.greenDark} />
          <polygon points={pts([d, c, down(c), down(d)])} fill={C.greenDark} />
          <polygon points={pts([d, c, down(c), down(d)])} fill={`url(#${ids.dots})`} stroke="none" opacity={0.4} />
          <polygon points={pts([P(0, 0), P(1, 0), P(1, 1), P(0, 1)])} fill={C.green} />
          <polygon points={pts([P(1 / 6, 1 / 6), P(5 / 6, 1 / 6), P(5 / 6, 5 / 6), P(1 / 6, 5 / 6)])} fill={C.cream} strokeWidth={2} />
          {cells.map((cell, i) => <polygon key={i} points={pts(cell.poly)} fill={cell.fill} strokeWidth={1.6} />)}
          {/* a star in the middle */}
          <polygon points={pts(star)} fill={C.mustard} strokeWidth={2} />
          {/* pawn */}
          <path d="M 140 128 C 142 112, 146 104, 150 100 C 154 104, 158 112, 160 128 Z" fill={C.pink} />
          <ellipse cx={150} cy={128} rx={14} ry={5} fill={C.pink} />
          <circle cx={150} cy={95} r={9} fill={C.pink} />
          {/* die */}
          <polygon points="186,170 201,163 216,170 201,177" fill={C.cream} />
          <polygon points="186,170 201,177 201,194 186,187" fill={C.steel} />
          <polygon points="201,177 216,170 216,187 201,194" fill={C.cream} />
          <g fill="#1B1B1B" stroke="none">
            <ellipse cx={201} cy={170} rx={2.6} ry={1.6} />
            <circle cx={190} cy={176} r={1.8} /><circle cx={197} cy={187} r={1.8} />
            <circle cx={205} cy={180} r={1.8} /><circle cx={208.5} cy={181.5} r={1.8} /><circle cx={212} cy={177} r={1.8} />
          </g>
        </>
      )}
    </InkSvg>
  );
}

/* -------------------------------------------------------------- COYS pennant */

/** A fan's pennant in navy and white. Deliberately not the club crest. */
export function CoysPennant(p: Props) {
  return (
    <InkSvg label="A navy and white COYS pennant" {...p}>
      {(ids) => (
        <>
          <InkLine d="M 40 30 L 40 222" width={6} color={C.bark} />
          <circle cx={40} cy={26} r={8} fill={C.mustard} />
          <polygon points="44,50 216,96 44,142" fill={C.navy} />
          <polygon points="44,118 216,96 44,142" fill={`url(#${ids.dots})`} stroke="none" opacity={0.5} />
          <polygon points="44,50 70,57 70,135 44,142" fill={C.cream} />
          <text
            x={128} y={107} textAnchor="middle" fill={C.cream} stroke="none"
            style={{ fontFamily: 'inherit', fontWeight: 800, fontSize: 30, letterSpacing: '0.02em' }}
          >
            COYS
          </text>
          {/* tassel */}
          <path d="M 216 96 L 226 112 M 216 96 L 220 116 M 216 96 L 230 106" fill="none" stroke={C.cream} strokeWidth={3} />
        </>
      )}
    </InkSvg>
  );
}

/* --------------------------------------------------------- canvas on easel */

export function Canvas(p: Props) {
  const clip = `canvas-${clipId(useId())}`;
  return (
    <InkSvg label="A painting on an easel" {...p}>
      {(ids) => (
        <>
          <defs>
            <clipPath id={clip}><rect x={58} y={46} width={124} height={106} /></clipPath>
          </defs>
          <InkLine d="M 120 150 L 120 228" width={5} color={C.bark} />
          <InkLine d="M 114 28 L 76 228" width={6} color={C.bark} />
          <InkLine d="M 126 28 L 164 228" width={6} color={C.bark} />
          <rect x={58} y={46} width={124} height={106} fill={C.lavender} />
          <g clipPath={`url(#${clip})`}>
            <circle cx={150} cy={78} r={15} fill={C.mustard} strokeWidth={2.5} />
            <path d="M 50 140 Q 90 96 128 134 Q 154 112 190 138 L 190 160 L 50 160 Z" fill={C.green} strokeWidth={2.5} />
            <path d="M 50 150 Q 120 128 190 150 L 190 160 L 50 160 Z" fill={`url(#${ids.dots})`} stroke="none" opacity={0.4} />
            <path d="M 78 72 q 6 -5 12 0 q 6 -5 12 0" fill="none" strokeWidth={2.2} />
          </g>
          <rect x={58} y={46} width={124} height={106} fill="none" strokeWidth={5} />
          <rect x={112} y={36} width={16} height={12} fill={C.bark} />
          <rect x={46} y={152} width={148} height={10} rx={2} fill={C.bark} />
          {/* a brush resting on the ledge */}
          <path d="M 150 150 L 186 138" stroke={C.pink} strokeWidth={5} />
          <path d="M 186 138 L 196 134" strokeWidth={4} />
        </>
      )}
    </InkSvg>
  );
}

/* ---------------------------------------------------------- pencil drawing */

/** A pencil sketch taped to a wall: a self-portrait doodle. */
export function Drawing(p: Props) {
  return (
    <InkSvg label="A pencil sketch of a face, taped up" {...p}>
      {(ids) => (
        <g transform="rotate(-5 120 120)">
          <rect x={52} y={34} width={140} height={172} fill={C.cream} />
          <rect x={52} y={170} width={140} height={36} fill={`url(#${ids.dots})`} stroke="none" opacity={0.15} />
          <g stroke={C.graphite} strokeWidth={2} fill="none">
            <ellipse cx={122} cy={116} rx={36} ry={42} />
            {/* hair, scribbled */}
            <path d="M 88 104 q 4 -30 34 -32 q 30 0 36 30 M 92 92 l 8 -10 l 6 8 l 8 -12 l 6 10 l 8 -12 l 6 10 l 8 -8 l 6 12" />
            <rect x={98} y={108} width={20} height={15} rx={6} />
            <rect x={126} y={108} width={20} height={15} rx={6} />
            <path d="M 118 113 L 126 113" />
            <path d="M 108 138 Q 122 150 136 138" />
            <path d="M 84 120 q -8 4 0 14 M 160 120 q 8 4 0 14" />
            <path d="M 72 202 Q 122 160 172 202" />
          </g>
          <rect x={44} y={28} width={34} height={13} fill={C.mustard} opacity={0.9} transform="rotate(-28 61 34)" strokeWidth={2} />
          <rect x={166} y={28} width={34} height={13} fill={C.mustard} opacity={0.9} transform="rotate(26 183 34)" strokeWidth={2} />
        </g>
      )}
    </InkSvg>
  );
}

/* ------------------------------------------------------------------- laptop */

const CODE_LINES: [number, number, number, string][] = [
  [58, 64, 46, C.pink], [110, 64, 30, C.cream],
  [70, 78, 60, C.mustard],
  [70, 92, 34, C.cream], [110, 92, 44, C.green],
  [82, 106, 52, C.peach],
  [70, 120, 28, C.mustard], [104, 120, 38, C.cream],
  [58, 134, 22, C.pink],
];

export function Laptop(p: Props) {
  return (
    <InkSvg label="An open laptop with code on screen" {...p}>
      {(ids) => (
        <>
          <rect x={38} y={40} width={164} height={114} rx={10} fill={C.charcoal} />
          <rect x={48} y={50} width={144} height={94} rx={4} fill={C.cornflower} />
          {CODE_LINES.map(([x, y, w, color], i) => (
            <path key={i} d={`M ${x} ${y} L ${x + w} ${y}`} stroke={color} strokeWidth={5} />
          ))}
          <path d="M 150 56 L 120 138" stroke={C.cream} strokeWidth={6} opacity={0.25} />
          <polygon points="24,154 216,154 236,178 4,178" fill={C.steel} />
          <polygon points="4,178 236,178 236,184 4,184" fill={C.charcoal} />
          <polygon points="14,166 226,166 236,178 4,178" fill={`url(#${ids.dots})`} stroke="none" opacity={0.25} />
          <path d="M 100 154 L 104 161 L 136 161 L 140 154" fill="none" strokeWidth={2} />
        </>
      )}
    </InkSvg>
  );
}

/* ------------------------------------------------------------------- camera */

export function Camera(p: Props) {
  return (
    <InkSvg label="A camera" {...p}>
      {(ids) => (
        <>
          {/* strap lugs */}
          <path d="M 40 96 L 28 82 M 200 96 L 212 82" fill="none" strokeWidth={4} />
          {/* prism hump, shutter button, flash */}
          <path d="M 88 82 L 100 58 L 140 58 L 152 82 Z" fill={C.steel} />
          <rect x={108} y={64} width={24} height={10} rx={2} fill={C.cream} strokeWidth={2} />
          <rect x={52} y={70} width={24} height={12} rx={3} fill={C.mustard} />
          {/* body: steel top and bottom, dotted leatherette band */}
          <rect x={36} y={80} width={168} height={104} rx={14} fill={C.steel} />
          <rect x={36} y={100} width={168} height={64} fill={C.charcoal} />
          <rect x={36} y={100} width={168} height={64} fill={`url(#${ids.dots})`} stroke="none" opacity={0.5} />
          {/* lens */}
          <circle cx={120} cy={132} r={44} fill={C.charcoal} />
          <circle cx={120} cy={132} r={33} fill={C.steel} />
          <circle cx={120} cy={132} r={22} fill={C.lavender} />
          <circle cx={120} cy={132} r={10} fill={C.cornflower} strokeWidth={2} />
          <path d="M 104 124 Q 108 114 118 112" fill="none" stroke={C.cream} strokeWidth={4} />
          <circle cx={182} cy={92} r={4} fill={C.pink} strokeWidth={1.5} />
        </>
      )}
    </InkSvg>
  );
}

/* ---------------------------------------------------------------- projector */

/** A projector throwing shapes — the Projection Mapper's room. */
export function Projector(p: Props) {
  return (
    <InkSvg label="A projector throwing colourful shapes" {...p}>
      {(ids) => (
        <>
          {/* beam first, so the lens sits on top of it */}
          <polygon points="160,128 160,160 236,96 236,196" fill={C.mustard} stroke="none" opacity={0.35} />
          <path d="M 160 128 L 236 96 M 160 160 L 236 196" fill="none" strokeWidth={2} strokeDasharray="6 7" />
          <polygon points="196,116 214,148 178,148" fill={C.pink} strokeWidth={2.4} />
          <circle cx={220} cy={168} r={9} fill={C.cornflower} strokeWidth={2.4} />
          <rect x={206} y={122} width={14} height={14} fill={C.green} strokeWidth={2.4} transform="rotate(15 213 129)" />
          {/* body */}
          <rect x={20} y={112} width={124} height={66} rx={12} fill={C.peach} />
          <rect x={20} y={156} width={124} height={22} rx={8} fill={`url(#${ids.dots})`} stroke="none" opacity={0.35} />
          <path d="M 36 128 L 36 160 M 46 128 L 46 160 M 56 128 L 56 160" strokeWidth={2.4} />
          <circle cx={84} cy={104} r={8} fill={C.charcoal} />
          <rect x={78} y={104} width={12} height={10} fill={C.charcoal} />
          <circle cx={124} cy={126} r={4} fill={C.green} strokeWidth={1.5} />
          {/* lens */}
          <rect x={142} y={124} width={18} height={40} rx={3} fill={C.charcoal} />
          <ellipse cx={160} cy={144} rx={6} ry={20} fill={C.lavender} />
          {/* feet */}
          <rect x={32} y={178} width={16} height={8} rx={2} fill={C.charcoal} />
          <rect x={116} y={178} width={16} height={8} rx={2} fill={C.charcoal} />
        </>
      )}
    </InkSvg>
  );
}

/* ----------------------------------------------------------- picture frames */

/** A little gallery wall: three framed photos hung from nails. */
export function PictureFrames(p: Props) {
  return (
    <InkSvg label="Three framed photos on a wall" {...p}>
      {(ids) => (
        <>
          {/* strings and nails */}
          <path d="M 52 50 L 82 26 L 112 50 M 160 38 L 176 22 L 192 38" fill="none" strokeWidth={2} />
          <circle cx={82} cy={26} r={3} fill={C.charcoal} />
          <circle cx={176} cy={22} r={3} fill={C.charcoal} />

          {/* big landscape: a mountain */}
          <rect x={28} y={48} width={110} height={86} fill={C.bark} strokeWidth={3} />
          <rect x={38} y={58} width={90} height={66} fill={C.lavender} />
          <path d="M 38 124 L 72 78 L 88 96 L 104 72 L 128 108 L 128 124 Z" fill={C.steel} strokeWidth={2.4} />
          <path d="M 72 78 L 64 90 L 72 88 L 78 94 Z M 104 72 L 98 82 L 106 80 L 110 86 Z" fill={C.cream} strokeWidth={1.8} />
          <rect x={38} y={112} width={90} height={12} fill={`url(#${ids.dots})`} stroke="none" opacity={0.35} />

          {/* portrait: someone on a pink ground */}
          <rect x={150} y={36} width={60} height={78} fill={C.mustard} strokeWidth={3} />
          <rect x={158} y={44} width={44} height={62} fill={C.pink} />
          <circle cx={180} cy={66} r={9} fill={C.peach} strokeWidth={2.2} />
          <path d="M 164 106 Q 180 78 196 106 Z" fill={C.cornflower} strokeWidth={2.2} />

          {/* round frame: green hills and a sun */}
          <circle cx={88} cy={180} r={36} fill={C.charcoal} />
          <circle cx={88} cy={180} r={28} fill={C.peach} />
          <circle cx={100} cy={168} r={7} fill={C.mustard} strokeWidth={2} />
          <path d="M 60 190 Q 80 172 98 190 Q 108 180 116 188 L 116 208 L 60 208 Z" fill={C.green} strokeWidth={2.2} />
          <circle cx={88} cy={180} r={28} fill="none" strokeWidth={3} />

          {/* small square: a sunset */}
          <rect x={150} y={140} width={58} height={58} fill={C.cream} strokeWidth={3} />
          <rect x={158} y={148} width={42} height={42} fill={C.cornflower} />
          <path d="M 162 182 A 17 17 0 0 1 196 182 Z" fill={C.mustard} strokeWidth={2.2} />
          <path d="M 158 182 L 200 182 L 200 190 L 158 190 Z" fill={C.navy} strokeWidth={2.2} />
        </>
      )}
    </InkSvg>
  );
}

/* ------------------------------------------------------------- potted plant */

const leaf = (x: number, y: number, angle: number, len: number) =>
  ({ d: `M 0 0 Q ${len * 0.32} ${-len / 2} 0 ${-len} Q ${-len * 0.32} ${-len / 2} 0 0 Z`, rib: `M 0 -4 L 0 ${-len * 0.82}`, t: `translate(${x} ${y}) rotate(${angle})` });

const LEAVES = [
  leaf(120, 150, -52, 70), leaf(120, 150, -22, 92), leaf(120, 150, 8, 100),
  leaf(120, 150, 36, 84), leaf(120, 150, 64, 64), leaf(116, 152, -80, 52), leaf(124, 152, 86, 50),
];

export function PottedPlant(p: Props) {
  return (
    <InkSvg label="A potted plant" {...p}>
      {(ids) => (
        <>
          {LEAVES.map((l, i) => (
            <g key={i} transform={l.t}>
              <path d={l.d} fill={i % 2 ? C.greenDark : C.green} />
              {i % 2 === 1 && <path d={l.d} fill={`url(#${ids.dots})`} stroke="none" opacity={0.35} />}
              <path d={l.rib} fill="none" strokeWidth={2} />
            </g>
          ))}
          <path d="M 84 160 L 156 160 L 146 222 L 94 222 Z" fill={C.terracotta} />
          <path d="M 128 160 L 156 160 L 146 222 L 124 222 Z" fill={`url(#${ids.dots})`} stroke="none" opacity={0.35} />
          <rect x={78} y={148} width={84} height={16} rx={3} fill={C.terracotta} />
          <path d="M 104 186 q 6 -6 12 0 q 6 6 12 0" fill="none" stroke={C.cream} strokeWidth={3} />
        </>
      )}
    </InkSvg>
  );
}

/* ---------------------------------------------------------------- desk lamp */

export function DeskLamp(p: Props) {
  return (
    <InkSvg label="A desk lamp" {...p}>
      {(ids) => (
        <>
          {/* light pooling below the shade */}
          <polygon points="147,139 202,101 238,214 128,214" fill={C.mustard} stroke="none" opacity={0.3} />
          <ellipse cx={74} cy={214} rx={44} ry={10} fill={C.charcoal} />
          <InkLine d="M 74 208 L 100 128" width={7} color={C.pink} />
          <InkLine d="M 100 128 L 156 92" width={7} color={C.pink} />
          <circle cx={100} cy={128} r={8} fill={C.charcoal} />
          <circle cx={74} cy={206} r={7} fill={C.charcoal} />
          {/* shade, tipped so its mouth faces down and away from the arm */}
          <g transform="rotate(-35 162 102)">
            <path d="M 146 84 L 178 84 L 196 124 L 128 124 Z" fill={C.mustard} />
            <path d="M 164 84 L 178 84 L 196 124 L 166 124 Z" fill={`url(#${ids.dots})`} stroke="none" opacity={0.35} />
            <path d="M 146 124 Q 162 134 178 124" fill={C.cream} strokeWidth={2.4} />
          </g>
          <circle cx={156} cy={92} r={7} fill={C.charcoal} />
        </>
      )}
    </InkSvg>
  );
}

/* ------------------------------------------------------------------ mailbox */

/** Street mailbox with the flag up and a letter in it — the contact section. */
export function Mailbox(p: Props) {
  return (
    <InkSvg label="A mailbox with a letter" {...p}>
      {(ids) => (
        <>
          <InkLine d="M 118 148 L 118 224" width={10} color={C.bark} />
          <path d="M 92 226 l 4 -12 l 4 12 M 136 226 l 4 -14 l 4 14 M 146 226 l 3 -9 l 3 9" fill="none" stroke={C.green} strokeWidth={3} />
          {/* box body with an arched top */}
          <path d="M 52 148 L 52 102 A 30 30 0 0 1 82 72 L 166 72 A 30 30 0 0 1 196 102 L 196 148 Z" fill={C.cornflower} />
          <path d="M 52 130 L 196 130 L 196 148 L 52 148 Z" fill={`url(#${ids.dots})`} stroke="none" opacity={0.35} />
          {/* open door at the front, with the letter poking out */}
          <path d="M 52 148 L 52 102 A 30 30 0 0 1 112 102 L 112 148 Z" fill={C.navy} />
          <g transform="rotate(-12 80 108)">
            <rect x={54} y={92} width={56} height={34} fill={C.cream} />
            <path d="M 54 92 L 82 112 L 110 92" fill="none" strokeWidth={2.4} />
          </g>
          {/* flag up */}
          <path d="M 196 118 L 214 118 L 214 64" fill="none" strokeWidth={5} />
          <polygon points="214,64 238,70 214,86" fill={C.pink} />
        </>
      )}
    </InkSvg>
  );
}

/* -------------------------------------------------------------------- birds */

/** One bird up close and two far away. */
export function Birds(p: Props) {
  return (
    <InkSvg label="Birds flying" {...p}>
      {(ids) => (
        <>
          <path d="M 150 60 q 10 -12 20 0 q 10 -12 20 0" fill="none" strokeWidth={3} />
          <path d="M 184 98 q 7 -8 14 0 q 7 -8 14 0" fill="none" strokeWidth={2.6} />
          {/* near bird, flying left: far wing behind, round body with a forked tail, near wing raised */}
          <path d="M 96 140 C 92 116, 96 100, 104 88 C 112 108, 116 124, 116 140 Z" fill={C.pink} />
          <path d="M 68 148 C 72 128, 112 126, 150 138 L 180 124 L 172 146 L 186 162 L 152 154 C 124 170, 78 168, 68 148 Z" fill={C.pink} />
          <path d="M 86 156 C 104 166, 132 162, 150 152" fill={`url(#${ids.dots})`} stroke="none" opacity={0.35} />
          <path d="M 104 138 C 110 108, 128 90, 154 78 C 148 102, 142 122, 134 140 Z" fill={C.pink} />
          <path d="M 116 124 L 136 98 M 124 132 L 142 108" fill="none" strokeWidth={2} />
          <path d="M 69 144 L 54 148 L 69 153 Z" fill={C.mustard} strokeWidth={2.2} />
          <circle cx={82} cy={143} r={2.8} fill="#1B1B1B" stroke="none" />
        </>
      )}
    </InkSvg>
  );
}
