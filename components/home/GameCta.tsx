'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ACCENT, MONO } from './data';

/** Section colours of /the-game, in board order (kept here so the home bundle doesn't pull the game's content). */
const TILE_COLORS = [
  '#0070f3', '#06b6d4', '#132257', '#7c3aed', '#16a34a', '#c026d3',
  '#d97706', '#f97316', '#0d9488', '#ec4899', '#dc2626',
];

/** A tiny flat board: 11 hex tiles on a loop around a pond, with a hopping pawn. */
function MiniBoard({ reduced }: { reduced: boolean }) {
  const cx = 60;
  const cy = 46;
  const tiles = TILE_COLORS.map((c, i) => {
    const a = (i / TILE_COLORS.length) * Math.PI * 2 - Math.PI / 2;
    return { c, x: cx + Math.cos(a) * 40, y: cy + Math.sin(a) * 26 };
  });
  const hex = (x: number, y: number, r: number) =>
    Array.from({ length: 6 }, (_, k) => {
      const a = (Math.PI / 3) * k;
      return `${(x + Math.cos(a) * r).toFixed(1)},${(y + Math.sin(a) * r * 0.62).toFixed(1)}`;
    }).join(' ');
  return (
    <svg viewBox="0 0 120 92" width="120" height="92" aria-hidden focusable="false" style={{ flex: 'none' }}>
      <ellipse cx={cx} cy={cy + 4} rx={56} ry={38} fill="#eef3ea" />
      <ellipse cx={cx} cy={cy + 1} rx={20} ry={11} fill="#7cc4c0" opacity={0.8} />
      {tiles.map((t, i) => (
        <g key={i}>
          <polygon points={hex(t.x, t.y + 2.4, 8)} fill="rgba(11,27,58,0.18)" />
          <polygon points={hex(t.x, t.y, 8)} fill="#ffffff" stroke={t.c} strokeWidth={2.2} />
        </g>
      ))}
      <g className={reduced ? undefined : 'jrr-pawn'} style={{ transformOrigin: `${tiles[0].x}px ${tiles[0].y}px` }}>
        <ellipse cx={tiles[0].x} cy={tiles[0].y - 3} rx={3.6} ry={2} fill={ACCENT} />
        <path d={`M${tiles[0].x - 3.4} ${tiles[0].y - 3} L${tiles[0].x} ${tiles[0].y - 14} L${tiles[0].x + 3.4} ${tiles[0].y - 3}Z`} fill={ACCENT} />
        <circle cx={tiles[0].x} cy={tiles[0].y - 16} r={3.4} fill={ACCENT} />
      </g>
    </svg>
  );
}

export default function GameCta({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      whileHover={reduced ? undefined : { scale: 1.02, y: -2 }}
      whileTap={reduced ? undefined : { scale: 0.985 }}
      style={{ marginTop: 18, pointerEvents: 'auto', maxWidth: 640, borderRadius: 18, padding: 2,
        background: `linear-gradient(110deg, ${TILE_COLORS.join(', ')})` }}
    >
      <Link
        href="/the-game"
        className="jrr-game-cta"
        style={{ display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none', color: '#0b1b3a',
          background: '#ffffff', borderRadius: 16, padding: '12px 20px 12px 12px',
          boxShadow: '0 10px 30px rgba(11,27,58,0.10)' }}
      >
        <MiniBoard reduced={reduced} />
        <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: ACCENT }}>
            New · the playable portfolio
          </span>
          <span style={{ fontSize: 'clamp(18px,1.9vw,23px)', fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.15 }}>
            Play my portfolio as a board game
          </span>
          <span style={{ fontSize: 14, color: '#44557a', lineHeight: 1.4 }}>
            Roll the dice through 11 stops of my life and work, win mini-games, collect stamps.
          </span>
        </span>
        <span className="jrr-game-cta-arrow" aria-hidden style={{ marginLeft: 'auto', fontSize: 24, color: ACCENT, flex: 'none' }}>
          →
        </span>
      </Link>
    </motion.div>
  );
}
