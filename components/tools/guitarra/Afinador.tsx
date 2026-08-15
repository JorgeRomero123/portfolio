'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePitchDetector } from './usePitchDetector'
import { playTone } from './audio'
import { STRINGS, centsOff, freqToMidi, midiToFreq, noteNameEs, octaveOf } from './music'

const IN_TUNE_CENTS = 5

export default function Afinador() {
  const { status, freq, level, start, stop } = usePitchDetector()
  const [pinned, setPinned] = useState<number | null>(null)
  const [tuned, setTuned] = useState<Record<number, boolean>>({})

  const reading = useMemo(() => {
    if (!freq) return null
    const { nearest, cents } = centsOff(freq)
    const midi = freqToMidi(freq)
    const target =
      pinned !== null
        ? STRINGS.find((s) => s.number === pinned)!
        : STRINGS.reduce((best, s) => (Math.abs(midi - s.midi) < Math.abs(midi - best.midi) ? s : best))
    const targetCents = (midi - target.midi) * 100
    return { nearest, cents, midi, target, targetCents }
  }, [freq, pinned])

  // Cuerda dentro de rango ahora mismo, o null. Se mantiene estable entre
  // lecturas, así que el temporizador de abajo no se reinicia cada 70 ms.
  const holding =
    reading && Math.abs(reading.targetCents) <= IN_TUNE_CENTS ? reading.target.number : null

  // Una cuerda cuenta como afinada tras aguantar medio segundo dentro de ±5 cents.
  useEffect(() => {
    if (holding === null) return
    const id = window.setTimeout(() => {
      setTuned((prev) => (prev[holding] ? prev : { ...prev, [holding]: true }))
    }, 500)
    return () => window.clearTimeout(id)
  }, [holding])

  const listening = status === 'listening'
  const displayCents = reading ? Math.max(-50, Math.min(50, reading.targetCents)) : 0
  const inTune = reading ? Math.abs(reading.targetCents) <= IN_TUNE_CENTS : false

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 sm:p-8">
        {!listening ? (
          <div className="text-center py-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Afinador por micrófono</h2>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              Toca una cuerda al aire y te digo si está alta o baja. Todo el análisis ocurre en tu
              navegador: el audio no sale de tu computadora.
            </p>
            <button
              onClick={() => void start()}
              disabled={status === 'requesting'}
              className="px-6 py-3 rounded-xl bg-[#0070f3] text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {status === 'requesting' ? 'Pidiendo permiso…' : 'Activar micrófono'}
            </button>

            {status === 'denied' && (
              <p className="mt-4 text-sm text-red-600 max-w-md mx-auto">
                El navegador bloqueó el micrófono. Ábrelo desde el candado de la barra de direcciones
                y vuelve a intentarlo. En macOS revisa también Ajustes → Privacidad → Micrófono.
              </p>
            )}
            {status === 'error' && (
              <p className="mt-4 text-sm text-red-600">
                No se pudo abrir el micrófono. Comprueba que ninguna otra app lo esté usando.
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Lectura principal */}
            <div className="text-center">
              <div className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-1">
                {pinned !== null ? 'Cuerda fijada' : 'Cuerda detectada'}
              </div>
              <div className="text-lg text-gray-600 mb-3">
                {reading ? `${reading.target.number}ª · ${reading.target.label}` : '—'}
              </div>

              <div
                className={`text-7xl sm:text-8xl font-bold tabular-nums transition-colors ${
                  !reading ? 'text-gray-300' : inTune ? 'text-emerald-500' : 'text-gray-900'
                }`}
              >
                {reading ? noteNameEs(reading.nearest) : '··'}
              </div>
              <div className="mt-1 h-6 font-mono text-sm text-gray-500">
                {reading
                  ? `${freq!.toFixed(1)} Hz · octava ${octaveOf(reading.nearest)} · ${
                      reading.targetCents > 0 ? '+' : ''
                    }${reading.targetCents.toFixed(0)} cents`
                  : 'Toca una cuerda…'}
              </div>
            </div>

            {/* Medidor de cents */}
            <div className="mt-6 max-w-lg mx-auto">
              <div className="relative h-16">
                <div className="absolute inset-x-0 top-7 h-2 rounded-full bg-gray-100" />
                <div className="absolute left-1/2 -translate-x-1/2 top-7 h-2 w-[10%] rounded-full bg-emerald-100" />
                {[-50, -25, 0, 25, 50].map((tick) => (
                  <div
                    key={tick}
                    className="absolute top-2 -translate-x-1/2 flex flex-col items-center gap-1"
                    style={{ left: `${((tick + 50) / 100) * 100}%` }}
                  >
                    <span className="text-[10px] font-mono text-gray-400">{tick === 0 ? '♪' : tick}</span>
                    <div className={`w-px ${tick === 0 ? 'h-4 bg-gray-400' : 'h-2 bg-gray-200'}`} />
                  </div>
                ))}
                {reading && (
                  <div
                    className="absolute top-4 -translate-x-1/2 transition-[left] duration-100"
                    style={{ left: `${((displayCents + 50) / 100) * 100}%` }}
                  >
                    <div
                      className={`w-1 h-8 rounded-full ${inTune ? 'bg-emerald-500' : 'bg-[#0070f3]'}`}
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-between text-sm font-medium text-gray-500 -mt-1">
                <span>Baja · aprieta la clavija</span>
                <span>Alta · aflójala</span>
              </div>
              <div className="mt-3 text-center h-6">
                {reading && (
                  <span
                    className={`text-sm font-semibold ${inTune ? 'text-emerald-600' : 'text-gray-500'}`}
                  >
                    {inTune
                      ? 'Afinada'
                      : reading.targetCents < 0
                        ? 'Está baja: sube la tensión poco a poco'
                        : 'Está alta: baja la tensión poco a poco'}
                  </span>
                )}
              </div>
            </div>

            {/* Nivel de entrada */}
            <div className="mt-6 max-w-lg mx-auto">
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-gray-300 transition-[width] duration-75"
                  style={{ width: `${level * 100}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-400 text-center">
                Nivel de entrada. Si no se mueve, acerca la guitarra al micrófono.
              </p>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={stop}
                className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                Apagar micrófono
              </button>
            </div>
          </>
        )}
      </div>

      {/* Las seis cuerdas */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Las seis cuerdas</h3>
          <button
            onClick={() => {
              setPinned(null)
              setTuned({})
            }}
            className="text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors"
          >
            Reiniciar
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {STRINGS.map((s) => {
            const isActive = reading?.target.number === s.number
            const isPinned = pinned === s.number
            return (
              <div
                key={s.number}
                className={`rounded-xl border p-3 transition-colors ${
                  isActive ? 'border-[#0070f3] bg-blue-50/60' : 'border-gray-100 bg-gray-50/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-gray-400">{s.number}ª</span>
                  {tuned[s.number] && (
                    <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.8 3.8 6.8-6.8a1 1 0 011.4 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div className="font-semibold text-gray-900 mt-0.5">{s.label}</div>
                <div className="text-xs font-mono text-gray-400">{midiToFreq(s.midi).toFixed(1)} Hz</div>
                <div className="mt-2 flex gap-1">
                  <button
                    onClick={() => playTone(midiToFreq(s.midi))}
                    className="flex-1 text-xs font-medium py-1.5 rounded-lg bg-white border border-gray-200 hover:border-gray-300 text-gray-700 transition-colors"
                  >
                    Oír
                  </button>
                  <button
                    onClick={() => setPinned(isPinned ? null : s.number)}
                    className={`flex-1 text-xs font-medium py-1.5 rounded-lg border transition-colors ${
                      isPinned
                        ? 'bg-[#0070f3] border-[#0070f3] text-white'
                        : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    Fijar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Afina siempre subiendo hacia la nota: si te pasaste, afloja de más y vuelve a subir. Así la
          cuerda se asienta y aguanta afinada más tiempo.
        </p>
      </div>
    </div>
  )
}
