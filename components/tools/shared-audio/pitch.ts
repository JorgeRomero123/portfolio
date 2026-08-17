/**
 * Detección de tono por NSDF (McLeod Pitch Method). Sin dependencias del DOM
 * ni de React para poder probarla con señales sintéticas fuera del navegador.
 */

export const MIN_HZ = 65 // por debajo del Mi grave (82.4 Hz) con margen
export const MAX_HZ = 1300 // por encima del traste 12 de la 1ª cuerda

const RMS_GATE = 0.006
/** Fracción del pico más alto a partir de la cual aceptamos un pico anterior. */
const PEAK_THRESHOLD = 0.9
/** Por debajo de esto la señal no tiene un tono definido (ruido, cuerda apagada). */
const MIN_CLARITY = 0.35

export interface PitchResult {
  freq: number
  clarity: number
}

/**
 * El NSDF es más resistente a los errores de octava que la autocorrelación
 * cruda, que es justo el fallo típico al afinar las cuerdas graves.
 */
export function detectPitch(buf: Float32Array, sampleRate: number): PitchResult | null {
  const size = buf.length

  let rms = 0
  for (let i = 0; i < size; i++) rms += buf[i] * buf[i]
  rms = Math.sqrt(rms / size)
  if (rms < RMS_GATE) return null

  const minLag = Math.max(2, Math.floor(sampleRate / MAX_HZ))
  const maxLag = Math.min(Math.floor(sampleRate / MIN_HZ), Math.floor(size / 2))
  if (maxLag <= minLag) return null

  // Sumas acumuladas de cuadrados: el denominador del NSDF sale en O(1) por lag.
  const prefix = new Float64Array(size + 1)
  for (let i = 0; i < size; i++) prefix[i + 1] = prefix[i] + buf[i] * buf[i]

  const nsdf = new Float64Array(maxLag + 2)
  for (let lag = minLag; lag <= maxLag; lag++) {
    const n = size - lag
    let acf = 0
    for (let i = 0; i < n; i++) acf += buf[i] * buf[i + lag]
    const energy = prefix[n] + (prefix[size] - prefix[lag])
    nsdf[lag] = energy > 0 ? (2 * acf) / energy : 0
  }

  // Máximos locales, uno por cada tramo positivo de la curva.
  const peaks: number[] = []
  let lag = minLag
  while (lag < maxLag && nsdf[lag] > 0) lag++ // saltar el lóbulo inicial
  while (lag < maxLag) {
    if (nsdf[lag] > 0 && nsdf[lag] > nsdf[lag - 1] && nsdf[lag] >= nsdf[lag + 1]) {
      peaks.push(lag)
      while (lag < maxLag && nsdf[lag] > 0) lag++
    }
    lag++
  }
  if (!peaks.length) return null

  let highest = 0
  for (const p of peaks) if (nsdf[p] > highest) highest = nsdf[p]
  if (highest < MIN_CLARITY) return null

  // El primer pico "suficientemente alto" es el periodo real: quedarse con el
  // máximo global es lo que hace que una nota se detecte una octava más baja.
  const threshold = PEAK_THRESHOLD * highest
  const chosen = peaks.find((p) => nsdf[p] >= threshold) ?? peaks[0]

  // Interpolación parabólica para afinar el lag a nivel sub-muestra.
  const y1 = nsdf[chosen - 1]
  const y2 = nsdf[chosen]
  const y3 = nsdf[chosen + 1]
  const denom = 2 * (2 * y2 - y1 - y3)
  const refined = denom !== 0 ? chosen + (y3 - y1) / denom : chosen

  const freq = sampleRate / refined
  if (!Number.isFinite(freq) || freq < MIN_HZ || freq > MAX_HZ) return null

  return { freq, clarity: y2 }
}
