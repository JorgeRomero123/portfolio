'use client'

import ChoiceExercise from '../shared-audio/ChoiceExercise'
import RhythmEx from '../shared-audio/RhythmExercise'
import LevelRunner from '../shared-audio/LevelRunner'
import { usePitchDetector } from '../shared-audio/usePitchDetector'
import type { MicApi } from '../shared-audio/MicGate'
import EarEx from './exercises/EarExercise'
import RangeEx from './exercises/RangeExercise'
import { MatchPitch, Sequence, Sustain } from './exercises/SingExercise'
import type { Exercise, Level, Stage } from './curriculum'
import type { VoiceRange } from './voice'

function verdict(exercise: Exercise, correct: boolean): string {
  switch (exercise.kind) {
    case 'rhythm':
      return correct ? '¡Buen pulso!' : 'Fuera del pulso'
    case 'range':
      return correct ? 'Rango guardado' : 'Lo medimos otro día'
    case 'sustain':
      return correct ? '¡Bien sostenida!' : 'Se te cayó la nota'
    case 'matchPitch':
    case 'sequence':
      return correct ? '¡Afinado!' : 'Lo dejamos para luego'
    default:
      return correct ? '¡Correcto!' : 'No era esa'
  }
}

interface Props {
  level: Level
  stage: Stage
  range: VoiceRange
  previousStars: number
  onCalibrated: (range: VoiceRange) => void
  onExit: () => void
  onFinish: (stars: number) => void
  onNext: (() => void) | null
}

export default function LevelPlayer({
  level,
  stage,
  range,
  previousStars,
  onCalibrated,
  onExit,
  onFinish,
  onNext,
}: Props) {
  // Una sola sesión de micrófono por nivel, compartida por sus ejercicios.
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
            return (
              <ChoiceExercise
                prompt={exercise.prompt}
                options={exercise.options}
                answer={exercise.answer}
                onDone={onDone}
              />
            )
          case 'ear':
            return <EarEx exercise={exercise} range={range} onDone={onDone} />
          case 'range':
            return <RangeEx mic={mic} onCalibrated={onCalibrated} onDone={onDone} />
          case 'matchPitch':
            return <MatchPitch exercise={exercise} range={range} mic={mic} onDone={onDone} />
          case 'sustain':
            return <Sustain exercise={exercise} range={range} mic={mic} onDone={onDone} />
          case 'sequence':
            return <Sequence exercise={exercise} range={range} mic={mic} onDone={onDone} />
          case 'rhythm':
            return <RhythmEx exercise={exercise} onDone={onDone} />
        }
      }}
    />
  )
}
