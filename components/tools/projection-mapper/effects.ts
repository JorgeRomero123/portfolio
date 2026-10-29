import type { Surface } from './model';

/**
 * Procedural effects. Each frame starts transparent and lights only what it needs to,
 * so overlapping surfaces show through each other (the page behind is black, which
 * the projector shows as no light). `t` is seconds, already speed-scaled;
 * `mem` is per-surface scratch space that persists between frames.
 */

interface Ghost { x: number; y: number; size: number; born: number; life: number; drift: number; ph: number }
interface Eye { x: number; y: number; r: number; born: number; life: number; blink: number }
interface Drip { x: number; speed: number; width: number; off: number }
interface Walker { start: number; dur: number; dir: number; run: boolean }

export interface EffectMemory {
  ghosts?: Ghost[];
  eyes?: Eye[];
  drips?: Drip[];
  walker?: Walker | null;
  next?: number;
  flashAt?: number;
  double?: boolean;
  buf?: OffscreenCanvas;
  img?: ImageData;
}

type Effect = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, s: Surface, mem: EffectMemory, font: string) => void;

const rand = (a: number, b: number) => a + Math.random() * (b - a);

function rgba(hex: string, a: number) {
  const n = parseInt((hex || '#ffffff').slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function clear(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.clearRect(0, 0, w, h);
}

function ghostPath(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, t: number) {
  ctx.beginPath();
  ctx.moveTo(x - s * 0.5, y + s * 0.55);
  ctx.lineTo(x - s * 0.5, y);
  ctx.arc(x, y, s * 0.5, Math.PI, 0);
  ctx.lineTo(x + s * 0.5, y + s * 0.55);
  const waves = 4;
  for (let i = waves; i >= 0; i--) {
    const px = x - s * 0.5 + (s / waves) * i;
    const py = y + s * 0.55 + Math.sin(t * 6 + i * 1.7) * s * 0.07 + (i % 2 ? s * 0.08 : 0);
    ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/**
 * A human silhouette mid-stride. `gy` is the ground line, `H` the figure height,
 * `phase` the gait cycle in radians, `dir` 1 = facing right, -1 = facing left.
 */
function drawFigure(ctx: CanvasRenderingContext2D, x: number, gy: number, H: number, phase: number, dir: number, run: boolean) {
  const legAmp = run ? 0.7 : 0.45, kneeAmp = run ? 1.9 : 0.5;
  const armAmp = run ? 1.0 : 0.4, elbow = run ? 1.6 : 0.35;
  const lean = run ? 0.28 : 0.06;
  const thigh = H * 0.26, shin = H * 0.26, upperArm = H * 0.16, foreArm = H * 0.15;
  const hipY = gy - H * 0.5 - Math.abs(Math.sin(phase)) * H * (run ? 0.05 : 0.015);
  const hip: Point2 = [x, hipY];
  const shoulder: Point2 = [x + Math.sin(lean) * H * 0.3 * dir, hipY - Math.cos(lean) * H * 0.3];
  // Angles are measured from straight down; positive points forward.
  const limb = (from: Point2, angle: number, len: number): Point2 => [from[0] + Math.sin(angle) * len * dir, from[1] + Math.cos(angle) * len];

  ctx.save();
  ctx.fillStyle = ctx.strokeStyle = '#000';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = H * 0.03;
  const segment = (pts: Point2[], width: number) => {
    ctx.lineWidth = width;
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.stroke();
  };
  for (const off of [0, Math.PI]) {
    const swing = Math.sin(phase + off);
    // Legs: the knee folds while the leg swings forward.
    const a = legAmp * swing;
    const knee = limb(hip, a, thigh);
    const foot = limb(knee, a - kneeAmp * Math.max(0, Math.cos(phase + off)), shin);
    segment([hip, knee, foot], H * 0.08);
    // Arms swing opposite to the leg on the same side.
    const b = -armAmp * swing;
    const elbowPt = limb(shoulder, b, upperArm);
    segment([shoulder, elbowPt, limb(elbowPt, b + elbow, foreArm)], H * 0.065);
  }
  segment([hip, shoulder], H * 0.14);
  const head: Point2 = [shoulder[0] + Math.sin(lean) * H * 0.1 * dir, shoulder[1] - H * 0.11];
  ctx.beginPath(); ctx.arc(head[0], head[1], H * 0.068, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
type Point2 = [number, number];

/** Advance a figure that crosses the surface now and then. Returns its position, or null between crossings. */
function crossing(mem: EffectMemory, t: number, w: number, firstDelay: [number, number], pickRun: () => boolean) {
  if (!mem.walker) {
    const run = pickRun();
    mem.walker = { start: t + rand(...firstDelay), dur: run ? rand(1.3, 2.2) : rand(4, 6), dir: Math.random() < 0.5 ? 1 : -1, run };
  }
  const wk = mem.walker;
  const p = (t - wk.start) / wk.dur;
  if (p > 1) { mem.walker = null; return null; }
  if (p < 0) return null;
  const x = wk.dir > 0 ? -0.3 * w + p * 1.6 * w : 1.3 * w - p * 1.6 * w;
  return { x, dir: wk.dir, run: wk.run, phase: t * (wk.run ? 14 : 7) };
}

export const effects: Record<string, Effect> = {
  ghosts(ctx, w, h, t, s, mem) {
    clear(ctx, w, h);
    const ghosts = (mem.ghosts ??= []);
    const target = Math.max(2, Math.round((w * h) / 90000));
    while (ghosts.length < target) {
      // The first ghosts appear right away; later ones stagger in.
      ghosts.push({ x: rand(0, w), y: rand(h * 0.2, h * 0.9), size: rand(0.18, 0.35) * Math.min(w, h),
        born: t - (t < 0.1 ? rand(0, 2) : -rand(0, 2)), life: rand(4, 8), drift: rand(-0.4, 0.4), ph: rand(0, 6) });
    }
    mem.ghosts = ghosts.filter((g) => t - g.born < g.life);
    for (const g of mem.ghosts) {
      const age = (t - g.born) / g.life;
      if (age < 0) continue;
      const x = g.x + Math.sin(t * 0.8 + g.ph) * g.size * 0.4 + g.drift * age * w * 0.3;
      const y = g.y - age * h * 0.15 + Math.sin(t * 1.6 + g.ph) * g.size * 0.08;
      ctx.save();
      ctx.globalAlpha = Math.sin(Math.PI * age);
      ctx.shadowColor = s.color; ctx.shadowBlur = g.size * 0.5;
      ctx.fillStyle = 'rgba(255,248,255,0.95)';
      ghostPath(ctx, x, y, g.size, t + g.ph);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.ellipse(x - g.size * 0.16, y - g.size * 0.02, g.size * 0.06, g.size * 0.1, 0, 0, Math.PI * 2);
      ctx.ellipse(x + g.size * 0.16, y - g.size * 0.02, g.size * 0.06, g.size * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x, y + g.size * 0.2, g.size * 0.06, g.size * 0.09 * (0.6 + 0.4 * Math.sin(t * 3 + g.ph)), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  },

  windows(ctx, w, h, t, s, mem) {
    // Warm flickering room light, with a silhouette walking past now and then.
    const flick = 0.75 + 0.12 * Math.sin(t * 13) + 0.08 * Math.sin(t * 29 + 1) + (Math.random() < 0.02 ? -0.4 : 0);
    const g = ctx.createRadialGradient(w / 2, h * 0.6, 0, w / 2, h * 0.6, Math.max(w, h) * 0.8);
    g.addColorStop(0, rgba(s.color, Math.max(0, flick)));
    g.addColorStop(1, rgba(s.color, Math.max(0, flick * 0.35)));
    clear(ctx, w, h);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    // Seen through a window: the figure's legs are below the sill.
    const f = crossing(mem, t, w, [2, 5], () => false);
    if (f) drawFigure(ctx, f.x, h * 1.25, h * 1.1, f.phase, f.dir, f.run);
  },

  shadow(ctx, w, h, t, s, mem) {
    // A softly lit wall that someone keeps running (or creeping) past.
    clear(ctx, w, h);
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.75);
    g.addColorStop(0, rgba(s.color, 0.75));
    g.addColorStop(1, rgba(s.color, 0.3));
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const f = crossing(mem, t, w, [0.5, 3], () => Math.random() < 0.7);
    if (f) drawFigure(ctx, f.x, h * 0.97, h * 0.8, f.phase, f.dir, f.run);
  },

  lightning(ctx, w, h, t, s, mem) {
    mem.next ??= t + rand(1, 4);
    if (t >= mem.next) { mem.flashAt = t; mem.double = Math.random() < 0.6; mem.next = t + rand(2, 7); }
    const since = t - (mem.flashAt ?? -99);
    let k = Math.exp(-since * 9);
    if (mem.double && since > 0.18) k = Math.max(k, Math.exp(-(since - 0.18) * 7));
    clear(ctx, w, h);
    // Transparent between flashes; a cold white flash fades out.
    ctx.fillStyle = `rgba(225,232,255,${k})`;
    ctx.fillRect(0, 0, w, h);
  },

  eyes(ctx, w, h, t, s, mem) {
    clear(ctx, w, h);
    const eyes = (mem.eyes ??= []);
    const target = Math.max(2, Math.round((w * h) / 60000));
    while (eyes.length < target) {
      eyes.push({ x: rand(0.1, 0.9) * w, y: rand(0.1, 0.9) * h, r: rand(0.025, 0.06) * Math.min(w, h),
        born: t + rand(0, 2), life: rand(3, 7), blink: rand(0, 3) });
    }
    mem.eyes = eyes.filter((e) => t - e.born < e.life);
    for (const e of mem.eyes) {
      const age = (t - e.born) / e.life;
      if (age < 0) continue;
      const bp = (t + e.blink) % 3.2;
      const open = bp < 0.15 ? Math.abs(bp - 0.075) / 0.075 : 1;
      const look = Math.sin(t * 0.7 + e.blink) * e.r * 0.4;
      ctx.save();
      ctx.globalAlpha = Math.min(1, Math.sin(Math.PI * age) * 3);
      for (const side of [-1, 1]) {
        const ex = e.x + side * e.r * 1.6;
        ctx.shadowColor = s.color; ctx.shadowBlur = e.r * 2;
        ctx.fillStyle = s.color;
        ctx.beginPath(); ctx.ellipse(ex, e.y, e.r, e.r * 0.7 * open + 0.5, side * 0.15, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.ellipse(ex + look, e.y, e.r * 0.22, e.r * 0.6 * open + 0.3, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  },

  outline(ctx, w, h, t, s) {
    // Neon border that pulses, with a spark chasing around the edge.
    clear(ctx, w, h);
    const lw = Math.max(4, Math.min(w, h) * 0.035);
    ctx.shadowColor = s.color; ctx.shadowBlur = lw * 3;
    ctx.strokeStyle = rgba(s.color, 0.55 + 0.45 * Math.sin(t * 2.5)); ctx.lineWidth = lw;
    ctx.strokeRect(lw / 2, lw / 2, w - lw, h - lw);
    const per = 2 * (w + h), d = ((t * 0.35) % 1) * per;
    const pt = d < w ? [d, 0] : d < w + h ? [w, d - w] : d < 2 * w + h ? [w - (d - w - h), h] : [0, h - (d - 2 * w - h)];
    ctx.fillStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.shadowBlur = lw * 4;
    ctx.beginPath(); ctx.arc(pt[0], pt[1], lw * 1.3, 0, Math.PI * 2); ctx.fill();
  },

  slime(ctx, w, h, t, s, mem) {
    clear(ctx, w, h);
    mem.drips ??= Array.from({ length: Math.max(6, Math.round(w / 40)) }, () => ({
      x: rand(0, 1), speed: rand(0.04, 0.16), width: rand(0.02, 0.05), off: rand(0, 1) }));
    const band = h * 0.08;
    ctx.fillStyle = s.color; ctx.shadowColor = s.color; ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.lineTo(w, band);
    for (let x = w; x >= 0; x -= w / 40) ctx.lineTo(x, band + Math.sin(x * 0.05 + t) * band * 0.3);
    ctx.closePath(); ctx.fill();
    for (const d of mem.drips) {
      const len = ((t * d.speed + d.off) % 1.2) * h;
      const x = d.x * w, r = d.width * w;
      ctx.fillRect(x - r / 2, 0, r, len);
      ctx.beginPath(); ctx.arc(x, len, r * 0.8, 0, Math.PI * 2); ctx.fill();
    }
  },

  static(ctx, w, h, t, s, mem) {
    // TV snow, rendered small and scaled up.
    const sw = 160, sh = Math.max(1, Math.round((160 * h) / w));
    if (!mem.buf || mem.buf.width !== sw || mem.buf.height !== sh) {
      mem.buf = new OffscreenCanvas(sw, sh);
      mem.img = new ImageData(sw, sh);
    }
    const data = mem.img!.data;
    const roll = (t * 0.3) % 1;
    for (let y = 0; y < sh; y++) {
      const bar = Math.abs(y / sh - roll) < 0.05 ? 60 : 0;
      for (let x = 0; x < sw; x++) {
        const v = Math.random() * 200 + bar, i = (y * sw + x) * 4;
        data[i] = data[i + 1] = data[i + 2] = v; data[i + 3] = 255;
      }
    }
    mem.buf.getContext('2d')!.putImageData(mem.img!, 0, 0);
    clear(ctx, w, h);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(mem.buf, 0, 0, w, h);
  },

  text(ctx, w, h, t, s, _mem, font) {
    clear(ctx, w, h);
    const txt = s.text || 'BOO';
    let size = h * 0.6;
    ctx.font = `${size}px ${font}`;
    const mw = ctx.measureText(txt).width;
    if (mw > w * 0.9) size *= (w * 0.9) / mw;
    ctx.font = `${size}px ${font}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.globalAlpha = Math.random() < 0.04 ? 0.2 : 0.85 + 0.15 * Math.sin(t * 9);
    ctx.shadowColor = s.color; ctx.shadowBlur = size * 0.25;
    ctx.fillStyle = s.color;
    ctx.fillText(txt, w / 2 + Math.sin(t * 2) * w * 0.01, h / 2);
    ctx.globalAlpha = 1;
  },

  color(ctx, w, h, t, s) {
    // Solid colour that slowly breathes, for washing a whole wall.
    clear(ctx, w, h);
    ctx.fillStyle = rgba(s.color, 0.7 + 0.3 * Math.sin(t * 1.5));
    ctx.fillRect(0, 0, w, h);
  },

  rainbow(ctx, w, h, t) {
    const g = ctx.createLinearGradient(0, 0, w, h);
    for (let i = 0; i <= 6; i++) g.addColorStop(i / 6, `hsl(${(t * 60 + i * 60) % 360},100%,55%)`);
    clear(ctx, w, h);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  },

  white(ctx, w, h) {
    clear(ctx, w, h);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
  },

  none(ctx, w, h) { clear(ctx, w, h); },
};

export const EFFECT_LIST: [string, string][] = [
  ['ghosts', 'Ghosts'], ['shadow', 'Running shadow'], ['windows', 'Window light'], ['lightning', 'Lightning'], ['eyes', 'Eyes'],
  ['outline', 'Neon outline'], ['slime', 'Slime'], ['static', 'TV static'], ['text', 'Text'],
  ['color', 'Colour'], ['rainbow', 'Rainbow'], ['white', 'White'], ['none', 'Off'], ['media', 'Image / video'],
];
