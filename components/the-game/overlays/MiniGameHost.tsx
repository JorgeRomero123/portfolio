'use client';

// Mini-game host: a modal that lazy-loads the section's game from minigames/registry.ts.
// Owns the title bar, the how-to line and the always-visible "Skip mini-game" button.
// Focus is trapped by Dialog; Escape = skip (no confirm); focus is restored by the flow when it ends.
import { Component, Suspense, lazy, useCallback, useRef, type LazyExoticComponent, type ReactNode } from 'react';
import { sectionById } from '../content';
import { MINIGAMES } from '../minigames/registry';
import { FLOW_STRINGS } from '../strings';
import { SECTION_IDS, type Lang, type MiniGameComponent, type MiniGameResult, type SectionId } from '../types';
import { Dialog } from '../hud/Dialog';
import { btnSecondary, sheetPanel } from './ui';

const GAMES = Object.fromEntries(SECTION_IDS.map((id) => [id, lazy(MINIGAMES[id])])) as Record<
  SectionId,
  LazyExoticComponent<MiniGameComponent>
>;

/** If a game module fails to load or throws, show a note; Skip still works. */
class GameBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function MiniGameHost({
  section,
  attempt,
  lang,
  reducedMotion,
  soundOn,
  onFinish,
  onSkip,
}: {
  section: SectionId;
  /** Changes on "Try again" so the game remounts fresh. */
  attempt: number;
  lang: Lang;
  reducedMotion: boolean;
  soundOn: boolean;
  onFinish: (r: MiniGameResult) => void;
  onSkip: () => void;
}) {
  const f = FLOW_STRINGS[lang];
  const sec = sectionById(section);
  const Game = GAMES[section];
  const done = useRef(false);
  const finish = useCallback(
    (r: MiniGameResult) => {
      if (done.current) return;
      done.current = true;
      onFinish(r);
    },
    [onFinish],
  );

  return (
    <Dialog
      labelledBy="tg-game-title"
      describedBy="tg-game-howto"
      onClose={onSkip}
      reducedMotion={reducedMotion}
      placement="sheet"
      backdropClassName="bg-gray-900/40 backdrop-blur-sm"
      panelClassName={`${sheetPanel} h-[calc(100%-0.75rem)] sm:h-[min(640px,calc(100%-2rem))] sm:max-w-2xl`}
    >
      <div className="h-1.5 shrink-0" style={{ background: sec.color }} aria-hidden />
      <header className="flex shrink-0 items-start gap-3 border-b border-gray-100 px-4 py-3 sm:px-5">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">
            {f.miniGame} · {sec.title[lang]}
          </p>
          <h2 id="tg-game-title" className="text-lg font-bold tracking-tight text-gray-900">
            {sec.game.name[lang]}
          </h2>
          <p id="tg-game-howto" className="mt-0.5 text-sm text-gray-600">
            {sec.game.howTo[lang]}
          </p>
        </div>
        <button type="button" data-testid="skip-minigame" onClick={onSkip} className={`${btnSecondary} shrink-0`}>
          {f.skipGame}
          <kbd className="hidden rounded border border-gray-200 px-1 font-mono text-[10px] text-gray-400 sm:inline">Esc</kbd>
        </button>
      </header>
      <div className="relative min-h-0 flex-1 overflow-auto bg-white">
        <GameBoundary fallback={<p className="p-6 text-center text-sm text-gray-600">{f.gameError}</p>}>
          <Suspense
            fallback={
              <p role="status" className="flex h-full items-center justify-center text-sm text-gray-500">
                {f.loadingGame}
              </p>
            }
          >
            <Game key={attempt} lang={lang} reducedMotion={reducedMotion} soundOn={soundOn} onFinish={finish} />
          </Suspense>
        </GameBoundary>
      </div>
    </Dialog>
  );
}
