/**
 * Motor de niveles, sin dueño.
 *
 * `lib/rutina.ts` trae su propia copia de esto con sus umbrales; cuando las dos
 * herramientas se junten, las dos pueden colgar de aquí sin que ninguna tenga
 * que aprenderse los umbrales de la otra. Por eso los umbrales son un
 * parámetro y no una constante del módulo.
 */

export type Nivel = {
  nivel: number;
  xp: number;
  /** XP con el que empezó este nivel. */
  desde: number;
  /** XP del siguiente nivel. null = nivel máximo. */
  hasta: number | null;
  /** 0..1 dentro del nivel actual. */
  progreso: number;
  /** XP que faltan para el siguiente. 0 si ya es el máximo. */
  faltan: number;
};

/**
 * @param umbrales XP acumulado con el que arranca cada nivel, empezando en 0.
 */
export function nivelDeXP(xp: number, umbrales: readonly number[]): Nivel {
  let i = 0;
  while (i + 1 < umbrales.length && xp >= umbrales[i + 1]) i++;

  const desde = umbrales[i];
  const hasta = i + 1 < umbrales.length ? umbrales[i + 1] : null;

  return {
    nivel: i + 1,
    xp,
    desde,
    hasta,
    progreso: hasta === null ? 1 : (xp - desde) / (hasta - desde),
    faltan: hasta === null ? 0 : hasta - xp,
  };
}
