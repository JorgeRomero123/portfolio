'use client';

// Bottom HUD: status line, extras (only when > 0) and the two turn actions.
import { STRINGS } from '../strings';
import type { Lang } from '../types';
import { focusRing } from './Dialog';

function DieIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
      <rect x="2.5" y="2.5" width="15" height="15" rx="3.5" fill="none" stroke="currentColor" strokeWidth={1.7} />
      <circle cx="7" cy="7" r="1.4" fill="currentColor" />
      <circle cx="10" cy="10" r="1.4" fill="currentColor" />
      <circle cx="13" cy="13" r="1.4" fill="currentColor" />
    </svg>
  );
}
function DartIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden>
      <circle cx="9" cy="11" r="6.5" />
      <circle cx="9" cy="11" r="2.8" />
      <path d="M9 11l8-8M14 3h3v3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TurnControls({
  lang,
  disabled,
  status,
  freeMoves,
  bonusDarts,
  onRoll,
  onDart,
  onFreeMove,
  onSteadyDart,
}: {
  lang: Lang;
  disabled: boolean;
  status: string;
  freeMoves: number;
  bonusDarts: number;
  onRoll: () => void;
  onDart: () => void;
  onFreeMove: () => void;
  onSteadyDart: () => void;
}) {
  const s = STRINGS[lang];
  const extra = `inline-flex h-11 items-center rounded-full border border-[#0070f3]/30 bg-white/95 px-4 text-sm font-semibold text-[#0070f3] shadow-sm hover:border-[#0070f3] disabled:opacity-50 ${focusRing}`;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-5">
      <p
        aria-live="polite"
        className={`rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-gray-900 shadow-sm transition-opacity ${
          status ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {status || ' '}
      </p>
      {(freeMoves > 0 || bonusDarts > 0) && (
        <div className="pointer-events-auto flex flex-wrap justify-center gap-2">
          {freeMoves > 0 && (
            <button type="button" data-testid="free-move" className={extra} disabled={disabled} onClick={onFreeMove}>
              {s.freeMove(freeMoves)}
            </button>
          )}
          {bonusDarts > 0 && (
            <button type="button" data-testid="steady-dart" className={extra} disabled={disabled} onClick={onSteadyDart}>
              {s.steadyDart(bonusDarts)}
            </button>
          )}
        </div>
      )}
      <div className="pointer-events-auto flex w-full max-w-md gap-2 rounded-2xl border border-gray-200 bg-white/95 p-2 shadow-[0_10px_40px_rgba(15,23,42,0.12)]">
        <button
          type="button"
          data-testid="roll-dice"
          onClick={onRoll}
          disabled={disabled}
          aria-keyshortcuts="R"
          className={`inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0070f3] px-4 text-[15px] font-semibold text-white transition-[background-color,transform] duration-300 hover:bg-[#0060d0] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#0070f3]/45 ${focusRing}`}
        >
          <DieIcon />
          {s.roll}
        </button>
        <button
          type="button"
          data-testid="throw-dart"
          onClick={onDart}
          disabled={disabled}
          aria-keyshortcuts="D"
          className={`inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-[15px] font-semibold text-gray-900 transition-[border-color,transform] duration-300 hover:border-gray-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:text-gray-400 ${focusRing}`}
        >
          <DartIcon />
          {s.throwDart}
        </button>
      </div>
      <p className="hidden font-mono text-[11px] text-gray-500 sm:block">{s.shortcuts}</p>
    </div>
  );
}
