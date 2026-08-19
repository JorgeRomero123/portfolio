'use client';

import { motion } from 'framer-motion';
import { ITEMS_DEPA, itemsHasta, proximoItem } from '@/lib/rutina-items';

/**
 * El cuarto. Cada nivel mete un mueble; el tapete está desde el principio.
 * Todo es SVG para que cada objeto pueda entrar por separado con su propio
 * resorte y el conjunto siga viéndose de una sola pieza.
 */

const entrada = {
  hidden: { opacity: 0, y: 14, scale: 0.9 },
  show: { opacity: 1, y: 0, scale: 1 },
};
const resorte = { type: 'spring' as const, stiffness: 260, damping: 18 };

/**
 * Los muebles ya ganados se dibujan tal cual. Solo el recién desbloqueado
 * entra animado.
 *
 * Antes todos entraban con su resorte, lo cual dejaba el cuarto en opacity 0
 * hasta que corriera la animación — en una pestaña de fondo, con el rAF
 * estrangulado, abrías tu rutina y el depa estaba vacío.
 */
function Item({
  nuevo, children, origen,
}: {
  nuevo?: boolean; children: React.ReactNode; origen: string;
}) {
  if (!nuevo) return <g>{children}</g>;

  return (
    <motion.g
      variants={entrada}
      initial="hidden"
      animate="show"
      transition={resorte}
      style={{ transformOrigin: origen, transformBox: 'fill-box' }}
    >
      {children}
    </motion.g>
  );
}

const PIEZAS: Record<string, { origen: string; caja: string; arte: React.ReactNode }> = {
  // ventana — nivel 6
  ventana: {
    origen: 'center',
    caja: '246 32 116 88',
    arte: (
            <g>
              <rect x="252" y="38" width="104" height="76" rx="4" fill="url(#rd-cielo)" stroke="#fffaf2" strokeWidth="6" />
              <path d="M262 100 h12 v14 h-12z M280 92 h14 v22 h-14z M300 82 h10 v32 h-10z M316 96 h13 v18 h-13z M335 88 h12 v26 h-12z"
                    fill="#7a94b8" opacity="0.55" />
              <circle cx="272" cy="58" r="8" fill="#fff3cd" />
              <line x1="304" y1="38" x2="304" y2="114" stroke="#fffaf2" strokeWidth="4" />
              <path d="M252 114 L200 200 L360 200 L356 114 Z" fill="url(#rd-luz)" opacity="0.5" />
            </g>
    ),
  },
  // póster del Tottenham — nivel 9
  poster: {
    origen: 'center',
    caja: '30 38 74 92',
    arte: (
            <g>
              <rect x="36" y="44" width="62" height="80" rx="3" fill="#ffffff" stroke="#d8cebd" strokeWidth="2" />
              <rect x="36" y="44" width="62" height="26" rx="3" fill="#132257" />
              <text x="67" y="62" textAnchor="middle" fontSize="13" fontWeight="700" fill="#ffffff" fontFamily="system-ui">COYS</text>
              <circle cx="67" cy="94" r="15" fill="none" stroke="#132257" strokeWidth="2" />
              <path d="M67 82 l3 8 h-6 z" fill="#132257" />
              <text x="67" y="118" textAnchor="middle" fontSize="7" fill="#8a93a8" fontFamily="system-ui">TOTTENHAM</text>
            </g>
    ),
  },
  // repisa — nivel 5
  repisa: {
    origen: 'center',
    caja: '124 74 96 32',
    arte: (
            <g>
              <rect x="128" y="96" width="86" height="6" rx="2" fill="#a9764a" />
              {[[134, 12, '#5b8def'], [148, 16, '#e8735a'], [160, 10, '#5cba86'], [170, 18, '#f0b755'], [184, 13, '#8a6cd4']]
                .map(([x, h, c]) => (
                  <rect key={x as number} x={x as number} y={96 - (h as number)} width="10" height={h as number} rx="1.5" fill={c as string} />
                ))}
              <rect x="198" y="86" width="14" height="10" rx="2" fill="#cfe4d0" />
            </g>
    ),
  },
  // alfombra — nivel 4
  alfombra: {
    origen: 'center',
    caja: '72 198 248 34',
    arte: (
      <g>
        <ellipse cx="196" cy="224" rx="120" ry="22" fill="#e0b7a0" />
        <ellipse cx="196" cy="224" rx="96" ry="16" fill="none" stroke="#cf9d82" strokeWidth="2" />
      </g>
    ),
  },
  // tapete — nivel 1, siempre
  tapete: {
    origen: 'center',
    caja: '140 206 118 34',
    arte: (
            <g>
              <rect x="146" y="212" width="106" height="22" rx="6" fill="#5aa9c8" />
              <rect x="146" y="212" width="106" height="22" rx="6" fill="none" stroke="#4790ab" strokeWidth="1.5" />
              <line x1="164" y1="214" x2="164" y2="232" stroke="#4790ab" strokeWidth="1" opacity="0.6" />
              <line x1="234" y1="214" x2="234" y2="232" stroke="#4790ab" strokeWidth="1" opacity="0.6" />
            </g>
    ),
  },
  // lámpara — nivel 3
  lampara: {
    origen: 'bottom',
    caja: '0 120 62 102',
    arte: (
            <g>
              <ellipse cx="30" cy="214" rx="15" ry="4" fill="#8a6244" />
              <rect x="28" y="150" width="4" height="64" fill="#8a6244" />
              <path d="M14 150 L46 150 L40 126 L20 126 Z" fill="#f6d78a" stroke="#e0bd6a" strokeWidth="1.5" />
              <ellipse cx="30" cy="176" rx="30" ry="34" fill="#ffe9b8" opacity="0.28" />
            </g>
    ),
  },
  // planta — nivel 2
  planta: {
    origen: 'bottom',
    caja: '310 150 44 78',
    arte: (
            <g>
              <path d="M320 200 h22 l-3 22 h-16 z" fill="#c97b53" />
              <rect x="318" y="196" width="26" height="6" rx="2" fill="#dc8a5f" />
              <g className="rd-hoja">
                <path d="M331 196 C331 176 320 168 316 158 C328 162 333 176 333 190" fill="#4f9d5d" />
                <path d="M331 196 C331 178 342 170 348 160 C338 164 333 178 333 192" fill="#5cba6c" />
                <path d="M331 194 C331 182 326 172 322 166 C330 170 333 182 333 192" fill="#3f8a4d" />
              </g>
            </g>
    ),
  },
  // guitarra — nivel 7
  guitarra: {
    origen: 'bottom',
    caja: '342 104 58 122',
    arte: (
            <g transform="rotate(9 372 200)">
              <rect x="368" y="120" width="7" height="58" rx="2" fill="#8a6244" />
              <rect x="366" y="112" width="11" height="12" rx="2" fill="#6b4a34" />
              <ellipse cx="371" cy="192" rx="21" ry="25" fill="#d99a53" />
              <ellipse cx="371" cy="192" rx="14" ry="18" fill="#e8ab63" />
              <circle cx="371" cy="188" r="6" fill="#7a5334" />
            </g>
    ),
  },
  // tocadiscos — nivel 8
  tocadiscos: {
    origen: 'bottom',
    caja: '46 158 64 62',
    arte: (
            <g>
              <rect x="52" y="184" width="52" height="30" rx="3" fill="#a9764a" />
              <rect x="52" y="184" width="52" height="4" rx="2" fill="#c08f5b" />
              <rect x="56" y="164" width="44" height="20" rx="2" fill="#2f3542" />
              <circle cx="78" cy="176" r="7" fill="#1a1e26" className="rd-disco" />
              <circle cx="78" cy="176" r="2" fill="#f0b755" />
              <rect x="92" y="168" width="2" height="9" rx="1" fill="#8a93a8" />
            </g>
    ),
  },
  // pesa rusa — nivel 11
  pesa: {
    origen: 'bottom',
    caja: '108 192 38 44',
    arte: (
            <g>
              <path d="M118 206 a9 9 0 0 1 18 0" fill="none" stroke="#4a5260" strokeWidth="4" />
              <ellipse cx="127" cy="220" rx="14" ry="12" fill="#4a5260" />
              <ellipse cx="123" cy="216" rx="4" ry="3" fill="#6d7686" opacity="0.7" />
            </g>
    ),
  },
  // gato — nivel 10
  gato: {
    origen: 'bottom',
    caja: '198 188 60 40',
    arte: (
            <g>
              <path className="rd-cola" d="M236 214 c14 2 18 -6 14 -14" fill="none" stroke="#5c5750" strokeWidth="4" strokeLinecap="round" />
              <ellipse cx="224" cy="214" rx="16" ry="12" fill="#6b655c" />
              <circle cx="212" cy="203" r="9" fill="#6b655c" />
              <path d="M205 197 l1 -7 l6 4 z M219 197 l-1 -7 l-6 4 z" fill="#6b655c" />
              <circle cx="209" cy="202" r="1.4" fill="#f7f1e8" />
              <circle cx="215" cy="202" r="1.4" fill="#f7f1e8" />
            </g>
    ),
  },
};

/** Orden de pintado: pared al fondo, gato hasta enfrente. */
const ORDEN = ['ventana', 'poster', 'repisa', 'alfombra', 'tapete', 'lampara', 'planta', 'guitarra', 'tocadiscos', 'pesa', 'gato'] as const;


/**
 * El mueble que sigue, dibujado chiquito para ponerlo junto a la barra de XP.
 * Es el mismo arte de la escena, recortado a su caja.
 */
export function MiniPieza({ id, size = 44 }: { id: string; size?: number }) {
  const pieza = PIEZAS[id];
  if (!pieza) return null;

  return (
    <svg
      viewBox={pieza.caja}
      width={size}
      height={size}
      aria-hidden
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="rd-cielo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a8d8f0" />
          <stop offset="100%" stopColor="#ffd9a8" />
        </linearGradient>
        <radialGradient id="rd-luz" cx="0.5" cy="0.1" r="0.7">
          <stop offset="0%" stopColor="#ffe9b8" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffe9b8" stopOpacity="0" />
        </radialGradient>
      </defs>
      {pieza.arte}
    </svg>
  );
}

export default function EscenaDepa({ nivel, nuevo }: { nivel: number; nuevo?: string }) {
  const tiene = itemsHasta(nivel);
  const has = (id: string) => tiene.has(id);
  const proximo = proximoItem(nivel);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-[#f7f1e8]">
      <svg viewBox="0 0 400 250" className="block w-full" role="img" aria-label={`Tu depa en el nivel ${nivel}`}>
        <defs>
          <linearGradient id="rd-pared" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f7f1e8" />
            <stop offset="100%" stopColor="#ece2d4" />
          </linearGradient>
          <linearGradient id="rd-piso" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d7a670" />
            <stop offset="100%" stopColor="#c08f5b" />
          </linearGradient>
          <linearGradient id="rd-cielo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a8d8f0" />
            <stop offset="100%" stopColor="#ffd9a8" />
          </linearGradient>
          <radialGradient id="rd-luz" cx="0.5" cy="0.1" r="0.7">
            <stop offset="0%" stopColor="#ffe9b8" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#ffe9b8" stopOpacity="0" />
          </radialGradient>
          <style>{`
            @keyframes rd-hoja  { 0%,100%{transform:rotate(-2.5deg)} 50%{transform:rotate(2.5deg)} }
            @keyframes rd-disco { from{transform:rotate(0)} to{transform:rotate(360deg)} }
            @keyframes rd-cola  { 0%,100%{transform:rotate(-8deg)} 50%{transform:rotate(14deg)} }
            .rd-hoja  { animation: rd-hoja 4s ease-in-out infinite; transform-origin: 330px 196px; transform-box: view-box; }
            .rd-disco { animation: rd-disco 3.5s linear infinite; transform-origin: 78px 176px; transform-box: view-box; }
            .rd-cola  { animation: rd-cola 2.2s ease-in-out infinite; transform-origin: 236px 214px; transform-box: view-box; }
            @media (prefers-reduced-motion: reduce) {
              .rd-hoja, .rd-disco, .rd-cola { animation: none !important; }
            }
          `}</style>
        </defs>

        {/* cuarto */}
        <rect x="0" y="0" width="400" height="200" fill="url(#rd-pared)" />
        <rect x="0" y="200" width="400" height="50" fill="url(#rd-piso)" />
        {[40, 110, 180, 250, 320, 390].map((x) => (
          <line key={x} x1={x} y1="200" x2={x - 14} y2="250" stroke="#b3824f" strokeWidth="1" opacity="0.5" />
        ))}
        <rect x="0" y="196" width="400" height="6" fill="#fffaf2" />

        {ORDEN.filter((id) => has(id)).map((id) => (
          <Item key={id} nuevo={nuevo === id} origen={PIEZAS[id].origen}>
            {PIEZAS[id].arte}
          </Item>
        ))}

      </svg>

      {/* próxima recompensa */}
      <div className="border-t border-gray-200 bg-white/85 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-gray-600">
            Tu depa · nivel {nivel} · {tiene.size} de {ITEMS_DEPA.length} cosas
          </span>
          {!proximo && <span className="text-xs font-medium text-emerald-700">Depa completo 🎉</span>}
        </div>


      </div>
    </div>
  );
}
