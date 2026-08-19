/**
 * Catálogo de ejercicios.
 *
 * Dos restricciones dan forma a todo esto:
 *  - En el depa hay vecinos abajo, así que nada de saltos. El cardio es
 *    escaladores y oso que camina, nunca burpees ni tijeras.
 *  - En el parque sí puedes saltar, y hay barras — el único jalón del programa.
 */

import type { Variante } from './rutina';

export type Ejercicio = {
  nombre: string;
  detalle: string;
  nota?: string;
};

export type Bloque = {
  id: string;
  nombre: string;
  emoji: string;
  minutos: number;
  avanzado?: boolean;
  ejercicios: Ejercicio[];
};

export const VARIANTES: { id: Variante; nombre: string; pista: string }[] = [
  { id: 'pared',       nombre: 'Contra la pared', pista: 'De pie, manos en la pared.' },
  { id: 'inclinadas',  nombre: 'Inclinadas',      pista: 'Manos en el sillón o la mesa.' },
  { id: 'rodillas',    nombre: 'De rodillas',     pista: 'Rodillas en el tapete.' },
  { id: 'completas',   nombre: 'Completas',       pista: 'Cuerpo recto, de pies a cabeza.' },
  { id: 'declinadas',  nombre: 'Declinadas',      pista: 'Pies arriba del sillón.' },
];

export function minimo(variante: Variante): Ejercicio[] {
  const v = VARIANTES.find((x) => x.id === variante) ?? VARIANTES[2];
  return [
    { nombre: 'Sentadillas',        detalle: '10 reps' },
    { nombre: `Flexiones`,          detalle: '10 reps', nota: v.nombre.toLowerCase() },
    { nombre: 'Plancha',            detalle: '20 segundos' },
    { nombre: 'Puente de glúteo',   detalle: '10 reps' },
    { nombre: 'Bicho muerto',       detalle: '10 por lado' },
  ];
}

export const BLOQUES_DEPA: Bloque[] = [
  {
    id: 'piernas',
    nombre: 'Piernas',
    emoji: '🦵',
    minutos: 7,
    ejercicios: [
      { nombre: 'Zancadas',            detalle: '12 por lado' },
      { nombre: 'Sentadilla búlgara',  detalle: '10 por lado', nota: 'pie de atrás en el sillón' },
      { nombre: 'Elevación de talones',detalle: '20 reps' },
      { nombre: 'Sentadilla isométrica', detalle: '45 segundos', nota: 'espalda en la pared' },
    ],
  },
  {
    id: 'core',
    nombre: 'Core',
    emoji: '🎯',
    minutos: 6,
    ejercicios: [
      { nombre: 'Abdominales',          detalle: '15 reps' },
      { nombre: 'Elevación de piernas', detalle: '12 reps' },
      { nombre: 'Hollow hold',          detalle: '30 segundos' },
      { nombre: 'Plancha lateral',      detalle: '30 seg por lado' },
    ],
  },
  {
    id: 'superior',
    nombre: 'Tren superior',
    emoji: '💪',
    minutos: 7,
    ejercicios: [
      { nombre: 'Flexiones diamante',   detalle: '8 reps' },
      { nombre: 'Pike push-up',         detalle: '8 reps', nota: 'cadera arriba, empuja hacia el piso' },
      { nombre: 'Superman',             detalle: '15 reps' },
      { nombre: 'Fondos en la silla',   detalle: '12 reps' },
    ],
  },
  {
    id: 'cardio',
    nombre: 'Cardio silencioso',
    emoji: '🫁',
    minutos: 6,
    ejercicios: [
      { nombre: 'Escaladores',       detalle: '40 segundos' },
      { nombre: 'Oso que camina',    detalle: '30 segundos' },
      { nombre: 'Plancha caminando', detalle: '30 segundos' },
      { nombre: 'Sentadilla rápida', detalle: '30 segundos', nota: 'sin despegar los pies' },
    ],
  },
  {
    id: 'movilidad',
    nombre: 'Movilidad',
    emoji: '🧘',
    minutos: 6,
    ejercicios: [
      { nombre: 'Gato–vaca',            detalle: '10 ciclos' },
      { nombre: 'Perro boca abajo',     detalle: '45 segundos' },
      { nombre: '90/90 de cadera',      detalle: '8 por lado' },
      { nombre: 'Estiramiento de isquios', detalle: '45 seg por lado' },
    ],
  },
  {
    id: 'avanzado',
    nombre: 'Avanzado',
    emoji: '🔥',
    minutos: 8,
    avanzado: true,
    ejercicios: [
      { nombre: 'Sentadilla a una pierna', detalle: '5 por lado', nota: 'apóyate en la pared al bajar' },
      { nombre: 'Flexiones de arquero',    detalle: '6 por lado' },
      { nombre: 'Hollow rocks',            detalle: '20 reps' },
      { nombre: 'Plancha con toque de hombro', detalle: '20 reps' },
    ],
  },
];

/** En el parque sí puedes saltar y hay barras. */
export const ACTIVIDADES_PARQUE: Bloque[] = [
  {
    id: 'correr',
    nombre: 'Correr o caminar',
    emoji: '🏃',
    minutos: 25,
    ejercicios: [{ nombre: 'Correr o caminar', detalle: 'lo que aguantes hoy' }],
  },
  {
    id: 'aire',
    nombre: 'Movilidad al aire libre',
    emoji: '🌤️',
    minutos: 15,
    ejercicios: [
      { nombre: 'Estiramiento largo', detalle: '10 minutos' },
      { nombre: 'Respiración',        detalle: '3 minutos' },
      { nombre: 'Caminata suave',     detalle: 'lo que quieras' },
    ],
  },
  {
    id: 'barras',
    nombre: 'Barras',
    emoji: '🤸',
    minutos: 12,
    avanzado: true,
    ejercicios: [
      { nombre: 'Colgarse',   detalle: '30 segundos', nota: 'empieza aquí, cuenta como entrenar' },
      { nombre: 'Negativas',  detalle: '5 reps', nota: 'sube de un salto, baja lento' },
      { nombre: 'Dominadas',  detalle: 'las que salgan' },
      { nombre: 'Fondos en paralelas', detalle: '8 reps' },
    ],
  },
];

export function bloquePorId(id: string): Bloque | undefined {
  return [...BLOQUES_DEPA, ...ACTIVIDADES_PARQUE].find((b) => b.id === id);
}
