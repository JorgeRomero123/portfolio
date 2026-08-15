'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import ChordDiagram from './ChordDiagram'
import { useMetronome } from './useMetronome'
import { useStoredState } from './useStoredState'
import { playTone } from './audio'
import {
  CHORDS,
  LEVEL_LABEL,
  PROGRESSIONS,
  TUNING,
  type Chord,
  type ChordLevel,
  chordById,
} from './music'
import { midiToFreq } from './music'

const LEVELS: ChordLevel[] = ['esencial', 'siguiente', 'cejilla']
const ROUND_SECONDS = 60

/** Rasguea el acorde: una nota por cuerda, escalonadas como una púa bajando. */
function strum(chord: Chord) {
  chord.frets.forEach((fret, i) => {
    if (fret < 0) return
    window.setTimeout(() => playTone(midiToFreq(TUNING[i] + fret), 1.8), i * 45)
  })
}

export default function Acordes() {
  const [selected, setSelected] = useState<Chord>(CHORDS[0])

  return (
    <div className="space-y-6">
      <Biblioteca selected={selected} onSelect={setSelected} />
      <Entrenador />
      <CambiosUnMinuto />
    </div>
  )
}

// ---------------------------------------------------------------------------

function Biblioteca({ selected, onSelect }: { selected: Chord; onSelect: (c: Chord) => void }) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 sm:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Biblioteca de acordes</h2>
      <p className="text-gray-500 text-sm mb-6">
        Los números bajo el diagrama son los dedos: 1 índice, 2 medio, 3 anular, 4 meñique.
      </p>

      <div className="grid md:grid-cols-[220px_1fr] gap-6 items-start">
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-5 text-center md:sticky md:top-6">
          <ChordDiagram chord={selected} width={150} className="mx-auto" />
          <div className="mt-3 text-2xl font-bold text-gray-900">{selected.name}</div>
          <div className="text-sm text-gray-500">{selected.nameEs}</div>
          <button
            onClick={() => strum(selected)}
            className="mt-4 w-full py-2 rounded-lg bg-[#0070f3] text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Oír cómo suena
          </button>
          <p className="mt-4 text-xs text-gray-600 leading-relaxed text-left">{selected.tip}</p>
        </div>

        <div className="space-y-6">
          {LEVELS.map((level) => (
            <div key={level}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                {LEVEL_LABEL[level]}
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                {CHORDS.filter((c) => c.level === level).map((chord) => (
                  <button
                    key={chord.id}
                    onClick={() => onSelect(chord)}
                    className={`rounded-xl border p-2 transition-all ${
                      selected.id === chord.id
                        ? 'border-[#0070f3] bg-blue-50/60'
                        : 'border-gray-100 hover:border-gray-300 hover:-translate-y-0.5'
                    }`}
                  >
                    <ChordDiagram chord={chord} width={78} hideFingers className="mx-auto" />
                    <div className="text-xs font-semibold text-gray-900 mt-1">{chord.name}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function Entrenador() {
  const [progId, setProgId] = useState(PROGRESSIONS[0].id)
  const [bpm, setBpm] = useState(60)
  const [barsPerChord, setBarsPerChord] = useState(2)
  const [clickOn, setClickOn] = useState(true)

  const progression = PROGRESSIONS.find((p) => p.id === progId)!
  const metro = useMetronome({ bpm, beatsPerBar: 4, muted: !clickOn })

  const chords = useMemo(
    () => progression.chords.map((id) => chordById(id)!).filter(Boolean),
    [progression]
  )

  const index = metro.running ? Math.floor(metro.bar / barsPerChord) % chords.length : 0
  const current = chords[index]
  const next = chords[(index + 1) % chords.length]
  const barsLeft = metro.running ? barsPerChord - (metro.bar % barsPerChord) : barsPerChord

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 sm:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Entrenador de cambios</h2>
      <p className="text-gray-500 text-sm mb-6">
        El metrónomo te avisa cuándo cambiar. Empieza a 50–60 BPM con 2 compases por acorde: el
        objetivo no es ir rápido, es llegar al cambio sin frenar.
      </p>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-6">
          <div className="flex items-center justify-center gap-6 sm:gap-10">
            <div className="text-center">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Ahora
              </div>
              <ChordDiagram chord={current} width={140} />
              <div className="mt-2 text-2xl font-bold text-gray-900">{current.name}</div>
            </div>
            <div className="text-center opacity-50">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Sigue
              </div>
              <ChordDiagram chord={next} width={96} hideFingers />
              <div className="mt-2 text-lg font-semibold text-gray-700">{next.name}</div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-75 ${
                  metro.beat === i
                    ? i === 0
                      ? 'w-4 h-4 bg-[#0070f3]'
                      : 'w-4 h-4 bg-gray-800'
                    : 'w-3 h-3 bg-gray-200'
                }`}
              />
            ))}
          </div>
          <div className="mt-3 text-center text-sm text-gray-500 h-5">
            {metro.running
              ? barsLeft === 1
                ? 'Cambia en el siguiente compás'
                : `${barsLeft} compases en este acorde`
              : 'Detenido'}
          </div>
        </div>

        <div className="space-y-5">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Progresión
            </span>
            <select
              value={progId}
              onChange={(e) => setProgId(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              {PROGRESSIONS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <span className="mt-1.5 block text-xs text-gray-500">{progression.note}</span>
          </label>

          <label className="block">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Tempo
              </span>
              <span className="font-mono text-sm text-gray-900">{bpm} BPM</span>
            </div>
            <input
              type="range"
              min={40}
              max={160}
              step={1}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="mt-2 w-full accent-[#0070f3]"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Compases por acorde
            </span>
            <div className="mt-1.5 flex gap-2">
              {[1, 2, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => setBarsPerChord(n)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    barsPerChord === n
                      ? 'bg-[#0070f3] border-[#0070f3] text-white'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={clickOn}
              onChange={(e) => setClickOn(e.target.checked)}
              className="rounded accent-[#0070f3]"
            />
            Click audible
          </label>

          <button
            onClick={metro.toggle}
            className={`w-full py-3 rounded-xl font-semibold transition-colors ${
              metro.running
                ? 'bg-gray-900 text-white hover:bg-gray-700'
                : 'bg-[#0070f3] text-white hover:bg-blue-700'
            }`}
          >
            {metro.running ? 'Parar' : 'Empezar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function CambiosUnMinuto() {
  const [a, setA] = useState('Em')
  const [b, setB] = useState('G')
  const [count, setCount] = useState(0)
  const [left, setLeft] = useState(ROUND_SECONDS)
  const [running, setRunning] = useState(false)
  const [records, setRecords] = useStoredState<Record<string, number>>('guitarra.cambios', {})

  const key = [a, b].sort().join('-')
  const record = records[key] ?? 0

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setLeft((prev) => {
        if (prev <= 1) {
          setRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running])

  // Al terminar la ronda, guarda la marca si supera la anterior de esa pareja.
  useEffect(() => {
    if (running || left !== 0 || count === 0) return
    setRecords((prev) => (count > (prev[key] ?? 0) ? { ...prev, [key]: count } : prev))
  }, [running, left, count, key, setRecords])

  const begin = () => {
    setCount(0)
    setLeft(ROUND_SECONDS)
    setRunning(true)
  }

  const tally = useCallback(() => {
    if (running) setCount((c) => c + 1)
  }, [running])

  useEffect(() => {
    if (!running) return
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        tally()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [running, tally])

  const chordA = chordById(a)!
  const chordB = chordById(b)!
  const finished = !running && left === 0 && count > 0

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 sm:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Cambios en un minuto</h2>
      <p className="text-gray-500 text-sm mb-6">
        El ejercicio clásico: un minuto yendo y viniendo entre dos acordes, contando cada cambio
        limpio. Cuenta con la barra espaciadora o con el botón. Solo vale si las cuerdas suenan.
      </p>

      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        {[
          { label: 'Acorde A', value: a, set: setA },
          { label: 'Acorde B', value: b, set: setB },
        ].map(({ label, value, set }) => (
          <label key={label} className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              {label}
            </span>
            <select
              value={value}
              onChange={(e) => set(e.target.value)}
              disabled={running}
              className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 bg-white disabled:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              {CHORDS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.nameEs}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <div className="rounded-xl bg-gray-50 border border-gray-100 p-6">
        <div className="flex items-center justify-center gap-8 mb-6">
          <div className="text-center">
            <ChordDiagram chord={chordA} width={104} hideFingers />
            <div className="mt-1 font-semibold text-gray-900">{chordA.name}</div>
          </div>
          <div className="text-gray-300 text-2xl">⇄</div>
          <div className="text-center">
            <ChordDiagram chord={chordB} width={104} hideFingers />
            <div className="mt-1 font-semibold text-gray-900">{chordB.name}</div>
          </div>
        </div>

        <div className="flex items-end justify-center gap-10 mb-6">
          <div className="text-center">
            <div className="text-5xl font-bold tabular-nums text-gray-900">{count}</div>
            <div className="text-xs uppercase tracking-wider text-gray-400 mt-1">Cambios</div>
          </div>
          <div className="text-center">
            <div
              className={`text-5xl font-bold tabular-nums ${left <= 10 && running ? 'text-red-500' : 'text-gray-400'}`}
            >
              {left}
            </div>
            <div className="text-xs uppercase tracking-wider text-gray-400 mt-1">Segundos</div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold tabular-nums text-emerald-500">{record || '—'}</div>
            <div className="text-xs uppercase tracking-wider text-gray-400 mt-1">Tu récord</div>
          </div>
        </div>

        {running ? (
          <button
            onClick={tally}
            className="w-full py-6 rounded-xl bg-[#0070f3] text-white text-lg font-bold hover:bg-blue-700 active:scale-[0.99] transition-all"
          >
            Cambio · barra espaciadora
          </button>
        ) : (
          <button
            onClick={begin}
            className="w-full py-4 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-700 transition-colors"
          >
            {finished ? 'Otra ronda' : 'Empezar el minuto'}
          </button>
        )}

        {finished && (
          <p className="mt-4 text-center text-sm text-gray-600">
            {count >= record
              ? 'Récord nuevo para esta pareja de acordes.'
              : `Tu mejor marca aquí son ${record} cambios. Descansa un minuto y vuelve a intentarlo.`}
          </p>
        )}
      </div>
    </div>
  )
}
