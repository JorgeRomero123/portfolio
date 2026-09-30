'use client';

// Landmark prompt: section name + tagline, Play / Just look (+ Keep going when only passing).
// Docked at the bottom so the pawn stays visible.
import { sectionById } from '../content';
import { FLOW_STRINGS, STRINGS } from '../strings';
import type { Lang, SectionId } from '../types';
import { Dialog, cardClass } from '../hud/Dialog';
import { StampSeal, btnPrimary, btnSecondary } from './ui';

export function Prompt({
  section,
  landed,
  stamped,
  lang,
  reducedMotion,
  onPlay,
  onLook,
  onContinue,
}: {
  section: SectionId;
  landed: boolean;
  stamped: boolean;
  lang: Lang;
  reducedMotion: boolean;
  onPlay: () => void;
  onLook: () => void;
  onContinue: () => void;
}) {
  const s = STRINGS[lang];
  const f = FLOW_STRINGS[lang];
  const sec = sectionById(section);
  return (
    <Dialog
      labelledBy="tg-landmark-title"
      describedBy="tg-landmark-desc"
      onClose={onContinue}
      reducedMotion={reducedMotion}
      panelClassName={`${cardClass} w-full max-w-md overflow-hidden`}
      backdropClassName="bg-transparent"
      placement="bottom"
    >
      <div className="h-1.5" style={{ background: sec.color }} aria-hidden />
      <div className="flex gap-3 p-5 pb-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-gray-500">
            {landed ? s.landedOn(sec.title[lang]) : s.passing(sec.title[lang])}
          </p>
          <h2 id="tg-landmark-title" className="mt-0.5 text-xl font-bold tracking-tight text-gray-900">
            {sec.title[lang]}
          </h2>
          <p id="tg-landmark-desc" className="mt-1 text-sm text-gray-600">
            {sec.tagline[lang]}
          </p>
          <p className="mt-2 text-xs font-medium text-gray-500">
            {sec.game.name[lang]} · {stamped ? `✓ ${f.stampEarned}` : f.playHint}
          </p>
        </div>
        <StampSeal section={section} lang={lang} earned={stamped} size={56} className="shrink-0" />
      </div>
      <div className={`grid gap-2 px-5 pb-5 ${landed ? 'grid-cols-2' : 'grid-cols-3'}`}>
        <button type="button" data-testid="prompt-play" data-autofocus onClick={onPlay} className={btnPrimary}>
          {s.play}
        </button>
        <button type="button" data-testid="prompt-look" onClick={onLook} className={`${btnSecondary} px-2`}>
          {s.justLook}
        </button>
        {!landed && (
          <button type="button" data-testid="prompt-continue" onClick={onContinue} className={`${btnSecondary} px-2`}>
            {s.keepGoing}
          </button>
        )}
      </div>
    </Dialog>
  );
}
