// Board layout for /the-game: the looping tile path, which tile is each section's landmark,
// where each section's landmark model and terrain patch sit, and the terrain height field.
//
// Pure math (no three.js) so the shell, the HUD and other tasks can import it cheaply.
// World units: the board interior spans x ∈ [-BOARD.halfW, BOARD.halfW], z ∈ [-BOARD.halfD, BOARD.halfD],
// y is up, water level is y = 0. +z points towards the default camera.
//
// Landmark models (board/landmarks/*) are placed at SECTION_LAYOUT[id].landmark: a flat pad
// beside the landmark tile, on the inside of the loop. Rotate by `rotY` so the model's +z faces the path.
import { SECTION_IDS, type SectionId } from '../types';
import { fbm, lerp, smooth } from './noise';

export const BOARD = {
  halfW: 6.2,
  halfD: 4.2,
  /** Diorama frame wall thickness, top and bottom (y). */
  wallThickness: 0.38,
  wallTop: 0.1,
  wallBottom: -0.72,
} as const;

export const TILES_PER_SECTION = 4;
/** Which of a section's 4 tiles is its landmark tile (0-based). */
export const LANDMARK_SLOT = 2;
export const SECTION_COUNT = SECTION_IDS.length;
export const TILE_COUNT = SECTION_COUNT * TILES_PER_SECTION;
export const START_TILE = 0;
/** Slab thickness; a tile's `y` is its top surface (slabs stand a little proud of the ground). */
export const TILE_THICKNESS = 0.1;
/** Distance from the landmark tile to the landmark pad centre (towards the inside of the loop). */
export const LANDMARK_PAD_OFFSET = 0.8;
/** Radius of the flat pad under each landmark model. Keep landmark models within ~0.5. */
export const LANDMARK_PAD_RADIUS = 0.5;

/** Per-section terrain character: hilliness, tree density, share of pines, rock density. */
export const SECTION_TERRAIN: Record<SectionId, { hill: number; trees: number; pine: number; rocks: number }> = {
  software: { hill: 0.6, trees: 0.35, pine: 0.35, rocks: 0.05 },
  drone: { hill: 1.7, trees: 0.28, pine: 0.85, rocks: 0.3 },
  spurs: { hill: 0.12, trees: 0.12, pine: 0.0, rocks: 0.0 },
  pano360: { hill: 1.35, trees: 0.3, pine: 0.7, rocks: 0.2 },
  boardgames: { hill: 0.5, trees: 0.38, pine: 0.25, rocks: 0.05 },
  music: { hill: 0.85, trees: 0.3, pine: 0.45, rocks: 0.1 },
  beer: { hill: 0.4, trees: 0.16, pine: 0.1, rocks: 0.02 },
  artoverlay: { hill: 0.75, trees: 0.3, pine: 0.3, rocks: 0.1 },
  myalbumlink: { hill: 0.6, trees: 0.34, pine: 0.4, rocks: 0.08 },
  emarts: { hill: 0.5, trees: 0.4, pine: 0.15, rocks: 0.04 },
  kitchen: { hill: 0.4, trees: 0.48, pine: 0.0, rocks: 0.02 },
};

export interface TileInfo {
  index: number;
  x: number;
  /** Top surface of the slab (where the pawn stands). */
  y: number;
  z: number;
  /** Rotation around Y that points a model's +z along the direction of travel. */
  heading: number;
  /** Unit vector (x, z) pointing to the inside of the loop. */
  inward: readonly [number, number];
  section: SectionId;
  sectionIndex: number;
  isLandmark: boolean;
}

export interface SectionLayout {
  id: SectionId;
  index: number;
  tiles: readonly number[];
  landmarkTile: number;
  /** Centre of the landmark pad; `y` is the pad surface. `rotY` turns a model's +z towards the path. */
  landmark: { x: number; y: number; z: number; rotY: number };
  /** Centre of the section's themed terrain patch. */
  patch: { x: number; z: number };
}

// ------------------------------------------------------------------ path loop
const RX = 4.5;
const RZ = 2.72;
const EXP = 2.6;

function loopXZ(theta: number): [number, number] {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const wob = 1 + 0.045 * Math.sin(3 * theta + 0.7) + 0.03 * Math.sin(5 * theta + 2.1);
  return [
    RX * Math.sign(c) * Math.pow(Math.abs(c), 2 / EXP) * wob,
    RZ * Math.sign(s) * Math.pow(Math.abs(s), 2 / EXP) * wob,
  ];
}

// Start at the front-left and travel to the right along the front edge (reads left → right).
const TH0 = Math.PI / 2 + 0.42;

const pathXZ: [number, number][] = (() => {
  const N = 2400;
  const pts: [number, number][] = [];
  const acc: number[] = [0];
  for (let k = 0; k <= N; k++) {
    pts.push(loopXZ(TH0 - (k / N) * Math.PI * 2));
    if (k > 0) acc.push(acc[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
  }
  const L = acc[N];
  const out: [number, number][] = [];
  let k = 0;
  for (let i = 0; i < TILE_COUNT; i++) {
    const target = (i / TILE_COUNT) * L;
    while (acc[k + 1] < target) k++;
    const t = (target - acc[k]) / (acc[k + 1] - acc[k] || 1);
    out.push([lerp(pts[k][0], pts[k + 1][0], t), lerp(pts[k][1], pts[k + 1][1], t)]);
  }
  return out;
})();

const inwardOf = (i: number): [number, number] => {
  const [px, pz] = pathXZ[i];
  const [ax, az] = pathXZ[(i - 1 + TILE_COUNT) % TILE_COUNT];
  const [bx, bz] = pathXZ[(i + 1) % TILE_COUNT];
  const tx = bx - ax;
  const tz = bz - az;
  const l = Math.hypot(tx, tz) || 1;
  let nx = tz / l;
  let nz = -tx / l;
  if (nx * -px + nz * -pz < 0) {
    nx = -nx;
    nz = -nz;
  }
  return [nx, nz];
};

const landmarkTileIndex = (s: number) => s * TILES_PER_SECTION + LANDMARK_SLOT;

const patchXZ: [number, number][] = SECTION_IDS.map((_, s) => {
  const i = landmarkTileIndex(s);
  const [nx, nz] = inwardOf(i);
  return [pathXZ[i][0] + nx * 0.3, pathXZ[i][1] + nz * 0.3];
});

const HILL = SECTION_IDS.map((id) => SECTION_TERRAIN[id].hill);

function hilliness(x: number, z: number): number {
  let s = 0;
  let sw = 0;
  for (let i = 0; i < patchXZ.length; i++) {
    const dx = x - patchXZ[i][0];
    const dz = z - patchXZ[i][1];
    const w = Math.exp(-(dx * dx + dz * dz) / 2.4);
    s += w * HILL[i];
    sw += w;
  }
  return sw > 1e-6 ? s / sw : 0.6;
}

/** Normalised distance from the lake centre: < 1 is lake (plus a noisy shore); ~1–1.15 is the beach. */
export function lakeDist(x: number, z: number): number {
  return Math.hypot(x / 2.35, z / 1.12) + (fbm(x * 0.8 + 11, z * 0.8 - 3) - 0.5) * 0.55;
}

/** Raised plateaus the path climbs onto (flat-topped, noisy cliff edge). */
const PLATEAUS: readonly { x: number; z: number; r: number; h: number }[] = [
  { x: 4.5, z: -0.35, r: 1.55, h: 0.3 }, // 360° + board games
  { x: -3.3, z: -1.75, r: 1.35, h: 0.2 }, // myalbumlink + artoverlay
];
/** Peaks in the outer ring (between path and frame), kept to the back so they never hide the path. */
const PEAKS: readonly { x: number; z: number; s: number; h: number }[] = [
  { x: -5.1, z: -3.45, s: 1.25, h: 1.1 },
  { x: -2.9, z: -3.9, s: 0.8, h: 0.55 },
  { x: 5.0, z: -3.35, s: 0.95, h: 0.8 },
  { x: 1.4, z: -3.85, s: 0.7, h: 0.4 },
];

/** Terrain height before flattening pads under tiles and landmarks. */
export function rawHeight(x: number, z: number): number {
  const hill = hilliness(x, z);
  // 1 on the path loop, < 1 inside, > 1 outside.
  const q = Math.pow(Math.pow(Math.abs(x) / RX, EXP) + Math.pow(Math.abs(z) / RZ, EXP), 1 / EXP);
  let h = 0.1 + (fbm(x * 0.6 + 3, z * 0.6 + 9) - 0.45) * 0.26 * hill;
  // Plateaus.
  for (const p of PLATEAUS) {
    const d = Math.hypot(x - p.x, z - p.z) + (fbm(x * 1.1 + 7, z * 1.1 - 5) - 0.5) * 0.7;
    h += p.h * smooth(p.r + 0.55, p.r, d);
  }
  // Outer ring: rolling hills, taller towards the back, plus a few peaks (snow on the tallest).
  const outer = smooth(1.08, 1.4, q);
  if (outer > 0) {
    const back = smooth(1.5, -3.2, z);
    let o = fbm(x * 0.55 + 50, z * 0.55 + 20) * (0.18 + 0.5 * back + 0.25 * hill);
    for (const p of PEAKS) {
      const d2 = ((x - p.x) ** 2 + (z - p.z) ** 2) / (p.s * p.s);
      o += p.h * Math.exp(-d2 * 1.6) * (0.8 + 0.4 * fbm(x * 1.7, z * 1.7));
    }
    h += outer * o;
  }
  // Central lake.
  h -= smooth(1.0, 0.5, lakeDist(x, z)) * 0.7;
  // Settle down to the frame so the cream wall lip reads as a border.
  const edge = Math.min(BOARD.halfW - Math.abs(x), BOARD.halfD - Math.abs(z));
  return lerp(0.06, h, smooth(0.05, 0.55, edge));
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

const tileBase: number[] = (() => {
  const raw = pathXZ.map(([x, z]) => clamp(rawHeight(x, z), 0.07, 0.5));
  // Two smoothing passes so plateau climbs read as a gentle stair, not a jump.
  const pass = (v: number[]) =>
    v.map((_, i) => (v[(i - 1 + TILE_COUNT) % TILE_COUNT] + 2 * v[i] + v[(i + 1) % TILE_COUNT]) / 4);
  return pass(pass(raw));
})();

const padXYZ: [number, number, number][] = SECTION_IDS.map((_, s) => {
  const i = landmarkTileIndex(s);
  const [nx, nz] = inwardOf(i);
  const x = pathXZ[i][0] + nx * LANDMARK_PAD_OFFSET;
  const z = pathXZ[i][1] + nz * LANDMARK_PAD_OFFSET;
  return [x, clamp(rawHeight(x, z), 0.08, 0.5), z];
});

/** Terrain height including the flat pads under tiles and landmark models. */
export function groundHeight(x: number, z: number): number {
  let h = rawHeight(x, z);
  for (let i = 0; i < TILE_COUNT; i++) {
    const dx = x - pathXZ[i][0];
    const dz = z - pathXZ[i][1];
    const d2 = dx * dx + dz * dz;
    if (d2 < 0.25) h = lerp(h, tileBase[i] - 0.01, smooth(0.48, 0.24, Math.sqrt(d2)));
  }
  for (let s = 0; s < padXYZ.length; s++) {
    const dx = x - padXYZ[s][0];
    const dz = z - padXYZ[s][2];
    const d2 = dx * dx + dz * dz;
    if (d2 < 0.72) h = lerp(h, padXYZ[s][1], smooth(0.84, LANDMARK_PAD_RADIUS + 0.04, Math.sqrt(d2)));
  }
  return h;
}

/** Which section's terrain patch a point belongs to (warped Voronoi) and how strongly (0–1). */
export function sectionAt(x: number, z: number): { index: number; weight: number } {
  const wx = x + (fbm(x * 0.7 + 5, z * 0.7) - 0.5) * 1.1;
  const wz = z + (fbm(x * 0.7 - 9, z * 0.7 + 4) - 0.5) * 1.1;
  let best = 0;
  let bd = Infinity;
  for (let i = 0; i < patchXZ.length; i++) {
    const d = Math.hypot(wx - patchXZ[i][0], wz - patchXZ[i][1]);
    if (d < bd) {
      bd = d;
      best = i;
    }
  }
  return { index: best, weight: smooth(3.0, 1.0, bd) };
}

// ------------------------------------------------------------------ exports
export const TILES: readonly TileInfo[] = pathXZ.map(([x, z], i) => {
  const [nx, nz] = pathXZ[(i + 1) % TILE_COUNT];
  const sectionIndex = Math.floor(i / TILES_PER_SECTION);
  return {
    index: i,
    x,
    y: tileBase[i] + TILE_THICKNESS,
    z,
    heading: Math.atan2(nx - x, nz - z),
    inward: inwardOf(i),
    section: SECTION_IDS[sectionIndex],
    sectionIndex,
    isLandmark: i % TILES_PER_SECTION === LANDMARK_SLOT,
  };
});

export const SECTION_LAYOUT = Object.fromEntries(
  SECTION_IDS.map((id, s) => {
    const landmarkTile = landmarkTileIndex(s);
    const [nx, nz] = inwardOf(landmarkTile);
    const [x, y, z] = padXYZ[s];
    const layout: SectionLayout = {
      id,
      index: s,
      tiles: Array.from({ length: TILES_PER_SECTION }, (_, k) => s * TILES_PER_SECTION + k),
      landmarkTile,
      landmark: { x, y, z, rotY: Math.atan2(-nx, -nz) },
      patch: { x: patchXZ[s][0], z: patchXZ[s][1] },
    };
    return [id, layout];
  }),
) as Record<SectionId, SectionLayout>;

/** Per tile: the section whose landmark tile it is, or null. */
export const LANDMARK_AT_TILE: readonly (SectionId | null)[] = TILES.map((t) => (t.isLandmark ? t.section : null));

export const landmarkTileOf = (id: SectionId) => SECTION_LAYOUT[id].landmarkTile;
export const wrapTile = (i: number) => ((i % TILE_COUNT) + TILE_COUNT) % TILE_COUNT;

/** Distance (xz) from a point to the path polyline through the tile centres. */
export function distToPath(x: number, z: number): number {
  let best = Infinity;
  for (let i = 0; i < TILE_COUNT; i++) {
    const [ax, az] = pathXZ[i];
    const [bx, bz] = pathXZ[(i + 1) % TILE_COUNT];
    const dx = bx - ax;
    const dz = bz - az;
    const t = Math.min(1, Math.max(0, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
    const d = Math.hypot(x - ax - dx * t, z - az - dz * t);
    if (d < best) best = d;
  }
  return best;
}
