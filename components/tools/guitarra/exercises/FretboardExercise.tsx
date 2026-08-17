'use client'

import { useState } from 'react'
import { playTone } from '../../shared-audio/audio'
import { STRINGS, midiToFreq, noteNameEs } from '../music'
import type { FretboardExercise as Ex } from '../curriculum'

const FRETS = 5
/** De la 1ª cuerda (aguda, arriba) a la 6ª (grave, abajo), como en un diagrama. */
const ROWS = [...STRINGS].reverse()
const MARKERS = new Set([3, 5])

interface Props {
  exercise: Ex
  onDone: (correct: boolean) => void
}

export default function FretboardExercise({ exercise, onDone }: Props) {
  const [picked, setPicked] = useState<{ string: number; fret: number } | null>(null)
  const answered = picked !== null

  const choose = (stringNumber: number, fret: number, midi: number) => {
    if (answered) return
    playTone(midiToFreq(midi), 1.4)
    setPicked({ string: stringNumber, fret })
    onDone(stringNumber === exercise.string && fret === exercise.fret)
  }

  return (
    <div className="flex flex-col items-center text-center w-full">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 max-w-lg text-balance">
        {exercise.prompt}
      </h2>
      <p className="mt-2 text-sm text-gray-500">Toca el traste correcto en el mástil.</p>

      <div className="mt-7 w-full overflow-x-auto">
        <div className="min-w-[420px] max-w-2xl mx-auto">
          {ROWS.map((string) => {
            const isTarget = string.number === exercise.string
            return (
              <div key={string.number} className="flex items-center">
                <div className={`w-20 shrink-0 pr-3 text-right text-sm ${
                  isTarget ? 'font-bold text-gray-900' : 'font-medium text-gray-400'
                }`}>
                  {string.short}
                  <span className="ml-1 text-xs font-mono opacity-60">{string.number}ª</span>
                </div>

                {Array.from({ length: FRETS + 1 }, (_, fret) => {
                  const midi = string.midi + fret
                  const isRight = string.number === exercise.string && fret === exercise.fret
                  const isPicked = picked?.string === string.number && picked?.fret === fret

                  let dot = ''
                  if (answered && isRight) dot = 'bg-emerald-500 text-white scale-100'
                  else if (answered && isPicked) dot = 'bg-red-500 text-white scale-100'
                  else dot = 'bg-transparent group-hover:bg-gray-200 scale-90'

                  return (
                    <button
                      key={fret}
                      onClick={() => choose(string.number, fret, midi)}
                      disabled={answered}
                      aria-label={`Cuerda ${string.number}, traste ${fret}`}
                      className={`group relative flex-1 h-12 flex items-center justify-center ${
                        MARKERS.has(fret) ? 'bg-gray-50' : ''
                      } ${
                        fret === 0
                          ? 'border-r-[3px] border-gray-900 mr-0.5'
                          : 'border-r border-gray-200'
                      }`}
                    >
                      <span
                        className="absolute inset-x-0 top-1/2 bg-gray-300"
                        style={{ height: `${0.6 + (string.number - 1) * 0.22}px` }}
                      />
                      <span
                        className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${dot}`}
                      >
                        {answered && (isRight || isPicked) ? noteNameEs(midi) : ''}
                      </span>
                    </button>
                  )
                })}
              </div>
            )
          })}

          <div className="flex items-center mt-1">
            <div className="w-20 shrink-0" />
            {Array.from({ length: FRETS + 1 }, (_, fret) => (
              <div
                key={fret}
                className={`flex-1 text-center text-xs ${fret === 0 ? 'mr-0.5' : ''} ${
                  MARKERS.has(fret) ? 'font-bold text-gray-600' : 'text-gray-400'
                }`}
              >
                {fret === 0 ? 'aire' : fret}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
