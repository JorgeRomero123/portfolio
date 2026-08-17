'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getAudioContext, scheduleClick } from './audio'
/** Cualquier herramienta puede pedir un ejercicio de pulso con esta forma. */
export interface RhythmSpec {
  prompt: string
  bpm: number
  beats: number
}

const COUNT_IN = 4
/** Desviación media por debajo de la cual damos el pulso por bien marcado. */
const GOOD_MS = 130
const TIGHT_MS = 70

interface Props {
  exercise: RhythmSpec
  onDone: (correct: boolean) => void
}

type Phase = 'idle' | 'running' | 'done'

export default function RhythmExercise({ exercise, onDone }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [beatIndex, setBeatIndex] = useState(-1)
  const [taps, setTaps] = useState(0)
  const [score, setScore] = useState<{ avgMs: number; hits: number } | null>(null)

  // Se fijan al arrancar y las leen los callbacks sin re-suscribirse.
  const startAtRef = useRef(0)
  const intervalRef = useRef(0)
  const deviationsRef = useRef<number[]>([])
  const rafRef = useRef<number | null>(null)
  const timersRef = useRef<number[]>([])

  const cleanup = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    timersRef.current.forEach((t) => window.clearTimeout(t))
    timersRef.current = []
  }, [])

  useEffect(() => cleanup, [cleanup])

  const start = () => {
    const ctx = getAudioContext()
    const interval = 60 / exercise.bpm
    const startAt = ctx.currentTime + 0.6
    startAtRef.current = startAt
    intervalRef.current = interval
    deviationsRef.current = []

    setTaps(0)
    setScore(null)
    setBeatIndex(-1)
    setPhase('running')

    const total = COUNT_IN + exercise.beats
    for (let i = 0; i < total; i++) {
      scheduleClick(ctx, startAt + i * interval, i % 4 === 0)
    }

    const tick = () => {
      const elapsed = ctx.currentTime - startAt
      setBeatIndex(Math.floor(elapsed / interval))
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    // Un pulso de gracia tras el último para admitir el golpe que llega tarde.
    const durationMs = (total + 1) * interval * 1000 + 600
    const id = window.setTimeout(() => {
      cleanup()
      const devs = deviationsRef.current
      const avgMs = devs.length ? devs.reduce((a, b) => a + b, 0) / devs.length : Infinity
      const hits = devs.length
      setScore({ avgMs, hits })
      setPhase('done')
      // Hay que marcar la mayoría de los pulsos y hacerlo cerca del click.
      const passed = hits >= Math.ceil(exercise.beats * 0.75) && avgMs <= GOOD_MS
      window.setTimeout(() => onDone(passed), 1400)
    }, durationMs)
    timersRef.current.push(id)
  }

  const tap = useCallback(() => {
    if (phase !== 'running') return
    const ctx = getAudioContext()
    const elapsed = ctx.currentTime - startAtRef.current
    const interval = intervalRef.current
    const scoringStart = COUNT_IN * interval

    // Solo cuentan los golpes de la fase de marcado, no los de la entradilla.
    if (elapsed < scoringStart - interval / 2) return

    const beat = Math.round((elapsed - scoringStart) / interval)
    if (beat < 0 || beat >= exercise.beats) return

    const expected = scoringStart + beat * interval
    const deviation = Math.abs(elapsed - expected) * 1000
    if (deviation > (interval * 1000) / 2) return

    deviationsRef.current.push(deviation)
    setTaps((t) => t + 1)
  }, [phase, exercise.beats])

  useEffect(() => {
    if (phase !== 'running') return
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        tap()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, tap])

  const inCountIn = phase === 'running' && beatIndex < COUNT_IN
  const currentScoringBeat = beatIndex - COUNT_IN

  return (
    <div className="flex flex-col items-center text-center w-full">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 max-w-lg text-balance">
        {exercise.prompt}
      </h2>
      <p className="mt-2 text-sm text-gray-500">
        {exercise.bpm} BPM · cuatro pulsos de entrada y luego marcas tú
      </p>

      {/* Pulsos */}
      <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-md">
        {Array.from({ length: exercise.beats }, (_, i) => (
          <div
            key={i}
            className={`w-8 h-8 rounded-full transition-all duration-100 ${
              phase === 'running' && currentScoringBeat === i
                ? 'bg-[#0070f3] scale-125'
                : currentScoringBeat > i
                  ? 'bg-blue-200'
                  : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      <div className="mt-6 h-8">
        {inCountIn && (
          <span className="text-2xl font-bold text-gray-400 tabular-nums">
            {Math.max(0, COUNT_IN - beatIndex)}
          </span>
        )}
        {phase === 'running' && !inCountIn && (
          <span className="text-sm font-medium text-gray-500">{taps} marcados</span>
        )}
      </div>

      {phase === 'idle' && (
        <button
          onClick={start}
          className="mt-4 px-8 py-4 rounded-2xl bg-[#0070f3] text-white font-bold shadow-lg shadow-blue-500/25 hover:bg-blue-700 active:scale-95 transition-all"
        >
          Empezar
        </button>
      )}

      {phase === 'running' && (
        <button
          onClick={tap}
          className="mt-2 w-56 h-56 rounded-full bg-gray-900 text-white text-lg font-bold hover:bg-gray-700 active:scale-95 transition-all select-none"
        >
          Toca aquí
          <span className="block text-xs font-normal opacity-60 mt-1">o barra espaciadora</span>
        </button>
      )}

      {phase === 'done' && score && (
        <div className="mt-4">
          <div className="text-4xl font-bold text-gray-900 tabular-nums">
            {Number.isFinite(score.avgMs) ? `${Math.round(score.avgMs)} ms` : '—'}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            desviación media · {score.hits} de {exercise.beats} pulsos
          </div>
          <p className="mt-3 text-sm font-medium max-w-xs">
            {!Number.isFinite(score.avgMs) ? (
              <span className="text-gray-500">No marcaste ningún pulso.</span>
            ) : score.avgMs <= TIGHT_MS ? (
              <span className="text-emerald-600">Muy ajustado. Así se toca con otros.</span>
            ) : score.avgMs <= GOOD_MS ? (
              <span className="text-emerald-600">Dentro del pulso.</span>
            ) : (
              <span className="text-gray-500">
                Vas fuera del pulso. Escucha un par de compases antes de empezar a marcar.
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  )
}
