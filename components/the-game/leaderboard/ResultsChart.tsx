'use client';

// "Where you stand": the smoothed distribution of every winning time, drawn as inline SVG in the
// site's light style (one blue series, hairline axis), with an optional YOU marker on the axis.
// Built from the server's buckets; the smoothing is only for display (stats.ts).
import { useId, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BOARD_STRINGS } from '../strings';
import type { Lang } from '../types';
import { formatMinutes, formatTime } from './rules';
import { smoothCurve, type Curve } from './stats';

const W = 320;
const H = 132;
const PAD_X = 10;
const TOP = 24;
const BASE = 98;
const BLUE = '#0070f3';
const INK = '#111827';
const MUTED = '#6b7280';
const HAIR = '#e5e7eb';

const TICK_STEPS_MIN = [1, 2, 5, 10, 15, 20, 30, 60, 120];

function ticks(lo: number, hi: number): number[] {
  const span = (hi - lo) / 60_000;
  const step = (TICK_STEPS_MIN.find((s) => span / s <= 4) ?? 120) * 60_000;
  const out: number[] = [];
  for (let t = Math.ceil(lo / step) * step; t <= hi; t += step) out.push(t);
  return out;
}

export function ResultsChart({
  curve,
  mineMs,
  lang,
  reducedMotion,
  title,
}: {
  curve: Curve;
  /** The visitor's winning time, or null for no marker. */
  mineMs: number | null;
  lang: Lang;
  reducedMotion: boolean;
  title: string;
}) {
  const b = BOARD_STRINGS[lang];
  const uid = useId().replace(/:/g, '');
  const [hoverBin, setHoverBin] = useState<number | null>(null);
  const { lo, hi, ys } = useMemo(() => smoothCurve(curve), [curve]);

  const x = (t: number) => PAD_X + ((Math.min(hi, Math.max(lo, t)) - lo) / (hi - lo)) * (W - 2 * PAD_X);
  const yAt = (h: number) => BASE - h * (BASE - TOP);
  const pts = ys.map((h, i) => [PAD_X + (i / (ys.length - 1)) * (W - 2 * PAD_X), yAt(h)] as const);
  const line = pts.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`).join(' ');
  const area = `${line} L${(W - PAD_X).toFixed(1)},${BASE} L${PAD_X},${BASE} Z`;

  // Height of the smoothed curve at the visitor's time (linear between samples).
  let mine: { x: number; y: number; label: number; past: boolean } | null = null;
  if (mineMs !== null) {
    const f = ((Math.min(hi, Math.max(lo, mineMs)) - lo) / (hi - lo)) * (ys.length - 1);
    const i = Math.floor(f);
    const h = ys[i] + (ys[Math.min(ys.length - 1, i + 1)] - ys[i]) * (f - i);
    const mx = x(mineMs);
    const past = mineMs > hi;
    mine = { x: mx, y: yAt(h), label: Math.min(W - (past ? 26 : 22), Math.max(22, mx)), past };
  }

  const n = curve.counts.reduce((a, c) => a + c, 0);
  const peak = lo + (ys.indexOf(Math.max(...ys)) / (ys.length - 1)) * (hi - lo);
  const desc = b.chartDesc(n, formatTime(lo), formatTime(hi), formatMinutes(peak)) + (mineMs !== null ? b.chartYou(formatTime(mineMs)) : '');

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const vx = ((e.clientX - r.left) / r.width) * W;
    const bin = Math.floor(((vx - PAD_X) / (W - 2 * PAD_X)) * curve.counts.length);
    setHoverBin(bin >= 0 && bin < curve.counts.length ? bin : null);
  };
  const hover =
    hoverBin === null
      ? null
      : {
          x0: x(lo + hoverBin * curve.binMs),
          x1: x(lo + (hoverBin + 1) * curve.binMs),
          text: b.hoverBin(
            formatMinutes(lo + hoverBin * curve.binMs),
            formatMinutes(lo + (hoverBin + 1) * curve.binMs),
            curve.counts[hoverBin],
          ),
        };

  const draw = reducedMotion ? {} : { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 0.9, ease: 'easeOut' as const } };
  const fade = (delay: number) =>
    reducedMotion ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.4, delay } };

  return (
    <figure className="m-0">
      <figcaption className="mb-1 text-xs font-semibold text-gray-900">{title}</figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full touch-pan-y select-none"
        role="img"
        aria-labelledby={`${uid}-t ${uid}-d`}
        onPointerMove={onMove}
        onPointerLeave={() => setHoverBin(null)}
      >
        <title id={`${uid}-t`}>{title}</title>
        <desc id={`${uid}-d`}>{desc}</desc>
        {hover && <rect x={hover.x0} y={TOP - 6} width={Math.max(1, hover.x1 - hover.x0)} height={BASE - TOP + 6} fill={BLUE} opacity={0.06} />}
        <motion.path d={area} fill={BLUE} fillOpacity={0.1} {...fade(0.3)} />
        <motion.path d={line} fill="none" stroke={BLUE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" {...draw} />
        <line x1={PAD_X} x2={W - PAD_X} y1={BASE} y2={BASE} stroke={HAIR} strokeWidth={1} />
        {ticks(lo, hi).map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={BASE} y2={BASE + 4} stroke={HAIR} strokeWidth={1} />
            <text x={x(t)} y={BASE + 15} textAnchor="middle" fontSize={10} fill={MUTED} style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatMinutes(t)}
            </text>
          </g>
        ))}
        <text x={PAD_X} y={H - 3} fontSize={10} fill={MUTED}>
          {b.faster}
        </text>
        <text x={W / 2} y={H - 3} fontSize={10} fill={INK} textAnchor="middle" fontWeight={600}>
          {b.axis}
        </text>
        <text x={W - PAD_X} y={H - 3} fontSize={10} fill={MUTED} textAnchor="end">
          {b.slower}
        </text>
        {mine && (
          <motion.g {...fade(reducedMotion ? 0 : 0.8)}>
            <line x1={mine.x} x2={mine.x} y1={mine.y} y2={BASE} stroke={INK} strokeWidth={1.5} />
            <path d={`M${mine.x},${BASE - 1} l-4.5,7 h9 z`} fill={INK} />
            <rect x={mine.label - (mine.past ? 24 : 18)} y={2} width={mine.past ? 48 : 36} height={16} rx={8} fill={INK} />
            <text x={mine.label} y={13.5} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="#fff" letterSpacing={0.6}>
              {mine.past ? `${b.you} →` : b.you}
            </text>
            <line x1={mine.x} x2={mine.x} y1={18} y2={mine.y - 6} stroke={INK} strokeWidth={1} opacity={0.35} />
            <circle cx={mine.x} cy={mine.y} r={4.5} fill={BLUE} stroke="#fff" strokeWidth={2} />
          </motion.g>
        )}
      </svg>
      <p className="mt-1 min-h-4 text-[11px] text-gray-500" aria-hidden>
        {hover?.text ?? ''}
      </p>
    </figure>
  );
}
