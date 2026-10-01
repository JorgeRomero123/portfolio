'use client';

// The race against Jorge's pawn: rules and standings while it's on; once it's over, the results
// screen (time or stamps, then where that stands against everyone else). A winner then gets
// confetti and the leaderboard opt-in. The leaderboard itself is one tap away in every state.
//
//   running: rules ─ Leaderboard ─▶ board
//   won:     results ─ Continue ─▶ ask ─ Yes ─▶ form ─ Save ─▶ board
//                                     └ No thanks ─▶ results (nothing about the run changes)
//   lost:    results ─ Race again (primary) / Leaderboard
//
// The data-driven panels are loaded with next/dynamic, so the game's main bundle only carries this
// shell. If the API fails, each panel shows one plain sentence and everything else still works.
import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { RIVAL_LAP } from '../race';
import { TOTAL_STAMPS } from '../rewards';
import { BOARD_STRINGS, STRINGS } from '../strings';
import type { BoardChoice, Lang, RaceStatus } from '../types';
import { btnGhost, btnPrimary, btnSecondary } from '../overlays/ui';
import { formatTime } from '../leaderboard/rules';
import type { RunState } from '../leaderboard/panels';
import type { Board, Stats } from '../leaderboard/stats';
import { Dialog, cardClass } from './Dialog';

const loadPanels = () => import('../leaderboard/panels');
const Standing = dynamic(() => loadPanels().then((m) => m.Standing), { ssr: false, loading: () => null });
const Leaderboard = dynamic(() => loadPanels().then((m) => m.Leaderboard), { ssr: false, loading: () => null });
const JoinForm = dynamic(() => loadPanels().then((m) => m.JoinForm), { ssr: false, loading: () => null });

type View = 'main' | 'ask' | 'form' | 'board';

export function RaceDialog({
  lang,
  reducedMotion,
  race,
  rivalSteps,
  stamps,
  losses,
  timeMs,
  runId,
  runToken,
  runState,
  boardChoice,
  onBoardChoice,
  onCelebrate,
  onRaceAgain,
  onClose,
}: {
  lang: Lang;
  reducedMotion: boolean;
  race: RaceStatus;
  rivalSteps: number;
  stamps: number;
  losses: number;
  /** Final race time, null for a race without a clock. */
  timeMs: number | null;
  runId: string | null;
  runToken: string | null;
  runState: RunState;
  boardChoice: BoardChoice;
  onBoardChoice: (c: BoardChoice) => void;
  /** The winner moves on from the results: the shell fires confetti over the whole stage. */
  onCelebrate: () => void;
  onRaceAgain: () => void;
  onClose: () => void;
}) {
  const s = STRINGS[lang];
  const b = BOARD_STRINGS[lang];
  const over = race !== 'running';
  const canRestart = over || stamps > 0 || rivalSteps !== 0;
  const [view, setView] = useState<View>('main');
  const [board, setBoard] = useState<Board | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [announce, setAnnounce] = useState('');
  const body = useRef<HTMLDivElement>(null);
  const firstView = useRef(true);

  // Move focus into each new view (the Dialog handles the first one and the focus trap).
  useEffect(() => {
    if (firstView.current) {
      firstView.current = false;
      return;
    }
    // Lazily loaded panels (the join form) can mount a few frames late: wait for the target.
    let raf = 0;
    let tries = 0;
    const claim = () => {
      const el = body.current?.querySelector<HTMLElement>('[data-view-focus]');
      if (el) el.focus({ preventScroll: true });
      else if (tries++ < 60) raf = requestAnimationFrame(claim);
    };
    claim();
    return () => cancelAnimationFrame(raf);
  }, [view]);

  const onStats = useCallback((st: Stats) => setCountry(st.country), []);
  const canJoin = race === 'won' && runState === 'saved' && !!runId && !!runToken;
  const askPending = canJoin && boardChoice === 'ask';

  const title =
    view === 'board'
      ? b.boardTitle
      : view === 'ask'
        ? b.askTitle
        : view === 'form'
          ? b.formTitle
          : race === 'won'
            ? s.raceWonTitle
            : race === 'lost'
              ? s.raceLostTitle
              : s.raceTitle;

  const headingClass = 'text-xl font-bold tracking-tight text-gray-900 outline-none';
  const raceAgainBtn = (primary: boolean) =>
    canRestart && (
      <button type="button" data-testid="race-again" onClick={onRaceAgain} className={primary ? btnPrimary : btnSecondary}>
        {s.raceAgain}
      </button>
    );
  const boardBtn = (
    <button type="button" data-testid="race-leaderboard" onClick={() => setView('board')} className={btnGhost}>
      {b.leaderboard}
    </button>
  );

  return (
    <Dialog
      labelledBy="tg-race-title"
      describedBy="tg-race-body"
      onClose={onClose}
      reducedMotion={reducedMotion}
      panelClassName={`${cardClass} max-h-full w-full max-w-md overflow-y-auto overscroll-contain`}
    >
      <div className="h-1.5" style={{ background: race === 'lost' ? '#1f2937' : '#0070f3' }} aria-hidden />
      <div ref={body} className="p-5">
        <p className="sr-only" role="status" aria-live="polite">
          {announce}
        </p>

        {view === 'main' && (
          <>
            <h2 id="tg-race-title" className={headingClass}>
              {title}
            </h2>
            <div id="tg-race-body" className="mt-2 text-sm text-gray-600">
              {race === 'won' && (
                <>
                  {timeMs !== null ? (
                    <div className="mt-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#0070f3]">{b.yourTime}</p>
                      <p className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl" data-testid="race-time">
                        {formatTime(timeMs)}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2">{b.untimed}</p>
                  )}
                  <p className="mt-2">
                    {s.raceWonBody(RIVAL_LAP - rivalSteps)} {b.losses(losses)}.
                  </p>
                </>
              )}
              {race === 'lost' && (
                <>
                  <div className="mt-3">
                    <p className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl" data-testid="race-stamps">
                      {b.stampsOf(stamps, TOTAL_STAMPS)}
                    </p>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{b.stampsLabel}</p>
                  </div>
                  <p className="mt-2">{timeMs !== null ? b.yourRace(formatTime(timeMs), losses) : s.raceLostBody}</p>
                </>
              )}
              {!over && (
                <div className="space-y-2">
                  {s.raceRules.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                  <p className="font-mono text-xs font-semibold text-gray-900">
                    {s.raceStanding(rivalSteps, RIVAL_LAP, stamps, TOTAL_STAMPS)}
                  </p>
                </div>
              )}
            </div>
            {over && (
              <Standing
                lang={lang}
                reducedMotion={reducedMotion}
                outcome={race}
                runId={runId}
                runState={runState}
                onStats={onStats}
              />
            )}
            {race === 'won' && runState === 'failed' && <p className="mt-2 text-xs text-gray-500">{b.runNotSaved}</p>}
            {canRestart && <p className="mt-3 text-xs text-gray-500">{s.raceAgainNote}</p>}
            {/* Phones: the primary action spans the row, the other two share the row below. */}
            <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
              {race === 'lost' ? (
                <>
                  <button type="button" data-testid="race-again" data-autofocus data-view-focus onClick={onRaceAgain} className={`${btnPrimary} col-span-2 sm:order-last`}>
                    {s.raceAgain}
                  </button>
                  {boardBtn}
                  <button type="button" data-testid="race-close" onClick={onClose} className={btnSecondary}>
                    {s.raceKeepExploring}
                  </button>
                </>
              ) : (
                <>
                  {askPending ? (
                    <button type="button" data-testid="race-continue" data-autofocus data-view-focus onClick={() => {
                        onCelebrate();
                        setView('ask');
                      }} className={`${btnPrimary} col-span-2 sm:order-last`}>
                      {b.continue}
                    </button>
                  ) : (
                    <button type="button" data-testid="race-close" data-autofocus data-view-focus onClick={onClose} className={`${btnPrimary} ${canRestart ? 'col-span-2' : ''} sm:order-last`}>
                      {over ? s.raceKeepExploring : s.raceGotIt}
                    </button>
                  )}
                  {boardBtn}
                  {raceAgainBtn(false)}
                </>
              )}
            </div>
          </>
        )}

        {view === 'ask' && (
          <div className="py-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#0070f3]">{b.askKicker}</p>
            <p className="mt-1 text-4xl font-bold tracking-tight text-gray-900">{timeMs !== null ? formatTime(timeMs) : ''}</p>
            <h2 id="tg-race-title" tabIndex={-1} className={`${headingClass} mt-4`}>
              {title}
            </h2>
            <p className="mx-auto mt-2 max-w-xs text-sm text-gray-600">{b.askBody}</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                data-testid="board-no"
                onClick={() => {
                  onBoardChoice('declined');
                  setView('main');
                }}
                className={btnSecondary}
              >
                {b.askNo}
              </button>
              <button type="button" data-testid="board-yes" data-view-focus onClick={() => setView('form')} className={btnPrimary}>
                {b.askYes}
              </button>
            </div>
          </div>
        )}

        {view === 'form' && runId && runToken && (
          <>
            <h2 id="tg-race-title" tabIndex={-1} className={headingClass}>
              {title}
            </h2>
            <JoinForm
              lang={lang}
              runId={runId}
              token={runToken}
              suggestedCountry={country}
              onBack={() => setView('ask')}
              onJoined={(bd) => {
                onBoardChoice('joined');
                setBoard(bd);
                const rank = bd?.top.find((r) => r.mine)?.rank ?? bd?.me?.rank;
                setAnnounce(rank ? b.saved(rank) : b.savedPlain);
                setView('board');
              }}
            />
          </>
        )}

        {view === 'board' && (
          <>
            <h2 id="tg-race-title" tabIndex={-1} data-view-focus className={headingClass}>
              {title}
            </h2>
            {announce && <p className="mt-1 text-sm font-semibold text-[#0070f3]">{announce}</p>}
            <div className="mt-3">
              <Leaderboard lang={lang} runId={runId} initial={board} />
            </div>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setView('main')} className={btnSecondary}>
                {b.back}
              </button>
              <button type="button" onClick={onClose} className={btnPrimary}>
                {over ? s.raceKeepExploring : s.raceGotIt}
              </button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
