'use client';

// The race dialog's data-driven parts: where you stand, the leaderboard and the join form.
// Loaded with next/dynamic by RaceDialog, so none of this ships until a race ends or someone
// opens the leaderboard. Every fetch failure turns into one plain sentence, never an error screen.
import { useEffect, useId, useMemo, useState, type FormEvent } from 'react';
import { BOARD_STRINGS } from '../strings';
import type { Lang } from '../types';
import { btnGhost, btnPrimary, btnSecondary } from '../overlays/ui';
import { attachNickname, fetchBoard, fetchStats, type Result } from './api';
import { randomNickname } from './nicknames';
import { ResultsChart } from './ResultsChart';
import { COUNTRY_CODES, NICK_MAX, flagOf, formatMinutes, formatTime, nicknameError, type Outcome } from './rules';
import { fasterThanPct, type Board, type BoardRow, type Stats } from './stats';

/** Where the visitor's run stands in the API: not recorded (untimed), on its way, failed, or saved. */
export type RunState = 'none' | 'sending' | 'failed' | 'saved';

function useFetch<T>(load: (() => Promise<Result<T>>) | null, key: string): Result<T> | null {
  const [state, setState] = useState<{ key: string; r: Result<T> } | null>(null);
  useEffect(() => {
    if (!load) return;
    let live = true;
    void load().then((r) => {
      if (live) setState({ key, r });
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` identifies the request
  }, [key]);
  return state?.key === key ? state.r : null;
}

const Note = ({ children }: { children: string }) => <p className="text-sm text-gray-600">{children}</p>;

// ── Where you stand ─────────────────────────────────────────────────────────────────────────
export function Standing({
  lang,
  reducedMotion,
  outcome,
  runId,
  runState,
  onStats,
}: {
  lang: Lang;
  reducedMotion: boolean;
  outcome: Outcome;
  runId: string | null;
  runState: RunState;
  onStats?: (s: Stats) => void;
}) {
  const b = BOARD_STRINGS[lang];
  const ready = runState === 'saved' || runState === 'none';
  const res = useFetch(ready ? () => fetchStats(runId, null) : null, `${runState}:${runId}`);
  useEffect(() => {
    if (res?.ok) onStats?.(res.data);
  }, [res, onStats]);

  let body: React.ReactNode;
  if (runState === 'failed' || (res && !res.ok)) body = <Note>{b.statsError}</Note>;
  else if (!res) body = <Note>{b.loadingStats}</Note>;
  else {
    const s = res.data;
    const me = outcome === 'won' && s.mine?.outcome === 'won' ? s.mine : null;
    let line: string;
    if (me && s.curve) {
      if (me.others > 0 && me.slower === me.others) line = b.fastestEver(me.others + 1);
      else if (me.others > 0 && me.slower === 0) line = b.slowestEver;
      else line = b.fasterThan(fasterThanPct(me));
    } else if (me) line = b.nthWinner(me.place ?? s.wins);
    else if (s.wins === 0) line = b.noWinsYet;
    else line = b.winShare(Math.round((100 * s.wins) / Math.max(1, s.runs)), s.wins, s.runs);
    body = (
      <>
        <p className="text-base font-semibold text-gray-900">{line}</p>
        {s.curve && (
          <div className="mt-3">
            <ResultsChart
              curve={s.curve}
              mineMs={me ? me.timeMs : null}
              lang={lang}
              reducedMotion={reducedMotion}
              title={me ? b.chartTitle : b.chartTitleLost}
            />
            {s.curve.offChart > 0 && <p className="text-[11px] text-gray-500">{b.offChart(s.curve.offChart, formatMinutes(s.curve.lo + s.curve.binMs * s.curve.counts.length))}</p>}
          </div>
        )}
        {me && s.curve && outcome === 'won' && me.place !== null && (
          <p className="mt-1 text-xs text-gray-500">{b.nthWinner(me.place)}</p>
        )}
      </>
    );
  }
  return (
    <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-3" data-testid="race-standing">
      {body}
    </div>
  );
}

// ── Leaderboard ─────────────────────────────────────────────────────────────────────────────
function useCountryName(lang: Lang) {
  return useMemo(() => {
    try {
      const names = new Intl.DisplayNames([lang === 'es' ? 'es-MX' : 'en'], { type: 'region' });
      return (code: string) => names.of(code) ?? code;
    } catch {
      return (code: string) => code;
    }
  }, [lang]);
}

function Row({ r, lang }: { r: BoardRow; lang: Lang }) {
  const b = BOARD_STRINGS[lang];
  const countryName = useCountryName(lang);
  return (
    <tr
      className={r.mine ? 'bg-blue-50 shadow-[inset_3px_0_0_#0070f3]' : 'border-t border-gray-100'}
      aria-current={r.mine ? 'true' : undefined}
    >
      <td className="py-2 pl-1 pr-1.5 text-right text-xs tabular-nums text-gray-500">{r.rank}</td>
      <td className="max-w-0 py-2 pr-2">
        <span className="flex items-center gap-1.5">
          <span className="w-5 shrink-0 text-center">
            {r.country ? (
              <span role="img" aria-label={countryName(r.country)} title={countryName(r.country)}>
                {flagOf(r.country)}
              </span>
            ) : (
              <span className="sr-only">{b.noCountry}</span>
            )}
          </span>
          <span className={`truncate text-gray-900 ${r.mine ? 'font-bold' : 'font-medium'}`}>{r.nickname}</span>
          {r.mine && (
            <span className="shrink-0 rounded-full bg-[#0070f3] px-1.5 py-px text-[10px] font-bold uppercase text-white max-sm:sr-only">
              {b.youTag}
            </span>
          )}
        </span>
      </td>
      <td className="py-2 pr-2 text-right text-xs font-medium tabular-nums text-gray-900">{formatTime(r.timeMs)}</td>
      <td className="py-2 pr-1 text-right text-xs tabular-nums text-gray-500">{r.losses}</td>
    </tr>
  );
}

export function Leaderboard({ lang, runId, initial }: { lang: Lang; runId: string | null; initial?: Board | null }) {
  const b = BOARD_STRINGS[lang];
  const fetched = useFetch(initial ? null : () => fetchBoard(runId), `board:${runId}`);
  const res: Result<Board> | null = initial ? { ok: true, data: initial } : fetched;
  if (!res) return <Note>{b.boardLoading}</Note>;
  if (!res.ok) return <Note>{b.boardError}</Note>;
  const { top, me, total } = res.data;
  if (top.length === 0) return <Note>{b.boardEmpty}</Note>;
  return (
    <div>
      <table className="w-full table-fixed border-collapse text-sm" data-testid="leaderboard">
        <caption className="sr-only">{b.boardCaption}</caption>
        <colgroup>
          <col className="w-7" />
          <col />
          <col className="w-[3.75rem]" />
          <col className="w-9" />
        </colgroup>
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-gray-500">
            <th scope="col" className="pb-1 pl-1 pr-1.5 text-right font-semibold">
              #<span className="sr-only"> {b.colRank}</span>
            </th>
            <th scope="col" className="pb-1 pl-[1.625rem] pr-2 text-left font-semibold">{b.colPlayer}</th>
            <th scope="col" className="pb-1 pr-2 text-right font-semibold">{b.colTime}</th>
            <th scope="col" className="pb-1 pr-1 text-right font-semibold">
              <abbr title={b.colLosses} className="no-underline">
                {lang === 'es' ? 'Der.' : 'L'}
              </abbr>
            </th>
          </tr>
        </thead>
        <tbody>
          {top.map((r) => (
            <Row key={r.rank} r={r} lang={lang} />
          ))}
          {me && (
            <>
              <tr aria-hidden>
                <td colSpan={4} className="py-0.5 text-center text-xs leading-none text-gray-400">
                  ⋯
                </td>
              </tr>
              <Row r={me} lang={lang} />
            </>
          )}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-gray-500">{b.boardTotal(total)}</p>
    </div>
  );
}

// ── Join form ───────────────────────────────────────────────────────────────────────────────
export function JoinForm({
  lang,
  runId,
  token,
  suggestedCountry,
  onBack,
  onJoined,
}: {
  lang: Lang;
  runId: string;
  token: string;
  suggestedCountry: string | null;
  onBack: () => void;
  onJoined: (board: Board | null, nickname: string) => void;
}) {
  const b = BOARD_STRINGS[lang];
  const uid = useId();
  const countryName = useCountryName(lang);
  const [nickname, setNickname] = useState(() => randomNickname(lang));
  const [country, setCountry] = useState(suggestedCountry ?? '');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const countries = useMemo(
    () => COUNTRY_CODES.map((c) => ({ c, name: countryName(c) })).sort((p, q) => p.name.localeCompare(q.name, lang)),
    [countryName, lang],
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending) return;
    const err = nicknameError(nickname);
    if (err) return setError(b.errors[err]);
    setError(null);
    setSending(true);
    const r = await attachNickname({ id: runId, token, nickname, country: country || null });
    setSending(false);
    if (!r.ok) {
      const key = r.error as keyof typeof b.errors;
      return setError(b.errors[key] ?? b.errors.generic);
    }
    onJoined(r.data.board, nickname);
  };

  const field = 'mt-1 block min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-base text-gray-900 focus:border-[#0070f3] focus:outline-none focus:ring-2 focus:ring-[#0070f3]/30';
  return (
    <form onSubmit={submit} noValidate className="mt-3 space-y-4">
      <div>
        <label htmlFor={`${uid}-nick`} className="text-sm font-semibold text-gray-900">
          {b.nickname}
        </label>
        <div className="flex items-start gap-2">
          <input
            id={`${uid}-nick`}
            data-view-focus
            type="text"
            value={nickname}
            maxLength={NICK_MAX + 4}
            autoComplete="nickname"
            spellCheck={false}
            aria-describedby={`${uid}-hint${error ? ` ${uid}-err` : ''}`}
            aria-invalid={error ? true : undefined}
            onChange={(e) => setNickname(e.target.value)}
            className={field}
          />
          <button
            type="button"
            onClick={() => setNickname((n) => randomNickname(lang, Math.random, n))}
            className={`${btnSecondary} mt-1 shrink-0 px-3`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
              <rect x="1.5" y="1.5" width="13" height="13" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="5.2" cy="5.2" r="1.2" fill="currentColor" />
              <circle cx="10.8" cy="10.8" r="1.2" fill="currentColor" />
              <circle cx="8" cy="8" r="1.2" fill="currentColor" />
            </svg>
            {b.rollAnother}
          </button>
        </div>
        <p id={`${uid}-hint`} className="mt-1 text-xs text-gray-500">
          {b.nickHint}
        </p>
      </div>
      <div>
        <label htmlFor={`${uid}-country`} className="text-sm font-semibold text-gray-900">
          {b.country}
        </label>
        <select id={`${uid}-country`} value={country} onChange={(e) => setCountry(e.target.value)} className={field}>
          <option value="">{b.preferNot}</option>
          {countries.map(({ c, name }) => (
            <option key={c} value={c}>
              {`${flagOf(c)} ${name}`}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p id={`${uid}-err`} role="alert" className="text-sm font-medium text-red-700">
          {error}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onBack} className={btnGhost}>
          {b.back}
        </button>
        <button type="submit" aria-disabled={sending} className={`${btnPrimary} aria-disabled:opacity-60`} data-testid="board-save">
          {sending ? b.saving : b.save}
        </button>
      </div>
    </form>
  );
}
