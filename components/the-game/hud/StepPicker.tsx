'use client';

// Free move: choose exactly 1–6 spaces.
import { useRef, type KeyboardEvent } from 'react';
import { STRINGS } from '../strings';
import type { Lang } from '../types';
import { Dialog, cardClass, focusRing } from './Dialog';

function arrowNav(e: KeyboardEvent<HTMLElement>, container: HTMLElement | null) {
  if (!container) return;
  const items = Array.from(container.querySelectorAll<HTMLButtonElement>('button[data-pick]'));
  const i = items.indexOf(document.activeElement as HTMLButtonElement);
  if (i < 0) return;
  const next =
    e.key === 'ArrowRight' || e.key === 'ArrowDown'
      ? (i + 1) % items.length
      : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
        ? (i - 1 + items.length) % items.length
        : e.key === 'Home'
          ? 0
          : e.key === 'End'
            ? items.length - 1
            : -1;
  if (next < 0) return;
  e.preventDefault();
  items[next].focus();
}

export function StepPicker({
  lang,
  reducedMotion,
  onPick,
  onClose,
}: {
  lang: Lang;
  reducedMotion: boolean;
  onPick: (n: number) => void;
  onClose: () => void;
}) {
  const s = STRINGS[lang];
  const row = useRef<HTMLDivElement>(null);
  return (
    <Dialog
      labelledBy="tg-pick-steps-title"
      describedBy="tg-pick-steps-hint"
      onClose={onClose}
      reducedMotion={reducedMotion}
      panelClassName={`${cardClass} w-full max-w-sm p-5`}
    >
      <h2 id="tg-pick-steps-title" className="text-xl font-bold tracking-tight text-gray-900">
        {s.pickStepsTitle}
      </h2>
      <p id="tg-pick-steps-hint" className="mt-1 text-sm text-gray-600">
        {s.pickStepsHint}
      </p>
      <div ref={row} className="mt-4 grid grid-cols-6 gap-2" onKeyDown={(e) => arrowNav(e, row.current)}>
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <button
            key={n}
            type="button"
            data-pick
            data-autofocus={n === 1 ? true : undefined}
            aria-label={s.steps(n)}
            onClick={() => onPick(n)}
            className={`min-h-11 rounded-xl border border-gray-200 bg-white text-lg font-bold text-gray-900 tabular-nums hover:border-[#0070f3] hover:text-[#0070f3] ${focusRing}`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className={`min-h-11 rounded-xl px-4 text-sm font-medium text-gray-600 hover:text-gray-900 ${focusRing}`}
        >
          {s.cancel}
        </button>
      </div>
    </Dialog>
  );
}
