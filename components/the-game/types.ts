// Shared contract for /the-game. Every module (board, overlays, mini-games) builds against these.
import type { ComponentType } from 'react';

export type Lang = 'en' | 'es';
export type L10n = Record<Lang, string>;

export const SECTION_IDS = [
  'software',
  'drone',
  'spurs',
  'pano360',
  'boardgames',
  'music',
  'beer',
  'artoverlay',
  'myalbumlink',
  'emarts',
  'kitchen',
] as const;
export type SectionId = (typeof SECTION_IDS)[number];

/** What a mini-game reports when it ends. `score` is 0–100 so the UI can compare games. */
export interface MiniGameResult {
  won: boolean;
  score: number;
}

/**
 * Every mini-game is a default-exported React component with these props, lazy-loaded
 * from minigames/registry.ts. It renders inside the host modal (which owns the title bar,
 * the always-visible "Skip mini-game" button and focus trapping) and fills its container.
 */
export interface MiniGameProps {
  lang: Lang;
  reducedMotion: boolean;
  /** Visitor opted into sound. Never play audio when false. */
  soundOn: boolean;
  onFinish: (result: MiniGameResult) => void;
}
export type MiniGameComponent = ComponentType<MiniGameProps>;

export const HAT_IDS = ['propeller', 'chef', 'scarf', 'headphones', 'beanie', 'beret'] as const;
export type HatId = (typeof HAT_IDS)[number];

/** The race against Jorge's pawn (rules in race.ts). */
export type RaceStatus = 'running' | 'won' | 'lost';

export type Prize =
  | { kind: 'stamp' }
  | { kind: 'story' }
  | { kind: 'fact' }
  | { kind: 'dart' }
  | { kind: 'move' }
  | { kind: 'hat'; hat: HatId };

/** Persisted to localStorage (key `the-game:v1`). Must always be safe to fall back to DEFAULT_PROGRESS. */
export interface Progress {
  stamps: SectionId[];
  hats: HatId[];
  wornHat: HatId | null;
  bonusDarts: number;
  freeMoves: number;
  storiesUnlocked: SectionId[];
  /** Index into the section's fun-fact list, per section. */
  factsSeen: Partial<Record<SectionId, number>>;
  pawnTile: number;
  soundOn: boolean;
  /** Tiles Jorge's pawn has covered on his lap (44 = finished). Briefly negative after an opening win. */
  rivalSteps: number;
  race: RaceStatus;
  /** Speedrun clock: epoch ms of the race's first turn. Null until then (or for a race that was
   *  already under way when the clock was introduced, which stays untimed). */
  raceStartedAt: number | null;
  /** Mini-games lost (or skipped) for a stamp in this race. */
  raceLosses: number;
  /** Final time, frozen when the race ends. */
  raceTimeMs: number | null;
  /** The finished race as recorded by /api/the-game/runs. The nonce is created when the race ends
   *  and makes the POST idempotent; id and token arrive with the response. */
  runNonce: string | null;
  runId: string | null;
  runToken: string | null;
  /** Leaderboard opt-in for the current run (winners only). */
  boardChoice: BoardChoice;
}

export type BoardChoice = 'ask' | 'declined' | 'joined';

export const DEFAULT_PROGRESS: Progress = {
  stamps: [],
  hats: [],
  wornHat: null,
  bonusDarts: 0,
  freeMoves: 0,
  storiesUnlocked: [],
  factsSeen: {},
  pawnTile: 0,
  soundOn: false,
  rivalSteps: 0,
  race: 'running',
  raceStartedAt: null,
  raceLosses: 0,
  raceTimeMs: null,
  runNonce: null,
  runId: null,
  runToken: null,
  boardChoice: 'ask',
};

/** Placeholder strings in content start with this and must never be rendered to visitors. */
export const TODO_PREFIX = 'TODO(jorge)';
export const isTodo = (s: string | undefined | null) => !s || s.startsWith(TODO_PREFIX);

/**
 * What the visitor chose at a landmark prompt.
 * - 'play'     → a mini-game ran; the pawn stops on that landmark (turn ends).
 * - 'look'     → the section card was shown; when passing, the pawn keeps moving afterwards.
 * - 'continue' → nothing shown; when passing, the pawn keeps moving.
 * On a landed prompt the turn ends whatever the choice.
 */
export type LandmarkChoice = 'play' | 'look' | 'continue';

/** Single hook point the board shell calls when the pawn reaches a landmark (see GameShell). */
export type LandmarkHandler = (
  section: SectionId,
  info: { landed: boolean },
) => Promise<LandmarkChoice>;
