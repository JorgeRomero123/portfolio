'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { playTone } from './audio'
import { useStoredState } from './useStoredState'
import type { TabId } from './GuitarraApp'

interface Exercise {
  id: string
  name: string
  minutes: number
  what: string
  goTo?: TabId
}

const ROUTINE: Exercise[] = [
  {
    id: 'afinar',
    name: 'Afinar',
    minutes: 2,
    what: 'Cuerda por cuerda, de la 6ª a la 1ª. Una guitarra desafinada te enseña el oído mal, así que esto no se salta nunca.',
    goTo: 'afinador',
  },
  {
    id: 'calentar',
    name: 'Calentamiento cromático',
    minutes: 3,
    what: 'Dedos 1-2-3-4 en trastes consecutivos, cuerda por cuerda, ida y vuelta. Lento y parejo. Busca que cada nota suene limpia, no velocidad.',
  },
  {
    id: 'forma',
    name: 'Forma del acorde',
    minutes: 5,
    what: 'Coloca un acorde, toca cuerda por cuerda y escucha cuál zumba. Ajusta el dedo culpable. Suelta la mano y vuelve a formarlo. Diez veces.',
    goTo: 'acordes',
  },
  {
    id: 'cambios',
    name: 'Cambios en un minuto',
    minutes: 5,
    what: 'Dos acordes, un minuto, contando cambios limpios. Dos o tres rondas con parejas distintas. Es el ejercicio que más rápido te hace avanzar.',
    goTo: 'acordes',
  },
  {
    id: 'rasgueo',
    name: 'Rasgueo con metrónomo',
    minutes: 5,
    what: 'Un solo acorde y la mano derecha bajando a negras. Cuando esté estable, prueba abajo-abajo-arriba-arriba-abajo-arriba. La muñeca no deja de moverse aunque no toques la cuerda.',
    goTo: 'acordes',
  },
  {
    id: 'tocar',
    name: 'Toca algo de verdad',
    minutes: 5,
    what: 'Una canción con los acordes que ya tienes, aunque vaya lentísima y con errores. Esta parte es la que hace que mañana vuelvas.',
  },
]

const TOTAL_MINUTES = ROUTINE.reduce((sum, e) => sum + e.minutes, 0)

const keyFor = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function computeStreak(days: string[]): number {
  const set = new Set(days)
  const cursor = new Date()
  if (!set.has(keyFor(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
    if (!set.has(keyFor(cursor))) return 0
  }
  let streak = 0
  while (set.has(keyFor(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

const mmss = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

export default function Practica({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const [days, setDays, hydrated] = useStoredState<string[]>('guitarra.dias', [])
  const [index, setIndex] = useState(0)
  const [left, setLeft] = useState(ROUTINE[0].minutes * 60)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState<string[]>([])

  const current = ROUTINE[index]
  const streak = useMemo(() => (hydrated ? computeStreak(days) : 0), [days, hydrated])
  const todayDone = hydrated && days.includes(keyFor(new Date()))

  const finishSession = useCallback(() => {
    const today = keyFor(new Date())
    setDays((prev) => (prev.includes(today) ? prev : [...prev, today].slice(-120)))
  }, [setDays])

  const advance = useCallback(() => {
    setDone((prev) => (prev.includes(current.id) ? prev : [...prev, current.id]))
    if (index < ROUTINE.length - 1) {
      const next = index + 1
      setIndex(next)
      setLeft(ROUTINE[next].minutes * 60)
      setRunning(false)
    } else {
      setRunning(false)
      finishSession()
    }
  }, [current.id, index, finishSession])

  const leftRef = useRef(left)
  useEffect(() => {
    leftRef.current = left
  }, [left])

  // El propio intervalo cierra el bloque cuando llega a cero: campanita y
  // salto al siguiente ejercicio, sin encadenar efectos.
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      if (leftRef.current > 1) {
        setLeft(leftRef.current - 1)
        return
      }
      setLeft(0)
      playTone(880, 0.9)
      window.setTimeout(() => playTone(1320, 1.1), 160)
      advance()
    }, 1000)
    return () => clearInterval(id)
  }, [running, advance])

  const selectExercise = (i: number) => {
    setIndex(i)
    setLeft(ROUTINE[i].minutes * 60)
    setRunning(false)
  }

  const resetRoutine = () => {
    setDone([])
    setIndex(0)
    setLeft(ROUTINE[0].minutes * 60)
    setRunning(false)
  }

  const allDone = done.length === ROUTINE.length
  const progress = 1 - left / (current.minutes * 60)

  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    return { key: keyFor(d), label: d.getDate(), practiced: days.includes(keyFor(d)) }
  })

  return (
    <div className="space-y-6">
      {/* Progreso */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 sm:p-8">
        <div className="flex flex-wrap items-end gap-8 mb-6">
          <div>
            <div className="text-4xl font-bold text-gray-900 tabular-nums">{streak}</div>
            <div className="text-xs uppercase tracking-wider text-gray-400 mt-1">
              {streak === 1 ? 'Día seguido' : 'Días seguidos'}
            </div>
          </div>
          <div>
            <div className="text-4xl font-bold text-gray-900 tabular-nums">{days.length}</div>
            <div className="text-xs uppercase tracking-wider text-gray-400 mt-1">
              Sesiones totales
            </div>
          </div>
          <div>
            <div className="text-4xl font-bold text-gray-900 tabular-nums">
              {Math.round((days.length * TOTAL_MINUTES) / 60)}
              <span className="text-xl text-gray-400 ml-1">h</span>
            </div>
            <div className="text-xs uppercase tracking-wider text-gray-400 mt-1">Tiempo tocado</div>
          </div>
        </div>

        <div className="flex gap-1.5">
          {last14.map((day) => (
            <div key={day.key} className="flex-1 text-center">
              <div
                className={`h-9 rounded-lg border transition-colors ${
                  day.practiced ? 'bg-[#0070f3] border-[#0070f3]' : 'bg-gray-50 border-gray-100'
                }`}
              />
              <span className="text-[10px] text-gray-400 mt-1 block">{day.label}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-gray-500">
          {todayDone
            ? 'Ya practicaste hoy. Todo lo demás es bonus.'
            : 'Quince minutos diarios rinden más que dos horas el domingo. La racha es el objetivo real.'}
        </p>
      </div>

      {/* Temporizador */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 sm:p-8">
        <div className="flex items-baseline justify-between mb-1">
          <h2 className="text-xl font-bold text-gray-900">Rutina de {TOTAL_MINUTES} minutos</h2>
          <button
            onClick={resetRoutine}
            className="text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors"
          >
            Reiniciar
          </button>
        </div>
        <p className="text-gray-500 text-sm mb-6">
          Seis bloques cortos. No hace falta terminarlos todos para que cuente el día.
        </p>

        <div className="rounded-xl bg-gray-50 border border-gray-100 p-6 text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Bloque {index + 1} de {ROUTINE.length}
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{current.name}</div>

          <div className="text-6xl sm:text-7xl font-bold tabular-nums text-gray-900 mt-4">
            {mmss(left)}
          </div>

          <div className="mt-4 h-1.5 rounded-full bg-gray-200 overflow-hidden max-w-sm mx-auto">
            <div
              className="h-full bg-[#0070f3] transition-[width] duration-1000 ease-linear"
              style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }}
            />
          </div>

          <p className="mt-5 text-sm text-gray-600 max-w-lg mx-auto leading-relaxed">{current.what}</p>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setRunning((r) => !r)}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-colors ${
                running
                  ? 'bg-gray-900 text-white hover:bg-gray-700'
                  : 'bg-[#0070f3] text-white hover:bg-blue-700'
              }`}
            >
              {running ? 'Pausa' : left === current.minutes * 60 ? 'Empezar' : 'Continuar'}
            </button>
            <button
              onClick={advance}
              className="px-6 py-2.5 rounded-xl font-medium bg-white border border-gray-200 text-gray-700 hover:border-gray-300 transition-colors"
            >
              Hecho
            </button>
            {current.goTo && (
              <button
                onClick={() => onNavigate(current.goTo!)}
                className="px-6 py-2.5 rounded-xl font-medium bg-white border border-gray-200 text-gray-700 hover:border-gray-300 transition-colors"
              >
                Abrir herramienta
              </button>
            )}
          </div>
        </div>

        {allDone && (
          <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-center">
            <p className="font-semibold text-emerald-800">Rutina completa. Día registrado.</p>
            <p className="text-sm text-emerald-700 mt-0.5">
              Guarda la guitarra fuera del estuche y a la vista: es el truco que más sube la
              probabilidad de que mañana la agarres.
            </p>
          </div>
        )}

        <div className="mt-6 space-y-1.5">
          {ROUTINE.map((ex, i) => (
            <button
              key={ex.id}
              onClick={() => selectExercise(i)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${
                i === index
                  ? 'border-[#0070f3] bg-blue-50/50'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <span
                className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  done.includes(ex.id)
                    ? 'bg-emerald-500 text-white'
                    : i === index
                      ? 'bg-[#0070f3] text-white'
                      : 'bg-gray-100 text-gray-500'
                }`}
              >
                {done.includes(ex.id) ? '✓' : i + 1}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-medium text-gray-900 text-sm">{ex.name}</span>
              </span>
              <span className="shrink-0 text-xs font-mono text-gray-400">{ex.minutes} min</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
