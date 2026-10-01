'use client';

// "Perfect pour" (beer): hold to pour a black stout from the tap into a tilted pint glass (the one
// with the G on it, so the pour and the split are the same pint) and straighten it as it
// fills. A tilted glass makes little foam, an upright one makes lots; tilt too far with a full
// glass and it spills over the low rim. Each pint is judged on beer level (the fill line) and head
// thickness (the band above it). A good pour unlocks "Split the G" for that pint (a blind
// stopwatch, see perfectpour/SplitTheG). Up to 3 pints; win = split the G on any of them.
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { MiniGameProps } from '../types';
import SplitTheG, { SPLIT_TOL } from './perfectpour/SplitTheG';

const ACCENT = '#d97706';
const STOUT = '#2a1810';
const CREAM = '#f3e6c8';
const GLASSES = 3;
// Glass geometry, in glass-local SVG units (origin at the inside of the base, y up is negative).
const H = 180;
const BW = 29; // half-width at the base
const TW = 40; // half-width at the rim
const FILL = 0.8; // fill line (beer level target), fraction of H
const BAND_TOP = 0.95; // top of the head zone
const MAX_TILT = 45; // degrees
const RATES = [0.17, 0.19, 0.21]; // fraction of H per second, a touch faster each glass
const MIN_SERVE = 0.3; // releasing below this just pauses (forgives accidental taps)
const TILT_KEY_RATE = 1.1; // full tilt range per second with the arrow keys
// World layout (viewBox 360 × 400): the glass pivots around the point on its axis at 0.9 H.
const PX = 180;
const PY = 156;
const PIVOT = 0.9;
const SPOUT_Y = 102;

type Verdict = 'perfect' | 'nice' | 'foamy' | 'flat' | 'short' | 'spill';
type Phase = 'play' | 'result' | 'split' | 'done';
interface Pour {
  v: Verdict;
  score: number;
  /** Set once this pint's "Split the G" has been played (only good pours get one). */
  split?: boolean;
}
interface View {
  t: number; // tilt: 1 = 45°, 0 = upright
  L: number; // beer level
  F: number; // foam thickness
  flowing: boolean;
  wob: number;
  time: number;
  handle: number;
}

const T = {
  en: {
    area: 'Beer tap and a tilted pint glass. Hold Space to pour, Left and Right arrows to tilt the glass.',
    keyPour: 'hold to pour',
    keyTilt: 'tilt',
    pointer: 'Hold to pour · drag → to straighten',
    start: 'Start tilted, straighten as it fills',
    coach: 'Straighten up →',
    tilt: 'Tilt',
    line: 'Fill line',
    head: 'Head zone',
    glass: (n: number) => `Glass ${n} of ${GLASSES}`,
    verdict: {
      perfect: 'Perfect head!',
      nice: 'Nice pour!',
      foamy: 'Too foamy',
      flat: 'Not enough head',
      short: 'Short pour',
      spill: 'Spilled!',
    } as Record<Verdict, string>,
    goSplit: 'Good pour. Now split the G.',
    win: (n: number) => `You split the G on pint ${n}!`,
    lose: 'No split this time. The G stays whole.',
  },
  es: {
    area: 'Grifo de cerveza y un tarro inclinado. Mantén Espacio para servir; flechas izquierda y derecha para inclinar el tarro.',
    keyPour: 'mantén para servir',
    keyTilt: 'inclinar',
    pointer: 'Mantén presionado para servir · arrastra → para enderezar',
    start: 'Empieza inclinado y endereza mientras se llena',
    coach: 'Endereza el tarro →',
    tilt: 'Ángulo',
    line: 'Línea de llenado',
    head: 'Zona de espuma',
    glass: (n: number) => `Tarro ${n} de ${GLASSES}`,
    verdict: {
      perfect: '¡Espuma perfecta!',
      nice: '¡Buen servido!',
      foamy: 'Demasiada espuma',
      flat: 'Le falta espuma',
      short: 'Te quedaste corto',
      spill: '¡Se derramó!',
    } as Record<Verdict, string>,
    goSplit: 'Buen servido. Ahora parte la G.',
    win: (n: number) => `¡Partiste la G en el tarro ${n}!`,
    lose: 'Esta vez no se partió. La G quedó entera.',
  },
};

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const isGood = (v: Verdict) => v === 'perfect' || v === 'nice';
const hw = (f: number) => BW + (TW - BW) * f;
const rad = (t: number) => (t * MAX_TILT * Math.PI) / 180;
/** Highest foam top the glass holds at this tilt before the low rim goes under the surface. */
const capacity = (t: number) => Math.min(1, 1 - (TW * Math.tan(rad(t))) / H);
const foamShare = (t: number) => 0.03 + 0.55 * (1 - t) ** 2;

function judge(L: number, F: number, spilled: boolean): Pour {
  if (spilled) return { v: 'spill', score: 10 };
  const S = L + F;
  let v: Verdict;
  if (S < 0.78) v = 'short';
  else if (F > 0.21) v = 'foamy';
  else if (F < 0.05 || L > 0.88) v = 'flat';
  else if (L < 0.72) v = 'short';
  else v = Math.abs(L - FILL) <= 0.035 && F >= 0.08 && F <= 0.16 ? 'perfect' : 'nice';
  const err = Math.abs(L - FILL) * 250 + Math.max(0, Math.abs(F - 0.12) - 0.02) * 250;
  const score = isGood(v) ? clamp(100 - err, 65, 100) : clamp(55 - err * 0.6, 5, 50);
  return { v, score: Math.round(score) };
}

/** Where the stream stops: the beer/foam surface, the tilted glass's inner wall, or the base. */
function streamEnd(t: number, S: number) {
  const th = rad(t);
  const sWall = th > 0.001 ? (BW + PIVOT * (TW - BW)) / (Math.sin(th) + ((TW - BW) * Math.cos(th)) / H) : Infinity;
  const sBase = (PIVOT * H) / Math.cos(th);
  const sSurf = (PIVOT - S) * H * Math.cos(th);
  return PY + Math.min(sWall, sBase, sSurf);
}

const initialView = (): View => ({ t: 1, L: 0, F: 0, flowing: false, wob: 0, time: 0, handle: 0 });

// Deterministic "random" bubbles so renders stay pure.
const BUBBLES = Array.from({ length: 9 }, (_, i) => ({
  x: ((i * 37) % 17) / 8.5 - 1,
  phase: ((i * 53) % 29) / 29,
  speed: 0.35 + ((i * 11) % 7) / 20,
  r: 1.2 + (i % 3) * 0.5,
}));

export default function PerfectPour({ lang, reducedMotion, soundOn, onFinish }: MiniGameProps) {
  const t = T[lang];
  const [view, setView] = useState<View>(initialView);
  const [phase, setPhase] = useState<Phase>('play');
  const [pours, setPours] = useState<Pour[]>([]);
  const [glass, setGlass] = useState(0);
  const [poured, setPoured] = useState(false);

  const sim = useRef({ ...initialView(), pouring: false, blocked: false, keyL: false, keyR: false, glass: 0, phase: 'play' as Phase });
  const pourList = useRef<Pour[]>([]);
  const drag = useRef<{ id: number; x: number; t0: number; range: number } | null>(null);
  const area = useRef<HTMLDivElement>(null);
  const audio = useRef<AudioContext | null>(null);
  const timers = useRef<number[]>([]);
  const finished = useRef(false);
  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    const id = requestAnimationFrame(() => area.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(
    () => () => {
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
      const c = audio.current;
      audio.current = null;
      if (c) void c.close().catch(() => {});
    },
    [],
  );

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const ensureAudio = useCallback(() => {
    if (!soundOn) return;
    try {
      if (!audio.current) {
        const Ctx =
          window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audio.current = new Ctx();
      }
      if (audio.current.state === 'suspended') void audio.current.resume().catch(() => {});
    } catch {
      audio.current = null;
    }
  }, [soundOn]);

  const blip = useCallback(
    (notes: number[], type: OscillatorType = 'triangle', gain = 0.07) => {
      const ctx = audio.current;
      if (!soundOn || !ctx) return;
      try {
        notes.forEach((f, i) => {
          const at = ctx.currentTime + i * 0.09;
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = type;
          o.frequency.setValueAtTime(f, at);
          g.gain.setValueAtTime(0.0001, at);
          g.gain.exponentialRampToValueAtTime(gain, at + 0.015);
          g.gain.exponentialRampToValueAtTime(0.0001, at + 0.18);
          o.connect(g).connect(ctx.destination);
          o.start(at);
          o.stop(at + 0.2);
        });
      } catch {
        // audio unavailable
      }
    },
    [soundOn],
  );

  const setPhaseBoth = (p: Phase) => {
    sim.current.phase = p;
    setPhase(p);
  };

  const end = useCallback((won: boolean, score: number) => {
    setPhaseBoth('done');
    later(() => {
      if (finished.current) return;
      finished.current = true;
      onFinishRef.current({ won, score: Math.round(clamp(score, 0, 100)) });
    }, 1500);
  }, []);

  /** This pint is over without a split: set up the next one, or end the round. */
  const nextPint = useCallback(() => {
    const s = sim.current;
    const list = pourList.current;
    if (list.length >= GLASSES) {
      end(false, Math.min(45, (list.reduce((a, p) => a + p.score, 0) / list.length) * 0.45));
      return;
    }
    s.L = 0;
    s.F = 0;
    s.t = 1;
    s.wob = 0;
    s.glass = list.length;
    s.blocked = s.pouring; // a fresh press is needed for the next glass
    setGlass(list.length);
    setPoured(false);
    setPhaseBoth('play');
    requestAnimationFrame(() => area.current?.focus({ preventScroll: true }));
  }, [end]);

  const onSplit = useCallback(
    (ok: boolean, err: number) => {
      const list = pourList.current.map((p, i, all) => (i === all.length - 1 ? { ...p, split: ok } : p));
      pourList.current = list;
      setPours(list);
      // Fewer pints and a cleaner split score higher.
      if (ok) end(true, 100 - (list.length - 1) * 12 - (Math.abs(err) / SPLIT_TOL) * 12);
      else nextPint();
    },
    [end, nextPint],
  );

  const splitSound = useCallback(
    (kind: 'start' | 'split' | 'miss') => {
      ensureAudio();
      if (kind === 'start') blip([392], 'sine', 0.04);
      else if (kind === 'split') blip([660, 880, 1175]);
      else blip([247, 196], 'sine', 0.09);
    },
    [blip, ensureAudio],
  );

  const finishGlass = useCallback(
    (spilled: boolean) => {
      const s = sim.current;
      if (s.phase !== 'play') return;
      const pour = judge(s.L, s.F, spilled);
      const list = [...pourList.current, pour];
      pourList.current = list;
      setPours(list);
      setPhaseBoth('result');
      if (pour.v === 'perfect') blip([660, 880, 1175]);
      else if (pour.v === 'nice') blip([660, 880]);
      else blip(pour.v === 'spill' ? [220, 165] : [247], 'sine', 0.09);
      later(() => {
        if (isGood(pour.v)) setPhaseBoth('split');
        else nextPint();
      }, 1500);
    },
    [blip, nextPint],
  );

  const finishRef = useRef(finishGlass);
  useEffect(() => {
    finishRef.current = finishGlass;
  }, [finishGlass]);

  // Simulation loop.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      // Slow frames still pour in real time: integrate in small sub-steps.
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      const s = sim.current;
      s.time += dt;
      const t0 = s.t;
      let flowing = false;
      const steps = Math.max(1, Math.ceil(dt / 0.02));
      for (let k = 0; k < steps && s.phase === 'play'; k++) {
        const h = dt / steps;
        const dir = (s.keyL ? 1 : 0) - (s.keyR ? 1 : 0);
        if (dir) s.t = clamp(s.t + dir * TILT_KEY_RATE * h);
        flowing = s.pouring && !s.blocked;
        if (flowing) {
          const dV = RATES[s.glass] * h;
          const share = foamShare(s.t);
          s.F += dV * share;
          s.L += dV * (1 - share);
        }
        if (s.L + s.F > 0.02 && s.L + s.F >= capacity(s.t)) {
          s.pouring = false;
          s.blocked = true;
          flowing = false;
          finishRef.current(true);
        }
      }
      if (reducedMotion) {
        s.wob = 0;
        s.handle = flowing ? 1 : 0;
      } else {
        s.wob += ((flowing ? 2.6 : 0) - s.wob) * Math.min(1, dt * 2.5);
        s.wob = Math.min(7, s.wob + Math.abs(s.t - t0) * 25);
        s.handle += ((flowing ? 1 : 0) - s.handle) * Math.min(1, dt * 12);
      }
      setView({ t: s.t, L: s.L, F: s.F, flowing, wob: s.wob, time: s.time, handle: s.handle });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion]);

  const press = useCallback(() => {
    ensureAudio();
    const s = sim.current;
    if (s.pouring) return;
    s.pouring = true;
    if (s.phase === 'play' && !s.blocked) {
      setPoured(true);
      blip([520], 'sine', 0.04);
    }
  }, [blip, ensureAudio]);

  const release = useCallback(() => {
    const s = sim.current;
    if (!s.pouring) return;
    s.pouring = false;
    if (s.blocked) {
      s.blocked = false;
      return;
    }
    if (s.phase === 'play' && s.L + s.F >= MIN_SERVE) finishGlass(false);
  }, [finishGlass]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    area.current?.focus({ preventScroll: true });
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // capture unsupported
    }
    const w = e.currentTarget.getBoundingClientRect().width;
    drag.current = { id: e.pointerId, x: e.clientX, t0: sim.current.t, range: Math.max(110, w * 0.38) };
    press();
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId || sim.current.phase !== 'play') return;
    sim.current.t = clamp(d.t0 - (e.clientX - d.x) / d.range);
  };
  const onPointerEnd = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || drag.current.id !== e.pointerId) return;
    drag.current = null;
    release();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const s = sim.current;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!e.repeat) press();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      s.keyL = true;
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      s.keyR = true;
    }
  };
  const onKeyUp = (e: KeyboardEvent<HTMLDivElement>) => {
    const s = sim.current;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      release();
    } else if (e.key === 'ArrowLeft') s.keyL = false;
    else if (e.key === 'ArrowRight') s.keyR = false;
  };
  const onBlur = () => {
    sim.current.keyL = false;
    sim.current.keyR = false;
    if (!drag.current) release();
  };

  // ---- derived render values ----
  const { t: tilt, L, F, flowing, wob, time, handle } = view;
  const S = L + F;
  const angle = -MAX_TILT * tilt;
  const slosh = reducedMotion ? 0 : wob * Math.sin(time * 9);
  const counter = MAX_TILT * tilt + slosh;
  const last = pours[pours.length - 1];
  const won = pours.some((p) => p.split);
  const wonOn = pours.findIndex((p) => p.split) + 1;
  const showCoach = phase === 'play' && glass === 0 && flowing && S >= 0.5 && tilt > 0.45;
  const showStart = phase === 'play' && glass === 0 && !poured;
  const spilled = phase !== 'play' && last?.v === 'spill';
  const foamTop = (y: number) =>
    [-130, -90, -60, -34, -10, 14, 38, 64, 94, 130]
      .map((x, i) => `${x},${(y + (i % 2 ? 1.6 : -1.8)).toFixed(1)}`)
      .join(' ');

  const live =
    phase === 'done'
      ? won
        ? t.win(wonOn)
        : t.lose
      : phase === 'result' && last
        ? `${t.verdict[last.v]} ${isGood(last.v) ? t.goSplit : t.glass(pours.length)}`
        : phase === 'split'
          ? ''
          : t.glass(glass + 1);

  return (
    <div className="flex h-full flex-col items-center gap-2 px-4 pb-4 pt-3 sm:px-6">
      {/* HUD */}
      <div className="flex w-full max-w-md items-center justify-between gap-3">
        <div className="flex items-center gap-2" aria-hidden>
          {Array.from({ length: GLASSES }, (_, i) => {
            const p = pours[i];
            // A pint is settled once its pour failed or its split was played.
            const settled = !!p && (!isGood(p.v) || p.split !== undefined);
            const cls = !settled
              ? i === (p ? i : glass) && phase !== 'done'
                ? 'border-[#d97706] bg-amber-50'
                : 'border-gray-200 bg-white'
              : p.split
                ? 'border-emerald-500 bg-emerald-500'
                : 'border-gray-300 bg-gray-300';
            return (
              <span key={i} className={`flex h-7 w-6 items-end justify-center rounded-b-md rounded-t-sm border-2 ${cls}`}>
                {settled && <span className="mb-0.5 text-[10px] font-bold leading-none text-white">{p.split ? '✓' : '×'}</span>}
              </span>
            );
          })}
        </div>
        <p className="min-w-0 flex-1 text-center text-sm font-semibold leading-tight text-balance text-gray-900" aria-hidden>
          {t.glass(Math.min(GLASSES, phase === 'play' ? glass + 1 : Math.max(1, pours.length)))}
        </p>
        <p aria-live="polite" className="sr-only">
          {live}
        </p>
        <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 font-mono text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
          {t.tilt} {Math.round(tilt * MAX_TILT)}°
        </span>
      </div>

      {/* Play area */}
      <div
        ref={area}
        data-autofocus
        role="application"
        tabIndex={0}
        aria-label={t.area}
        data-level={L.toFixed(3)}
        data-foam={F.toFixed(3)}
        data-tilt={tilt.toFixed(3)}
        data-phase={phase}
        data-glass={glass}
        className="relative min-h-0 w-full max-w-md flex-1 cursor-pointer touch-none select-none overflow-hidden rounded-2xl bg-[#fffaf2] outline-none focus-visible:ring-2 focus-visible:ring-[#d97706] focus-visible:ring-offset-2"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onLostPointerCapture={onPointerEnd}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onBlur={onBlur}
        onContextMenu={(e) => e.preventDefault()}
      >
        <svg viewBox="0 0 360 400" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          <defs>
            <linearGradient id="pp-beer" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#3b2418" />
              <stop offset="0.3" stopColor="#1c120d" />
              <stop offset="1" stopColor="#0f0906" />
            </linearGradient>
            <clipPath id="pp-inside">
              <polygon points={`${-BW},0 ${BW},0 ${TW},${-H} ${-TW},${-H}`} />
            </clipPath>
          </defs>

          {/* back wall + counter */}
          <rect x="-400" y="-300" width="1160" height="630" fill="#fffaf2" />
          <polygon points="-400,-300 140,-300 140,0 60,150 -400,200" fill="#fef3e2" />
          <polygon points="760,-300 250,-300 250,0 330,190 760,230" fill="#fdf0da" />
          <polygon points="-400,330 760,330 760,640 -400,640" fill="#dcc09a" />
          <polygon points="-400,330 760,330 760,342 -400,342" fill="#f3e2c7" />
          <polygon points="-400,342 60,342 -40,640 -400,640" fill="#d4b68d" />
          <polygon points="300,342 760,342 760,640 400,640" fill="#e4cba5" />
          <polygon points="120,318 240,318 246,330 114,330" fill="#9ca3af" />
          <polygon points="120,318 240,318 238,322 122,322" fill="#d1d5db" />
          {spilled && <ellipse cx="160" cy="327" rx="34" ry="4" fill={STOUT} opacity="0.8" />}

          {/* tap tower */}
          <polygon points="290,70 316,70 318,330 288,330" fill="#e5e7eb" />
          <polygon points="303,70 316,70 318,330 303,330" fill="#d1d5db" />
          <polygon points="280,54 326,54 322,72 284,72" fill="#cbd5e1" />
          <polygon points="172,64 298,64 298,82 172,82" fill="#e5e7eb" />
          <polygon points="172,74 298,74 298,82 172,82" fill="#cbd5e1" />
          <polygon points="170,62 190,62 192,92 168,92" fill="#d1d5db" />
          <polygon points="180,62 190,62 192,92 180,92" fill="#9ca3af" />
          <polygon points="175,92 185,92 184,102 176,102" fill="#6b7280" />

          {/* stream (behind the glass contents) */}
          {flowing && (
            <g>
              <rect x={PX - 3.5} y={SPOUT_Y} width="7" height={Math.max(0, streamEnd(tilt, S) - SPOUT_Y)} rx="3" fill={STOUT} opacity="0.95" />
              <rect x={PX - 1.5} y={SPOUT_Y} width="1.6" height={Math.max(0, streamEnd(tilt, S) - SPOUT_Y)} fill="#6b4a35" opacity="0.8" />
            </g>
          )}

          {/* handle (pulls forward while pouring) */}
          <g transform={`rotate(${(-28 * handle).toFixed(2)} 180 64)`}>
            <rect x="177" y="48" width="6" height="16" fill="#9ca3af" />
            <polygon points="171,50 189,50 192,30 188,10 180,3 172,10 168,30" fill={ACCENT} />
            <polygon points="180,3 188,10 192,30 189,50 180,50" fill="#b45309" />
            <polygon points="172,10 180,3 180,50 171,50 168,30" fill="#f59e0b" opacity="0.55" />
            <polygon points="171,44 189,44 189,50 171,50" fill="#78350f" />
          </g>

          {/* glass */}
          <g transform={`translate(${PX} ${PY}) rotate(${angle.toFixed(2)}) translate(0 ${PIVOT * H})`}>
            <polygon
              points={`${-BW - 3},9 ${BW + 3},9 ${TW + 3},${-H - 1} ${-TW - 3},${-H - 1}`}
              fill="#eff6ff"
              fillOpacity="0.55"
              stroke="#94a3b8"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* head zone (hidden behind the foam once it fills) */}
            <polygon
              points={`${-hw(FILL)},${-FILL * H} ${hw(FILL)},${-FILL * H} ${hw(BAND_TOP)},${-BAND_TOP * H} ${-hw(BAND_TOP)},${-BAND_TOP * H}`}
              fill={ACCENT}
              fillOpacity="0.12"
            />
            <g clipPath="url(#pp-inside)">
              {F > 0.003 && (
                <g transform={`rotate(${counter.toFixed(2)} 0 ${(-S * H).toFixed(2)})`}>
                  <polygon points={`${foamTop(-S * H)} 130,${400 - S * H} -130,${400 - S * H}`} fill={CREAM} stroke="#c9b089" strokeWidth="1.5" strokeLinejoin="round" />
                  <polygon
                    points={`-130,${(-L * H - 4).toFixed(1)} 130,${(-L * H - 4).toFixed(1)} 130,${400 - L * H} -130,${400 - L * H}`}
                    fill="#d8c29a"
                  />
                </g>
              )}
              {L > 0.003 && (
                <g transform={`rotate(${counter.toFixed(2)} 0 ${(-L * H).toFixed(2)})`}>
                  <rect x="-130" y={-L * H} width="260" height="420" fill="url(#pp-beer)" />
                  <polygon points={`-130,${-L * H} 130,${-L * H} 130,${-L * H + 5} -130,${-L * H + 3}`} fill="#5a3a26" opacity="0.8" />
                  {!reducedMotion &&
                    L > 0.08 &&
                    BUBBLES.map((b, i) => {
                      const depth = L * H * 0.95;
                      const y = -L * H + depth * (1 - ((b.phase + time * b.speed) % 1));
                      return <circle key={i} cx={b.x * BW * 0.8} cy={y} r={b.r} fill={CREAM} opacity="0.45" />;
                    })}
                </g>
              )}
            </g>
            <line x1={-hw(BAND_TOP) - 3} x2={hw(BAND_TOP) + 3} y1={-BAND_TOP * H} y2={-BAND_TOP * H} stroke={ACCENT} strokeWidth="1.2" strokeDasharray="4 3" />
            <line x1={-hw(FILL) - 5} x2={hw(FILL) + 5} y1={-FILL * H} y2={-FILL * H} stroke={ACCENT} strokeWidth="2.5" />
            {/* the G printed on the glass: the same pint is split in the next stage */}
            <text
              x="0"
              y={-0.36 * H}
              textAnchor="middle"
              fontSize="50"
              fontWeight="800"
              fill="#d9a441"
              stroke="#5b3a12"
              strokeWidth="1.2"
              paintOrder="stroke"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              G
            </text>
            {/* glass shine + thick base */}
            <polygon points={`${-BW + 5},-6 ${-BW + 11},-6 ${-TW + 13},${-H + 8} ${-TW + 6},${-H + 8}`} fill="#ffffff" opacity="0.55" />
            <polygon points={`${-BW - 3},0 ${BW + 3},0 ${BW + 3},9 ${-BW - 3},9`} fill="#cbd5e1" opacity="0.7" />
            {spilled && (
              <g fill={STOUT} opacity="0.85">
                <polygon points={`${-TW - 3},${-H + 2} ${-TW + 3},${-H + 2} ${-TW - 1},${-H + 30}`} />
                <polygon points={`${-TW + 1},${-H + 10} ${-TW + 6},${-H + 10} ${-TW + 2},${-H + 52}`} />
              </g>
            )}
          </g>
        </svg>

        {/* legend: what the two marks mean */}
        <div className="pointer-events-none absolute left-2 top-2 flex flex-col gap-1 text-[11px] font-medium text-gray-700" aria-hidden>
          <span className="flex items-center gap-1.5">
            <span className="h-[3px] w-4 rounded bg-[#d97706]" />
            {t.line}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-sm border border-dashed border-[#d97706] bg-amber-100" />
            {t.head}
          </span>
        </div>

        {/* overlays */}
        {showStart && (
          <p className="pointer-events-none absolute inset-x-0 bottom-3 mx-auto w-fit max-w-[90%] rounded-full bg-white/95 px-3 py-1.5 text-center text-xs font-semibold text-amber-800 shadow-md ring-1 ring-amber-200">
            {t.start}
          </p>
        )}
        {showCoach && (
          <p className="pointer-events-none absolute inset-x-0 bottom-3 mx-auto w-fit max-w-[calc(100%-1.5rem)] rounded-full bg-[#d97706] text-center px-3 py-1.5 text-sm font-bold text-white shadow-md">
            {t.coach}
          </p>
        )}
        {phase === 'result' && last && (
          <p
            className={`pointer-events-none absolute inset-x-0 bottom-3 mx-auto w-fit max-w-[calc(100%-1.5rem)] rounded-xl px-4 py-2 text-center text-lg font-bold shadow-lg ring-1 ${
              last.v === 'perfect'
                ? 'bg-amber-50 text-amber-800 ring-amber-300'
                : isGood(last.v)
                  ? 'bg-emerald-50 text-emerald-800 ring-emerald-300'
                  : 'bg-white text-gray-800 ring-gray-200'
            }`}
          >
            {t.verdict[last.v]}
            {isGood(last.v) && <span className="block text-sm font-semibold">{t.goSplit}</span>}
          </p>
        )}
        {phase === 'split' && <SplitTheG key={pours.length} lang={lang} reducedMotion={reducedMotion} onSound={splitSound} onDone={onSplit} />}
        {phase === 'done' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-white/70">
            <p className={`mx-4 rounded-2xl bg-white px-5 py-3 text-center text-xl font-bold shadow-lg ring-1 ${won ? 'text-emerald-700 ring-emerald-300' : 'text-gray-800 ring-gray-200'}`}>
              {won ? t.win(wonOn) : t.lose}
            </p>
          </div>
        )}
      </div>

      {/* controls hint */}
      <p className="text-center text-xs text-gray-600">
        <span className="max-sm:hidden pointer-coarse:hidden">
          <kbd className="rounded border border-gray-300 bg-gray-50 px-1 font-mono">Space</kbd> {t.keyPour} ·{' '}
          <kbd className="rounded border border-gray-300 bg-gray-50 px-1 font-mono">←</kbd>{' '}
          <kbd className="rounded border border-gray-300 bg-gray-50 px-1 font-mono">→</kbd> {t.keyTilt}
          <span className="mx-1.5 text-gray-300">|</span>
        </span>
        {t.pointer}
      </p>
    </div>
  );
}
