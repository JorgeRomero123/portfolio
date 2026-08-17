'use client'

import ChoiceExercise from './exercises/ChoiceExercise'
import FretboardEx from './exercises/FretboardExercise'
import RhythmEx from '../shared-audio/RhythmExercise'
import { PlayChord, PlayNote, Tune, type MicApi } from './exercises/PlayExercise'
import { usePitchDetector } from '../shared-audio/usePitchDetector'
import LevelRunner from '../shared-audio/LevelRunner'
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

interface Props {
  level: Level
  stage: Stage
  previousStars: number
  onExit: () => void
  onFinish: (stars: number) => void
  onNext: (() => void) | null
}

export default function LevelPlayer({ level, stage, previousStars, onExit, onFinish, onNext }: Props) {
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

  return (
    <LevelRunner
      levelId={level.id}
      exercises={level.exercises}
      accent={stage.accent}
      previousStars={previousStars}
      verdictOf={verdict}
      explainOf={(ex) => ('explain' in ex ? ex.explain : undefined)}
      onExit={onExit}
      onFinish={onFinish}
      onNext={onNext}
      renderExercise={(exercise, onDone) => {
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
      }}
    />
  )
}
