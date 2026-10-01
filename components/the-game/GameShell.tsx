'use client';

/**
 * GameShell — owns the turn state machine and the HUD, and renders the (dynamically loaded) board.
 *
 * Turn flow:  idle → rolling | aiming | picking-steps → moving → (landmark) → idle
 *             aiming → picking-section (bullseye) → moving (big jump) → landmark → idle
 *
 * ── Landmark hook point ──────────────────────────────────────────────────────────────────────
 * `onLandmark(sectionId, { landed })` is called (and awaited) whenever the pawn
 *   • LANDS on a section's landmark tile (last step of a move, or a bullseye jump), or
 *   • PASSES a landmark tile of a section that isn't in `progress.stamps` yet.
 * Movement is paused until its Promise resolves with a LandmarkChoice:
 *   'play'     → the pawn stops there (turn ends),
 *   'look'     → when passing, movement resumes afterwards,
 *   'continue' → when passing, movement resumes.
 * A landed prompt always ends the turn. Rewards/stamps are granted inside the handler
 * via updateProgress(); the shell re-reads progress after each await.
 * Default handler: overlays/LandmarkFlow (prompt → mini-game → stamp → prize wheel → section card),
 * loaded with next/dynamic on first use. An `onLandmark` prop overrides it.
 * While a full-cover overlay (mini-game, wheel, passport…) is open the board's `active` is false,
 * so the 3D render pauses.
 *
 * Dev-only (NODE_ENV !== 'production'): `?debug=passport | prompt:<id> | card:<id> | game:<id> |
 * win:<id> | wheel:<id> | stamp:<id> | final:<id> | lost:<id>` opens that overlay directly.
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 */
import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { usePrefersReducedMotion } from '@/components/home/lib/usePrefersReducedMotion';
import { sectionById } from './content';
import { useLang } from './lang';
import { getProgress, useProgress } from './progress';
import { STRINGS } from './strings';
import { SECTION_IDS, type LandmarkChoice, type LandmarkHandler, type SectionId } from './types';
import { LANDMARK_AT_TILE, TILES, landmarkTileOf, wrapTile } from './board/layout';
import type { BoardApi, BoardProps, DieValue, ViewMode } from './board/types';
import { DartOverlay, type DartResult } from './hud/DartOverlay';
import { PAUSING_STEPS, type FlowStep } from './overlays/flow';
import { SectionPicker } from './hud/SectionPicker';
import { StepPicker } from './hud/StepPicker';
import { TopBar } from './hud/TopBar';
import { TurnControls } from './hud/TurnControls';

const loadFlow = () => import('./overlays/LandmarkFlow');
const LandmarkFlow = dynamic(loadFlow, { ssr: false, loading: () => null });
const Passport = dynamic(() => import('./overlays/Passport'), { ssr: false, loading: () => null });

interface LandmarkRequest {
  section: SectionId;
  landed: boolean;
  resolve: (c: LandmarkChoice) => void;
  debugStart?: FlowStep | 'win';
}

type Phase = 'idle' | 'rolling' | 'aiming' | 'picking-section' | 'picking-steps' | 'moving' | 'landmark';

export default function GameShell({
  Board,
  active,
  onLandmark: onLandmarkProp,
}: {
  Board: ComponentType<BoardProps>;
  /** false when the stage is off-screen or the tab is hidden (pauses rendering and shortcuts). */
  active: boolean;
  onLandmark?: LandmarkHandler;
}) {
  const { lang } = useLang();
  const s = STRINGS[lang];
  const reducedMotion = usePrefersReducedMotion();
  const [progress, updateProgress] = useProgress();
  const [phase, setPhase] = useState<Phase>('idle');
  const [ready, setReady] = useState(false);
  const [view, setViewState] = useState<ViewMode>('board');
  const [status, setStatus] = useState('');
  const [steadyDart, setSteadyDart] = useState(false);
  const apiRef = useRef<BoardApi | null>(null);
  const busy = useRef(false);
  const [landmarkReq, setLandmarkReqState] = useState<LandmarkRequest | null>(null);
  const reqRef = useRef<LandmarkRequest | null>(null);
  const setLandmarkReq = useCallback((req: LandmarkRequest | null) => {
    reqRef.current = req;
    setLandmarkReqState(req);
  }, []);
  const [flowStep, setFlowStep] = useState<FlowStep | null>(null);
  const [passportOpen, setPassportOpen] = useState(false);
  const defaultLandmark = useCallback<LandmarkHandler>((section, { landed }) => {
    const opener = document.activeElement as HTMLElement | null;
    return new Promise<LandmarkChoice>((resolve) => {
      setLandmarkReq({
        section,
        landed,
        resolve: (c) => {
          // Restore focus to whatever had it (the roll button is re-enabled by then), else the roll button.
          window.setTimeout(() => {
            const target = opener && document.contains(opener) && !(opener as HTMLButtonElement).disabled ? opener : null;
            (target ?? document.querySelector<HTMLElement>('[data-testid="roll-dice"]'))?.focus({ preventScroll: true });
          }, 60);
          resolve(c);
        },
      });
    });
  }, [setLandmarkReq]);
  const onLandmark = onLandmarkProp ?? defaultLandmark;
  const endLandmark = useCallback(
    (c: LandmarkChoice) => {
      const req = reqRef.current;
      setLandmarkReq(null);
      setFlowStep(null);
      req?.resolve(c);
      // Never leave focus on <body> once the overlays close.
      window.setTimeout(() => {
        if (document.activeElement === document.body || !document.activeElement)
          document.querySelector<HTMLElement>('[data-testid="roll-dice"]')?.focus({ preventScroll: true });
      }, 120);
    },
    [setLandmarkReq],
  );
  // Pause the 3D render while something covers the stage.
  const covered = passportOpen || (!!flowStep && PAUSING_STEPS.includes(flowStep));
  const boardActive = active && !covered;

  const pawnTile = wrapTile(progress.pawnTile);
  // Latest strings/handler for use inside long-running async turns.
  const live = useRef({ s, lang, onLandmark });
  useEffect(() => {
    live.current = { s, lang, onLandmark };
  }, [s, lang, onLandmark]);

  // Warm the overlay chunk once the board is up so the first prompt opens instantly.
  useEffect(() => {
    if (ready) void loadFlow();
  }, [ready]);

  // Dev-only debug hook: ?debug=passport | <step>:<sectionId>. Runs once the board is ready.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' || !ready) return;
    const id = window.setTimeout(openDebug, 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, when the board becomes ready
  }, [ready]);
  function openDebug() {
    const q = new URLSearchParams(window.location.search).get('debug');
    if (!q) return;
    if (q === 'passport') {
      setPassportOpen(true);
      return;
    }
    const [stepName, id] = q.split(':') as [FlowStep | 'win', SectionId];
    if (!(SECTION_IDS as readonly string[]).includes(id)) return;
    busy.current = true;
    setPhase('landmark');
    setLandmarkReq({
      section: id,
      landed: true,
      debugStart: stepName,
      resolve: () => {
        setPhase('idle');
        busy.current = false;
      },
    });
  }

  const setView = useCallback((m: ViewMode) => {
    setViewState(m);
    apiRef.current?.setView(m);
  }, []);

  const finishTurn = useCallback(() => {
    const t = wrapTile(getProgress().pawnTile);
    const sec = TILES[t].section;
    setStatus(live.current.s.pawnOn(sectionById(sec).title[live.current.lang]));
    setPhase('idle');
    busy.current = false;
  }, []);

  const moveSteps = useCallback(
    async (n: number) => {
      const api = apiRef.current;
      if (!api) return finishTurn();
      setPhase('moving');
      setStatus(live.current.s.moving(n));
      let tile = wrapTile(getProgress().pawnTile);
      for (let i = 1; i <= n; i++) {
        tile = wrapTile(tile + 1);
        await api.hopTo(tile);
        updateProgress({ pawnTile: tile });
        const sec = LANDMARK_AT_TILE[tile];
        if (!sec) continue;
        const landed = i === n;
        if (!landed && getProgress().stamps.includes(sec)) continue;
        setPhase('landmark');
        const choice = await live.current.onLandmark(sec, { landed });
        if (landed || choice === 'play') break;
        setPhase('moving');
      }
      api.hideDie();
      finishTurn();
    },
    [finishTurn, updateProgress],
  );

  const roll = useCallback(async () => {
    const api = apiRef.current;
    if (busy.current || !api) return;
    busy.current = true;
    setPhase('rolling');
    setView('follow');
    setStatus(live.current.s.rolling);
    const value = (1 + Math.floor(Math.random() * 6)) as DieValue;
    await api.rollDie(value);
    setStatus(live.current.s.rolled(value));
    await moveSteps(value);
  }, [moveSteps, setView]);

  const openDart = useCallback(
    (steady: boolean) => {
      if (busy.current || !apiRef.current) return;
      busy.current = true;
      apiRef.current.hideDie();
      setSteadyDart(steady);
      setPhase('aiming');
    },
    [],
  );

  const onDartResult = useCallback(
    (r: DartResult) => {
      if (steadyDart) updateProgress((p) => ({ bonusDarts: Math.max(0, p.bonusDarts - 1) }));
      setSteadyDart(false);
      setView('follow');
      if (r.kind === 'bull') {
        setPhase('picking-section');
        return;
      }
      void moveSteps(r.steps);
    },
    [moveSteps, setView, steadyDart, updateProgress],
  );

  const cancelOverlay = useCallback(() => {
    setSteadyDart(false);
    setPhase('idle');
    busy.current = false;
  }, []);

  const jumpToSection = useCallback(
    async (id: SectionId) => {
      const api = apiRef.current;
      if (!api) return finishTurn();
      const tile = landmarkTileOf(id);
      setPhase('moving');
      setStatus(live.current.s.jumpingTo(sectionById(id).title[live.current.lang]));
      await api.jumpTo(tile);
      updateProgress({ pawnTile: tile });
      setPhase('landmark');
      await live.current.onLandmark(id, { landed: true });
      finishTurn();
    },
    [finishTurn, updateProgress],
  );

  const openFreeMove = useCallback(() => {
    if (busy.current || !apiRef.current) return;
    busy.current = true;
    setPhase('picking-steps');
  }, []);

  const pickFreeMove = useCallback(
    (n: number) => {
      updateProgress((p) => ({ freeMoves: Math.max(0, p.freeMoves - 1) }));
      apiRef.current?.hideDie();
      setView('follow');
      void moveSteps(n);
    },
    [moveSteps, setView, updateProgress],
  );

  const closePassport = useCallback(() => {
    setPassportOpen(false);
    // The dialog restores focus to its opener; fall back to the roll button if there was none.
    window.setTimeout(() => {
      if (document.activeElement === document.body || !document.activeElement)
        document.querySelector<HTMLElement>('[data-testid="roll-dice"]')?.focus({ preventScroll: true });
    }, 400);
  }, []);

  const toggleView = useCallback(() => setView(view === 'follow' ? 'board' : 'follow'), [setView, view]);

  // Keyboard shortcuts: R roll, D dart, V view (only while the stage is on screen and no dialog is open).
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || passportOpen) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      const k = e.key.toLowerCase();
      if (k === 'v' && (phase === 'idle' || phase === 'moving' || phase === 'rolling')) {
        e.preventDefault();
        toggleView();
      } else if (phase === 'idle' && ready && k === 'r') {
        e.preventDefault();
        void roll();
      } else if (phase === 'idle' && ready && k === 'd') {
        e.preventDefault();
        openDart(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, phase, ready, roll, openDart, toggleView, passportOpen]);

  const disabled = phase !== 'idle' || !ready;

  return (
    <div className="absolute inset-0">
      {/* While a full-cover overlay is open the board is paused, so the stage under it is static: blur
          it with a plain CSS filter (rasterised once) instead of a backdrop-filter on the dialog's
          scrim, which re-blurs on every frame the dialog animates and tanks the frame rate. */}
      <div
        className={`absolute inset-0 ${reducedMotion ? '' : 'transition-[filter] duration-300'}`}
        style={covered ? { filter: 'blur(3px)' } : undefined}
      >
        <div className="absolute inset-0 z-0" role="img" aria-label={s.boardAria}>
          <Board
            apiRef={apiRef}
            pawnTile={pawnTile}
            hat={progress.wornHat}
            lang={lang}
            reducedMotion={reducedMotion}
            active={boardActive}
            onReady={() => setReady(true)}
          />
        </div>

        <AnimatePresence>
          {!ready && (
            <motion.div
              key="loading"
              className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.5 }}
            >
              <div className="flex flex-col items-center gap-3 text-gray-500">
                <div className="flex gap-1.5" aria-hidden>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-2.5 w-2.5 rounded-full bg-[#0070f3] motion-safe:animate-pulse"
                      style={{ animationDelay: `${i * 180}ms`, opacity: 0.35 + i * 0.25 }}
                    />
                  ))}
                </div>
                <p className="text-sm font-medium" role="status">
                  {s.loading}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <TopBar
          lang={lang}
          view={view}
          onToggleView={toggleView}
          soundOn={progress.soundOn}
          onToggleSound={() => updateProgress((p) => ({ soundOn: !p.soundOn }))}
          stampCount={progress.stamps.length}
          onOpenPassport={() => setPassportOpen(true)}
        />
        <TurnControls
          lang={lang}
          disabled={disabled}
          status={status}
          freeMoves={progress.freeMoves}
          bonusDarts={progress.bonusDarts}
          onRoll={() => void roll()}
          onDart={() => openDart(false)}
          onFreeMove={openFreeMove}
          onSteadyDart={() => openDart(true)}
        />
      </div>

      <AnimatePresence>
        {phase === 'aiming' && (
          <DartOverlay
            key="dart"
            lang={lang}
            reducedMotion={reducedMotion}
            steady={steadyDart}
            onResult={onDartResult}
            onCancel={cancelOverlay}
          />
        )}
        {phase === 'picking-section' && (
          <SectionPicker
            key="section"
            lang={lang}
            reducedMotion={reducedMotion}
            current={TILES[pawnTile].section}
            onPick={(id) => void jumpToSection(id)}
            onClose={finishTurn}
          />
        )}
        {phase === 'picking-steps' && (
          <StepPicker key="steps" lang={lang} reducedMotion={reducedMotion} onPick={pickFreeMove} onClose={cancelOverlay} />
        )}
      </AnimatePresence>
      {landmarkReq && (
        <LandmarkFlow
          key={`${landmarkReq.section}-${landmarkReq.debugStart ?? ''}`}
          section={landmarkReq.section}
          landed={landmarkReq.landed}
          debugStart={landmarkReq.debugStart}
          lang={lang}
          reducedMotion={reducedMotion}
          onStep={setFlowStep}
          onDone={endLandmark}
        />
      )}
      <AnimatePresence>
        {passportOpen && <Passport key="passport" lang={lang} reducedMotion={reducedMotion} onClose={closePassport} />}
      </AnimatePresence>
    </div>
  );
}
