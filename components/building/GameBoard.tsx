import { C, InkSvg, pts } from '@/components/illustration/ink';

/**
 * The Game's board, drawn in the building's ink style: one hex tile per stop in that
 * stop's own colour, on a loop around a pond, with a pawn hopping on the first tile.
 * Decorative: it only appears inside the link to /the-game, whose text says what it is.
 */

const INK = '#1B1B1B';
const CX = 180;
const CY = 124;

/** A flattened hex, as seen from above at an angle. */
const hex = (x: number, y: number, r: number): [number, number][] =>
  Array.from({ length: 6 }, (_, k) => {
    const a = (Math.PI / 3) * k;
    return [x + Math.cos(a) * r, y + Math.sin(a) * r * 0.6];
  });

export default function GameBoard({ colors, style }: { colors: string[]; style?: React.CSSProperties }) {
  const tiles = colors.map((color, i) => {
    const a = (i / colors.length) * Math.PI * 2 - Math.PI / 2;
    return { i, color, x: CX + Math.cos(a) * 124, y: CY + Math.sin(a) * 64 };
  });
  const first = tiles[0];
  // back to front, so nearer tiles overlap the ones behind them
  const drawn = [...tiles].sort((a, b) => a.y - b.y);
  return (
    <InkSvg viewBox="0 0 360 250" label="" style={style}>
      {(ids) => (
        <>
          <style>{`
            .gb-pawn { transform-origin: ${first.x}px ${first.y}px; animation: gb-hop 2.4s ease-in-out infinite; }
            @keyframes gb-hop { 0%,62%,100% { transform: translateY(0); } 72% { transform: translateY(-12px); } 84% { transform: translateY(0) scaleY(.9); } }
            @media (prefers-reduced-motion: reduce) { .gb-pawn { animation: none; } }
          `}</style>

          {/* the board: a thick oval slab */}
          <ellipse cx={CX} cy={CY + 16} rx={170} ry={92} fill={C.greenDark} />
          <ellipse cx={CX} cy={CY + 16} rx={170} ry={92} fill={`url(#${ids.dots})`} stroke="none" opacity={0.4} />
          <ellipse cx={CX} cy={CY} rx={170} ry={92} fill={C.green} />

          {/* the pond in the middle */}
          <ellipse cx={CX} cy={CY} rx={60} ry={28} fill={C.cornflower} />
          <ellipse cx={CX + 8} cy={CY + 6} rx={50} ry={20} fill={`url(#${ids.dots})`} stroke="none" opacity={0.3} />
          <path d={`M ${CX - 30} ${CY - 6} q 10 -5 20 0 M ${CX + 6} ${CY + 8} q 10 -5 20 0`} fill="none" stroke={C.cream} strokeWidth={2.4} />

          {/* tiles: a dark side under each, then the coloured top */}
          {drawn.map((t) => (
            <g key={t.i}>
              <polygon points={pts(hex(t.x, t.y + 7, 22))} fill={INK} />
              <polygon points={pts(hex(t.x, t.y, 22))} fill={t.color} />
              <polygon points={pts(hex(t.x + 3, t.y + 2, 15))} fill="none" stroke={C.cream} strokeWidth={1.6} opacity={0.6} />
            </g>
          ))}

          {/* the pawn, hopping on the first stop */}
          <g className="gb-pawn">
            <path d={`M ${first.x - 9} ${first.y - 2} C ${first.x - 8} ${first.y - 16}, ${first.x - 4} ${first.y - 24}, ${first.x} ${first.y - 28} C ${first.x + 4} ${first.y - 24}, ${first.x + 8} ${first.y - 16}, ${first.x + 9} ${first.y - 2} Z`} fill={C.pink} />
            <ellipse cx={first.x} cy={first.y - 2} rx={11} ry={4} fill={C.pink} />
            <circle cx={first.x} cy={first.y - 32} r={7} fill={C.pink} />
          </g>

          {/* a die, just rolled */}
          <g transform={`translate(${CX + 96} ${CY + 70})`}>
            <polygon points="0,10 16,2 32,10 16,18" fill={C.cream} />
            <polygon points="0,10 16,18 16,36 0,28" fill={C.steel} />
            <polygon points="16,18 32,10 32,28 16,36" fill={C.cream} />
            <g fill={INK} stroke="none">
              <ellipse cx={16} cy={10} rx={2.8} ry={1.7} />
              <circle cx={5} cy={17} r={1.9} /><circle cx={11} cy={27} r={1.9} />
              <circle cx={21} cy={20} r={1.9} /><circle cx={24.5} cy={23} r={1.9} /><circle cx={28} cy={18} r={1.9} />
            </g>
          </g>
        </>
      )}
    </InkSvg>
  );
}
