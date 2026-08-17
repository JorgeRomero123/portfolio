'use client'

import { useCallback, useState } from 'react'
import ChoiceExercise from './exercises/ChoiceExercise'
import FretboardEx from './exercises/FretboardExercise'
import RhythmEx from './exercises/RhythmExercise'
import { PlayChord, PlayNote, Tune, type MicApi } from './exercises/PlayExercise'
import { usePitchDetector } from './usePitchDetector'
import Stars from './Stars'
import { playTone } from './audio'
import type { Exercise, Level, Stage } from './curriculum'

/** El texto del resultado cambia según el ejercicio: "No era esa" no tiene
 *  sentido cuando lo que fallaste fue el pulso o te saltaste un acorde. */
function verdict(exercise: Exercise, correct: boolean): string {
  switch (exercise.kind) {
    case 'rhythm':
      return correct ? '¡Buen pulso!' : 'Fuera del pulso'
    case 'playNote':
    case 'playChord':
    case 'tune':
      return correct ? '¡Bien!' : 'Lo dejamos para luego'
    default:
      return correct ? '¡Correcto!' : 'No era esa'
  }
}

/** Aciertos → estrellas. Con un solo ejercicio, acertar es el pleno. */
function starsFor(results: boolean[]): number {
  if (!results.length) return 0
  const ratio = results.filter(Boolean).length / results.length
  if (ratio === 1) return 3
  if (ratio >= 2 / 3) return 2
  if (ratio >= 1 / 3) return 1
  return 0
}

interface Props {
  level: Level
  stage: Stage
  previousStars: number
  onExit: () => void
  onFinish: (stars: number) => void
  onNext: (() => void) | null
}

export default function LevelPlayer({ level, stage, previousStars, onExit, onFinish, onNext }: Props) {
  const [index, setIndex] = useState(0)
  const [results, setResults] = useState<boolean[]>([])
  const [feedback, setFeedback] = useState<boolean | null>(null)
  const [finished, setFinished] = useState(false)

  // El micrófono vive aquí, no en cada ejercicio: así la sesión sobrevive al
  // paso de un ejercicio al siguiente y solo se pide permiso una vez.
  const detector = usePitchDetector()
  const mic: MicApi = {
    status: detector.status,
    freq: detector.freq,
    level: detector.level,
    start: () => void detector.start(),
    stop: detector.stop,
  }

  const exercise = level.exercises[index]
  const isLast = index === level.exercises.length - 1

  const handleDone = useCallback((correct: boolean) => {
    setResults((prev) => [...prev, correct])
    setFeedback(correct)
  }, [])

  const advance = () => {
    setFeedback(null)
    if (isLast) {
      const stars = starsFor([...results])
      setFinished(true)
      if (stars > 0) {
        playTone(660, 0.5)
        window.setTimeout(() => playTone(880, 0.7), 130)
        window.setTimeout(() => playTone(1320, 0.9), 260)
      }
      onFinish(stars)
    } else {
      setIndex((i) => i + 1)
    }
  }

  const retry = () => {
    setIndex(0)
    setResults([])
    setFeedback(null)
    setFinished(false)
  }

  const stars = starsFor(results)
  const progress = (results.length / level.exercises.length) * 100

  if (finished) {
    const passed = stars > 0
    const improved = stars > previousStars
    return (
      <div className="max-w-lg mx-auto text-center py-10">
        <div
          className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center bg-gradient-to-br ${
            passed ? stage.accent : 'from-gray-300 to-gray-400'
          }`}
        >
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            {passed ? (
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <path d="M12 8v5M12 16.5v.5" strokeLinecap="round" />
            )}
          </svg>
        </div>

        <h2 className="mt-6 text-3xl font-bold text-gray-900">
          {passed ? '¡Nivel completado!' : 'Casi'}
        </h2>
        <p className="mt-2 text-gray-500">
          {passed
            ? `Acertaste ${results.filter(Boolean).length} de ${results.length}.`
            : 'Necesitas al menos un acierto para pasar. Nada que no arregle otro intento.'}
        </p>

        <div className="mt-6 flex justify-center">
          <Stars count={stars} size={44} />
        </div>
        {improved && previousStars > 0 && (
          <p className="mt-2 text-sm font-medium text-amber-600">Mejoraste tu marca anterior</p>
        )}

        <div className="mt-9 flex flex-col gap-2.5">
          {passed && onNext && (
            <button
              onClick={onNext}
              className="w-full py-4 rounded-2xl bg-[#0070f3] text-white font-bold hover:bg-blue-700 active:scale-[0.99] transition-all"
            >
              Siguiente nivel
            </button>
          )}
          <button
            onClick={retry}
            className={`w-full py-4 rounded-2xl font-bold transition-all active:scale-[0.99] ${
              passed
                ? 'bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300'
                : 'bg-[#0070f3] text-white hover:bg-blue-700'
            }`}
          >
            {passed ? 'Repetir para mejorar' : 'Reintentar'}
          </button>
          <button
            onClick={onExit}
            className="w-full py-3 font-medium text-gray-400 hover:text-gray-700 transition-colors"
          >
            Volver al camino
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Barra superior */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onExit}
          aria-label="Salir del nivel"
          className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
        <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${stage.accent} transition-[width] duration-300`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="shrink-0 text-sm font-mono text-gray-400 tabular-nums">
          {Math.min(results.length + 1, level.exercises.length)}/{level.exercises.length}
        </span>
      </div>

      <div className="pb-32">
        <ExerciseView key={index} exercise={exercise} mic={mic} onDone={handleDone} />
      </div>

      {/* Barra de resultado */}
      {feedback !== null && (
        <div
          className={`fixed inset-x-0 bottom-0 z-30 border-t-2 ${
            feedback ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="max-w-2xl mx-auto px-4 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <div className={`font-bold ${feedback ? 'text-emerald-800' : 'text-red-800'}`}>
                {verdict(exercise, feedback)}
              </div>
              {'explain' in exercise && exercise.explain && (
                <p className={`text-sm mt-0.5 ${feedback ? 'text-emerald-700' : 'text-red-700'}`}>
                  {exercise.explain}
                </p>
              )}
            </div>
            <button
              onClick={advance}
              className={`shrink-0 px-8 py-3.5 rounded-2xl font-bold text-white active:scale-95 transition-all ${
                feedback ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {isLast ? 'Terminar' : 'Continuar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ExerciseView({
  exercise,
  mic,
  onDone,
}: {
  exercise: Exercise
  mic: MicApi
  onDone: (correct: boolean) => void
}) {
  switch (exercise.kind) {
    case 'quiz':
    case 'ear':
      return <ChoiceExercise exercise={exercise} onDone={onDone} />
    case 'fretboard':
      return <FretboardEx exercise={exercise} onDone={onDone} />
    case 'rhythm':
      return <RhythmEx exercise={exercise} onDone={onDone} />
    case 'playNote':
      return <PlayNote exercise={exercise} mic={mic} onDone={onDone} />
    case 'playChord':
      return <PlayChord exercise={exercise} mic={mic} onDone={onDone} />
    case 'tune':
      return <Tune exercise={exercise} mic={mic} onDone={onDone} />
  }
}
