'use client'

import { useState } from 'react'
import PathMap from '../shared-audio/PathMap'
import Stars from '../shared-audio/Stars'
import { useLevelProgress } from '../shared-audio/useLevelProgress'
import { useStoredState } from '../shared-audio/useStoredState'
import LevelIcon from './LevelIcon'
import LevelPlayer from './LevelPlayer'
import { ALL_LEVELS, LEVEL_IDS, STAGES, type Level, type LevelKind, type Stage } from './curriculum'
import { DEFAULT_RANGE, describeRange, isUsable, voiceLabel, type VoiceRange } from './voice'

export default function CantoApp() {
  const progress = useLevelProgress('canto.progreso.v1', LEVEL_IDS)
  const [range, setRange] = useStoredState<VoiceRange>('canto.rango.v1', DEFAULT_RANGE)
  const [active, setActive] = useState<{ level: Level; stage: Stage } | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const openLevel = (level: Level, stage: Stage) => {
    setActive({ level, stage })
    window.scrollTo({ top: 0 })
  }

  const openNext = () => {
    if (!active) return
    const i = ALL_LEVELS.findIndex((l) => l.level.id === active.level.id)
    const next = ALL_LEVELS[i + 1]
    if (next) openLevel(next.level, next.stage)
    else setActive(null)
  }

  if (active) {
    const i = ALL_LEVELS.findIndex((l) => l.level.id === active.level.id)
    const hasNext = i >= 0 && i + 1 < ALL_LEVELS.length
    return (
      <LevelPlayer
        key={active.level.id}
        level={active.level}
        stage={active.stage}
        range={range}
        previousStars={progress.starsOf(active.level.id)}
        onCalibrated={setRange}
        onExit={() => setActive(null)}
        onFinish={(stars) => progress.record(active.level.id, stars)}
        onNext={hasNext ? openNext : null}
      />
    )
  }

  const calibrated = isUsable(range)

  return (
    <div className="max-w-2xl mx-auto">
      {/* Marcador */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-4 mb-4">
        <div className="flex items-center gap-6">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-900 tabular-nums">{progress.streak}</span>
              <span className="text-orange-500 text-lg" aria-hidden="true">
                &#9650;
              </span>
            </div>
            <div className="text-[11px] uppercase tracking-wider text-gray-400">
              {progress.streak === 1 ? 'día' : 'días'}
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-900 tabular-nums">
                {progress.earnedStars}
              </span>
              <Stars count={1} max={1} size={17} />
            </div>
            <div className="text-[11px] uppercase tracking-wider text-gray-400">estrellas</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 tabular-nums">
              {progress.completed}
              <span className="text-gray-300 font-normal">/{progress.total}</span>
            </div>
            <div className="text-[11px] uppercase tracking-wider text-gray-400">niveles</div>
          </div>
        </div>

        <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-600 transition-[width] duration-500"
            style={{ width: `${(progress.completed / progress.total) * 100}%` }}
          />
        </div>
      </div>

      {/* Rango vocal */}
      <div
        className={`rounded-2xl px-5 py-3.5 mb-7 border ${
          calibrated ? 'bg-rose-50/60 border-rose-100' : 'bg-gray-50 border-gray-100'
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wider text-gray-400">Tu rango vocal</div>
            <div className="font-bold text-gray-900 truncate">
              {calibrated ? describeRange(range) : 'Sin medir'}
              {calibrated && (
                <span className="ml-2 font-normal text-sm text-gray-500">{voiceLabel(range)}</span>
              )}
            </div>
          </div>
          <p className="shrink-0 text-xs text-gray-500 max-w-[13rem] text-right hidden sm:block">
            {calibrated
              ? 'Los ejercicios se transponen a tu voz.'
              : 'Mídelo en «Encuentra tu rango» para que todo se ajuste a tu voz.'}
          </p>
        </div>
      </div>

      <PathMap
        stages={STAGES}
        renderIcon={(kind) => <LevelIcon kind={kind as LevelKind} size={26} />}
        starsOf={progress.starsOf}
        isUnlocked={progress.isUnlocked}
        nextLevelId={progress.nextLevelId}
        onPick={openLevel}
      />

      {progress.completed > 0 && (
        <div className="mt-12 text-center">
          {confirmReset ? (
            <div className="inline-flex items-center gap-3 text-xs">
              <span className="text-gray-500">¿Borrar todo tu progreso?</span>
              <button
                onClick={() => {
                  progress.reset()
                  setRange(DEFAULT_RANGE)
                  setConfirmReset(false)
                }}
                className="font-semibold text-red-500 hover:text-red-700"
              >
                Sí, borrar
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="font-medium text-gray-400 hover:text-gray-700"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="text-xs font-medium text-gray-300 hover:text-red-500 transition-colors"
            >
              Reiniciar progreso
            </button>
          )}
        </div>
      )}
    </div>
  )
}
