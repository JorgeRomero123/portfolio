'use client'

import { useEffect, useMemo, useState } from 'react'
import ChordDiagram from '../ChordDiagram'
import { playTone } from '../../shared-audio/audio'
import { STRINGS, TUNING, centsOff, chordById, freqToMidi, midiToFreq, noteNameEs } from '../music'
import { MicGate, LevelMeter, type MicApi } from '../../shared-audio/MicGate'

export type { MicApi }
import type { PlayChordExercise, PlayNoteExercise, TuneExercise } from '../curriculum'

/** Margen para dar por buena una nota. Medio tono son 100 cents, así que 45
 *  acepta una guitarra ligeramente desafinada sin confundir trastes vecinos. */
const TOLERANCE_SEMITONES = 0.45
const HOLD_MS = 180
const TUNE_CENTS = 5
const TUNE_HOLD_MS = 700

// ───────────────────────────────────────────────────────────────────────────

export function PlayNote({
  exercise,
  mic,
  onDone,
}: {
  exercise: PlayNoteExercise
  mic: MicApi
  onDone: (correct: boolean) => void
}) {
  const targetMidi = TUNING[6 - exercise.string] + exercise.fret
  const [hit, setHit] = useState(false)

  const matching =
    !hit && mic.freq !== null && Math.abs(freqToMidi(mic.freq) - targetMidi) < TOLERANCE_SEMITONES

  useEffect(() => {
    if (!matching) return
    const id = window.setTimeout(() => setHit(true), HOLD_MS)
    return () => window.clearTimeout(id)
  }, [matching])

  useEffect(() => {
    if (!hit) return
    const id = window.setTimeout(() => onDone(true), 650)
    return () => window.clearTimeout(id)
  }, [hit, onDone])

  const listening = mic.status === 'listening'

  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 max-w-lg text-balance">
        {exercise.prompt}
      </h2>

      <div
        className={`mt-8 w-40 h-40 rounded-full flex flex-col items-center justify-center transition-all duration-300 ${
          hit
            ? 'bg-emerald-500 text-white scale-105'
            : matching
              ? 'bg-blue-100 text-blue-700 scale-105'
              : 'bg-gray-100 text-gray-400'
        }`}
      >
        <span className="text-4xl font-bold">{noteNameEs(targetMidi)}</span>
        <span className="text-sm mt-1 opacity-80">
          {exercise.fret === 0 ? 'al aire' : `traste ${exercise.fret}`}
        </span>
      </div>

      <p className="mt-5 text-sm font-medium text-gray-500 h-5">
        {hit
          ? '¡Esa es!'
          : listening
            ? mic.freq
              ? `Estoy oyendo ${noteNameEs(Math.round(freqToMidi(mic.freq)))}…`
              : 'Escuchando…'
            : ''}
      </p>

      <button
        onClick={() => playTone(midiToFreq(targetMidi), 1.8)}
        className="mt-3 text-sm font-medium text-[#0070f3] hover:underline"
      >
        Oír cómo debe sonar
      </button>

      {listening ? (
        <>
          <LevelMeter value={mic.level} />
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

export function PlayChord({
  exercise,
  mic,
  onDone,
}: {
  exercise: PlayChordExercise
  mic: MicApi
  onDone: (correct: boolean) => void
}) {
  const chord = chordById(exercise.chordId)!

  /** Las cuerdas que deben sonar, de la 6ª a la 1ª. Las mudas se saltan. */
  const targets = useMemo(
    () =>
      chord.frets
        .map((fret, i) => ({ index: i, stringNumber: 6 - i, fret, midi: TUNING[i] + fret }))
        .filter((t) => t.fret >= 0),
    [chord]
  )

  const [confirmed, setConfirmed] = useState(0)
  const done = confirmed >= targets.length
  const current = targets[confirmed]

  const matching =
    !done &&
    mic.freq !== null &&
    Math.abs(freqToMidi(mic.freq) - current.midi) < TOLERANCE_SEMITONES

  useEffect(() => {
    if (!matching) return
    const id = window.setTimeout(() => setConfirmed((c) => c + 1), HOLD_MS)
    return () => window.clearTimeout(id)
  }, [matching, confirmed])

  useEffect(() => {
    if (!done) return
    playTone(880, 0.6)
    const id = window.setTimeout(() => onDone(true), 800)
    return () => window.clearTimeout(id)
  }, [done, onDone])

  const listening = mic.status === 'listening'

  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
        Toca {chord.name} cuerda por cuerda
      </h2>
      <p className="mt-2 text-sm text-gray-500 max-w-sm">
        Forma el acorde y toca las cuerdas de una en una, despacio, empezando por la más grave. Se
        van marcando solas.
      </p>

      <div className="mt-6 rounded-2xl bg-gray-50 border border-gray-100 px-6 py-5">
        <ChordDiagram chord={chord} width={132} />
        <div className="mt-1 text-sm text-gray-500">{chord.tip}</div>
      </div>

      {/* Estado de cada cuerda, de la 6ª a la 1ª */}
      <div className="mt-6 flex gap-2">
        {chord.frets.map((fret, i) => {
          const stringNumber = 6 - i
          const pos = targets.findIndex((t) => t.index === i)
          const isMuted = fret < 0
          const isDone = pos >= 0 && pos < confirmed
          const isCurrent = pos === confirmed && !done

          let tone = 'bg-gray-100 text-gray-400 border-gray-200'
          if (isMuted) tone = 'bg-gray-50 text-gray-300 border-gray-100'
          else if (isDone) tone = 'bg-emerald-500 text-white border-emerald-500'
          else if (isCurrent)
            tone = matching
              ? 'bg-blue-500 text-white border-blue-500 scale-110'
              : 'bg-white text-blue-600 border-blue-500 border-2 animate-pulse'

          return (
            <div
              key={i}
              className={`w-11 h-14 rounded-xl border flex flex-col items-center justify-center transition-all ${tone}`}
            >
              <span className="text-[10px] font-mono opacity-70">{stringNumber}ª</span>
              <span className="text-sm font-bold">{isMuted ? '×' : noteNameEs(TUNING[i] + fret)}</span>
            </div>
          )
        })}
      </div>

      <p className="mt-4 text-sm font-medium text-gray-500 h-5">
        {done
          ? '¡Acorde completo!'
          : listening
            ? `Toca la cuerda ${current.stringNumber}ª`
            : ''}
      </p>

      {listening ? (
        <>
          <LevelMeter value={mic.level} />
          <div className="mt-4 flex gap-4">
            <button
              onClick={() => setConfirmed(0)}
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

// ───────────────────────────────────────────────────────────────────────────

export function Tune({
  exercise,
  mic,
  onDone,
}: {
  exercise: TuneExercise
  mic: MicApi
  onDone: (correct: boolean) => void
}) {
  const string = STRINGS.find((s) => s.number === exercise.string)!
  const [tuned, setTuned] = useState(false)

  const reading = useMemo(() => {
    if (!mic.freq) return null
    const { nearest } = centsOff(mic.freq)
    const cents = (freqToMidi(mic.freq) - string.midi) * 100
    return { nearest, cents }
  }, [mic.freq, string.midi])

  const inRange = !tuned && reading !== null && Math.abs(reading.cents) <= TUNE_CENTS

  useEffect(() => {
    if (!inRange) return
    const id = window.setTimeout(() => setTuned(true), TUNE_HOLD_MS)
    return () => window.clearTimeout(id)
  }, [inRange])

  useEffect(() => {
    if (!tuned) return
    playTone(880, 0.6)
    const id = window.setTimeout(() => onDone(true), 800)
    return () => window.clearTimeout(id)
  }, [tuned, onDone])

  const listening = mic.status === 'listening'
  const needle = reading ? Math.max(-50, Math.min(50, reading.cents)) : 0

  return (
    <div className="flex flex-col items-center text-center w-full">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
        Afina la {string.number}ª cuerda
      </h2>
      <p className="mt-2 text-sm text-gray-500 max-w-sm">
        Toca la cuerda {string.number}ª al aire ({string.label}) y gira la clavija hasta que la aguja
        quede en el centro.
      </p>

      <div
        className={`mt-7 text-6xl font-bold tabular-nums transition-colors ${
          tuned ? 'text-emerald-500' : reading ? 'text-gray-900' : 'text-gray-300'
        }`}
      >
        {reading ? noteNameEs(reading.nearest) : '··'}
      </div>
      <div className="h-6 font-mono text-sm text-gray-500">
        {reading ? `${reading.cents > 0 ? '+' : ''}${reading.cents.toFixed(0)} cents` : 'Toca la cuerda…'}
      </div>

      <div className="mt-5 w-full max-w-md">
        <div className="relative h-14">
          <div className="absolute inset-x-0 top-6 h-2 rounded-full bg-gray-100" />
          <div className="absolute left-1/2 -translate-x-1/2 top-6 h-2 w-[10%] rounded-full bg-emerald-200" />
          {reading && (
            <div
              className="absolute top-3 -translate-x-1/2 transition-[left] duration-100"
              style={{ left: `${((needle + 50) / 100) * 100}%` }}
            >
              <div className={`w-1 h-8 rounded-full ${inRange || tuned ? 'bg-emerald-500' : 'bg-[#0070f3]'}`} />
            </div>
          )}
        </div>
        <div className="flex justify-between text-xs font-medium text-gray-500 -mt-2">
          <span>Baja · aprieta</span>
          <span>Alta · afloja</span>
        </div>
      </div>

      <p className="mt-4 text-sm font-semibold h-5">
        {tuned ? (
          <span className="text-emerald-600">Afinada</span>
        ) : reading ? (
          <span className="text-gray-500">
            {reading.cents < -TUNE_CENTS
              ? 'Está baja: sube la tensión'
              : reading.cents > TUNE_CENTS
                ? 'Está alta: baja la tensión'
                : 'Casi… mantenla'}
          </span>
        ) : null}
      </p>

      <button
        onClick={() => playTone(midiToFreq(string.midi), 2)}
        className="mt-2 text-sm font-medium text-[#0070f3] hover:underline"
      >
        Oír la nota de referencia
      </button>

      {listening ? (
        <>
          <LevelMeter value={mic.level} />
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
