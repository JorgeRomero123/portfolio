// Canvas 2D painting for "Trace it": plaster wall, phone silhouette, projection glow, outline and ink.
import type { P, Shape } from './shapes';

export const ORANGE = '#f97316';
const INK = 'rgba(31, 41, 55, 0.72)';

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Light plaster texture, drawn once per canvas size: warm base, soft blotches, speckles, faint trowel marks. */
export function makePlaster(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(1, w);
  c.height = Math.max(1, h);
  const x = c.getContext('2d');
  if (!x) return c;
  const r = rng(7);
  x.fillStyle = '#f6f1e9';
  x.fillRect(0, 0, w, h);
  const big = Math.max(w, h);
  for (let i = 0; i < 26; i++) {
    const cx = r() * w;
    const cy = r() * h;
    const rad = big * (0.08 + r() * 0.2);
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, rad);
    const light = r() < 0.5;
    g.addColorStop(0, light ? 'rgba(255,255,255,0.35)' : 'rgba(170,150,120,0.07)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
  }
  x.lineCap = 'round';
  for (let i = 0; i < 14; i++) {
    x.strokeStyle = `rgba(150,130,100,${0.03 + r() * 0.03})`;
    x.lineWidth = big * (0.01 + r() * 0.02);
    const sx = r() * w;
    const sy = r() * h;
    x.beginPath();
    x.moveTo(sx, sy);
    x.quadraticCurveTo(sx + (r() - 0.5) * big * 0.3, sy + (r() - 0.5) * big * 0.1, sx + (r() - 0.5) * big * 0.5, sy + (r() - 0.5) * big * 0.2);
    x.stroke();
  }
  const n = Math.round((w * h) / 90);
  for (let i = 0; i < n; i++) {
    const dark = r() < 0.55;
    x.fillStyle = dark ? `rgba(110,95,75,${0.05 + r() * 0.12})` : `rgba(255,255,255,${0.3 + r() * 0.5})`;
    const s = 0.6 + r() * 1.6;
    x.fillRect(r() * w, r() * h, s, s);
  }
  return c;
}

function path(ctx: CanvasRenderingContext2D, pts: P[], closed: boolean) {
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  if (closed) ctx.closePath();
}

// Phone silhouette: lower-left of the design on wide boards, below it on tall (portrait) boards.
export type Phone = { x: number; y: number; w: number; h: number; rot: number };
export const PHONE_WIDE: Phone = { x: 42, y: 262, w: 44, h: 80, rot: -0.22 };
export const PHONE_TALL: Phone = { x: 112, y: 330, w: 44, h: 80, rot: -0.3 };
const lensOf = (ph: Phone): P => {
  const dy = -ph.h / 2 + 8;
  return { x: ph.x - dy * Math.sin(ph.rot), y: ph.y + dy * Math.cos(ph.rot) };
};

export interface Frame {
  shape: Shape;
  covered: Uint8Array;
  strokes: P[][];
  pen: P;
  showStart: boolean;
  now: number;
  reducedMotion: boolean;
  phone: Phone;
}

/** Everything in logical board units; the caller has already set the transform. */
export function paintBoard(ctx: CanvasRenderingContext2D, f: Frame) {
  const { shape, covered, strokes, pen, now, reducedMotion, phone: PHONE } = f;
  const LENS = lensOf(PHONE);
  const { x0, y0, x1, y1 } = shape.box;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const pulse = reducedMotion ? 0 : Math.sin(now / 650) * 0.035;

  // Projection: a soft beam from the phone and a glow behind the design.
  // A wedge from the lens that just spans the design, fading out with distance (no hard far edge).
  const reach = Math.hypot(x1 + 30 - LENS.x, y0 - 30 - LENS.y) * 1.15;
  const aA = Math.atan2(y0 - 24 - LENS.y, x0 - 24 - LENS.x);
  const aB = Math.atan2(y1 + 24 - LENS.y, x1 + 24 - LENS.x);
  const beam = ctx.createRadialGradient(LENS.x, LENS.y, 4, LENS.x, LENS.y, reach);
  beam.addColorStop(0, 'rgba(249,115,22,0.22)');
  beam.addColorStop(0.45, 'rgba(249,115,22,0.08)');
  beam.addColorStop(0.8, 'rgba(249,115,22,0.025)');
  beam.addColorStop(1, 'rgba(249,115,22,0)');
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(LENS.x, LENS.y);
  ctx.arc(LENS.x, LENS.y, reach, aA, aB);
  ctx.closePath();
  ctx.fill();
  const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(x1 - x0, y1 - y0) * 0.75);
  glow.addColorStop(0, `rgba(255,237,213,${0.55 + pulse * 3})`);
  glow.addColorStop(0.6, `rgba(253,186,116,${0.12 + pulse})`);
  glow.addColorStop(1, 'rgba(253,186,116,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x0 - 120, y0 - 120, x1 - x0 + 240, y1 - y0 + 240);

  // Phone silhouette with the design on its screen.
  ctx.save();
  ctx.translate(PHONE.x, PHONE.y);
  ctx.rotate(PHONE.rot);
  ctx.fillStyle = 'rgba(17,24,39,0.82)';
  ctx.beginPath();
  ctx.roundRect(-PHONE.w / 2, -PHONE.h / 2, PHONE.w, PHONE.h, 8);
  ctx.fill();
  ctx.fillStyle = '#fff7ed';
  ctx.beginPath();
  ctx.roundRect(-PHONE.w / 2 + 3, -PHONE.h / 2 + 12, PHONE.w - 6, PHONE.h - 22, 3);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.arc(0, -PHONE.h / 2 + 6, 1.8, 0, Math.PI * 2);
  ctx.fill();
  const k = (PHONE.w - 12) / Math.max(x1 - x0, y1 - y0);
  ctx.translate(-cx * k, -cy * k + 2);
  ctx.scale(k, k);
  ctx.strokeStyle = ORANGE;
  ctx.lineWidth = 2 / k;
  ctx.lineJoin = 'round';
  path(ctx, shape.pts, shape.closed);
  ctx.stroke();
  ctx.restore();

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // Faint projected outline: a soft halo plus a thin dashed line.
  path(ctx, shape.pts, shape.closed);
  ctx.strokeStyle = 'rgba(249,115,22,0.16)';
  ctx.lineWidth = 9;
  ctx.stroke();
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = 'rgba(234,88,12,0.6)';
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.setLineDash([]);

  // The visitor's marker ink.
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3.4;
  for (const s of strokes) {
    if (s.length === 1) {
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(s[0].x, s[0].y, 1.7, 0, Math.PI * 2);
      ctx.fill();
    } else if (s.length > 1) {
      path(ctx, s, false);
      ctx.stroke();
    }
  }

  // Traced parts of the outline go solid orange.
  ctx.strokeStyle = ORANGE;
  ctx.lineWidth = 4.2;
  const pts = shape.pts;
  const n = pts.length;
  const segs = shape.closed ? n : n - 1;
  ctx.beginPath();
  for (let i = 0; i < segs; i++) {
    const j = (i + 1) % n;
    if (covered[i] && covered[j]) {
      ctx.moveTo(pts[i].x, pts[i].y);
      ctx.lineTo(pts[j].x, pts[j].y);
    }
  }
  ctx.stroke();

  // Start marker and the pen nib.
  if (f.showStart) {
    const s = pts[0];
    const rr = reducedMotion ? 11 : 10 + ((now / 90) % 8);
    ctx.strokeStyle = `rgba(234,88,12,${reducedMotion ? 0.5 : 0.7 - ((now / 90) % 8) / 12})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(s.x, s.y, rr, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#c2410c';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(pen.x, pen.y, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#1f2937';
  ctx.beginPath();
  ctx.arc(pen.x, pen.y, 2, 0, Math.PI * 2);
  ctx.fill();
}
