'use client';

// The race against Jorge's pawn: rules and standings while it's on, the result once it's over,
// and "Race again" (clears the stamps and sends both pawns back to the start).
import { RIVAL_LAP } from '../race';
import { TOTAL_STAMPS } from '../rewards';
import { STRINGS } from '../strings';
import type { Lang, RaceStatus } from '../types';
import { Dialog, cardClass, focusRing } from './Dialog';

export function RaceDialog({
  lang,
  reducedMotion,
  race,
  rivalSteps,
  stamps,
  onRaceAgain,
  onClose,
}: {
  lang: Lang;
  reducedMotion: boolean;
  race: RaceStatus;
  rivalSteps: number;
  stamps: number;
  onRaceAgain: () => void;
  onClose: () => void;
}) {
  const s = STRINGS[lang];
  const over = race !== 'running';
  const canRestart = over || stamps > 0 || rivalSteps !== 0;
  const title = race === 'won' ? s.raceWonTitle : race === 'lost' ? s.raceLostTitle : s.raceTitle;
  return (
    <Dialog
      labelledBy="tg-race-title"
      describedBy="tg-race-body"
      onClose={onClose}
      reducedMotion={reducedMotion}
      panelClassName={`${cardClass} w-full max-w-md overflow-hidden`}
    >
      <div className="h-1.5" style={{ background: race === 'lost' ? '#1f2937' : '#0070f3' }} aria-hidden />
      <div className="p-5">
        <h2 id="tg-race-title" className="text-xl font-bold tracking-tight text-gray-900">
          {title}
        </h2>
        <div id="tg-race-body" className="mt-2 space-y-2 text-sm text-gray-600">
          {race === 'won' && <p>{s.raceWonBody(RIVAL_LAP - rivalSteps)}</p>}
          {race === 'lost' && <p>{s.raceLostBody}</p>}
          {!over && s.raceRules.map((line) => <p key={line}>{line}</p>)}
          {!over && (
            <p className="font-mono text-xs font-semibold text-gray-900">
              {s.raceStanding(rivalSteps, RIVAL_LAP, stamps, TOTAL_STAMPS)}
            </p>
          )}
        </div>
        {canRestart && <p className="mt-3 text-xs text-gray-500">{s.raceAgainNote}</p>}
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          {canRestart && (
            <button
              type="button"
              data-testid="race-again"
              onClick={onRaceAgain}
              className={`min-h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-900 hover:border-gray-400 ${focusRing}`}
            >
              {s.raceAgain}
            </button>
          )}
          <button
            type="button"
            data-testid="race-close"
            data-autofocus
            onClick={onClose}
            className={`min-h-11 rounded-xl bg-[#0070f3] px-4 text-sm font-semibold text-white hover:bg-[#0060d0] ${focusRing}`}
          >
            {over ? s.raceKeepExploring : s.raceGotIt}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
