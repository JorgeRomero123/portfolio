/**
 * Muebles del depa, uno por nivel.
 *
 * El cuarto empieza casi vacío: un tapete en el piso y nada más. Cada nivel
 * mete una cosa. Es la única recompensa del sistema que se ve — un número que
 * sube no compra nada, un cuarto que se llena sí.
 */

export type ItemDepa = {
  nivel: number;
  id: string;
  nombre: string;
  pista: string;
};

export const ITEMS_DEPA: ItemDepa[] = [
  { nivel: 1,  id: 'tapete',    nombre: 'El tapete',        pista: 'Donde empieza todo.' },
  { nivel: 2,  id: 'planta',    nombre: 'Una planta',       pista: 'Ya no está tan vacío.' },
  { nivel: 3,  id: 'lampara',   nombre: 'Lámpara de piso',  pista: 'Luz para entrenar de noche.' },
  { nivel: 4,  id: 'alfombra',  nombre: 'Alfombra',         pista: 'El cuarto se siente tuyo.' },
  { nivel: 5,  id: 'repisa',    nombre: 'Repisa con libros',pista: 'Algo que ver mientras estiras.' },
  { nivel: 6,  id: 'ventana',   nombre: 'Ventana a la ciudad', pista: 'Por fin entra el sol.' },
  { nivel: 7,  id: 'guitarra',  nombre: 'La guitarra',      pista: 'Recargada en la pared, como debe ser.' },
  { nivel: 8,  id: 'tocadiscos',nombre: 'Tocadiscos',       pista: 'Ahora hay música.' },
  { nivel: 9,  id: 'poster',    nombre: 'Póster del Tottenham', pista: 'COYS.' },
  { nivel: 10, id: 'gato',      nombre: 'Un gato',          pista: 'Se sienta en tu tapete. Siempre.' },
  { nivel: 11, id: 'pesa',      nombre: 'Pesa rusa',        pista: 'Ya te la ganaste.' },
];

export function itemsHasta(nivel: number): Set<string> {
  return new Set(ITEMS_DEPA.filter((i) => i.nivel <= nivel).map((i) => i.id));
}

export function proximoItem(nivel: number): ItemDepa | null {
  return ITEMS_DEPA.find((i) => i.nivel > nivel) ?? null;
}
