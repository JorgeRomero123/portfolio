'use client';

// Passport: 11 stamp slots, owned hats (wear one), unlocked story cards, the final contact card once
// all stamps are in, and Reset progress (with a confirm step). Opened from the HUD (testid `passport`).
import { useState } from 'react';
import { SECTIONS } from '../content';
import { useProgress } from '../progress';
import { TOTAL_STAMPS, hasAllStamps } from '../rewards';
import { FLOW_STRINGS, STRINGS } from '../strings';
import { DEFAULT_PROGRESS, type Lang } from '../types';
import { Dialog, focusRing } from '../hud/Dialog';
import { ContactCard } from './ContactCard';
import { StoryBlock } from './SectionCard';
import { HatGlyph, StampSeal, btnGhost, btnPrimary, btnSecondary, sheetPanel } from './ui';

export default function Passport({
  lang,
  reducedMotion,
  onClose,
}: {
  lang: Lang;
  reducedMotion: boolean;
  onClose: () => void;
}) {
  const s = STRINGS[lang];
  const f = FLOW_STRINGS[lang];
  const [progress, update] = useProgress();
  const [confirming, setConfirming] = useState(false);
  const [resetNote, setResetNote] = useState(false);
  const count = progress.stamps.length;

  const reset = () => {
    update({ ...DEFAULT_PROGRESS, pawnTile: progress.pawnTile, soundOn: progress.soundOn });
    setConfirming(false);
    setResetNote(true);
  };

  const h3 = 'font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-gray-500';

  return (
    <Dialog
      labelledBy="tg-passport-title"
      describedBy="tg-passport-intro"
      onClose={onClose}
      reducedMotion={reducedMotion}
      placement="sheet"
      backdropClassName="bg-gray-900/40 backdrop-blur-sm"
      panelClassName={`${sheetPanel} max-h-[calc(100%-0.75rem)] sm:max-h-[calc(100%-2rem)] sm:max-w-2xl`}
    >
      <header className="flex shrink-0 items-start gap-3 border-b border-[#ece5d0] bg-[#fbf8ef] px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2 id="tg-passport-title" className="text-xl font-bold tracking-tight text-gray-900">
            {f.passportTitle}
          </h2>
          <p id="tg-passport-intro" className="mt-0.5 text-sm text-gray-600">
            {f.passportIntro(count, TOTAL_STAMPS)}
          </p>
          <div className="mt-2 h-2 w-full max-w-xs overflow-hidden rounded-full bg-[#ece5d0]" aria-hidden>
            <div className="h-full rounded-full bg-[#0070f3] transition-[width] duration-500" style={{ width: `${(count / TOTAL_STAMPS) * 100}%` }} />
          </div>
        </div>
        <button type="button" data-autofocus onClick={onClose} className={btnSecondary} data-testid="passport-close">
          {s.close}
        </button>
      </header>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
        {hasAllStamps(progress) && <ContactCard lang={lang} />}

        <section aria-labelledby="tg-pp-stamps">
          <h3 id="tg-pp-stamps" className={h3}>
            {f.stampsHeading}
          </h3>
          <ul className="mt-3 grid grid-cols-3 gap-x-2 gap-y-4 sm:grid-cols-4">
            {SECTIONS.map((sec) => {
              const earned = progress.stamps.includes(sec.id);
              return (
                <li key={sec.id} className="flex flex-col items-center text-center" data-testid={`stamp-${sec.id}`}>
                  <StampSeal section={sec.id} lang={lang} earned={earned} size={76} />
                  <span className={`mt-1 text-xs font-semibold leading-tight ${earned ? 'text-gray-900' : 'text-gray-500'}`}>
                    {sec.title[lang]}
                  </span>
                  <span className={`text-[11px] ${earned ? 'text-emerald-700' : 'text-gray-400'}`}>
                    {earned ? `✓ ${f.stampEarned}` : f.notYet}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="tg-pp-hats">
          <h3 id="tg-pp-hats" className={h3}>
            {f.hatsHeading}
          </h3>
          {progress.hats.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">{f.noHats}</p>
          ) : (
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {progress.hats.map((hat) => {
                const worn = progress.wornHat === hat;
                return (
                  <li key={hat} className={`flex flex-col items-center gap-2 rounded-xl border p-3 ${worn ? 'border-[#0070f3] bg-blue-50/50' : 'border-gray-200'}`}>
                    <HatGlyph hat={hat} size={44} />
                    <span className="text-center text-xs font-semibold text-gray-900">{f.hats[hat]}</span>
                    <button
                      type="button"
                      aria-pressed={worn}
                      onClick={() => update({ wornHat: worn ? null : hat })}
                      className={`${worn ? btnSecondary : btnPrimary} w-full !min-h-10 !text-xs`}
                    >
                      {worn ? f.takeOff : f.wearIt}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="tg-pp-stories">
          <h3 id="tg-pp-stories" className={h3}>
            {f.storiesHeading}
          </h3>
          {progress.storiesUnlocked.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">{f.noStories}</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {progress.storiesUnlocked.map((id) => (
                <li key={id}>
                  <StoryBlock section={id} lang={lang} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="border-t border-gray-100 pt-4">
          {confirming ? (
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label={f.reset}>
              <p className="mr-auto text-sm font-semibold text-gray-900">{f.resetConfirm}</p>
              <button type="button" onClick={() => setConfirming(false)} className={btnGhost} autoFocus>
                {s.cancel}
              </button>
              <button
                type="button"
                data-testid="reset-confirm"
                onClick={reset}
                className={`inline-flex min-h-11 items-center rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 ${focusRing}`}
              >
                {f.resetYes}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button type="button" data-testid="reset-progress" onClick={() => setConfirming(true)} className={`${btnGhost} !px-0 text-rose-700 hover:text-rose-800`}>
                {f.reset}
              </button>
              <p aria-live="polite" className="text-sm text-gray-500">
                {resetNote ? f.resetDone : ''}
              </p>
            </div>
          )}
        </section>
      </div>
    </Dialog>
  );
}
