'use client'

import { useState } from 'react'
import { useIsHydrated } from './useStoredState'
import Empezar from './Empezar'
import Afinador from './Afinador'
import Acordes from './Acordes'
import Diapason from './Diapason'
import Practica from './Practica'

export type TabId = 'empezar' | 'afinador' | 'acordes' | 'diapason' | 'practica'

const TABS: { id: TabId; label: string; hint: string }[] = [
  { id: 'empezar', label: 'Empezar', hint: 'Lo básico si nunca has tocado' },
  { id: 'afinador', label: 'Afinador', hint: 'Afina con el micrófono' },
  { id: 'acordes', label: 'Acordes', hint: 'Diagramas y entrenador de cambios' },
  { id: 'diapason', label: 'Diapasón', hint: 'Notas y escalas en el mástil' },
  { id: 'practica', label: 'Práctica', hint: 'Rutina diaria y progreso' },
]

const isTabId = (value: string): value is TabId => TABS.some((t) => t.id === value)

export default function GuitarraApp() {
  const hydrated = useIsHydrated()

  // El hash permite compartir o recargar en la sección en la que estabas. Se
  // lee en el inicializador y solo se aplica tras hidratar, para que el
  // servidor y el primer render del cliente rendericen lo mismo.
  const [selected, setTab] = useState<TabId>(() => {
    if (typeof window === 'undefined') return 'empezar'
    const fromHash = window.location.hash.slice(1)
    return isTabId(fromHash) ? fromHash : 'empezar'
  })
  const tab = hydrated ? selected : 'empezar'

  const navigate = (next: TabId) => {
    setTab(next)
    window.history.replaceState(null, '', `#${next}`)
    window.scrollTo({ top: 0 })
  }

  return (
    <div>
      <nav
        aria-label="Secciones"
        /* top-16 deja libre la barra de navegación del sitio, que también es sticky. */
        className="sticky top-16 z-20 -mx-4 px-4 py-3 bg-gray-50/90 backdrop-blur-sm mb-6"
      >
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => navigate(t.id)}
              title={t.hint}
              aria-current={tab === t.id ? 'page' : undefined}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {tab === 'empezar' && <Empezar onNavigate={navigate} />}
      {tab === 'afinador' && <Afinador />}
      {tab === 'acordes' && <Acordes />}
      {tab === 'diapason' && <Diapason />}
      {tab === 'practica' && <Practica onNavigate={navigate} />}
    </div>
  )
}
