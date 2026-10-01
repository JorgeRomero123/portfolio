'use client';

// Top HUD: title, skip link and the race against Jorge on the left; passport, view, language and
// sound toggles on the right.
import { RIVAL_LAP } from '../race';
import { STRINGS } from '../strings';
import type { Lang, RaceStatus } from '../types';
import type { ViewMode } from '../board/types';
import { focusRing } from './Dialog';
import { LangToggle } from './LangToggle';

export const iconButton =
  'inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white/90 px-3 text-gray-800 shadow-sm transition-colors hover:border-gray-400 hover:text-gray-950';

function BoardIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden>
      <path d="M3 7V4a1 1 0 0 1 1-1h3M13 3h3a1 1 0 0 1 1 1v3M17 13v3a1 1 0 0 1-1 1h-3M7 17H4a1 1 0 0 1-1-1v-3" strokeLinecap="round" />
      <rect x="6.5" y="6.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function PawnIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden>
      <circle cx="10" cy="5.2" r="2.7" />
      <path d="M7.6 9h4.8l-.9 4.2h1.8c.9 0 1.7.7 1.7 1.6V17H5v-2.2c0-.9.8-1.6 1.7-1.6h1.8z" />
    </svg>
  );
}
function PassportIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden>
      <rect x="4" y="2.5" width="12" height="15" rx="2" />
      <circle cx="10" cy="9" r="3" />
      <path d="M7 14h6" strokeLinecap="round" />
    </svg>
  );
}
function FlagIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px] shrink-0" aria-hidden>
      <path d="M5 2.5v15" stroke="#1f2937" strokeWidth={1.8} strokeLinecap="round" />
      <path d="M6 3.5h9.5l-2.6 3.2 2.6 3.3H6z" fill="#dc2626" />
    </svg>
  );
}
function SoundIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden>
      <path d="M3.5 8v4h3l4 3.5v-11l-4 3.5z" fill="currentColor" strokeLinejoin="round" />
      {on ? (
        <path d="M13.5 7.2a4 4 0 0 1 0 5.6M15.6 5.2a7 7 0 0 1 0 9.6" strokeLinecap="round" />
      ) : (
        <path d="M13.5 8l4 4M17.5 8l-4 4" strokeLinecap="round" />
      )}
    </svg>
  );
}

export function TopBar({
  lang,
  view,
  onToggleView,
  soundOn,
  onToggleSound,
  stampCount,
  onOpenPassport,
  race,
  rivalSteps,
  onOpenRace,
}: {
  lang: Lang;
  view: ViewMode;
  onToggleView: () => void;
  soundOn: boolean;
  onToggleSound: () => void;
  stampCount: number;
  onOpenPassport: () => void;
  race: RaceStatus;
  /** Tiles Jorge's pawn has covered, as currently shown on the board. */
  rivalSteps: number;
  onOpenRace: () => void;
}) {
  const s = STRINGS[lang];
  const viewLabel = view === 'follow' ? s.viewBoard : s.followPawn;
  const lapDone = Math.max(0, Math.min(RIVAL_LAP, rivalSteps));
  const raceText = race === 'won' ? s.raceChipWon : race === 'lost' ? s.raceChipLost : s.raceChip(lapDone, RIVAL_LAP);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-3 sm:p-4">
      <div className="pointer-events-auto flex min-w-0 flex-col items-start gap-2">
        <div className="rounded-2xl border border-gray-200 bg-white/90 px-4 py-3 shadow-sm max-sm:sr-only">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#0070f3]">Jorge Romero Romanis</p>
          <h1 id="the-game-title" className="text-xl font-bold tracking-tight text-gray-900">
            {s.title}
          </h1>
          <p className="mt-0.5 max-w-[16rem] text-sm text-gray-600">{s.hint}</p>
        </div>
        <a
          href="#overview"
          data-testid="skip-game"
          onClick={() => {
            // Move keyboard focus with the jump (the target has tabIndex -1).
            window.setTimeout(() => document.getElementById('overview')?.focus({ preventScroll: true }), 0);
          }}
          className={`inline-flex h-11 items-center gap-1.5 rounded-xl border border-gray-200 bg-white/90 px-3 text-sm font-semibold text-gray-800 shadow-sm hover:border-gray-400 ${focusRing}`}
        >
          {s.skip}
          <span aria-hidden>↓</span>
        </a>
        <button
          type="button"
          data-testid="race-chip"
          aria-label={`${raceText}. ${s.raceAria}`}
          onClick={onOpenRace}
          className={`inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white/90 px-3 text-sm font-semibold text-gray-800 shadow-sm hover:border-gray-400 ${focusRing}`}
        >
          <FlagIcon />
          <span className="tabular-nums">{raceText}</span>
          {race === 'running' && (
            <span className="h-1.5 w-12 overflow-hidden rounded-full bg-gray-200" aria-hidden>
              <span className="block h-full rounded-full bg-gray-800" style={{ width: `${(lapDone / RIVAL_LAP) * 100}%` }} />
            </span>
          )}
        </button>
      </div>
      <div className="pointer-events-auto flex shrink-0 gap-2">
        <button
          type="button"
          data-testid="passport"
          aria-label={s.passportAria(stampCount, 11)}
          onClick={onOpenPassport}
          className={`${iconButton} relative ${focusRing}`}
        >
          <PassportIcon />
          <span className="hidden text-sm font-semibold lg:inline">{s.passport}</span>
          <span
            aria-hidden
            className={`absolute -right-1.5 -top-1.5 min-w-5 rounded-full px-1 text-center text-[11px] font-bold leading-5 tabular-nums ${
              stampCount > 0 ? 'bg-[#0070f3] text-white' : 'border border-gray-200 bg-white text-gray-500'
            }`}
          >
            {stampCount}
          </span>
        </button>
        <button
          type="button"
          data-testid="view-board"
          aria-label={viewLabel}
          title={`${viewLabel} (V)`}
          onClick={onToggleView}
          className={`${iconButton} ${focusRing}`}
        >
          {view === 'follow' ? <BoardIcon /> : <PawnIcon />}
          <span className="hidden text-sm font-semibold lg:inline">{viewLabel}</span>
        </button>
        <LangToggle />
        <button
          type="button"
          data-testid="sound-toggle"
          aria-label={soundOn ? s.soundOnAria : s.soundOffAria}
          onClick={onToggleSound}
          className={`${iconButton} ${focusRing} ${soundOn ? 'text-[#0070f3]' : ''}`}
        >
          <SoundIcon on={soundOn} />
        </button>
      </div>
    </div>
  );
}
