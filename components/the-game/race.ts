// The race against Jorge's pawn. Pure rules (no React, no three.js): the ONE place that decides
// how far he moves and who wins.
//
// The visitor wins by collecting all 11 stamps before Jorge's pawn finishes one lap of the
// 44-tile loop. He moves:
//   • RIVAL_TURN tiles forward at the end of every turn the visitor takes (dice, dart or free move),
//   • RIVAL_WIN_BACK tiles back when the visitor wins a mini-game for a stamp they didn't have,
//   • RIVAL_LOSS tiles forward when they lose one (a skipped mini-game counts as a loss).
// "Just look", "keep going" and replays of stamped sections cost nothing beyond the turn itself.
//
// So the fewer turns a lap takes, the less he moves: the dice average 3.5 tiles (about 13 turns),
// a well-thrown dart about 5 (about 9 turns). Simulated over 40,000 races with these numbers:
// on dice, two lost mini-games still win the race 84% of the time, three 45%, four 7%;
// with steadied darts, four losses still win 98% of the time.
import { TILE_COUNT } from './board/layout';
import { hasAllStamps } from './rewards';
import type { Progress, RaceStatus } from './types';

export const RIVAL_LAP = TILE_COUNT;
export const RIVAL_TURN = 3;
export const RIVAL_WIN_BACK = 1;
export const RIVAL_LOSS = 6;

/** A forward move from `steps`, cut short so he stops on the finish line. */
const forward = (steps: number, n: number) => Math.max(0, Math.min(n, RIVAL_LAP - steps));

/** Jorge's move (signed tiles) for one finished mini-game played for a missing stamp. */
export const gameMove = (steps: number, won: boolean) => (won ? -RIVAL_WIN_BACK : forward(steps, RIVAL_LOSS));

/** Jorge's move at the end of one of the visitor's turns. */
export const turnMove = (steps: number) => forward(steps, RIVAL_TURN);

/** Where the race stands once he is on `rivalSteps`. `progress` must already hold any stamp just won. */
export function raceAfter(progress: Progress, rivalSteps: number): RaceStatus {
  if (rivalSteps >= RIVAL_LAP) return 'lost';
  return hasAllStamps(progress) ? 'won' : 'running';
}
