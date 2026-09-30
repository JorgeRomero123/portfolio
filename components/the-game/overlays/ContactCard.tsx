'use client';

// Final reward for all 11 stamps: a celebratory contact card. Shown once when the 11th stamp lands
// (FinalReward dialog) and always in the passport afterwards.
import { GAME_CONTENT } from '../content';
import { FLOW_STRINGS } from '../strings';
import type { Lang } from '../types';
import { Dialog, focusRing } from '../hud/Dialog';
import { Confetti, btnSecondary, sheetPanel } from './ui';

const C = GAME_CONTENT.contact;

export function ContactCard({ lang, headingId, as: H = 'h3' }: { lang: Lang; headingId?: string; as?: 'h2' | 'h3' }) {
  const f = FLOW_STRINGS[lang];
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#0070f3] p-5 text-white shadow-md sm:p-6">
      <svg viewBox="0 0 200 120" className="pointer-events-none absolute -right-6 -top-4 h-40 w-64 opacity-30" aria-hidden>
        <polygon points="80,0 200,0 150,60" fill="#fff" opacity="0.5" />
        <polygon points="150,60 200,0 200,120" fill="#fff" opacity="0.25" />
        <polygon points="110,120 150,60 200,120" fill="#fff" opacity="0.4" />
        <polygon points="80,0 150,60 110,120" fill="#fff" opacity="0.15" />
      </svg>
      <p className="relative font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-white/80">{f.finalKicker}</p>
      <H id={headingId} className="relative mt-1 text-2xl font-bold tracking-tight">
        {f.finalTitle}
      </H>
      <p className="relative mt-2 text-sm leading-relaxed text-white/90">{f.finalBody}</p>
      <div className="relative mt-4 flex flex-wrap gap-2">
        <a
          href={`mailto:${C.email}`}
          className={`inline-flex min-h-11 items-center rounded-xl bg-white px-4 text-sm font-semibold text-[#0070f3] hover:bg-blue-50 ${focusRing}`}
        >
          {f.emailJorge} · {C.email}
        </a>
        <a
          href={C.aboutHref}
          className={`inline-flex min-h-11 items-center rounded-xl border border-white/40 px-4 text-sm font-semibold text-white hover:bg-white/10 ${focusRing}`}
        >
          {C.aboutLabel[lang]} →
        </a>
        <a
          href={C.homeContactHref}
          className={`inline-flex min-h-11 items-center rounded-xl border border-white/40 px-4 text-sm font-semibold text-white hover:bg-white/10 ${focusRing}`}
        >
          {C.homeLabel[lang]}
        </a>
      </div>
    </div>
  );
}

export function FinalReward({
  lang,
  reducedMotion,
  onNext,
}: {
  lang: Lang;
  reducedMotion: boolean;
  onNext: () => void;
}) {
  const f = FLOW_STRINGS[lang];
  return (
    <Dialog
      labelledBy="tg-final-title"
      onClose={onNext}
      reducedMotion={reducedMotion}
      placement="sheet"
      backdropClassName="bg-gray-900/40 backdrop-blur-sm"
      panelClassName={`${sheetPanel} relative max-h-[calc(100%-0.75rem)] overflow-y-auto p-4 sm:max-w-lg`}
    >
      <Confetti colors={['#0070f3', '#facc15', '#ec4899', '#16a34a', '#f97316', '#7c3aed']} reducedMotion={reducedMotion} />
      <ContactCard lang={lang} headingId="tg-final-title" as="h2" />
      <div className="mt-3 flex justify-end">
        <button type="button" data-autofocus onClick={onNext} className={btnSecondary}>
          {f.continue}
        </button>
      </div>
    </Dialog>
  );
}
