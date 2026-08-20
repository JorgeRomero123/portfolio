/**
 * Reglas de la rutina diaria.
 *
 * Todo lo acumulado (XP, nivel, racha, metas) se DERIVA de la bitácora en cada
 * lectura en vez de guardarse. Un contador guardado se desincroniza en cuanto
 * borras una sesión o falla un write a medias; derivarlo no puede mentir.
 */

export type Modo = 'depa' | 'parque';
export type Esfuerzo = 'minimo' | 'normal' | 'energia';
export type Variante = 'pared' | 'inclinadas' | 'rodillas' | 'completas' | 'declinadas';

export type Sesion = {
  id: string;
  fecha: string;           // YYYY-MM-DD en CDMX
  modo: Modo;
  esfuerzo: Esfuerzo;
  bloques: string[];
  minutos: number | null;
  vueltas: number | null;   // 1 vuelta = 1 km
  xp: number;
  notas: string | null;
};

/** La pista del parque mide un kilómetro por vuelta. */
export const KM_POR_VUELTA = 1;

// ---------------------------------------------------------------- XP

export const XP = {
  minimo: 10,        // el mínimo del depa, solo
  bloque: 25,        // por cada bloque extra
  parque: 40,        // salir al parque cuesta más activación que un bloque
  barras: 25,        // trabajo de barras, se desbloquea en el nivel 3
  racha7: 50,        // bonus al cerrar cada 7 días de racha
  metaParque: 60,    // bonus al llegar a 2 salidas en la semana
  vuelta: 5,         // por cada vuelta a la pista (1 km)
} as const;

/** Umbrales acumulados. El hueco crece para que subir de nivel siga costando. */
export const UMBRALES = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3300] as const;

export const NIVEL_BARRAS = 3;    // desbloquea dominadas y fondos en el parque
export const NIVEL_AVANZADO = 5;  // desbloquea los bloques avanzados del depa

export type Nivel = {
  nivel: number;
  xp: number;
  desde: number;
  hasta: number | null;  // null = nivel máximo
  progreso: number;      // 0..1 dentro del nivel actual
  faltan: number;        // XP para el siguiente
};

export function nivelDeXP(xp: number): Nivel {
  let i = 0;
  while (i + 1 < UMBRALES.length && xp >= UMBRALES[i + 1]) i++;

  const desde = UMBRALES[i];
  const hasta = i + 1 < UMBRALES.length ? UMBRALES[i + 1] : null;

  return {
    nivel: i + 1,
    xp,
    desde,
    hasta,
    progreso: hasta === null ? 1 : (xp - desde) / (hasta - desde),
    faltan: hasta === null ? 0 : hasta - xp,
  };
}

// ---------------------------------------------------------------- entrada

export type Opcional = { ok: true; valor: number | null } | { ok: false };

/**
 * Lee un número opcional del cuerpo de una petición.
 *
 * `null`, `undefined` y `''` significan "no lo mandé" y valen null.
 *
 * El detalle que importa: Number(null) es 0, y 0 es finito. Usar
 * Number.isFinite(Number(v)) para decidir si venía un número convertía un
 * campo vacío en 0, y luego 0 reventaba contra el mínimo del rango. Con eso
 * ninguna sesión de depa se podía guardar, porque la UI siempre manda
 * minutos: null cuando no hay minutos.
 */
export function numeroOpcional(
  valor: unknown,
  { min, max, entero = false }: { min: number; max: number; entero?: boolean },
): Opcional {
  if (valor === null || valor === undefined || valor === '') return { ok: true, valor: null };

  const n = Number(valor);
  if (!Number.isFinite(n)) return { ok: false };

  const v = entero ? Math.trunc(n) : n;
  if (v < min || v > max) return { ok: false };

  return { ok: true, valor: v };
}

// ---------------------------------------------------------------- fechas

const DIA = 24 * 60 * 60 * 1000;

function aUTC(fecha: string): number {
  const [y, m, d] = fecha.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function aTexto(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function diaAnterior(fecha: string): string {
  return aTexto(aUTC(fecha) - DIA);
}

/** Lunes de la semana de `fecha`, como identificador de semana. */
export function semanaDe(fecha: string): string {
  const ms = aUTC(fecha);
  const dow = new Date(ms).getUTCDay();       // 0 = domingo
  const desdeLunes = (dow + 6) % 7;
  return aTexto(ms - desdeLunes * DIA);
}

// ---------------------------------------------------------------- racha

export type Racha = {
  actual: number;
  mejor: number;
  hoyHecho: boolean;
  comodinDisponible: boolean;
  /** Días que el comodín está cubriendo ahora mismo. */
  cubiertos: string[];
};

/**
 * Racha con un comodín por semana.
 *
 * Caminamos hacia atrás desde hoy. Un día sin sesión no rompe la racha si a esa
 * semana todavía le queda comodín; el segundo hueco de la misma semana sí la
 * corta. El día de hoy nunca gasta comodín — todavía no se acaba.
 */
export function calcularRacha(fechas: Set<string>, hoy: string): Racha {
  const hoyHecho = fechas.has(hoy);
  const usados = new Map<string, string>();   // semana -> día que cubrió

  // Sin este tope la caminata sigue hacia atrás más allá de la primera sesión
  // y gasta comodines en días anteriores a que existiera la rutina, que luego
  // se reportan como "te cubrí el domingo".
  const primera = fechas.size ? [...fechas].sort()[0] : hoy;

  let cursor = hoyHecho ? hoy : diaAnterior(hoy);
  let actual = 0;

  for (let i = 0; i < 1000; i++) {
    if (cursor < primera) break;
    if (fechas.has(cursor)) {
      actual++;
      cursor = diaAnterior(cursor);
      continue;
    }
    const semana = semanaDe(cursor);
    if (!usados.has(semana)) {
      usados.set(semana, cursor);            // el comodín lo cubre
      cursor = diaAnterior(cursor);
      continue;
    }
    break;                                    // segundo hueco de la semana
  }

  return {
    actual,
    mejor: mejorRacha(fechas),
    hoyHecho,
    comodinDisponible: !usados.has(semanaDe(hoy)),
    cubiertos: [...usados.values()],
  };
}

/** La racha más larga del historial, con la misma regla de comodín. */
function mejorRacha(fechas: Set<string>): number {
  if (fechas.size === 0) return 0;

  const orden = [...fechas].sort();
  let mejor = 0;

  for (const inicio of orden) {
    // solo arrancamos en días que empiezan una racha
    if (fechas.has(diaAnterior(inicio))) continue;

    const usados = new Set<string>();
    let cursor = inicio;
    let largo = 0;

    for (let i = 0; i < 1000; i++) {
      if (fechas.has(cursor)) {
        largo++;
        cursor = aTexto(aUTC(cursor) + DIA);
        continue;
      }
      const semana = semanaDe(cursor);
      if (!usados.has(semana) && fechas.has(aTexto(aUTC(cursor) + DIA))) {
        usados.add(semana);                   // hueco cubierto, la racha sigue
        cursor = aTexto(aUTC(cursor) + DIA);
        continue;
      }
      break;
    }
    if (largo > mejor) mejor = largo;
  }

  return mejor;
}

// ---------------------------------------------------------------- XP de una sesión

export function xpDeSesion(input: {
  modo: Modo;
  esfuerzo: Esfuerzo;
  bloques: string[];
  barras: boolean;
  vueltas?: number | null;
}): number {
  if (input.modo === 'parque') {
    // Salir ya vale por sí solo; las vueltas suman encima, no reemplazan.
    return XP.parque + (input.barras ? XP.barras : 0) + (input.vueltas ?? 0) * XP.vuelta;
  }
  return XP.minimo + input.bloques.length * XP.bloque;
}

// ---------------------------------------------------------------- resumen

export type Resumen = {
  hoy: string;
  xpTotal: number;
  nivel: Nivel;
  racha: Racha;
  sesionesHoy: Sesion[];
  parqueEstaSemana: number;
  metaParque: number;
  kmEstaSemana: number;
  kmTotales: number;
  barrasDesbloqueadas: boolean;
  avanzadoDesbloqueado: boolean;
};

export const META_PARQUE = 2;

export function resumir(sesiones: Sesion[], hoy: string): Resumen {
  const xpTotal = sesiones.reduce((n, s) => n + s.xp, 0);
  const nivel = nivelDeXP(xpTotal);
  const racha = calcularRacha(new Set(sesiones.map((s) => s.fecha)), hoy);
  const semana = semanaDe(hoy);

  return {
    hoy,
    xpTotal,
    nivel,
    racha,
    sesionesHoy: sesiones.filter((s) => s.fecha === hoy),
    parqueEstaSemana: sesiones.filter((s) => s.modo === 'parque' && semanaDe(s.fecha) === semana).length,
    metaParque: META_PARQUE,
    kmEstaSemana: sesiones
      .filter((s) => semanaDe(s.fecha) === semana)
      .reduce((n, s) => n + (s.vueltas ?? 0) * KM_POR_VUELTA, 0),
    kmTotales: sesiones.reduce((n, s) => n + (s.vueltas ?? 0) * KM_POR_VUELTA, 0),
    barrasDesbloqueadas: nivel.nivel >= NIVEL_BARRAS,
    avanzadoDesbloqueado: nivel.nivel >= NIVEL_AVANZADO,
  };
}
