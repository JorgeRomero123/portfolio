'use client';

/**
 * LandmarkFlow — everything that happens at a landmark, behind GameShell's `onLandmark` seam.
 *
 *   prompt ─ Play ──────────▶ game ─ win ─▶ [stamp, first win only] ─▶ wheel ─▶ [final, 11th stamp] ─▶ card
 *     │                        │  └ lose ─▶ lost ─ Try again ─▶ game
 *     │                        │                 └ Just look ─▶ card
 *     │                        └ Skip / Esc ─▶ card
 *     ├ Just look ─▶ card ─ Play ─▶ game
 *     └ Keep going / Esc ─▶ done('continue')
 *   card ─ Close ─▶ done('play' if a game was started, else 'look')
 *
 * The stamp rule lives in rewards.ts (`winEarnsStamp`). Loaded with next/dynamic on first use,
 * so none of this ships in the page's initial bundle.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { sectionById } from '../content';
import { getProgress, updateProgress, useProgress } from '../progress';
import { hasAllStamps, winEarnsStamp } from '../rewards';
import { FLOW_STRINGS, STRINGS } from '../strings';
import type { Lang, LandmarkChoice, MiniGameResult, SectionId } from '../types';
import { Dialog } from '../hud/Dialog';
import type { FlowStep } from './flow';
import { FinalReward } from './ContactCard';
import { MiniGameHost } from './MiniGameHost';
import { PrizeWheel } from './PrizeWheel';
import { Prompt } from './Prompt';
import { SectionCard } from './SectionCard';
import { StampReveal } from './StampReveal';
import { btnPrimary, btnSecondary, sheetPanel } from './ui';


export interface LandmarkFlowProps {
  section: SectionId;
  landed: boolean;
  lang: Lang;
  reducedMotion: boolean;
  onDone: (choice: LandmarkChoice) => void;
  /** Reports the current step so the shell can pause the board. */
  onStep?: (step: FlowStep) => void;
  /** Dev-only: start somewhere other than the prompt ('win' simulates a mini-game win). */
  debugStart?: FlowStep | 'win';
}

export default function LandmarkFlow({ section, landed, lang, reducedMotion, onDone, onStep, debugStart }: LandmarkFlowProps) {
  const s = STRINGS[lang];
  const f = FLOW_STRINGS[lang];
  const [progress] = useProgress();
  const [step, setStep] = useState<FlowStep>(() =>
    debugStart === 'win'
      ? winEarnsStamp(getProgress(), section)
        ? 'stamp'
        : 'wheel'
      : (debugStart ?? 'prompt'),
  );
  const [attempt, setAttempt] = useState(0);
  const [played, setPlayed] = useState(debugStart === 'game' || debugStart === 'win');
  const completedNow = useRef(false);
  const finished = useRef(false);

  useEffect(() => {
    onStep?.(step);
  }, [onStep, step]);

  const done = useCallback(
    (choice: LandmarkChoice) => {
      if (finished.current) return;
      finished.current = true;
      onDone(played ? 'play' : choice);
    },
    [onDone, played],
  );

  const startGame = useCallback(() => {
    setPlayed(true);
    setAttempt((a) => a + 1);
    setStep('game');
  }, []);

  const onFinish = useCallback(
    (r: MiniGameResult) => {
      if (!r.won) return setStep('lost');
      if (winEarnsStamp(getProgress(), section)) {
        const next = updateProgress((p) => ({ stamps: [...p.stamps, section] }));
        completedNow.current = hasAllStamps(next);
        setStep('stamp');
      } else setStep('wheel');
    },
    [section],
  );

  // Dev hook: a simulated win opens straight on the reward step; grant the stamp right after mount.
  useEffect(() => {
    if (debugStart !== 'win') return;
    const id = window.setTimeout(() => {
      if (!winEarnsStamp(getProgress(), section)) return;
      const next = updateProgress((p) => ({ stamps: [...p.stamps, section] }));
      completedNow.current = hasAllStamps(next);
    }, 0);
    return () => window.clearTimeout(id);
  }, [debugStart, section]);

  const sec = sectionById(section);
  const common = { lang, reducedMotion };

  return (
    <AnimatePresence mode="wait">
      {step === 'prompt' && (
        <Prompt
          key="prompt"
          {...common}
          section={section}
          landed={landed}
          stamped={progress.stamps.includes(section)}
          onPlay={startGame}
          onLook={() => setStep('card')}
          onContinue={() => done('continue')}
        />
      )}
      {step === 'game' && (
        <MiniGameHost
          key={`game-${attempt}`}
          {...common}
          section={section}
          attempt={attempt}
          soundOn={progress.soundOn}
          onFinish={onFinish}
          onSkip={() => setStep('card')}
        />
      )}
      {step === 'lost' && (
        <Dialog
          key="lost"
          labelledBy="tg-lost-title"
          describedBy="tg-lost-body"
          onClose={() => setStep('card')}
          reducedMotion={reducedMotion}
          placement="sheet"
          backdropClassName="bg-gray-900/40 backdrop-blur-sm"
          panelClassName={`${sheetPanel} p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center sm:max-w-sm`}
        >
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full" style={{ background: sec.color }} aria-hidden />
          <h2 id="tg-lost-title" className="text-2xl font-bold tracking-tight text-gray-900">
            {f.soClose}
          </h2>
          <p id="tg-lost-body" className="mt-1 text-sm text-gray-600">
            {f.lostBody}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button type="button" data-testid="lost-retry" data-autofocus onClick={startGame} className={btnPrimary}>
              {f.tryAgain}
            </button>
            <button type="button" data-testid="lost-look" onClick={() => setStep('card')} className={btnSecondary}>
              {s.justLook}
            </button>
          </div>
        </Dialog>
      )}
      {step === 'stamp' && (
        <StampReveal
          key="stamp"
          {...common}
          section={section}
          count={progress.stamps.length}
          soundOn={progress.soundOn}
          onNext={() => setStep('wheel')}
        />
      )}
      {step === 'wheel' && (
        <PrizeWheel
          key="wheel"
          {...common}
          section={section}
          soundOn={progress.soundOn}
          onDone={() => setStep(completedNow.current ? 'final' : 'card')}
        />
      )}
      {step === 'final' && (
        <FinalReward
          key="final"
          {...common}
          onNext={() => {
            completedNow.current = false;
            setStep('card');
          }}
        />
      )}
      {step === 'card' && (
        <SectionCard
          key="card"
          {...common}
          section={section}
          progress={progress}
          closeLabel={landed || played ? s.close : s.keepGoing}
          onPlay={startGame}
          onClose={() => done('look')}
        />
      )}
    </AnimatePresence>
  );
}
