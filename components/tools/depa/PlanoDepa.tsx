'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  MUEBLES,
  ZONAS,
  ZONA_POR_DEFECTO,
  anclaBurbuja,
  mueble as buscarMueble,
  nombreEnPlano,
  rutaEntre,
  zona as buscarZona,
  type Marcador,
  type Punto,
  type Suciedad,
  type ZonaId,
} from '@/lib/depa-mapa';
import type { Persona } from '@/lib/personas';
import { ARTE, mugreDe } from './arte-muebles';
import Monito from './Monito';

/**
 * El plano del depa.
 *
 * A propósito no sabe qué es un quehacer: recibe marcadores (un mueble, un
 * color, una etiqueta) y los dibuja. Cualquier herramienta que hable el
 * vocabulario de lib/depa-mapa.ts puede pintar sobre este mismo depa.
 */

const COLOR: Record<Suciedad, { relleno: string; borde: string; piso: string }> = {
  limpio: { relleno: '#22c55e', borde: '#16a34a', piso: 'transparent' },
  sucio: { relleno: '#f59e0b', borde: '#d97706', piso: '#fef3c7' },
  mugroso: { relleno: '#ef4444', borde: '#dc2626', piso: '#fee2e2' },
};

/** Cuánto tarda el monito en cruzar un tramo de la ruta. */
const SEGUNDOS_POR_TRAMO = 0.32;

export type PlanoDepaProps = {
  marcadores: Marcador[];
  /** Cuarto abierto. null = ninguno, el monito se queda donde estaba. */
  zonaActiva: ZonaId | null;
  onZona: (z: ZonaId) => void;
  /** Quién anda caminando. null mientras no se escoge personaje. */
  persona: Persona | null;
  /** Mueble que se acaba de limpiar, para el destello. */
  destello?: string | null;
  /** Tinta el piso de cada cuarto según su peor mueble. */
  suciedadPorZona?: Partial<Record<ZonaId, Suciedad>>;
};

export default function PlanoDepa({
  marcadores,
  zonaActiva,
  onZona,
  persona,
  destello,
  suciedadPorZona = {},
}: PlanoDepaProps) {
  const sinMovimiento = useReducedMotion();

  const porMueble = useMemo(() => {
    const m = new Map<string, Marcador>();
    for (const x of marcadores) m.set(x.mueble, x);
    return m;
  }, [marcadores]);

  // --- el paseo del monito ------------------------------------------------
  // El origen siempre es el centro del cuarto donde quedó, así que la ruta se
  // arma con puros datos y no hace falta leer su posición real.
  const dondeEsta = useRef<ZonaId>(ZONA_POR_DEFECTO);
  const [camino, setCamino] = useState<Punto[]>([buscarZona(ZONA_POR_DEFECTO).centro]);

  useEffect(() => {
    if (!zonaActiva || zonaActiva === dondeEsta.current) return;
    setCamino([buscarZona(dondeEsta.current).centro, ...rutaEntre(dondeEsta.current, zonaActiva)]);
    dondeEsta.current = zonaActiva;
  }, [zonaActiva]);

  const duracion = sinMovimiento ? 0 : Math.max(0.3, SEGUNDOS_POR_TRAMO * (camino.length - 1));

  return (
    <svg
      viewBox="0 0 400 300"
      className="block w-full select-none"
      role="group"
      aria-label="Plano del depa"
    >
      <defs>
        <style>{`
          @keyframes dp-late { 0%,100%{ transform: scale(1) } 50%{ transform: scale(1.16) } }
          .dp-late { animation: dp-late 1.6s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
          @keyframes dp-chispa { 0%{ opacity:0; transform: scale(.4) } 40%{ opacity:1 } 100%{ opacity:0; transform: scale(1.9) } }
          .dp-chispa { animation: dp-chispa .9s ease-out forwards; transform-box: fill-box; transform-origin: center; }
          @media (prefers-reduced-motion: reduce) {
            .dp-late, .dp-chispa { animation: none !important; }
          }
        `}</style>
      </defs>

      {/* --- cuartos --- */}
      <rect x="0" y="0" width="400" height="300" rx="6" fill="#f7f1e8" />

      {ZONAS.map((z) => {
        const abierto = zonaActiva === z.id;
        const tinte = COLOR[suciedadPorZona[z.id] ?? 'limpio'].piso;

        return (
          <g
            key={z.id}
            onClick={() => onZona(z.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onZona(z.id);
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={`${z.nombre}. Abrir sus pendientes.`}
            className="cursor-pointer outline-none [&:focus-visible>.dp-marco]:stroke-blue-500 [&:focus-visible>.dp-marco]:stroke-[3]"
          >
            <rect {...z.caja} fill="#fffdf9" />
            {tinte !== 'transparent' && <rect {...z.caja} fill={tinte} opacity="0.5" />}
            <rect
              {...z.caja}
              className="dp-marco transition-all"
              fill={abierto ? '#0070f3' : 'transparent'}
              fillOpacity={abierto ? 0.06 : 0}
              stroke={abierto ? '#0070f3' : '#b7a993'}
              strokeWidth={abierto ? 3 : 1.6}
            />
          </g>
        );
      })}

      {/* --- muebles --- */}
      {MUEBLES.map((m) => {
        const marca = porMueble.get(m.id);
        const arte = ARTE[m.id];
        if (!arte) return null;

        return (
          <g key={m.id} transform={`translate(${m.x} ${m.y})`} pointerEvents="none">
            {arte.base}
            {marca && mugreDe(arte, marca.suciedad)}
            {destello === m.id && (
              <g className="dp-chispa" stroke="#facc15" strokeWidth="2" strokeLinecap="round">
                <circle r="15" fill="none" stroke="#fde047" strokeWidth="2.5" />
                <path d="M0 -22 v-6 M0 22 v6 M-22 0 h-6 M22 0 h6" />
              </g>
            )}
          </g>
        );
      })}

      {/* --- burbujas --- */}
      {marcadores.map((marca) => {
        if (marca.suciedad === 'limpio') return null;
        const m = buscarMueble(marca.mueble);
        if (!m) return null;

        const p = anclaBurbuja(m);
        const c = COLOR[marca.suciedad];

        return (
          <g key={marca.mueble} transform={`translate(${p.x} ${p.y})`} pointerEvents="none">
            <path d="M0 9 l-4 -5 h8 z" fill={c.relleno} />
            <circle
              r="9"
              fill={c.relleno}
              stroke="#ffffff"
              strokeWidth="2.5"
              className={marca.suciedad === 'mugroso' ? 'dp-late' : undefined}
            />
            <text
              y="3.6"
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              fill="#ffffff"
              fontFamily="system-ui, sans-serif"
            >
              {marca.conteo}
            </text>
          </g>
        );
      })}

      {/* --- nombres de los cuartos --- */}
      {ZONAS.map((z) => {
        // En un cuarto angosto el nombre va girado y arriba: pegado abajo se
        // cortaba, y al centro chocaba con el monito.
        const angosto = z.caja.width < 60;
        const x = angosto ? z.caja.x + z.caja.width / 2 + 3 : z.caja.x + 7;
        const y = angosto ? z.caja.y + 48 : z.caja.y + z.caja.height - 8;

        return (
          <text
            key={z.id}
            x={x}
            y={y}
            textAnchor={angosto ? 'middle' : 'start'}
            fontSize="8"
            fontWeight="700"
            letterSpacing="0.6"
            fill="#a2947f"
            fontFamily="system-ui, sans-serif"
            pointerEvents="none"
            transform={angosto ? `rotate(-90 ${x} ${y})` : undefined}
          >
            {nombreEnPlano(z).toUpperCase()}
          </text>
        );
      })}

      {/* --- el monito --- */}
      {persona && (
        <motion.g
          initial={{ x: camino[0].x, y: camino[0].y }}
          animate={{ x: camino.map((p) => p.x), y: camino.map((p) => p.y) }}
          transition={{ duration: duracion, ease: 'easeInOut' }}
          pointerEvents="none"
        >
          <Monito persona={persona} />
        </motion.g>
      )}
    </svg>
  );
}
