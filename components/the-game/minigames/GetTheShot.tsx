'use client';

// "Get the shot" (drone videography): a first-person pseudo-3D flight drawn in canvas 2D.
// Camera frames float towards you; steer so the crosshair sits inside each frame as it passes.
// 11 frames in ~26 s (slower with reduced motion), gusty wind; win = 7+ good takes.
// Pointer: hold/drag to steer (mouse steers towards the pointer, touch is a relative stick).
// Keyboard: arrow keys / WASD.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { MiniGameProps } from '../types';
import {
  PASS_Z,
  RINGS,
  WIN_AT,
  drawHud,
  drawScene,
  makeWorld,
  nextRing,
  ringError,
  step,
  type World,
} from './gettheshot/scene';

const T = {
  en: {
    intro: 'Fly through the camera frames to get the shot.',
    sub: `Line the crosshair up with each frame as it passes. The wind will nudge you. Get ${WIN_AT} of ${RINGS}.`,
    pointer: 'Hold or drag to steer',
    keys: '← ↑ ↓ → or WASD',
    start: 'Take off',
    area: 'Drone camera view. Steer with the arrow keys or WASD, or hold and drag.',
    takes: 'Takes',
    wind: 'Wind',
    take: (n: number) => `TAKE ${n}`,
    shot: ['Perfect shot!', 'Great shot!', 'Got it!'],
    miss: 'Out of frame',
    said: (n: number, ok: boolean, got: number) => `Take ${n}: ${ok ? 'got the shot' : 'missed'}. ${got} of ${RINGS}.`,
    winTitle: "That's a wrap!",
    loseTitle: 'Not quite the shot',
    resultSub: (n: number) => `${n}/${RINGS} good takes · you needed ${WIN_AT}`,
    strip: 'Good takes',
    emptyTake: (n: number) => `Take ${n}: not filmed yet`,
    goodTake: (n: number) => `Take ${n}: good`,
    missTake: (n: number) => `Take ${n}: missed`,
    hint: 'Arrows / WASD · or drag',
  },
  es: {
    intro: 'Vuela a través de los encuadres para conseguir la toma.',
    sub: `Alinea la mira con cada encuadre cuando pase. El viento te va a empujar. Consigue ${WIN_AT} de ${RINGS}.`,
    pointer: 'Mantén presionado o arrastra para dirigir',
    keys: '← ↑ ↓ → o WASD',
    start: 'Despegar',
    area: 'Vista de la cámara del dron. Dirige con las flechas o WASD, o mantén presionado y arrastra.',
    takes: 'Tomas',
    wind: 'Viento',
    take: (n: number) => `TOMA ${n}`,
    shot: ['¡Toma perfecta!', '¡Gran toma!', '¡La tienes!'],
    miss: 'Se salió de cuadro',
    said: (n: number, ok: boolean, got: number) =>
      `Toma ${n}: ${ok ? 'la conseguiste' : 'fallaste'}. ${got} de ${RINGS}.`,
    winTitle: '¡Corte, se queda!',
    loseTitle: 'Casi sale la toma',
    resultSub: (n: number) => `${n}/${RINGS} tomas buenas · necesitabas ${WIN_AT}`,
    strip: 'Tomas buenas',
    emptyTake: (n: number) => `Toma ${n}: todavía no se filma`,
    goodTake: (n: number) => `Toma ${n}: buena`,
    missTake: (n: number) => `Toma ${n}: fallida`,
    hint: 'Flechas / WASD · o arrastra',
  },
};

type Take = { url: string } | 'miss' | null;
type Phase = 'intro' | 'play' | 'end';

function createAudio(): AudioContext | null {
  try {
    const Ctx =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    const ctx = new Ctx();
    void ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

function blip(ctx: AudioContext | null, freq: number, at: number, dur: number, type: OscillatorType, vol = 0.06, to?: number) {
  if (!ctx) return;
  try {
    const t0 = ctx.currentTime + at;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  } catch {
    // ignore
  }
}

interface Fx {
  label: { text: string; good: boolean; t: number } | null;
  lb: number;
  flash: number;
  shake: number;
}

const LB_TIME = 0.9;

export default function GetTheShot({ lang, reducedMotion, soundOn, onFinish }: MiniGameProps) {
  const t = T[lang];
  const [phase, setPhase] = useState<Phase>('intro');
  const [takes, setTakes] = useState<Take[]>(() => Array<Take>(RINGS).fill(null));
  const [announce, setAnnounce] = useState('');
  const [result, setResult] = useState<{ won: boolean; score: number; got: number } | null>(null);
  const [showHint, setShowHint] = useState(false);

  const [world] = useState<World>(makeWorld);
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const startBtn = useRef<HTMLButtonElement>(null);
  const recText = useRef<HTMLSpanElement>(null);
  const windArrow = useRef<HTMLSpanElement>(null);
  const phaseRef = useRef<Phase>('intro');
  const keys = useRef(new Set<string>());
  const pointer = useRef<{ id: number; rel: boolean; ox: number; oy: number; px: number; py: number } | null>(null);
  const size = useRef({ w: 0, h: 0, dpr: 1 });
  const fx = useRef<Fx>({ label: null, lb: 0, flash: 0, shake: 0 });
  const thumbs = useRef<(HTMLCanvasElement | null)[]>([]);
  const accs = useRef<number[]>([]);
  const audio = useRef<AudioContext | null>(null);
  const soundRef = useRef(soundOn);
  const tRef = useRef(t);
  const recStart = useRef(0);
  const endAt = useRef<number | null>(null);

  useEffect(() => {
    soundRef.current = soundOn;
    tRef.current = t;
  }, [soundOn, t]);

  useEffect(() => {
    const id = requestAnimationFrame(() => startBtn.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(
    () => () => {
      void audio.current?.close().catch(() => {});
      audio.current = null;
    },
    [],
  );

  // Keep the canvas matched to its box.
  useEffect(() => {
    const el = wrap.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    const fit = () => {
      const r = el.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      size.current = { w: r.width, h: r.height, dpr };
      cv.width = Math.max(1, Math.round(r.width * dpr));
      cv.height = Math.max(1, Math.round(r.height * dpr));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Keyboard steering (window-level so it keeps working whatever has focus inside the dialog).
  useEffect(() => {
    const map: Record<string, string> = {
      arrowleft: 'l',
      a: 'l',
      arrowright: 'r',
      d: 'r',
      arrowup: 'u',
      w: 'u',
      arrowdown: 'd',
      s: 'd',
    };
    const down = (e: KeyboardEvent) => {
      const k = map[e.key.toLowerCase()];
      if (!k || phaseRef.current !== 'play') return;
      if (e.target instanceof HTMLButtonElement) return;
      e.preventDefault();
      keys.current.add(k);
    };
    const up = (e: KeyboardEvent) => {
      const k = map[e.key.toLowerCase()];
      if (k) keys.current.delete(k);
    };
    const clear = () => keys.current.clear();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', clear);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', clear);
    };
  }, []);

  const judge = useCallback(
    (idx: number, ok: boolean, acc: number) => {
      const tt = tRef.current;
      const f = fx.current;
      if (ok) {
        accs.current[idx] = acc;
        const label = acc > 0.7 ? tt.shot[0] : acc > 0.4 ? tt.shot[1] : tt.shot[2];
        f.label = { text: label, good: true, t: 1.1 };
        f.lb = LB_TIME;
        if (!reducedMotion) f.flash = 0.22;
        let url = '';
        try {
          url = thumbs.current[idx]?.toDataURL('image/jpeg', 0.72) ?? '';
        } catch {
          url = '';
        }
        setTakes((prev) => prev.map((x, i) => (i === idx ? { url } : x)));
        if (soundRef.current) {
          blip(audio.current, 1500, 0, 0.04, 'square', 0.035);
          blip(audio.current, 2300, 0.05, 0.05, 'square', 0.03);
          blip(audio.current, 880, 0.11, 0.18, 'triangle', 0.05);
        }
      } else {
        accs.current[idx] = -1;
        f.label = { text: tt.miss, good: false, t: 1.1 };
        if (!reducedMotion) f.shake = 0.5;
        setTakes((prev) => prev.map((x, i) => (i === idx ? 'miss' : x)));
        if (soundRef.current) blip(audio.current, 260, 0, 0.28, 'triangle', 0.06, 130);
      }
      const got = accs.current.filter((a) => a >= 0).length;
      setAnnounce(tt.said(idx + 1, ok, got));
    },
    [reducedMotion],
  );

  // Main loop: physics, judging, drawing.
  useEffect(() => {
    const cv = canvas.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    const font = getComputedStyle(cv).fontFamily || 'system-ui, sans-serif';
    const speed = reducedMotion ? 1.8 : 2.4;
    let raf = 0;
    let last = performance.now();
    let lastSec = -1;

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const ph = phaseRef.current;
      const { w, h, dpr } = size.current;
      const f = 0.8 * Math.min(w, h * 1.5);

      // Input
      let ix = 0;
      let iy = 0;
      if (ph === 'play') {
        const k = keys.current;
        ix = (k.has('r') ? 1 : 0) - (k.has('l') ? 1 : 0);
        iy = (k.has('d') ? 1 : 0) - (k.has('u') ? 1 : 0);
        const p = pointer.current;
        if (p) {
          const vx = p.rel ? (p.px - p.ox) / 48 : (p.px - w / 2) / (0.28 * Math.min(w, h));
          const vy = p.rel ? (p.py - p.oy) / 48 : (p.py - h / 2) / (0.28 * Math.min(w, h));
          ix += vx;
          iy += vy;
        }
        const len = Math.hypot(ix, iy);
        if (len > 1) {
          ix /= len;
          iy /= len;
        }
      }
      step(world, dt, { x: ix, y: iy }, speed, ph !== 'intro', !reducedMotion);

      // Judge the next frame
      const nr = nextRing(world);
      let snapIdx = -1;
      let aligned = false;
      if (nr) {
        const idx = world.rings.indexOf(nr);
        const z = nr.z - world.camZ;
        const err = ringError(world, nr);
        aligned = err.d <= 1 && z < 12;
        if (!thumbs.current[idx] && z < 2.4) snapIdx = idx;
        if (z <= PASS_Z && ph === 'play') {
          const ok = err.d <= 1;
          nr.state = ok ? 'shot' : 'miss';
          judge(idx, ok, Math.max(0, 1 - err.d));
        }
      } else if (ph === 'play') {
        if (endAt.current === null) endAt.current = world.t + 0.9;
        else if (world.t >= endAt.current) {
          const got = accs.current.filter((a) => a >= 0).length;
          const pts = accs.current.reduce((s, a) => s + (a >= 0 ? 0.55 + 0.45 * a : 0), 0);
          const score = Math.max(0, Math.min(100, Math.round((100 * pts) / RINGS)));
          phaseRef.current = 'end';
          setResult({ won: got >= WIN_AT, score, got });
          const tt = tRef.current;
          setAnnounce(`${got >= WIN_AT ? tt.winTitle : tt.loseTitle} ${tt.resultSub(got)}`);
          setPhase('end');
          if (soundRef.current && got >= WIN_AT) {
            [660, 880, 1320].forEach((fq, i) => blip(audio.current, fq, i * 0.09, 0.2, 'triangle', 0.05));
          }
        }
      }

      // Draw
      if (w > 0 && h > 0) {
        const e = fx.current;
        e.shake = Math.max(0, e.shake - dt);
        const sh = e.shake > 0 ? (e.shake / 0.5) * 7 : 0;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawScene(ctx, world, {
          w,
          h,
          f,
          shakeX: Math.sin(world.t * 38) * sh,
          shakeY: Math.cos(world.t * 31) * sh * 0.6,
          aligned,
          takeLabel: tRef.current.take,
          font,
        });
        if (snapIdx >= 0) {
          const th = document.createElement('canvas');
          th.width = 128;
          th.height = 72;
          const tc = th.getContext('2d');
          if (tc) {
            const sw = Math.min(cv.width, (cv.height * 16) / 9);
            const shh = (sw * 9) / 16;
            tc.drawImage(cv, (cv.width - sw) / 2, (cv.height - shh) / 2, sw, shh, 0, 0, 128, 72);
          }
          thumbs.current[snapIdx] = th;
        }
        drawHud(ctx, w, h, aligned && ph === 'play');
        drawFx(ctx, w, h, dt, font, reducedMotion);
        drawStick(ctx, w, h, pointer.current);
      }

      // DOM HUD: REC timer + wind vane
      if (ph !== 'intro') {
        const secs = Math.floor(world.t - recStart.current);
        if (secs !== lastSec && recText.current) {
          lastSec = secs;
          recText.current.textContent = `REC 00:${String(Math.min(99, secs)).padStart(2, '0')}`;
        }
      }
      if (windArrow.current) {
        const a = Math.atan2(world.windY, world.windX);
        const m = Math.min(1, Math.hypot(world.windX, world.windY) / 0.5);
        windArrow.current.style.transform = `rotate(${a}rad) scaleX(${0.5 + 0.5 * m})`;
      }
      if (process.env.NODE_ENV !== 'production' && area.current && nr) {
        area.current.dataset.aim = `${(nr.x - world.dx).toFixed(3)},${(nr.y - world.dy).toFixed(3)},${(nr.z - world.camZ).toFixed(2)}`;
      }
      raf = requestAnimationFrame(tick);
    };

    const drawFx = (c: CanvasRenderingContext2D, w: number, h: number, dt: number, fnt: string, rm: boolean) => {
      const e = fx.current;
      if (e.lb > 0) {
        e.lb = Math.max(0, e.lb - dt);
        const into = LB_TIME - e.lb;
        const k = rm ? 1 : Math.min(1, into / 0.15, e.lb / 0.2);
        const bh = h * 0.1 * k;
        c.fillStyle = '#0b1220';
        c.fillRect(0, 0, w, bh);
        c.fillRect(0, h - bh, w, bh);
      }
      if (e.flash > 0) {
        c.fillStyle = `rgba(255,255,255,${((e.flash / 0.22) * 0.55).toFixed(3)})`;
        c.fillRect(0, 0, w, h);
        e.flash = Math.max(0, e.flash - dt);
      }
      if (e.label) {
        e.label.t -= dt;
        if (e.label.t <= 0) e.label = null;
        else {
          const a = Math.min(1, e.label.t / 0.25);
          const fs = Math.max(16, Math.min(24, w * 0.05));
          c.font = `800 ${fs}px ${fnt}`;
          c.textBaseline = 'middle';
          c.textAlign = 'center';
          const tw = c.measureText(e.label.text).width;
          const y = h * 0.27;
          c.globalAlpha = a;
          c.fillStyle = e.label.good ? '#ecfdf5' : '#fff1f2';
          roundRect(c, w / 2 - tw / 2 - 14, y - fs * 0.85, tw + 28, fs * 1.7, 10);
          c.fill();
          c.fillStyle = e.label.good ? '#047857' : '#be123c';
          c.fillText(e.label.text, w / 2, y);
          c.textAlign = 'start';
          c.globalAlpha = 1;
        }
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [judge, reducedMotion, world]);

  // End card, then report.
  useEffect(() => {
    if (phase !== 'end' || !result) return;
    const id = window.setTimeout(() => onFinish({ won: result.won, score: result.score }), 1800);
    return () => window.clearTimeout(id);
  }, [phase, result, onFinish]);

  useEffect(() => {
    if (!showHint) return;
    const id = window.setTimeout(() => setShowHint(false), 4500);
    return () => window.clearTimeout(id);
  }, [showHint]);

  const start = () => {
    if (phaseRef.current !== 'intro') return;
    if (soundOn && !audio.current) audio.current = createAudio();
    if (soundOn) blip(audio.current, 520, 0, 0.25, 'sawtooth', 0.025, 900);
    phaseRef.current = 'play';
    recStart.current = world.t;
    setPhase('play');
    setShowHint(true);
    requestAnimationFrame(() => area.current?.focus({ preventScroll: true }));
  };

  const got = takes.filter((x) => x && x !== 'miss').length;

  return (
    <div className="flex h-full min-h-[420px] select-none flex-col gap-2 p-3 sm:gap-3 sm:p-4">
      <div
        ref={area}
        role="application"
        aria-label={t.area}
        tabIndex={phase === 'play' ? 0 : -1}
        className="relative min-h-0 flex-1 cursor-crosshair touch-none overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md outline-none focus-visible:ring-2 focus-visible:ring-[#06b6d4] focus-visible:ring-offset-2"
        onPointerDown={(e) => {
          if (phaseRef.current !== 'play') return;
          e.preventDefault();
          const r = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - r.left;
          const y = e.clientY - r.top;
          e.currentTarget.setPointerCapture?.(e.pointerId);
          pointer.current = { id: e.pointerId, rel: e.pointerType === 'touch', ox: x, oy: y, px: x, py: y };
          area.current?.focus({ preventScroll: true });
        }}
        onPointerMove={(e) => {
          const p = pointer.current;
          if (!p || p.id !== e.pointerId) return;
          const r = e.currentTarget.getBoundingClientRect();
          p.px = e.clientX - r.left;
          p.py = e.clientY - r.top;
        }}
        onPointerUp={(e) => {
          if (pointer.current?.id === e.pointerId) pointer.current = null;
        }}
        onPointerCancel={() => {
          pointer.current = null;
        }}
        onLostPointerCapture={() => {
          pointer.current = null;
        }}
      >
        <div ref={wrap} className="absolute inset-0">
          <canvas ref={canvas} className="block h-full w-full" aria-hidden />
        </div>

        {/* HUD */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 sm:p-4" aria-hidden>
          <span className="flex items-center gap-1.5 rounded-md bg-white/85 px-2 py-1 font-mono text-[11px] font-bold tabular-nums text-gray-900 shadow-sm">
            <span
              className={`h-2 w-2 rounded-full ${phase === 'play' ? 'bg-red-500' : 'bg-gray-300'} ${
                phase === 'play' && !reducedMotion ? 'animate-pulse' : ''
              }`}
            />
            <span ref={recText}>REC 00:00</span>
          </span>
          <span className="rounded-md bg-white/85 px-2 py-1 font-mono text-[11px] font-bold tabular-nums text-gray-900 shadow-sm">
            {t.takes.toUpperCase()} <span className={got >= WIN_AT ? 'text-emerald-700' : ''}>{got}</span>
            <span className="font-normal text-gray-500">/{RINGS}</span>
          </span>
        </div>
        <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md bg-white/85 px-2 py-1 font-mono text-[11px] font-bold text-gray-700 shadow-sm sm:bottom-4 sm:left-4" aria-hidden>
          {t.wind.toUpperCase()}
          <span className="relative inline-flex h-4 w-5 items-center justify-center">
            <span ref={windArrow} className="block text-sm leading-none text-[#0e7490]">
              ➜
            </span>
          </span>
        </div>
        {showHint && phase === 'play' && (
          <div className="pointer-events-none absolute inset-x-0 bottom-12 flex justify-center px-3" aria-hidden>
            <span className="rounded-lg bg-gray-900/80 px-3 py-1.5 font-mono text-xs text-white shadow">{t.hint}</span>
          </div>
        )}

        {phase === 'intro' && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 p-4 backdrop-blur-[2px]">
            <div className="flex max-w-sm flex-col items-center gap-3 text-center">
              <FrameIcon />
              <p className="text-base font-semibold text-gray-900">{t.intro}</p>
              <p className="text-sm text-gray-600">{t.sub}</p>
              <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-700">
                <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1">{t.pointer}</span>
                <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 font-mono pointer-coarse:hidden">{t.keys}</span>
              </div>
              <button
                ref={startBtn}
                data-autofocus
                type="button"
                onClick={start}
                className="mt-1 min-h-12 min-w-44 rounded-xl bg-[#0070f3] px-6 text-base font-semibold text-white transition-transform duration-150 hover:bg-[#0060d0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070f3] focus-visible:ring-offset-2 active:scale-95"
              >
                {t.start}
              </button>
            </div>
          </div>
        )}

        {phase === 'end' && result && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 p-4 backdrop-blur-[2px]">
            <div className="flex flex-col items-center gap-1 text-center">
              <p className={`text-3xl font-extrabold tracking-tight ${result.won ? 'text-[#0070f3]' : 'text-rose-600'}`}>
                {result.won ? t.winTitle : t.loseTitle}
              </p>
              <p className="text-sm text-gray-700">{t.resultSub(result.got)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Takes strip */}
      <ol className="flex shrink-0 items-center justify-center gap-1 sm:gap-1.5" aria-label={t.strip}>
        {takes.map((tk, i) => (
          <li
            key={i}
            aria-label={tk === null ? t.emptyTake(i + 1) : tk === 'miss' ? t.missTake(i + 1) : t.goodTake(i + 1)}
            className={`relative aspect-video min-w-0 max-w-14 flex-1 overflow-hidden rounded-[4px] border ${
              tk === null
                ? 'border-dashed border-gray-300 bg-gray-50'
                : tk === 'miss'
                  ? 'border-rose-200 bg-rose-50'
                  : 'border-[#06b6d4] bg-gray-100'
            }`}
          >
            {tk && tk !== 'miss' && tk.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tk.url} alt="" className="h-full w-full object-cover" />
            ) : tk === 'miss' ? (
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-rose-500" aria-hidden>
                ×
              </span>
            ) : (
              <span className="absolute inset-0 flex items-center justify-center font-mono text-[9px] text-gray-400" aria-hidden>
                {i + 1}
              </span>
            )}
          </li>
        ))}
      </ol>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function drawStick(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  p: { rel: boolean; ox: number; oy: number; px: number; py: number } | null,
) {
  if (!p) return;
  c.lineWidth = 2;
  if (p.rel) {
    const dx = p.px - p.ox;
    const dy = p.py - p.oy;
    const l = Math.hypot(dx, dy);
    const k = l > 48 ? 48 / l : 1;
    c.strokeStyle = 'rgba(15,23,42,0.35)';
    c.beginPath();
    c.arc(p.ox, p.oy, 48, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = 'rgba(8,145,178,0.55)';
    c.beginPath();
    c.arc(p.ox + dx * k, p.oy + dy * k, 16, 0, Math.PI * 2);
    c.fill();
  } else {
    c.strokeStyle = 'rgba(8,145,178,0.6)';
    c.setLineDash([4, 5]);
    c.beginPath();
    c.moveTo(w / 2, h / 2);
    c.lineTo(p.px, p.py);
    c.stroke();
    c.setLineDash([]);
    c.beginPath();
    c.arc(p.px, p.py, 7, 0, Math.PI * 2);
    c.stroke();
  }
}

function FrameIcon() {
  return (
    <svg width="64" height="40" viewBox="0 0 64 40" aria-hidden>
      <rect x="6" y="5" width="52" height="30" rx="2" fill="#ecfeff" stroke="#06b6d4" strokeDasharray="4 4" strokeWidth="1.5" />
      <g stroke="#0891b2" strokeWidth="3.5" strokeLinecap="round" fill="none">
        <path d="M6 13V5h10M48 5h10v8M58 27v8H48M16 35H6v-8" />
      </g>
      <path d="M28 20h8M32 16v8" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
