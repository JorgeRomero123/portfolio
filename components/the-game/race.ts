// The race against Jorge's pawn. Pure rules (no React, no three.js): the ONE place that decides
// how far he moves and who wins.
//
// Jorge's pawn only moves when the visitor plays a mini-game for a stamp they don't have yet:
// he always advances RIVAL_ADVANCE tiles, and a win makes him step back RIVAL_STEP_BACK first.
// Dice, darts, "just look" and replays of stamped sections never move him, so luck with the dice
// can't decide the race. A skipped mini-game counts as a loss.
//
// The visitor wins by collecting all 11 stamps before he finishes one lap of the 44-tile loop.
// That takes 11 wins plus L losses, after which he stands on
//   11 × (5 − 2) + 5 × L = 33 + 5L
// so L = 2 leaves him on tile 43, one short of the line, and L = 3 puts him over it (48):
// the visitor wins the race exactly when they lose at most two games.
import { TILE_COUNT } from './board/layout';
import { hasAllStamps } from './rewards';
import type { Progress, RaceStatus } from './types';

export const RIVAL_LAP = TILE_COUNT;
export const RIVAL_ADVANCE = 5;
export const RIVAL_STEP_BACK = 2;

/**
 * Jorge's moves for one finished mini-game, as signed tile counts in the order he makes them
 * (a win is "back 2, then forward 5"). The last move is cut short so he stops on the finish line.
 */
export function rivalMoves(steps: number, won: boolean): number[] {
  const moves = won ? [-RIVAL_STEP_BACK, RIVAL_ADVANCE] : [RIVAL_ADVANCE];
  const end = steps + moves.reduce((a, b) => a + b, 0);
  if (end > RIVAL_LAP) moves[moves.length - 1] -= end - RIVAL_LAP;
  return moves;
}

/** Where the race stands once he is on `rivalSteps`. `progress` must already hold any stamp just won. */
export function raceAfter(progress: Progress, rivalSteps: number): RaceStatus {
  if (rivalSteps >= RIVAL_LAP) return 'lost';
  return hasAllStamps(progress) ? 'won' : 'running';
}
