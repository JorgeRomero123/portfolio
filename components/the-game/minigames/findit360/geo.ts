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

/**
 * `count` targets spread round the full circle (360/count apart with jitter) at varied pitch,
 * none within 45° of where the visitor starts looking, so you always have to turn.
 */
export function makeTargets(
  startYaw: number,
  count = 3,
  rnd: () => number = Math.random,
): Target[] {
  const base = rnd() * 360;
  const gap = 360 / count;
  return Array.from({ length: count }, (_, i) => {
    let yaw = norm(base + i * gap + (rnd() - 0.5) * gap * 0.4);
    const off = norm(yaw - startYaw);
    if (Math.abs(off) < 45)
      yaw = norm(startYaw + (off < 0 ? -1 : 1) * (45 + rnd() * 15));
    const pitch = -16 + rnd() * 36;
    return { id: `fi360-${i}`, yaw, pitch };
  });
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
