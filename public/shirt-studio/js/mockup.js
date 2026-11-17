import { makeCanvas, hexToRgb } from './util.js';

export const SHIRTS = [
  { id: 'white', label: 'White', c: '#f3f3ef' },
  { id: 'black', label: 'Black', c: '#151515' },
  { id: 'heather', label: 'Heather', c: '#9b9c9e' },
  { id: 'navy', label: 'Navy', c: '#1d2740' },
  { id: 'red', label: 'Red', c: '#a3202a' },
  { id: 'forest', label: 'Forest', c: '#25402f' },
  { id: 'sand', label: 'Sand', c: '#d8c8a6' },
  { id: 'pink', label: 'Pink', c: '#e9b7c4' },
];

// Shirt drawn in a 1000 x 1080 space. Body is ~600 units across ≈ a 21.5 in chest,
// so the design is shown at its real printed size.
const VB_W = 1000, VB_H = 1080;
const UNITS_PER_IN = 600 / 21.5;
const BODY = 'M360 70 C395 135 605 135 640 70 L830 135 L985 330 L860 405 L800 360 L805 1030 Q500 1052 195 1030 L200 360 L140 405 L15 330 L170 135 Z';
const BACK_NECK = 'M360 70 C400 96 600 96 640 70 C605 135 395 135 360 70 Z';
const COLLAR = 'M360 70 C395 135 605 135 640 70';

let noise;
function noiseTile() {
  if (noise) return noise;
  noise = makeCanvas(160, 160);
  const x = noise.getContext('2d');
  const img = x.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  return noise;
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

export function placement(doc) {
  const wIn = doc.W / 300, hIn = doc.H / 300;
  const w = wIn * UNITS_PER_IN, h = hIn * UNITS_PER_IN;
  if (wIn <= 5) return { x: 500 + 3.6 * UNITS_PER_IN - w / 2, y: 225, w, h, chest: true };
  return { x: 500 - w / 2, y: 210, w, h, chest: false };
}

// Draws the mockup into ctx at the given pixel size.
export function drawMockup(ctx, size, design, doc, shirtHex, bgHex = '#d4d4cf') {
  const { w: cw, h: ch } = size;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, cw, ch);
  const s = Math.min(cw / VB_W, ch / VB_H) * 0.94;
  const ox = (cw - VB_W * s) / 2, oy = (ch - VB_H * s) / 2;
  ctx.setTransform(s, 0, 0, s, ox, oy);
  const body = new Path2D(BODY);
  const dark = luminance(shirtHex) < 0.35;

  // drop shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.22)';
  ctx.shadowBlur = 40 * s;
  ctx.shadowOffsetY = 18 * s;
  ctx.fillStyle = shirtHex;
  ctx.fill(body);
  ctx.restore();

  ctx.save();
  ctx.clip(body);
  ctx.fillStyle = shirtHex;
  ctx.fillRect(0, 0, VB_W, VB_H);
  ctx.fillStyle = dark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.12)';
  ctx.fill(new Path2D(BACK_NECK));

  // design
  if (design) {
    const p = placement(doc);
    ctx.imageSmoothingQuality = 'high';
    ctx.globalAlpha = 0.97;
    ctx.drawImage(design, p.x, p.y, p.w, p.h);
    ctx.globalAlpha = 1;
  }

  // fabric: shading + grain over shirt and print alike
  const side = ctx.createLinearGradient(195, 0, 805, 0);
  side.addColorStop(0, 'rgba(0,0,0,0.22)');
  side.addColorStop(0.16, 'rgba(0,0,0,0)');
  side.addColorStop(0.84, 'rgba(0,0,0,0)');
  side.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.fillStyle = side;
  ctx.fillRect(0, 0, VB_W, VB_H);
  const hl = ctx.createRadialGradient(440, 480, 20, 440, 480, 460);
  hl.addColorStop(0, dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.16)');
  hl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hl;
  ctx.fillRect(0, 0, VB_W, VB_H);
  const hem = ctx.createLinearGradient(0, 860, 0, 1050);
  hem.addColorStop(0, 'rgba(0,0,0,0)');
  hem.addColorStop(1, 'rgba(0,0,0,0.14)');
  ctx.fillStyle = hem;
  ctx.fillRect(0, 0, VB_W, VB_H);
  for (const [x, y] of [[200, 360], [800, 360]]) {
    const g = ctx.createRadialGradient(x, y, 4, x, y, 90);
    g.addColorStop(0, 'rgba(0,0,0,0.2)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 100, y - 100, 200, 200);
  }
  ctx.globalAlpha = dark ? 0.05 : 0.07;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(noiseTile(), 'repeat');
  ctx.fillRect(0, 0, VB_W, VB_H);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.restore();

  // seams
  ctx.lineCap = 'round';
  ctx.strokeStyle = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 2;
  ctx.stroke(new Path2D('M32 308 L157 383 M968 308 L843 383 M198 1002 Q500 1024 802 1002'));
  ctx.lineWidth = 20;
  ctx.strokeStyle = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)';
  ctx.stroke(new Path2D(COLLAR));
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.18)';
  ctx.stroke(body);
  ctx.restore();
}
