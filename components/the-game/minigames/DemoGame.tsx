'use client';

// Placeholder mini-game every section points at until task 3 ships the real ones.
// "Stop the marker in the zone": 3 tries, the first hit wins. Mouse, touch and keyboard (Space/Enter).
import { useCallback, useEffect, useRef, useState } from 'react';
import type { MiniGameProps } from '../types';

const TRIES = 3;
const ZONE = 0.2; // zone width as a fraction of the track

const T = {
  en: {
    how: 'Stop the marker inside the green zone. Click, tap or press Space.',
    stop: 'Stop!',
    hit: 'Nailed it!',
    miss: 'Missed',
    tries: (n: number) => `${n} ${n === 1 ? 'try' : 'tries'} left`,
    track: 'Moving marker and target zone',
  },
  es: {
    how: 'Detén el marcador dentro de la zona verde. Haz clic, toca o presiona Espacio.',
    stop: '¡Alto!',
    hit: '¡Justo ahí!',
    miss: 'Fallaste',
    tries: (n: number) => `${n === 1 ? 'Te queda' : 'Te quedan'} ${n} ${n === 1 ? 'intento' : 'intentos'}`,
    track: 'Marcador en movimiento y zona objetivo',
  },
};

function beep(ok: boolean) {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = ok ? 880 : 220;
    o.type = 'triangle';
    g.gain.setValueAtTime(0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.26);
    o.onended = () => void ctx.close();
  } catch {
    // no audio available
  }
}

const newZone = () => 0.15 + Math.random() * (0.85 - ZONE - 0.15);

export default function DemoGame({ lang, reducedMotion, soundOn, onFinish }: MiniGameProps) {
  const t = T[lang];
  const [zone, setZone] = useState(newZone);
  const [results, setResults] = useState<boolean[]>([]);
  const [frozen, setFrozen] = useState(false);
  const marker = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const pos = useRef(0);
  const finished = useRef(false);

  // After the host dialog has placed its own initial focus (parent effects run after ours).
  useEffect(() => {
    const id = requestAnimationFrame(() => button.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(id);
  }, []);

  // Ping-pong the marker. Reduced motion slows it down (the motion is the game, so it stays).
  useEffect(() => {
    if (frozen) return;
    let raf = 0;
    let last = performance.now();
    let dir = 1;
    const speed = (reducedMotion ? 0.45 : 0.75) * (1 + results.length * 0.2);
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      let p = pos.current + dir * speed * dt;
      if (p >= 1) {
        p = 1;
        dir = -1;
      } else if (p <= 0) {
        p = 0;
        dir = 1;
      }
      pos.current = p;
      if (marker.current) marker.current.style.left = `${p * 100}%`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [frozen, reducedMotion, results.length]);

  const stop = useCallback(() => {
    if (frozen || finished.current) return;
    const p = pos.current;
    const hit = p >= zone && p <= zone + ZONE;
    if (soundOn) beep(hit);
    const next = [...results, hit];
    setResults(next);
    setFrozen(true);
    const done = hit || next.length >= TRIES;
    window.setTimeout(() => {
      if (done) {
        finished.current = true;
        const centre = zone + ZONE / 2;
        const score = hit ? Math.round(100 - (Math.abs(p - centre) / (ZONE / 2)) * 40 - (next.length - 1) * 15) : 0;
        onFinish({ won: hit, score: Math.max(0, Math.min(100, score)) });
        return;
      }
      setZone(newZone());
      setFrozen(false);
    }, 900);
  }, [frozen, onFinish, results, soundOn, zone]);

  const last = results[results.length - 1];
  const left = TRIES - results.length;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-5 sm:p-8">
      <p className="max-w-sm text-center text-sm text-gray-600">{t.how}</p>
      <div
        className="relative h-14 w-full max-w-md cursor-pointer touch-manipulation rounded-2xl bg-gray-100 shadow-inner"
        role="img"
        aria-label={t.track}
        onPointerDown={(e) => {
          e.preventDefault();
          stop();
        }}
      >
        <div
          className="absolute inset-y-2 rounded-xl bg-emerald-500/20 ring-2 ring-emerald-500"
          style={{ left: `${zone * 100}%`, width: `${ZONE * 100}%` }}
        />
        <div
          ref={marker}
          className="absolute inset-y-0 w-1.5 -translate-x-1/2 rounded-full bg-gray-900 shadow"
          style={{ left: '0%' }}
        />
      </div>
      <div className="flex items-center gap-2" aria-hidden>
        {Array.from({ length: TRIES }, (_, i) => (
          <span
            key={i}
            className={`h-3 w-3 rounded-full ${
              results[i] === undefined ? 'bg-gray-200' : results[i] ? 'bg-emerald-500' : 'bg-rose-400'
            }`}
          />
        ))}
      </div>
      <p aria-live="polite" className="h-5 text-sm font-semibold text-gray-900">
        {frozen ? (last ? t.hit : t.miss) : t.tries(left)}
      </p>
      <button
        ref={button}
        type="button"
        onClick={stop}
        aria-disabled={frozen}
        className="min-h-12 min-w-40 rounded-xl bg-[#0070f3] px-6 text-base font-semibold text-white transition-transform duration-150 hover:bg-[#0060d0] active:scale-95 aria-disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070f3] focus-visible:ring-offset-2"
      >
        {t.stop}
      </button>
    </div>
  );
}
