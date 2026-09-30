// Generic board-game pieces drawn as flat low-poly SVG (original art, no game-specific designs).
// Every face is a 100×100 viewBox; the caller sizes it.
import type { ReactNode } from 'react';
import type { Lang } from '../../types';

export const FACE_IDS = [
  'meepleRed',
  'meepleBlue',
  'meepleYellow',
  'd6',
  'd20',
  'pawn',
  'card',
  'hex',
  'cube',
  'coin',
] as const;
export type FaceId = (typeof FACE_IDS)[number];

export const FACE_NAMES: Record<FaceId, Record<Lang, string>> = {
  meepleRed: { en: 'red meeple', es: 'meeple rojo' },
  meepleBlue: { en: 'blue meeple', es: 'meeple azul' },
  meepleYellow: { en: 'yellow meeple', es: 'meeple amarillo' },
  d6: { en: 'six-sided die', es: 'dado de seis caras' },
  d20: { en: 'twenty-sided die', es: 'dado de veinte caras' },
  pawn: { en: 'pawn', es: 'peón' },
  card: { en: 'playing card', es: 'carta' },
  hex: { en: 'hex tile', es: 'loseta hexagonal' },
  cube: { en: 'resource cube', es: 'cubo de recurso' },
  coin: { en: 'gold coin', es: 'moneda de oro' },
};

const MEEPLE =
  'M50 12c7.5 0 12.5 5.5 12.5 12.5 0 4.5-2 7.8-4.6 10.2L80 43c6.5 2.4 7.8 9.6 2.2 13.4L70 63l12.5 22.5c2.2 4-.4 8.5-5 8.5H64L50 74 36 94H22.5c-4.6 0-7.2-4.5-5-8.5L30 63l-12.2-6.6C12.2 52.6 13.5 45.4 20 43l22.1-8.3c-2.6-2.4-4.6-5.7-4.6-10.2C37.5 17.5 42.5 12 50 12z';

function Meeple({ fill, dark, light }: { fill: string; dark: string; light: string }) {
  return (
    <>
      <ellipse cx="50" cy="94" rx="30" ry="3.5" fill="#000" opacity="0.1" />
      <path d={MEEPLE} fill={fill} stroke={dark} strokeWidth="2.5" strokeLinejoin="round" />
      {/* low-poly facets: lit left side of head and torso */}
      <path d="M50 14.5c-6 0-10 4.5-10 10 0 3.6 1.6 6.3 3.8 8.2L50 36z" fill={light} opacity="0.55" />
      <path d="M44 38 22 46c-4 1.6-4.6 5.6-1 8L32 60l18-4z" fill={light} opacity="0.4" />
      <path d="M50 56 36 94h-4l14-38z" fill={dark} opacity="0.25" />
    </>
  );
}

const ART: Record<FaceId, ReactNode> = {
  meepleRed: <Meeple fill="#ef4444" dark="#991b1b" light="#fecaca" />,
  meepleBlue: <Meeple fill="#3b82f6" dark="#1e3a8a" light="#bfdbfe" />,
  meepleYellow: <Meeple fill="#facc15" dark="#a16207" light="#fef9c3" />,
  d6: (
    <g transform="rotate(-8 50 50)">
      <ellipse cx="54" cy="88" rx="30" ry="4" fill="#000" opacity="0.1" />
      <path d="M22 20h52l8 8v52H30l-8-8z" fill="#cbd5e1" />
      <rect x="18" y="16" width="56" height="56" rx="9" fill="#ffffff" stroke="#334155" strokeWidth="2.5" />
      <path d="M18 72 74 16v47a9 9 0 0 1-9 9z" fill="#e2e8f0" opacity="0.7" />
      {[
        [32, 30],
        [60, 30],
        [46, 44],
        [32, 58],
        [60, 58],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="5.5" fill="#0f172a" />
      ))}
    </g>
  ),
  d20: (
    <>
      <ellipse cx="50" cy="92" rx="28" ry="3.5" fill="#000" opacity="0.1" />
      <polygon points="50,8 86,29 86,71 50,92 14,71 14,29" fill="#7c3aed" stroke="#4c1d95" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="50,24 72,62 28,62" fill="#a78bfa" />
      <polygon points="50,8 86,29 50,24" fill="#c4b5fd" />
      <polygon points="50,8 14,29 50,24" fill="#ddd6fe" />
      <polygon points="14,29 28,62 14,71" fill="#8b5cf6" />
      <polygon points="86,29 72,62 86,71" fill="#6d28d9" />
      <polygon points="28,62 72,62 50,92" fill="#6d28d9" />
      <text x="50" y="54" textAnchor="middle" fontSize="15" fontWeight="800" fill="#2e1065" fontFamily="system-ui, sans-serif">
        20
      </text>
    </>
  ),
  pawn: (
    <>
      <ellipse cx="50" cy="92" rx="30" ry="4" fill="#000" opacity="0.1" />
      <path d="M22 88c0-6 6-9 12-10l6-30h20l6 30c6 1 12 4 12 10z" fill="#0d9488" stroke="#134e4a" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M40 48h9l-3 30H34z" fill="#5eead4" opacity="0.5" />
      <rect x="34" y="42" width="32" height="8" rx="4" fill="#14b8a6" stroke="#134e4a" strokeWidth="2.5" />
      <circle cx="50" cy="28" r="15" fill="#14b8a6" stroke="#134e4a" strokeWidth="2.5" />
      <path d="M44 17a13 13 0 0 0-6 15l12-4z" fill="#99f6e4" opacity="0.7" />
    </>
  ),
  card: (
    <>
      <ellipse cx="50" cy="92" rx="30" ry="3.5" fill="#000" opacity="0.1" />
      <rect x="30" y="14" width="44" height="64" rx="6" fill="#fb923c" stroke="#9a3412" strokeWidth="2.5" transform="rotate(12 52 46)" />
      <g transform="rotate(-8 48 50)">
        <rect x="24" y="16" width="48" height="70" rx="6" fill="#ffffff" stroke="#1e293b" strokeWidth="2.5" />
        <rect x="30" y="22" width="36" height="58" rx="3" fill="none" stroke="#e11d48" strokeWidth="1.5" opacity="0.5" />
        <polygon points="48,36 60,51 48,66 36,51" fill="#e11d48" />
        <polygon points="48,36 48,66 36,51" fill="#fb7185" />
      </g>
    </>
  ),
  hex: (
    <>
      <ellipse cx="50" cy="90" rx="34" ry="4" fill="#000" opacity="0.1" />
      <polygon points="50,10 88,31 88,73 50,94 12,73 12,31" fill="#b45309" />
      <polygon points="50,8 86,28 86,70 50,90 14,70 14,28" fill="#fcd34d" stroke="#92400e" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="50,8 86,28 50,49 14,28" fill="#fde68a" opacity="0.6" />
      <polygon points="36,64 48,40 60,64" fill="#65a30d" />
      <polygon points="48,40 60,64 48,64" fill="#3f6212" />
      <polygon points="54,66 64,48 74,66" fill="#84cc16" />
      <rect x="46.5" y="64" width="3" height="6" fill="#78350f" />
    </>
  ),
  cube: (
    <>
      <ellipse cx="50" cy="90" rx="32" ry="4" fill="#000" opacity="0.1" />
      <polygon points="50,14 84,32 50,50 16,32" fill="#fdba74" stroke="#7c2d12" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="16,32 50,50 50,88 16,70" fill="#ea580c" stroke="#7c2d12" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="84,32 50,50 50,88 84,70" fill="#c2410c" stroke="#7c2d12" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M24 42 42 51M24 52 42 61" stroke="#9a3412" strokeWidth="1.5" opacity="0.5" />
    </>
  ),
  coin: (
    <>
      <ellipse cx="50" cy="92" rx="30" ry="3.5" fill="#000" opacity="0.1" />
      <circle cx="52" cy="53" r="36" fill="#b45309" />
      <circle cx="50" cy="50" r="36" fill="#fbbf24" stroke="#92400e" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="26" fill="none" stroke="#d97706" strokeWidth="3" />
      <polygon
        points="50,31 55,44 69,44 58,53 62,67 50,59 38,67 42,53 31,44 45,44"
        fill="#fef3c7"
        stroke="#b45309"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M26 36a28 28 0 0 1 16-14" stroke="#fef3c7" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.8" />
    </>
  ),
};

export function Face({ id }: { id: FaceId }) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden focusable="false">
      {ART[id]}
    </svg>
  );
}

/** The shared tile back: a small meeple emblem on a green felt tile. */
export function TileBack() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden focusable="false">
      <polygon points="0,0 100,0 0,100" fill="#ffffff" opacity="0.06" />
      <polygon points="100,100 100,0 0,100" fill="#000000" opacity="0.06" />
      <circle cx="50" cy="50" r="27" fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="2" strokeDasharray="4 5" />
      <g transform="translate(30 30) scale(0.4)">
        <path d={MEEPLE} fill="#ffffff" fillOpacity="0.85" />
      </g>
    </svg>
  );
}
