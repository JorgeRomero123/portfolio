/**
 * Lógica de dominio del tracker de quehaceres del depa.
 * Compartida entre la UI (/tools/quehaceres) y el cron de recordatorios.
 *
 * Todas las fechas se manejan como strings 'YYYY-MM-DD' en zona horaria de
 * Ciudad de México, para evitar corrimientos de un día por UTC.
 */

export const ZONA_HORARIA = 'America/Mexico_City';

export type Quehacer = {
  id: string;
  nombre: string;
  emoji: string;
  frecuencia_dias: number;
  /** Última vez que se hizo, 'YYYY-MM-DD'. null = nunca. */
  ultima_vez: string | null;
  notas: string | null;
  orden: number;
  activo: boolean;
};

export type Estado = 'vencido' | 'hoy' | 'pronto' | 'ok';

export type QuehacerCalculado = Quehacer & {
  /** Fecha en la que toca, 'YYYY-MM-DD'. */
  proxima_vez: string;
  /** Negativo = vencido hace N días. 0 = toca hoy. */
  dias_restantes: number;
  estado: Estado;
  /** 0 a 1: qué tanto del ciclo ya transcurrió (se pasa de 1 si está vencido). */
  progreso: number;
};

/** Fecha de hoy en CDMX como 'YYYY-MM-DD'. */
export function hoyCDMX(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function aUTC(fecha: string): number {
  const [y, m, d] = fecha.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

const DIA_MS = 86_400_000;

export function sumarDias(fecha: string, dias: number): string {
  return new Date(aUTC(fecha) + dias * DIA_MS).toISOString().slice(0, 10);
}

/** Días de `b` hacia `a` (a - b). */
export function diferenciaDias(a: string, b: string): number {
  return Math.round((aUTC(a) - aUTC(b)) / DIA_MS);
}

export function calcular(q: Quehacer, hoy: string = hoyCDMX()): QuehacerCalculado {
  // Nunca se ha hecho → toca hoy.
  const proxima_vez = q.ultima_vez ? sumarDias(q.ultima_vez, q.frecuencia_dias) : hoy;
  const dias_restantes = diferenciaDias(proxima_vez, hoy);

  let estado: Estado;
  if (dias_restantes < 0) estado = 'vencido';
  else if (dias_restantes === 0) estado = 'hoy';
  else if (dias_restantes <= 2) estado = 'pronto';
  else estado = 'ok';

  const transcurridos = q.ultima_vez ? diferenciaDias(hoy, q.ultima_vez) : q.frecuencia_dias;
  const progreso = q.frecuencia_dias > 0 ? transcurridos / q.frecuencia_dias : 1;

  return { ...q, proxima_vez, dias_restantes, estado, progreso };
}

/** Más urgente primero; a igualdad de urgencia, respeta el orden manual. */
export function ordenarPorUrgencia(lista: QuehacerCalculado[]): QuehacerCalculado[] {
  return [...lista].sort(
    (a, b) => a.dias_restantes - b.dias_restantes || a.orden - b.orden || a.nombre.localeCompare(b.nombre, 'es-MX')
  );
}

/** Texto corto en español mexicano para el estado del quehacer. */
export function etiquetaEstado(q: QuehacerCalculado): string {
  const d = q.dias_restantes;
  if (d === 0) return 'Toca hoy';
  if (d === -1) return 'Se pasó 1 día';
  if (d < 0) return `Se pasó ${Math.abs(d)} días`;
  if (d === 1) return 'Mañana';
  return `En ${d} días`;
}

export function etiquetaFrecuencia(dias: number): string {
  if (dias === 1) return 'Diario';
  if (dias === 7) return 'Cada semana';
  if (dias === 14) return 'Cada 2 semanas';
  if (dias === 30) return 'Cada mes';
  if (dias === 90) return 'Cada 3 meses';
  return `Cada ${dias} días`;
}

/** Fecha larga en español, ej. "jueves 14 de agosto". */
export function fechaLarga(fecha: string): string {
  const [y, m, d] = fecha.split('-').map(Number);
  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export const FRECUENCIAS_SUGERIDAS = [
  { dias: 1, etiqueta: 'Diario' },
  { dias: 3, etiqueta: 'Cada 3 días' },
  { dias: 7, etiqueta: 'Cada semana' },
  { dias: 14, etiqueta: 'Cada 2 semanas' },
  { dias: 30, etiqueta: 'Cada mes' },
  { dias: 90, etiqueta: 'Cada 3 meses' },
] as const;
