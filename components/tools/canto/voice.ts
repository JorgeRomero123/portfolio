import { noteLabel } from '../shared-audio/notes'

/**
 * El rango vocal del usuario, en números MIDI.
 *
 * Es la diferencia de fondo con la guitarra: la 6ª cuerda siempre es un Mi de
 * 82 Hz, pero un bajo y una soprano no comparten ni una nota cómoda. Todos los
 * ejercicios se definen como intervalos desde una tónica, y la tónica sale de
 * aquí, así que el mismo nivel es cantable para cualquiera.
 */
export interface VoiceRange {
  low: number
  high: number
}

/** Hasta que calibras, un rango central prudente (Do3–Do4). */
export const DEFAULT_RANGE: VoiceRange = { low: 48, high: 60 }

/** Por debajo de esto la medición no es de fiar y usamos el rango por defecto. */
const MIN_SPAN = 5

/** Límites de lo que aceptamos como voz humana cantada, para descartar ruido. */
export const VOICE_MIN_MIDI = 36 // Do2, más grave que casi cualquier bajo
export const VOICE_MAX_MIDI = 84 // Do6, más agudo que casi cualquier soprano

export const isUsable = (range: VoiceRange) => range.high - range.low >= MIN_SPAN

export function safeRange(range: VoiceRange): VoiceRange {
  return isUsable(range) ? range : DEFAULT_RANGE
}

/**
 * El intervalo más ancho que pide el currículo sin contar la octava (una sexta
 * mayor). La tónica tiene que dejar sitio para él o el ejercicio se sale por
 * arriba en las voces de rango estrecho.
 */
const WIDEST_INTERVAL = 9

/**
 * La nota de trabajo. Se coloca en el tercio bajo del rango, no en el centro:
 * cantar sostenido es cómodo abajo y cansa arriba, y casi todos los ejercicios
 * suben desde la tónica. En rangos estrechos baja aún más para que quepan los
 * intervalos.
 */
export function tonicOf(range: VoiceRange): number {
  const r = safeRange(range)
  const ideal = r.low + (r.high - r.low) * 0.3
  const cap = r.high - WIDEST_INTERVAL
  return Math.round(Math.max(r.low, Math.min(ideal, cap)))
}

/**
 * Nota objetivo para un ejercicio, a `offset` semitonos de la tónica. Si se
 * sale por arriba, baja octavas hasta que quepa: mejor cantarlo grave que no
 * poder cantarlo.
 */
export function targetMidi(range: VoiceRange, offset: number): number {
  const r = safeRange(range)
  let midi = tonicOf(r) + offset
  while (midi > r.high && midi - 12 >= r.low) midi -= 12
  while (midi < r.low && midi + 12 <= r.high) midi += 12
  // Red de seguridad para un rango tan estrecho que ni la octava de abajo
  // cabe: mejor pedir la nota del borde que una que no puede producir.
  return Math.max(r.low, Math.min(r.high, midi))
}

/** Nombre aproximado del tipo de voz, solo como dato simpático tras calibrar. */
export function voiceLabel(range: VoiceRange): string {
  if (!isUsable(range)) return 'sin medir'
  const center = (range.low + range.high) / 2
  if (center < 48) return 'registro grave'
  if (center < 55) return 'registro medio-grave'
  if (center < 62) return 'registro medio'
  if (center < 69) return 'registro medio-agudo'
  return 'registro agudo'
}

export const describeRange = (range: VoiceRange) =>
  `${noteLabel(range.low)} – ${noteLabel(range.high)}`

/** Semitonos de la escala mayor, para los ejercicios de escala. */
export const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11, 12]

export const INTERVAL_NAMES: Record<number, string> = {
  0: 'unísono',
  1: 'segunda menor',
  2: 'segunda mayor',
  3: 'tercera menor',
  4: 'tercera mayor',
  5: 'cuarta justa',
  7: 'quinta justa',
  9: 'sexta mayor',
  12: 'octava',
}
