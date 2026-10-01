'use client';

// artoverlay mini-game: "Trace it". A design is projected onto a plaster wall from a phone;
// trace its outline before time runs out. Three short designs (wave, house or heart, star).
// Each scores coverage × accuracy (mean ink distance from the outline); win on an average ≥ WIN.
// Pointer: drag to draw. Keyboard: arrows steer a pen that draws as it moves (Shift = fine),
// and it gently snaps onto the line when close. Enter moves on early.
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as RPointerEvent,
} from 'react';
import type { MiniGameProps } from '../types';
import { PHONE_TALL, PHONE_WIDE, makePlaster, paintBoard } from './traceit/paint';
import {
  COVER_R,
  H,
  SNAP_R,
  W,
  WIN,
  dist,
  nearest,
  pickShapes,
  shapeScore,
  type P,
  type Shape,
  type ShapeId,
} from './traceit/shapes';

const SPEED = 115; // keyboard pen, board units per second
const FINE = 42;
/** Board areas (logical units) fitted into the canvas: the whole wide board, or a tall crop. */
const VIEW_WIDE = { x: 0, y: 0, w: W, h: H };
const VIEW_TALL = { x: 62, y: 40, w: 306, h: 340 };
const AUTO_DONE = 0.97; // coverage that ends a design early

type Stage = 'play' | 'result' | 'end';

const fresh = (shape: Shape) => ({
  shape,
  covered: new Uint8Array(shape.pts.length),
  count: 0,
  strokes: [] as P[][],
  sumD: 0,
  n: 0,
  pen: { ...shape.pts[0] },
  t0: 0, // set on the first frame
  milestone: 0,
  lastPct: 0,
});

const T = {
  en: {
    names: { wave: 'Wave', house: 'Little house', heart: 'Heart', star: 'Star' } as Record<ShapeId, string>,
    design: (i: number, n: number) => `Design ${i}/${n}`,
    traced: (p: number) => `${p}% traced`,
    next: 'Next design',
    finish: 'Finish',
    keys: 'Arrows steer the pen · Shift: fine steps · it snaps onto the line when close · Enter: next',
    touch: 'Drag along the glowing outline',
    area: (name: string) =>
      `Wall with a projected outline: ${name}. Drag to trace it, or steer the pen with the arrow keys (Shift for fine steps); the pen snaps onto the line when close. Enter moves on.`,
    timeLeft: 'Time left',
    result: (name: string, s: number) => `${name}: ${s}%`,
    verdict: (avg: number) => (avg >= 85 ? 'pro linework!' : avg >= WIN ? 'clean lines!' : 'a bit shaky this time.'),
    end: (avg: number, v: string) => `Average ${avg}% — ${v}`,
    need: `${WIN}% average wins`,
  },
  es: {
    names: { wave: 'Ola', house: 'Casita', heart: 'Corazón', star: 'Estrella' } as Record<ShapeId, string>,
    design: (i: number, n: number) => `Diseño ${i}/${n}`,
    traced: (p: number) => `${p}% calcado`,
    next: 'Siguiente diseño',
    finish: 'Terminar',
    keys: 'Las flechas guían el plumón · Shift: pasos finos · se pega a la línea cuando estás cerca · Enter: siguiente',
    touch: 'Arrastra sobre el contorno que brilla',
    area: (name: string) =>
      `Pared con un contorno proyectado: ${name}. Arrastra para calcarlo o guía el plumón con las flechas (Shift para pasos finos); el plumón se pega a la línea cuando estás cerca. Enter para seguir.`,
    timeLeft: 'Tiempo restante',
    result: (name: string, s: number) => `${name}: ${s}%`,
    verdict: (avg: number) =>
      avg >= 85 ? '¡trazo de profesional!' : avg >= WIN ? '¡líneas limpias!' : 'te tembló un poco la mano.',
    end: (avg: number, v: string) => `Promedio ${avg}% — ${v}`,
    need: `Ganas con ${WIN}% de promedio`,
  },
};

// Tiny Web Audio synth, created lazily on the first gesture and only when sound is on.
function useSynth(soundOn: boolean) {
  const ctx = useRef<AudioContext | null>(null);
  useEffect(
    () => () => {
      void ctx.current?.close();
      ctx.current = null;
    },
    [],
  );
  return useCallback(
    (kind: 'tick' | 'good' | 'meh') => {
      if (!soundOn) return;
      try {
        if (!ctx.current) {
          const Ctx =
            window.AudioContext ??
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          ctx.current = new Ctx();
        }
        const c = ctx.current;
        void c.resume();
        const tone = (f: number, at: number, dur: number, vol: number) => {
          const o = c.createOscillator();
          const g = c.createGain();
          const t0 = c.currentTime + at;
          o.type = 'triangle';
          o.frequency.setValueAtTime(f, t0);
          g.gain.setValueAtTime(0.0001, t0);
          g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
          o.connect(g).connect(c.destination);
          o.start(t0);
          o.stop(t0 + dur + 0.02);
        };
        if (kind === 'tick') tone(740, 0, 0.07, 0.04);
        else if (kind === 'good') {
          tone(587, 0, 0.12, 0.07);
          tone(784, 0.09, 0.12, 0.07);
          tone(988, 0.18, 0.25, 0.07);
        } else {
          tone(392, 0, 0.14, 0.06);
          tone(330, 0.12, 0.25, 0.06);
        }
      } catch {
        // no audio available
      }
    },
    [soundOn],
  );
}

export default function TraceIt({ lang, reducedMotion, soundOn, onFinish }: MiniGameProps) {
  const t = T[lang];
  const [shapes] = useState(pickShapes);
  const [idx, setIdx] = useState(0);
  const [stage, setStageState] = useState<Stage>('play');
  const [scores, setScores] = useState<number[]>([]);
  const [pct, setPct] = useState(0);
  const [live, setLive] = useState('');

  const wrap = useRef<HTMLDivElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const nextBtn = useRef<HTMLButtonElement>(null);
  const timers = useRef<number[]>([]);
  const play = useSynth(soundOn);
  const playRef = useRef(play);
  const finishRef = useRef(onFinish);
  const rmRef = useRef(reducedMotion);
  useEffect(() => {
    playRef.current = play;
    finishRef.current = onFinish;
    rmRef.current = reducedMotion;
  }, [play, onFinish, reducedMotion]);

  const g = useRef({
    stage: 'play' as Stage,
    idx: 0,
    scores: [] as number[],
    cur: fresh(shapes[0]),
    keys: new Set<string>(),
    fine: false,
    kbDrawing: false,
    pointer: null as number | null,
    view: { s: 1, ox: 0, oy: 0, dpr: 1, cw: 0, ch: 0, tall: false, rect: VIEW_WIDE },
    plaster: null as HTMLCanvasElement | null,
  });

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  const setStage = useCallback((s: Stage) => {
    g.current.stage = s;
    setStageState(s);
  }, []);

  const focusArea = useCallback(() => area.current?.focus({ preventScroll: true }), []);

  // Focus the drawing surface after the host places its own focus; reclaim it once if the host took it.
  useEffect(() => {
    const id = requestAnimationFrame(focusArea);
    const retry = window.setTimeout(() => {
      const el = document.activeElement;
      if (!el || el === document.body || el.matches('[data-testid="skip-minigame"]')) focusArea();
    }, 400);
    const ts = timers.current;
    return () => {
      cancelAnimationFrame(id);
      window.clearTimeout(retry);
      ts.forEach((x) => window.clearTimeout(x));
    };
  }, [focusArea]);

  const endShape = useCallback(() => {
    const s = g.current;
    if (s.stage !== 'play') return;
    const c = s.cur;
    const cov = c.count / c.shape.pts.length;
    const score = c.n ? shapeScore(cov, c.sumD / c.n) : 0;
    s.scores = [...s.scores, score];
    s.pointer = null;
    s.kbDrawing = false;
    setScores(s.scores);
    setStage('result');
    const name = T[lang].names[c.shape.id];
    setLive(T[lang].result(name, score));
    playRef.current(score >= WIN ? 'good' : 'meh');
    later(() => {
      if (s.idx < shapes.length - 1) {
        s.idx += 1;
        s.cur = fresh(shapes[s.idx]);
        setIdx(s.idx);
        setPct(0);
        setStage('play');
        setLive(`${T[lang].design(s.idx + 1, shapes.length)}: ${T[lang].names[shapes[s.idx].id]}`);
        if (document.activeElement === nextBtn.current) focusArea();
        return;
      }
      const avg = Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length);
      setStage('end');
      setLive(T[lang].end(avg, T[lang].verdict(avg)));
      later(() => finishRef.current({ won: avg >= WIN, score: avg }), 1500);
    }, 1100);
  }, [focusArea, lang, later, setStage, shapes]);
  const endRef = useRef(endShape);
  useEffect(() => {
    endRef.current = endShape;
  }, [endShape]);

  /** Adds ink up to `p`, interpolating so fast strokes still cover the line, and updates coverage. */
  const addInk = useCallback((p: P, newStroke: boolean) => {
    const s = g.current;
    if (s.stage !== 'play') return;
    const c = s.cur;
    const pts = c.shape.pts;
    const sample = (q: P) => {
      let best = Infinity;
      for (let i = 0; i < pts.length; i++) {
        const d = Math.hypot(pts[i].x - q.x, pts[i].y - q.y);
        if (d < best) best = d;
        if (d <= COVER_R && !c.covered[i]) {
          c.covered[i] = 1;
          c.count++;
        }
      }
      c.sumD += best;
      c.n++;
    };
    if (newStroke || !c.strokes.length) {
      c.strokes.push([p]);
      sample(p);
    } else {
      const stroke = c.strokes[c.strokes.length - 1];
      const prev = stroke[stroke.length - 1];
      const d = dist(prev, p);
      if (d < 1) return;
      const steps = Math.ceil(d / 2);
      for (let k = 1; k <= steps; k++) sample({ x: prev.x + ((p.x - prev.x) * k) / steps, y: prev.y + ((p.y - prev.y) * k) / steps });
      stroke.push(p);
    }
    c.pen = { ...p };
    const cov = c.count / pts.length;
    const m = Math.floor(cov * 4);
    if (m > c.milestone && m < 4) {
      c.milestone = m;
      playRef.current('tick');
    }
    if (cov >= AUTO_DONE) endRef.current();
  }, []);

  // Size the canvas to its box and rebuild the plaster texture.
  useEffect(() => {
    const el = wrap.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    const fit = () => {
      const r = el.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const cw = Math.max(1, Math.round(r.width));
      const ch = Math.max(1, Math.round(r.height));
      cv.width = cw * dpr;
      cv.height = ch * dpr;
      // Tall boxes (phones) frame the design with the phone below it, so the design gets bigger.
      const tall = ch / cw > 1.1;
      const rect = tall ? VIEW_TALL : VIEW_WIDE;
      const s = Math.min(cw / rect.w, ch / rect.h);
      g.current.view = {
        s,
        ox: (cw - rect.w * s) / 2 - rect.x * s,
        oy: (ch - rect.h * s) / 2 - rect.y * s,
        dpr,
        cw,
        ch,
        tall,
        rect,
      };
      g.current.plaster = makePlaster(cv.width, cv.height);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Main loop: timer, keyboard pen, painting.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const s = g.current;
      // Real elapsed time (capped), so the pen keeps its speed on slow devices; moved in small substeps.
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      const c = s.cur;
      if (s.stage === 'play') {
        if (!c.t0) c.t0 = now;
        const left = Math.max(0, 1 - (now - c.t0) / (c.shape.time * 1000));
        if (bar.current) bar.current.style.transform = `scaleX(${left})`;
        if (left <= 0) endRef.current();
        const k = s.keys;
        let dx = (k.has('ArrowRight') ? 1 : 0) - (k.has('ArrowLeft') ? 1 : 0);
        let dy = (k.has('ArrowDown') ? 1 : 0) - (k.has('ArrowUp') ? 1 : 0);
        if ((dx || dy) && s.stage === 'play') {
          const len = Math.hypot(dx, dy);
          dx /= len;
          dy /= len;
          const v = s.fine ? FINE : SPEED;
          const steps = Math.max(1, Math.ceil(dt / 0.02));
          const h = dt / steps;
          for (let i = 0; i < steps && s.stage === 'play'; i++) {
            let p = { x: c.pen.x + dx * v * h, y: c.pen.y + dy * v * h };
            const near = nearest(c.shape.pts, p);
            if (near.d < SNAP_R) {
              const q = c.shape.pts[near.i];
              const pull = Math.min(1, h * 9);
              p = { x: p.x + (q.x - p.x) * pull, y: p.y + (q.y - p.y) * pull };
            }
            const r = s.view.rect;
            p = {
              x: Math.max(r.x + 4, Math.min(r.x + r.w - 4, p.x)),
              y: Math.max(r.y + 4, Math.min(r.y + r.h - 4, p.y)),
            };
            addInk(p, !s.kbDrawing);
            s.kbDrawing = true;
          }
        }
        const pc = Math.round((c.count / c.shape.pts.length) * 100);
        if (pc !== c.lastPct) {
          c.lastPct = pc;
          setPct(pc);
        }
      }
      const cv = canvas.current;
      const ctx = cv?.getContext('2d');
      if (cv && ctx) {
        const v = s.view;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        if (s.plaster) ctx.drawImage(s.plaster, 0, 0);
        ctx.setTransform(v.dpr * v.s, 0, 0, v.dpr * v.s, v.dpr * v.ox, v.dpr * v.oy);
        paintBoard(ctx, {
          shape: c.shape,
          covered: c.covered,
          strokes: c.strokes,
          pen: c.pen,
          showStart: s.stage === 'play' && c.n === 0,
          now,
          reducedMotion: rmRef.current,
          phone: v.tall ? PHONE_TALL : PHONE_WIDE,
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [addInk]);

  const toBoard = (e: { clientX: number; clientY: number }): P => {
    const r = canvas.current!.getBoundingClientRect();
    const v = g.current.view;
    return { x: (e.clientX - r.left - v.ox) / v.s, y: (e.clientY - r.top - v.oy) / v.s };
  };

  const onPointerDown = (e: RPointerEvent<HTMLCanvasElement>) => {
    const s = g.current;
    if (s.stage !== 'play' || s.pointer !== null) return;
    e.preventDefault();
    focusArea();
    e.currentTarget.setPointerCapture(e.pointerId);
    s.pointer = e.pointerId;
    s.kbDrawing = false;
    addInk(toBoard(e), true);
  };
  const onPointerMove = (e: RPointerEvent<HTMLCanvasElement>) => {
    if (g.current.pointer !== e.pointerId) return;
    const evs = e.nativeEvent.getCoalescedEvents?.() ?? [];
    for (const ev of evs.length ? evs : [e.nativeEvent]) addInk(toBoard(ev), false);
  };
  const onPointerUp = (e: RPointerEvent<HTMLCanvasElement>) => {
    if (g.current.pointer === e.pointerId) g.current.pointer = null;
  };

  const ARROWS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const s = g.current;
    s.fine = e.shiftKey;
    if (ARROWS.includes(e.key)) {
      e.preventDefault();
      s.keys.add(e.key);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (!e.repeat) endShape();
    }
  };
  const onKeyUp = (e: KeyboardEvent<HTMLDivElement>) => {
    const s = g.current;
    s.fine = e.shiftKey;
    s.keys.delete(e.key);
    if (!ARROWS.some((k) => s.keys.has(k))) s.kbDrawing = false;
  };
  const onBlur = () => {
    g.current.keys.clear();
    g.current.kbDrawing = false;
  };

  const shape = shapes[idx];
  const name = t.names[shape.id];
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const last = scores[scores.length - 1];

  return (
    <div className="flex h-full min-h-[440px] flex-col gap-3 p-3 sm:p-5">
      <div className="flex items-center gap-3">
        <p className="shrink-0 text-sm font-semibold text-gray-900">
          {t.design(idx + 1, shapes.length)} <span className="font-normal text-gray-600">· {name}</span>
        </p>
        <div
          className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-orange-100"
          role="img"
          aria-label={t.timeLeft}
        >
          <div ref={bar} className="h-full origin-left rounded-full bg-[#f97316]" />
        </div>
        <div className="flex shrink-0 items-center gap-1.5" aria-hidden>
          {shapes.map((sh, i) => (
            <span
              key={sh.id}
              className={`flex h-6 min-w-9 items-center justify-center rounded-md px-1 font-mono text-[11px] font-bold ${
                scores[i] === undefined
                  ? i === idx
                    ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-300'
                    : 'bg-gray-100 text-gray-400'
                  : scores[i] >= WIN
                    ? 'bg-[#f97316] text-white'
                    : 'bg-gray-200 text-gray-700'
              }`}
            >
              {scores[i] === undefined ? '–' : scores[i]}
            </span>
          ))}
        </div>
      </div>

      <div
        ref={area}
        tabIndex={0}
        data-autofocus
        role="application"
        aria-roledescription={lang === 'es' ? 'lienzo para calcar' : 'tracing canvas'}
        aria-label={t.area(name)}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onBlur={onBlur}
        className="relative min-h-0 flex-1 overflow-hidden rounded-2xl shadow-inner ring-1 ring-orange-200/70 outline-none focus-visible:ring-2 focus-visible:ring-[#f97316] focus-visible:ring-offset-2"
      >
        <div ref={wrap} className="absolute inset-0">
          <canvas
            ref={canvas}
            className="block h-full w-full cursor-crosshair"
            style={{ touchAction: 'none' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onLostPointerCapture={onPointerUp}
          />
        </div>
        <p className="pointer-events-none absolute right-2 top-2 rounded-full bg-white/85 px-2.5 py-1 font-mono text-xs font-bold text-orange-700 shadow-sm">
          {t.traced(pct)}
        </p>
        {stage !== 'play' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
            <p
              className={`rounded-2xl bg-white/95 px-5 py-3 text-center font-bold text-gray-900 shadow-md ring-1 ring-orange-200 ${
                stage === 'end' ? 'text-xl sm:text-2xl' : 'text-lg'
              }`}
            >
              {stage === 'end' ? (
                t.end(avg, t.verdict(avg))
              ) : (
                <>
                  {name}: <span className={last >= WIN ? 'text-orange-600' : 'text-gray-600'}>{last}%</span>
                </>
              )}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <p className="min-w-0 flex-1 text-xs text-gray-600">
          <span className="pointer-coarse:hidden">{t.keys}</span>
          <span className="hidden pointer-coarse:inline">{t.touch}</span>
          <span className="block text-gray-500">{t.need}</span>
        </p>
        <button
          ref={nextBtn}
          type="button"
          onClick={endShape}
          aria-disabled={stage !== 'play'}
          className="min-h-11 shrink-0 rounded-xl bg-[#0070f3] px-4 text-sm font-semibold text-white transition-transform duration-150 hover:bg-[#0060d0] active:scale-95 aria-disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070f3] focus-visible:ring-offset-2"
        >
          {idx === shapes.length - 1 ? t.finish : t.next}
        </button>
      </div>
      <p aria-live="polite" className="sr-only">
        {live}
      </p>
    </div>
  );
}
