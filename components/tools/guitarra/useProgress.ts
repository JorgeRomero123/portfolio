'use client'

import { useCallback, useMemo } from 'react'
import { useStoredState } from './useStoredState'
import { ALL_LEVELS } from './curriculum'

const STORAGE_KEY = 'guitarra.progreso.v1'

export interface ProgressState {
  /** levelId → mejor resultado, de 1 a 3 estrellas. */
  stars: Record<string, number>
  /** Fechas YYYY-MM-DD en las que se completó al menos un nivel. */
  days: string[]
}

const EMPTY: ProgressState = { stars: {}, days: [] }

const keyFor = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function computeStreak(days: string[]): number {
  const set = new Set(days)
  const cursor = new Date()
  // La racha sigue viva si practicaste hoy o ayer; si no, se rompió.
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

export function useProgress() {
  const [state, setState, hydrated] = useStoredState<ProgressState>(STORAGE_KEY, EMPTY)

  const starsOf = useCallback((levelId: string) => state.stars[levelId] ?? 0, [state.stars])

  /** Un nivel se abre cuando el anterior tiene al menos una estrella. */
  const isUnlocked = useCallback(
    (levelId: string) => {
      const idx = ALL_LEVELS.findIndex((l) => l.level.id === levelId)
      if (idx <= 0) return true
      return (state.stars[ALL_LEVELS[idx - 1].level.id] ?? 0) > 0
    },
    [state.stars]
  )

  const record = useCallback(
    (levelId: string, stars: number) => {
      if (stars <= 0) return
      const today = keyFor(new Date())
      setState((prev) => ({
        stars: { ...prev.stars, [levelId]: Math.max(prev.stars[levelId] ?? 0, stars) },
        days: prev.days.includes(today) ? prev.days : [...prev.days, today].slice(-180),
      }))
    },
    [setState]
  )

  const reset = useCallback(() => setState(EMPTY), [setState])

  const derived = useMemo(() => {
    const earned = ALL_LEVELS.reduce((sum, l) => sum + (state.stars[l.level.id] ?? 0), 0)
    const completed = ALL_LEVELS.filter((l) => (state.stars[l.level.id] ?? 0) > 0).length
    // El primer nivel sin estrellas es donde se retoma el camino.
    const next = ALL_LEVELS.find((l) => (state.stars[l.level.id] ?? 0) === 0)
    return {
      earnedStars: earned,
      maxStars: ALL_LEVELS.length * 3,
      completed,
      total: ALL_LEVELS.length,
      streak: computeStreak(state.days),
      practicedToday: state.days.includes(keyFor(new Date())),
      nextLevelId: next?.level.id ?? null,
    }
  }, [state])

  return { ...derived, starsOf, isUnlocked, record, reset, hydrated }
}
