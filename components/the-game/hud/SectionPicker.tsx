'use client';

// Bullseye reward: pick any of the 11 sections. Buttons are tabbable; arrow keys / Home / End move too.
import { useRef, type KeyboardEvent } from 'react';
import { SECTIONS } from '../content';
import { STRINGS } from '../strings';
import type { Lang, SectionId } from '../types';
import { Dialog, cardClass, focusRing } from './Dialog';

export function arrowNav(e: KeyboardEvent<HTMLElement>, container: HTMLElement | null) {
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

export function SectionPicker({
  lang,
  reducedMotion,
  current,
  onPick,
  onClose,
}: {
  lang: Lang;
  reducedMotion: boolean;
  current: SectionId;
  onPick: (id: SectionId) => void;
  onClose: () => void;
}) {
  const s = STRINGS[lang];
  const grid = useRef<HTMLDivElement>(null);
  return (
    <Dialog
      labelledBy="tg-pick-section-title"
      describedBy="tg-pick-section-hint"
      onClose={onClose}
      reducedMotion={reducedMotion}
      panelClassName={`${cardClass} w-full max-w-lg p-5 max-h-full overflow-y-auto`}
    >
      <h2 id="tg-pick-section-title" className="text-xl font-bold tracking-tight text-gray-900">
        {s.pickSectionTitle}
      </h2>
      <p id="tg-pick-section-hint" className="mt-1 text-sm text-gray-600">
        {s.pickSectionHint}
      </p>
      <div ref={grid} className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3" onKeyDown={(e) => arrowNav(e, grid.current)}>
        {SECTIONS.map((sec) => (
          <button
            key={sec.id}
            type="button"
            data-pick
            data-autofocus={sec.id === current ? true : undefined}
            onClick={() => onPick(sec.id)}
            className={`flex min-h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-sm font-medium text-gray-900 transition-colors hover:border-gray-400 hover:bg-gray-50 ${focusRing}`}
          >
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: sec.color }} aria-hidden />
            <span className="leading-tight">{sec.title[lang]}</span>
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
