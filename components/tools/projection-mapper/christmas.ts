import type { Effect, EffectMemory } from './effects';
import { clear, rgba } from './kit';

/**
 * Christmas effects. Everything here is a pure function of `t` plus fixed random seeds,
 * so the speed slider works without jumps and a resized surface keeps its layout.
 * Glows are stamped from cached sprites: canvas shadowBlur is too slow for hundreds of
 * particles on a surface that can be 1600px wide.
 */

const TAU = Math.PI * 2;
const wrap = (v: number) => v - Math.floor(v);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

type Ctx = CanvasRenderingContext2D;
type Painter = (c: OffscreenCanvasRenderingContext2D, size: number) => void;

function seeds(mem: EffectMemory, n: number) {
  const list = (mem.seeds ??= []);
  while (list.length < n) list.push(Array.from({ length: 6 }, Math.random));
  return list;
}

function sprite(mem: EffectMemory, key: string, size: number, paint: Painter) {
  const map = (mem.sprites ??= new Map());
  let sp = map.get(key);
  if (!sp) {
    // Dragging the colour picker makes a new sprite per colour, so keep the cache bounded.
    if (map.size > 32) map.clear();
    sp = new OffscreenCanvas(size, size);
    paint(sp.getContext('2d')!, size);
    map.set(key, sp);
  }
  return sp;
}

function softDot(mem: EffectMemory, color: string) {
  return sprite(mem, `dot:${color}`, 64, (c, size) => {
    const g = c.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, '#fff');
    g.addColorStop(0.3, rgba(color, 0.95));
    g.addColorStop(1, rgba(color, 0));
    c.fillStyle = g;
    c.fillRect(0, 0, size, size);
  });
}

/** Draw a sprite centred on (x, y), `d` wide. `sx` squashes it, for a coin-flip tumble. */
function stamp(ctx: Ctx, sp: OffscreenCanvas, x: number, y: number, d: number, alpha = 1, rot = 0, sx = 1) {
  ctx.globalAlpha = alpha;
  if (!rot && sx === 1) {
    ctx.drawImage(sp, x - d / 2, y - d / 2, d, d);
  } else {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(sx, 1);
    ctx.drawImage(sp, -d / 2, -d / 2, d, d);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

// ---------- Snowflakes ----------

/** Branches as [position along the arm, length]; `ring` is an optional inner hexagon. */
const CRYSTALS = [
  { branches: [[0.38, 0.3], [0.62, 0.24], [0.82, 0.14]], ring: 0 },
  { branches: [[0.72, 0.22]], ring: 0.42 },
  { branches: [[0.3, 0.16], [0.5, 0.22], [0.7, 0.16], [0.88, 0.09]], ring: 0.18 },
  { branches: [[0.55, 0.36]], ring: 0.3 },
];

function crystal(mem: EffectMemory, kind: number, color: string) {
  return sprite(mem, `flake:${kind}:${color}`, 256, (c, size) => {
    const { branches, ring } = CRYSTALS[kind];
    const r = size * 0.42;
    c.translate(size / 2, size / 2);
    c.lineCap = c.lineJoin = 'round';
    const trace = () => {
      c.beginPath();
      for (let a = 0; a < 6; a++) {
        const rot = (a * TAU) / 6;
        const at = (x: number, y: number): [number, number] =>
          [x * Math.cos(rot) - y * Math.sin(rot), x * Math.sin(rot) + y * Math.cos(rot)];
        c.moveTo(0, 0);
        c.lineTo(...at(0, -r));
        for (const [p, l] of branches) {
          for (const side of [-1, 1]) {
            c.moveTo(...at(0, -p * r));
            c.lineTo(...at(side * l * r * 0.866, -(p + l * 0.5) * r));
          }
        }
        if (ring) {
          const next = rot + TAU / 6;
          c.moveTo(Math.sin(rot) * ring * r, -Math.cos(rot) * ring * r);
          c.lineTo(Math.sin(next) * ring * r, -Math.cos(next) * ring * r);
        }
      }
    };
    // A coloured halo with a white-hot core reads as light rather than as a drawing.
    c.shadowColor = color; c.shadowBlur = size * 0.07;
    c.strokeStyle = color; c.lineWidth = size * 0.034;
    trace(); c.stroke();
    c.shadowBlur = 0;
    c.strokeStyle = '#fff'; c.lineWidth = size * 0.015;
    trace(); c.stroke();
  });
}

// ---------- Stars ----------

function starPath(c: Ctx | OffscreenCanvasRenderingContext2D, x: number, y: number, r: number, points: number, inner: number) {
  c.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const a = (i * Math.PI) / points - Math.PI / 2, q = i % 2 ? r * inner : r;
    c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q);
  }
  c.closePath();
}

function starSprite(mem: EffectMemory, points: number, inner: number, color: string) {
  return sprite(mem, `star:${points}:${color}`, 128, (c, size) => {
    c.shadowColor = color; c.shadowBlur = size * 0.12;
    c.fillStyle = color;
    starPath(c, size / 2, size / 2, size * 0.36, points, inner);
    c.fill();
    c.shadowBlur = 0;
    c.fillStyle = 'rgba(255,255,255,0.45)';
    starPath(c, size / 2, size / 2, size * 0.18, points, inner);
    c.fill();
  });
}

// ---------- Reindeer ----------

const FUR = '#c58a4e', FUR_DARK = '#94622f', FUR_LIGHT = '#f0d7ae', ANTLER = '#f2deb8', HOOF = '#4a3324';

/** Side-on reindeer facing right before `dir`. (x, y) is the ground under its middle; S is about its body height. */
function drawDeer(ctx: Ctx, mem: EffectMemory, x: number, y: number, S: number, phase: number, dir: number, pitch: number, nose: string | null) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(S * dir, S);
  ctx.rotate(pitch);
  ctx.lineCap = ctx.lineJoin = 'round';

  const leg = (hx: number, hy: number, ph: number, color: string) => {
    const a = 0.75 * Math.sin(ph);
    const kx = hx + Math.sin(a) * 0.24, ky = hy + Math.cos(a) * 0.24;
    const b = a - 0.2 - 1.1 * Math.max(0, Math.cos(ph));
    const fx = kx + Math.sin(b) * 0.24, fy = ky + Math.cos(b) * 0.24;
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.085;
    ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(kx, ky); ctx.stroke();
    ctx.lineWidth = 0.055;
    ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
    ctx.fillStyle = HOOF;
    ctx.beginPath(); ctx.arc(fx, fy, 0.04, 0, TAU); ctx.fill();
  };

  // Far legs behind the body, near legs in front of it.
  leg(-0.24, -0.56, phase + 0.5, FUR_DARK);
  leg(0.3, -0.54, phase + 2.9, FUR_DARK);

  // Tail
  ctx.fillStyle = FUR_LIGHT;
  ctx.beginPath();
  ctx.ellipse(-0.42, -0.74 + Math.sin(phase * 2) * 0.015, 0.07, 0.045, -0.5, 0, TAU);
  ctx.fill();

  // Body and neck
  ctx.fillStyle = FUR;
  ctx.beginPath();
  ctx.moveTo(-0.36, -0.72);
  ctx.bezierCurveTo(-0.2, -0.84, 0.16, -0.8, 0.3, -0.76);
  ctx.bezierCurveTo(0.42, -0.72, 0.42, -0.54, 0.3, -0.48);
  ctx.bezierCurveTo(0.1, -0.42, -0.2, -0.42, -0.32, -0.5);
  ctx.bezierCurveTo(-0.44, -0.56, -0.44, -0.66, -0.36, -0.72);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0.14, -0.78);
  ctx.quadraticCurveTo(0.3, -0.95, 0.42, -1.08);
  ctx.lineTo(0.56, -0.98);
  ctx.quadraticCurveTo(0.47, -0.78, 0.38, -0.54);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = FUR_LIGHT;
  ctx.beginPath(); ctx.ellipse(-0.02, -0.5, 0.25, 0.055, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0.39, -0.68, 0.05, 0.13, -0.3, 0, TAU); ctx.fill();

  // Collar and bell
  ctx.strokeStyle = '#d8222a'; ctx.lineWidth = 0.05;
  ctx.beginPath(); ctx.moveTo(0.27, -0.88); ctx.quadraticCurveTo(0.38, -0.74, 0.5, -0.8); ctx.stroke();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(0.4, -0.73, 0.04, 0, TAU); ctx.fill();

  leg(-0.3, -0.54, phase, FUR);
  leg(0.24, -0.52, phase + 2.4, FUR);

  // Head nods with the stride.
  ctx.translate(0.5, -1.04);
  ctx.rotate(Math.sin(phase) * 0.08);
  ctx.strokeStyle = ANTLER;
  ctx.lineWidth = 0.03;
  for (const off of [0.06, 0]) {
    ctx.beginPath();
    ctx.moveTo(off - 0.03, -0.07);
    ctx.quadraticCurveTo(off - 0.1, -0.25, off - 0.25, -0.35);
    ctx.moveTo(off - 0.08, -0.2);
    ctx.lineTo(off, -0.31);
    ctx.moveTo(off - 0.15, -0.28);
    ctx.lineTo(off - 0.1, -0.42);
    ctx.stroke();
  }
  ctx.fillStyle = FUR;
  ctx.beginPath();
  ctx.moveTo(-0.1, -0.07);
  ctx.quadraticCurveTo(0.06, -0.1, 0.24, -0.01);
  ctx.quadraticCurveTo(0.29, 0.03, 0.24, 0.07);
  ctx.quadraticCurveTo(0.06, 0.09, -0.08, 0.08);
  ctx.quadraticCurveTo(-0.14, 0, -0.1, -0.07);
  ctx.fill();
  ctx.fillStyle = FUR_DARK;
  ctx.beginPath(); ctx.ellipse(-0.13, -0.07, 0.09, 0.035, 0.5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#17110c';
  ctx.beginPath(); ctx.arc(0.05, -0.02, 0.021, 0, TAU); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(0.057, -0.027, 0.007, 0, TAU); ctx.fill();
  if (nose) stamp(ctx, softDot(mem, nose), 0.27, 0.02, 0.3 + Math.sin(phase * 0.5) * 0.05);
  ctx.fillStyle = nose ?? '#4a2c1a';
  ctx.beginPath(); ctx.arc(0.27, 0.02, 0.04, 0, TAU); ctx.fill();
  ctx.restore();
}

// ---------- Santa ----------

/** Santa facing the viewer, feet at the origin, one unit tall to the brim of the hat. */
function drawSanta(ctx: Ctx, t: number, laugh: number) {
  const RED = '#d8222a', RED_DARK = '#a91420', FUR_WHITE = '#fff6ec', SHADE = '#e6dcd2', BOOT = '#3b3942';
  const jiggle = Math.sin(t * 14) * 0.01 * laugh;
  const wave = Math.sin(t * 6);
  ctx.lineCap = ctx.lineJoin = 'round';

  // Boots and trousers
  for (const side of [-1, 1]) {
    ctx.fillStyle = RED_DARK;
    ctx.fillRect(side * 0.13 - 0.08, -0.14, 0.16, 0.08);
    ctx.fillStyle = BOOT;
    ctx.beginPath();
    ctx.ellipse(side * 0.15, -0.035, 0.12, 0.05, 0, 0, TAU);
    ctx.fill();
    ctx.fillRect(side * 0.13 - 0.08, -0.08, 0.16, 0.05);
  }

  // Coat: a belly that shakes when he laughs.
  const bodyPath = () => {
    const b = 0.38 + jiggle;
    ctx.beginPath();
    ctx.moveTo(-0.17, -0.64);
    ctx.bezierCurveTo(-0.34, -0.56, -b - 0.02, -0.34, -b + 0.02, -0.22);
    ctx.quadraticCurveTo(-b + 0.03, -0.12, -0.28, -0.12);
    ctx.lineTo(0.28, -0.12);
    ctx.quadraticCurveTo(b - 0.03, -0.12, b - 0.02, -0.22);
    ctx.bezierCurveTo(b + 0.02, -0.34, 0.34, -0.56, 0.17, -0.64);
    ctx.closePath();
  };
  ctx.fillStyle = RED;
  bodyPath();
  ctx.fill();
  ctx.save();
  bodyPath();
  ctx.clip();
  ctx.fillStyle = FUR_WHITE;
  ctx.fillRect(-0.045, -0.66, 0.09, 0.56);
  ctx.fillStyle = '#2b2119';
  ctx.fillRect(-0.45, -0.34 + jiggle, 0.9, 0.075);
  ctx.restore();
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 0.016;
  ctx.strokeRect(-0.065, -0.352 + jiggle, 0.13, 0.1);

  // Fur hem
  ctx.fillStyle = FUR_WHITE;
  ctx.beginPath();
  ctx.roundRect(-0.35, -0.16, 0.7, 0.07, 0.035);
  ctx.fill();

  const arm = (pts: [number, number][], mitten: [number, number]) => {
    ctx.strokeStyle = RED;
    ctx.lineWidth = 0.125;
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.stroke();
    ctx.fillStyle = FUR_WHITE;
    const end = pts[pts.length - 1];
    ctx.beginPath(); ctx.arc(end[0], end[1], 0.066, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2f9b4f';
    ctx.beginPath(); ctx.arc(mitten[0], mitten[1], 0.066, 0, TAU); ctx.fill();
  };

  // Hand on the belly
  arm([[-0.25, -0.56], [-0.39, -0.42], [-0.25 + jiggle, -0.34]], [-0.19 + jiggle, -0.3]);

  // Waving arm: angles from straight down, hand swinging at the elbow.
  const shoulder: [number, number] = [0.25, -0.56];
  const ua = 2.15 + wave * 0.08, fa = 2.75 + wave * 0.42;
  const elbow: [number, number] = [shoulder[0] + Math.sin(ua) * 0.17, shoulder[1] + Math.cos(ua) * 0.17];
  const wrist: [number, number] = [elbow[0] + Math.sin(fa) * 0.15, elbow[1] + Math.cos(fa) * 0.15];
  arm([shoulder, elbow, wrist], [wrist[0] + Math.sin(fa) * 0.08, wrist[1] + Math.cos(fa) * 0.08]);

  // Head tilts back a touch on each laugh.
  ctx.save();
  ctx.translate(0, -0.72 + jiggle);
  ctx.rotate(Math.sin(t * 1.3) * 0.03);

  // Hat, with a pompom that swings
  const sway = Math.sin(t * 2.2) * 0.03;
  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.moveTo(-0.15, -0.09);
  ctx.quadraticCurveTo(-0.06, -0.31, 0.15, -0.27);
  ctx.quadraticCurveTo(0.25 + sway, -0.23, 0.27 + sway, -0.1);
  ctx.lineTo(0.22 + sway, -0.1);
  ctx.quadraticCurveTo(0.18, -0.17, 0.14, -0.09);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = FUR_WHITE;
  ctx.beginPath(); ctx.arc(0.25 + sway, -0.08, 0.05, 0, TAU); ctx.fill();

  // Face
  ctx.fillStyle = '#f6c7a4';
  ctx.beginPath(); ctx.arc(0, 0, 0.13, 0, TAU); ctx.fill();

  // Beard: a scalloped bib of circles
  ctx.fillStyle = FUR_WHITE;
  for (const [x, y, r] of [
    [-0.14, 0.02, 0.05], [0.14, 0.02, 0.05], [-0.15, 0.09, 0.06], [0.15, 0.09, 0.06],
    [-0.11, 0.15, 0.07], [0.11, 0.15, 0.07], [-0.05, 0.2, 0.07], [0.05, 0.2, 0.07],
    [0, 0.15, 0.1], [-0.08, 0.1, 0.07], [0.08, 0.1, 0.07],
  ]) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }

  // Mouth opens on each HO.
  ctx.fillStyle = '#8c1d24';
  ctx.beginPath(); ctx.ellipse(0, 0.09, 0.04, 0.012 + 0.035 * laugh, 0, 0, TAU); ctx.fill();

  // Moustache
  ctx.fillStyle = SHADE;
  for (const side of [-1, 1]) { ctx.beginPath(); ctx.ellipse(side * 0.055, 0.058, 0.066, 0.03, side * 0.3, 0, TAU); ctx.fill(); }
  ctx.fillStyle = FUR_WHITE;
  for (const side of [-1, 1]) { ctx.beginPath(); ctx.ellipse(side * 0.05, 0.05, 0.062, 0.026, side * 0.3, 0, TAU); ctx.fill(); }

  // Cheeks, nose, eyes
  ctx.fillStyle = 'rgba(232,110,110,0.65)';
  for (const side of [-1, 1]) { ctx.beginPath(); ctx.arc(side * 0.08, 0.005, 0.03, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#ec9a84';
  ctx.beginPath(); ctx.arc(0, 0.015, 0.027, 0, TAU); ctx.fill();
  const blink = wrap(t / 3.4) < 0.04 ? 0.1 : 1;
  for (const side of [-1, 1]) {
    ctx.fillStyle = '#17110c';
    ctx.beginPath(); ctx.ellipse(side * 0.05, -0.04, 0.014, 0.019 * (laugh > 0.5 ? 0.35 : blink), 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = FUR_WHITE; ctx.lineWidth = 0.016;
    ctx.beginPath(); ctx.moveTo(side * 0.025, -0.07); ctx.lineTo(side * 0.08, -0.078); ctx.stroke();
  }

  // Fur band last, so it sits across the forehead.
  ctx.fillStyle = FUR_WHITE;
  ctx.beginPath(); ctx.roundRect(-0.165, -0.135, 0.33, 0.066, 0.033); ctx.fill();
  ctx.restore();
}

/** Sleigh with Santa aboard, facing right, runners on the origin. */
function drawSleigh(ctx: Ctx, x: number, y: number, S: number, dir: number, pitch: number, t: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(S * dir, S);
  ctx.rotate(pitch);
  ctx.lineCap = ctx.lineJoin = 'round';

  // Sack and presents, behind everything
  ctx.fillStyle = '#2f9b4f';
  ctx.beginPath(); ctx.ellipse(-0.42, -0.55, 0.25, 0.3, -0.1, 0, TAU); ctx.fill();
  ctx.fillStyle = '#6c7de0';
  ctx.fillRect(-0.62, -0.72, 0.17, 0.17);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(-0.555, -0.72, 0.04, 0.17);
  ctx.fillStyle = '#e5a23c';
  ctx.fillRect(-0.36, -0.82, 0.15, 0.15);
  ctx.fillStyle = '#d8222a';
  ctx.fillRect(-0.305, -0.82, 0.04, 0.15);

  // Santa in profile: coat, beard, hat, and an arm holding the reins
  ctx.fillStyle = '#d8222a';
  ctx.beginPath(); ctx.ellipse(0.05, -0.6, 0.2, 0.26, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#f6c7a4';
  ctx.beginPath(); ctx.arc(0.11, -0.9, 0.095, 0, TAU); ctx.fill();
  ctx.fillStyle = '#fff6ec';
  ctx.beginPath();
  ctx.moveTo(0.06, -0.89);
  ctx.quadraticCurveTo(0.26, -0.9, 0.22, -0.78);
  ctx.quadraticCurveTo(0.18, -0.68, 0.08, -0.72);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#17110c';
  ctx.beginPath(); ctx.arc(0.15, -0.925, 0.012, 0, TAU); ctx.fill();
  const flap = Math.sin(t * 7) * 0.03;
  ctx.fillStyle = '#d8222a';
  ctx.beginPath();
  ctx.moveTo(0.02, -0.95);
  ctx.quadraticCurveTo(0.08, -1.08, 0.2, -0.97);
  ctx.quadraticCurveTo(0.02, -1.08, -0.15, -0.98 + flap);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff6ec';
  ctx.beginPath(); ctx.arc(-0.16, -0.97 + flap, 0.04, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.roundRect(0, -0.99, 0.21, 0.045, 0.022); ctx.fill();
  ctx.strokeStyle = '#d8222a'; ctx.lineWidth = 0.09;
  ctx.beginPath(); ctx.moveTo(0.1, -0.68); ctx.lineTo(0.34, -0.56); ctx.stroke();
  ctx.fillStyle = '#2f9b4f';
  ctx.beginPath(); ctx.arc(0.37, -0.55, 0.05, 0, TAU); ctx.fill();

  // Sleigh body
  ctx.fillStyle = '#c21d27';
  ctx.beginPath();
  ctx.moveTo(-0.72, -0.5);
  ctx.quadraticCurveTo(-0.75, -0.2, -0.5, -0.2);
  ctx.lineTo(0.35, -0.2);
  ctx.quadraticCurveTo(0.68, -0.22, 0.72, -0.62);
  ctx.quadraticCurveTo(0.6, -0.45, 0.4, -0.44);
  ctx.lineTo(-0.3, -0.42);
  ctx.quadraticCurveTo(-0.5, -0.42, -0.72, -0.5);
  ctx.fill();
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 0.03;
  ctx.stroke();

  // Runners
  ctx.lineWidth = 0.04;
  ctx.beginPath();
  ctx.moveTo(-0.72, -0.03);
  ctx.lineTo(0.55, -0.03);
  ctx.quadraticCurveTo(0.82, -0.03, 0.8, -0.2);
  ctx.moveTo(-0.4, -0.2); ctx.lineTo(-0.4, -0.03);
  ctx.moveTo(0.3, -0.2); ctx.lineTo(0.3, -0.03);
  ctx.stroke();
  ctx.restore();
}

// ---------- The effects ----------

const GLOW_BULBS = ['#ff3b3b', '#ffd166', '#3dff7a', '#6fb7ff'];

export const christmasEffects: Record<string, Effect> = {
  snow(ctx, w, h, t, s, mem) {
    clear(ctx, w, h);
    const n = Math.round(clamp((w * h) / 2200, 60, 420));
    const list = seeds(mem, n), m = Math.min(w, h), dot = softDot(mem, s.color);
    // The whole field leans with the wind; closer flakes lean further.
    const gust = Math.sin(t * 0.13) * 0.5 + Math.sin(t * 0.31 + 1) * 0.25;
    for (let i = 0; i < n; i++) {
      const [a, b, c, d, e] = list[i];
      const near = a * a; // Mostly distant flakes, a few big ones up close.
      const size = Math.max(3, m * (0.008 + 0.024 * near));
      const y = wrap(b + t * (0.05 + 0.2 * near)) * (h + size * 2) - size;
      const x = wrap(c + gust * 0.06 * (0.4 + near) + Math.sin(t * (0.4 + d) + e * TAU) * 0.02) * (w + size * 2) - size;
      stamp(ctx, dot, x, y, size, 0.4 + 0.6 * near);
    }
  },

  snowflakes(ctx, w, h, t, s, mem) {
    clear(ctx, w, h);
    const n = Math.round(clamp((w * h) / 45000, 6, 26));
    const list = seeds(mem, n), m = Math.min(w, h);
    for (let i = 0; i < n; i++) {
      const [a, b, c, d, e, f] = list[i];
      const size = m * (0.14 + 0.2 * a);
      const y = wrap(b + t * (0.03 + 0.05 * (1 - a))) * (h + size * 1.2) - size * 0.6;
      const x = wrap(c + Math.sin(t * (0.25 + 0.3 * d) + e * TAU) * 0.035) * (w + size) - size * 0.5;
      const sprite = crystal(mem, Math.floor(f * CRYSTALS.length) % CRYSTALS.length, s.color);
      // Spin slowly, and tumble like a coin in the air.
      const spin = (e - 0.5) * 1.2 * t + d * TAU;
      stamp(ctx, sprite, x, y, size, 0.7 + 0.3 * a, spin, 0.72 + 0.28 * Math.cos(t * (0.5 + d) + f * TAU));
    }
  },

  stars(ctx, w, h, t, s, mem) {
    clear(ctx, w, h);
    const n = Math.round(clamp((w * h) / 5000, 30, 240));
    const list = seeds(mem, n), m = Math.min(w, h);
    const dot = softDot(mem, '#ffffff'), sparkle = starSprite(mem, 4, 0.22, '#ffffff'), star = starSprite(mem, 5, 0.46, s.color);
    for (let i = 0; i < n; i++) {
      const [a, b, c, d, e] = list[i];
      const x = a * w, y = b * h;
      const tw = 0.5 + 0.5 * Math.sin(t * (1 + 2.5 * d) + e * TAU);
      if (i % 24 === 0) {
        // The big five-pointed stars pulse and rock instead of blinking out.
        const size = m * (0.09 + 0.1 * c) * (0.88 + 0.12 * tw);
        stamp(ctx, star, x, y, size, 0.75 + 0.25 * tw, Math.sin(t * 0.8 + e * TAU) * 0.2);
      } else if (i % 4 === 0) {
        stamp(ctx, sparkle, x, y, m * (0.03 + 0.05 * c) * (0.5 + 0.5 * tw), tw * tw);
      } else {
        stamp(ctx, dot, x, y, Math.max(3, m * (0.006 + 0.012 * c)), 0.2 + 0.8 * tw * tw);
      }
    }
    // A shooting star every few seconds, placed by the cycle number.
    const period = 6, cycle = Math.floor(t / period), p = (t % period) / 0.9;
    if (p < 1) {
      const r1 = wrap(Math.sin(cycle * 12.9898) * 43758.5453), r2 = wrap(Math.sin(cycle * 78.233) * 43758.5453);
      const dir = cycle % 2 ? 1 : -1;
      const sx = w * (0.5 - dir * (0.1 + 0.35 * r1)), sy = h * (0.05 + 0.3 * r2);
      const len = Math.hypot(w, h) * 0.5;
      const hx = sx + dir * len * 0.85 * p, hy = sy + len * 0.5 * p;
      const tx = sx + dir * len * 0.85 * Math.max(0, p - 0.35), ty = sy + len * 0.5 * Math.max(0, p - 0.35);
      const g = ctx.createLinearGradient(tx, ty, hx, hy);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(1, 'rgba(255,255,255,0.95)');
      ctx.strokeStyle = g;
      ctx.lineWidth = Math.max(2, m * 0.008);
      ctx.lineCap = 'round';
      ctx.globalAlpha = Math.sin(Math.PI * p);
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke();
      stamp(ctx, dot, hx, hy, m * 0.05, Math.sin(Math.PI * p));
    }
  },

  reindeer(ctx, w, h, t, s, mem) {
    clear(ctx, w, h);
    mem.dir ??= Math.random() < 0.5 ? 1 : -1;
    const S = Math.min(h * 0.54, w * 0.3);
    const ground = h * 0.92;
    const n = Math.round(clamp(w / (S * 1.35), 1, 6));
    const span = w + S * 1.8;
    for (let i = 0; i < n; i++) {
      const u = wrap(i / n + (t * S * 1.6) / span);
      const px = -S * 0.9 + u * span;
      const phase = t * 9 + i * 1.3;
      const hop = Math.abs(Math.sin(phase * 0.5)) * S * 0.1;
      // The first in line is Rudolph; the rest get ordinary noses.
      drawDeer(ctx, mem, mem.dir > 0 ? px : w - px, ground - hop, S, phase, mem.dir, Math.cos(phase * 0.5) * 0.06, i === 0 ? s.color : null);
    }
    // Snow drawn over the hooves, so they sink into it.
    ctx.fillStyle = '#eaf4ff';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w + 12; x += 12) ctx.lineTo(x, ground - Math.sin(x * 0.012) * h * 0.012 - Math.sin(x * 0.031 + 2) * h * 0.007);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  },

  santa(ctx, w, h, t, s, _mem, fonts) {
    clear(ctx, w, h);
    const S = Math.min(h * 0.94, w * 0.9);
    // Every six seconds: three big laughs.
    const cycle = t % 6, HO_GAP = 0.55, HO_LIFE = 1.7;
    const laugh = cycle < HO_GAP * 3 ? Math.abs(Math.sin((cycle / HO_GAP) * Math.PI)) : 0;
    ctx.save();
    ctx.translate(w / 2 - S * 0.04, h - Math.abs(Math.sin(t * 2.2)) * S * 0.012);
    ctx.scale(S, S);
    drawSanta(ctx, t, laugh);
    ctx.restore();

    const size = Math.max(16, S * 0.1);
    ctx.font = `700 ${size}px ${fonts.festive}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = s.color;
    for (let i = 0; i < 3; i++) {
      const age = (cycle - i * HO_GAP) / HO_LIFE;
      if (age < 0 || age > 1) continue;
      ctx.globalAlpha = Math.sin(Math.PI * age);
      const off = i === 1 ? Math.min(S * 0.68, w / 2 - size) : -S * (0.36 + 0.06 * i);
      ctx.fillText('HO', w / 2 + off + Math.sin(age * 8) * S * 0.012, h - S * ((i === 1 ? 0.4 : 0.72) + 0.26 * age));
    }
    ctx.globalAlpha = 1;
  },

  sleigh(ctx, w, h, t, s, mem) {
    clear(ctx, w, h);
    const S = Math.min(h * 0.3, w * 0.13);
    const gap = S * 1.3, team = 4;
    const length = gap * (team + 1) + S * 2;
    const cross = (w + length + S * 2) / Math.max(w / 5.5, S * 3);
    const period = cross + 1.5;
    const pass = Math.floor(t / period), q = (t % period) / cross;
    if (q > 1) return;
    // Alternate directions, and give each pass a different swoop.
    const dir = pass % 2 ? -1 : 1;
    const swoop = pass * 2.1;
    const curve = (x: number) => h * 0.56 + S * 0.35 + h * 0.12 * Math.sin((x / w) * Math.PI * 1.5 + swoop);
    const head = -S + q * (w + length + S * 2);
    // Everyone follows the same line through the sky.
    const place = (behind: number) => {
      const x = head - behind, y = curve(x);
      return { x: dir > 0 ? x : w - x, y, pitch: Math.atan2(curve(x + 4) - y, 4) };
    };

    // Stardust trailing off the runners
    const dot = softDot(mem, s.color), back = gap * team + S * 0.9;
    for (let k = 0; k < 44; k++) {
      const b = place(back + k * S * 0.17);
      const jitter = Math.sin(k * 91.7) * S * (0.05 + k * 0.012);
      const tw = 0.55 + 0.45 * Math.sin(t * 11 + k * 2.3);
      stamp(ctx, dot, b.x, b.y + jitter - S * 0.1, S * (0.26 - k * 0.004), (1 - k / 44) * tw);
    }

    const sleigh = place(gap * team + S * 0.3);
    drawSleigh(ctx, sleigh.x, sleigh.y, S * 1.1, dir, sleigh.pitch, t);

    // Reins run nose to tail, up to Santa's hand.
    ctx.strokeStyle = 'rgba(255,209,102,0.85)';
    ctx.lineWidth = Math.max(1.5, S * 0.018);
    ctx.beginPath();
    ctx.moveTo(sleigh.x + dir * S * 0.42, sleigh.y - S * 0.6);
    for (let i = team - 1; i >= 0; i--) {
      const d = place(gap * i);
      ctx.lineTo(d.x + dir * S * 0.4, d.y - S * 0.74);
    }
    ctx.stroke();

    for (let i = team - 1; i >= 0; i--) {
      const d = place(gap * i);
      drawDeer(ctx, mem, d.x, d.y, S, t * 8 + i * 0.9, dir, d.pitch, i === 0 ? '#ff2a2a' : null);
    }
  },

  lights(ctx, w, h, t, _s, mem) {
    clear(ctx, w, h);
    const m = Math.min(w, h);
    const rows = h > w * 0.7 ? 3 : 2;
    const swags = Math.max(2, Math.round((w / h) * rows * 1.1));
    const sag = (h / rows) * 0.42;
    const perSwag = 7;
    const r = Math.max(4, m * 0.018);
    for (let row = 0; row < rows; row++) {
      const top = (h * (row + 0.08)) / rows;
      const point = (i: number) => {
        const f = i / (perSwag * swags), p = wrap(f * swags);
        return [f * w, top + sag * 4 * p * (1 - p) + Math.sin(t * 1.3 + f * 9 + row) * r * 0.25];
      };
      const total = perSwag * swags;
      ctx.strokeStyle = '#3a7a4a';
      ctx.lineWidth = Math.max(1.5, r * 0.22);
      ctx.beginPath();
      for (let i = 0; i <= total * 3; i++) {
        const [x, y] = point(i / 3);
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.stroke();
      for (let i = 0; i <= total; i++) {
        const [x, y] = point(i);
        const color = GLOW_BULBS[(i + row) % GLOW_BULBS.length];
        // A slow chase: each colour swells in turn.
        const on = 0.3 + 0.7 * Math.pow(0.5 + 0.5 * Math.sin(t * 3 - ((i + row) % 4) * (Math.PI / 2)), 2);
        stamp(ctx, softDot(mem, color), x, y + r, r * 7, on);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.55 + 0.45 * on;
        ctx.beginPath(); ctx.ellipse(x, y + r, r * 0.72, r, 0, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#3a7a4a';
        ctx.fillRect(x - r * 0.4, y - r * 0.2, r * 0.8, r * 0.5);
      }
    }
  },

  greeting(ctx, w, h, t, s, mem, fonts) {
    clear(ctx, w, h);
    const txt = s.text || 'Merry Christmas';
    // Long lines break in two on anything that isn't a wide strip.
    const words = txt.split(' ');
    const lines = words.length > 1 && w / h < 3.2
      ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')]
      : [txt];
    let size = (h * 0.8) / lines.length / 1.15;
    ctx.font = `700 ${size}px ${fonts.festive}`;
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if (widest > w * 0.88) size *= (w * 0.88) / widest;
    ctx.font = `700 ${size}px ${fonts.festive}`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = s.color;
    ctx.shadowColor = s.color; ctx.shadowBlur = size * 0.16;
    // Letter by letter, so the words can ripple.
    let index = 0;
    lines.forEach((line, row) => {
      let x = (w - ctx.measureText(line).width) / 2;
      const y = h / 2 + (row - (lines.length - 1) / 2) * size * 1.12;
      for (const ch of line) {
        ctx.fillText(ch, x, y + Math.sin(t * 2.4 - index * 0.55) * size * 0.035);
        x += ctx.measureText(ch).width;
        index++;
      }
    });
    ctx.shadowBlur = 0;
    const list = seeds(mem, 18), sparkle = starSprite(mem, 4, 0.22, '#ffffff'), m = Math.min(w, h);
    for (let i = 0; i < 18; i++) {
      const [a, b, c, d, e] = list[i];
      const tw = Math.pow(0.5 + 0.5 * Math.sin(t * (1.2 + 2 * d) + e * TAU), 3);
      stamp(ctx, sparkle, a * w, b * h, m * (0.07 + 0.09 * c) * tw, tw);
    }
  },
};
