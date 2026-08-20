/**
 * Lo que se desbloquea en el parque.
 *
 * A diferencia del depa, esto NO va por nivel: el nivel sube igual quedándote
 * en casa, y entonces el parque se llenaría solo sin que salieras. Va por dos
 * ejes que solo avanzan yendo — salidas totales y kilómetros acumulados.
 *
 * Cuidado al agregar cosas: lo que se dibuja encima de otra cosa (los patos en
 * el estanque, la botella en la banca) tiene que pedir el MISMO eje y un número
 * mayor. Si mezclas ejes te pueden salir patos sobre el pasto.
 */

export type Eje = 'salidas' | 'km';

export type ItemParque = {
  id: string;
  nombre: string;
  pista: string;
  eje: Eje;
  meta: number;
};

export const ITEMS_PARQUE: ItemParque[] = [
  { id: 'banca',      nombre: 'Una banca',        pista: 'Para sentarte cuando acabes.',        eje: 'salidas', meta: 3 },
  { id: 'botella',    nombre: 'Tu botella',       pista: 'Ya se queda esperándote en la banca.', eje: 'salidas', meta: 6 },
  { id: 'pajaros',    nombre: 'Pájaros',          pista: 'El parque empieza a sonar.',          eje: 'km',      meta: 10 },
  { id: 'estanque',   nombre: 'Un estanque',      pista: 'Agua al otro lado de la pista.',      eje: 'salidas', meta: 10 },
  { id: 'patos',      nombre: 'Patos',            pista: 'Se instalaron en el estanque.',       eje: 'salidas', meta: 14 },
  { id: 'farolas',    nombre: 'Farolas',          pista: 'Ahora también puedes venir tarde.',   eje: 'salidas', meta: 18 },
  { id: 'tenis',      nombre: 'Tenis de correr',  pista: 'Ya te los ganaste.',                  eje: 'km',      meta: 25 },
  { id: 'corredores', nombre: 'Otros corredores', pista: 'Ya no eres el único en la pista.',    eje: 'salidas', meta: 26 },
  { id: 'perro',      nombre: 'Un perro',         pista: 'Te sigue toda la vuelta.',            eje: 'km',      meta: 40 },
  { id: 'fuente',     nombre: 'Una fuente',       pista: 'El parque de verdad.',                eje: 'km',      meta: 75 },
  { id: 'ardilla',    nombre: 'Una ardilla',      pista: 'Vive en el árbol de la derecha.',     eje: 'km',      meta: 120 },
];

export type ProgresoParque = { salidas: number; km: number };

export function alcanzado(item: ItemParque, p: ProgresoParque): boolean {
  return (item.eje === 'salidas' ? p.salidas : p.km) >= item.meta;
}

export function itemsParqueHasta(p: ProgresoParque): Set<string> {
  return new Set(ITEMS_PARQUE.filter((i) => alcanzado(i, p)).map((i) => i.id));
}

/** El siguiente por caer, medido por lo que te falta en proporción. */
export function proximoItemParque(p: ProgresoParque): ItemParque | null {
  const pendientes = ITEMS_PARQUE.filter((i) => !alcanzado(i, p));
  if (pendientes.length === 0) return null;

  return pendientes.reduce((mejor, i) => {
    const faltaI = i.meta - (i.eje === 'salidas' ? p.salidas : p.km);
    const faltaM = mejor.meta - (mejor.eje === 'salidas' ? p.salidas : p.km);
    // Una salida cuesta bastante más que un kilómetro, así que se comparan
    // ponderados; si no, los items de km siempre parecerían "los que siguen".
    return faltaI * (i.eje === 'salidas' ? 4 : 1) < faltaM * (mejor.eje === 'salidas' ? 4 : 1) ? i : mejor;
  });
}

export function faltaPara(item: ItemParque, p: ProgresoParque): number {
  return Math.max(0, item.meta - (item.eje === 'salidas' ? p.salidas : p.km));
}
