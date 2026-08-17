'use client'

import { useCallback, useMemo } from 'react'
import { useStoredState } from './useStoredState'

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

/**
 * @param storageKey clave de localStorage propia de cada herramienta
 * @param orderedIds ids de los niveles en el orden del camino
 */
export function useLevelProgress(storageKey: string, orderedIds: string[]) {
  const [state, setState, hydrated] = useStoredState<ProgressState>(storageKey, EMPTY)

  const starsOf = useCallback((levelId: string) => state.stars[levelId] ?? 0, [state.stars])

  /** Un nivel se abre cuando el anterior tiene al menos una estrella. */
  const isUnlocked = useCallback(
    (levelId: string) => {
      const idx = orderedIds.indexOf(levelId)
      if (idx <= 0) return true
      return (state.stars[orderedIds[idx - 1]] ?? 0) > 0
    },
    [state.stars, orderedIds]
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
    const earned = orderedIds.reduce((sum, id) => sum + (state.stars[id] ?? 0), 0)
    const completed = orderedIds.filter((id) => (state.stars[id] ?? 0) > 0).length
    // El primer nivel sin estrellas es donde se retoma el camino.
    const next = orderedIds.find((id) => (state.stars[id] ?? 0) === 0)
    return {
      earnedStars: earned,
      maxStars: orderedIds.length * 3,
      completed,
      total: orderedIds.length,
      streak: computeStreak(state.days),
      practicedToday: state.days.includes(keyFor(new Date())),
      nextLevelId: next ?? null,
    }
  }, [state, orderedIds])

  return { ...derived, starsOf, isUnlocked, record, reset, hydrated }
}
