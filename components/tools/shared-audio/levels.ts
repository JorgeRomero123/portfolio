/**
 * Estructura común de las herramientas por niveles (guitarra, canto…).
 * Cada app define sus propios ejercicios; lo que se comparte es el envoltorio:
 * etapas → niveles, desbloqueo en cadena y puntuación por estrellas.
 */

export interface PathLevel {
  id: string
  title: string
  /** Clave del icono; cada app decide cómo dibujarla. */
  kind: string
}

export interface PathStage<L extends PathLevel = PathLevel> {
  id: string
  name: string
  subtitle: string
  /** Clases del degradado Tailwind que identifica la etapa. */
  accent: string
  ring: string
  levels: L[]
}

/** Aciertos → estrellas. Con un solo ejercicio, acertar es el pleno. */
export function starsFor(results: boolean[]): number {
  if (!results.length) return 0
  const ratio = results.filter(Boolean).length / results.length
  if (ratio === 1) return 3
  if (ratio >= 2 / 3) return 2
  if (ratio >= 1 / 3) return 1
  return 0
}

export function flattenLevels<L extends PathLevel, S extends PathStage<L>>(stages: S[]) {
  return stages.flatMap((stage) => stage.levels.map((level) => ({ level, stage })))
}

/** Posición de cada nivel en el camino completo, para serpentear sin reiniciar
 *  el patrón en cada etapa. */
export function levelPositions<L extends PathLevel, S extends PathStage<L>>(stages: S[]) {
  const map = new Map<string, number>()
  stages.forEach((stage) => stage.levels.forEach((level) => map.set(level.id, map.size)))
  return map
}
