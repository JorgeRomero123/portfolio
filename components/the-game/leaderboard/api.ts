'use client';

// Browser side of /api/the-game/*. Every call resolves (never throws) so a failing or unconfigured
// API can't break the game: callers get { ok: false } and show a plain message.
//
// Dev only: `?fakeRuns=<n>` swaps in an in-memory backend seeded with n made-up winning runs
// (`?fakeRuns=down` fails every call), to check the results screen without a database.
import type { Outcome } from './rules';
import type { Board, Stats } from './stats';

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export interface RunPayload {
  nonce: string;
  outcome: Outcome;
  timeMs: number;
  losses: number;
  stamps: number;
}

async function call<T>(url: string, init?: RequestInit): Promise<Result<T>> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
      cache: 'no-store',
    });
    const body = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
    if (!res.ok || !body) return { ok: false, error: body?.error ?? `http_${res.status}` };
    return { ok: true, data: body };
  } catch {
    return { ok: false, error: 'network' };
  }
}

type Api = {
  recordRun: (p: RunPayload) => Promise<Result<{ id: string; token: string }>>;
  fetchStats: (runId: string | null, timeMs: number | null) => Promise<Result<Stats>>;
  fetchBoard: (runId: string | null) => Promise<Result<Board>>;
  attachNickname: (p: { id: string; token: string; nickname: string; country: string | null }) => Promise<Result<{ ok: true; board: Board | null }>>;
};

const real: Api = {
  recordRun: (p) => call('/api/the-game/runs', { method: 'POST', body: JSON.stringify(p) }),
  fetchStats: (runId, timeMs) => {
    const q = runId ? `run=${encodeURIComponent(runId)}` : timeMs !== null ? `time=${Math.round(timeMs)}` : '';
    return call(`/api/the-game/stats?${q}`);
  },
  fetchBoard: (runId) => call(`/api/the-game/leaderboard${runId ? `?run=${encodeURIComponent(runId)}` : ''}`),
  attachNickname: (p) => call('/api/the-game/runs', { method: 'PATCH', body: JSON.stringify(p) }),
};

function fakeParam(): string | null {
  if (process.env.NODE_ENV === 'production') return null;
  try {
    return new URLSearchParams(window.location.search).get('fakeRuns');
  } catch {
    return null;
  }
}

async function api(): Promise<Api> {
  if (process.env.NODE_ENV !== 'production') {
    const p = fakeParam();
    if (p !== null) return (await import('./fake')).fakeApi(p);
  }
  return real;
}

export const recordRun: Api['recordRun'] = async (p) => (await api()).recordRun(p);
export const fetchStats: Api['fetchStats'] = async (r, t) => (await api()).fetchStats(r, t);
export const fetchBoard: Api['fetchBoard'] = async (r) => (await api()).fetchBoard(r);
export const attachNickname: Api['attachNickname'] = async (p) => (await api()).attachNickname(p);

/** Random url-safe key for the run nonce. */
export function newNonce(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 40);
}
