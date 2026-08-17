'use client'

import { useState } from 'react'
import PathMap from '../shared-audio/PathMap'
import LevelIcon from './LevelIcon'
import LevelPlayer from './LevelPlayer'
import Afinador from './Afinador'
import Acordes from './Acordes'
import Diapason from './Diapason'
import Stars from '../shared-audio/Stars'
import { useLevelProgress } from '../shared-audio/useLevelProgress'
import { ALL_LEVELS, LEVEL_IDS, STAGES, type Level, type LevelKind, type Stage } from './curriculum'

type View = 'camino' | 'herramientas'
type Tool = 'afinador' | 'acordes' | 'diapason'

const TOOLS: { id: Tool; label: string }[] = [
  { id: 'afinador', label: 'Afinador' },
  { id: 'acordes', label: 'Acordes' },
  { id: 'diapason', label: 'Diapasón' },
]

export default function GuitarraApp() {
  const progress = useLevelProgress('guitarra.progreso.v1', LEVEL_IDS)
  const [view, setView] = useState<View>('camino')
  const [tool, setTool] = useState<Tool>('afinador')
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

  // ── Dentro de un nivel: pantalla limpia, sin cabeceras ni pestañas ──
  if (active) {
    const i = ALL_LEVELS.findIndex((l) => l.level.id === active.level.id)
    const hasNext = i >= 0 && i + 1 < ALL_LEVELS.length
    return (
      <LevelPlayer
        key={active.level.id}
        level={active.level}
        stage={active.stage}
        previousStars={progress.starsOf(active.level.id)}
        onExit={() => setActive(null)}
        onFinish={(stars) => progress.record(active.level.id, stars)}
        onNext={hasNext ? openNext : null}
      />
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Marcador */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-4 mb-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900 tabular-nums">
                  {progress.streak}
                </span>
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
        </div>

        <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-600 transition-[width] duration-500"
            style={{ width: `${(progress.completed / progress.total) * 100}%` }}
          />
        </div>
      </div>

      {/* Camino / Herramientas */}
      <div className="flex gap-1.5 mb-7">
        {(
          [
            ['camino', 'Camino'],
            ['herramientas', 'Herramientas'],
          ] as [View, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setView(id)}
            aria-current={view === id ? 'page' : undefined}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              view === id
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'camino' ? (
        <PathMap
          stages={STAGES}
          renderIcon={(kind) => <LevelIcon kind={kind as LevelKind} size={26} />}
          starsOf={progress.starsOf}
          isUnlocked={progress.isUnlocked}
          nextLevelId={progress.nextLevelId}
          onPick={openLevel}
        />
      ) : (
        <div>
          <div className="flex gap-1.5 mb-5">
            {TOOLS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTool(t.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tool === t.id
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {tool === 'afinador' && <Afinador />}
          {tool === 'acordes' && <Acordes />}
          {tool === 'diapason' && <Diapason />}
        </div>
      )}

      {view === 'camino' && progress.completed > 0 && (
        <div className="mt-12 text-center">
          {confirmReset ? (
            <div className="inline-flex items-center gap-3 text-xs">
              <span className="text-gray-500">¿Borrar todo tu progreso?</span>
              <button
                onClick={() => {
                  progress.reset()
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
