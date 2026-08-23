'use client';

import { motion } from 'framer-motion';
import type { Juego, Salud } from '@/lib/quehaceres-juego';

/**
 * El estado del depa en una tira.
 *
 * La salud va primero porque es la que contesta "¿está limpio?": baja sola con
 * los días y se recupera al ponerse al corriente. El nivel va después, chiquito
 * y aparte, porque contesta otra cosa —cuánto llevan hecho entre los dos— y
 * solo sube.
 */

const TONO: Record<Salud['tono'], { color: string; texto: string; fondo: string }> = {
  bien: { color: '#10b981', texto: 'text-emerald-700', fondo: 'bg-emerald-50' },
  regular: { color: '#f59e0b', texto: 'text-amber-700', fondo: 'bg-amber-50' },
  mal: { color: '#ef4444', texto: 'text-red-700', fondo: 'bg-red-50' },
};

export default function MarcadorDepa({ juego, salud }: { juego: Juego; salud: Salud }) {
  const { nivel, semana } = juego;
  const tono = TONO[salud.tono];
  const tope = Math.max(1, ...semana.map((p) => p.hechos));
  const totalSemana = semana.reduce((n, p) => n + p.hechos, 0);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        {/* --- salud --- */}
        <div className="flex items-center gap-4">
          <Anillo valor={salud.valor} porcentaje={salud.porcentaje} color={tono.color} />

          <div className="min-w-0">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Salud del depa
            </h3>
            <p className={`mt-0.5 text-lg font-bold ${tono.texto}`}>{salud.etiqueta}</p>
            <p className="mt-0.5 text-xs text-gray-500">
              {salud.alDia} de {salud.total} al corriente
            </p>
          </div>
        </div>

        <div className="hidden w-px self-stretch bg-gray-100 sm:block" />

        {/* --- nivel y semana --- */}
        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="font-semibold uppercase tracking-wide text-gray-400">
                <span className="mr-1 tracking-normal">🏠</span> Nivel {nivel.nivel}
              </span>
              <span className="tabular-nums text-gray-400">
                {nivel.hasta === null
                  ? 'nivel máximo'
                  : `faltan ${nivel.faltan.toLocaleString('es-MX')} XP`}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                initial={false}
                animate={{ width: `${Math.round(nivel.progreso * 100)}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 22 }}
              />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Esta semana
            </h4>

            {totalSemana === 0 ? (
              <p className="mt-1.5 text-sm text-gray-500">Todavía nadie ha marcado nada. 👀</p>
            ) : (
              <div className="mt-2 space-y-2">
                {semana.map((p) => (
                  <div key={p.persona} className="flex items-center gap-3">
                    <span
                      className="w-11 flex-shrink-0 text-sm font-medium"
                      style={{ color: p.color }}
                    >
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
                    <span className="w-5 flex-shrink-0 text-right text-sm tabular-nums text-gray-600">
                      {p.hechos}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {salud.peores.length > 0 && (
        <p className={`mt-4 rounded-xl px-3 py-2 text-xs ${tono.fondo} ${tono.texto}`}>
          <span className="font-semibold">Lo que más pesa:</span>{' '}
          {salud.peores.map((q) => q.nombre.toLowerCase()).join(', ')}.
        </p>
      )}
    </div>
  );
}

/** El anillo de salud. Se vacía en sentido horario desde arriba. */
function Anillo({
  valor,
  porcentaje,
  color,
}: {
  valor: number;
  porcentaje: number;
  color: string;
}) {
  const r = 30;
  const vuelta = 2 * Math.PI * r;

  return (
    <svg viewBox="0 0 80 80" width="78" height="78" className="flex-shrink-0" aria-hidden>
      <circle cx="40" cy="40" r={r} fill="none" stroke="#f1f2f4" strokeWidth="8" />
      <motion.circle
        cx="40"
        cy="40"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        transform="rotate(-90 40 40)"
        strokeDasharray={vuelta}
        initial={false}
        animate={{ strokeDashoffset: vuelta * (1 - valor) }}
        transition={{ type: 'spring', stiffness: 90, damping: 20 }}
      />
      <text
        x="40"
        y="46"
        textAnchor="middle"
        fontSize="20"
        fontWeight="700"
        fill="#111827"
        fontFamily="system-ui, sans-serif"
      >
        {porcentaje}
      </text>
    </svg>
  );
}
