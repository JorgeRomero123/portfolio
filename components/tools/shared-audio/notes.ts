/**
 * Aritmética de notas sobre números MIDI. Sin nada específico de un
 * instrumento: lo usan tanto la herramienta de guitarra como la de canto.
 */

export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
export const NOTES_ES = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'] as const

export const midiToFreq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12)
export const freqToMidi = (freq: number) => 69 + 12 * Math.log2(freq / 440)

export const pitchClass = (midi: number) => ((Math.round(midi) % 12) + 12) % 12
export const noteName = (midi: number) => NOTES[pitchClass(midi)]
export const noteNameEs = (midi: number) => NOTES_ES[pitchClass(midi)]
export const octaveOf = (midi: number) => Math.floor(Math.round(midi) / 12) - 1

/** Nombre con octava, como se escribe en teoría musical: Do4, La3… */
export const noteLabel = (midi: number) => `${noteNameEs(midi)}${octaveOf(midi)}`

/** Diferencia en cents entre una frecuencia y la nota temperada más cercana. */
export function centsOff(freq: number) {
  const midi = freqToMidi(freq)
  const nearest = Math.round(midi)
  return { nearest, cents: (midi - nearest) * 100 }
}

/** Distancia en cents entre una frecuencia y una nota concreta. */
export const centsFrom = (freq: number, targetMidi: number) =>
  (freqToMidi(freq) - targetMidi) * 100
