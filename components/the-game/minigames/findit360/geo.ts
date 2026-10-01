// Angle helpers and target placement for "Find it in 360". All angles in degrees.
// Pannellum yaw grows to the right (clockwise seen from above); pitch grows upwards.

export interface Target {
  id: string;
  yaw: number;
  pitch: number;
}

/** Wraps to (-180, 180]. */
export const norm = (a: number) => {
  const x = ((((a + 180) % 360) + 360) % 360) - 180;
  return x === -180 ? 180 : x;
};

const rad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance between two view directions. */
export function angDist(p1: number, y1: number, p2: number, y2: number) {
  const c =
    Math.sin(rad(p1)) * Math.sin(rad(p2)) +
    Math.cos(rad(p1)) * Math.cos(rad(p2)) * Math.cos(rad(y2 - y1));
  return (Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI;
}

const MAX_PITCH = 42; // keeps gems clear of the zenith and the tripod at the nadir
const MIN_GAP = 20; // degrees between any two gems

/**
 * `count` targets scattered evenly by area over the band of the sphere within ±MAX_PITCH, in
 * every direction (so you have to turn all the way round and look up and down), no two closer
 * than MIN_GAP. If a spot can't be found the gap is relaxed rather than looping forever.
 */
export function makeTargets(
  count: number,
  rnd: () => number = Math.random,
): Target[] {
  const out: Target[] = [];
  const top = Math.sin(rad(MAX_PITCH));
  for (let i = 0; i < count; i++) {
    let yaw = 0;
    let pitch = 0;
    for (let tries = 0; tries < 200; tries++) {
      yaw = norm(rnd() * 360);
      pitch = (Math.asin((rnd() * 2 - 1) * top) * 180) / Math.PI;
      const gap = MIN_GAP * (tries < 100 ? 1 : 0.6);
      if (out.every((t) => angDist(pitch, yaw, t.pitch, t.yaw) >= gap)) break;
    }
    out.push({ id: `fi360-${i}`, yaw, pitch });
  }
  return out;
}

export interface Nearest {
  target: Target;
  dist: number;
  /** Relative yaw, −180…180 (positive = to the right). */
  dYaw: number;
  /** Relative pitch (positive = up). */
  dPitch: number;
}

export function nearest(
  targets: Target[],
  pitch: number,
  yaw: number,
): Nearest | null {
  let best: Nearest | null = null;
  for (const t of targets) {
    const dist = angDist(pitch, yaw, t.pitch, t.yaw);
    if (!best || dist < best.dist)
      best = {
        target: t,
        dist,
        dYaw: norm(t.yaw - yaw),
        dPitch: t.pitch - pitch,
      };
  }
  return best;
}

export type HDir =
  "ahead" | "slightLeft" | "slightRight" | "left" | "right" | "behind";
export type VDir = "up" | "bitUp" | "down" | "bitDown" | null;

export function describe(n: Nearest, precise: boolean): { h: HDir; v: VDir } {
  const a = Math.abs(n.dYaw);
  const side = n.dYaw < 0 ? "Left" : "Right";
  const h: HDir =
    a <= 20
      ? "ahead"
      : a <= 70
        ? (`slight${side}` as HDir)
        : a <= 140
          ? (side.toLowerCase() as HDir)
          : "behind";
  const lim = precise ? 8 : 18;
  const p = n.dPitch;
  const v: VDir =
    p > 25
      ? "up"
      : p > lim
        ? "bitUp"
        : p < -25
          ? "down"
          : p < -lim
            ? "bitDown"
            : null;
  return { h, v };
}
