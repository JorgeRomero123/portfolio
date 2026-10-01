'use client';

// "Tap the beat" (music): markers flow towards a ring; tap on each one as it lands.
// Timing runs off AudioContext.currentTime (minus output latency) when sound is on,
// otherwise off performance.now(). Win = at least 70% of beats hit (Good or better).
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { MiniGameProps } from '../types';
import { createAudio, outputLatency, scheduleSong } from './tapthebeat/audio';

const ACCENT = '#c026d3';
const BPM = 96;
const SPB = 60 / BPM;
const COUNT_IN = 4;
const BARS = 12;
const DOUBLE_BARS = [10, 11]; // the double-time finale: a tap on every half beat
const LEAD = 2.2; // seconds of lane visible ahead of the ring
const HIT_X = 14; // ring position, % of lane width
const PERFECT = 0.06;
const GOOD = 0.12;
const CATCH = 0.2; // taps within this (but outside GOOD) count as early/late misses
const INPUT_LAG = 0.01;
const WIN = 0.7;

// Target beats, counted from the end of the count-in: halves, then quarters, then a little
// syncopation, then two bars of double time.
const PATTERN: number[] = (() => {
  const b: number[] = [];
  for (let bar = 0; bar < 3; bar++) b.push(bar * 4, bar * 4 + 2);
  for (let bar = 3; bar < 7; bar++) for (let i = 0; i < 4; i++) b.push(bar * 4 + i);
  for (let bar = 7; bar < DOUBLE_BARS[0]; bar++) b.push(bar * 4, bar * 4 + 1, bar * 4 + 2, bar * 4 + 2.5, bar * 4 + 3);
  for (const bar of DOUBLE_BARS) for (let i = 0; i < 8; i++) b.push(bar * 4 + i / 2);
  b.push(BARS * 4);
  return b;
})();
const TOTAL = PATTERN.length;
const NEED = Math.ceil(TOTAL * WIN);
const TIMES = PATTERN.map((b) => (COUNT_IN + b) * SPB);
const END = TIMES[TIMES.length - 1] + 1.1;
const DOUBLE_FROM = (COUNT_IN + DOUBLE_BARS[0] * 4) * SPB;
const DOUBLE_TO = (COUNT_IN + (DOUBLE_BARS[DOUBLE_BARS.length - 1] + 1) * 4) * SPB;
const GRID = Array.from({ length: COUNT_IN + BARS * 4 + 1 }, (_, i) => i);

type Judge = 'perfect' | 'good' | 'early' | 'late' | 'miss' | 'extra';
interface Target {
  t: number;
  off: boolean;
  j?: Judge;
  jt?: number;
}
interface Snap {
  now: number;
  targets: Target[];
  perfect: number;
  good: number;
  extra: number;
  streak: number;
  flash: { kind: Judge; at: number } | null;
  tapAt: number;
}

const T = {
  en: {
    intro: 'Tap on every beat as it reaches the ring. Keep the streak going!',
    soundOff: 'Turn on sound for this one',
    soundOn: 'Sound on for this game',
    soundHint: 'Optional: a short beat plays, only in this game.',
    noAudio: "Sound isn't available here, the beat is visual.",
    start: 'Start the beat',
    keys: 'or tap anywhere here',
    touch: 'Tap anywhere here on every beat',
    hits: 'On beat',
    streak: 'Streak',
    need: (n: number) => `Hit ${n} to win`,
    judge: { perfect: 'Perfect!', good: 'Good', early: 'Early', late: 'Late', miss: 'Miss', extra: 'Off beat' } as Record<Judge, string>,
    lane: 'Beat lane. Press Space or Enter on each beat.',
    started: 'The beat started. Tap on each beat.',
    double: 'Double time!',
    win: (h: number) => `${h}/${TOTAL} — in the groove!`,
    lose: (h: number) => `${h}/${TOTAL} — the groove slipped. So close!`,
    now: 'Now!',
    next: 'Next beat',
    left: 'Left speaker',
    right: 'Right speaker',
  },
  es: {
    intro: 'Toca cada golpe justo cuando llegue al aro. ¡Mantén la racha!',
    soundOff: 'Activa el sonido para este juego',
    soundOn: 'Sonido activado en este juego',
    soundHint: 'Opcional: suena un ritmo corto, solo en este juego.',
    noAudio: 'Aquí no hay sonido disponible; el ritmo es visual.',
    start: 'Empezar el ritmo',
    keys: 'o toca aquí',
    touch: 'Toca aquí en cada golpe',
    hits: 'A tiempo',
    streak: 'Racha',
    need: (n: number) => `Atina ${n} para ganar`,
    judge: { perfect: '¡Perfecto!', good: 'Bien', early: 'Antes', late: 'Tarde', miss: 'Fallaste', extra: 'Fuera de ritmo' } as Record<Judge, string>,
    lane: 'Carril de golpes. Presiona Espacio o Enter en cada golpe.',
    started: 'Empezó el ritmo. Toca en cada golpe.',
    double: '¡Doble tiempo!',
    win: (h: number) => `${h}/${TOTAL} — ¡traes el ritmo!`,
    lose: (h: number) => `${h}/${TOTAL} — se te fue el ritmo. ¡Casi!`,
    now: '¡Ya!',
    next: 'Siguiente golpe',
    left: 'Bocina izquierda',
    right: 'Bocina derecha',
  },
};

const JUDGE_COLOR: Record<Judge, string> = {
  perfect: ACCENT,
  good: '#0070f3',
  early: '#6b7280',
  late: '#6b7280',
  miss: '#6b7280',
  extra: '#6b7280',
};

const freshTargets = (): Target[] => TIMES.map((t, i) => ({ t, off: PATTERN[i] % 1 !== 0 }));
const emptySnap = (): Snap => ({
  now: -1,
  targets: freshTargets(),
  perfect: 0,
  good: 0,
  extra: 0,
  streak: 0,
  flash: null,
  tapAt: -9,
});

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const oct = (r: number) =>
  Array.from({ length: 8 }, (_, i) => {
    const a = (Math.PI / 4) * i + Math.PI / 8;
    return `${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)}`;
  }).join(' ');

function Speaker({ pump, label }: { pump: number; label: string }) {
  return (
    <svg viewBox="0 0 100 160" className="h-auto max-h-52 w-[26%] max-w-[120px] sm:w-[22%] shrink-0 drop-shadow-md" role="img" aria-label={label}>
      <polygon points="8,4 92,4 96,12 96,152 90,156 10,156 4,150 4,10" fill="#ffffff" stroke="#e5e7eb" strokeWidth="2" />
      <polygon points="8,4 92,4 96,12 4,10" fill="#f5f3f7" />
      <g transform="translate(50 38)">
        <polygon points={oct(15)} fill="#f4f4f5" stroke="#d4d4d8" strokeWidth="1.5" />
        <polygon points={oct(7)} fill="#e879f9" />
      </g>
      <g transform={`translate(50 104) scale(${pump.toFixed(3)})`}>
        <polygon points={oct(38)} fill="#faf5ff" stroke="#e9d5ff" strokeWidth="2" />
        <polygon points={oct(30)} fill="#f5d0fe" />
        <polygon points={oct(21)} fill="#e879f9" />
        <polygon points={oct(12)} fill={ACCENT} />
        <circle r="5" fill="#86198f" />
      </g>
    </svg>
  );
}

export default function TapTheBeat({ lang, reducedMotion, soundOn, onFinish }: MiniGameProps) {
  const t = T[lang];
  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro');
  const [optIn, setOptIn] = useState(false);
  const [audioFailed, setAudioFailed] = useState(false);
  const [snap, setSnap] = useState<Snap>(emptySnap);
  const [announce, setAnnounce] = useState('');
  const doubleSaid = useRef(false);
  const game = useRef<Snap>(emptySnap());
  const ctxRef = useRef<AudioContext | null>(null);
  const clockRef = useRef<() => number>(() => performance.now() / 1000);
  const t0Ref = useRef(0);
  const started = useRef(false);
  const startBtn = useRef<HTMLButtonElement>(null);
  const pad = useRef<HTMLButtonElement>(null);
  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  const sound = soundOn || optIn;

  useEffect(() => {
    const id = requestAnimationFrame(() => startBtn.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(id);
  }, []);

  // Close the AudioContext on unmount (it's only ever created on a click).
  useEffect(
    () => () => {
      const c = ctxRef.current;
      ctxRef.current = null;
      if (c) void c.close().catch(() => {});
    },
    [],
  );

  const enableSound = useCallback(() => {
    if (optIn) return;
    const ctx = ctxRef.current ?? createAudio();
    ctxRef.current = ctx;
    setAudioFailed(!ctx);
    setOptIn(true);
  }, [optIn]);

  const start = useCallback(async () => {
    if (started.current) return;
    started.current = true;
    let ctx = ctxRef.current;
    if (sound && !ctx) {
      ctx = createAudio();
      ctxRef.current = ctx;
    }
    if (ctx) {
      try {
        await Promise.race([ctx.resume(), new Promise((r) => setTimeout(r, 400))]);
      } catch {
        // fall back to silent
      }
      if (ctx.state !== 'running') ctx = null;
    }
    if (sound && !ctx) setAudioFailed(true);
    let lat = 0;
    if (ctx) {
      const c = ctx;
      lat = outputLatency(c);
      clockRef.current = () => c.currentTime - lat;
    } else {
      clockRef.current = () => performance.now() / 1000;
    }
    const t0 = clockRef.current() + 0.35;
    t0Ref.current = t0;
    if (ctx) scheduleSong(ctx, { t0: t0 + lat, spb: SPB, countIn: COUNT_IN, bars: BARS, kicks: PATTERN, doubleBars: DOUBLE_BARS });
    setPhase('play');
    setAnnounce(t.started);
    requestAnimationFrame(() => pad.current?.focus({ preventScroll: true }));
  }, [sound, t.started]);

  const tap = useCallback(() => {
    if (phase !== 'play') return;
    const g = game.current;
    const now = clockRef.current() - t0Ref.current - INPUT_LAG;
    g.tapAt = now;
    let best = -1;
    let bd = Infinity;
    g.targets.forEach((tg, i) => {
      if (tg.j) return;
      const d = Math.abs(now - tg.t);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    let kind: Judge;
    if (best >= 0 && bd <= CATCH) {
      const tg = g.targets[best];
      if (bd <= PERFECT) kind = 'perfect';
      else if (bd <= GOOD) kind = 'good';
      else kind = now < tg.t ? 'early' : 'late';
      tg.j = kind;
      tg.jt = now;
      if (kind === 'perfect') g.perfect++;
      else if (kind === 'good') g.good++;
    } else {
      kind = 'extra';
      g.extra++;
    }
    g.streak = kind === 'perfect' || kind === 'good' ? g.streak + 1 : 0;
    g.flash = { kind, at: now };
  }, [phase]);

  // Game loop: advance the clock, auto-miss late targets, end the song.
  useEffect(() => {
    if (phase !== 'play') return;
    let raf = 0;
    const tick = () => {
      const g = game.current;
      const now = clockRef.current() - t0Ref.current;
      g.now = now;
      for (const tg of g.targets) {
        if (!tg.j && now - tg.t > CATCH) {
          tg.j = 'miss';
          tg.jt = now;
          g.streak = 0;
          g.flash = { kind: 'miss', at: now };
        }
      }
      if (!doubleSaid.current && now >= DOUBLE_FROM - SPB * 2) {
        doubleSaid.current = true;
        setAnnounce(T[lang].double);
      }
      setSnap({ ...g, targets: g.targets.map((x) => ({ ...x })) });
      if (now > END) {
        setPhase('done');
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, lang]);

  // Show the result briefly, then report once.
  useEffect(() => {
    if (phase !== 'done') return;
    const g = game.current;
    const hits = g.perfect + g.good;
    const won = hits >= NEED;
    const score = Math.round(clamp(((g.perfect + g.good * 0.75) / TOTAL) * 100 - g.extra * 2, 0, 100));
    const id = window.setTimeout(() => onFinishRef.current({ won, score }), 1500);
    return () => window.clearTimeout(id);
  }, [phase]);

  const onPointerDown = (e: PointerEvent) => {
    if (phase !== 'play') return;
    e.preventDefault();
    tap();
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    e.preventDefault();
    if (!e.repeat) tap();
  };

  // ---- derived view ----
  const now = snap.now;
  const hits = snap.perfect + snap.good;
  const lastKick = [...GRID.slice(0, COUNT_IN).map((b) => b * SPB), ...TIMES].reduce(
    (acc, k) => (k <= now && k > acc ? k : acc),
    -9,
  );
  const pump = reducedMotion || phase !== 'play' ? 1 : 1 + 0.09 * Math.exp(-(now - lastKick) / 0.08);
  const countIn = phase === 'play' && now >= 0 && now < COUNT_IN * SPB ? COUNT_IN - Math.floor(now / SPB) : null;
  // Heads-up two beats before the double-time bars, and on through them.
  const doubleTime = phase === 'play' && now >= DOUBLE_FROM - SPB * 2 && now < DOUBLE_TO;
  const flash = snap.flash && now - snap.flash.at < 0.55 ? snap.flash : null;
  const flashPop = flash && !reducedMotion ? 1 + 0.25 * Math.exp(-(now - flash.at) / 0.07) : 1;
  const ringPop = reducedMotion ? 1 : 1 + 0.14 * Math.exp(-Math.max(0, now - snap.tapAt) / 0.07);
  const ringLit = flash && (flash.kind === 'perfect' || flash.kind === 'good') ? JUDGE_COLOR[flash.kind] : null;
  const xPct = (dt: number) => HIT_X + (dt / LEAD) * (96 - HIT_X);

  // Reduced motion: a calm fill towards the next target instead of flowing markers.
  const nextIdx = snap.targets.findIndex((tg) => !tg.j && now <= tg.t + GOOD);
  const prevT = nextIdx > 0 ? snap.targets[nextIdx - 1].t : 0;
  const fill = nextIdx >= 0 && phase === 'play' ? clamp((now - prevT) / (snap.targets[nextIdx].t - prevT)) : 0;

  const center =
    phase === 'done' ? null : countIn !== null ? (
      <p className="font-mono text-5xl font-bold" style={{ color: ACCENT }}>
        {countIn}
      </p>
    ) : flash ? (
      <p
        className="text-xl font-extrabold tracking-tight whitespace-nowrap sm:text-3xl"
        style={{ color: JUDGE_COLOR[flash.kind], transform: `scale(${flashPop.toFixed(3)})` }}
      >
        {t.judge[flash.kind]}
      </p>
    ) : null;

  return (
    <div className="flex h-full min-h-[400px] flex-col justify-center gap-3 p-4 select-none sm:gap-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-gray-600">
          {t.hits}{' '}
          <strong className="font-mono text-gray-900">
            {hits}/{TOTAL}
          </strong>
          <span className="ml-2 hidden text-xs text-gray-400 sm:inline">{t.need(NEED)}</span>
        </span>
        <span
          className="rounded-full px-3 py-1 font-mono text-xs font-bold text-white"
          style={{ background: snap.streak > 0 ? ACCENT : '#9ca3af' }}
        >
          {t.streak} ×{snap.streak}
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-gray-100" aria-hidden>
        <div
          className="h-full rounded-full"
          style={{ width: `${clamp(now / END) * 100}%`, background: ACCENT, opacity: 0.5 }}
        />
      </div>

      <div
        className="relative flex min-h-0 flex-1 touch-none items-center justify-between gap-2 rounded-2xl max-sm:max-h-72 bg-gradient-to-b from-fuchsia-50 to-white px-2 py-3 sm:px-6"
        onPointerDown={onPointerDown}
      >
        <Speaker pump={pump} label={t.left} />
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-center">{center}</div>
        {doubleTime && (
          <span
            className="absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 font-mono text-xs font-bold text-white shadow-md"
            style={{ background: ACCENT }}
            aria-hidden
          >
            ×2 · {t.double}
          </span>
        )}
        <Speaker pump={pump} label={t.right} />

        {phase === 'done' && (
          <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 rounded-2xl bg-white/95 px-4 py-5 text-center shadow-md ring-1 ring-fuchsia-100">
            <p className="text-lg font-bold text-gray-900 sm:text-2xl">{hits >= NEED ? t.win(hits) : t.lose(hits)}</p>
          </div>
        )}
        {phase === 'intro' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/90 p-4 text-center backdrop-blur-sm">
            <p className="max-w-xs text-sm font-medium text-gray-700">{t.intro}</p>
            {!soundOn && (
              <button
                type="button"
                onClick={enableSound}
                aria-pressed={optIn}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-600 focus-visible:ring-offset-2"
                style={
                  optIn
                    ? { borderColor: ACCENT, background: '#fdf4ff', color: '#86198f' }
                    : { borderColor: '#e5e7eb', background: '#fff', color: '#374151' }
                }
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" />
                  {optIn ? <path d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12" strokeLinecap="round" /> : <path d="M17 9l5 6M22 9l-5 6" strokeLinecap="round" />}
                </svg>
                {optIn ? t.soundOn : t.soundOff}
              </button>
            )}
            {!soundOn && <p className="text-xs text-gray-500">{audioFailed ? t.noAudio : t.soundHint}</p>}
            <button
              ref={startBtn}
              data-autofocus
              type="button"
              onClick={() => void start()}
              className="min-h-12 min-w-44 rounded-xl px-6 text-base font-semibold text-white shadow-md transition-transform duration-150 hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-600 focus-visible:ring-offset-2"
              style={{ background: ACCENT }}
            >
              {t.start}
            </button>
          </div>
        )}
      </div>

      <button
        ref={pad}
        type="button"
        aria-label={t.lane}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        disabled={phase === 'intro'}
        className="relative h-20 w-full shrink-0 touch-none max-sm:h-auto max-sm:max-h-44 max-sm:min-h-20 max-sm:flex-1 overflow-hidden rounded-2xl bg-gray-50 ring-1 ring-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-600 disabled:opacity-60"
      >
        {reducedMotion ? (
          <>
            <span
              className="absolute inset-y-0 left-0 rounded-2xl"
              style={{ width: `${fill * 100}%`, background: fill >= 1 ? ACCENT : '#f5d0fe', opacity: fill >= 1 ? 0.9 : 1 }}
              aria-hidden
            />
            <span className="relative flex h-full items-center justify-center font-mono text-sm font-bold text-gray-900" aria-hidden>
              {phase === 'play' && fill >= 1 ? t.now : t.next}
            </span>
          </>
        ) : (
          <span aria-hidden>
            {GRID.map((b) => {
              const dt = b * SPB - now;
              if (dt < -0.6 || dt > LEAD + 0.2) return null;
              return (
                <span
                  key={`g${b}`}
                  className="absolute inset-y-3 w-px"
                  style={{ left: `${xPct(dt)}%`, background: b >= COUNT_IN && (b - COUNT_IN) % 4 === 0 ? '#d4d4d8' : '#ececf0' }}
                />
              );
            })}
            <span
              className="absolute top-1/2 h-12 w-12 rounded-full border-4"
              style={{
                left: `${HIT_X}%`,
                transform: `translate(-50%,-50%) scale(${ringPop.toFixed(3)})`,
                borderColor: ringLit ?? '#e879f9',
                background: ringLit ? `${ringLit}22` : '#fff',
              }}
            />
            {snap.targets.map((tg, i) => {
              const dt = tg.t - now;
              if (dt > LEAD + 0.2 || dt < -0.6) return null;
              const hit = tg.j === 'perfect' || tg.j === 'good';
              const age = tg.jt !== undefined ? now - tg.jt : 0;
              if (hit && age > 0.25) return null;
              const size = tg.off ? 20 : 30;
              const x = hit ? HIT_X : xPct(dt);
              return (
                <span
                  key={i}
                  className="absolute top-1/2 rounded-full"
                  style={{
                    left: `${x}%`,
                    width: size,
                    height: size,
                    transform: `translate(-50%,-50%) scale(${hit ? (1 + age * 3).toFixed(3) : 1})`,
                    opacity: hit ? clamp(1 - age / 0.25) : tg.j ? 0.5 : 1,
                    background: tg.j && !hit ? '#d4d4d8' : tg.off ? '#e879f9' : ACCENT,
                    boxShadow: tg.j ? undefined : '0 2px 6px rgba(192,38,211,.35)',
                  }}
                />
              );
            })}
          </span>
        )}
      </button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-gray-500" aria-hidden>
        <span className="space-x-1.5 pointer-coarse:hidden">
          <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[11px] text-gray-600">Space</kbd>
          <span>/</span>
          <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[11px] text-gray-600">Enter</kbd>
          <span>{t.keys}</span>
        </span>
        <span className="hidden pointer-coarse:inline">{t.touch}</span>
      </p>
      <p aria-live="polite" className="sr-only">
        {phase === 'done' ? (hits >= NEED ? t.win(hits) : t.lose(hits)) : announce}
      </p>
    </div>
  );
}
