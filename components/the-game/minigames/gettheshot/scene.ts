// "Get the shot": world model + canvas-2D pseudo-3D renderer (no three.js).
// Camera looks straight ahead along +z from (dx, dy, camZ); screen y grows downwards, the ground
// is the plane y = GROUND. Everything is a flat low-poly polygon projected with f / z.

export const RINGS = 11;
export const WIN_AT = 7;
/** Frame half-size in world units (16:9-ish viewfinder). */
export const RW = 0.29;
export const RH = 0.16;
/** Fraction of the frame the crosshair must be inside when the frame passes. */
export const TOL = 0.72;
export const SPACING = 5.8;
export const FIRST = 7.5;
/** Rings are judged when they get this close. */
export const PASS_Z = 0.35;
const GROUND = 2.4;
const FAR = 44;
const PROP_SPAN = 44;
const DX_MAX = 2;
const DY_MAX = 1.3;

export type RingState = 'ahead' | 'shot' | 'miss';
export interface Ring {
  x: number;
  y: number;
  z: number;
  state: RingState;
}
interface Prop {
  kind: 'tree' | 'pine' | 'house';
  x: number;
  z: number;
  s: number;
  tone: number;
}
export interface World {
  dx: number;
  dy: number;
  vx: number;
  vy: number;
  camZ: number;
  t: number;
  roll: number;
  windX: number;
  windY: number;
  wp: [number, number, number];
  rings: Ring[];
  props: Prop[];
  hills: [number, number][][];
  fieldSeed: number;
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function makeWorld(): World {
  const rings: Ring[] = [];
  let px = 0;
  let py = 0;
  for (let i = 0; i < RINGS; i++) {
    const k = i < 2 ? 0.55 : 1;
    let ddx = rnd(-1.1, 1.1) * k;
    if (Math.abs(ddx) < 0.35) ddx = ddx < 0 ? -0.35 : 0.35;
    px = clamp(px + ddx, -1.5, 1.5);
    py = clamp(py + rnd(-0.7, 0.7) * k, -0.85, 0.75);
    rings.push({ x: px, y: py, z: FIRST + i * SPACING, state: 'ahead' });
  }
  const props: Prop[] = [];
  for (let i = 0; i < 26; i++) props.push(newProp(rnd(2, FAR + 2)));
  const hills = [0, 1].map((layer) => {
    const pts: [number, number][] = [];
    const n = layer ? 9 : 13;
    for (let i = 0; i <= n; i++) {
      const hx = -1.3 + (2.6 * i) / n + rnd(-0.06, 0.06);
      const peak = i % 2 === 1;
      pts.push([hx, peak ? rnd(layer ? 0.05 : 0.07, layer ? 0.11 : 0.15) : rnd(0.01, 0.04)]);
    }
    return pts;
  });
  return {
    dx: 0,
    dy: 0,
    vx: 0,
    vy: 0,
    camZ: 0,
    t: 0,
    roll: 0,
    windX: 0,
    windY: 0,
    wp: [rnd(0, 6), rnd(0, 6), rnd(0, 6)],
    rings,
    props,
    hills,
    fieldSeed: Math.floor(rnd(0, 3)),
  };
}

function newProp(z: number): Prop {
  const r = Math.random();
  const side = Math.random() < 0.5 ? -1 : 1;
  return {
    kind: r < 0.22 ? 'house' : r < 0.6 ? 'pine' : 'tree',
    x: side * rnd(0.8, 11),
    z,
    s: rnd(0.8, 1.25),
    tone: Math.random(),
  };
}

export interface Input {
  x: number;
  y: number;
}

/** Floaty drone physics + gentle wind. Returns nothing; mutates the world. */
export function step(w: World, dt: number, input: Input, speed: number, flying: boolean, bank: boolean) {
  w.t += dt;
  const [p1, p2, p3] = w.wp;
  const ramp = flying ? clamp(w.camZ / 6, 0, 1) : 0; // wind builds up after take-off
  w.windX = ramp * (0.55 * Math.sin(0.43 * w.t + p1) + 0.3 * Math.sin(1.13 * w.t + p2));
  w.windY = ramp * 0.25 * Math.sin(0.61 * w.t + p3);
  const ACC = 4.3;
  const DAMP = 3.8;
  const ax = input.x * ACC + w.windX;
  const ay = input.y * ACC + w.windY;
  const damp = Math.exp(-DAMP * dt);
  w.vx = (w.vx + ax * dt) * damp;
  w.vy = (w.vy + ay * dt) * damp;
  w.dx += w.vx * dt;
  w.dy += w.vy * dt;
  if (Math.abs(w.dx) > DX_MAX) {
    w.dx = Math.sign(w.dx) * DX_MAX;
    w.vx = 0;
  }
  if (Math.abs(w.dy) > DY_MAX) {
    w.dy = Math.sign(w.dy) * DY_MAX;
    w.vy = 0;
  }
  if (flying) w.camZ += speed * dt;
  const target = bank ? clamp(-w.vx * 0.07, -0.09, 0.09) : 0;
  w.roll += (target - w.roll) * Math.min(1, dt * 5);
  for (const p of w.props) {
    if (p.z - w.camZ < 0.5) Object.assign(p, newProp(p.z + PROP_SPAN));
  }
}

/** Offset of a ring's centre from the crosshair, in "fraction of the pass box" units (≤1 = inside). */
export function ringError(w: World, r: Ring) {
  const ex = (r.x - w.dx) / (RW * TOL);
  const ey = (r.y - w.dy) / (RH * TOL);
  return { ex, ey, d: Math.max(Math.abs(ex), Math.abs(ey)) };
}

export function nextRing(w: World) {
  return w.rings.find((r) => r.state === 'ahead');
}

// ---------------------------------------------------------------- drawing

const C = {
  skyTop: '#dff4f8',
  skyLow: '#f8fdfe',
  groundNear: '#d5e9d6',
  groundFar: '#ebf5ea',
  field: 'rgba(120,170,120,0.16)',
  line: 'rgba(90,130,100,',
  hillFar: '#cfe6ec',
  hillFarShade: '#bddbe3',
  hillNear: '#c3e3cf',
  hillNearShade: '#aed6bd',
  ring: '#0891b2',
  ringOn: '#059669',
  ringLater: '#64748b',
};

export interface DrawOpts {
  w: number;
  h: number;
  f: number;
  shakeX: number;
  shakeY: number;
  aligned: boolean;
  takeLabel: (n: number) => string;
  font: string;
}

export function drawScene(ctx: CanvasRenderingContext2D, wd: World, o: DrawOpts) {
  const { w, h, f } = o;
  const D = Math.hypot(w, h);
  ctx.save();
  ctx.translate(w / 2 + o.shakeX, h / 2 + o.shakeY);
  ctx.rotate(wd.roll);

  // Sky + ground
  const sky = ctx.createLinearGradient(0, -h / 2, 0, 0);
  sky.addColorStop(0, C.skyTop);
  sky.addColorStop(1, C.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(-D, -D, 2 * D, D + 1);

  // Hills (two low-poly layers with a small parallax)
  wd.hills.forEach((pts, layer) => {
    const shift = -wd.dx * (layer ? 16 : 7);
    const base = 1 - wd.dy * (layer ? 1.5 : 0.6);
    const X = (hx: number) => hx * D * 0.6 + shift;
    const Y = (hy: number) => -hy * h + base;
    ctx.fillStyle = layer ? C.hillNear : C.hillFar;
    ctx.beginPath();
    ctx.moveTo(X(pts[0][0]) - D, base + 2);
    for (const [hx, hy] of pts) ctx.lineTo(X(hx), Y(hy));
    ctx.lineTo(X(pts[pts.length - 1][0]) + D, base + 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = layer ? C.hillNearShade : C.hillFarShade;
    for (let i = 1; i < pts.length - 1; i += 2) {
      const [ax, ay] = pts[i];
      const [bx, by] = pts[i + 1];
      ctx.beginPath();
      ctx.moveTo(X(ax), Y(ay));
      ctx.lineTo(X(bx), Y(by));
      ctx.lineTo(X(ax) + (X(bx) - X(ax)) * 0.35, base + 2);
      ctx.closePath();
      ctx.fill();
    }
  });

  const gy = GROUND - wd.dy;
  const ground = ctx.createLinearGradient(0, 0, 0, h / 2);
  ground.addColorStop(0, C.groundFar);
  ground.addColorStop(1, C.groundNear);
  ctx.fillStyle = ground;
  ctx.fillRect(-D, 0, 2 * D, D);

  const P = (x: number, y: number, z: number): [number, number] => [((x - wd.dx) * f) / z, ((y - wd.dy) * f) / z];

  // Farmland: a grid of fields that scrolls towards the viewer
  const cell = 3;
  const off = wd.camZ % cell;
  const k0 = Math.floor(wd.camZ / cell);
  ctx.fillStyle = C.field;
  for (let j = 0; j < 15; j++) {
    const z0 = Math.max(0.6, j * cell - off);
    const z1 = (j + 1) * cell - off;
    if (z1 <= 0.6) continue;
    for (let i = -6; i < 6; i++) {
      if ((((i + j + k0 + wd.fieldSeed) % 3) + 3) % 3 !== 0) continue;
      const x0 = i * cell;
      const x1 = x0 + cell;
      const a = P(x0, GROUND, z0);
      const b = P(x1, GROUND, z0);
      const c = P(x1, GROUND, z1);
      const d = P(x0, GROUND, z1);
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.lineTo(c[0], c[1]);
      ctx.lineTo(d[0], d[1]);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.lineWidth = 1;
  for (let j = 1; j < 15; j++) {
    const z = j * cell - off;
    if (z < 0.6) continue;
    const y = (gy * f) / z;
    ctx.strokeStyle = `${C.line}${(0.22 * Math.min(1, 6 / z)).toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(-D, y);
    ctx.lineTo(D, y);
    ctx.stroke();
  }
  ctx.strokeStyle = `${C.line}0.14)`;
  for (let i = -6; i <= 6; i++) {
    const a = P(i * cell, GROUND, 0.6);
    const b = P(i * cell, GROUND, 60);
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  }
  // Haze at the horizon
  const haze = ctx.createLinearGradient(0, -h * 0.04, 0, h * 0.08);
  haze.addColorStop(0, 'rgba(248,253,254,0)');
  haze.addColorStop(0.4, 'rgba(248,253,254,0.85)');
  haze.addColorStop(1, 'rgba(248,253,254,0)');
  ctx.fillStyle = haze;
  ctx.fillRect(-D, -h * 0.04, 2 * D, h * 0.12);

  // Shadow of the next frame on the ground
  const nr = nextRing(wd);
  if (nr) {
    const z = nr.z - wd.camZ;
    if (z > PASS_Z && z < 20) {
      const [sx, sy] = P(nr.x, GROUND, z);
      ctx.fillStyle = `rgba(15,60,70,${(0.12 * Math.min(1, (20 - z) / 6)).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(sx, sy, (RW * f) / z, (0.12 * f) / z, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Props and rings, far to near
  type Item = { z: number; draw: () => void };
  const items: Item[] = [];
  for (const p of wd.props) {
    const z = p.z - wd.camZ;
    if (z > 0.5 && z < FAR) items.push({ z, draw: () => drawProp(ctx, p, z, P, f) });
  }
  wd.rings.forEach((r, i) => {
    const z = r.z - wd.camZ;
    if (r.state === 'ahead' && z > PASS_Z && z < 20) {
      items.push({ z, draw: () => drawRing(ctx, r, i, z, P, f, r === nr, o) });
    }
  });
  items.sort((a, b) => b.z - a.z);
  for (const it of items) it.draw();

  ctx.restore();
}

type Proj = (x: number, y: number, z: number) => [number, number];

function fade(ctx: CanvasRenderingContext2D, z: number) {
  ctx.globalAlpha = clamp((FAR - z) / 12, 0, 1);
}

function poly(ctx: CanvasRenderingContext2D, pts: [number, number][], fill: string) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fill();
}

function drawProp(ctx: CanvasRenderingContext2D, p: Prop, z: number, P: Proj, f: number) {
  fade(ctx, z);
  const s = p.s;
  if (p.kind === 'house') {
    const x0 = p.x - 0.5 * s;
    const x1 = p.x + 0.5 * s;
    const top = GROUND - 0.55 * s;
    const ridge = GROUND - 0.95 * s;
    const z0 = z;
    const z1 = z + 0.9 * s;
    const walls = p.tone < 0.5 ? ['#f8fafc', '#e2e8f0'] : ['#fef3c7', '#fde2a7'];
    const roof = p.tone < 0.5 ? ['#e0876a', '#c96f55'] : ['#94a3b8', '#7b8a9e'];
    // Side wall facing the camera
    const sideX = p.x > 0 ? x0 : x1;
    poly(ctx, [P(sideX, GROUND, z0), P(sideX, GROUND, z1), P(sideX, top, z1), P(sideX, top, z0)], walls[1]);
    // Far roof slope, then the near one
    const farX = p.x > 0 ? x1 : x0;
    const nearX = p.x > 0 ? x0 : x1;
    poly(ctx, [P(farX, top, z0), P(p.x, ridge, z0), P(p.x, ridge, z1), P(farX, top, z1)], roof[1]);
    poly(ctx, [P(nearX, top, z0), P(p.x, ridge, z0), P(p.x, ridge, z1), P(nearX, top, z1)], roof[0]);
    // Front wall + gable
    poly(ctx, [P(x0, GROUND, z0), P(x1, GROUND, z0), P(x1, top, z0), P(p.x, ridge, z0), P(x0, top, z0)], walls[0]);
    const [dx0, dy0] = P(p.x - 0.1 * s, GROUND, z0);
    const [dx1, dy1] = P(p.x + 0.1 * s, GROUND - 0.3 * s, z0);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(dx0, dy1, dx1 - dx0, dy0 - dy1);
  } else {
    const [bx, by] = P(p.x, GROUND, z);
    const u = (f / z) * s;
    const green = p.tone < 0.5 ? ['#8fd1a8', '#6dbb8e'] : ['#a3d9a5', '#7cc488'];
    ctx.fillStyle = '#9b7b5c';
    ctx.fillRect(bx - 0.04 * u, by - 0.28 * u, 0.08 * u, 0.28 * u);
    if (p.kind === 'pine') {
      const pine = ['#6fb996', '#4f9c7a'];
      for (let k = 0; k < 2; k++) {
        const b = by - (0.2 + k * 0.32) * u;
        const t = b - 0.62 * u;
        const hw = (0.36 - k * 0.1) * u;
        poly(ctx, [[bx - hw, b], [bx, t], [bx, b]], pine[0]);
        poly(ctx, [[bx, b], [bx, t], [bx + hw, b]], pine[1]);
      }
    } else {
      const cy = by - 0.62 * u;
      const r = 0.36 * u;
      const hex: [number, number][] = [];
      for (let k = 0; k < 6; k++) {
        const a = -Math.PI / 2 + (k * Math.PI) / 3;
        hex.push([bx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      }
      poly(ctx, hex, green[0]);
      poly(ctx, [hex[0], hex[1], hex[2], hex[3], [bx, cy]], green[1]);
    }
  }
  ctx.globalAlpha = 1;
}

function drawRing(
  ctx: CanvasRenderingContext2D,
  r: Ring,
  index: number,
  z: number,
  P: Proj,
  f: number,
  isNext: boolean,
  o: DrawOpts,
) {
  const [cx, cy] = P(r.x, r.y, z);
  const hw = (RW * f) / z;
  const hh = (RH * f) / z;
  const scale = f / z;
  const color = isNext ? (o.aligned ? C.ringOn : C.ring) : C.ringLater;
  const appear = clamp((20 - z) / 5, 0, 1);
  ctx.globalAlpha = (isNext ? 1 : 0.45) * appear;

  // Faint glass + dashed frame
  ctx.fillStyle = isNext && o.aligned ? 'rgba(16,185,129,0.10)' : 'rgba(6,182,212,0.06)';
  ctx.fillRect(cx - hw, cy - hh, hw * 2, hh * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = clamp(0.012 * scale, 1, 3);
  ctx.setLineDash([clamp(0.04 * scale, 3, 18), clamp(0.04 * scale, 3, 18)]);
  ctx.strokeRect(cx - hw, cy - hh, hw * 2, hh * 2);
  ctx.setLineDash([]);

  // Corner brackets
  const L = hw * 0.3;
  ctx.lineWidth = clamp(0.045 * scale, 2, 14);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [sx, sy] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ]) {
    const x = cx + sx * hw;
    const y = cy + sy * hh;
    ctx.beginPath();
    ctx.moveTo(x, y - sy * L);
    ctx.lineTo(x, y);
    ctx.lineTo(x - sx * L, y);
    ctx.stroke();
  }
  // Centre mark
  const m = clamp(0.07 * scale, 4, 26);
  ctx.lineWidth = clamp(0.015 * scale, 1.5, 4);
  ctx.beginPath();
  ctx.moveTo(cx - m, cy);
  ctx.lineTo(cx + m, cy);
  ctx.moveTo(cx, cy - m);
  ctx.lineTo(cx, cy + m);
  ctx.stroke();

  if (isNext && hw > 30) {
    const fs = clamp(0.1 * scale, 10, 15);
    ctx.font = `700 ${fs}px ${o.font}`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'bottom';
    ctx.fillText(o.takeLabel(index + 1), cx - hw, cy - hh - fs * 0.35);
  }
  ctx.globalAlpha = 1;
}

/** Crosshair + viewfinder guides; drawn after the thumbnail snapshot so takes stay clean. */
export function drawHud(ctx: CanvasRenderingContext2D, w: number, h: number, aligned: boolean) {
  const cx = w / 2;
  const cy = h / 2;
  ctx.strokeStyle = 'rgba(15,23,42,0.35)';
  ctx.lineWidth = 2;
  const g = 14;
  const L = Math.min(w, h) * 0.07;
  for (const [x, y, sx, sy] of [
    [g, g, 1, 1],
    [w - g, g, -1, 1],
    [w - g, h - g, -1, -1],
    [g, h - g, 1, -1],
  ]) {
    ctx.beginPath();
    ctx.moveTo(x, y + sy * L);
    ctx.lineTo(x, y);
    ctx.lineTo(x + sx * L, y);
    ctx.stroke();
  }
  // Crosshair
  ctx.strokeStyle = aligned ? '#059669' : '#0f172a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 9, 0, Math.PI * 2);
  for (const [a, b] of [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ]) {
    ctx.moveTo(cx + a * 14, cy + b * 14);
    ctx.lineTo(cx + a * 22, cy + b * 22);
  }
  ctx.stroke();
  ctx.fillStyle = aligned ? '#059669' : '#0f172a';
  ctx.beginPath();
  ctx.arc(cx, cy, 2, 0, Math.PI * 2);
  ctx.fill();
}
