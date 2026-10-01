import { NextRequest } from 'next/server';
import { fail, getDb, isUuid, json, unavailable } from '@/lib/the-game-leaderboard';
import { MAX_RUN_MS, MIN_WIN_MS, isCountry, type Outcome } from '@/components/the-game/leaderboard/rules';
import { bucketTimes, standing, type Stats } from '@/components/the-game/leaderboard/stats';

interface Summary {
  runs: number;
  wins: number;
  times: number[];
  mine: { time_ms: number; outcome: Outcome; place: number | null } | null;
}

// GET /api/the-game/stats?run=<id>  or  ?time=<ms>
// Everything the results screen needs: how many races and wins there are, the bucketed winning
// times (null below 20 wins) and where a run, or a bare time, stands among every winning run.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const run = q.get('run');
  const timeParam = q.get('time');
  if (run !== null && !isUuid(run)) return fail('bad_run', 400);
  const time = timeParam === null ? null : Number(timeParam);
  if (time !== null && (!Number.isInteger(time) || time < 0 || time > MAX_RUN_MS)) return fail('bad_time', 400);

  const db = await getDb();
  if (!db) return unavailable();

  const { data, error } = await db.rpc('the_game_summary', { p_run: run, p_min_ms: MIN_WIN_MS, p_max_ms: MAX_RUN_MS });
  if (error || !data) return fail('db_error', 500);
  const s = data as Summary;
  const times = (s.times ?? []).map(Number);

  let mine: Stats['mine'] = null;
  if (s.mine) {
    mine = standing(times, { timeMs: s.mine.time_ms, outcome: s.mine.outcome, place: s.mine.place === null ? null : Number(s.mine.place) }, true);
  } else if (time !== null) {
    mine = standing(times, { timeMs: time, outcome: 'won', place: null }, false);
  }

  const header = req.headers.get('x-vercel-ip-country')?.toUpperCase() ?? null;
  const stats: Stats = {
    runs: Number(s.runs),
    wins: Number(s.wins),
    mine,
    curve: bucketTimes(times),
    country: isCountry(header) ? header : null,
  };
  return json(stats);
}
