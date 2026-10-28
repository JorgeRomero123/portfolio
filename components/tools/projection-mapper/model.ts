// Shared types and geometry for the projection mapper.

export type Point = [number, number];

export interface Surface {
  id: string;
  name: string;
  /** Corners in output space (0..1), clockwise from top-left. */
  pts: Point[];
  content: string;
  color: string;
  speed: number;
  opacity: number;
  text: string;
  /** Id of a file in the output device's media store. */
  media: string | null;
  visible: boolean;
}

export interface MapState {
  surfaces: Surface[];
  selected: string | null;
  showGrid: boolean;
  blackout: boolean;
  /** Width / height of the projector window, reported by the output. */
  aspect: number;
  /** Device id of the browser showing the output, so controls know if they share its media store. */
  outputDevice: string | null;
  /** Last-writer-wins clock for syncing between devices. */
  updatedAt: number;
}

export const emptyState = (): MapState => ({
  surfaces: [],
  selected: null,
  showGrid: true,
  blackout: false,
  aspect: 16 / 9,
  outputDevice: null,
  updatedAt: 0,
});

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export function newSurface(index: number): Surface {
  // Stagger new surfaces so they don't land exactly on top of each other.
  const o = (index % 5) * 0.06;
  return {
    id: uid(),
    name: `Surface ${index + 1}`,
    pts: [[0.3 + o, 0.25 + o], [0.6 + o, 0.25 + o], [0.6 + o, 0.65 + o], [0.3 + o, 0.65 + o]],
    content: 'ghosts',
    color: '#ff8ad8',
    speed: 1,
    opacity: 1,
    text: 'BOO',
    media: null,
    visible: true,
  };
}

export function duplicateSurface(s: Surface): Surface {
  return { ...structuredClone(s), id: uid(), name: `${s.name} copy`, pts: s.pts.map(([x, y]) => [x + 0.03, y + 0.03]) };
}

/**
 * Homography mapping the rect (0,0)-(w,h) onto the quad `pts` (pixels, clockwise from
 * top-left), as a CSS matrix3d(). Use with transform-origin: 0 0.
 */
export function quadTransform(w: number, h: number, pts: Point[]): string {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = pts;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const det = dx1 * dy2 - dx2 * dy1 || 1e-9;
  let g = (dx3 * dy2 - dx2 * dy3) / det;
  let h2 = (dx1 * dy3 - dx3 * dy1) / det;
  let a = x1 - x0 + g * x1, b = x3 - x0 + h2 * x3;
  let d = y1 - y0 + g * y1, e = y3 - y0 + h2 * y3;
  a /= w; d /= w; g /= w;
  b /= h; e /= h; h2 /= h;
  return `matrix3d(${a},${d},0,${g},${b},${e},0,${h2},0,0,1,0,${x0},${y0},0,1)`;
}

export const isVideo = (type: string) => type.startsWith('video/');
