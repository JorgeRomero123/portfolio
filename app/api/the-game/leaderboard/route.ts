import { NextRequest } from 'next/server';
import { fail, getDb, isUuid, json, unavailable } from '@/lib/the-game-leaderboard';
import { BOARD_SIZE } from '@/components/the-game/leaderboard/rules';
import { toBoard } from './board';

// GET /api/the-game/leaderboard?run=<id> → the top named winning runs, fastest first. With `run`,
// that row is flagged `mine` (and returned as `me` when it's outside the top).
export async function GET(req: NextRequest) {
  const run = req.nextUrl.searchParams.get('run');
  if (run !== null && !isUuid(run)) return fail('bad_run', 400);

  const db = await getDb();
  if (!db) return unavailable();

  const { data, error } = await db.rpc('the_game_leaderboard', { p_run: run, p_limit: BOARD_SIZE });
  if (error) return fail('db_error', 500);
  return json(toBoard(data));
}
