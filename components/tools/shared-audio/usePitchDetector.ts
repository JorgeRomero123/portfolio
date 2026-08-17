'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getAudioContext } from './audio'
import { detectPitch } from './pitch'

const BUFFER_SIZE = 4096
const SILENCE_MS = 500
const SMOOTHING = 5
/** El NSDF es O(lags × muestras); a 60 fps calienta la CPU sin ganar precisión. */
const DETECT_EVERY_MS = 70

export type DetectorStatus = 'idle' | 'requesting' | 'listening' | 'denied' | 'error'

export function usePitchDetector() {
  const [status, setStatus] = useState<DetectorStatus>('idle')
  const [freq, setFreq] = useState<number | null>(null)
  const [clarity, setClarity] = useState(0)
  const [level, setLevel] = useState(0)

  const streamRef = useRef<MediaStream | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number | null>(null)
  const historyRef = useRef<number[]>([])
  const lastHitRef = useRef(0)

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    sourceRef.current?.disconnect()
    sourceRef.current = null
    analyserRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    historyRef.current = []
    setFreq(null)
    setClarity(0)
    setLevel(0)
    setStatus('idle')
  }, [])

  const start = useCallback(async () => {
    if (streamRef.current) return
    setStatus('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })
      streamRef.current = stream

      const ctx = getAudioContext()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = BUFFER_SIZE
      source.connect(analyser)
      sourceRef.current = source
      analyserRef.current = analyser
      setStatus('listening')

      const buf = new Float32Array(analyser.fftSize)
      let lastDetect = 0
      const loop = () => {
        const node = analyserRef.current
        if (!node) return
        node.getFloatTimeDomainData(buf)

        let rms = 0
        for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i]
        setLevel(Math.min(1, Math.sqrt(rms / buf.length) * 12))

        const now = performance.now()
        if (now - lastDetect < DETECT_EVERY_MS) {
          rafRef.current = requestAnimationFrame(loop)
          return
        }
        lastDetect = now

        const result = detectPitch(buf, ctx.sampleRate)
        if (result) {
          const history = historyRef.current
          history.push(result.freq)
          if (history.length > SMOOTHING) history.shift()
          const sorted = [...history].sort((a, b) => a - b)
          setFreq(sorted[Math.floor(sorted.length / 2)])
          setClarity(result.clarity)
          lastHitRef.current = now
        } else if (now - lastHitRef.current > SILENCE_MS) {
          historyRef.current = []
          setFreq(null)
          setClarity(0)
        }

        rafRef.current = requestAnimationFrame(loop)
      }
      rafRef.current = requestAnimationFrame(loop)
    } catch (err) {
      const name = (err as DOMException)?.name
      setStatus(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'error')
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => stop, [stop])

  return { status, freq, clarity, level, start, stop }
}
