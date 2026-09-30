// Mini-game registry: one lazily imported module per section. Each module default-exports a
// component implementing MiniGameProps (types.ts). The host (overlays/MiniGameHost.tsx) loads it
// with React.lazy + Suspense, so no game code ships until a visitor chooses "Play".
//
// Task 3: replace an entry with `() => import('./SoftwareGame')` etc. Same interface, one file each.
import type { MiniGameComponent, SectionId } from '../types';

export type MiniGameLoader = () => Promise<{ default: MiniGameComponent }>;

const demo: MiniGameLoader = () => import('./DemoGame');

export const MINIGAMES: Record<SectionId, MiniGameLoader> = {
  software: demo,
  drone: demo,
  spurs: demo,
  pano360: demo,
  boardgames: demo,
  music: demo,
  beer: demo,
  artoverlay: demo,
  myalbumlink: demo,
  emarts: demo,
  kitchen: demo,
};
