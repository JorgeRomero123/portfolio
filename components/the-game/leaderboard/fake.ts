// Dev-only stand-in for /api/the-game/* (see api.ts, `?fakeRuns=<n>`). Seeded, so the same n
// always gives the same made-up runs; the visitor's own run is added when the race ends.
import type { Result, RunPayload } from './api';
import { randomNickname } from './nicknames';
import { BOARD_SIZE, COUNTRY_CODES, MIN_WIN_MS, nicknameError, tidyNickname, validateRun } from './rules';
import { bucketTimes, standing, type Board, type BoardRow, type Stats } from './stats';

interface Row {
  id: string;
  outcome: 'won' | 'lost';
  timeMs: number;
  losses: number;
  token: string;
  nickname: string | null;
  country: string | null;
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let store: { key: string; rows: Row[] } | null = null;

function seed(n: number): Row[] {
  const r = rng(n * 7919 + 13);
  const rows: Row[] = [];
  for (let i = 0; i < n; i++) {
    // Log-normal around 11 minutes, never under the plausibility floor.
    const g = Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());
    const timeMs = Math.max(MIN_WIN_MS + 5000, Math.round(11 * 60_000 * Math.exp(0.32 * g)));
    const named = r() < 0.5;
    rows.push({
      id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
      outcome: 'won',
      timeMs,
      losses: Math.floor(r() * r() * 6), // mostly 0–2, a few dart runs with 4 or 5
      token: 'x',
      nickname: named ? randomNickname(r() < 0.5 ? 'en' : 'es', r) : null,
      country: named && r() < 0.7 ? COUNTRY_CODES[Math.floor(r() * COUNTRY_CODES.length)] : null,
    });
  }
  for (let i = 0; i < Math.round(n * 1.4) + 3; i++)
    rows.push({ id: `l-${i}`, outcome: 'lost', timeMs: 400_000, losses: i % 7, token: 'x', nickname: null, country: null });
  return rows;
}

const delay = <T,>(v: T) => new Promise<T>((res) => window.setTimeout(() => res(v), 350));

function board(rows: Row[], runId: string | null): Board {
  const ranked: BoardRow[] = rows
    .filter((r) => r.outcome === 'won' && r.nickname)
    .sort((a, b) => a.timeMs - b.timeMs)
    .map((r, i) => ({ rank: i + 1, nickname: r.nickname!, country: r.country, timeMs: r.timeMs, losses: r.losses, mine: r.id === runId }));
  const me = ranked.find((r) => r.mine && r.rank > BOARD_SIZE) ?? null;
  return { total: ranked.length, top: ranked.slice(0, BOARD_SIZE), me };
}

export function fakeApi(param: string) {
  const down = param === 'down';
  const n = Math.max(0, Math.min(5000, Number(param) || 0));
  if (!store || store.key !== param) store = { key: param, rows: seed(n) };
  const rows = store.rows;
  const fail = <T,>(): Promise<Result<T>> => delay({ ok: false, error: 'unavailable' });

  return {
    recordRun: (p: RunPayload): Promise<Result<{ id: string; token: string }>> => {
      if (down) return fail();
      const v = validateRun(p);
      if (!v.ok) return delay({ ok: false, error: v.error });
      const id = `00000000-0000-4000-9000-${String(rows.length).padStart(12, '0')}`;
      rows.push({ id, outcome: p.outcome, timeMs: p.timeMs, losses: p.losses, token: 'fake-token-0123456789', nickname: null, country: null });
      return delay({ ok: true, data: { id, token: 'fake-token-0123456789' } });
    },
    fetchStats: (runId: string | null, timeMs: number | null): Promise<Result<Stats>> => {
      if (down) return fail();
      const wins = rows.filter((r) => r.outcome === 'won');
      const times = wins.map((r) => r.timeMs).sort((a, b) => a - b);
      const me = rows.find((r) => r.id === runId);
      const place = me && me.outcome === 'won' ? wins.indexOf(me) + 1 : null;
      const mine = me
        ? standing(times, { timeMs: me.timeMs, outcome: me.outcome, place }, true)
        : timeMs !== null
          ? standing(times, { timeMs, outcome: 'won', place: null }, false)
          : null;
      return delay({ ok: true, data: { runs: rows.length, wins: wins.length, mine, curve: bucketTimes(times), country: 'MX' } });
    },
    fetchBoard: (runId: string | null): Promise<Result<Board>> => (down ? fail() : delay({ ok: true, data: board(rows, runId) })),
    attachNickname: (p: { id: string; token: string; nickname: string; country: string | null }): Promise<Result<{ ok: true; board: Board | null }>> => {
      if (down) return fail();
      const err = nicknameError(p.nickname);
      if (err) return delay({ ok: false, error: err });
      const row = rows.find((r) => r.id === p.id && r.token === p.token && r.outcome === 'won');
      if (!row) return delay({ ok: false, error: 'not_your_run' });
      row.nickname = tidyNickname(p.nickname);
      row.country = p.country;
      return delay({ ok: true, data: { ok: true as const, board: board(rows, p.id) } });
    },
  };
}
