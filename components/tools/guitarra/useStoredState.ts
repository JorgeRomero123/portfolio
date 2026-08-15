'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

const noopSubscribe = () => () => {}

/**
 * `false` durante el render del servidor y el de hidratación, `true` después.
 * Permite leer localStorage sin provocar un desajuste de hidratación.
 */
export function useIsHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  )
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw !== null ? (JSON.parse(raw) as T) : fallback
  } catch {
    // localStorage bloqueado o JSON corrupto: seguimos con el valor inicial.
    return fallback
  }
}

/**
 * Estado persistido en localStorage. El valor guardado se lee en el
 * inicializador, pero no se expone hasta después de la hidratación para que el
 * primer render en cliente y en servidor coincidan.
 */
export function useStoredState<T>(key: string, initial: T) {
  const hydrated = useIsHydrated()
  const [stored, setStored] = useState<T>(() =>
    typeof window === 'undefined' ? initial : read(key, initial)
  )

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(key, JSON.stringify(stored))
    } catch {
      // Sin espacio o en modo privado: no es crítico.
    }
  }, [key, stored, hydrated])

  return [hydrated ? stored : initial, setStored, hydrated] as const
}
