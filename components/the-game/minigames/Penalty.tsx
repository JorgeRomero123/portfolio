'use client';

// Spurs mini-game: "Penalty". Three kicks from the spot; score 2+ to win.
// Each kick: (1) aim — a reticle sweeps across the goal (drag/tap, or ← → to nudge), lock it;
// (2) power — a bar oscillates, lock it. Too soft gets saved, too hard sails over the bar.
// The keeper sways, then guesses a side at the kick, so the corners beat him more often.
// Art is plain navy/white shapes and the text "COYS" only: no crest, no kit, no sponsor.
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as RPointerEvent,
} from 'react';
import type { MiniGameProps } from '../types';

const SHOTS = 3;
const NAVY = '#132257';
const AIM_MAX = 1.15; // goal half-widths; |x| > 1 is outside the posts
const SOFT = 0.35; // power below this: easy save
const OVER = 0.86; // power above this: over the bar

// Scene geometry (SVG viewBox 400 × 300).
const GX = 200; // goal centre
const GW = 90; // goal half width
const GROUND = 168; // goal line
const BAR = 90; // crossbar
const SPOT = { x: 200, y: 262 };
const RET_Y = 128;

type Stage = 'aim' | 'power' | 'flight' | 'result' | 'end';
type Kind = 'goal' | 'saved' | 'post' | 'wide' | 'over';

const T = {
  en: {
    shot: (n: number) => `Kick ${n} of ${SHOTS}`,
    goals: (n: number) => `${n} ${n === 1 ? 'goal' : 'goals'}`,
    aim: 'Aim',
    power: 'Power',
    lockAim: 'Lock aim',
    shoot: 'Shoot!',
    wait: 'Watch…',
    keysAim: 'Drag or tap the goal · ← → to nudge · Space to lock',
    keysPower: 'Stop in the green · Space, click or tap',
    touchAim: 'Drag or tap the goal to aim',
    touchPower: 'Tap to stop in the green',
    soft: 'soft',
    sweet: 'sweet spot',
    over: 'too hard',
    scene: 'Penalty kick seen from behind the ball: goal, keeper and the aiming reticle',
    stageAim: (n: number) => `Kick ${n}. Aim: the reticle is moving across the goal.`,
    stagePower: 'Aim locked. Now the power bar.',
    result: {
      goal: 'GOAL!',
      saved: 'Saved!',
      post: 'Off the post!',
      wide: 'Wide!',
      over: 'Over the bar!',
    } as Record<Kind, string>,
    end: (g: number) => (g >= 2 ? `${g}/${SHOTS} — back of the net!` : `${g}/${SHOTS} — so close.`),
  },
  es: {
    shot: (n: number) => `Tiro ${n} de ${SHOTS}`,
    goals: (n: number) => `${n} ${n === 1 ? 'gol' : 'goles'}`,
    aim: 'Apunta',
    power: 'Potencia',
    lockAim: 'Fijar mira',
    shoot: '¡Dispara!',
    wait: 'Mira…',
    keysAim: 'Arrastra o toca la portería · ← → para ajustar · Espacio para fijar',
    keysPower: 'Detente en lo verde · Espacio, clic o toca',
    touchAim: 'Arrastra o toca la portería para apuntar',
    touchPower: 'Toca para detenerte en lo verde',
    soft: 'suave',
    sweet: 'punto ideal',
    over: 'muy fuerte',
    scene: 'Penal visto desde atrás del balón: portería, portero y la mira',
    stageAim: (n: number) => `Tiro ${n}. Apunta: la mira se mueve por la portería.`,
    stagePower: 'Mira fijada. Ahora la barra de potencia.',
    result: {
      goal: '¡GOL!',
      saved: '¡Atajada!',
      post: '¡Al poste!',
      wide: '¡Desviado!',
      over: '¡Por encima del travesaño!',
    } as Record<Kind, string>,
    end: (g: number) => (g >= 2 ? `${g}/${SHOTS} — ¡adentro!` : `${g}/${SHOTS} — casi.`),
  },
};

interface Outcome {
  kind: Kind;
  x: number; // goal half-widths, at the goal plane
  h: number; // 0 ground … 1 crossbar
  dive: -1 | 0 | 1;
  quality: number; // 0–1, how close to a corner
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const ease = (t: number) => 1 - (1 - t) * (1 - t);

function resolveShot(aim: number, p: number): Outcome {
  const over = p > OVER;
  const soft = p < SOFT;
  const scatter = 0.05 + 0.08 * clamp((p - 0.6) / 0.26, 0, 1);
  const x = aim + (Math.random() * 2 - 1) * scatter;
  const h = over ? 1.3 : soft ? 0.04 : 0.06 + clamp((p - SOFT) / (OVER - SOFT), 0, 1) * 0.84;
  const side: -1 | 1 = Math.abs(x) < 0.05 ? (Math.random() < 0.5 ? -1 : 1) : x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  let dive: -1 | 0 | 1;
  if (soft)
    dive = ax < 0.4 ? 0 : side; // a slow ball gets read perfectly
  else {
    const r = Math.random();
    dive = r < 0.25 ? 0 : r < 0.67 ? side : (-side as -1 | 1);
  }
  let kind: Kind;
  if (over) kind = 'over';
  else if (ax > 1.06) kind = 'wide';
  else if (ax > 1.0) kind = 'post';
  else {
    const reach = 0.76 + 0.12 * (1 - h);
    const saved = soft ? Math.random() < 0.9 : dive === 0 ? ax < 0.4 : dive === side && ax <= reach;
    kind = saved ? 'saved' : 'goal';
  }
  return { kind, x, h, dive, quality: clamp((ax - 0.3) / 0.6, 0, 1) };
}

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
    (kind: 'whoosh' | 'goal' | 'miss' | 'tick') => {
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
        const tone = (f0: number, f1: number, at: number, dur: number, type: OscillatorType, vol: number) => {
          const o = c.createOscillator();
          const g = c.createGain();
          const t0 = c.currentTime + at;
          o.type = type;
          o.frequency.setValueAtTime(f0, t0);
          o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
          g.gain.setValueAtTime(0.0001, t0);
          g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
          o.connect(g).connect(c.destination);
          o.start(t0);
          o.stop(t0 + dur + 0.02);
        };
        if (kind === 'tick') tone(660, 660, 0, 0.06, 'triangle', 0.05);
        else if (kind === 'whoosh') tone(900, 180, 0, 0.28, 'sawtooth', 0.025);
        else if (kind === 'goal') {
          tone(523, 523, 0, 0.14, 'triangle', 0.08);
          tone(659, 659, 0.1, 0.14, 'triangle', 0.08);
          tone(784, 1046, 0.2, 0.3, 'triangle', 0.08);
        } else tone(260, 130, 0, 0.3, 'triangle', 0.07);
      } catch {
        // no audio available
      }
    },
    [soundOn],
  );
}

interface Seg {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  r0: number;
  r1: number;
  o0: number;
  o1: number;
  dur: number;
  arc: number;
}

export default function Penalty({ lang, reducedMotion, soundOn, onFinish }: MiniGameProps) {
  const t = T[lang];
  const play = useSynth(soundOn);
  const [stage, setStageState] = useState<Stage>('aim');
  const [results, setResults] = useState<Outcome[]>([]);
  const [banner, setBanner] = useState<Kind | null>(null);
  const [fx, setFx] = useState(0); // bump to replay net ripple / cheer / shake
  const [announce, setAnnounce] = useState(() => T[lang].stageAim(1));

  const svg = useRef<SVGSVGElement>(null);
  const sceneG = useRef<SVGGElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const reticle = useRef<SVGGElement>(null);
  const keeper = useRef<SVGGElement>(null);
  const ball = useRef<SVGCircleElement>(null);
  const ballShadow = useRef<SVGEllipseElement>(null);
  const powerMark = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const finished = useRef(false);
  const resultsRef = useRef<Outcome[]>([]);
  const rm = useRef(reducedMotion);
  useEffect(() => {
    rm.current = reducedMotion;
  }, [reducedMotion]);

  // Mutable game state driven by one rAF loop (no re-render per frame).
  const g = useRef({
    stage: 'aim' as Stage,
    shot: 0,
    aim: -0.6,
    aimDir: 1,
    manual: false,
    dragging: false,
    power: 0,
    powerDir: 1,
    keeperX: 0,
    time: 0,
    // flight
    segs: [] as Seg[],
    segIdx: 0,
    segT: 0,
    diveT: 0,
    diveFrom: 0,
    diveTo: 0,
    diveRot: 0,
    diveLift: 0,
    onLanded: null as null | (() => void),
  });

  const setStage = useCallback((s: Stage) => {
    g.current.stage = s;
    setStageState(s);
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  useEffect(() => {
    const focus = () => button.current?.focus({ preventScroll: true });
    const id = requestAnimationFrame(focus);
    // The host may still hand initial focus to its own Skip button right after a lazy mount; reclaim it once.
    const retry = window.setTimeout(() => {
      const el = document.activeElement;
      if (!el || el === document.body || el.matches('[data-testid="skip-minigame"]')) focus();
    }, 400);
    const ts = timers.current;
    return () => {
      cancelAnimationFrame(id);
      window.clearTimeout(retry);
      ts.forEach((x) => window.clearTimeout(x));
    };
  }, []);

  // The loop.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const s = g.current;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      s.time += dt;
      const slow = rm.current ? 0.65 : 1;
      const faster = 1 + s.shot * 0.12;

      if (s.stage === 'aim' && !s.manual) {
        let a = s.aim + s.aimDir * 1.15 * slow * faster * dt;
        if (a > AIM_MAX) {
          a = AIM_MAX;
          s.aimDir = -1;
        } else if (a < -AIM_MAX) {
          a = -AIM_MAX;
          s.aimDir = 1;
        }
        s.aim = a;
      }
      if (s.stage === 'power') {
        let p = s.power + s.powerDir * 1.05 * slow * faster * dt;
        if (p > 1) {
          p = 1;
          s.powerDir = -1;
        } else if (p < 0) {
          p = 0;
          s.powerDir = 1;
        }
        s.power = p;
      }
      if (s.stage === 'aim' || s.stage === 'power') {
        s.keeperX = rm.current ? 0 : Math.sin(s.time * 1.9) * 0.2;
        keeper.current?.setAttribute('transform', `translate(${GX + s.keeperX * GW} ${GROUND})`);
      }
      reticle.current?.setAttribute('transform', `translate(${GX + s.aim * GW} ${RET_Y})`);
      if (powerMark.current) powerMark.current.style.left = `${s.power * 100}%`;

      if (s.stage === 'flight' && s.segs.length) {
        // Keeper dive (instant pose in reduced motion).
        s.diveT = rm.current ? 1 : Math.min(1, s.diveT + dt / 0.42);
        const e = ease(s.diveT);
        const kx = s.diveFrom + (s.diveTo - s.diveFrom) * e;
        const lift = Math.sin(Math.PI * Math.min(1, s.diveT)) * s.diveLift;
        keeper.current?.setAttribute(
          'transform',
          `translate(${GX + kx * GW} ${GROUND - lift - (rm.current ? s.diveLift * 0.4 : 0)}) rotate(${s.diveRot * e} 0 -22)`,
        );
        // Ball segments.
        const seg = s.segs[s.segIdx];
        s.segT = Math.min(1, s.segT + dt / seg.dur);
        const k = s.segIdx === 0 ? s.segT : ease(s.segT);
        const x = seg.x0 + (seg.x1 - seg.x0) * k;
        const y = seg.y0 + (seg.y1 - seg.y0) * k - Math.sin(Math.PI * k) * seg.arc;
        const r = seg.r0 + (seg.r1 - seg.r0) * k;
        const o = seg.o0 + (seg.o1 - seg.o0) * k;
        if (ball.current) {
          ball.current.setAttribute('cx', x.toFixed(1));
          ball.current.setAttribute('cy', y.toFixed(1));
          ball.current.setAttribute('r', r.toFixed(2));
          ball.current.style.opacity = String(o);
        }
        if (ballShadow.current) ballShadow.current.style.opacity = '0';
        if (s.segT >= 1) {
          if (s.segIdx === 0 && s.onLanded) {
            const cb = s.onLanded;
            s.onLanded = null;
            cb();
          }
          if (s.segIdx < s.segs.length - 1) {
            s.segIdx += 1;
            s.segT = 0;
          } else s.segs = [];
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const resetBall = useCallback(() => {
    if (ball.current) {
      ball.current.setAttribute('cx', String(SPOT.x));
      ball.current.setAttribute('cy', String(SPOT.y - 8));
      ball.current.setAttribute('r', '9');
      ball.current.style.opacity = '1';
    }
    if (ballShadow.current) ballShadow.current.style.opacity = '1';
  }, []);

  const kick = useCallback(() => {
    const s = g.current;
    const out = resolveShot(s.aim, s.power);
    const reduced = rm.current;
    const sx = GX + out.x * GW;
    const sy = out.kind === 'over' ? 62 : GROUND - 6 - out.h * 70;
    const dir = out.x < 0 ? -1 : 1;
    const first: Seg = {
      x0: SPOT.x,
      y0: SPOT.y - 8,
      x1: sx,
      y1: sy,
      r0: 9,
      r1: 4.6,
      o0: 1,
      o1: 1,
      dur: reduced ? 0.35 : s.power < SOFT ? 0.95 : 0.62,
      arc: reduced ? 0 : 14,
    };
    let second: Seg;
    const base = { x0: sx, y0: sy, r0: 4.6, dur: reduced ? 0.2 : 0.4, arc: 0 };
    if (out.kind === 'goal') second = { ...base, x1: sx - dir * 6, y1: sy - 4, r1: 4, o0: 1, o1: 1 };
    else if (out.kind === 'saved')
      second = {
        ...base,
        x1: sx + (out.dive === 0 ? dir * 30 : out.dive * 46),
        y1: 212,
        r1: 6,
        o0: 1,
        o1: 1,
        arc: reduced ? 0 : 20,
      };
    else if (out.kind === 'post')
      second = {
        ...base,
        x1: sx + dir * 34,
        y1: 226,
        r1: 6,
        o0: 1,
        o1: 0.9,
        arc: reduced ? 0 : 16,
      };
    else if (out.kind === 'over') second = { ...base, x1: sx + dir * 10, y1: 24, r1: 3, o0: 1, o1: 0 };
    else
      second = {
        ...base,
        x1: sx + dir * 40,
        y1: sy - 10,
        r1: 3.5,
        o0: 1,
        o1: 0,
      };
    s.segs = [first, second];
    s.segIdx = 0;
    s.segT = 0;

    // Keeper pose: dive shift/rotation; on saves, line the hands up with the ball.
    s.diveFrom = s.keeperX;
    s.diveT = 0;
    if (out.dive === 0) {
      s.diveTo = out.kind === 'saved' ? clamp(out.x * 0.6, -0.25, 0.25) : 0;
      s.diveRot = 0;
      s.diveLift = 8 + out.h * 18;
    } else {
      const ax = Math.abs(out.x);
      const shift = out.kind === 'saved' && out.dive === dir ? clamp(ax - 0.5, 0.08, 0.4) : 0.32;
      s.diveTo = out.dive * shift;
      s.diveRot = out.dive * (84 - Math.min(1, out.h) * 34);
      s.diveLift = 6 + Math.min(1, out.h) * 26;
    }

    play('whoosh');
    setStage('flight');
    setAnnounce('');
    s.onLanded = () => {
      setStage('result');
      setBanner(out.kind);
      setAnnounce(T[lang].result[out.kind]);
      if (out.kind === 'goal' || out.kind === 'post' || out.kind === 'saved') setFx((n) => n + 1);
      if (out.kind === 'goal' && !rm.current)
        sceneG.current?.animate?.(
          [
            { transform: 'translate(0,0)' },
            { transform: 'translate(-3px,1px)' },
            { transform: 'translate(3px,-1px)' },
            { transform: 'translate(-2px,0)' },
            { transform: 'translate(0,0)' },
          ],
          { duration: 300 },
        );
      play(out.kind === 'goal' ? 'goal' : 'miss');
      const next = [...resultsRef.current, out];
      resultsRef.current = next;
      setResults(next);
      const done = next.length >= SHOTS;
      later(() => {
        setBanner(null);
        if (done) {
          const goals = next.filter((r) => r.kind === 'goal').length;
          setStage('end');
          setAnnounce(T[lang].end(goals));
          later(() => {
            if (finished.current) return;
            finished.current = true;
            const bonus = next.filter((r) => r.kind === 'goal').reduce((a, r) => a + r.quality * (16 / SHOTS), 0);
            onFinish({
              won: goals >= 2,
              score: Math.round(clamp(goals * 28 + bonus, 0, 100)),
            });
          }, 1500);
          return;
        }
        s.shot = next.length;
        s.manual = false;
        s.aim = Math.random() < 0.5 ? -0.8 : 0.8;
        s.aimDir = s.aim < 0 ? 1 : -1;
        s.power = 0;
        s.powerDir = 1;
        resetBall();
        setStage('aim');
        setAnnounce(T[lang].stageAim(next.length + 1));
      }, 1400);
    };
  }, [lang, later, onFinish, play, resetBall, setStage]);

  const lock = useCallback(() => {
    const s = g.current;
    if (s.stage === 'aim') {
      s.dragging = false;
      play('tick');
      s.power = 0;
      s.powerDir = 1;
      setStage('power');
      setAnnounce(T[lang].stagePower);
    } else if (s.stage === 'power') kick();
  }, [kick, lang, play, setStage]);

  const aimFromPointer = (e: RPointerEvent<SVGSVGElement>) => {
    const el = svg.current;
    const m = el?.getScreenCTM();
    if (!el || !m) return;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    g.current.aim = clamp((pt.x - GX) / GW, -AIM_MAX, AIM_MAX);
  };

  const onPointerDown = (e: RPointerEvent<SVGSVGElement>) => {
    e.preventDefault();
    const s = g.current;
    if (s.stage === 'aim') {
      s.manual = true;
      s.dragging = true;
      aimFromPointer(e);
      e.currentTarget.setPointerCapture(e.pointerId);
    } else if (s.stage === 'power') lock();
  };
  const onPointerMove = (e: RPointerEvent<SVGSVGElement>) => {
    if (g.current.dragging && g.current.stage === 'aim') aimFromPointer(e);
  };
  const onPointerUp = () => {
    if (g.current.dragging && g.current.stage === 'aim') lock();
    g.current.dragging = false;
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const s = g.current;
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && s.stage === 'aim') {
      e.preventDefault();
      s.manual = true;
      s.aim = clamp(s.aim + (e.key === 'ArrowLeft' ? -0.08 : 0.08), -AIM_MAX, AIM_MAX);
      return;
    }
    if ((e.key === ' ' || e.key === 'Enter') && e.target !== button.current && !e.repeat) {
      e.preventDefault();
      lock();
    }
  };

  const goals = results.filter((r) => r.kind === 'goal').length;
  const shotNo = Math.min(SHOTS, results.length + (stage === 'result' || stage === 'end' ? 0 : 1));
  const active = stage === 'aim' || stage === 'power';
  const cheer = banner === 'goal';

  // Crowd: three rows of little heads in navy/white.
  const crowd: { x: number; y: number; c: string; d: number }[] = [];
  for (let row = 0; row < 3; row++)
    for (let i = -22; i < 48; i++) {
      const x = 6 + i * 15.4 + (row % 2) * 7;
      crowd.push({
        x,
        y: 22 + row * 20,
        c:
          (((i * 7 + row * 3) % 5) + 5) % 5 === 0 ? '#ffffff' : (((i + row) % 3) + 3) % 3 === 0 ? '#c9d2ea' : '#8f9cc4',
        d: ((((i * 37 + row * 11) % 10) + 10) % 10) / 20,
      });
    }

  return (
    <div className="flex h-full min-h-[440px] flex-col gap-3 p-3 sm:p-5" onKeyDown={onKeyDown}>
      <style>{`
        @keyframes pk-ripple { 0%{transform:scale(1)} 30%{transform:scale(1.035,1.05)} 60%{transform:scale(.985)} 100%{transform:scale(1)} }
        @keyframes pk-jump { 0%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
        @keyframes pk-pop { 0%{transform:scale(.6);opacity:0} 60%{transform:scale(1.08);opacity:1} 100%{transform:scale(1);opacity:1} }
        .pk-ripple{transform-box:fill-box;transform-origin:50% 50%;animation:pk-ripple .6s ease-out}
        .pk-jump circle{animation:pk-jump .45s ease-in-out 3}
        .pk-pop{transform-box:fill-box;transform-origin:50% 50%;animation:pk-pop .35s ease-out}
      `}</style>

      <div className="flex items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-2" aria-hidden>
          {Array.from({ length: SHOTS }, (_, i) => {
            const r = results[i];
            return (
              <span
                key={i}
                className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-[11px] font-bold ${
                  !r
                    ? 'border-gray-200 text-gray-300'
                    : r.kind === 'goal'
                      ? 'border-[#132257] bg-[#132257] text-white'
                      : 'border-rose-300 bg-rose-50 text-rose-500'
                }`}
              >
                {!r ? i + 1 : r.kind === 'goal' ? '✓' : '✕'}
              </span>
            );
          })}
        </div>
        <p className="font-semibold text-gray-900">
          {t.shot(shotNo)} · <span className="text-[#132257]">{t.goals(goals)}</span>
        </p>
      </div>

      <div className="relative min-h-[200px] flex-1 overflow-hidden rounded-2xl bg-[#e9edf6] ring-1 ring-gray-200">
        <svg
          ref={svg}
          viewBox="40 14 320 262"
          preserveAspectRatio="xMidYMid meet"
          className={`absolute inset-0 h-full w-full select-none ${active ? 'cursor-crosshair' : ''}`}
          style={{ touchAction: 'none', overflow: 'visible' }}
          role="img"
          aria-label={t.scene}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (g.current.dragging = false)}
        >
          <defs>
            <pattern id="pk-net" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <path d="M0 0H8M0 0V8" stroke="#94a3b8" strokeWidth="0.7" fill="none" />
            </pattern>
          </defs>
          <g ref={sceneG}>
            {/* Stands: stepped low-poly tiers */}
            <rect x="-500" y="-400" width="1400" height="505" fill={NAVY} />
            <polygon points="-500,0 900,0 900,10 -500,16" fill="#1b2d6b" />
            <polygon points="-500,38 900,34 900,40 -500,44" fill="#0e1a45" />
            <polygon points="-500,58 900,54 900,60 -500,64" fill="#0e1a45" />
            <g key={`crowd-${fx}`} className={cheer && !reducedMotion ? 'pk-jump' : undefined}>
              {crowd.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="4" fill={p.c} style={{ animationDelay: `${p.d}s` }} />
              ))}
            </g>
            {/* COYS banners */}
            <g transform="rotate(-3 70 30)">
              <rect x="30" y="20" width="80" height="22" rx="2" fill="#ffffff" />
              <text x="70" y="36.5" textAnchor="middle" fontSize="15" fontWeight="800" fill={NAVY} letterSpacing="3">
                COYS
              </text>
            </g>
            <g transform="rotate(2 330 50)">
              <rect x="292" y="40" width="76" height="20" rx="2" fill={NAVY} stroke="#ffffff" strokeWidth="2" />
              <text x="330" y="55" textAnchor="middle" fontSize="13" fontWeight="800" fill="#ffffff" letterSpacing="3">
                COYS
              </text>
            </g>
            {/* Hoarding (plain) */}
            <rect x="-500" y="84" width="1400" height="14" fill="#ffffff" />
            <rect x="-500" y="84" width="1400" height="3" fill={NAVY} />
            {/* Pitch with perspective stripes */}
            <rect x="-500" y="98" width="1400" height="600" fill="#7cc47f" />
            <polygon points="-40,98 60,98 -40,190" fill="#86cc88" />
            <polygon points="140,98 260,98 330,600 70,600" fill="#86cc88" />
            <polygon points="340,98 440,98 440,190" fill="#86cc88" />
            <polygon points="-500,98 900,98 900,104 -500,104" fill="#6fb872" />
            {/* Lines: goal line, six-yard box, penalty spot */}
            <line x1="-500" y1={GROUND} x2="900" y2={GROUND} stroke="#fff" strokeWidth="2" />
            <polyline points={`70,${GROUND} 58,196 342,196 330,${GROUND}`} fill="none" stroke="#fff" strokeWidth="2" />
            <polyline
              points={`-10,${GROUND} -40,250 440,250 410,${GROUND}`}
              fill="none"
              stroke="#fff"
              strokeWidth="2"
            />
            <ellipse cx={SPOT.x} cy={SPOT.y} rx="5" ry="2.2" fill="#fff" />

            {/* Goal: net (back), posts, bar */}
            <g key={`net-${fx}`} className={banner === 'goal' ? 'pk-ripple' : undefined}>
              <polygon
                points={`${GX - GW},${BAR} ${GX + GW},${BAR} ${GX + GW - 14},${BAR + 12} ${GX + GW - 14},${GROUND - 10} ${GX - GW + 14},${GROUND - 10} ${GX - GW + 14},${BAR + 12}`}
                fill="#f8fafc"
                opacity="0.55"
              />
              <polygon
                points={`${GX - GW},${BAR} ${GX + GW},${BAR} ${GX + GW},${GROUND} ${GX - GW},${GROUND}`}
                fill="url(#pk-net)"
              />
              <polyline
                points={`${GX - GW},${BAR} ${GX - GW + 14},${BAR + 12} ${GX - GW + 14},${GROUND - 10} ${GX - GW},${GROUND}`}
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="1.2"
              />
              <polyline
                points={`${GX + GW},${BAR} ${GX + GW - 14},${BAR + 12} ${GX + GW - 14},${GROUND - 10} ${GX + GW},${GROUND}`}
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="1.2"
              />
              <line
                x1={GX - GW + 14}
                y1={BAR + 12}
                x2={GX + GW - 14}
                y2={BAR + 12}
                stroke="#cbd5e1"
                strokeWidth="1.2"
              />
            </g>
            <rect
              x={GX - GW - 3}
              y={BAR - 3}
              width="6"
              height={GROUND - BAR + 3}
              fill="#fff"
              stroke="#cbd5e1"
              strokeWidth="0.6"
            />
            <rect
              x={GX + GW - 3}
              y={BAR - 3}
              width="6"
              height={GROUND - BAR + 3}
              fill="#fff"
              stroke="#cbd5e1"
              strokeWidth="0.6"
            />
            <rect
              x={GX - GW - 3}
              y={BAR - 3}
              width={GW * 2 + 6}
              height="6"
              fill="#fff"
              stroke="#cbd5e1"
              strokeWidth="0.6"
            />

            {/* Keeper (plain colours, origin at the feet) */}
            <g ref={keeper} transform={`translate(${GX} ${GROUND})`}>
              <ellipse cx="0" cy="1" rx="13" ry="2.5" fill="#000" opacity="0.15" />
              <polygon points="-7,0 -3,-18 0,-18 -3,0" fill="#1f2937" />
              <polygon points="7,0 3,-18 0,-18 3,0" fill="#1f2937" />
              <polygon points="-8,-18 8,-18 7,-26 -7,-26" fill="#374151" />
              <polygon points="-9,-26 9,-26 11,-44 0,-47 -11,-44" fill="#f59e0b" />
              <polygon points="-11,-44 -22,-52 -25,-48 -12,-38" fill="#f59e0b" />
              <polygon points="11,-44 22,-52 25,-48 12,-38" fill="#f59e0b" />
              <polygon points="-22,-52 -28,-56 -30,-50 -25,-48" fill="#ffffff" stroke="#9ca3af" strokeWidth="0.6" />
              <polygon points="22,-52 28,-56 30,-50 25,-48" fill="#ffffff" stroke="#9ca3af" strokeWidth="0.6" />
              <polygon points="-5,-47 5,-47 6,-55 0,-59 -6,-55" fill="#d6a47a" />
              <polygon points="-6,-55 0,-59 6,-55 5,-58 0,-61 -5,-58" fill="#3f2d20" />
            </g>

            {/* Reticle */}
            <g
              ref={reticle}
              transform={`translate(${GX - 0.6 * GW} ${RET_Y})`}
              opacity={active ? 1 : 0}
              style={{ transition: 'opacity 200ms' }}
            >
              <circle r="11" fill="none" stroke="#ffffff" strokeWidth="4" opacity="0.8" />
              <circle r="11" fill="none" stroke={stage === 'power' ? '#0070f3' : NAVY} strokeWidth="2" />
              <path d="M-16 0H-6M6 0H16M0 -16V-6M0 6V16" stroke={NAVY} strokeWidth="2" strokeLinecap="round" />
              <circle r="1.8" fill={NAVY} />
            </g>

            {/* Ball */}
            <ellipse ref={ballShadow} cx={SPOT.x} cy={SPOT.y + 1} rx="9" ry="2.5" fill="#000" opacity="0.18" />
            <circle ref={ball} cx={SPOT.x} cy={SPOT.y - 8} r="9" fill="#ffffff" stroke={NAVY} strokeWidth="1.6" />

            {/* Result banner */}
            {banner && (
              <g key={`b-${results.length}`} className={reducedMotion ? undefined : 'pk-pop'}>
                <rect
                  x="110"
                  y="200"
                  width="180"
                  height="34"
                  rx="8"
                  fill={banner === 'goal' ? NAVY : '#ffffff'}
                  stroke={NAVY}
                  strokeWidth="2"
                />
                <text
                  x="200"
                  y="223"
                  textAnchor="middle"
                  fontSize={t.result[banner].length > 14 ? 13 : 18}
                  fontWeight="800"
                  fill={banner === 'goal' ? '#ffffff' : NAVY}
                >
                  {t.result[banner]}
                </text>
              </g>
            )}
          </g>
        </svg>

        {stage === 'end' && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 p-4">
            <p className="rounded-2xl bg-white px-6 py-4 text-center text-xl font-bold text-[#132257] shadow-md ring-1 ring-gray-200">
              {t.end(goals)}
            </p>
          </div>
        )}
      </div>

      {/* Power bar */}
      <div
        className={`transition-opacity duration-300 ${stage === 'power' ? 'opacity-100' : 'opacity-50'}`}
        aria-hidden
      >
        <div className="mb-1 flex justify-between text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          <span>{t.power}</span>
          <span className="text-emerald-700">{t.sweet}</span>
        </div>
        <div className="relative h-5 overflow-hidden rounded-full bg-gray-100 ring-1 ring-gray-200">
          <div className="absolute inset-y-0 left-0 bg-amber-100" style={{ width: `${SOFT * 100}%` }} />
          <div
            className="absolute inset-y-0 bg-emerald-400/70"
            style={{ left: `${SOFT * 100}%`, width: `${(OVER - SOFT) * 100}%` }}
          />
          <div className="absolute inset-y-0 right-0 bg-rose-300" style={{ width: `${(1 - OVER) * 100}%` }} />
          <div
            ref={powerMark}
            className="absolute inset-y-[-2px] w-1.5 -translate-x-1/2 rounded-full bg-[#132257] shadow"
            style={{ left: '0%' }}
          />
        </div>
        <div className="mt-0.5 flex text-[10px] text-gray-500">
          <span style={{ width: `${SOFT * 100}%` }}>{t.soft}</span>
          <span className="flex-1" />
          <span>{t.over}</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
        <p className="order-2 text-center text-xs text-gray-500 sm:order-1 sm:text-left">
          <span className="pointer-coarse:hidden">{stage === 'power' ? t.keysPower : t.keysAim}</span>
          <span className="hidden pointer-coarse:inline">{stage === 'power' ? t.touchPower : t.touchAim}</span>
        </p>
        <button
          ref={button}
          data-autofocus
          type="button"
          onClick={lock}
          aria-disabled={!active}
          className="order-1 min-h-12 w-full rounded-xl bg-[#132257] px-6 text-base font-semibold text-white transition-transform duration-150 hover:bg-[#1c2f72] active:scale-95 aria-disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070f3] focus-visible:ring-offset-2 sm:order-2 sm:w-auto sm:min-w-40"
        >
          {stage === 'aim' ? t.lockAim : stage === 'power' ? t.shoot : t.wait}
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}
