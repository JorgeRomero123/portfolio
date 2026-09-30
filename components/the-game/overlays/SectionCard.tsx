'use client';

// Section card: shown on "Just look" and after every mini-game. Colour header, Jorge's card copy,
// links, fun facts (never TODO placeholders), the story card once unlocked, stamp status and Play.
import { facts, links, sectionById, story } from '../content';
import { visibleFactCount } from '../rewards';
import { FLOW_STRINGS, STRINGS } from '../strings';
import type { Lang, Progress, SectionId } from '../types';
import { Dialog, focusRing } from '../hud/Dialog';
import { Facets, StampSeal, btnPrimary, btnSecondary, extLink, sectionIndex, shade, sheetPanel } from './ui';

export function StoryBlock({ section, lang }: { section: SectionId; lang: Lang }) {
  const f = FLOW_STRINGS[lang];
  const st = story(sectionById(section));
  if (!st) return null;
  const color = sectionById(section).color;
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm" style={{ borderLeft: `4px solid ${color}` }}>
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">{f.storyCard}</p>
      <h3 className="mt-1 text-base font-bold text-gray-900">{st.title[lang]}</h3>
      <p className="mt-1 text-sm leading-relaxed text-gray-600">{st.body[lang]}</p>
      <a
        href={st.href}
        {...extLink(st.href)}
        className={`mt-2 inline-flex min-h-11 items-center gap-1 rounded-lg text-sm font-semibold text-[#0070f3] hover:underline ${focusRing}`}
      >
        {f.readStory} <span aria-hidden>→</span>
        {/^https?:/.test(st.href) && <span className="sr-only"> {f.opensNewTab}</span>}
      </a>
    </div>
  );
}

export function SectionCard({
  section,
  lang,
  progress,
  reducedMotion,
  closeLabel,
  onPlay,
  onClose,
}: {
  section: SectionId;
  lang: Lang;
  progress: Progress;
  reducedMotion: boolean;
  closeLabel: string;
  onPlay: () => void;
  onClose: () => void;
}) {
  const s = STRINGS[lang];
  const f = FLOW_STRINGS[lang];
  const sec = sectionById(section);
  const stamped = progress.stamps.includes(section);
  const shownFacts = facts(sec).slice(0, visibleFactCount(progress, section));
  const unlocked = progress.storiesUnlocked.includes(section);
  const cardLinks = links(sec);

  return (
    <Dialog
      labelledBy="tg-card-title"
      describedBy="tg-card-tagline"
      onClose={onClose}
      reducedMotion={reducedMotion}
      placement="sheet"
      backdropClassName="bg-gray-900/25 backdrop-blur-[2px]"
      panelClassName={`${sheetPanel} max-h-[calc(100%-0.75rem)] sm:max-h-[calc(100%-2rem)] sm:max-w-lg`}
    >
      <header className="relative shrink-0 overflow-hidden px-5 pb-4 pt-5" style={{ background: shade(sec.color, 0.88) }}>
        <Facets color={sec.color} className="absolute inset-y-0 right-0 h-full w-40 opacity-90" />
        <div className="relative max-w-[75%]">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: shade(sec.color, -0.35) }}>
            {String(sectionIndex(section) + 1).padStart(2, '0')} · {sec.landmark[lang]}
          </p>
          <h2 id="tg-card-title" className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
            {sec.title[lang]}
          </h2>
          <p id="tg-card-tagline" className="mt-0.5 text-sm font-medium text-gray-700">
            {sec.tagline[lang]}
          </p>
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <p className="text-[15px] leading-relaxed text-gray-700">{sec.card.body[lang]}</p>

        {cardLinks.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {cardLinks.map((l) => (
              <li key={l.href}>
                <a href={l.href} {...extLink(l.href)} className={`${btnSecondary} !min-h-10 !rounded-full !px-3.5`}>
                  {l.label[lang]}
                  <span aria-hidden className="text-gray-400">
                    {/^https?:/.test(l.href) ? '↗' : '→'}
                  </span>
                  {/^https?:/.test(l.href) && <span className="sr-only"> {f.opensNewTab}</span>}
                </a>
              </li>
            ))}
          </ul>
        )}

        {shownFacts.length > 0 && (
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: shade(sec.color, -0.3) }}>
              {f.funFact}
            </p>
            <ul className="mt-1 space-y-1.5">
              {shownFacts.map((fact) => (
                <li key={fact.en} className="text-sm leading-relaxed text-gray-700">
                  {fact[lang]}
                </li>
              ))}
            </ul>
          </div>
        )}

        {unlocked && <StoryBlock section={section} lang={lang} />}

        <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 p-3">
          <StampSeal section={section} lang={lang} earned={stamped} size={52} />
          <p className={`text-sm font-semibold ${stamped ? 'text-gray-900' : 'text-gray-500'}`}>
            {stamped ? `✓ ${f.stampEarned}` : f.stampMissing}
          </p>
        </div>
      </div>

      <footer className="flex shrink-0 gap-2 border-t border-gray-100 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <button type="button" data-testid="card-play" onClick={onPlay} className={`${btnPrimary} flex-1`}>
          {stamped ? f.playAgain : s.play}
        </button>
        <button type="button" data-testid="card-close" data-autofocus onClick={onClose} className={`${btnSecondary} flex-1`}>
          {closeLabel}
        </button>
      </footer>
    </Dialog>
  );
}
