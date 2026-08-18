'use client'

import { useCallback } from 'react'
import ChoiceExercise from '../../shared-audio/ChoiceExercise'
import { playTone } from '../../shared-audio/audio'
import { midiToFreq } from '../../shared-audio/notes'
import { listenMidi, type VoiceRange } from '../voice'
import type { EarExercise as Ex } from '../curriculum'

/** Separación entre notas de la serie. Suficiente para oírlas como sucesión
 *  y no como acorde. */
const STEP_MS = 750

export default function EarExercise({
  exercise,
  range,
  onDone,
}: {
  exercise: Ex
  range: VoiceRange
  onDone: (correct: boolean) => void
}) {
  // Se transponen a la tónica del usuario para reconocer intervalos en la
  // altura en la que canta, pero con listenMidi, no con targetMidi: aquí no
  // hay que cantarlas, y plegarlas al rango cambiaría el intervalo enseñado.
  const play = useCallback(() => {
    exercise.offsets.forEach((offset, i) => {
      const midi = listenMidi(range, offset)
      window.setTimeout(() => playTone(midiToFreq(midi), 1.4), i * STEP_MS)
    })
  }, [exercise.offsets, range])

  return (
    <ChoiceExercise
      prompt={exercise.prompt}
      options={exercise.options}
      answer={exercise.answer}
      onDone={onDone}
      onPlay={play}
    />
  )
}
