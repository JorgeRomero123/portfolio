'use client';

import { motion } from 'framer-motion';

/**
 * El parque. La escena reacciona a la meta semanal: la pista arranca vacía,
 * aparece un corredor con la primera salida y el sol se abre con la segunda.
 */
export default function EscenaParque({
  salidas, meta, barrasDesbloqueadas,
}: {
  salidas: number; meta: number; barrasDesbloqueadas: boolean;
}) {
  const cumplida = salidas >= meta;

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

        {/* pista */}
        <path d="M 40 220 C 110 190, 290 190, 360 220 L 360 240 C 290 212, 110 212, 40 240 Z" fill="#d97757" />
        <path d="M 46 222 C 114 194, 286 194, 354 222" fill="none" stroke="#ffffff" strokeWidth="1.6" opacity="0.85" strokeDasharray="10 8" />
        <path d="M 44 231 C 112 203, 288 203, 356 231" fill="none" stroke="#ffffff" strokeWidth="1.6" opacity="0.6" strokeDasharray="10 8" />

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

      <div className="flex items-center justify-between gap-3 border-t border-gray-200 bg-white/85 px-4 py-2.5 backdrop-blur">
        <span className="text-xs text-gray-600">
          Meta de la semana ·{' '}
          {Array.from({ length: meta }, (_, k) => (
            <span key={k} className={k < salidas ? 'text-emerald-600' : 'text-gray-300'}>●</span>
          ))}{' '}
          {salidas} de {meta}
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
