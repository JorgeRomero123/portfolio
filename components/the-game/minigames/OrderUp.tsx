'use client';

// "Order up!" (kitchen): ingredients drop from the top; slide the pan left/right to catch the NEXT
// ingredient on the order ticket, in order. A wrong catch is an "Oops" (−2 s); letting things fall
// is free. Finish an order → bell + the finished dish. 3 orders (4, 5, 5 steps) in 40 s.
// Win = at least 2 orders; the score adds speed (time left) and a clean-hands bonus.
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { MiniGameProps } from '../types';
import { Bell, DishArt, INGS, IngIcon, IngSvg, Pan, type Dish, type Ing } from './orderup/art';

const ACCENT = '#dc2626';
const TOTAL = 40; // seconds
const PENALTY = 2; // seconds lost on a wrong catch
const WIN = 2;
const H = 440; // world height; world width adapts to the container (W_MIN–W_MAX)
const W_MIN = 300;
const W_MAX = 600; // on wide screens the field is capped (centred) so the pan doesn't look tiny
const PAN_Y = 364;
const CATCH_Y = PAN_Y - 8;
const CATCH_HW = 48; // half-width of the catch zone
const PAN_EDGE = 52;
const PAN_EDGE_R = 84; // the handle sticks out to the right
const INTRO = 1.1;
const BELL = 1.5;
const END_HOLD = 1600; // ms the end state shows before onFinish

const ORDERS: { dish: Dish; steps: Ing[] }[] = [
  { dish: 'eggs', steps: ['oil', 'onion', 'tomato', 'egg'] },
  { dish: 'chilaquiles', steps: ['oil', 'tortilla', 'tomato', 'chile', 'cheese'] },
  { dish: 'quesadilla', steps: ['tortilla', 'cheese', 'onion', 'chile', 'cilantro'] },
];

const T = {
  en: {
    area: 'Stove with a pan. Ingredients fall from the top. Move the pan with the Left and Right arrow keys, or drag, to catch the next ingredient on the ticket.',
    ing: {
      oil: 'oil',
      onion: 'onion',
      tomato: 'tomato',
      chile: 'chile',
      cilantro: 'cilantro',
      egg: 'egg',
      tortilla: 'tortilla',
      cheese: 'cheese',
    } as Record<Ing, string>,
    dish: { eggs: 'Mexican-style eggs', chilaquiles: 'Chilaquiles', quesadilla: 'Quesadilla' } as Record<Dish, string>,
    order: (n: number) => `Order ${n}/${ORDERS.length}`,
    next: 'Next',
    ticket: 'Order ticket',
    time: 'Time left',
    served: 'Orders served',
    keys: 'move the pan',
    drag: 'or drag',
    touch: 'Drag to move the pan',
    ready: 'Catch them in order!',
    oops: 'Oops!',
    orderUp: 'Order up!',
    sStart: (dish: string, ing: string) => `Order: ${dish}. First catch the ${ing}.`,
    sGood: (ing: string, next: string) => `${ing} in! Next: ${next}.`,
    sBad: (ing: string, need: string) => `Oops, that was ${ing}. Minus ${PENALTY} seconds. Still need ${need}.`,
    sBell: (dish: string) => `Order up! ${dish} is ready.`,
    sNextOrder: (dish: string, ing: string) => `Next order: ${dish}. Start with the ${ing}.`,
    win: (n: number) => `${n}/${ORDERS.length} orders — the kitchen is on fire!`,
    lose: (n: number) => `${n}/${ORDERS.length} ${n === 1 ? 'order' : 'orders'} — the rush won this time`,
  },
  es: {
    area: 'Estufa con un sartén. Caen ingredientes desde arriba. Mueve el sartén con las flechas izquierda y derecha, o arrastrando, para atrapar el siguiente ingrediente de la comanda.',
    ing: {
      oil: 'aceite',
      onion: 'cebolla',
      tomato: 'jitomate',
      chile: 'chile',
      cilantro: 'cilantro',
      egg: 'huevo',
      tortilla: 'tortilla',
      cheese: 'queso',
    } as Record<Ing, string>,
    dish: { eggs: 'Huevos a la mexicana', chilaquiles: 'Chilaquiles', quesadilla: 'Quesadilla' } as Record<Dish, string>,
    order: (n: number) => `Orden ${n}/${ORDERS.length}`,
    next: 'Sigue',
    ticket: 'Comanda',
    time: 'Tiempo restante',
    served: 'Órdenes listas',
    keys: 'mueve el sartén',
    drag: 'o arrastra',
    touch: 'Arrastra para mover el sartén',
    ready: '¡Atrápalos en orden!',
    oops: '¡Ups!',
    orderUp: '¡Orden lista!',
    sStart: (dish: string, ing: string) => `Orden: ${dish}. Primero atrapa: ${ing}.`,
    sGood: (ing: string, next: string) => `¡${cap(ing)} adentro! Sigue: ${next}.`,
    sBad: (ing: string, need: string) => `Ups, eso era ${ing}. Menos ${PENALTY} segundos. Todavía falta: ${need}.`,
    sBell: (dish: string) => `¡Orden lista! ${dish}.`,
    sNextOrder: (dish: string, ing: string) => `Siguiente orden: ${dish}. Empieza con: ${ing}.`,
    win: (n: number) => `${n}/${ORDERS.length} órdenes — ¡la cocina está que arde!`,
    lose: (n: number) => `${n}/${ORDERS.length} ${n === 1 ? 'orden' : 'órdenes'} — esta vez ganó la hora pico`,
  },
};

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

type Phase = 'intro' | 'play' | 'bell' | 'end';
interface Item {
  id: number;
  ing: Ing;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  dead: boolean; // bounced off / cleared: fades out, can't be caught
  op: number;
}
interface Fx {
  id: number;
  x: number;
  y: number;
  age: number;
  kind: 'puff' | 'good' | 'bad';
  text?: string;
}
interface Snap {
  W: number;
  panX: number;
  shake: number;
  time: number;
  phase: Phase;
  phaseT: number;
  order: number;
  step: number;
  served: number;
  timeLeft: number;
  contents: Ing[];
  items: Item[];
  fx: Fx[];
  touched: boolean;
}

const initialSnap = (): Snap => ({
  W: 400,
  panX: 200,
  shake: 0,
  time: 0,
  phase: 'intro',
  phaseT: INTRO,
  order: 0,
  step: 0,
  served: 0,
  timeLeft: TOTAL,
  contents: [],
  items: [],
  fx: [],
  touched: false,
});

export default function OrderUp({ lang, reducedMotion, soundOn, onFinish }: MiniGameProps) {
  const t = T[lang];
  const [snap, setSnap] = useState<Snap>(initialSnap);
  const [say, setSay] = useState('');
  const [maxW, setMaxW] = useState<number | undefined>(undefined);
  const [result, setResult] = useState<{ won: boolean; text: string } | null>(null);

  const sim = useRef({
    ...initialSnap(),
    keyL: false,
    keyR: false,
    hold: 0,
    target: null as number | null,
    dragging: false,
    spawnIn: 0.4,
    sinceNeed: 0,
    lastX: 200,
    nextId: 1,
    mistakes: 0,
  });
  const area = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const audio = useRef<AudioContext | null>(null);
  const timers = useRef<number[]>([]);
  const finished = useRef(false);
  const cfg = useRef({ lang, reducedMotion, soundOn, onFinish });
  useEffect(() => {
    cfg.current = { lang, reducedMotion, soundOn, onFinish };
  }, [lang, reducedMotion, soundOn, onFinish]);

  // Focus the play area after the host dialog places its own focus; re-check once in case the
  // dialog moved focus to its Skip button a little later.
  useEffect(() => {
    const raf = requestAnimationFrame(() => area.current?.focus({ preventScroll: true }));
    const id = window.setTimeout(() => {
      const a = document.activeElement;
      if (!a || a === document.body || (a as HTMLElement).dataset?.testid === 'skip-minigame')
        area.current?.focus({ preventScroll: true });
    }, 400);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(id);
    };
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

  // World width follows the container's aspect ratio so the stove spans the play area.
  useEffect(() => {
    const el = area.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      if (r.height < 10) return;
      const W = Math.round(clamp((H * r.width) / r.height, W_MIN, W_MAX));
      // Cap the field's width to the widest world (its height doesn't depend on its width).
      setMaxW(Math.round((r.height * W_MAX) / H));
      const s = sim.current;
      if (s.W !== W) {
        s.panX = (s.panX / s.W) * W;
        s.lastX = W / 2;
        s.W = W;
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const ensureAudio = useCallback(() => {
    if (!cfg.current.soundOn) return;
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
  }, []);

  // Tiny synth: 'good' = plop + sizzle, 'bad' = low buzz, 'bell' = ding, 'end' = arpeggio.
  const sound = useCallback((kind: 'good' | 'bad' | 'bell' | 'win' | 'lose') => {
    const ctx = audio.current;
    if (!cfg.current.soundOn || !ctx) return;
    try {
      const tone = (f: number, at: number, dur: number, type: OscillatorType, gain: number, f2?: number) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(f, at);
        if (f2) o.frequency.exponentialRampToValueAtTime(f2, at + dur);
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(gain, at + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
        o.connect(g).connect(ctx.destination);
        o.start(at);
        o.stop(at + dur + 0.02);
      };
      const now = ctx.currentTime;
      if (kind === 'good') {
        tone(620, now, 0.12, 'sine', 0.09, 260);
        const len = Math.floor(ctx.sampleRate * 0.25);
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
        const src = ctx.createBufferSource();
        const hp = ctx.createBiquadFilter();
        const g = ctx.createGain();
        src.buffer = buf;
        hp.type = 'highpass';
        hp.frequency.value = 3500;
        g.gain.value = 0.035;
        src.connect(hp).connect(g).connect(ctx.destination);
        src.start(now + 0.05);
      } else if (kind === 'bad') {
        tone(190, now, 0.2, 'square', 0.04, 140);
      } else if (kind === 'bell') {
        tone(1568, now, 0.9, 'triangle', 0.08);
        tone(2349, now, 0.6, 'sine', 0.03);
      } else if (kind === 'win') {
        [523, 659, 784, 1047].forEach((f, i) => tone(f, now + i * 0.1, 0.22, 'triangle', 0.07));
      } else {
        [392, 330].forEach((f, i) => tone(f, now + i * 0.14, 0.25, 'sine', 0.07));
      }
    } catch {
      // audio unavailable
    }
  }, []);

  // Simulation loop (runs once; reads live settings from cfg).
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const later = (fn: () => void, ms: number) => {
      timers.current.push(window.setTimeout(fn, ms));
    };
    const s = sim.current;
    const txt = () => T[cfg.current.lang];
    const need = () => ORDERS[s.order].steps[s.step];
    const addFx = (f: Omit<Fx, 'id' | 'age'>) => s.fx.push({ ...f, id: s.nextId++, age: 0 });

    const finish = () => {
      if (s.phase === 'end') return;
      s.phase = 'end';
      s.items.forEach((i) => (i.dead = true));
      const won = s.served >= WIN;
      const len = ORDERS[Math.min(s.order, ORDERS.length - 1)].steps.length;
      const score = won
        ? 50 + (s.served - WIN) * 18 + (Math.max(0, s.timeLeft) / TOTAL) * 22 + Math.max(0, 10 - s.mistakes * 3)
        : Math.min(45, s.served * 18 + (s.served < ORDERS.length ? (s.step / len) * 14 : 0));
      const text = won ? txt().win(s.served) : txt().lose(s.served);
      setResult({ won, text });
      setSay(text);
      sound(won ? 'win' : 'lose');
      later(() => {
        if (finished.current) return;
        finished.current = true;
        cfg.current.onFinish({ won, score: Math.round(clamp(score, 0, 100)) });
      }, END_HOLD);
    };

    const spawn = () => {
      const rm = cfg.current.reducedMotion;
      const want = need();
      const needOnScreen = s.items.some((i) => !i.dead && i.ing === want && i.y < CATCH_Y - 70);
      const pNeed = needOnScreen ? 0.2 : s.sinceNeed > 1.6 ? 1 : 0.5;
      let ing: Ing;
      if (Math.random() < pNeed) {
        ing = want;
        s.sinceNeed = 0;
      } else {
        const others = INGS.filter((g) => g !== want);
        ing = others[Math.floor(Math.random() * others.length)];
      }
      const lo = PAN_EDGE - 10;
      const hi = s.W - PAN_EDGE_R + 10;
      let x = lo + Math.random() * (hi - lo);
      for (let k = 0; k < 8 && Math.abs(x - s.lastX) < 80; k++) x = lo + Math.random() * (hi - lo);
      s.lastX = x;
      const speed = (130 + s.order * 14 + Math.random() * 20) * (rm ? 0.7 : 1);
      s.items.push({
        id: s.nextId++,
        ing,
        x,
        y: -26,
        vx: 0,
        vy: speed,
        rot: rm ? 0 : Math.random() * 40 - 20,
        vr: rm ? 0 : Math.random() * 90 - 45,
        dead: false,
        op: 1,
      });
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const rm = cfg.current.reducedMotion;
      s.time += dt;

      // Pan: arrow keys accelerate while held; pointer target is followed quickly.
      const dir = (s.keyR ? 1 : 0) - (s.keyL ? 1 : 0);
      if (dir) {
        s.hold += dt;
        s.panX += dir * Math.min(480, 190 + 560 * s.hold) * dt;
        s.target = null;
      } else {
        s.hold = 0;
        if (s.target != null) {
          const d = s.target - s.panX;
          const step = 1400 * dt;
          s.panX += clamp(d, -step, step);
        }
      }
      s.panX = clamp(s.panX, PAN_EDGE, s.W - PAN_EDGE_R);
      s.shake = Math.max(0, s.shake - dt * 2.5);

      if (s.phase === 'intro') {
        s.phaseT -= dt;
        if (s.phaseT <= 0) {
          s.phase = 'play';
          setSay(txt().sStart(txt().dish[ORDERS[0].dish], txt().ing[need()]));
        }
      } else if (s.phase === 'play') {
        s.timeLeft -= dt;
        s.sinceNeed += dt;
        s.spawnIn -= dt;
        if (s.spawnIn <= 0) {
          spawn();
          s.spawnIn = (rm ? 1.1 : 0.82) + Math.random() * 0.15;
        }
      } else if (s.phase === 'bell') {
        s.phaseT -= dt;
        if (s.phaseT <= 0) {
          if (s.order + 1 >= ORDERS.length) finish();
          else {
            s.order += 1;
            s.step = 0;
            s.contents = [];
            s.phase = 'play';
            s.spawnIn = 0.3;
            s.sinceNeed = 2; // first needed ingredient comes right away
            setSay(txt().sNextOrder(txt().dish[ORDERS[s.order].dish], txt().ing[need()]));
          }
        }
      }

      // Items: fall, catch, fade.
      for (const it of s.items) {
        const prevY = it.y;
        it.x += it.vx * dt;
        it.y += it.vy * dt;
        it.rot += it.vr * dt;
        if (it.dead) {
          it.vy += 700 * dt;
          it.op -= dt * 2.2;
          continue;
        }
        if (s.phase === 'play' && prevY < CATCH_Y && it.y >= CATCH_Y && Math.abs(it.x - s.panX) <= CATCH_HW) {
          const want = need();
          const tx = txt();
          if (it.ing === want) {
            it.op = 0;
            it.dead = true;
            s.contents = [...s.contents, it.ing];
            s.step += 1;
            if (!rm) addFx({ x: s.panX, y: PAN_Y - 10, kind: 'puff' });
            addFx({ x: s.panX, y: PAN_Y - 44, kind: 'good', text: cap(tx.ing[it.ing]) });
            sound('good');
            if (s.step >= ORDERS[s.order].steps.length) {
              s.served += 1;
              s.phase = 'bell';
              s.phaseT = BELL;
              s.items.forEach((i) => (i.dead = true));
              sound('bell');
              setSay(tx.sBell(tx.dish[ORDERS[s.order].dish]));
            } else {
              setSay(tx.sGood(tx.ing[it.ing], tx.ing[need()]));
            }
          } else {
            it.dead = true;
            it.vy = -220;
            it.vx = it.x < s.panX ? -90 : 90;
            s.mistakes += 1;
            s.timeLeft -= PENALTY;
            if (!rm) s.shake = 1;
            addFx({ x: s.panX, y: PAN_Y - 44, kind: 'bad', text: `${tx.oops} −${PENALTY}s` });
            sound('bad');
            setSay(tx.sBad(tx.ing[it.ing], tx.ing[want]));
          }
        }
      }
      s.items = s.items.filter((i) => i.op > 0 && i.y < H + 40);
      s.fx.forEach((f) => (f.age += dt));
      s.fx = s.fx.filter((f) => f.age < (f.kind === 'puff' ? 0.7 : 0.9));

      if (s.phase === 'play' && s.timeLeft <= 0) {
        s.timeLeft = 0;
        finish();
      }

      setSnap({
        W: s.W,
        panX: s.panX,
        shake: s.shake,
        time: s.time,
        phase: s.phase,
        phaseT: s.phaseT,
        order: s.order,
        step: s.step,
        served: s.served,
        timeLeft: Math.max(0, s.timeLeft),
        contents: s.contents,
        items: s.items.map((i) => ({ ...i })),
        fx: s.fx.map((f) => ({ ...f })),
        touched: s.touched,
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [sound]);

  const toWorld = (clientX: number, clientY: number) => {
    const el = svg.current;
    const m = el?.getScreenCTM();
    if (!el || !m) return null;
    return new DOMPoint(clientX, clientY).matrixTransform(m.inverse()).x;
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault(); // keep focus off the dialog panel
    area.current?.focus({ preventScroll: true });
    ensureAudio();
    const s = sim.current;
    s.touched = true;
    s.dragging = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // not capturable
    }
    const x = toWorld(e.clientX, e.clientY);
    if (x != null) s.target = x;
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const s = sim.current;
    if (!s.dragging && e.pointerType !== 'mouse') return;
    const x = toWorld(e.clientX, e.clientY);
    if (x != null && !s.keyL && !s.keyR) s.target = x;
  };
  const onPointerUp = () => {
    sim.current.dragging = false;
  };

  const keyDir = (k: string) =>
    k === 'ArrowLeft' || k === 'a' || k === 'A' ? 'L' : k === 'ArrowRight' || k === 'd' || k === 'D' ? 'R' : null;
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const d = keyDir(e.key);
    if (!d) return;
    e.preventDefault();
    ensureAudio();
    const s = sim.current;
    s.touched = true;
    if (d === 'L') s.keyL = true;
    else s.keyR = true;
  };
  const onKeyUp = (e: KeyboardEvent<HTMLDivElement>) => {
    const d = keyDir(e.key);
    if (!d) return;
    const s = sim.current;
    if (d === 'L') s.keyL = false;
    else s.keyR = false;
  };
  const onBlur = () => {
    const s = sim.current;
    s.keyL = false;
    s.keyR = false;
    s.dragging = false;
  };

  const { W, phase } = snap;
  const order = ORDERS[snap.order];
  const want = phase === 'play' || phase === 'intro' ? order.steps[snap.step] : null;
  const shakeX = snap.shake > 0 ? Math.sin(snap.time * 70) * 4 * snap.shake : 0;
  const lowTime = snap.timeLeft <= 8 && phase !== 'end';
  const secs = Math.ceil(snap.timeLeft);
  const showKeys = phase !== 'end' && (!snap.touched || snap.time < 4);
  const bellK = phase === 'bell' ? clamp((BELL - snap.phaseT) / 0.2, 0, 1) : 0;

  return (
    <div className="flex h-full select-none flex-col gap-2 p-3 sm:gap-3 sm:p-4">
      {/* Ticket + timer */}
      <div className="flex shrink-0 items-stretch gap-2 sm:gap-3">
        <section
          aria-label={t.ticket}
          className="relative min-w-0 flex-1 rounded-lg border border-gray-200 bg-[#fffdf8] px-3 pb-2 pt-2.5 shadow-sm"
        >
          <span className="absolute inset-x-0 top-0 h-1 rounded-t-lg" style={{ background: ACCENT }} aria-hidden />
          <span
            className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gray-400 bg-gray-300 shadow"
            aria-hidden
          />
          <p className="flex items-baseline gap-2 truncate font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">
            {t.order(Math.min(snap.order + 1, ORDERS.length))}
            <span className="truncate font-sans text-xs normal-case tracking-normal text-gray-900">
              {t.dish[order.dish]}
            </span>
          </p>
          <ol className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {order.steps.map((ing, i) => {
              const done = i < snap.step || phase === 'bell';
              const isNext = !done && i === snap.step && phase !== 'end';
              return (
                <li
                  key={i}
                  aria-label={`${i + 1}. ${t.ing[ing]}${done ? ' ✓' : ''}${isNext ? ` (${t.next})` : ''}`}
                  aria-current={isNext ? 'step' : undefined}
                  className={`relative flex h-11 w-11 items-center justify-center rounded-lg border transition-colors duration-300 ${
                    isNext
                      ? 'border-transparent bg-red-50 ring-2 ring-[#dc2626]'
                      : done
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-gray-200 bg-white'
                  }`}
                >
                  <span className={done ? 'opacity-40' : ''}>
                    <IngSvg ing={ing} size={30} />
                  </span>
                  {done && (
                    <svg viewBox="0 0 16 16" className="absolute h-5 w-5" aria-hidden>
                      <polyline points="3,8.5 6.5,12 13,4.5" fill="none" stroke="#059669" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {isNext && !reducedMotion && (
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 animate-ping rounded-full bg-[#dc2626]/70" aria-hidden />
                  )}
                </li>
              );
            })}
            {want && (
              <li className="ml-1 text-xs font-semibold text-[#b91c1c]" aria-hidden>
                {t.next}: {t.ing[want]}
              </li>
            )}
          </ol>
        </section>
        <div className="flex w-[4.5rem] shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-2 shadow-sm sm:w-20">
          <span className="sr-only">{t.time}</span>
          <span
            className={`font-mono text-xl font-bold tabular-nums ${lowTime ? 'text-[#dc2626]' : 'text-gray-900'}`}
            aria-hidden
          >
            0:{String(secs).padStart(2, '0')}
          </span>
          <span className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100" aria-hidden>
            <span
              className="block h-full rounded-full"
              style={{ width: `${(snap.timeLeft / TOTAL) * 100}%`, background: lowTime ? ACCENT : '#0070f3' }}
            />
          </span>
          <span className="flex gap-1" aria-label={`${t.served}: ${snap.served}/${ORDERS.length}`} role="img">
            {ORDERS.map((_, i) => (
              <span
                key={i}
                className={`h-2.5 w-2.5 rounded-full ${i < snap.served ? 'bg-emerald-500' : 'bg-gray-200'}`}
              />
            ))}
          </span>
        </div>
      </div>

      {/* Play field */}
      <div
        ref={area}
        role="application"
        tabIndex={0}
        data-autofocus
        aria-label={t.area}
        data-phase={phase}
        data-pan={Math.round(snap.panX)}
        data-need={want ?? ''}
        data-served={snap.served}
        data-left={snap.timeLeft.toFixed(1)}
        data-w={W}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onBlur={onBlur}
        style={{ maxWidth: maxW }}
        className="relative mx-auto min-h-0 w-full flex-1 cursor-grab touch-none overflow-hidden rounded-2xl bg-[#fbf7f5] outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[#0070f3] active:cursor-grabbing"
      >
        <svg
          ref={svg}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          {/* Wall tiles */}
          <rect x="0" y="0" width={W} height={H} fill="#fbf7f5" />
          {Array.from({ length: Math.ceil(W / 44) + 1 }, (_, i) => (
            <line key={`v${i}`} x1={i * 44} y1="0" x2={i * 44} y2="378" stroke="#f1e7e3" strokeWidth="1.5" />
          ))}
          {Array.from({ length: 9 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 44} x2={W} y2={i * 44} stroke="#f1e7e3" strokeWidth="1.5" />
          ))}
          <rect x="0" y="372" width={W} height="8" fill={ACCENT} opacity="0.85" />
          {/* Stove */}
          <rect x="0" y="380" width={W} height="60" fill="#e5e7eb" />
          <rect x="0" y="380" width={W} height="6" fill="#9ca3af" />
          <rect x="0" y="386" width={W} height="3" fill="#374151" />
          {Array.from({ length: Math.floor((W - 40) / 70) + 1 }, (_, i) => (
            <g key={`k${i}`} transform={`translate(${40 + i * 70} 416)`}>
              <circle r="9" fill="#f9fafb" stroke="#6b7280" strokeWidth="1.5" />
              <rect x="-1.5" y="-8" width="3" height="7" fill={i === 1 ? ACCENT : '#6b7280'} />
            </g>
          ))}
          {/* Flame under the pan */}
          <g transform={`translate(${snap.panX} 383)`}>
            {[-26, -13, 0, 13, 26].map((dx, i) => {
              const f = reducedMotion ? 1 : 0.8 + 0.25 * Math.sin(snap.time * 18 + i * 1.7);
              return (
                <polygon
                  key={i}
                  points={`${dx - 5},0 ${dx},${-12 * f} ${dx + 5},0`}
                  fill={i % 2 ? '#f97316' : ACCENT}
                />
              );
            })}
          </g>

          {/* Falling ingredients */}
          {snap.items.map((it) => (
            <g
              key={it.id}
              data-ing={it.ing}
              data-x={Math.round(it.x)}
              data-y={Math.round(it.y)}
              data-live={it.dead ? undefined : '1'}
              transform={`translate(${it.x} ${it.y})`}
              opacity={Math.max(0, it.op)}
            >
              {!it.dead && it.ing === want && (
                <circle r="25" fill="#fff" fillOpacity="0.8" stroke={ACCENT} strokeWidth="2" strokeDasharray="5 4" />
              )}
              <g transform={`rotate(${it.rot})`}>
                <IngIcon ing={it.ing} />
              </g>
            </g>
          ))}

          {/* Steam wisps once something is cooking */}
          {!reducedMotion &&
            snap.contents.length > 0 &&
            [0, 1, 2].map((i) => {
              const p = (snap.time * 0.7 + i / 3) % 1;
              return (
                <circle
                  key={i}
                  cx={snap.panX - 20 + i * 20 + Math.sin(snap.time * 3 + i) * 5}
                  cy={PAN_Y - 18 - p * 50}
                  r={4 + p * 7}
                  fill="#d1d5db"
                  opacity={0.45 * (1 - p)}
                />
              );
            })}

          {/* Pan */}
          <g transform={`translate(${snap.panX + shakeX} ${PAN_Y})`}>
            <Pan contents={snap.contents} accent={ACCENT} />
          </g>

          {/* Sizzle puffs and pop-up text */}
          {snap.fx.map((f) =>
            f.kind === 'puff' ? (
              <g key={f.id} opacity={1 - f.age / 0.7}>
                {[-18, 0, 18].map((dx, i) => (
                  <circle key={i} cx={f.x + dx * (1 + f.age)} cy={f.y - f.age * 40 - (i % 2) * 6} r={5 + f.age * 14} fill="#e5e7eb" />
                ))}
                {[-24, -8, 8, 24].map((dx, i) => (
                  <circle key={`s${i}`} cx={f.x + dx * (1 + f.age * 2)} cy={f.y - 6 - f.age * 60 * (1 + (i % 2))} r="2" fill="#f59e0b" />
                ))}
              </g>
            ) : (
              <text
                key={f.id}
                x={f.x}
                y={f.y - (reducedMotion ? 0 : f.age * 30)}
                textAnchor="middle"
                fontSize="17"
                fontWeight="800"
                fill={f.kind === 'good' ? '#047857' : ACCENT}
                stroke="#fff"
                strokeWidth="4"
                paintOrder="stroke"
                opacity={1 - Math.max(0, f.age - 0.5) / 0.4}
              >
                {f.text}
              </text>
            ),
          )}

          {/* Intro prompt */}
          {phase === 'intro' && (
            <text
              x={W / 2}
              y={H / 2 - 40}
              textAnchor="middle"
              fontSize="24"
              fontWeight="800"
              fill="#111827"
              stroke="#fbf7f5"
              strokeWidth="6"
              paintOrder="stroke"
            >
              {t.ready}
            </text>
          )}

          {/* Order up! */}
          {phase === 'bell' && (
            <g
              transform={`translate(${W / 2} ${H / 2 - 40}) scale(${reducedMotion ? 1 : 0.8 + 0.2 * bellK})`}
              opacity={reducedMotion ? 1 : bellK}
            >
              <rect x="-120" y="-100" width="240" height="194" rx="18" fill="#fff" stroke="#e5e7eb" strokeWidth="2" />
              <rect x="-120" y="-100" width="240" height="8" rx="4" fill={ACCENT} />
              <g transform="translate(0 -56)">
                <Bell />
              </g>
              <text x="0" y="-24" textAnchor="middle" fontSize="24" fontWeight="800" fill={ACCENT}>
                {t.orderUp}
              </text>
              <g transform="translate(0 22)">
                <DishArt dish={order.dish} />
              </g>
              <text x="0" y="78" textAnchor="middle" fontSize="15" fontWeight="700" fill="#111827">
                {t.dish[order.dish]}
              </text>
            </g>
          )}
        </svg>

        {/* Key hint */}
        {showKeys && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center transition-opacity duration-300"
            aria-hidden
          >
            <span className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs text-gray-700 shadow-sm ring-1 ring-gray-200">
              <span className="space-x-1.5 pointer-coarse:hidden">
                <kbd className="rounded border border-gray-300 bg-gray-50 px-1.5 font-mono text-[11px]">←</kbd>
                <kbd className="rounded border border-gray-300 bg-gray-50 px-1.5 font-mono text-[11px]">→</kbd>
                <span>{t.keys}</span>
                <span className="text-gray-400">· {t.drag}</span>
              </span>
              <span className="hidden pointer-coarse:inline">{t.touch}</span>
            </span>
          </div>
        )}

        {/* End state */}
        {result && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/70 p-4">
            <p
              className={`max-w-xs rounded-2xl bg-white px-5 py-4 text-center text-lg font-bold shadow-md ring-1 ${
                result.won ? 'text-emerald-700 ring-emerald-200' : 'text-gray-800 ring-gray-200'
              }`}
            >
              {result.text}
            </p>
          </div>
        )}
      </div>

      <p id="orderup-live" aria-live="polite" className="sr-only">
        {say}
      </p>
    </div>
  );
}
