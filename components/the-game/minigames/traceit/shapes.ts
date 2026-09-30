// Geometry for "Trace it": the outlines (original, drawn in code), resampling and scoring helpers.
// Everything lives in a logical 400 × 320 board that the canvas scales to fit.

export type P = { x: number; y: number };
export type ShapeId = 'wave' | 'house' | 'heart' | 'star';
export interface Shape {
  id: ShapeId;
  /** Outline resampled every STEP units. */
  pts: P[];
  closed: boolean;
  /** Seconds allowed. */
  time: number;
  box: { x0: number; y0: number; x1: number; y1: number };
}

export const W = 400;
export const H = 320;
const STEP = 3;
/** An outline point counts as traced when ink passes within this distance. */
export const COVER_R = 12;
/** Keyboard pen is pulled towards the outline when this close. */
export const SNAP_R = 18;
/** Average score needed to win. */
export const WIN = 60;

export const dist = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y);

function resample(poly: P[], closed: boolean): P[] {
  const src = closed ? [...poly, poly[0]] : poly;
  const out: P[] = [src[0]];
  let carry = 0;
  for (let i = 1; i < src.length; i++) {
    const a = src[i - 1];
    const b = src[i];
    const len = dist(a, b);
    if (!len) continue;
    let d = STEP - carry;
    while (d <= len) {
      out.push({ x: a.x + ((b.x - a.x) * d) / len, y: a.y + ((b.y - a.y) * d) / len });
      d += STEP;
    }
    carry = len - (d - STEP);
  }
  const last = out[out.length - 1];
  if (closed) {
    if (dist(last, out[0]) < STEP * 0.5) out.pop();
  } else if (dist(last, src[src.length - 1]) > 0.5) out.push(src[src.length - 1]);
  return out;
}

function make(id: ShapeId, raw: P[], closed: boolean, time: number): Shape {
  const pts = resample(raw, closed);
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  return {
    id,
    pts,
    closed,
    time,
    box: { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) },
  };
}

const range = (n: number, f: (u: number) => P) => Array.from({ length: n + 1 }, (_, i) => f(i / n));

const wave = () =>
  make(
    'wave',
    range(240, (u) => ({ x: 88 + u * 262, y: 160 - 46 * Math.sin(u * Math.PI * 3) })),
    false,
    10,
  );

const house = () =>
  make(
    'house',
    [
      { x: 135, y: 250 },
      { x: 135, y: 155 },
      { x: 218, y: 78 },
      { x: 301, y: 155 },
      { x: 301, y: 250 },
    ],
    true,
    12,
  );

const heart = () =>
  make(
    'heart',
    range(320, (u) => {
      const t = u * Math.PI * 2;
      return {
        x: 216 + 6 * 16 * Math.sin(t) ** 3,
        y: 150 - 6 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)),
      };
    }).slice(0, -1),
    true,
    12,
  );

const star = () =>
  make(
    'star',
    Array.from({ length: 10 }, (_, i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 ? 42 : 102;
      return { x: 216 + r * Math.cos(a), y: 168 + r * Math.sin(a) };
    }),
    true,
    13,
  );

/** Easy open curve first, then a closed shape, then the pointy star. ~35 s in total. */
export const pickShapes = (): Shape[] => [wave(), Math.random() < 0.5 ? house() : heart(), star()];

export function nearest(pts: P[], p: P) {
  let bi = 0;
  let bd = Infinity;
  for (let i = 0; i < pts.length; i++) {
    const d = (pts[i].x - p.x) ** 2 + (pts[i].y - p.y) ** 2;
    if (d < bd) {
      bd = d;
      bi = i;
    }
  }
  return { i: bi, d: Math.sqrt(bd) };
}

/**
 * Shape score 0–100 = coverage × accuracy. Coverage: share of the outline traced.
 * Accuracy: from the mean distance of every ink sample to the outline (≤3 = perfect, ≥23 = none),
 * floored at 25% so a wobbly but complete trace still counts. A dot or a scribble can't score.
 */
export function shapeScore(coverage: number, meanDist: number) {
  const acc = Math.max(0, Math.min(1, 1 - (meanDist - 3) / 20));
  return Math.round(100 * coverage * (0.25 + 0.75 * acc));
}
