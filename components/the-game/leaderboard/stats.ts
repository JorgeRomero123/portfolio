// "Where you stand" maths for the race results, shared by the API (bucketing, percentile) and the
// chart (smoothing). Pure functions; the shapes below are also the API's JSON responses.
import { CURVE_MIN_WINS, MAX_CURVE_MS, type Outcome } from './rules';

/** Winning times bucketed into equal bins from `lo`. Times above the last bin are `offChart`. */
export interface Curve {
  lo: number;
  binMs: number;
  counts: number[];
  offChart: number;
}

export interface MyStanding {
  timeMs: number;
  outcome: Outcome;
  /** For a win: 1 = the first player ever to beat Jorge. */
  place: number | null;
  /** For a win: how many other winning runs were slower, out of `others`. */
  slower: number;
  others: number;
}

export interface Stats {
  runs: number;
  wins: number;
  mine: MyStanding | null;
  /** Null below CURVE_MIN_WINS winning times. */
  curve: Curve | null;
  /** From the x-vercel-ip-country header, to preselect the country field. Never stored. */
  country: string | null;
}

export interface BoardRow {
  rank: number;
  nickname: string;
  country: string | null;
  timeMs: number;
  losses: number;
  mine: boolean;
}

export interface Board {
  total: number;
  top: BoardRow[];
  /** The visitor's own row when it's outside the top. */
  me: BoardRow | null;
}

export const BINS = 24;
const STEP = 30_000;

/** Element at quantile q of an ascending array. */
const quantile = (sorted: number[], q: number) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(q * (sorted.length - 1))))];

/**
 * Buckets ascending winning times. The axis runs from the fastest time to 110% of the 95th
 * percentile (rounded out to half minutes), so a handful of very slow or forged runs can't
 * stretch it; anything beyond counts as `offChart` (and still counts for the percentile).
 */
export function bucketTimes(sorted: number[]): Curve | null {
  const times = sorted.filter((t) => t <= MAX_CURVE_MS);
  if (times.length < CURVE_MIN_WINS) return null;
  const lo = Math.floor(times[0] / STEP) * STEP;
  const hi = Math.max(lo + 4 * STEP, Math.ceil((quantile(times, 0.95) * 1.1) / STEP) * STEP);
  const binMs = (hi - lo) / BINS;
  const counts = new Array<number>(BINS).fill(0);
  let offChart = sorted.length - times.length;
  for (const t of times) {
    if (t > hi) offChart++;
    else counts[Math.min(BINS - 1, Math.floor((t - lo) / binMs))]++;
  }
  return { lo, binMs, counts, offChart };
}

/**
 * Standing of `mine` among all winning times (ascending, mine included once when `includesMine`).
 * Ties count as not slower.
 */
export function standing(sorted: number[], mine: { timeMs: number; outcome: Outcome; place: number | null }, includesMine: boolean): MyStanding {
  let others = sorted;
  if (includesMine && mine.outcome === 'won') {
    const i = sorted.indexOf(mine.timeMs);
    if (i >= 0) others = [...sorted.slice(0, i), ...sorted.slice(i + 1)];
  }
  const slower = mine.outcome === 'won' ? others.filter((t) => t > mine.timeMs).length : 0;
  return { ...mine, slower, others: others.length };
}

/** Whole percent of other winners this run beat; floored so 99.6% never reads as 100%. */
export const fasterThanPct = (m: MyStanding) => (m.others > 0 ? Math.floor((100 * m.slower) / m.others) : 100);

/**
 * Smooth bucket counts for display: a Gaussian kernel (σ ≈ one bin) evaluated at `samples` points
 * across the axis. Returns heights normalised to 0..1, plus the axis range.
 */
export function smoothCurve(c: Curve, samples = 96): { lo: number; hi: number; ys: number[] } {
  const hi = c.lo + c.binMs * c.counts.length;
  const sigma = c.binMs * 1.1;
  const ys: number[] = [];
  for (let i = 0; i < samples; i++) {
    const x = c.lo + ((hi - c.lo) * i) / (samples - 1);
    let y = 0;
    c.counts.forEach((n, b) => {
      if (!n) return;
      const d = (x - (c.lo + (b + 0.5) * c.binMs)) / sigma;
      y += n * Math.exp(-0.5 * d * d);
    });
    ys.push(y);
  }
  const max = Math.max(...ys) || 1;
  return { lo: c.lo, hi, ys: ys.map((y) => y / max) };
}
