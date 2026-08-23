'use client';

import { motion } from 'framer-motion';
import { PERSONAS, type Persona, type PersonaId } from '@/lib/personas';
import Monito from './Monito';

/** El monito solo, en grande, para los botones de selección. */
function Retrato({ persona, size = 72 }: { persona: Persona; size?: number }) {
  return (
    <svg viewBox="-16 -16 32 32" width={size} height={size} aria-hidden className="block">
      <Monito persona={persona} escala={1.7} />
    </svg>
  );
}

export function SelectorPersona({ onEscoger }: { onEscoger: (id: PersonaId) => void }) {
  return (
    <div className="min-h-[320px] flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-md">
        <h2 className="text-center text-xl font-bold text-gray-900">¿Quién eres?</h2>
        <p className="mt-1 text-center text-sm text-gray-500">
          Para saber quién hizo qué. Lo puedes cambiar cuando quieras.
        </p>

        <div className="mt-7 grid grid-cols-2 gap-4">
          {PERSONAS.map((p) => (
            <motion.button
              key={p.id}
              onClick={() => onEscoger(p.id)}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 320, damping: 20 }}
              className="flex flex-col items-center gap-2 rounded-2xl border-2 border-gray-100 bg-gray-50/60 px-4 py-6 transition-colors hover:bg-white"
              style={{ borderColor: 'transparent' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = p.color)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
            >
              <Retrato persona={p} />
              <span className="font-semibold text-gray-900">{p.nombre}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** El botón chiquito para cambiar de persona sin salirse. */
export function ChipPersona({ persona, onCambiar }: { persona: Persona; onCambiar: () => void }) {
  return (
    <button
      onClick={onCambiar}
      className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white py-1 pl-1 pr-3 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
      title="Cambiar de persona"
    >
      <svg viewBox="-11 -11 22 22" width="24" height="24" aria-hidden className="block">
        <Monito persona={persona} escala={1.15} />
      </svg>
      {persona.nombre}
    </button>
  );
}
