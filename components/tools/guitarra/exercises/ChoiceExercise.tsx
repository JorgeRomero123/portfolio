'use client'

import { useCallback } from 'react'
import ChordDiagram from '../ChordDiagram'
import ChoiceExercise from '../../shared-audio/ChoiceExercise'
import { chordById, TUNING, midiToFreq } from '../music'
import { playTone } from '../../shared-audio/audio'
import type { EarExercise, QuizExercise } from '../curriculum'

/** Rasguea un acorde nota por nota, como una púa bajando. */
function playChordSound(chordId: string) {
  const chord = chordById(chordId)
  if (!chord) return
  chord.frets.forEach((fret, i) => {
    if (fret < 0) return
    window.setTimeout(() => playTone(midiToFreq(TUNING[i] + fret), 2.2), i * 55)
  })
}

interface Props {
  exercise: QuizExercise | EarExercise
  onDone: (correct: boolean) => void
}

export default function GuitarChoiceExercise({ exercise, onDone }: Props) {
  const play = useCallback(() => {
    if (exercise.kind !== 'ear') return
    if (exercise.source.type === 'chord') playChordSound(exercise.source.id)
    else playTone(midiToFreq(exercise.source.midi), 2.2)
  }, [exercise])

  const chordId = exercise.kind === 'quiz' ? exercise.chordId : undefined
  const chord = chordId ? chordById(chordId) : undefined

  return (
    <ChoiceExercise
      prompt={exercise.prompt}
      options={exercise.options}
      answer={exercise.answer}
      onDone={onDone}
      onPlay={exercise.kind === 'ear' ? play : undefined}
    >
      {chord && (
        <div className="mt-5 rounded-2xl bg-gray-50 border border-gray-100 px-6 py-4">
          <ChordDiagram chord={chord} width={126} />
          <div className="mt-1 font-semibold text-gray-900">{chord.name}</div>
        </div>
      )}
    </ChoiceExercise>
  )
}
