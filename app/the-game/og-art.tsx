// Shared artwork for /the-game's Open Graph and Twitter images (next/og ImageResponse, no deps):
// an original low-poly board of tiles in the section colours, plus the title.
import { ImageResponse } from 'next/og';
import raw from '@/content/the-game.json';

export const ogSize = { width: 1200, height: 630 };
export const ogAlt = 'The Game: a playable low-poly board game tour of Jorge Romero Romanis';

const COLORS = (raw as { sections: { color: string }[] }).sections.map((s) => s.color);

function shade(hex: string, t: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(t >= 0 ? v + (255 - v) * t : v * (1 + t)));
  return `rgb(${c.join(',')})`;
}

/** Isometric tile (diamond top + two side faces) as SVG polygons, centred at (x, y). */
function tile(x: number, y: number, w: number, color: string, h = 16) {
  const hw = w / 2;
  const hh = w / 4;
  return [
    { points: `${x},${y - hh} ${x + hw},${y} ${x},${y + hh} ${x - hw},${y}`, fill: shade(color, 0.15) },
    { points: `${x - hw},${y} ${x},${y + hh} ${x},${y + hh + h} ${x - hw},${y + h}`, fill: shade(color, -0.12) },
    { points: `${x + hw},${y} ${x},${y + hh} ${x},${y + hh + h} ${x + hw},${y + h}`, fill: shade(color, -0.3) },
  ];
}

export function renderOg() {
  // A loop of 11 section tiles around a green island, drawn in isometric space.
  const cx = 860;
  const cy = 330;
  const loop: { x: number; y: number; c: string }[] = [];
  for (let i = 0; i < COLORS.length; i++) {
    const a = (i / COLORS.length) * Math.PI * 2 - Math.PI / 2;
    loop.push({ x: cx + Math.cos(a) * 250, y: cy + Math.sin(a) * 125, c: COLORS[i] });
  }
  loop.sort((p, q) => p.y - q.y);
  const island = [
    { points: `${cx},${cy - 150} ${cx + 300},${cy} ${cx},${cy + 150} ${cx - 300},${cy}`, fill: '#bbf7d0' },
    { points: `${cx - 300},${cy} ${cx},${cy + 150} ${cx},${cy + 190} ${cx - 300},${cy + 40}`, fill: '#86efac' },
    { points: `${cx + 300},${cy} ${cx},${cy + 150} ${cx},${cy + 190} ${cx + 300},${cy + 40}`, fill: '#4ade80' },
  ];
  const polys = [...island, ...loop.flatMap((p) => tile(p.x, p.y, 92, p.c))];
  // A pawn in the middle.
  const pawn = [
    { points: `${cx - 22},${cy + 10} ${cx + 22},${cy + 10} ${cx + 12},${cy - 40} ${cx - 12},${cy - 40}`, fill: '#0070f3' },
    { points: `${cx},${cy + 10} ${cx + 22},${cy + 10} ${cx + 12},${cy - 40} ${cx},${cy - 40}`, fill: '#0058c4' },
  ];

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#f9fafb', position: 'relative' }}>
        <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: 'absolute', left: 0, top: 0 }}>
          {polys.map((p, i) => (
            <polygon key={i} points={p.points} fill={p.fill} />
          ))}
          {pawn.map((p, i) => (
            <polygon key={`p${i}`} points={p.points} fill={p.fill} />
          ))}
          <circle cx={cx} cy={cy - 52} r="18" fill="#0070f3" />
          <circle cx={cx + 6} cy={cy - 57} r="7" fill="#4d9cf8" />
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 0 0 72px', width: 560 }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 4, color: '#0070f3', textTransform: 'uppercase' }}>
            Jorge Romero Romanis
          </div>
          <div style={{ fontSize: 104, fontWeight: 800, color: '#111827', letterSpacing: -4, lineHeight: 1, marginTop: 16 }}>
            The Game
          </div>
          <div style={{ fontSize: 32, color: '#4b5563', marginTop: 22, lineHeight: 1.3 }}>
            A playable board game tour of an engineer who builds too much.
          </div>
          <div style={{ display: 'flex', marginTop: 34, gap: 10 }}>
            {COLORS.map((c) => (
              <div key={c} style={{ width: 26, height: 26, borderRadius: 6, background: c }} />
            ))}
          </div>
        </div>
      </div>
    ),
    ogSize,
  );
}
