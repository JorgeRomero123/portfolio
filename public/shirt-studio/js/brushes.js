import { mulberry32 } from './util.js';

// Sizes are in print pixels (300 dpi), so a 12 px ink line is 1 mm on the shirt.
export const BRUSHES = {
  pencil: { name: 'Pencil', kind: 'dab', minW: 0.45, gamma: 1, size: 8, opacity: 0.9, smooth: 0.15, min: 1, max: 0.03 },
  ink: { name: 'Ink', kind: 'line', minW: 0.12, gamma: 1.35, size: 16, opacity: 1, smooth: 0.45, min: 1.5, max: 0.06 },
  mono: { name: 'Mono', kind: 'line', minW: 1, gamma: 1, size: 12, opacity: 1, smooth: 0.55, min: 1.5, max: 0.06 },
  marker: { name: 'Marker', kind: 'line', minW: 0.72, gamma: 1, size: 60, opacity: 0.85, smooth: 0.3, min: 4, max: 0.09 },
  eraser: { name: 'Eraser', kind: 'line', minW: 0.55, gamma: 1, size: 60, opacity: 1, smooth: 0.2, min: 4, max: 0.1 },
};
export const BRUSH_IDS = ['pencil', 'ink', 'mono', 'marker'];

export function widthAt(b, sz, p) {
  const B = BRUSHES[b];
  return sz * (B.minW + (1 - B.minW) * Math.pow(p, B.gamma));
}

// Renders a stroke op as a sequence of "pieces" (one per input point).
// The live drawing path and the full re-render use the exact same piece
// sequence, so what you see while drawing is what gets exported.
export class StrokeRenderer {
  constructor(op, W) {
    this.op = op;
    this.B = BRUSHES[op.b];
    this.W = W;
    this.rng = mulberry32(op.seed >>> 0);
    this.carry = 0;
    this.first = true;
    this.done = 0;
    this.color = op.b === 'eraser' ? '#000' : op.c;
  }
  count() {
    return (this.op.pts.length / 3) | 0;
  }
  drawAll(ctx) {
    this.drawUpTo(ctx, true);
  }
  drawUpTo(ctx, final) {
    const n = this.count();
    if (!n) return;
    const target = final ? n : n >= 2 ? n - 1 : 0;
    for (let k = this.done; k < target; k++) this.piece(ctx, k, n, final);
    this.done = target;
  }
  piece(ctx, k, n, final) {
    const P = this.op.pts;
    const X = (i) => P[i * 3], Y = (i) => P[i * 3 + 1], Pr = (i) => P[i * 3 + 2];
    if (n === 1) return this.dot(ctx, X(0), Y(0), Pr(0));
    let ax, ay, cx, cy, bx, by, pa, pb;
    if (k === 0) {
      ax = X(0); ay = Y(0);
      bx = (X(0) + X(1)) / 2; by = (Y(0) + Y(1)) / 2;
      cx = (ax + bx) / 2; cy = (ay + by) / 2;
      pa = Pr(0); pb = (Pr(0) + Pr(1)) / 2;
    } else if (final && k === n - 1) {
      ax = (X(n - 2) + X(n - 1)) / 2; ay = (Y(n - 2) + Y(n - 1)) / 2;
      bx = X(n - 1); by = Y(n - 1);
      cx = (ax + bx) / 2; cy = (ay + by) / 2;
      pa = (Pr(n - 2) + Pr(n - 1)) / 2; pb = Pr(n - 1);
    } else {
      ax = (X(k - 1) + X(k)) / 2; ay = (Y(k - 1) + Y(k)) / 2;
      cx = X(k); cy = Y(k);
      bx = (X(k) + X(k + 1)) / 2; by = (Y(k) + Y(k + 1)) / 2;
      pa = (Pr(k - 1) + Pr(k)) / 2; pb = (Pr(k) + Pr(k + 1)) / 2;
    }
    if (this.B.kind === 'dab') this.curveDabs(ctx, ax, ay, cx, cy, bx, by, pa, pb);
    else this.curveLine(ctx, ax, ay, cx, cy, bx, by, pa, pb);
  }
  both(ctx, fn) {
    fn();
    if (this.op.sym) {
      ctx.save();
      ctx.transform(-1, 0, 0, 1, this.W, 0);
      fn();
      ctx.restore();
    }
  }
  dot(ctx, x, y, p) {
    if (this.B.kind === 'dab') {
      const dabs = [];
      for (let i = 0; i < 3; i++) dabs.push(this.dab(x, y, p));
      this.both(ctx, () => this.drawDabs(ctx, dabs));
      return;
    }
    const w = widthAt(this.op.b, this.op.sz, p);
    this.both(ctx, () => {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(x, y, w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  curveLine(ctx, ax, ay, cx, cy, bx, by, pa, pb) {
    const b = this.op.b, sz = this.op.sz;
    const wa = widthAt(b, sz, pa), wb = widthAt(b, sz, pb);
    const m = Math.min(12, Math.max(1, Math.ceil(Math.abs(wb - wa) / Math.max(0.35, 0.1 * Math.max(wa, wb)))));
    this.both(ctx, () => {
      ctx.strokeStyle = this.color;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (m === 1) {
        ctx.lineWidth = (wa + wb) / 2;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.quadraticCurveTo(cx, cy, bx, by);
        ctx.stroke();
        return;
      }
      let px = ax, py = ay;
      for (let j = 1; j <= m; j++) {
        const t = j / m, u = 1 - t;
        const x = u * u * ax + 2 * u * t * cx + t * t * bx;
        const y = u * u * ay + 2 * u * t * cy + t * t * by;
        ctx.lineWidth = wa + (wb - wa) * ((j - 0.5) / m);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(x, y);
        ctx.stroke();
        px = x; py = y;
      }
    });
  }
  dab(x, y, p) {
    const r = this.rng;
    const w = widthAt(this.op.b, this.op.sz, p);
    return {
      x: x + (r() - 0.5) * w * 0.16,
      y: y + (r() - 0.5) * w * 0.16,
      r: (w / 2) * (0.72 + 0.28 * r()),
      a: (0.1 + 0.5 * p) * (0.45 + 0.55 * r()),
    };
  }
  curveDabs(ctx, ax, ay, cx, cy, bx, by, pa, pb) {
    const L = (Math.hypot(cx - ax, cy - ay) + Math.hypot(bx - cx, by - cy) + Math.hypot(bx - ax, by - ay)) / 2;
    const steps = Math.max(1, Math.ceil(L / 0.3));
    const dabs = [];
    if (this.first) {
      dabs.push(this.dab(ax, ay, pa));
      this.first = false;
    }
    let px = ax, py = ay;
    for (let j = 1; j <= steps; j++) {
      const t = j / steps, u = 1 - t;
      const x = u * u * ax + 2 * u * t * cx + t * t * bx;
      const y = u * u * ay + 2 * u * t * cy + t * t * by;
      const p = pa + (pb - pa) * t;
      this.carry += Math.hypot(x - px, y - py);
      const sp = Math.max(0.3, widthAt(this.op.b, this.op.sz, p) * 0.2);
      if (this.carry >= sp) {
        this.carry -= sp;
        if (this.carry > sp) this.carry = 0;
        dabs.push(this.dab(x, y, p));
      }
      px = x; py = y;
    }
    if (dabs.length) this.both(ctx, () => this.drawDabs(ctx, dabs));
  }
  drawDabs(ctx, dabs) {
    ctx.fillStyle = this.color;
    for (const d of dabs) {
      ctx.globalAlpha = d.a;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

// Bounding box in print pixels, padded for line width, texture jitter and mirror.
export function strokeBBox(op, W) {
  const P = op.pts;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < P.length; i += 3) {
    const w = widthAt(op.b, op.sz, P[i + 2]) * 0.6 + 2;
    const x = P[i], y = P[i + 1];
    if (x - w < x0) x0 = x - w;
    if (y - w < y0) y0 = y - w;
    if (x + w > x1) x1 = x + w;
    if (y + w > y1) y1 = y + w;
  }
  if (op.sym) {
    const mx0 = W - x1, mx1 = W - x0;
    x0 = Math.min(x0, mx0);
    x1 = Math.max(x1, mx1);
  }
  return [x0, y0, x1, y1];
}
