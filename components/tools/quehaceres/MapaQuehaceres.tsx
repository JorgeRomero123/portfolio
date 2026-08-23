'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { QuehacerCalculado } from '@/lib/quehaceres';
import { agruparPorZona, marcadoresDeQuehaceres } from '@/lib/quehaceres-juego';
import type { Suciedad, ZonaId } from '@/lib/depa-mapa';
import type { Persona } from '@/lib/personas';
import PlanoDepa from '../depa/PlanoDepa';
import TarjetaQuehacer from './TarjetaQuehacer';
import FormaQuehacer from './FormaQuehacer';
import type { Acciones } from './tipos';

/** Orden de urgencia de un cuarto, para escoger cuál abrir al entrar. */
const PESO: Record<Suciedad, number> = { mugroso: 2, sucio: 1, limpio: 0 };

export default function MapaQuehaceres({
  quehaceres,
  persona,
  acciones,
  destello,
}: {
  quehaceres: QuehacerCalculado[];
  persona: Persona | null;
  acciones: Acciones;
  /** Mueble recién limpiado, para el destello sobre el plano. */
  destello: string | null;
}) {
  const zonas = useMemo(() => agruparPorZona(quehaceres), [quehaceres]);
  const marcadores = useMemo(() => marcadoresDeQuehaceres(quehaceres), [quehaceres]);

  const suciedadPorZona = useMemo(
    () => Object.fromEntries(zonas.map((z) => [z.zona, z.suciedad])) as Record<ZonaId, Suciedad>,
    [zonas]
  );

  // Se abre en el cuarto que peor está. Si todo está al día, el que tenga algo
  // más cerca de tocar; y si de plano no hay nada, el primero.
  const [zonaActiva, setZonaActiva] = useState<ZonaId>(() => {
    const orden = [...zonas].sort(
      (a, b) => PESO[b.suciedad] - PESO[a.suciedad] || b.pendientes - a.pendientes
    );
    return orden[0]?.zona ?? 'pasillo';
  });

  const [agregando, setAgregando] = useState(false);

  const abierta = zonas.find((z) => z.zona === zonaActiva) ?? zonas[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      {/* --- el plano --- */}
      <div>
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-[#f7f1e8] shadow-sm">
          <PlanoDepa
            marcadores={marcadores}
            zonaActiva={zonaActiva}
            onZona={(z) => {
              setZonaActiva(z);
              setAgregando(false);
              acciones.onEditar(null);
            }}
            persona={persona}
            destello={destello}
            suciedadPorZona={suciedadPorZona}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
          <Leyenda color="bg-red-500" texto="atrasado" />
          <Leyenda color="bg-amber-500" texto="ya casi o toca hoy" />
          <span className="text-gray-400">Sin burbuja, el cuarto está al día.</span>
        </div>
      </div>

      {/* --- el cuarto abierto --- */}
      <div>
        <AnimatePresence mode="wait">
          <motion.div
            key={abierta?.zona}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-4 flex items-baseline gap-2">
              <span className="text-xl">{abierta?.emoji}</span>
              <h3 className="text-lg font-bold text-gray-900">{abierta?.nombre}</h3>
              {abierta && abierta.pendientes > 0 && (
                <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                  {abierta.pendientes} pendiente{abierta.pendientes === 1 ? '' : 's'}
                </span>
              )}
            </div>

            <div className="space-y-3">
              {abierta?.quehaceres.map((q) =>
                acciones.editando === q.id ? (
                  <FormaQuehacer
                    key={q.id}
                    quehacer={q}
                    ocupado={acciones.ocupado === q.id}
                    onGuardar={(datos) => acciones.onGuardar(q.id, datos)}
                    onCancelar={() => acciones.onEditar(null)}
                    onArchivar={() => acciones.onArchivar(q.id)}
                    onReiniciar={() => acciones.onReiniciar(q.id)}
                  />
                ) : (
                  <TarjetaQuehacer
                    key={q.id}
                    quehacer={q}
                    ocupado={acciones.ocupado === q.id}
                    onHecho={() => acciones.onHecho(q)}
                    onEditar={() => acciones.onEditar(q.id)}
                    mostrarUbicacion={false}
                  />
                )
              )}
            </div>

            {abierta?.quehaceres.length === 0 && (
              <p className="rounded-2xl border border-dashed border-gray-200 px-6 py-8 text-center text-sm text-gray-500">
                Aquí no hay nada pendiente. Ni nada registrado.
              </p>
            )}

            <div className="mt-4">
              {agregando && abierta ? (
                <FormaQuehacer
                  zonaInicial={abierta.zona}
                  onGuardar={async (datos) => {
                    const ok = await acciones.onCrear(datos);
                    if (ok) setAgregando(false);
                  }}
                  onCancelar={() => setAgregando(false)}
                />
              ) : (
                <button
                  onClick={() => setAgregando(true)}
                  className="w-full rounded-2xl border-2 border-dashed border-gray-200 px-4 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-blue-300 hover:text-blue-600"
                >
                  + Agregar algo en {abierta?.nombre.toLowerCase()}
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Leyenda({ color, texto }: { color: string; texto: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {texto}
    </span>
  );
}
