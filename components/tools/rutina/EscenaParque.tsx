'use client';

import { motion } from 'framer-motion';
import { ITEMS_PARQUE, itemsParqueHasta } from '@/lib/rutina-parque-items';

/**
 * El parque. La escena reacciona a la meta semanal: la pista arranca vacía,
 * aparece un corredor con la primera salida y el sol se abre con la segunda.
 */

/**
 * Cada cosa del parque, con su recorte para poder dibujarla sola en chiquito.
 * El orden del arreglo es el orden de pintado: fondo primero, pista al final.
 */
const PIEZAS: Record<string, { caja: string; arte: React.ReactNode }> = {
  fuente: {
    caja: '92 148 60 40',
    arte: (
      <g>
        <ellipse cx="122" cy="182" rx="26" ry="7" fill="#a9c3d6" />
        <ellipse cx="122" cy="180" rx="20" ry="5" fill="#cfe6f3" />
        <rect x="119" y="162" width="6" height="18" fill="#b9c2cc" />
        <ellipse cx="122" cy="162" rx="11" ry="3.5" fill="#d5dde4" />
        <path d="M122 158 C118 150 126 150 122 158" fill="#9ed3ee" />
        <path d="M116 162 c-3 6 -4 10 -3 14" stroke="#bfe2f5" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M128 162 c3 6 4 10 3 14" stroke="#bfe2f5" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
    ),
  },
  estanque: {
    caja: '244 174 92 32',
    arte: (
      <g>
        <ellipse cx="290" cy="190" rx="44" ry="13" fill="#6fb3d6" />
        <ellipse cx="290" cy="189" rx="38" ry="10" fill="#89c9e6" />
        <path d="M266 188 h12 M300 193 h14" stroke="#b6e2f5" strokeWidth="1.6" strokeLinecap="round" />
      </g>
    ),
  },
  patos: {
    caja: '266 176 48 20',
    arte: (
      <g>
        <g transform="translate(274 186)">
          <ellipse cx="0" cy="0" rx="6" ry="4" fill="#f3f0e8" />
          <circle cx="5" cy="-4" r="3" fill="#f3f0e8" />
          <path d="M7.5 -4 l4 1 l-4 1z" fill="#e8a33d" />
          <circle cx="6" cy="-5" r="0.7" fill="#5b5348" />
        </g>
        <g transform="translate(298 190) scale(0.85)">
          <ellipse cx="0" cy="0" rx="6" ry="4" fill="#ddd8cc" />
          <circle cx="5" cy="-4" r="3" fill="#ddd8cc" />
          <path d="M7.5 -4 l4 1 l-4 1z" fill="#e8a33d" />
        </g>
      </g>
    ),
  },
  banca: {
    caja: '52 170 62 32',
    arte: (
      <g>
        <rect x="60" y="186" width="46" height="4" rx="1.5" fill="#a9764a" />
        <rect x="60" y="179" width="46" height="3.5" rx="1.5" fill="#b98455" />
        <rect x="62" y="190" width="3.5" height="9" fill="#7f8896" />
        <rect x="101" y="190" width="3.5" height="9" fill="#7f8896" />
        <rect x="62" y="176" width="3" height="12" fill="#7f8896" />
        <rect x="101" y="176" width="3" height="12" fill="#7f8896" />
      </g>
    ),
  },
  botella: {
    caja: '76 168 18 22',
    arte: (
      <g>
        <rect x="82" y="173" width="6" height="13" rx="2" fill="#4fb0e0" />
        <rect x="83.5" y="169" width="3" height="4" rx="1" fill="#2f7fae" />
        <rect x="82" y="177" width="6" height="3" fill="#8fd4f2" opacity="0.8" />
      </g>
    ),
  },
  tenis: {
    caja: '108 184 26 16',
    arte: (
      <g>
        <path d="M112 196 c0 -4 2 -6 5 -6 c2 0 3 2 6 3 c2 1 4 1 4 3 v1 h-15z" fill="#f0f2f5" />
        <path d="M112 197 h15 v1.6 h-15z" fill="#0070f3" />
        <path d="M118 191 l4 2" stroke="#c7d0dc" strokeWidth="1.2" />
        <path d="M120 196 c0 -3 1.5 -5 4 -5.5 c2 0 3 1.6 5.5 2.6 c2 0.8 3.5 1 3.5 2.7 v0.9 h-13z" fill="#e2e7ee" />
      </g>
    ),
  },
  farolas: {
    caja: '128 138 168 52',
    arte: (
      <g>
        {[136, 288].map((x) => (
          <g key={x}>
            <rect x={x} y="150" width="3.5" height="36" fill="#7f8896" />
            <path d={`M${x - 4} 150 h11.5 l-2 -6 h-7.5z`} fill="#e8d79a" />
            <ellipse cx={x + 1.7} cy="158" rx="10" ry="12" fill="#ffe9b8" opacity="0.22" />
          </g>
        ))}
      </g>
    ),
  },
  pajaros: {
    caja: '96 52 76 34',
    arte: (
      <g stroke="#5c6b7a" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.75">
        <path d="M100 66 q5 -5 10 0 q5 -5 10 0" />
        <path d="M128 78 q4 -4 8 0 q4 -4 8 0" />
        <path d="M148 60 q3.5 -3.5 7 0 q3.5 -3.5 7 0" />
      </g>
    ),
  },
  ardilla: {
    caja: '340 140 40 34',
    arte: (
      <g transform="translate(352 152)">
        <path d="M10 12 c8 -1 10 -8 5 -13 c-1 5 -3 8 -6 9" fill="#b5763f" />
        <ellipse cx="4" cy="10" rx="6" ry="5" fill="#c48449" />
        <circle cx="-1" cy="4" r="4" fill="#c48449" />
        <path d="M-4 1 l0 -3 l3 2z" fill="#a86b38" />
        <circle cx="-2.5" cy="3.5" r="0.8" fill="#3a2a1c" />
      </g>
    ),
  },
  perro: {
    caja: '160 194 40 26',
    arte: (
      <g transform="translate(168 202)">
        <path d="M18 6 c6 -2 7 -7 3 -9" stroke="#8a6244" strokeWidth="3" fill="none" strokeLinecap="round" />
        <ellipse cx="9" cy="7" rx="9" ry="5.5" fill="#a97a4e" />
        <circle cx="0" cy="3" r="4.5" fill="#a97a4e" />
        <path d="M-3 -1 l-1 -5 l4 3z" fill="#8a6244" />
        <circle cx="-1.5" cy="2.5" r="0.9" fill="#3a2a1c" />
        <path d="M4 11 l-1 5 M13 11 l1 5" stroke="#8a6244" strokeWidth="2.2" strokeLinecap="round" />
      </g>
    ),
  },
  corredores: {
    caja: '200 186 84 34',
    arte: (
      <g>
        {[[212, '#e8735a', 1], [258, '#5cba86', 0.9]].map(([x, c, sc]) => (
          <g key={x as number} transform={`translate(${x as number} 196) scale(${sc as number})`}>
            <circle cx="4" cy="0" r="3.4" fill="#e0b07a" />
            <rect x="1.6" y="4" width="5" height="7.5" rx="2.2" fill={c as string} />
            <path d="M2 11.5 l-2.4 5.5 M6 11.5 l2.4 5.5" stroke="#3d4f73" strokeWidth="1.9" strokeLinecap="round" />
            <path d="M1.5 6 l-3.6 3.6 M6.6 6 l3.6 2.8" stroke="#e0b07a" strokeWidth="1.9" strokeLinecap="round" />
          </g>
        ))}
      </g>
    ),
  },
};

/** Orden de pintado. Lo de la pista se dibuja después para que quede encima. */
const ORDEN_FONDO = [
  'pajaros', 'ardilla', 'fuente', 'farolas',
  'estanque', 'patos', 'banca', 'botella', 'tenis',
] as const;
const ORDEN_PISTA = ['perro', 'corredores'] as const;

/** Una pieza del parque, dibujada sola y recortada. */
export function MiniPiezaParque({ id, size = 44 }: { id: string; size?: number }) {
  const pieza = PIEZAS[id];
  if (!pieza) return null;
  return (
    <svg viewBox={pieza.caja} width={size} height={size} aria-hidden style={{ display: 'block', overflow: 'visible' }}>
      {pieza.arte}
    </svg>
  );
}

export default function EscenaParque({
  salidas, meta, barrasDesbloqueadas, km = 0, salidasTotales = 0, kmTotales = 0,
}: {
  salidas: number;
  meta: number;
  barrasDesbloqueadas: boolean;
  km?: number;
  salidasTotales?: number;
  kmTotales?: number;
}) {
  const cumplida = salidas >= meta;
  const ganados = itemsParqueHasta({ salidas: salidasTotales, km: kmTotales });
  const tiene = (id: string) => ganados.has(id);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200">
      <svg viewBox="0 0 400 250" className="block w-full" role="img" aria-label="El parque">
        <defs>
          <linearGradient id="rp-cielo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8fcdf0" />
            <stop offset="70%" stopColor="#c9e8f7" />
            <stop offset="100%" stopColor="#eaf6e4" />
          </linearGradient>
          <linearGradient id="rp-pasto" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8fc96f" />
            <stop offset="100%" stopColor="#6faf53" />
          </linearGradient>
          <radialGradient id="rp-sol" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#fff0b8" />
            <stop offset="60%" stopColor="#ffd66b" />
            <stop offset="100%" stopColor="#ffd66b" stopOpacity="0" />
          </radialGradient>
          <style>{`
            @keyframes rp-nube  { from{transform:translateX(0)} to{transform:translateX(420px)} }
            @keyframes rp-copa  { 0%,100%{transform:rotate(-1.6deg)} 50%{transform:rotate(1.6deg)} }
            @keyframes rp-corre { from{offset-distance:0%} to{offset-distance:100%} }
            @keyframes rp-brilla{ 0%,100%{opacity:.55} 50%{opacity:.9} }
            .rp-nube1 { animation: rp-nube 34s linear infinite; }
            .rp-nube2 { animation: rp-nube 52s linear infinite; }
            .rp-copa  { animation: rp-copa 5s ease-in-out infinite; transform-box: fill-box; transform-origin: bottom center; }
            .rp-copa-b{ animation: rp-copa 6.5s ease-in-out infinite; transform-box: fill-box; transform-origin: bottom center; }
            .rp-sol   { animation: rp-brilla 5s ease-in-out infinite; }
            .rp-corredor {
              offset-path: path('M 62 216 C 120 196, 280 196, 338 216');
              animation: rp-corre 6s linear infinite;
            }
            @media (prefers-reduced-motion: reduce) {
              .rp-nube1,.rp-nube2,.rp-copa,.rp-copa-b,.rp-sol,.rp-corredor { animation: none !important; }
            }
          `}</style>
        </defs>

        <rect x="0" y="0" width="400" height="250" fill="url(#rp-cielo)" />

        {/* sol */}
        <circle cx="322" cy="52" r="42" fill="url(#rp-sol)" className={cumplida ? 'rp-sol' : undefined} opacity={cumplida ? 1 : 0.65} />
        <circle cx="322" cy="52" r="17" fill="#ffdf85" />

        {/* nubes */}
        <g className="rp-nube1" opacity="0.9">
          <g transform="translate(-120 44)">
            <ellipse cx="40" cy="0" rx="26" ry="12" fill="#ffffff" />
            <ellipse cx="58" cy="4" rx="18" ry="9" fill="#ffffff" />
            <ellipse cx="24" cy="5" rx="16" ry="8" fill="#ffffff" />
          </g>
        </g>
        <g className="rp-nube2" opacity="0.7">
          <g transform="translate(-260 84)">
            <ellipse cx="30" cy="0" rx="20" ry="9" fill="#ffffff" />
            <ellipse cx="45" cy="3" rx="14" ry="7" fill="#ffffff" />
          </g>
        </g>

        {/* cerros */}
        <path d="M0 150 Q60 118 130 148 T260 146 T400 138 L400 170 L0 170 Z" fill="#9fd18a" />
        <path d="M0 162 Q90 138 180 160 T400 154 L400 190 L0 190 Z" fill="#8bc474" />

        {/* pasto */}
        <rect x="0" y="176" width="400" height="74" fill="url(#rp-pasto)" />

        {/* árboles */}
        {[
          { x: 40,  s: 1.0,  c: '#3f8f52', cls: 'rp-copa' },
          { x: 96,  s: 0.72, c: '#4fa35e', cls: 'rp-copa-b' },
          { x: 300, s: 0.86, c: '#469a58', cls: 'rp-copa-b' },
          { x: 358, s: 1.08, c: '#3a874c', cls: 'rp-copa' },
        ].map((t) => (
          <g key={t.x} transform={`translate(${t.x} 178) scale(${t.s})`}>
            <rect x="-5" y="-34" width="10" height="36" rx="3" fill="#8a6244" />
            <g className={t.cls}>
              <circle cx="0"   cy="-52" r="24" fill={t.c} />
              <circle cx="-17" cy="-40" r="17" fill={t.c} />
              <circle cx="17"  cy="-41" r="18" fill={t.c} />
              <circle cx="-6"  cy="-62" r="14" fill="#5cba6c" opacity="0.55" />
            </g>
          </g>
        ))}

        {/* barras — se desbloquean en el nivel 3 */}
        <g opacity={barrasDesbloqueadas ? 1 : 0.28}>
          <rect x="150" y="150" width="5" height="34" rx="2" fill="#7f8896" />
          <rect x="206" y="150" width="5" height="34" rx="2" fill="#7f8896" />
          <rect x="148" y="148" width="65" height="5" rx="2.5" fill="#9aa3b1" />
          <rect x="163" y="166" width="36" height="4" rx="2" fill="#9aa3b1" />
          {!barrasDesbloqueadas && (
            <text x="181" y="142" textAnchor="middle" fontSize="9" fill="#5c6b7a" fontFamily="system-ui">🔒 nivel 3</text>
          )}
        </g>

        {ORDEN_FONDO.filter(tiene).map((id) => (
          <g key={id}>{PIEZAS[id].arte}</g>
        ))}

        {/* pista */}
        <path d="M 40 220 C 110 190, 290 190, 360 220 L 360 240 C 290 212, 110 212, 40 240 Z" fill="#d97757" />
        <path d="M 46 222 C 114 194, 286 194, 354 222" fill="none" stroke="#ffffff" strokeWidth="1.6" opacity="0.85" strokeDasharray="10 8" />
        <path d="M 44 231 C 112 203, 288 203, 356 231" fill="none" stroke="#ffffff" strokeWidth="1.6" opacity="0.6" strokeDasharray="10 8" />

        {ORDEN_PISTA.filter(tiene).map((id) => (
          <g key={id}>{PIEZAS[id].arte}</g>
        ))}

        {/* corredor: aparece con la primera salida de la semana */}
        {salidas >= 1 && (
          <g className="rp-corredor">
            <g transform="translate(-4 -12)">
              <circle cx="4" cy="0" r="3.6" fill="#f0b755" />
              <rect x="1.6" y="4" width="5" height="8" rx="2.2" fill="#0070f3" />
              <path d="M2 12 l-2.5 6 M6 12 l2.5 6" stroke="#3d4f73" strokeWidth="2" strokeLinecap="round" />
              <path d="M1.5 6 l-4 4 M7 6 l4 3" stroke="#f0b755" strokeWidth="2" strokeLinecap="round" />
            </g>
          </g>
        )}
      </svg>

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-gray-200 bg-white/85 px-4 py-2.5 backdrop-blur">
        <span className="text-xs text-gray-600">
          Tu parque · {ganados.size} de {ITEMS_PARQUE.length} cosas ·{' '}
          {salidasTotales} salida{salidasTotales === 1 ? '' : 's'} · {kmTotales} km
        </span>
        <span className="w-full text-xs text-gray-600">
          Meta de la semana ·{' '}
          {Array.from({ length: meta }, (_, k) => (
            <span key={k} className={k < salidas ? 'text-emerald-600' : 'text-gray-300'}>●</span>
          ))}{' '}
          {salidas} de {meta}
          {km > 0 && <span className="ml-2 font-medium text-gray-700">· {km} km</span>}
        </span>
        <motion.span
          key={cumplida ? 'ok' : 'pend'}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-xs font-medium ${cumplida ? 'text-emerald-700' : 'text-gray-500'}`}
        >
          {cumplida ? '¡Meta cumplida! 🌳' : salidas === 0 ? 'La pista está vacía' : `Falta ${meta - salidas}`}
        </motion.span>
      </div>
    </div>
  );
}
