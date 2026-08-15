/**
 * Teoría musical mínima para guitarra en afinación estándar.
 * Todo se calcula sobre números MIDI: cuerda al aire + traste.
 */

export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
export const NOTES_ES = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'] as const

/** Cuerdas de la 6ª (más grave) a la 1ª (más aguda): E2 A2 D3 G3 B3 E4 */
export const TUNING = [40, 45, 50, 55, 59, 64]

export const STRINGS = [
  { number: 6, label: 'Mi grave', short: 'Mi', latin: 'Mi', midi: 40 },
  { number: 5, label: 'La', short: 'La', latin: 'La', midi: 45 },
  { number: 4, label: 'Re', short: 'Re', latin: 'Re', midi: 50 },
  { number: 3, label: 'Sol', short: 'Sol', latin: 'Sol', midi: 55 },
  { number: 2, label: 'Si', short: 'Si', latin: 'Si', midi: 59 },
  { number: 1, label: 'Mi agudo', short: 'Mi', latin: 'Mi', midi: 64 },
]

export const midiToFreq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12)
export const freqToMidi = (freq: number) => 69 + 12 * Math.log2(freq / 440)

export const pitchClass = (midi: number) => ((Math.round(midi) % 12) + 12) % 12
export const noteName = (midi: number) => NOTES[pitchClass(midi)]
export const noteNameEs = (midi: number) => NOTES_ES[pitchClass(midi)]
export const octaveOf = (midi: number) => Math.floor(Math.round(midi) / 12) - 1

/** Diferencia en cents entre una frecuencia y la nota temperada más cercana. */
export function centsOff(freq: number) {
  const midi = freqToMidi(freq)
  const nearest = Math.round(midi)
  return { nearest, cents: (midi - nearest) * 100 }
}

// ---------------------------------------------------------------------------
// Acordes
// ---------------------------------------------------------------------------

export type ChordLevel = 'esencial' | 'siguiente' | 'cejilla'

export interface Chord {
  id: string
  name: string
  nameEs: string
  /** 6 valores, de la 6ª cuerda a la 1ª. -1 = no se toca, 0 = al aire */
  frets: number[]
  /** Dedo por cuerda: 1 índice, 2 medio, 3 anular, 4 meñique. 0 = ninguno */
  fingers: number[]
  /** Cejilla opcional: traste y rango de cuerdas (6 = grave, 1 = aguda) */
  barre?: { fret: number; fromString: number; toString: number; finger: number }
  level: ChordLevel
  tip: string
}

export const CHORDS: Chord[] = [
  // --- Los cinco esenciales -------------------------------------------------
  {
    id: 'Em',
    name: 'Em',
    nameEs: 'Mi menor',
    frets: [0, 2, 2, 0, 0, 0],
    fingers: [0, 2, 3, 0, 0, 0],
    level: 'esencial',
    tip: 'El primero que todo el mundo aprende: solo dos dedos y suenan las seis cuerdas.',
  },
  {
    id: 'Am',
    name: 'Am',
    nameEs: 'La menor',
    frets: [-1, 0, 2, 2, 1, 0],
    fingers: [0, 0, 2, 3, 1, 0],
    level: 'esencial',
    tip: 'Misma forma que Mi menor movida una cuerda. No toques la 6ª cuerda.',
  },
  {
    id: 'C',
    name: 'C',
    nameEs: 'Do mayor',
    frets: [-1, 3, 2, 0, 1, 0],
    fingers: [0, 3, 2, 0, 1, 0],
    level: 'esencial',
    tip: 'Estira el anular hasta el 3er traste. Cuida que el dedo no apague la 1ª cuerda.',
  },
  {
    id: 'G',
    name: 'G',
    nameEs: 'Sol mayor',
    frets: [3, 2, 0, 0, 0, 3],
    fingers: [3, 2, 0, 0, 0, 4],
    level: 'esencial',
    tip: 'Usa anular y meñique en el 3er traste: así el cambio a Do y a Re es mucho más rápido.',
  },
  {
    id: 'D',
    name: 'D',
    nameEs: 'Re mayor',
    frets: [-1, -1, 0, 2, 3, 2],
    fingers: [0, 0, 0, 1, 3, 2],
    level: 'esencial',
    tip: 'Forma de triángulo. Solo suenan cuatro cuerdas: empieza a rasguear desde la 4ª.',
  },

  // --- El siguiente escalón -------------------------------------------------
  {
    id: 'E',
    name: 'E',
    nameEs: 'Mi mayor',
    frets: [0, 2, 2, 1, 0, 0],
    fingers: [0, 2, 3, 1, 0, 0],
    level: 'siguiente',
    tip: 'Mi menor + el índice en el 1er traste de la 3ª cuerda.',
  },
  {
    id: 'A',
    name: 'A',
    nameEs: 'La mayor',
    frets: [-1, 0, 2, 2, 2, 0],
    fingers: [0, 0, 1, 2, 3, 0],
    level: 'siguiente',
    tip: 'Tres dedos apretados en el mismo traste. Ponlos un poco inclinados para que quepan.',
  },
  {
    id: 'Dm',
    name: 'Dm',
    nameEs: 'Re menor',
    frets: [-1, -1, 0, 2, 3, 1],
    fingers: [0, 0, 0, 2, 3, 1],
    level: 'siguiente',
    tip: 'Re mayor con la 1ª cuerda un traste más abajo. Suena melancólico.',
  },
  {
    id: 'Fmini',
    name: 'F (fácil)',
    nameEs: 'Fa mayor, versión sin cejilla',
    frets: [-1, -1, 3, 2, 1, 1],
    fingers: [0, 0, 3, 2, 1, 1],
    level: 'siguiente',
    tip: 'El índice acuesta y tapa las dos primeras cuerdas. Es el Fa de supervivencia antes de la cejilla.',
  },
  {
    id: 'A7',
    name: 'A7',
    nameEs: 'La séptima',
    frets: [-1, 0, 2, 0, 2, 0],
    fingers: [0, 0, 2, 0, 3, 0],
    level: 'siguiente',
    tip: 'Solo dos dedos y pide a gritos resolver en Re.',
  },
  {
    id: 'E7',
    name: 'E7',
    nameEs: 'Mi séptima',
    frets: [0, 2, 0, 1, 0, 0],
    fingers: [0, 2, 0, 1, 0, 0],
    level: 'siguiente',
    tip: 'Mi mayor quitando el anular. Base de todo el blues.',
  },
  {
    id: 'D7',
    name: 'D7',
    nameEs: 'Re séptima',
    frets: [-1, -1, 0, 2, 1, 2],
    fingers: [0, 0, 0, 2, 1, 3],
    level: 'siguiente',
    tip: 'Triángulo invertido respecto a Re mayor.',
  },
  {
    id: 'G7',
    name: 'G7',
    nameEs: 'Sol séptima',
    frets: [3, 2, 0, 0, 0, 1],
    fingers: [3, 2, 0, 0, 0, 1],
    level: 'siguiente',
    tip: 'Sol mayor con el meñique cambiado por el índice en la 1ª cuerda. Lleva de vuelta a Do.',
  },

  // --- Cejilla --------------------------------------------------------------
  {
    id: 'F',
    name: 'F',
    nameEs: 'Fa mayor con cejilla',
    frets: [1, 3, 3, 2, 1, 1],
    fingers: [1, 3, 4, 2, 1, 1],
    barre: { fret: 1, fromString: 6, toString: 1, finger: 1 },
    level: 'cejilla',
    tip: 'Forma de Mi mayor con el índice haciendo de cejuela. Gira el índice hacia afuera y usa el canto del dedo.',
  },
  {
    id: 'Bm',
    name: 'Bm',
    nameEs: 'Si menor con cejilla',
    frets: [-1, 2, 4, 4, 3, 2],
    fingers: [0, 1, 3, 4, 2, 1],
    barre: { fret: 2, fromString: 5, toString: 1, finger: 1 },
    level: 'cejilla',
    tip: 'Forma de La menor movida al 2º traste. La cejilla solo cubre cinco cuerdas.',
  },
  {
    id: 'B7',
    name: 'B7',
    nameEs: 'Si séptima',
    frets: [-1, 2, 1, 2, 0, 2],
    fingers: [0, 2, 1, 3, 0, 4],
    level: 'cejilla',
    tip: 'Sin cejilla pero con los cuatro dedos. Es el acorde que cierra el blues en Mi.',
  },
  {
    id: 'C7',
    name: 'C7',
    nameEs: 'Do séptima',
    frets: [-1, 3, 2, 3, 1, 0],
    fingers: [0, 4, 2, 3, 1, 0],
    level: 'cejilla',
    tip: 'Do mayor añadiendo el meñique. Estira bien la mano.',
  },
]

export const chordById = (id: string) => CHORDS.find((c) => c.id === id)

export const LEVEL_LABEL: Record<ChordLevel, string> = {
  esencial: 'Los 5 esenciales',
  siguiente: 'El siguiente escalón',
  cejilla: 'Cejilla y avanzados',
}

// ---------------------------------------------------------------------------
// Progresiones para el entrenador de cambios
// ---------------------------------------------------------------------------

export interface Progression {
  id: string
  name: string
  chords: string[]
  note: string
}

export const PROGRESSIONS: Progression[] = [
  { id: 'em-g', name: 'Em · G', chords: ['Em', 'G'], note: 'El cambio más fácil que existe. Empieza aquí.' },
  { id: 'am-c', name: 'Am · C', chords: ['Am', 'C'], note: 'Dos dedos se quedan casi en el mismo sitio.' },
  { id: 'g-c-d', name: 'G · C · D', chords: ['G', 'C', 'D'], note: 'I–IV–V en Sol: medio cancionero popular.' },
  { id: 'los-cuatro', name: 'Em · C · G · D', chords: ['Em', 'C', 'G', 'D'], note: 'Los cuatro acordes de mil canciones.' },
  { id: 'am-f-c-g', name: 'Am · F · C · G', chords: ['Am', 'Fmini', 'C', 'G'], note: 'Con el Fa fácil. Suena a balada.' },
  { id: 'blues-mi', name: 'E · A · B7', chords: ['E', 'A', 'B7'], note: 'Blues de doce compases en Mi.' },
  { id: 'd-a-bm-g', name: 'D · A · Bm · G', chords: ['D', 'A', 'Bm', 'G'], note: 'Ya con cejilla. Pop de estadio.' },
]

// ---------------------------------------------------------------------------
// Escalas
// ---------------------------------------------------------------------------

export interface Scale {
  id: string
  name: string
  /** Semitonos desde la tónica */
  intervals: number[]
  /** Etiqueta por grado, en el mismo orden que intervals */
  degrees: string[]
  note: string
}

export const SCALES: Scale[] = [
  {
    id: 'pent-menor',
    name: 'Pentatónica menor',
    intervals: [0, 3, 5, 7, 10],
    degrees: ['1', 'b3', '4', '5', 'b7'],
    note: 'La escala de los solos de rock y blues. Si solo aprendes una, que sea esta.',
  },
  {
    id: 'pent-mayor',
    name: 'Pentatónica mayor',
    intervals: [0, 2, 4, 7, 9],
    degrees: ['1', '2', '3', '5', '6'],
    note: 'Misma forma que la menor, tres trastes más abajo. Suena alegre y country.',
  },
  {
    id: 'blues',
    name: 'Blues',
    intervals: [0, 3, 5, 6, 7, 10],
    degrees: ['1', 'b3', '4', 'b5', '5', 'b7'],
    note: 'Pentatónica menor + la blue note (b5). Úsala de paso, no te quedes en ella.',
  },
  {
    id: 'mayor',
    name: 'Mayor (jónico)',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    degrees: ['1', '2', '3', '4', '5', '6', '7'],
    note: 'La escala de Do-Re-Mi. La base de casi toda la música occidental.',
  },
  {
    id: 'menor',
    name: 'Menor natural (eólico)',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    degrees: ['1', '2', 'b3', '4', '5', 'b6', 'b7'],
    note: 'La escala mayor empezando desde el 6º grado. Suena seria y oscura.',
  },
  {
    id: 'cromatica',
    name: 'Todas las notas',
    intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    degrees: ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'],
    note: 'Sin filtro: el mapa completo del mástil para aprenderte los nombres.',
  },
]

/** Devuelve el grado de la escala para una nota, o null si no pertenece. */
export function degreeOf(midi: number, rootPc: number, scale: Scale): string | null {
  const interval = (pitchClass(midi) - rootPc + 12) % 12
  const idx = scale.intervals.indexOf(interval)
  return idx === -1 ? null : scale.degrees[idx]
}
