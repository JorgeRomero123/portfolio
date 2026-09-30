// Mini-game registry: one lazily imported module per section. Each module default-exports a
// component implementing MiniGameProps (types.ts). The host (overlays/MiniGameHost.tsx) loads it
// with React.lazy + Suspense, so no game code ships until a visitor chooses "Play".
import type { MiniGameComponent, SectionId } from '../types';

export type MiniGameLoader = () => Promise<{ default: MiniGameComponent }>;

export const MINIGAMES: Record<SectionId, MiniGameLoader> = {
  software: () => import('./SquashBugs'),
  drone: () => import('./GetTheShot'),
  spurs: () => import('./Penalty'),
  pano360: () => import('./FindIt360'),
  boardgames: () => import('./MeepleMemory'),
  music: () => import('./TapTheBeat'),
  beer: () => import('./PerfectPour'),
  artoverlay: () => import('./TraceIt'),
  myalbumlink: () => import('./OneLink'),
  emarts: () => import('./PaintByGuide'),
  kitchen: () => import('./OrderUp'),
};
