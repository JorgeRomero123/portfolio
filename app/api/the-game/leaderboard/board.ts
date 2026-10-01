import type { Board, BoardRow } from '@/components/the-game/leaderboard/stats';

interface DbRow {
  rank: number;
  nickname: string;
  country: string | null;
  time_ms: number;
  losses: number;
  mine: boolean;
}

const row = (r: DbRow): BoardRow => ({
  rank: Number(r.rank),
  nickname: r.nickname,
  country: r.country,
  timeMs: r.time_ms,
  losses: r.losses,
  mine: r.mine === true,
});

/** the_game_leaderboard() JSON → the API's Board. */
export function toBoard(raw: unknown): Board {
  const d = (raw ?? {}) as { total?: number; top?: DbRow[]; me?: DbRow | null };
  return { total: Number(d.total ?? 0), top: (d.top ?? []).map(row), me: d.me ? row(d.me) : null };
}
