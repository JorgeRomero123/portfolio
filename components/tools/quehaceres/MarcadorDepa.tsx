'use client';

import { motion } from 'framer-motion';
import type { Juego } from '@/lib/quehaceres-juego';

/**
 * El marcador del depa: un solo nivel para los dos.
 *
 * El reparto de la semana se ve, pero no es una competencia — quien vaya
 * abajo igual está subiendo el mismo nivel.
 */
export default function MarcadorDepa({ juego }: { juego: Juego }) {
  const { nivel, semana } = juego;
  const tope = Math.max(1, ...semana.map((p) => p.hechos));
  const totalSemana = semana.reduce((n, p) => n + p.hechos, 0);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-bold text-gray-900">
          <span className="mr-1.5">🏠</span> El depa · nivel {nivel.nivel}
        </h3>
        <span className="text-sm tabular-nums text-gray-500">{nivel.xp.toLocaleString('es-MX')} XP</span>
      </div>

      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
          initial={false}
          animate={{ width: `${Math.round(nivel.progreso * 100)}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 22 }}
        />
      </div>

      <p className="mt-2 text-xs text-gray-500">
        {nivel.hasta === null
          ? 'Nivel máximo. El depa nunca estuvo tan limpio. 🎉'
          : `Faltan ${nivel.faltan.toLocaleString('es-MX')} XP para el nivel ${nivel.nivel + 1}.`}
      </p>

      <div className="mt-5 border-t border-gray-100 pt-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Esta semana</h4>

        {totalSemana === 0 ? (
          <p className="mt-2 text-sm text-gray-500">Todavía nadie ha marcado nada. 👀</p>
        ) : (
          <div className="mt-3 space-y-2.5">
            {semana.map((p) => (
              <div key={p.persona} className="flex items-center gap-3">
                <span className="w-12 flex-shrink-0 text-sm font-medium" style={{ color: p.color }}>
                  {p.nombre}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: p.color }}
                    initial={false}
                    animate={{ width: `${(p.hechos / tope) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 140, damping: 20 }}
                  />
                </div>
                <span className="w-6 flex-shrink-0 text-right text-sm tabular-nums text-gray-600">
                  {p.hechos}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
