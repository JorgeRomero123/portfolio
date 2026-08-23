import type { Suciedad } from '@/lib/depa-mapa';

/**
 * Arte de los muebles del depa, visto desde arriba.
 *
 * Cada pieza se dibuja alrededor del origen (0,0) y PlanoDepa la traslada a su
 * lugar. Así mover un mueble es cambiar un número en lib/depa-mapa.ts, no
 * editar el SVG.
 *
 * Agregar un mueble: una entrada aquí con su `base`. La mugre es opcional —
 * sin ella se usa la genérica, y el mueble ya funciona. Vale la pena escribir
 * `mugre` propia solo cuando la suciedad de esa cosa se ve distinta: el sarro
 * de la regadera, las moscas del bote, la planta marchita.
 */

export type ArteMueble = {
  base: React.ReactNode;
  /** Qué se le encima cuando está sucio. Sin esto, se usa MugreGenerica. */
  mugre?: (nivel: 'sucio' | 'mugroso') => React.ReactNode;
  /** Qué tan lejos del centro se riega la mugre genérica. */
  radio?: number;
};

const MADERA = '#c99a68';
const MADERA_OSCURA = '#a97b4d';
const CLARO = '#e9e0d1';
const METAL = '#c3ccd4';
const METAL_OSCURO = '#9aa6b0';
const BLANCO = '#fbfaf7';
const LINEA = '#8d8071';

const SUCIO = '#a8934f';
const MUGRE = '#7d6a33';
const MOHO = '#6f8f43';

/** Manchas sueltas. La base de casi toda la suciedad. */
function Manchas({ nivel, radio = 14 }: { nivel: 'sucio' | 'mugroso'; radio?: number }) {
  const puntos =
    nivel === 'mugroso'
      ? [[-0.7, -0.5, 3.2], [0.6, -0.7, 2.4], [0.8, 0.5, 3], [-0.5, 0.7, 2.2], [0.1, 0.1, 2.6]]
      : [[-0.6, -0.4, 2.4], [0.7, 0.4, 2]];

  return (
    <g fill={nivel === 'mugroso' ? MUGRE : SUCIO} opacity={nivel === 'mugroso' ? 0.62 : 0.42}>
      {puntos.map(([dx, dy, r], i) => (
        <ellipse key={i} cx={dx * radio} cy={dy * radio} rx={r} ry={r * 0.78} />
      ))}
    </g>
  );
}

/** Moscas. Solo aparecen cuando ya se pasó de la raya. */
function Moscas({ radio = 16 }: { radio?: number }) {
  return (
    <g fill="#3d372f">
      {[[-1, -1.1], [0.9, -1.25], [1.15, 0.2]].map(([dx, dy], i) => (
        <g key={i} transform={`translate(${dx * radio} ${dy * radio})`}>
          <ellipse rx="1.5" ry="1" />
          <path d="M-1.6 -1 l-2 -1.4 M1.6 -1 l2 -1.4" stroke="#3d372f" strokeWidth="0.7" fill="none" />
        </g>
      ))}
    </g>
  );
}

function MugreGenerica({ nivel, radio }: { nivel: 'sucio' | 'mugroso'; radio: number }) {
  return (
    <>
      <Manchas nivel={nivel} radio={radio} />
      {nivel === 'mugroso' && <Moscas radio={radio} />}
    </>
  );
}

export function mugreDe(arte: ArteMueble, suciedad: Suciedad): React.ReactNode {
  if (suciedad === 'limpio') return null;
  return arte.mugre
    ? arte.mugre(suciedad)
    : <MugreGenerica nivel={suciedad} radio={arte.radio ?? 14} />;
}

// ------------------------------------------------------------------- piezas

export const ARTE: Record<string, ArteMueble> = {
  // --- recámara 2 -------------------------------------------------------
  escritorio: {
    radio: 16,
    base: (
      <g>
        <rect x="-24" y="-11" width="48" height="22" rx="3" fill={MADERA} stroke={MADERA_OSCURA} strokeWidth="1.2" />
        <rect x="8" y="-8" width="13" height="16" rx="2" fill={MADERA_OSCURA} opacity="0.45" />
        <circle cx="14.5" cy="0" r="1.2" fill={CLARO} />
      </g>
    ),
    mugre: (nivel) => (
      <g>
        {/* polvo: una capa pareja, no manchas sueltas */}
        <rect x="-24" y="-11" width="48" height="22" rx="3" fill={SUCIO} opacity={nivel === 'mugroso' ? 0.4 : 0.2} />
        {nivel === 'mugroso' && (
          <g fill={MUGRE} opacity="0.5">
            <ellipse cx="-14" cy="4" rx="4" ry="2.4" />
            <ellipse cx="2" cy="-5" rx="3" ry="2" />
          </g>
        )}
      </g>
    ),
  },
  laptop: {
    radio: 10,
    base: (
      <g>
        <rect x="-9" y="-7" width="18" height="13" rx="1.5" fill="#5b6570" />
        <rect x="-7.5" y="-5.5" width="15" height="10" rx="1" fill="#8f9aa6" />
        <rect x="-10.5" y="5" width="21" height="2.6" rx="1.3" fill="#4a535c" />
      </g>
    ),
  },
  silla: {
    radio: 9,
    base: (
      <g>
        <circle r="7.5" fill={CLARO} stroke={LINEA} strokeWidth="1" />
        <path d="M-6 -4 a7.5 7.5 0 0 1 12 0" fill="none" stroke={LINEA} strokeWidth="2" />
      </g>
    ),
  },

  // --- recámara 1 -------------------------------------------------------
  cama: {
    radio: 22,
    base: (
      <g>
        <rect x="-26" y="-19" width="52" height="38" rx="3" fill="#dfe7ef" stroke={LINEA} strokeWidth="1.2" />
        <rect x="-26" y="-19" width="52" height="9" rx="3" fill="#c3d0dd" />
        <rect x="-22" y="-17" width="19" height="6" rx="2.5" fill={BLANCO} />
        <rect x="3" y="-17" width="19" height="6" rx="2.5" fill={BLANCO} />
        <path d="M-26 2 h52" stroke={LINEA} strokeWidth="0.8" opacity="0.5" />
      </g>
    ),
    mugre: (nivel) => (
      <g>
        {/* sábanas revueltas: arrugas, no manchas */}
        <g fill="none" stroke={SUCIO} strokeWidth="1.4" opacity={nivel === 'mugroso' ? 0.75 : 0.45}>
          <path d="M-20 6 q8 -5 16 0 t16 0" />
          <path d="M-18 12 q9 -4 18 0 t14 1" />
        </g>
        {nivel === 'mugroso' && <ellipse cx="10" cy="-14" rx="5" ry="3" fill={SUCIO} opacity="0.4" />}
      </g>
    ),
  },
  buro: {
    radio: 9,
    base: (
      <g>
        <rect x="-8" y="-8" width="16" height="16" rx="2" fill={MADERA} stroke={MADERA_OSCURA} strokeWidth="1" />
        <circle r="3.2" fill="#f5d98a" />
      </g>
    ),
  },

  // --- baño -------------------------------------------------------------
  regadera: {
    radio: 15,
    base: (
      <g>
        <rect x="-16" y="-16" width="32" height="32" rx="3" fill="#dfe8ec" stroke={METAL_OSCURO} strokeWidth="1.2" />
        <circle r="4" fill="none" stroke={METAL_OSCURO} strokeWidth="1.4" />
        <circle r="1.2" fill={METAL_OSCURO} />
        <circle cx="10" cy="-10" r="2.6" fill={METAL} stroke={METAL_OSCURO} strokeWidth="0.8" />
      </g>
    ),
    mugre: (nivel) => (
      <g>
        {/* sarro: costra opaca desde la coladera hacia afuera */}
        <circle r="9" fill={SUCIO} opacity={nivel === 'mugroso' ? 0.45 : 0.25} />
        <g stroke={nivel === 'mugroso' ? MOHO : SUCIO} strokeWidth="1.3" fill="none" opacity="0.8">
          <path d="M-13 -12 q3 4 1 8" />
          <path d="M12 6 q-3 4 -1 8" />
        </g>
        {nivel === 'mugroso' && (
          <g fill={MOHO} opacity="0.6">
            <ellipse cx="-11" cy="11" rx="4" ry="2.6" />
            <ellipse cx="13" cy="-3" rx="2.6" ry="4" />
          </g>
        )}
      </g>
    ),
  },
  lavabo: {
    radio: 11,
    base: (
      <g>
        <rect x="-12" y="-8" width="24" height="16" rx="4" fill={BLANCO} stroke={METAL_OSCURO} strokeWidth="1.1" />
        <ellipse rx="7" ry="4.5" fill="#eef3f5" stroke={METAL_OSCURO} strokeWidth="0.8" />
        <rect x="-1.4" y="-9" width="2.8" height="3" rx="1" fill={METAL_OSCURO} />
      </g>
    ),
  },
  botiquin: {
    radio: 9,
    base: (
      <g>
        <rect x="-10" y="-7" width="20" height="14" rx="2" fill={BLANCO} stroke={LINEA} strokeWidth="1.1" />
        <path d="M-2.6 -3.4 h5.2 v2.8 h2.8 v5.2 h-2.8 v2.8 h-5.2 v-2.8 h-2.8 v-5.2 h2.8 z" fill="#e05a5a" />
      </g>
    ),
  },
  taza: {
    radio: 11,
    base: (
      <g>
        <rect x="-6" y="-12" width="12" height="7" rx="2" fill={BLANCO} stroke={METAL_OSCURO} strokeWidth="1" />
        <ellipse cy="2" rx="8" ry="10" fill={BLANCO} stroke={METAL_OSCURO} strokeWidth="1.1" />
        <ellipse cy="2" rx="5" ry="7" fill="#eaf1f4" />
      </g>
    ),
    mugre: (nivel) => (
      <g>
        <ellipse cy="2" rx="5" ry="7" fill={nivel === 'mugroso' ? MUGRE : SUCIO} opacity={nivel === 'mugroso' ? 0.62 : 0.35} />
        {nivel === 'mugroso' && (
          <>
            <g fill="none" stroke={MOHO} strokeWidth="1.2" opacity="0.75">
              <path d="M-9 -6 q-3 3 -1 6" />
              <path d="M9 8 q3 -3 1 -6" />
            </g>
            <Moscas radio={13} />
          </>
        )}
      </g>
    ),
  },

  // --- pasillo ----------------------------------------------------------
  // El piso de todo el depa. No tiene forma propia: la mugre se riega sola.
  piso: {
    radio: 11,
    base: <circle r="9" fill="none" stroke={LINEA} strokeWidth="1" strokeDasharray="3 3" opacity="0.45" />,
    mugre: (nivel) => (
      <g>
        <g fill={nivel === 'mugroso' ? MUGRE : SUCIO} opacity={nivel === 'mugroso' ? 0.5 : 0.3}>
          <ellipse cx="-4" cy="3" rx="6" ry="3.4" />
          <ellipse cx="5" cy="-4" rx="4.6" ry="2.8" />
          <ellipse cx="2" cy="8" rx="3.4" ry="2" />
        </g>
        {/* pelusas */}
        {nivel === 'mugroso' && (
          <g stroke={MUGRE} strokeWidth="0.9" fill="none" opacity="0.7">
            <path d="M-9 -7 q2 -2 4 0 q2 2 4 0" />
            <path d="M4 10 q2 -2 4 0" />
          </g>
        )}
      </g>
    ),
  },

  // --- sala-comedor -----------------------------------------------------
  sillon: {
    radio: 20,
    base: (
      <g>
        <rect x="-24" y="-13" width="48" height="26" rx="5" fill="#8fa8b8" stroke="#6f8798" strokeWidth="1.2" />
        <rect x="-24" y="-13" width="48" height="8" rx="4" fill="#7c95a6" />
        <path d="M-8 -5 v18 M8 -5 v18" stroke="#6f8798" strokeWidth="1" />
      </g>
    ),
  },
  mesa: {
    radio: 18,
    base: (
      <g>
        <rect x="-22" y="-13" width="44" height="26" rx="4" fill={MADERA} stroke={MADERA_OSCURA} strokeWidth="1.2" />
        {[-14, 0, 14].map((x) => (
          <circle key={x} cx={x} cy="-19" r="4.5" fill={CLARO} stroke={LINEA} strokeWidth="0.9" />
        ))}
        {[-14, 0, 14].map((x) => (
          <circle key={x} cx={x} cy="19" r="4.5" fill={CLARO} stroke={LINEA} strokeWidth="0.9" />
        ))}
      </g>
    ),
  },
  tele: {
    radio: 10,
    base: (
      <g>
        <rect x="-3" y="-16" width="6" height="32" rx="1.5" fill="#3b434b" />
        <rect x="3" y="-4" width="4" height="8" rx="1" fill="#5b6570" />
      </g>
    ),
  },
  planta: {
    radio: 12,
    base: (
      <g>
        <circle r="9" fill="#5f9e63" />
        <circle r="9" fill="none" stroke="#4a7f4e" strokeWidth="1" />
        <path d="M0 0 l-6 -5 M0 0 l6 -5 M0 0 l0 -8 M0 0 l-6 5 M0 0 l6 5" stroke="#4a7f4e" strokeWidth="1.1" />
        <circle r="3.4" fill="#a97b4d" />
      </g>
    ),
    mugre: (nivel) => (
      <g>
        {/* no se ensucia: se marchita */}
        <circle r="9" fill="#b0a05a" opacity={nivel === 'mugroso' ? 0.85 : 0.45} />
        {nivel === 'mugroso' && (
          <g fill="#9c8342">
            <ellipse cx="-11" cy="8" rx="3" ry="1.8" transform="rotate(-25 -11 8)" />
            <ellipse cx="11" cy="7" rx="3" ry="1.8" transform="rotate(30 11 7)" />
            <ellipse cx="1" cy="13" rx="2.6" ry="1.6" />
          </g>
        )}
      </g>
    ),
  },

  // --- cocina -----------------------------------------------------------
  estufa: {
    radio: 14,
    base: (
      <g>
        <rect x="-15" y="-12" width="30" height="24" rx="2.5" fill="#dde3e7" stroke={METAL_OSCURO} strokeWidth="1.2" />
        {[[-7.5, -5.5], [7.5, -5.5], [-7.5, 5.5], [7.5, 5.5]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="4.4" fill="none" stroke="#7b868f" strokeWidth="1.6" />
        ))}
      </g>
    ),
    mugre: (nivel) => (
      <g>
        {/* grasa quemada alrededor de las hornillas */}
        {[[-7.5, -5.5], [7.5, -5.5], [-7.5, 5.5], [7.5, 5.5]].map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="6"
            fill={nivel === 'mugroso' ? '#6b5326' : SUCIO}
            opacity={nivel === 'mugroso' ? 0.6 : 0.3}
          />
        ))}
        {nivel === 'mugroso' && (
          <g fill="#5c4720" opacity="0.55">
            <ellipse cx="0" cy="0" rx="5" ry="3" />
            <ellipse cx="-12" cy="9" rx="3" ry="2" />
          </g>
        )}
      </g>
    ),
  },
  fregadero: {
    radio: 12,
    base: (
      <g>
        <rect x="-13" y="-10" width="26" height="20" rx="2.5" fill={METAL} stroke={METAL_OSCURO} strokeWidth="1.1" />
        <rect x="-10" y="-7" width="20" height="14" rx="2" fill="#dbe3e9" />
        <circle r="1.6" fill={METAL_OSCURO} />
        <path d="M-9 -10 v-3 q0 -2 2 -2" fill="none" stroke={METAL_OSCURO} strokeWidth="1.6" />
      </g>
    ),
  },
  refri: {
    radio: 14,
    base: (
      <g>
        <rect x="-12" y="-16" width="24" height="32" rx="2.5" fill="#eef2f4" stroke={METAL_OSCURO} strokeWidth="1.2" />
        <path d="M-12 -2 h24" stroke={METAL_OSCURO} strokeWidth="1" />
        <rect x="7" y="-12" width="2.4" height="7" rx="1.2" fill={METAL_OSCURO} />
        <rect x="7" y="2" width="2.4" height="9" rx="1.2" fill={METAL_OSCURO} />
      </g>
    ),
  },
  cafetera: {
    radio: 10,
    base: (
      <g>
        <rect x="-8" y="-9" width="16" height="18" rx="2.5" fill="#4d545c" />
        <rect x="-5.5" y="1" width="11" height="7" rx="1.5" fill="#c9d2d8" />
        <circle cy="-4" r="3" fill="#2f353b" />
      </g>
    ),
    mugre: (nivel) => (
      <g>
        <rect
          x="-5.5"
          y="1"
          width="11"
          height="7"
          rx="1.5"
          fill={nivel === 'mugroso' ? '#5b4425' : '#8a6b3d'}
          opacity={nivel === 'mugroso' ? 0.85 : 0.5}
        />
        {nivel === 'mugroso' && <Manchas nivel="mugroso" radio={9} />}
      </g>
    ),
  },
  bote: {
    radio: 10,
    base: (
      <g>
        <circle r="8.5" fill="#78838d" stroke="#5f6971" strokeWidth="1.1" />
        <circle r="5.5" fill="#8d98a2" />
      </g>
    ),
    mugre: (nivel) => (
      <g>
        <circle r="5.5" fill={nivel === 'mugroso' ? MUGRE : SUCIO} opacity="0.75" />
        {nivel === 'mugroso' && (
          <>
            {/* se está desbordando */}
            <g fill="#8a7c55">
              <ellipse cx="-4" cy="-7" rx="3.4" ry="2.4" />
              <ellipse cx="5" cy="-6" rx="2.8" ry="2" />
            </g>
            <Moscas radio={12} />
          </>
        )}
      </g>
    ),
  },

  // --- lavado y boiler --------------------------------------------------
  lavadora: {
    radio: 14,
    base: (
      <g>
        <rect x="-14" y="-14" width="28" height="28" rx="3" fill={BLANCO} stroke={METAL_OSCURO} strokeWidth="1.2" />
        <circle r="8" fill="#dbe6ec" stroke={METAL_OSCURO} strokeWidth="1.2" />
        <circle r="4.5" fill="#c2d2dc" />
        <rect x="-11" y="-12" width="6" height="2.4" rx="1.2" fill={METAL_OSCURO} />
      </g>
    ),
  },
  boiler: {
    radio: 11,
    base: (
      <g>
        <rect x="-9" y="-12" width="18" height="24" rx="8" fill={METAL} stroke={METAL_OSCURO} strokeWidth="1.2" />
        <path d="M-9 -4 h18 M-9 4 h18" stroke={METAL_OSCURO} strokeWidth="0.9" opacity="0.6" />
        <path d="M0 -12 v-4" stroke={METAL_OSCURO} strokeWidth="2" />
      </g>
    ),
  },
  tendedero: {
    radio: 12,
    base: (
      <g stroke={METAL_OSCURO} strokeWidth="1.2" fill="none">
        <path d="M-16 -6 h32 M-16 0 h32 M-16 6 h32" />
        <path d="M-16 -9 v18 M16 -9 v18" strokeWidth="1.6" />
      </g>
    ),
  },
};
