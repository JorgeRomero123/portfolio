import { StrokeRenderer } from './brushes.js';

export const FONTS = [
  { id: 'anton', family: 'SS Anton', label: 'Anton' },
  { id: 'bebas', family: 'SS Bebas', label: 'Bebas Neue' },
  { id: 'archivo', family: 'SS Archivo', label: 'Archivo Black' },
  { id: 'marker', family: 'SS Marker', label: 'Permanent Marker' },
  { id: 'pacifico', family: 'SS Pacifico', label: 'Pacifico' },
  { id: 'mono', family: 'SS Mono', label: 'Space Mono' },
];
export const fontById = (id) => FONTS.find((f) => f.id === id) || FONTS[0];

export async function ensureFont(id) {
  const f = fontById(id);
  try {
    await document.fonts.load(`100px "${f.family}"`);
  } catch {}
}

const LINE_H = 1.08;
let measureCtx;
function mctx() {
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
  return measureCtx;
}

export function textLayout(op) {
  const ctx = mctx();
  ctx.font = `${op.sz}px "${fontById(op.font).family}"`;
  const lines = op.str.split('\n');
  const lh = op.sz * LINE_H;
  let w = 0;
  for (const l of lines) w = Math.max(w, ctx.measureText(l).width);
  const h = lh * lines.length;
  const pad = op.sz * 0.35;
  return { lines, lh, w, h, bb: [op.x - w / 2 - pad, op.y - h / 2 - pad, op.x + w / 2 + pad, op.y + h / 2 + pad] };
}

export function drawText(ctx, op) {
  const { lines, lh, h } = textLayout(op);
  ctx.font = `${op.sz}px "${fontById(op.font).family}"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = op.c;
  let y = op.y - h / 2 + lh / 2;
  for (const l of lines) {
    ctx.fillText(l, op.x, y);
    y += lh;
  }
}

// Integer pixel rect of an op's bbox on a target canvas at scale s, offset (ox, oy) in print px.
export function pxRect(bb, s, ox, oy, cw, ch) {
  const x0 = Math.max(0, Math.floor((bb[0] - ox) * s) - 1);
  const y0 = Math.max(0, Math.floor((bb[1] - oy) * s) - 1);
  const x1 = Math.min(cw, Math.ceil((bb[2] - ox) * s) + 1);
  const y1 = Math.min(ch, Math.ceil((bb[3] - oy) * s) + 1);
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export function composite(tctx, src, r, alpha, erase) {
  tctx.save();
  tctx.setTransform(1, 0, 0, 1, 0, 0);
  tctx.globalAlpha = alpha;
  tctx.globalCompositeOperation = erase ? 'destination-out' : 'source-over';
  tctx.drawImage(src, r.x, r.y, r.w, r.h, r.x, r.y, r.w, r.h);
  tctx.restore();
}

// Render one op onto a layer canvas. s = target px per print px, (ox, oy) = print-px
// origin of the target (non-zero for export tiles). bctx is a scratch buffer the same
// size as the target, used so a stroke's own overlaps don't stack opacity.
export function renderOp(tctx, bctx, op, s, ox, oy, W) {
  const cw = tctx.canvas.width, ch = tctx.canvas.height;
  const r = pxRect(op.bb, s, ox, oy, cw, ch);
  if (r.w <= 0 || r.h <= 0) return;
  if (op.t === 's') {
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    bctx.clearRect(r.x, r.y, r.w, r.h);
    bctx.setTransform(s, 0, 0, s, -ox * s, -oy * s);
    new StrokeRenderer(op, W).drawAll(bctx);
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    composite(tctx, bctx.canvas, r, op.op, op.b === 'eraser');
  } else if (op.t === 'f') {
    tctx.save();
    tctx.globalCompositeOperation = 'destination-over';
    if (Math.abs(s - op.ws) < 1e-9 && !ox && !oy) {
      tctx.setTransform(1, 0, 0, 1, 0, 0);
      tctx.drawImage(op.mask, op.px[0], op.px[1]);
    } else {
      tctx.setTransform(s, 0, 0, s, -ox * s, -oy * s);
      tctx.imageSmoothingEnabled = true;
      tctx.imageSmoothingQuality = 'high';
      tctx.drawImage(op.mask, op.bb[0], op.bb[1], op.bb[2] - op.bb[0], op.bb[3] - op.bb[1]);
    }
    tctx.restore();
  } else if (op.t === 'i') {
    tctx.save();
    tctx.setTransform(s, 0, 0, s, -ox * s, -oy * s);
    tctx.imageSmoothingEnabled = true;
    tctx.imageSmoothingQuality = 'high';
    tctx.drawImage(op.img, op.bb[0], op.bb[1], op.bb[2] - op.bb[0], op.bb[3] - op.bb[1]);
    tctx.restore();
  } else if (op.t === 'x') {
    tctx.save();
    tctx.setTransform(s, 0, 0, s, -ox * s, -oy * s);
    drawText(tctx, op);
    tctx.restore();
  }
}
