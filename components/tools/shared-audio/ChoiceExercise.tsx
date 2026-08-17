'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

interface Props {
  prompt: string
  options: string[]
  answer: number
  onDone: (correct: boolean) => void
  /** Si se pasa, aparece el botón de escucha y suena al entrar: la pregunta
   *  es el sonido, no el texto. */
  onPlay?: () => void
  /** Apoyo visual opcional (un diagrama de acorde, un pentagrama…). */
  children?: ReactNode
}

/** Pregunta de opción múltiple. La comparten los ejercicios de teoría y los
 *  de oído de cualquier herramienta. */
export default function ChoiceExercise({ prompt, options, answer, onDone, onPlay, children }: Props) {
  const [picked, setPicked] = useState<number | null>(null)
  const played = useRef(false)

  useEffect(() => {
    if (!onPlay || played.current) return
    played.current = true
    const id = window.setTimeout(onPlay, 350)
    return () => window.clearTimeout(id)
  }, [onPlay])

  const choose = (i: number) => {
    if (picked !== null) return
    setPicked(i)
    onDone(i === answer)
  }

  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 max-w-lg text-balance">{prompt}</h2>

      {children}

      {onPlay && (
        <button onClick={onPlay} className="mt-6 group flex flex-col items-center gap-2" aria-label="Escuchar otra vez">
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
        {options.map((option, i) => {
          const isAnswer = i === answer
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
