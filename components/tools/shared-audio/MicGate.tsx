'use client'

import type { DetectorStatus } from './usePitchDetector'

/** Lo que un ejercicio necesita del micrófono. Lo provee el nivel, no el
 *  ejercicio, para que la sesión sobreviva de un ejercicio al siguiente. */
export interface MicApi {
  status: DetectorStatus
  freq: number | null
  level: number
  start: () => void
  stop: () => void
}

/** Pantalla de permiso, con salida para quien no tenga micrófono. */
export function MicGate({ mic, onSkip }: { mic: MicApi; onSkip: () => void }) {
  return (
    <div className="mt-8 flex flex-col items-center gap-4">
      <button
        onClick={mic.start}
        disabled={mic.status === 'requesting'}
        className="px-7 py-3.5 rounded-2xl bg-[#0070f3] text-white font-semibold shadow-lg shadow-blue-500/25 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-60"
      >
        {mic.status === 'requesting' ? 'Pidiendo permiso…' : 'Activar micrófono'}
      </button>

      {mic.status === 'denied' && (
        <p className="text-sm text-red-600 max-w-sm text-center">
          El navegador bloqueó el micrófono. Ábrelo desde el candado de la barra de direcciones, o
          sigue sin él.
        </p>
      )}
      {mic.status === 'error' && (
        <p className="text-sm text-red-600 max-w-sm text-center">
          No se pudo abrir el micrófono. Puede que otra app lo esté usando.
        </p>
      )}

      <button onClick={onSkip} className="text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors">
        No tengo micrófono — lo hice
      </button>
    </div>
  )
}

export function LevelMeter({ value, hint }: { value: number; hint?: string }) {
  return (
    <div className="mt-6 w-full max-w-xs mx-auto">
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full bg-gray-300 transition-[width] duration-75"
          style={{ width: `${Math.min(100, value * 100)}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-gray-400 text-center">
        {hint ?? 'Si la barra no se mueve, acerca la guitarra al micrófono.'}
      </p>
    </div>
  )
}
