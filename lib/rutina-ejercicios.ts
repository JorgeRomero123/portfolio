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
  /** Qué buscar en YouTube cuando el nombre solo no basta. */
  busqueda?: string;
  /** Para lo que no necesita video: correr, respirar, caminar. */
  sinVideo?: boolean;
};

/**
 * Link a la búsqueda de YouTube, no a un video fijo.
 *
 * Un id de video se borra, se hace privado o cambia de dueño, y el link queda
 * muerto sin que nadie se entere hasta que estás en el tapete buscándolo. La
 * búsqueda siempre trae resultados y siempre en español.
 */
export function videoUrl(e: Ejercicio): string | null {
  if (e.sinVideo) return null;
  const q = e.busqueda ?? `${e.nombre} ejercicio técnica`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}

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
    { nombre: 'Sentadillas', busqueda: 'sentadillas técnica correcta',        detalle: '10 reps' },
    { nombre: `Flexiones`, busqueda: 'flexiones de pecho técnica correcta',          detalle: '10 reps', nota: v.nombre.toLowerCase() },
    { nombre: 'Plancha', busqueda: 'plancha abdominal cómo hacerla bien',            detalle: '20 segundos' },
    { nombre: 'Puente de glúteo', busqueda: 'puente de glúteo ejercicio técnica',   detalle: '10 reps' },
    { nombre: 'Bicho muerto', busqueda: 'dead bug bicho muerto ejercicio core',       detalle: '10 por lado' },
  ];
}

export const BLOQUES_DEPA: Bloque[] = [
  {
    id: 'piernas',
    nombre: 'Piernas',
    emoji: '🦵',
    minutos: 7,
    ejercicios: [
      { nombre: 'Zancadas', busqueda: 'zancadas ejercicio técnica',            detalle: '12 por lado' },
      { nombre: 'Sentadilla búlgara', busqueda: 'sentadilla búlgara técnica',  detalle: '10 por lado', nota: 'pie de atrás en el sillón' },
      { nombre: 'Elevación de talones', busqueda: 'elevación de talones gemelos ejercicio',detalle: '20 reps' },
      { nombre: 'Sentadilla isométrica', busqueda: 'sentadilla isométrica pared', detalle: '45 segundos', nota: 'espalda en la pared' },
    ],
  },
  {
    id: 'core',
    nombre: 'Core',
    emoji: '🎯',
    minutos: 6,
    ejercicios: [
      { nombre: 'Abdominales', busqueda: 'abdominales crunch técnica correcta',          detalle: '15 reps' },
      { nombre: 'Elevación de piernas', busqueda: 'elevación de piernas abdominales técnica', detalle: '12 reps' },
      { nombre: 'Hollow hold', busqueda: 'hollow hold ejercicio core',          detalle: '30 segundos' },
      { nombre: 'Plancha lateral', busqueda: 'plancha lateral ejercicio',      detalle: '30 seg por lado' },
    ],
  },
  {
    id: 'superior',
    nombre: 'Tren superior',
    emoji: '💪',
    minutos: 7,
    ejercicios: [
      { nombre: 'Flexiones diamante', busqueda: 'flexiones diamante tríceps',   detalle: '8 reps' },
      { nombre: 'Pike push-up', busqueda: 'pike push up flexión pica hombros',         detalle: '8 reps', nota: 'cadera arriba, empuja hacia el piso' },
      { nombre: 'Superman', busqueda: 'superman ejercicio espalda baja',             detalle: '15 reps' },
      { nombre: 'Fondos en la silla', busqueda: 'fondos en silla tríceps',   detalle: '12 reps' },
    ],
  },
  {
    id: 'cardio',
    nombre: 'Cardio silencioso',
    emoji: '🫁',
    minutos: 6,
    ejercicios: [
      { nombre: 'Escaladores', busqueda: 'mountain climbers escaladores ejercicio',       detalle: '40 segundos' },
      { nombre: 'Oso que camina', busqueda: 'bear crawl oso que camina ejercicio',    detalle: '30 segundos' },
      { nombre: 'Plancha caminando', busqueda: 'walking plank plancha caminando', detalle: '30 segundos' },
      { nombre: 'Sentadilla rápida', busqueda: 'sentadillas rápidas sin salto', detalle: '30 segundos', nota: 'sin despegar los pies' },
    ],
  },
  {
    id: 'movilidad',
    nombre: 'Movilidad',
    emoji: '🧘',
    minutos: 6,
    ejercicios: [
      { nombre: 'Gato–vaca', busqueda: 'gato vaca movilidad columna',            detalle: '10 ciclos' },
      { nombre: 'Perro boca abajo', busqueda: 'perro boca abajo yoga técnica',     detalle: '45 segundos' },
      { nombre: '90/90 de cadera', busqueda: '90 90 movilidad de cadera',      detalle: '8 por lado' },
      { nombre: 'Estiramiento de isquios', busqueda: 'estiramiento isquiotibiales', detalle: '45 seg por lado' },
    ],
  },
  {
    id: 'avanzado',
    nombre: 'Avanzado',
    emoji: '🔥',
    minutos: 8,
    avanzado: true,
    ejercicios: [
      { nombre: 'Sentadilla a una pierna', busqueda: 'pistol squat progresión principiantes', detalle: '5 por lado', nota: 'apóyate en la pared al bajar' },
      { nombre: 'Flexiones de arquero', busqueda: 'archer push up flexiones de arquero',    detalle: '6 por lado' },
      { nombre: 'Hollow rocks', busqueda: 'hollow rocks ejercicio',            detalle: '20 reps' },
      { nombre: 'Plancha con toque de hombro', busqueda: 'plancha con toque de hombro', detalle: '20 reps' },
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
    ejercicios: [{ nombre: 'Correr o caminar', sinVideo: true, detalle: 'lo que aguantes hoy' }],
  },
  {
    id: 'aire',
    nombre: 'Movilidad al aire libre',
    emoji: '🌤️',
    minutos: 15,
    ejercicios: [
      { nombre: 'Estiramiento largo', sinVideo: true, detalle: '10 minutos' },
      { nombre: 'Respiración', sinVideo: true,        detalle: '3 minutos' },
      { nombre: 'Caminata suave', sinVideo: true,     detalle: 'lo que quieras' },
    ],
  },
  {
    id: 'barras',
    nombre: 'Barras',
    emoji: '🤸',
    minutos: 12,
    avanzado: true,
    ejercicios: [
      { nombre: 'Colgarse', busqueda: 'dead hang colgarse de la barra',   detalle: '30 segundos', nota: 'empieza aquí, cuenta como entrenar' },
      { nombre: 'Negativas', busqueda: 'dominadas negativas progresión',  detalle: '5 reps', nota: 'sube de un salto, baja lento' },
      { nombre: 'Dominadas', busqueda: 'dominadas técnica principiantes',  detalle: 'las que salgan' },
      { nombre: 'Fondos en paralelas', busqueda: 'fondos en paralelas dips técnica', detalle: '8 reps' },
    ],
  },
];

export function bloquePorId(id: string): Bloque | undefined {
  return [...BLOQUES_DEPA, ...ACTIVIDADES_PARQUE].find((b) => b.id === id);
}
