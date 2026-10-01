// Contract between the (static) GameShell and the (dynamically loaded) 3D BoardScene.
// Type-only: importing this never pulls three.js into the page's initial bundle.
import type { RefObject } from 'react';
import type { HatId, Lang } from '../types';

export type DieValue = 1 | 2 | 3 | 4 | 5 | 6;
export type ViewMode = 'follow' | 'board';

/** Imperative animation API the shell drives. Every promise resolves when the animation ends. */
export interface BoardApi {
  /** Hop the pawn to an adjacent tile (little arc + squash; a short slide with reduced motion). */
  hopTo(tile: number): Promise<void>;
  /** Big arc jump to any tile. */
  jumpTo(tile: number): Promise<void>;
  /** Hop Jorge's pawn (the rival in the race) to an adjacent tile, forwards or backwards. */
  rivalHopTo(tile: number): Promise<void>;
  /** Tumble the die near the pawn and settle on `value` (face shown briefly with reduced motion). */
  rollDie(value: DieValue): Promise<void>;
  hideDie(): void;
  /** 'follow' tracks the pawn; 'board' frames the whole board for the current aspect ratio. */
  setView(mode: ViewMode): void;
}

export interface BoardProps {
  apiRef: RefObject<BoardApi | null>;
  pawnTile: number;
  /** Tile Jorge's pawn stands on (the shell holds it still while it animates his moves). */
  rivalTile: number;
  hat: HatId | null;
  lang: Lang;
  reducedMotion: boolean;
  /** false pauses rendering (tab hidden or stage scrolled out of view). */
  active: boolean;
  /** Called once the canvas is up and the API is usable. */
  onReady?: () => void;
}
