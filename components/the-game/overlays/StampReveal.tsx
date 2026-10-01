'use client';

// The satisfying bit: the section's stamp slams into the passport page, the page jolts, ink rings out.
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { sectionById } from '../content';
import { TOTAL_STAMPS } from '../rewards';
import { FLOW_STRINGS } from '../strings';
import type { Lang, SectionId } from '../types';
import { Dialog } from '../hud/Dialog';
import { StampSeal, blip, btnPrimary, sheetPanel } from './ui';

export function StampReveal({
  section,
  lang,
  count,
  reducedMotion,
  soundOn,
  onNext,
}: {
  section: SectionId;
  lang: Lang;
  /** Stamps collected including this one. */
  count: number;
  reducedMotion: boolean;
  soundOn: boolean;
  onNext: () => void;
}) {
  const f = FLOW_STRINGS[lang];
  const sec = sectionById(section);
  const LAND = 0.55; // seconds until the stamp hits the page

  useEffect(() => {
    if (!soundOn) return;
    const id = window.setTimeout(() => blip(90, 0.18, 0.12, 'sine'), reducedMotion ? 0 : LAND * 1000);
    return () => window.clearTimeout(id);
  }, [reducedMotion, soundOn]);

  return (
    <Dialog
      labelledBy="tg-stamp-title"
      describedBy="tg-stamp-body"
      onClose={onNext}
      reducedMotion={reducedMotion}
      placement="sheet"
      backdropClassName="bg-gray-900/40"
      panelClassName={`${sheetPanel} sm:max-w-sm`}
    >
      <motion.div
        className="relative mx-4 mt-5 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-[#e8e2d0] bg-[#fbf8ef]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent 0 23px, rgba(120,100,60,0.08) 23px 24px)',
        }}
        animate={reducedMotion ? undefined : { x: [0, 0, -5, 4, -2, 0], y: [0, 0, 3, -1, 0, 0] }}
        transition={{ duration: 0.5, delay: LAND - 0.05, times: [0, 0.01, 0.2, 0.45, 0.7, 1] }}
      >
        <span className="absolute left-3 top-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8966a]">
          {f.passportTitle} · {count}/{TOTAL_STAMPS}
        </span>
        {!reducedMotion && (
          <motion.span
            className="absolute h-36 w-36 rounded-full"
            style={{ border: `3px solid ${sec.color}` }}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: [0.7, 0.7, 1.7], opacity: [0, 0.45, 0] }}
            transition={{ duration: 0.6, delay: LAND - 0.02, times: [0, 0.01, 1], ease: 'easeOut' }}
            aria-hidden
          />
        )}
        <motion.div
          initial={reducedMotion ? { opacity: 0 } : { scale: 2.6, rotate: -28, opacity: 0, y: -30 }}
          animate={reducedMotion ? { opacity: 1 } : { scale: 1, rotate: 0, opacity: 1, y: 0 }}
          transition={reducedMotion ? { duration: 0.4 } : { duration: LAND, ease: [0.55, 0, 0.9, 0.35] }}
          style={{ filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.04))' }}
        >
          <StampSeal section={section} lang={lang} size={150} />
        </motion.div>
      </motion.div>
      <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 text-center">
        <motion.h2
          id="tg-stamp-title"
          className="text-2xl font-bold tracking-tight text-gray-900"
          initial={reducedMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reducedMotion ? 0 : LAND + 0.15 }}
        >
          {f.stampTitle}
        </motion.h2>
        <p id="tg-stamp-body" className="mt-1 text-sm text-gray-600">
          {f.stampBody(sec.title[lang])}
        </p>
        <button type="button" data-testid="stamp-next" data-autofocus onClick={onNext} className={`${btnPrimary} mt-4 w-full`}>
          {f.spinWheel}
        </button>
      </div>
    </Dialog>
  );
}
