'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getAudioContext, scheduleClick } from './audio'

const LOOKAHEAD_MS = 25
const SCHEDULE_AHEAD_S = 0.15

interface Options {
  bpm: number
  beatsPerBar: number
  /** Acentuar el primer tiempo de cada compás */
  accent?: boolean
  /** Silenciar el click pero mantener el conteo visual */
  muted?: boolean
}

/**
 * Metrónomo con scheduling sobre el reloj de audio: los clicks no se desfasan
 * aunque el hilo principal se congestione. El estado visual (beat/bar) se
 * actualiza en un rAF que consume la cola de eventos ya programados.
 */
export function useMetronome({ bpm, beatsPerBar, accent = true, muted = false }: Options) {
  const [running, setRunning] = useState(false)
  const [beat, setBeat] = useState(-1)
  const [bar, setBar] = useState(0)

  const nextNoteTime = useRef(0)
  const beatIndex = useRef(0)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const raf = useRef<number | null>(null)
  const queue = useRef<{ index: number; time: number }[]>([])

  // Refs para que el scheduler lea siempre el valor vigente sin reiniciarse.
  const bpmRef = useRef(bpm)
  const beatsPerBarRef = useRef(beatsPerBar)
  const accentRef = useRef(accent)
  const mutedRef = useRef(muted)

  useEffect(() => {
    bpmRef.current = bpm
  }, [bpm])
  useEffect(() => {
    beatsPerBarRef.current = beatsPerBar
  }, [beatsPerBar])
  useEffect(() => {
    accentRef.current = accent
  }, [accent])
  useEffect(() => {
    mutedRef.current = muted
  }, [muted])

  const stop = useCallback(() => {
    if (timer.current !== null) {
      clearInterval(timer.current)
      timer.current = null
    }
    if (raf.current !== null) {
      cancelAnimationFrame(raf.current)
      raf.current = null
    }
    queue.current = []
    beatIndex.current = 0
    setRunning(false)
    setBeat(-1)
    setBar(0)
  }, [])

  const start = useCallback(() => {
    if (timer.current !== null) return

    const ctx = getAudioContext()
    beatIndex.current = 0
    queue.current = []
    nextNoteTime.current = ctx.currentTime + 0.08
    setBeat(-1)
    setBar(0)
    setRunning(true)

    timer.current = setInterval(() => {
      while (nextNoteTime.current < ctx.currentTime + SCHEDULE_AHEAD_S) {
        const index = beatIndex.current
        const isDownbeat = index % beatsPerBarRef.current === 0
        if (!mutedRef.current) {
          scheduleClick(ctx, nextNoteTime.current, accentRef.current && isDownbeat)
        }
        queue.current.push({ index, time: nextNoteTime.current })
        nextNoteTime.current += 60 / bpmRef.current
        beatIndex.current += 1
      }
    }, LOOKAHEAD_MS)

    const tick = () => {
      const now = ctx.currentTime
      let latest: number | null = null
      while (queue.current.length && queue.current[0].time <= now) {
        latest = queue.current.shift()!.index
      }
      if (latest !== null) {
        setBeat(latest % beatsPerBarRef.current)
        setBar(Math.floor(latest / beatsPerBarRef.current))
      }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
  }, [])

  const toggle = useCallback(() => {
    if (timer.current !== null) stop()
    else start()
  }, [start, stop])

  useEffect(() => stop, [stop])

  return { running, beat, bar, start, stop, toggle }
}
