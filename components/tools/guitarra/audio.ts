'use client'

let sharedCtx: AudioContext | null = null

/** Un único AudioContext para toda la herramienta. Se crea al primer gesto del usuario. */
export function getAudioContext(): AudioContext {
  if (!sharedCtx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    sharedCtx = new Ctor()
  }
  if (sharedCtx.state === 'suspended') void sharedCtx.resume()
  return sharedCtx
}

/** Nota de referencia con un par de armónicos para que suene menos a pitido. */
export function playTone(freq: number, duration = 2) {
  const ctx = getAudioContext()
  const now = ctx.currentTime

  const out = ctx.createGain()
  out.gain.setValueAtTime(0.0001, now)
  out.gain.exponentialRampToValueAtTime(0.25, now + 0.015)
  out.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  out.connect(ctx.destination)

  const partials: [number, number][] = [
    [1, 1],
    [2, 0.32],
    [3, 0.14],
  ]

  for (const [mult, amp] of partials) {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq * mult
    g.gain.value = amp
    osc.connect(g).connect(out)
    osc.start(now)
    osc.stop(now + duration + 0.05)
  }
}

/** Click del metrónomo, programado en el reloj de audio (no en setTimeout). */
export function scheduleClick(ctx: AudioContext, time: number, strong: boolean) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'square'
  osc.frequency.value = strong ? 1500 : 900

  gain.gain.setValueAtTime(0.0001, time)
  gain.gain.exponentialRampToValueAtTime(strong ? 0.35 : 0.18, time + 0.001)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04)

  osc.connect(gain).connect(ctx.destination)
  osc.start(time)
  osc.stop(time + 0.05)
}
