import { NextRequest } from 'next/server';
import {
  GLOBAL_RUNS_PER_MINUTE,
  WRITE_LIMIT,
  allow,
  fail,
  getDb,
  isKey,
  isUuid,
  json,
  newToken,
  sha256,
  unavailable,
} from '@/lib/the-game-leaderboard';
import { BOARD_SIZE, isCountry, nicknameError, tidyNickname, validateRun } from '@/components/the-game/leaderboard/rules';
import { toBoard } from '../leaderboard/board';

// POST /api/the-game/runs → records one finished race, anonymously.
// Body: { nonce, outcome, timeMs, losses, stamps }. Returns { id, token }: the token is shown once
// and only its hash is stored; it is what lets this browser name the run later.
// The nonce makes the call idempotent: sending the same one again returns the same run.
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || !isKey(body.nonce)) return fail('bad_nonce', 400);
  const v = validateRun(body);
  if (!v.ok) return fail(v.error, 400);
  if (!allow(req, 'run', WRITE_LIMIT.limit, WRITE_LIMIT.windowMs)) return fail('rate_limited', 429);

  const db = await getDb();
  if (!db) return unavailable();

  const token = newToken();
  const { data, error } = await db.rpc('the_game_record_run', {
    p_outcome: v.run.outcome,
    p_time_ms: v.run.timeMs,
    p_losses: v.run.losses,
    p_stamps: v.run.stamps,
    p_token_hash: sha256(token),
    p_nonce_hash: sha256(body.nonce),
    p_max_per_minute: GLOBAL_RUNS_PER_MINUTE,
  });
  if (error) return fail('db_error', 500);
  const id = (data as { id: string }[] | null)?.[0]?.id;
  if (!id) return fail('rate_limited', 429);
  return json({ id, token }, 201);
}

// PATCH /api/the-game/runs → puts a nickname (and optionally a country) on your own winning run.
// Body: { id, token, nickname, country | null }. Returns the leaderboard with that run in it.
export async function PATCH(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || !isUuid(body.id) || !isKey(body.token, 16, 64)) return fail('bad_run', 400);
  if (typeof body.nickname !== 'string') return fail('length', 400);
  const nickError = nicknameError(body.nickname);
  if (nickError) return fail(nickError, 400);
  const country = body.country ?? null;
  if (country !== null && !isCountry(country)) return fail('bad_country', 400);
  if (!allow(req, 'nick', WRITE_LIMIT.limit, WRITE_LIMIT.windowMs)) return fail('rate_limited', 429);

  const db = await getDb();
  if (!db) return unavailable();

  const { data: ok, error } = await db.rpc('the_game_attach', {
    p_run: body.id,
    p_token_hash: sha256(body.token),
    p_nickname: tidyNickname(body.nickname),
    p_country: country,
  });
  if (error) return fail('db_error', 500);
  if (ok !== true) return fail('not_your_run', 403);

  const board = await db.rpc('the_game_leaderboard', { p_run: body.id, p_limit: BOARD_SIZE });
  return json({ ok: true, board: board.error ? null : toBoard(board.data) });
}
