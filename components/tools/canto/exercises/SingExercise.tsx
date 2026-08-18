'use client'

import { useEffect, useRef, useState } from 'react'
import { MicGate, LevelMeter, type MicApi } from '../../shared-audio/MicGate'
import { playTone } from '../../shared-audio/audio'
import { freqToMidi, midiToFreq, noteLabel } from '../../shared-audio/notes'
import { targetMidi, type VoiceRange } from '../voice'
import type { MatchPitchExercise, SequenceExercise, SustainExercise } from '../curriculum'

/** Un semitono son 100 cents, así que 50 es el máximo que no se confunde con
 *  la nota vecina. Para una voz sin entrenar es un margen razonable. */
const TOLERANCE_CENTS = 50
const HOLD_MS = 250
/** Margen antes de dar por rota una nota sostenida: un parpadeo del detector
 *  no debería tirar por tierra cuatro segundos de aguante. */
const GRACE_MS = 400

const centsFromTarget = (freq: number, target: number) => (freqToMidi(freq) - target) * 100

// ───────────────────────────────────────────────────────────────────────────

/**
 * Medidor vertical: la nota buscada en el centro y tu voz como un punto que
 * sube y baja. Para cantar funciona mejor que un número, porque lo que hay que
 * corregir es una dirección.
 */
function PitchMeter({
  target,
  freq,
  hit,
}: {
  target: number
  freq: number | null
  hit: boolean
}) {
  const cents = freq === null ? null : centsFromTarget(freq, target)
  const clamped = cents === null ? 0 : Math.max(-600, Math.min(600, cents))
  const top = 50 - (clamped / 600) * 50
  const inTune = cents !== null && Math.abs(cents) <= TOLERANCE_CENTS
  const octaveOff = cents !== null && Math.abs(Math.abs(cents) - 1200) < 80

  return (
    <div className="mt-7 flex items-stretch gap-5">
      <div className="relative w-24 h-56 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden">
        {/* Banda de acierto */}
        <div
          className={`absolute inset-x-0 transition-colors ${hit ? 'bg-emerald-200' : 'bg-emerald-100'}`}
          style={{ top: `${50 - (TOLERANCE_CENTS / 600) * 50}%`, height: `${(TOLERANCE_CENTS / 300) * 50}%` }}
        />
        <div className="absolute inset-x-0 top-1/2 h-px bg-emerald-500" />

        {cents !== null && (
          <div
            className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 transition-[top] duration-100"
            style={{ top: `${top}%` }}
          >
            <div
              className={`w-9 h-9 rounded-full border-4 border-white shadow-md ${
                inTune ? 'bg-emerald-500' : 'bg-[#0070f3]'
              }`}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col justify-center text-left">
        <div className="text-xs uppercase tracking-wider text-gray-400">Nota objetivo</div>
        <div className={`text-4xl font-bold tabular-nums ${hit ? 'text-emerald-500' : 'text-gray-900'}`}>
          {noteLabel(target)}
        </div>
        <div className="mt-2 text-sm font-medium h-10 max-w-[9rem]">
          {cents === null ? (
            <span className="text-gray-400">Canta con &laquo;aaa&raquo;…</span>
          ) : octaveOff ? (
            <span className="text-amber-600">
              Vas una octava {cents > 0 ? 'arriba' : 'abajo'}: la nota es correcta, pero busca esta
              altura.
            </span>
          ) : inTune ? (
            <span className="text-emerald-600">Ahí es. Mantenla.</span>
          ) : cents > 0 ? (
            <span className="text-gray-500">Estás alto: baja un poco.</span>
          ) : (
            <span className="text-gray-500">Estás bajo: sube un poco.</span>
          )}
        </div>
      </div>
    </div>
  )
}

function ReferenceButton({ midi, label = 'Oír la nota' }: { midi: number; label?: string }) {
  return (
    <button
      onClick={() => playTone(midiToFreq(midi), 2)}
      className="mt-4 text-sm font-medium text-[#0070f3] hover:underline"
    >
      {label}
    </button>
  )
}

const micHint = 'Si la barra no se mueve, acércate al micrófono.'

// ───────────────────────────────────────────────────────────────────────────

export function MatchPitch({
  exercise,
  range,
  mic,
  onDone,
}: {
  exercise: MatchPitchExercise
  range: VoiceRange
  mic: MicApi
  onDone: (correct: boolean) => void
}) {
  const target = targetMidi(range, exercise.offset)
  // A ciegas suena la tónica, no la nota buscada: el ejercicio deja de ser
  // copiar una altura y pasa a ser encontrar el intervalo.
  const reference = exercise.blind ? targetMidi(range, 0) : target
  const [hit, setHit] = useState(false)
  const played = useRef(false)

  useEffect(() => {
    if (played.current) return
    played.current = true
    const id = window.setTimeout(() => playTone(midiToFreq(reference), 2), 300)
    return () => window.clearTimeout(id)
  }, [reference])

  const matching =
    !hit && mic.freq !== null && Math.abs(centsFromTarget(mic.freq, target)) <= TOLERANCE_CENTS

  useEffect(() => {
    if (!matching) return
    const id = window.setTimeout(() => setHit(true), HOLD_MS)
    return () => window.clearTimeout(id)
  }, [matching])

  useEffect(() => {
    if (!hit) return
    playTone(1320, 0.5)
    const id = window.setTimeout(() => onDone(true), 700)
    return () => window.clearTimeout(id)
  }, [hit, onDone])

  const listening = mic.status === 'listening'

  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 max-w-lg text-balance">
        {exercise.prompt}
      </h2>
      {exercise.blind && (
        <span className="mt-3 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold uppercase tracking-wider">
          A ciegas · solo oyes la nota de partida
        </span>
      )}
      <PitchMeter target={target} freq={listening ? mic.freq : null} hit={hit} />
      <ReferenceButton
        midi={reference}
        label={exercise.blind ? 'Oír la nota de partida' : 'Oír la nota'}
      />

      {listening ? (
        <>
          <LevelMeter value={mic.level} hint={micHint} />
          <button
            onClick={() => onDone(false)}
            className="mt-4 text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors"
          >
            Saltar
          </button>
        </>
      ) : (
        <MicGate mic={mic} onSkip={() => onDone(true)} />
      )}
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────────

export function Sustain({
  exercise,
  range,
  mic,
  onDone,
}: {
  exercise: SustainExercise
  range: VoiceRange
  mic: MicApi
  onDone: (correct: boolean) => void
}) {
  const target = targetMidi(range, exercise.offset)
  const [held, setHeld] = useState(0)
  const [done, setDone] = useState(false)

  const inTune =
    mic.freq !== null && Math.abs(centsFromTarget(mic.freq, target)) <= TOLERANCE_CENTS

  const inTuneRef = useRef(inTune)
  useEffect(() => {
    inTuneRef.current = inTune
  }, [inTune])

  const listening = mic.status === 'listening'

  // El cronómetro vive en el intervalo, que es quien sabe cuánto tiempo real
  // ha pasado; el detector solo dice si en este instante estás dentro.
  useEffect(() => {
    if (!listening || done) return
    let outFor = 0
    const id = setInterval(() => {
      if (inTuneRef.current) {
        outFor = 0
        setHeld((h) => {
          const next = h + 0.1
          if (next >= exercise.seconds) setDone(true)
          return next
        })
      } else {
        outFor += 100
        if (outFor > GRACE_MS) setHeld(0)
      }
    }, 100)
    return () => clearInterval(id)
  }, [listening, done, exercise.seconds])

  useEffect(() => {
    if (!done) return
    playTone(1320, 0.6)
    const id = window.setTimeout(() => onDone(true), 800)
    return () => window.clearTimeout(id)
  }, [done, onDone])

  const pct = Math.min(100, (held / exercise.seconds) * 100)

  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 max-w-lg text-balance">
        {exercise.prompt}
      </h2>
      <p className="mt-2 text-sm text-gray-500">
        {exercise.seconds} segundos seguidos dentro de la nota
      </p>

      <PitchMeter target={target} freq={listening ? mic.freq : null} hit={done} />

      <div className="mt-6 w-full max-w-xs">
        <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-[width] duration-100 ${
              done ? 'bg-emerald-500' : 'bg-[#0070f3]'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1.5 font-mono text-sm text-gray-500 tabular-nums">
          {held.toFixed(1)} / {exercise.seconds.toFixed(1)} s
        </div>
      </div>

      <ReferenceButton midi={target} />

      {listening ? (
        <>
          <LevelMeter value={mic.level} hint={micHint} />
          <button
            onClick={() => onDone(false)}
            className="mt-4 text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors"
          >
            Saltar
          </button>
        </>
      ) : (
        <MicGate mic={mic} onSkip={() => onDone(true)} />
      )}
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────────

export function Sequence({
  exercise,
  range,
  mic,
  onDone,
}: {
  exercise: SequenceExercise
  range: VoiceRange
  mic: MicApi
  onDone: (correct: boolean) => void
}) {
  const targets = exercise.offsets.map((offset) => targetMidi(range, offset))
  const [index, setIndex] = useState(0)
  const done = index >= targets.length
  const target = done ? targets[targets.length - 1] : targets[index]

  const matching =
    !done && mic.freq !== null && Math.abs(centsFromTarget(mic.freq, target)) <= TOLERANCE_CENTS

  useEffect(() => {
    if (!matching) return
    const id = window.setTimeout(() => {
      playTone(1320, 0.3)
      setIndex((i) => i + 1)
    }, HOLD_MS)
    return () => window.clearTimeout(id)
  }, [matching, index])

  useEffect(() => {
    if (!done) return
    const id = window.setTimeout(() => onDone(true), 800)
    return () => window.clearTimeout(id)
  }, [done, onDone])

  const playAll = () => {
    targets.forEach((midi, i) => {
      window.setTimeout(() => playTone(midiToFreq(midi), 0.9), i * 700)
    })
  }

  const listening = mic.status === 'listening'

  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 max-w-lg text-balance">
        {exercise.prompt}
      </h2>

      {/* Las notas de la serie */}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {targets.map((midi, i) => {
          const isDone = i < index
          const isCurrent = i === index && !done
          let tone = 'bg-gray-100 text-gray-400 border-gray-200'
          if (isDone) tone = 'bg-emerald-500 text-white border-emerald-500'
          else if (isCurrent)
            tone = matching
              ? 'bg-blue-500 text-white border-blue-500 scale-110'
              : 'bg-white text-blue-600 border-blue-500 border-2 animate-pulse'
          return (
            <div
              key={i}
              className={`w-14 h-14 rounded-xl border flex items-center justify-center text-sm font-bold transition-all ${tone}`}
            >
              {noteLabel(midi)}
            </div>
          )
        })}
      </div>

      <PitchMeter target={target} freq={listening && !done ? mic.freq : null} hit={done} />

      <button onClick={playAll} className="mt-4 text-sm font-medium text-[#0070f3] hover:underline">
        Oír la serie entera
      </button>

      {listening ? (
        <>
          <LevelMeter value={mic.level} hint={micHint} />
          <div className="mt-4 flex gap-4">
            <button
              onClick={() => setIndex(0)}
              className="text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors"
            >
              Reiniciar
            </button>
            <button
              onClick={() => onDone(false)}
              className="text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors"
            >
              Saltar
            </button>
          </div>
        </>
      ) : (
        <MicGate mic={mic} onSkip={() => onDone(true)} />
      )}
    </div>
  )
}
