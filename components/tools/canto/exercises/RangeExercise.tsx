'use client'

import { useEffect, useState } from 'react'
import { MicGate, LevelMeter, type MicApi } from '../../shared-audio/MicGate'
import { freqToMidi, noteLabel } from '../../shared-audio/notes'
import {
  VOICE_MAX_MIDI,
  VOICE_MIN_MIDI,
  describeRange,
  isUsable,
  voiceLabel,
  type VoiceRange,
} from '../voice'

/** Hay que sostener la nota este tiempo para que cuente como extremo real. */
const HOLD_MS = 300

type Phase = 'low' | 'high' | 'done'

interface Props {
  mic: MicApi
  onCalibrated: (range: VoiceRange) => void
  onDone: (correct: boolean) => void
}

export default function RangeExercise({ mic, onCalibrated, onDone }: Props) {
  const [phase, setPhase] = useState<Phase>('low')
  const [low, setLow] = useState<number | null>(null)
  const [high, setHigh] = useState<number | null>(null)

  const detected = mic.freq ? Math.round(freqToMidi(mic.freq)) : null
  const valid = detected !== null && detected >= VOICE_MIN_MIDI && detected <= VOICE_MAX_MIDI

  // Solo cuenta lo que aguantas: una nota de paso no marca tu extremo. El
  // temporizador se reinicia mientras la nota siga cambiando.
  useEffect(() => {
    if (!valid || phase === 'done') return
    const note = detected
    const id = window.setTimeout(() => {
      if (phase === 'low') setLow((prev) => (prev === null ? note : Math.min(prev, note)))
      else setHigh((prev) => (prev === null ? note : Math.max(prev, note)))
    }, HOLD_MS)
    return () => window.clearTimeout(id)
  }, [valid, detected, phase])

  const finish = () => {
    if (low === null || high === null) return
    const range = { low, high }
    setPhase('done')
    onCalibrated(range)
    window.setTimeout(() => onDone(isUsable(range)), 1200)
  }

  const listening = mic.status === 'listening'

  if (phase === 'done') {
    const range = { low: low!, high: high! }
    const usable = isUsable(range)
    return (
      <div className="flex flex-col items-center text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {usable ? 'Este es tu rango' : 'Nos faltó rango'}
        </h2>
        {usable ? (
          <>
            <div className="mt-6 text-4xl font-bold text-rose-600 tabular-nums">
              {describeRange(range)}
            </div>
            <p className="mt-2 text-gray-500">
              {range.high - range.low + 1} semitonos · {voiceLabel(range)}
            </p>
            <p className="mt-6 text-sm text-gray-600 max-w-sm">
              A partir de ahora todos los ejercicios se transponen a tu voz. Puedes volver a medirlo
              cuando quieras: el rango crece con la práctica.
            </p>
          </>
        ) : (
          <p className="mt-4 text-gray-500 max-w-sm">
            Salieron muy pocas notas entre el grave y el agudo. Repite el nivel cantando con más
            confianza, o sigue con el rango estándar.
          </p>
        )}
      </div>
    )
  }

  const target = phase === 'low' ? low : high
  const accent = phase === 'low' ? 'text-blue-600' : 'text-rose-600'

  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 max-w-lg text-balance">
        {phase === 'low'
          ? 'Canta la nota más grave que puedas, sin forzar'
          : 'Ahora la más aguda que te salga cómoda'}
      </h2>
      <p className="mt-2 text-sm text-gray-500 max-w-sm">
        Usa una &laquo;aaa&raquo; y mantenla un segundo. Prueba varias veces: me quedo con la más{' '}
        {phase === 'low' ? 'grave' : 'aguda'}.
      </p>

      <div className="mt-8 flex items-center gap-10">
        <div>
          <div className="text-xs uppercase tracking-wider text-gray-400 mb-1">Ahora</div>
          <div className={`text-5xl font-bold tabular-nums ${valid ? 'text-gray-900' : 'text-gray-300'}`}>
            {valid ? noteLabel(detected) : '··'}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-gray-400 mb-1">
            Tu {phase === 'low' ? 'más grave' : 'más aguda'}
          </div>
          <div className={`text-5xl font-bold tabular-nums ${target !== null ? accent : 'text-gray-300'}`}>
            {target !== null ? noteLabel(target) : '··'}
          </div>
        </div>
      </div>

      {!listening ? (
        <MicGate mic={mic} onSkip={() => onDone(true)} />
      ) : (
        <>
          <LevelMeter value={mic.level} hint="Si la barra no se mueve, acércate al micrófono." />

          <div className="mt-6 flex flex-col items-center gap-3">
            {phase === 'low' ? (
              <button
                onClick={() => setPhase('high')}
                disabled={low === null}
                className="px-7 py-3 rounded-2xl bg-gray-900 text-white font-semibold hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Listo, ahora la aguda
              </button>
            ) : (
              <button
                onClick={finish}
                disabled={high === null}
                className="px-7 py-3 rounded-2xl bg-[#0070f3] text-white font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Guardar mi rango
              </button>
            )}
            {phase === 'high' && low !== null && (
              <span className="text-xs text-gray-400">Grave registrado: {noteLabel(low)}</span>
            )}
          </div>
        </>
      )}
    </div>
  )
}
