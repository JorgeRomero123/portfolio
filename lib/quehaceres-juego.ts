/**
 * La capa de juego de los quehaceres: XP, nivel del depa, reparto entre quien
 * vive aquí, y cómo se traducen los quehaceres a burbujas sobre el plano.
 *
 * Todo se DERIVA de la bitácora en cada lectura, nunca se guarda — mismo
 * criterio que lib/rutina.ts: un contador guardado se desincroniza en cuanto
 * borras un registro, y derivarlo no puede mentir.
 */

import { nivelDeXP, type Nivel } from './progreso';
import { PERSONAS, type PersonaId } from './personas';
import {
  MUEBLES,
  ZONAS,
  mueble,
  zona,
  type Marcador,
  type Suciedad,
  type ZonaId,
} from './depa-mapa';
import { diferenciaDias, peorSuciedad, type Estado, type QuehacerCalculado } from './quehaceres';

/**
 * El hueco entre niveles crece para que el depa no llegue al máximo en un mes.
 * Con los 16 quehaceres sembrados salen unos 150 XP por semana bien llevada.
 */
export const UMBRALES_DEPA = [0, 150, 400, 750, 1200, 1800, 2500, 3400, 4500, 5800, 7300, 9000] as const;

/**
 * Lo que vale hacer un quehacer.
 *
 * Sube con la frecuencia — voltear el colchón cuesta más que regar las plantas
 * — pero con tope, para que un quehacer anual no valga por medio nivel.
 */
export function xpDeQuehacer(frecuencia_dias: number): number {
  return Math.min(80, Math.max(10, Math.round(5 + frecuencia_dias * 0.8)));
}

// ------------------------------------------------------------------ bitácora

/** Una fila de quehaceres_bitacora, ya cruzada con su quehacer. */
export type Registro = {
  quehacer_id: string;
  hecho_el: string;
  quien: string | null;
};

export type Reparto = {
  persona: PersonaId;
  nombre: string;
  color: string;
  hechos: number;
  xp: number;
};

export type Juego = {
  xp: number;
  nivel: Nivel;
  /** Reparto de los últimos 7 días, siempre con todas las personas. */
  semana: Reparto[];
  /** Cuántos quehaceres se han hecho en total. */
  hechos: number;
};

/**
 * @param registros toda la bitácora
 * @param xpPorQuehacer cuánto vale cada quehacer, por id
 */
export function resumenDelJuego(
  registros: Registro[],
  xpPorQuehacer: Map<string, number>,
  hoy: string
): Juego {
  let xp = 0;
  const semana = new Map<PersonaId, { hechos: number; xp: number }>(
    PERSONAS.map((p) => [p.id, { hechos: 0, xp: 0 }])
  );

  for (const r of registros) {
    // Un quehacer archivado ya no está en el mapa; su XP sigue contando para
    // el depa, pero con el mínimo, porque ya no sabemos su frecuencia.
    const valor = xpPorQuehacer.get(r.quehacer_id) ?? 10;
    xp += valor;

    const dias = diferenciaDias(hoy, r.hecho_el);
    if (dias >= 0 && dias < 7) {
      const acum = r.quien ? semana.get(r.quien as PersonaId) : undefined;
      if (acum) {
        acum.hechos += 1;
        acum.xp += valor;
      }
    }
  }

  return {
    xp,
    nivel: nivelDeXP(xp, UMBRALES_DEPA),
    hechos: registros.length,
    semana: PERSONAS.map((p) => ({
      persona: p.id,
      nombre: p.nombre,
      color: p.color,
      ...semana.get(p.id)!,
    })),
  };
}

// --------------------------------------------------------------- agrupación

export type ResumenZona = {
  zona: ZonaId;
  nombre: string;
  emoji: string;
  quehaceres: QuehacerCalculado[];
  /** El peor estado del cuarto: es el color de su etiqueta en el plano. */
  suciedad: Suciedad;
  /** Cuántos están vencidos o tocan hoy. */
  pendientes: number;
};

/** Todos los cuartos, siempre — un cuarto sin nada pendiente igual se dibuja. */
export function agruparPorZona(lista: QuehacerCalculado[]): ResumenZona[] {
  return ZONAS.map((z) => {
    const suyos = lista.filter((q) => zona(q.zona).id === z.id);
    return {
      zona: z.id,
      nombre: z.nombre,
      emoji: z.emoji,
      quehaceres: suyos,
      suciedad: peorSuciedad(suyos.map((q) => q.estado)),
      pendientes: suyos.filter((q) => q.dias_restantes <= 0).length,
    };
  });
}

/**
 * Convierte los quehaceres en burbujas sobre muebles.
 *
 * Varios quehaceres pueden compartir mueble (la cafetera se lava y se
 * descalcifica): la burbuja se queda con el más urgente y dice cuántos agrupa.
 * Un quehacer sin mueble válido se para en el piso de su cuarto.
 */
export function marcadoresDeQuehaceres(lista: QuehacerCalculado[]): Marcador[] {
  const porMueble = new Map<string, { estados: Estado[]; etiqueta: string; dias: number }>();

  for (const q of lista) {
    const destino = muebleDeQuehacer(q);
    const previo = porMueble.get(destino);

    if (!previo) {
      porMueble.set(destino, { estados: [q.estado], etiqueta: q.nombre, dias: q.dias_restantes });
      continue;
    }

    previo.estados.push(q.estado);
    if (q.dias_restantes < previo.dias) {
      previo.etiqueta = q.nombre;
      previo.dias = q.dias_restantes;
    }
  }

  return [...porMueble].map(([id, v]) => ({
    mueble: id,
    suciedad: peorSuciedad(v.estados),
    etiqueta: v.etiqueta,
    conteo: v.estados.length,
  }));
}

/**
 * Sobre qué mueble se para un quehacer. El que eligió, o el primero de su
 * cuarto si no eligió ninguno — así la burbuja y el destello siempre coinciden.
 */
export function muebleDeQuehacer(q: Pick<QuehacerCalculado, 'punto' | 'zona'>): string {
  const elegido = mueble(q.punto);
  if (elegido) return elegido.id;

  const z = zona(q.zona).id;
  return MUEBLES.find((m) => m.zona === z)?.id ?? 'piso';
}
