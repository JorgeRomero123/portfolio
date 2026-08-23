'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { QuehacerCalculado } from '@/lib/quehaceres';
import TarjetaQuehacer from './TarjetaQuehacer';
import FormaQuehacer from './FormaQuehacer';
import type { Acciones } from './tipos';

/** Todo el depa en una lista, ordenado por urgencia. La ruta rápida. */
export default function ListaQuehaceres({
  quehaceres,
  acciones,
}: {
  quehaceres: QuehacerCalculado[];
  acciones: Acciones;
}) {
  const [agregando, setAgregando] = useState(false);

  return (
    <div>
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {quehaceres.map((q) => (
            <motion.div
              key={q.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
            >
              {acciones.editando === q.id ? (
                <FormaQuehacer
                  quehacer={q}
                  ocupado={acciones.ocupado === q.id}
                  onGuardar={(datos) => acciones.onGuardar(q.id, datos)}
                  onCancelar={() => acciones.onEditar(null)}
                  onArchivar={() => acciones.onArchivar(q.id)}
                  onReiniciar={() => acciones.onReiniciar(q.id)}
                />
              ) : (
                <TarjetaQuehacer
                  quehacer={q}
                  ocupado={acciones.ocupado === q.id}
                  onHecho={() => acciones.onHecho(q)}
                  onEditar={() => acciones.onEditar(q.id)}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {quehaceres.length === 0 && (
        <p className="rounded-2xl border border-dashed border-gray-300 px-6 py-10 text-center text-gray-500">
          Todavía no hay quehaceres. Agrega el primero abajo.
        </p>
      )}

      <div className="mt-4">
        {agregando ? (
          <FormaQuehacer
            onGuardar={async (datos) => {
              const ok = await acciones.onCrear(datos);
              if (ok) setAgregando(false);
            }}
            onCancelar={() => setAgregando(false)}
          />
        ) : (
          <button
            onClick={() => setAgregando(true)}
            className="w-full rounded-2xl border-2 border-dashed border-gray-200 px-4 py-4 text-sm font-medium text-gray-500 transition-colors hover:border-blue-300 hover:text-blue-600"
          >
            + Agregar quehacer
          </button>
        )}
      </div>
    </div>
  );
}
