'use client';

// TEMPORARY landmark prompt (task 1). Task 2 replaces this with the real section card,
// mini-game host and prize wheel behind the same LandmarkHandler signature.
import { useCallback, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { sectionById } from '../content';
import { STRINGS } from '../strings';
import type { Lang, LandmarkChoice, LandmarkHandler, SectionId } from '../types';
import { Dialog, cardClass, focusRing } from './Dialog';

interface Pending {
  section: SectionId;
  landed: boolean;
  resolve: (c: LandmarkChoice) => void;
}

export function useLandmarkPrompt(lang: Lang, reducedMotion: boolean) {
  const [pending, setPending] = useState<Pending | null>(null);
  const pendingRef = useRef<Pending | null>(null);

  const prompt = useCallback<LandmarkHandler>(
    (section, { landed }) =>
      new Promise<LandmarkChoice>((resolve) => {
        const p = { section, landed, resolve };
        pendingRef.current = p;
        setPending(p);
      }),
    [],
  );

  const choose = useCallback((c: LandmarkChoice) => {
    const p = pendingRef.current;
    pendingRef.current = null;
    setPending(null);
    if (c !== 'continue') console.info(`[the-game] landmark "${p?.section}": ${c} (placeholder until task 2)`);
    p?.resolve(c);
  }, []);

  const s = STRINGS[lang];
  const sec = pending ? sectionById(pending.section) : null;
  const node = (
    <AnimatePresence>
      {pending && sec && (
        <Dialog
          key="landmark"
          labelledBy="tg-landmark-title"
          describedBy="tg-landmark-desc"
          onClose={() => choose('continue')}
          reducedMotion={reducedMotion}
          panelClassName={`${cardClass} w-full max-w-sm p-5`}
          backdropClassName="bg-transparent"
          placement="bottom"
        >
          <div className="mb-3 h-1.5 w-12 rounded-full" style={{ background: sec.color }} aria-hidden />
          <h2 id="tg-landmark-title" className="text-xl font-bold tracking-tight text-gray-900">
            {sec.title[lang]}
          </h2>
          <p id="tg-landmark-desc" className="mt-1 text-sm text-gray-600">
            {pending.landed ? s.landedOn(sec.title[lang]) : s.passing(sec.title[lang])}
          </p>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <button
              type="button"
              data-autofocus
              onClick={() => choose('play')}
              className={`min-h-11 rounded-xl bg-[#0070f3] px-3 text-sm font-semibold text-white hover:bg-[#0060d0] ${focusRing}`}
            >
              {s.play}
            </button>
            <button
              type="button"
              onClick={() => choose('look')}
              className={`min-h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-900 hover:border-gray-400 ${focusRing}`}
            >
              {s.justLook}
            </button>
            <button
              type="button"
              onClick={() => choose('continue')}
              className={`min-h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-900 hover:border-gray-400 ${focusRing}`}
            >
              {s.keepGoing}
            </button>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );

  return { prompt, node };
}
