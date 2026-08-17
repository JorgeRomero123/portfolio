'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import ChordDiagram from '../ChordDiagram'
import { chordById, TUNING, midiToFreq } from '../music'
import { playTone } from '../audio'
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

export default function ChoiceExercise({ exercise, onDone }: Props) {
  const [picked, setPicked] = useState<number | null>(null)
  const isEar = exercise.kind === 'ear'

  const play = useCallback(() => {
    if (exercise.kind !== 'ear') return
    if (exercise.source.type === 'chord') playChordSound(exercise.source.id)
    else playTone(midiToFreq(exercise.source.midi), 2.2)
  }, [exercise])

  // Los ejercicios de oído suenan solos al entrar: la pregunta es el sonido.
  const played = useRef(false)
  useEffect(() => {
    if (!isEar || played.current) return
    played.current = true
    const id = window.setTimeout(play, 350)
    return () => window.clearTimeout(id)
  }, [isEar, play])

  const choose = (i: number) => {
    if (picked !== null) return
    setPicked(i)
    onDone(i === exercise.answer)
  }

  const chordId = exercise.kind === 'quiz' ? exercise.chordId : undefined
  const chord = chordId ? chordById(chordId) : undefined

  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 max-w-lg text-balance">
        {exercise.prompt}
      </h2>

      {chord && (
        <div className="mt-5 rounded-2xl bg-gray-50 border border-gray-100 px-6 py-4">
          <ChordDiagram chord={chord} width={126} />
          <div className="mt-1 font-semibold text-gray-900">{chord.name}</div>
        </div>
      )}

      {isEar && (
        <button
          onClick={play}
          className="mt-6 group flex flex-col items-center gap-2"
          aria-label="Escuchar otra vez"
        >
          <span className="w-20 h-20 rounded-full bg-[#0070f3] text-white flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 group-active:scale-95 transition-transform">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 5L6 9H2v6h4l5 4V5z" strokeLinejoin="round" />
              <path d="M15.5 8.5a5 5 0 010 7M19 5a9 9 0 010 14" strokeLinecap="round" />
            </svg>
          </span>
          <span className="text-sm font-medium text-gray-500">Escuchar otra vez</span>
        </button>
      )}

      <div className="mt-8 w-full max-w-md space-y-2.5">
        {exercise.options.map((option, i) => {
          const isAnswer = i === exercise.answer
          const isPicked = picked === i
          const answered = picked !== null

          let tone = 'border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50'
          if (answered && isAnswer) tone = 'border-emerald-500 bg-emerald-50 text-emerald-900'
          else if (answered && isPicked) tone = 'border-red-400 bg-red-50 text-red-900'
          else if (answered) tone = 'border-gray-100 bg-white text-gray-400'

          return (
            <button
              key={option}
              onClick={() => choose(i)}
              disabled={answered}
              className={`w-full px-5 py-4 rounded-2xl border-2 text-left font-medium transition-all ${tone} ${
                !answered ? 'active:scale-[0.99]' : ''
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="flex-1">{option}</span>
                {answered && isAnswer && (
                  <svg className="w-5 h-5 shrink-0 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.8 3.8 6.8-6.8a1 1 0 011.4 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {answered && isPicked && !isAnswer && (
                  <svg className="w-5 h-5 shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 8.6l3.9-3.9 1.4 1.4-3.9 3.9 3.9 3.9-1.4 1.4-3.9-3.9-3.9 3.9-1.4-1.4 3.9-3.9-3.9-3.9 1.4-1.4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
