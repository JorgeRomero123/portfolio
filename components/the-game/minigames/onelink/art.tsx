// Flat low-poly SVG art for "One link": the falling files, the distractions and the album.
// Files use the section's teal family; distractions use rose/orange so they read as "avoid".

export type FileKind = 'photo' | 'video' | 'pano' | 'pdf';
export type JunkKind = 'spam' | 'chat';
export type ItemKind = FileKind | JunkKind;

export const TEAL = '#0d9488';

export function ItemIcon({ kind, size }: { kind: ItemKind; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      {kind === 'photo' && (
        <>
          <rect x={5} y={7} width={30} height={26} rx={3} fill="#fff" stroke="#0f766e" strokeWidth={1.5} />
          <rect x={8} y={10} width={24} height={17} fill="#ccfbf1" />
          <polygon points="8,27 16,15 23,23 26,19 32,27" fill={TEAL} />
          <polygon points="16,15 19,21 13,27 8,27" fill="#0f766e" />
          <polygon points="26,19 32,27 27,27" fill="#115e59" />
          <circle cx={27} cy={14} r={2.6} fill="#f59e0b" />
        </>
      )}
      {kind === 'video' && (
        <>
          <rect x={4} y={9} width={32} height={22} rx={4} fill="#115e59" />
          <polygon points="20,9 32,9 36,13 36,27 30,31 24,31" fill="#0f766e" />
          <polygon points="15.5,13.5 27.5,20 15.5,26.5" fill="#fff" />
          <polygon points="15.5,13.5 27.5,20 15.5,20" fill="#ccfbf1" />
        </>
      )}
      {kind === 'pano' && (
        <>
          <polygon points="20,6 30,10 34,20 30,30 20,34 10,30 6,20 10,10" fill={TEAL} />
          <polygon points="20,6 30,10 20,20" fill="#5eead4" />
          <polygon points="30,10 34,20 20,20" fill="#2dd4bf" />
          <polygon points="10,10 20,6 20,20" fill="#14b8a6" />
          <polygon points="6,20 10,30 20,20" fill="#0f766e" />
          <polygon points="10,30 20,34 20,20" fill="#115e59" />
          <polygon points="30,30 34,20 20,20" fill="#0f766e" />
          <ellipse cx={20} cy={20} rx={17.5} ry={5} fill="none" stroke="#fff" strokeWidth={1.6} />
          <polygon points="36.5,18.5 38.5,21.5 34.5,21.5" fill="#fff" />
        </>
      )}
      {kind === 'pdf' && (
        <>
          <polygon points="11,5 26,5 32,11 32,35 11,35" fill="#fff" stroke="#0f766e" strokeWidth={1.5} strokeLinejoin="round" />
          <polygon points="26,5 26,11 32,11" fill="#99f6e4" />
          <rect x={15} y={13} width={12} height={2} rx={1} fill="#99f6e4" />
          <rect x={15} y={28} width={13} height={2} rx={1} fill="#99f6e4" />
          <rect x={5} y={18} width={20} height={8.5} rx={1.5} fill={TEAL} />
          <text x={15} y={24.8} textAnchor="middle" fontSize={6.6} fontWeight={800} fill="#fff" fontFamily="system-ui, sans-serif">
            PDF
          </text>
        </>
      )}
      {kind === 'spam' && (
        <>
          <rect x={4} y={11} width={29} height={21} rx={2} fill="#fff1f2" stroke="#e11d48" strokeWidth={1.5} />
          <polygon points="4,11 18.5,23 33,11" fill="#fecdd3" stroke="#e11d48" strokeWidth={1.5} strokeLinejoin="round" />
          <path d="M7 29 l3 -3 l3 3 l3 -3 l3 3 l3 -3 l3 3 l3 -3" fill="none" stroke="#fb7185" strokeWidth={1.2} />
          <circle cx={32} cy={10} r={6.5} fill="#e11d48" />
          <rect x={31} y={6} width={2} height={5.2} rx={1} fill="#fff" />
          <circle cx={32} cy={13.4} r={1.1} fill="#fff" />
        </>
      )}
      {kind === 'chat' && (
        <>
          <path d="M5 8 h26 a3 3 0 0 1 3 3 v14 a3 3 0 0 1 -3 3 h-15 l-7 6 v-6 h-4 a3 3 0 0 1 -3 -3 v-14 a3 3 0 0 1 3 -3 z" fill="#fff7ed" stroke="#ea580c" strokeWidth={1.5} strokeLinejoin="round" />
          <path d="M8 18 c3 -6 6 5 9 -1 s5 6 8 0 s-10 -2 -12 3 s9 3 13 -1" fill="none" stroke="#fb923c" strokeWidth={1.4} strokeLinecap="round" />
          <rect x={22} y={2} width={16} height={10} rx={5} fill="#ea580c" />
          <text x={30} y={9.6} textAnchor="middle" fontSize={7.5} fontWeight={800} fill="#fff" fontFamily="system-ui, sans-serif">
            20
          </text>
        </>
      )}
    </svg>
  );
}

/** Open album seen slightly from above: two low-poly pages with 20 photo slots that fill up. */
export function AlbumArt({ width, filled }: { width: number; filled: number }) {
  const slots = [];
  for (let i = 0; i < 20; i++) {
    const page = i < 10 ? 0 : 1;
    const j = i % 10;
    const col = j % 5;
    const row = Math.floor(j / 5);
    slots.push(
      <rect
        key={i}
        x={(page ? 83 : 13) + col * 11}
        y={24 + row * 14}
        width={9}
        height={10}
        rx={1.5}
        fill={i < filled ? (i % 3 === 0 ? '#0f766e' : i % 3 === 1 ? TEAL : '#2dd4bf') : '#e6f6f4'}
      />,
    );
  }
  return (
    <svg width={width} height={width * 0.47} viewBox="0 0 150 70" aria-hidden>
      <polygon points="3,16 147,16 150,67 0,67" fill="#0f766e" />
      <polygon points="0,67 150,67 147,62 3,62" fill="#115e59" />
      <polygon points="8,10 74,15 74,61 5,59" fill="#fff" />
      <polygon points="5,59 74,61 74,57 7,55" fill="#ccfbf1" />
      <polygon points="76,15 142,10 145,59 76,61" fill="#f7fdfc" />
      <polygon points="76,61 145,59 143,55 76,57" fill="#ccfbf1" />
      <line x1={75} y1={13} x2={75} y2={62} stroke={TEAL} strokeWidth={2} />
      {slots}
    </svg>
  );
}

export function LinkGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden>
      <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2" />
      <path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2" />
    </svg>
  );
}
