'use client'

import LevelIcon from './LevelIcon'
import Stars from './Stars'
import { STAGES, type Level, type Stage } from './curriculum'

/** Desplazamiento horizontal de cada nodo: da al camino su forma serpenteante. */
const WEAVE = [0, 44, 68, 44, 0, -44, -68, -44]

/** Posición de cada nivel en el camino completo, para que el serpenteo no se
 *  reinicie en cada etapa. Se calcula una vez: el currículo es estático. */
const POSITION = new Map<string, number>()
STAGES.forEach((stage) => stage.levels.forEach((level) => POSITION.set(level.id, POSITION.size)))

interface Props {
  starsOf: (levelId: string) => number
  isUnlocked: (levelId: string) => boolean
  nextLevelId: string | null
  onPick: (level: Level, stage: Stage) => void
}

export default function PathMap({ starsOf, isUnlocked, nextLevelId, onPick }: Props) {
  return (
    <div className="space-y-14">
      {STAGES.map((stage) => {
        const earned = stage.levels.reduce((sum, l) => sum + starsOf(l.id), 0)
        const possible = stage.levels.length * 3
        const stageOpen = stage.levels.some((l) => isUnlocked(l.id))

        return (
          <section key={stage.id}>
            {/* Cabecera de etapa */}
            <div
              className={`rounded-2xl px-5 py-4 bg-gradient-to-r ${stage.accent} ${
                stageOpen ? '' : 'opacity-40 saturate-0'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-white truncate">{stage.name}</h2>
                  <p className="text-sm text-white/80 truncate">{stage.subtitle}</p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-white font-bold tabular-nums">
                    {earned}
                    <span className="text-white/70 font-normal">/{possible}</span>
                  </div>
                  <div className="text-[11px] uppercase tracking-wider text-white/70">estrellas</div>
                </div>
              </div>
            </div>

            {/* Nodos */}
            <div className="relative mt-8">
              <div
                aria-hidden="true"
                className="absolute left-1/2 top-4 bottom-4 w-0 border-l-2 border-dashed border-gray-200"
              />

              <div className="relative flex flex-col items-center gap-7">
                {stage.levels.map((level) => {
                  const stars = starsOf(level.id)
                  const unlocked = isUnlocked(level.id)
                  const isNext = level.id === nextLevelId
                  const offset = WEAVE[(POSITION.get(level.id) ?? 0) % WEAVE.length]

                  return (
                    <div
                      key={level.id}
                      className="flex flex-col items-center"
                      style={{ transform: `translateX(${offset}px)` }}
                    >
                      {isNext && (
                        <div className="mb-2 px-3 py-1 rounded-full bg-gray-900 text-white text-[11px] font-bold uppercase tracking-wider animate-bounce">
                          Empezar
                        </div>
                      )}

                      <button
                        onClick={() => unlocked && onPick(level, stage)}
                        disabled={!unlocked}
                        title={unlocked ? level.title : 'Completa el nivel anterior para abrirlo'}
                        aria-label={`${level.title}${unlocked ? '' : ' (bloqueado)'}`}
                        className={`relative w-[68px] h-[68px] rounded-full flex items-center justify-center transition-all ${
                          unlocked
                            ? `bg-gradient-to-br ${stage.accent} text-white shadow-lg hover:scale-105 active:scale-95 ${
                                isNext ? `ring-4 ${stage.ring}` : ''
                              }`
                            : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                        }`}
                      >
                        {unlocked ? (
                          <LevelIcon kind={level.kind} size={26} />
                        ) : (
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="5" y="11" width="14" height="9" rx="2" />
                            <path d="M8 11V8a4 4 0 018 0v3" strokeLinecap="round" />
                          </svg>
                        )}
                      </button>

                      <div className="mt-2 h-4">
                        {stars > 0 && <Stars count={stars} size={13} />}
                      </div>
                      <div
                        className={`text-xs font-medium text-center max-w-[120px] leading-tight ${
                          unlocked ? 'text-gray-700' : 'text-gray-300'
                        }`}
                      >
                        {level.title}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )
      })}
    </div>
  )
}
