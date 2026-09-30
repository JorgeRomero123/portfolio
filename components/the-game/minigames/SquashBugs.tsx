'use client';

// "Squash the bugs": low-poly bugs crawl along the lines of a code editor towards PROD.
// Click/tap a bug (or pick a line with ↑/↓ and press Space) to squash it. Clicking code that is
// glowing green (passing) breaks the build. 3 lives; a bug reaching PROD or a broken build costs one.
// Win: survive 30 s with a life left and at least TARGET squashes.
import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import type { MiniGameProps } from '../types';

const DURATION = 30;
const LIVES = 3;
const TARGET = 15;
const ACCENT = '#0070f3';

const CODE = [
  "import { ship, log } from './deploy';",
  'type Cart = { items: Item[]; user: string };',
  'export async function checkout(cart: Cart) {',
  '  const items = cart.items.filter(Boolean);',
  '  if (items.length === 0) return null;',
  '  const total = sum(items.map((i) => i.price));',
  "  log('checkout', { user: cart.user, total });",
  '  await validate(total, 100);',
  '  return ship({ items, total });',
  '}',
];

type Kind = 'kw' | 'fn' | 'str' | 'num' | 'type' | 'id' | 'p';
const KEYWORDS = new Set(['import', 'from', 'type', 'export', 'async', 'function', 'const', 'if', 'return', 'await', 'null', 'string']);
const COLORS: Record<Kind, string> = {
  kw: '#8250df',
  fn: ACCENT,
  str: '#9a4d00',
  num: '#0550ae',
  type: '#953800',
  id: '#24292f',
  p: '#6e7781',
};

function tokenize(line: string) {
  const out: { text: string; kind: Kind }[] = [];
  const re = /(\s+|'[^']*'|\d+|[A-Za-z_]\w*|=>|===|[^\sA-Za-z_\d])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    const text = m[0];
    const next = line[re.lastIndex];
    let kind: Kind = 'p';
    if (/^\s/.test(text)) kind = 'p';
    else if (text.startsWith("'")) kind = 'str';
    else if (/^\d/.test(text)) kind = 'num';
    else if (KEYWORDS.has(text)) kind = 'kw';
    else if (/^[A-Za-z_]/.test(text)) kind = next === '(' ? 'fn' : /^[A-Z]/.test(text) ? 'type' : 'id';
    out.push({ text, kind });
  }
  return out;
}

const LINES = CODE.map(tokenize);
const N = LINES.length;
/** Token indices on each line that can light up as "passing" code. */
const GOOD = LINES.map((toks) =>
  toks.flatMap((t, i) => ((t.kind === 'fn' || t.kind === 'kw' || t.kind === 'type') && t.text.length >= 3 ? [i] : [])),
);
const GOOD_LANES = GOOD.flatMap((g, i) => (g.length ? [i] : []));

const T = {
  en: {
    intro: 'Bugs are crawling to production. Squash them before they get there.',
    warn: 'Don’t hit the green code: it passes its tests.',
    pointer: 'Click or tap a bug',
    keys: '↑ ↓ pick a line · Space squash',
    start: 'Start debugging',
    lives: 'Lives',
    squashed: 'Squashed',
    time: 'Time left',
    area: 'Code editor with bugs crawling towards production. Up and down arrows pick a line, Space or Enter squashes the bug on it.',
    lane: (n: number, bugs: number, good: boolean) =>
      `Line ${n}: ${bugs === 0 ? 'no bugs' : bugs === 1 ? '1 bug' : `${bugs} bugs`}${good ? ', passing code' : ''}`,
    livesLeft: (l: number) => `${l} ${l === 1 ? 'life' : 'lives'} left`,
    escaped: 'A bug reached production!',
    broke: 'You broke passing code!',
    passing: 'build passing',
    failing: 'build failing',
    winTitle: 'Shipped it!',
    winSub: (n: number) => `${n} bugs squashed — clean build.`,
    loseTitle: 'Build failed',
    loseLives: 'Too many bugs made it to production.',
    loseTarget: (n: number) => `${n} squashed; you needed ${TARGET}.`,
    file: 'checkout.ts',
  },
  es: {
    intro: 'Hay bugs rumbo a producción. Aplástalos antes de que lleguen.',
    warn: 'No toques el código verde: ese sí pasa sus pruebas.',
    pointer: 'Haz clic o toca un bug',
    keys: '↑ ↓ elige línea · Espacio aplasta',
    start: 'Empezar a depurar',
    lives: 'Vidas',
    squashed: 'Aplastados',
    time: 'Tiempo restante',
    area: 'Editor de código con bugs que avanzan hacia producción. Las flechas arriba y abajo eligen una línea; Espacio o Enter aplasta el bug de esa línea.',
    lane: (n: number, bugs: number, good: boolean) =>
      `Línea ${n}: ${bugs === 0 ? 'sin bugs' : bugs === 1 ? '1 bug' : `${bugs} bugs`}${good ? ', código que pasa' : ''}`,
    livesLeft: (l: number) => `${l === 1 ? 'Te queda 1 vida' : `Te quedan ${l} vidas`}`,
    escaped: '¡Un bug llegó a producción!',
    broke: '¡Rompiste código que funcionaba!',
    passing: 'build en verde',
    failing: 'build en rojo',
    winTitle: '¡A producción!',
    winSub: (n: number) => `Aplastaste ${n} bugs: build limpio.`,
    loseTitle: 'Falló el build',
    loseLives: 'Se colaron demasiados bugs a producción.',
    loseTarget: (n: number) => `Aplastaste ${n}; necesitabas ${TARGET}.`,
    file: 'checkout.ts',
  },
};

interface Bug {
  id: number;
  lane: number;
  x: number; // 0 = start of the line, 1 = production gate
  speed: number; // track widths per second
  phase: number;
}
type FxKind = 'splat' | 'break' | 'escape' | 'miss';
interface Fx {
  id: number;
  kind: FxKind;
  lane: number;
  x: number;
  t: number;
}
interface Game {
  time: number;
  lives: number;
  squashed: number;
  escaped: number;
  broken: number;
  misses: number;
  bugs: Bug[];
  fx: Fx[];
  glow: { lane: number; tok: number } | null;
  glowTimer: number;
  nextSpawn: number;
  cursor: number;
  ids: number;
}
type Snap = Omit<Game, 'nextSpawn' | 'glowTimer' | 'ids' | 'broken' | 'misses' | 'escaped'>;

const newGame = (): Game => ({
  time: 0,
  lives: LIVES,
  squashed: 0,
  escaped: 0,
  broken: 0,
  misses: 0,
  bugs: [],
  fx: [],
  glow: null,
  glowTimer: 1.2,
  nextSpawn: 0.3,
  cursor: 3,
  ids: 1,
});
const snapOf = (g: Game): Snap => ({
  time: g.time,
  lives: g.lives,
  squashed: g.squashed,
  bugs: g.bugs.map((b) => ({ ...b })),
  fx: g.fx.slice(),
  glow: g.glow,
  cursor: g.cursor,
});

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const FX_LIFE = 0.75;

type Sfx = 'squash' | 'break' | 'escape' | 'miss' | 'win' | 'lose';
function useSfx(soundOn: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  useEffect(
    () => () => {
      void ctxRef.current?.close().catch(() => {});
      ctxRef.current = null;
    },
    [],
  );
  return useCallback(
    (kind: Sfx) => {
      if (!soundOn) return;
      try {
        if (!ctxRef.current) {
          const Ctx =
            window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          ctxRef.current = new Ctx();
        }
        const ctx = ctxRef.current;
        const note = (type: OscillatorType, f0: number, f1: number, dur: number, vol: number, delay = 0) => {
          const t0 = ctx.currentTime + delay;
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = type;
          o.frequency.setValueAtTime(f0, t0);
          o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
          g.gain.setValueAtTime(vol, t0);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
          o.connect(g).connect(ctx.destination);
          o.start(t0);
          o.stop(t0 + dur + 0.02);
        };
        if (kind === 'squash') note('square', 520, 140, 0.09, 0.05);
        else if (kind === 'miss') note('triangle', 260, 220, 0.06, 0.04);
        else if (kind === 'break') note('sawtooth', 170, 80, 0.3, 0.06);
        else if (kind === 'escape') note('triangle', 440, 150, 0.3, 0.08);
        else if (kind === 'win') {
          note('triangle', 660, 660, 0.12, 0.07);
          note('triangle', 990, 990, 0.22, 0.07, 0.12);
        } else note('triangle', 330, 140, 0.4, 0.07);
      } catch {
        // no audio available
      }
    },
    [soundOn],
  );
}

/** Flat low-poly beetle facing right (towards production). */
function BugIcon({ size = 30, walking }: { size?: number; walking: boolean }) {
  return (
    <svg width={size} height={size * 0.8} viewBox="-15 -12 30 24" aria-hidden>
      <g stroke="#3b1d24" strokeWidth={1.4} strokeLinecap="round" className={walking ? 'sqb-legs' : undefined}>
        <path d="M-5 -5 L-8 -11 M1 -6 L1 -12 M5 -5 L8 -11" fill="none" />
        <path d="M-5 5 L-8 11 M1 6 L1 12 M5 5 L8 11" fill="none" />
      </g>
      <polygon points="-11,0 -6,-7.5 5,-7.5 9,0 5,7.5 -6,7.5" fill="#d93f4c" />
      <polygon points="-11,0 -6,-7.5 -1,0 -6,7.5" fill="#b3303c" />
      <polygon points="-1,0 5,-7.5 9,0" fill="#ef6b75" />
      <polygon points="-1,0 9,0 5,7.5" fill="#c9374a" />
      <path d="M-11 0 L9 0" stroke="#7f1d2a" strokeWidth={0.8} />
      <polygon points="8.5,-4.5 13.5,-2 13.5,2 8.5,4.5" fill="#3b1d24" />
      <path d="M12.5 -2.5 L15 -6 M12.5 2.5 L15 6" stroke="#3b1d24" strokeWidth={1.1} strokeLinecap="round" />
    </svg>
  );
}

const CSS = `
@keyframes sqb-leg { from { transform: rotate(-9deg) } to { transform: rotate(9deg) } }
.sqb-legs { animation: sqb-leg 0.16s ease-in-out infinite alternate; transform-origin: center; transform-box: fill-box; }
@keyframes sqb-pop { from { transform: translate(-50%,-50%) scale(0.3); opacity: 1 } 60% { opacity: 1 } to { transform: translate(-50%,-50%) scale(1.15); opacity: 0 } }
@keyframes sqb-bit { from { transform: translate(0,0); opacity: 1 } to { transform: translate(var(--dx), var(--dy)); opacity: 0 } }
@keyframes sqb-up { from { transform: translate(-50%, -50%); opacity: 1 } to { transform: translate(-50%, -190%); opacity: 0 } }
@keyframes sqb-fade { from { opacity: 1 } to { opacity: 0 } }
@keyframes sqb-glow { 0%,100% { box-shadow: 0 0 0 0 rgba(16,185,129,.0) } 50% { box-shadow: 0 0 0 4px rgba(16,185,129,.25) } }
.sqb-glow { animation: sqb-glow 0.9s ease-in-out infinite; }
`;

const BITS = [
  [18, -10],
  [-16, -12],
  [20, 10],
  [-18, 9],
  [2, -20],
  [0, 18],
];

export default function SquashBugs({ lang, reducedMotion, soundOn, onFinish }: MiniGameProps) {
  const t = T[lang];
  const [phase, setPhase] = useState<'intro' | 'play' | 'end'>('intro');
  const [snap, setSnap] = useState<Snap>(() => snapOf(newGame()));
  const [result, setResult] = useState<{ won: boolean; score: number; squashed: number; lives: number } | null>(null);
  const [announce, setAnnounce] = useState('');
  const game = useRef<Game>(newGame());
  const startBtn = useRef<HTMLButtonElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const sfx = useSfx(soundOn);
  const sfxRef = useRef(sfx);
  const finishRef = useRef(onFinish);
  useEffect(() => {
    sfxRef.current = sfx;
    finishRef.current = onFinish;
  }, [sfx, onFinish]);

  useEffect(() => {
    const id = requestAnimationFrame(() => startBtn.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(id);
  }, []);

  const addFx = (g: Game, kind: FxKind, lane: number, x: number) => {
    g.fx.push({ id: g.ids++, kind, lane, x, t: g.time });
  };

  // Main loop.
  useEffect(() => {
    if (phase !== 'play') return;
    let raf = 0;
    let last = performance.now();
    const g = game.current;
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      g.time += dt;
      const p = Math.min(1, g.time / DURATION);

      // Spawn waves: interval shrinks and bugs speed up as time runs.
      g.nextSpawn -= dt;
      if (g.nextSpawn <= 0 && g.time < DURATION - 2) {
        const count = p > 0.35 && Math.random() < 0.33 ? 2 : 1;
        for (let k = 0; k < count; k++) {
          const free = Array.from({ length: N }, (_, i) => i).filter(
            (i) => !g.bugs.some((b) => b.lane === i && b.x < 0.25),
          );
          if (!free.length) break;
          const lane = free[Math.floor(Math.random() * free.length)];
          const cross = lerp(6.2, 3.9, p) * (reducedMotion ? 1.45 : 1) * (0.9 + Math.random() * 0.25);
          g.bugs.push({ id: g.ids++, lane, x: -0.04, speed: 1.04 / cross, phase: Math.random() * 6 });
        }
        g.nextSpawn = lerp(1.4, 0.85, p) * (reducedMotion ? 1.2 : 1) * (0.85 + Math.random() * 0.3);
      }

      for (const b of g.bugs) b.x += b.speed * dt;
      const out = g.bugs.filter((b) => b.x >= 1);
      if (out.length) {
        g.bugs = g.bugs.filter((b) => b.x < 1);
        for (const b of out) {
          g.escaped++;
          g.lives = Math.max(0, g.lives - 1);
          addFx(g, 'escape', b.lane, 1);
        }
        sfxRef.current('escape');
        setAnnounce(`${T[lang].escaped} ${T[lang].livesLeft(g.lives)}`);
      }

      // "Passing code" glow: one token at a time lights up, then rests.
      g.glowTimer -= dt;
      if (g.glowTimer <= 0) {
        if (g.glow) {
          g.glow = null;
          g.glowTimer = 0.5 + Math.random() * 0.8;
        } else {
          const lanes = GOOD_LANES.filter((l) => l !== g.cursor || Math.random() < 0.4);
          const lane = lanes[Math.floor(Math.random() * lanes.length)];
          const opts = GOOD[lane];
          g.glow = { lane, tok: opts[Math.floor(Math.random() * opts.length)] };
          g.glowTimer = 2 + Math.random() * 0.8;
        }
      }

      g.fx = g.fx.filter((f) => g.time - f.t < FX_LIFE);

      if (g.lives <= 0 || g.time >= DURATION) {
        const won = g.lives > 0 && g.squashed >= TARGET;
        const resolved = g.squashed + g.escaped;
        const catchRate = resolved ? g.squashed / resolved : 0;
        const accuracy = g.squashed / Math.max(1, g.squashed + g.misses + g.broken * 2);
        const volume = Math.min(1, g.squashed / 20);
        let score = 100 * (0.4 * catchRate + 0.25 * accuracy + 0.2 * (g.lives / LIVES) + 0.15 * volume);
        if (!won) score = Math.min(score, 45);
        const r = { won, score: Math.round(Math.max(0, Math.min(100, score))), squashed: g.squashed, lives: g.lives };
        g.bugs = [];
        g.glow = null;
        setSnap(snapOf(g));
        setResult(r);
        setPhase('end');
        sfxRef.current(won ? 'win' : 'lose');
        const tt = T[lang];
        setAnnounce(
          won ? `${tt.winTitle} ${tt.winSub(r.squashed)}` : `${tt.loseTitle}. ${r.lives <= 0 ? tt.loseLives : tt.loseTarget(r.squashed)}`,
        );
        return;
      }
      setSnap(snapOf(g));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, reducedMotion, lang]);

  // Once playing, keyboard focus lives on the play area (the Start button just unmounted).
  useEffect(() => {
    if (phase === 'play') area.current?.focus({ preventScroll: true });
  }, [phase]);

  // Short end state, then report once.
  useEffect(() => {
    if (phase !== 'end' || !result) return;
    const id = window.setTimeout(() => finishRef.current({ won: result.won, score: result.score }), 1600);
    return () => window.clearTimeout(id);
  }, [phase, result]);

  const start = () => {
    game.current = newGame();
    setSnap(snapOf(game.current));
    setPhase('play');
    sfx('miss'); // unlocks audio on this user gesture (silent when sound is off)
  };

  const squash = (g: Game, b: Bug) => {
    g.bugs = g.bugs.filter((x) => x.id !== b.id);
    g.squashed++;
    addFx(g, 'splat', b.lane, b.x);
    sfx('squash');
    if (g.squashed % 5 === 0 || g.squashed === TARGET) setAnnounce(`${t.squashed}: ${g.squashed}`);
  };
  const breakBuild = (g: Game, lane: number, x: number) => {
    g.broken++;
    g.lives = Math.max(0, g.lives - 1);
    g.glow = null;
    g.glowTimer = 0.8;
    addFx(g, 'break', lane, x);
    sfx('break');
    setAnnounce(`${t.broke} ${t.livesLeft(g.lives)}`);
  };
  const miss = (g: Game, lane: number, x: number) => {
    g.misses++;
    addFx(g, 'miss', lane, x);
    sfx('miss');
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (phase !== 'play' || !track.current) return;
    e.preventDefault();
    area.current?.focus({ preventScroll: true });
    const g = game.current;
    const rect = track.current.getBoundingClientRect();
    const laneH = rect.height / N;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const lane = Math.max(0, Math.min(N - 1, Math.floor(py / laneH)));
    g.cursor = lane;
    let best: Bug | null = null;
    let bestD = Infinity;
    const ry = Math.max(24, laneH * 0.8);
    for (const b of g.bugs) {
      const dx = px - b.x * rect.width;
      const dy = py - (b.lane + 0.5) * laneH;
      if (Math.abs(dx) > 32 || Math.abs(dy) > ry) continue;
      const d = dx * dx + dy * dy * 1.5;
      if (d < bestD) {
        bestD = d;
        best = b;
      }
    }
    const x = Math.max(0, Math.min(1, px / rect.width));
    if (best) squash(g, best);
    else if ((e.target as Element).closest?.('[data-good="1"]')) breakBuild(g, lane, x);
    else miss(g, lane, x);
    setSnap(snapOf(g));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (phase !== 'play') return;
    const g = game.current;
    const k = e.key;
    if (k === 'ArrowUp' || k === 'ArrowDown' || k === 'w' || k === 's') {
      e.preventDefault();
      g.cursor = Math.max(0, Math.min(N - 1, g.cursor + (k === 'ArrowUp' || k === 'w' ? -1 : 1)));
      const bugs = g.bugs.filter((b) => b.lane === g.cursor).length;
      setAnnounce(t.lane(g.cursor + 1, bugs, g.glow?.lane === g.cursor));
      setSnap(snapOf(g));
    } else if (k === ' ' || k === 'Enter') {
      e.preventDefault();
      if (e.repeat) return;
      const inLane = g.bugs.filter((b) => b.lane === g.cursor).sort((a, b) => b.x - a.x);
      if (inLane.length) squash(g, inLane[0]);
      else if (g.glow?.lane === g.cursor) breakBuild(g, g.cursor, 0.4);
      else miss(g, g.cursor, 0.5);
      setSnap(snapOf(g));
    }
  };

  const timeLeft = Math.max(0, DURATION - snap.time);
  const hurt = snap.fx.some((f) => f.kind === 'break' || f.kind === 'escape');
  const walking = !reducedMotion && phase === 'play';

  return (
    <div className="flex h-full min-h-[420px] select-none flex-col gap-2 p-3 sm:gap-3 sm:p-4">
      <style>{CSS}</style>

      {/* HUD */}
      <div className="flex shrink-0 items-center gap-3 text-sm sm:gap-4">
        <div className="flex items-center gap-1.5" aria-label={`${t.lives}: ${snap.lives}/${LIVES}`} role="img">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-gray-500">{t.lives}</span>
          {Array.from({ length: LIVES }, (_, i) => (
            <span
              key={i}
              className={`h-3 w-3 rounded-full transition-colors duration-300 ${
                i < snap.lives ? 'bg-emerald-500' : 'bg-rose-200 ring-1 ring-rose-400'
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-1.5" role="img" aria-label={`${t.squashed}: ${snap.squashed}/${TARGET}`}>
          <BugIcon size={20} walking={false} />
          <span
            className={`font-mono text-sm font-bold tabular-nums ${snap.squashed >= TARGET ? 'text-emerald-600' : 'text-gray-900'}`}
          >
            {snap.squashed}
            <span className="font-normal text-gray-400">/{TARGET}</span>
          </span>
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2" role="img" aria-label={`${t.time}: ${Math.ceil(timeLeft)} s`}>
          <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full"
              style={{ width: `${(timeLeft / DURATION) * 100}%`, background: timeLeft < 6 ? '#f59e0b' : ACCENT }}
            />
          </div>
          <span className="w-7 text-right font-mono text-xs tabular-nums text-gray-600">{Math.ceil(timeLeft)}s</span>
        </div>
      </div>

      {/* Editor */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md">
        <div className="flex h-8 shrink-0 items-center gap-2 border-b border-gray-100 bg-gray-50 px-3">
          <span className="flex gap-1" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
          </span>
          <span className="rounded-md border border-gray-200 bg-white px-2 py-0.5 font-mono text-[11px] text-gray-700">
            {t.file}
          </span>
          <span
            className={`ml-auto flex items-center gap-1.5 font-mono text-[11px] ${hurt || snap.lives < LIVES ? 'text-rose-600' : 'text-emerald-700'}`}
          >
            <span className={`h-2 w-2 rounded-full ${hurt || snap.lives < LIVES ? 'bg-rose-500' : 'bg-emerald-500'}`} aria-hidden />
            {hurt || snap.lives < LIVES ? t.failing : t.passing}
          </span>
        </div>

        <div
          ref={area}
          tabIndex={phase === 'play' ? 0 : -1}
          role="application"
          aria-label={t.area}
          onPointerDown={onPointerDown}
          onMouseDown={(e) => e.preventDefault()}
          onKeyDown={onKeyDown}
          className="relative flex min-h-0 flex-1 cursor-crosshair touch-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0070f3]"
        >
          <div className="flex min-w-0 flex-1 flex-col py-1">
            {LINES.map((toks, lane) => {
              const cur = phase === 'play' && snap.cursor === lane;
              const broke = snap.fx.some((f) => f.kind === 'break' && f.lane === lane);
              const glowTok = snap.glow?.lane === lane ? snap.glow.tok : -1;
              return (
                <div
                  key={lane}
                  className={`relative flex min-h-0 flex-1 items-center transition-colors duration-200 ${
                    broke ? 'bg-rose-100' : cur ? 'bg-[#0070f3]/[0.07]' : ''
                  }`}
                >
                  <span
                    className={`flex h-full w-8 shrink-0 items-center justify-end border-l-[3px] pr-2 font-mono text-[10px] tabular-nums sm:text-[11px] ${
                      cur ? 'border-[#0070f3] font-bold text-[#0070f3]' : 'border-transparent text-gray-400'
                    }`}
                  >
                    {lane + 1}
                  </span>
                  <code className="min-w-0 flex-1 overflow-hidden whitespace-pre pl-2 font-mono text-[11px] leading-none sm:text-[13px]">
                    {toks.map((tk, i) =>
                      i === glowTok ? (
                        <span
                          key={i}
                          data-good="1"
                          className={`relative rounded bg-emerald-100 px-0.5 py-1 font-semibold text-emerald-800 ring-1 ring-emerald-500 ${reducedMotion ? '' : 'sqb-glow'}`}
                        >
                          {tk.text}
                          <span className="absolute -right-1.5 -top-2 text-[9px] font-bold text-emerald-600" aria-hidden>
                            ✓
                          </span>
                        </span>
                      ) : (
                        <span key={i} style={{ color: COLORS[tk.kind] }}>
                          {tk.text}
                        </span>
                      ),
                    )}
                  </code>
                </div>
              );
            })}
          </div>

          {/* Production gate */}
          <div
            className={`relative flex w-11 shrink-0 flex-col items-center justify-center border-l-2 border-dashed transition-colors duration-300 sm:w-12 ${
              hurt ? 'border-rose-400 bg-rose-50' : 'border-gray-300 bg-gray-50'
            }`}
            aria-hidden
          >
            <span
              className={`font-mono text-[10px] font-bold tracking-[0.25em] [writing-mode:vertical-rl] ${hurt ? 'text-rose-600' : 'text-gray-500'}`}
            >
              PROD
            </span>
            {snap.fx
              .filter((f) => f.kind === 'escape')
              .map((f) => (
                <span
                  key={f.id}
                  className="absolute left-1/2 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-rose-500 text-[11px] font-bold text-white"
                  style={{ top: `calc(4px + (100% - 8px) * ${(f.lane + 0.5) / N})` }}
                >
                  !
                </span>
              ))}
          </div>

          {/* Bugs + effects layer (the track spans the code area, gutter edge to gate) */}
          <div ref={track} className="pointer-events-none absolute bottom-1 left-7 right-11 top-1 sm:right-12" aria-hidden>
            {snap.bugs.map((b) => {
              const x = reducedMotion ? Math.floor(b.x * 14) / 14 : b.x;
              const wob = reducedMotion ? 0 : Math.sin(snap.time * 9 + b.phase) * 1.5;
              return (
                <div
                  key={b.id}
                  className="absolute drop-shadow-[0_2px_2px_rgba(0,0,0,0.18)]"
                  style={{
                    left: `${x * 100}%`,
                    top: `${((b.lane + 0.5) / N) * 100}%`,
                    transform: `translate(-50%, calc(-50% + ${wob}px))`,
                  }}
                >
                  <BugIcon walking={walking} />
                </div>
              );
            })}
            {snap.fx.map((f) => {
              const style = { left: `${f.x * 100}%`, top: `${((f.lane + 0.5) / N) * 100}%` };
              if (f.kind === 'splat')
                return (
                  <div key={f.id} className="absolute" style={style}>
                    <svg
                      width={40}
                      height={34}
                      viewBox="-20 -17 40 34"
                      className="absolute left-0 top-0"
                      style={{
                        animation: reducedMotion ? `sqb-fade ${FX_LIFE}s ease-out forwards` : `sqb-pop ${FX_LIFE}s ease-out forwards`,
                        transform: 'translate(-50%,-50%)',
                      }}
                    >
                      <polygon
                        points="-14,-3 -8,-12 -1,-8 6,-14 9,-5 17,-2 10,5 12,13 2,9 -6,14 -8,6 -17,4"
                        fill="#a3c93a"
                        opacity={0.85}
                      />
                      <polygon points="-6,-2 0,-6 6,-1 2,5 -4,4" fill="#7ea52a" />
                    </svg>
                    {!reducedMotion &&
                      BITS.map(([dx, dy], i) => (
                        <span
                          key={i}
                          className="absolute left-0 top-0 h-1.5 w-1.5 rotate-45 bg-[#d93f4c]"
                          style={
                            {
                              '--dx': `${dx}px`,
                              '--dy': `${dy}px`,
                              animation: `sqb-bit 0.45s ease-out forwards`,
                            } as CSSProperties
                          }
                        />
                      ))}
                    <span
                      className="absolute left-0 top-0 font-mono text-sm font-bold text-[#0070f3]"
                      style={{
                        animation: reducedMotion ? `sqb-fade ${FX_LIFE}s ease-out forwards` : `sqb-up ${FX_LIFE}s ease-out forwards`,
                        transform: 'translate(-50%,-150%)',
                      }}
                    >
                      +1
                    </span>
                  </div>
                );
              if (f.kind === 'miss')
                return (
                  <span
                    key={f.id}
                    className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gray-300"
                    style={{ ...style, animation: `sqb-fade 0.4s ease-out forwards` }}
                  />
                );
              if (f.kind === 'break')
                return (
                  <span
                    key={f.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-rose-600 px-1.5 py-0.5 font-mono text-[11px] font-bold text-white shadow"
                    style={{ ...style, animation: `sqb-fade ${FX_LIFE}s ease-in forwards` }}
                  >
                    −1 ✗
                  </span>
                );
              return null;
            })}
          </div>
        </div>

        {phase === 'intro' && (
          <div className="absolute inset-0 top-8 flex items-center justify-center bg-white/85 p-4 backdrop-blur-[2px]">
            <div className="flex max-w-sm flex-col items-center gap-3 text-center">
              <BugIcon size={44} walking={!reducedMotion} />
              <p className="text-base font-semibold text-gray-900">{t.intro}</p>
              <p className="text-sm text-gray-600">
                <span className="mr-1.5 inline-block rounded bg-emerald-100 px-1 font-mono text-xs font-semibold text-emerald-800 ring-1 ring-emerald-500">
                  ship()
                </span>
                {t.warn}
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-700">
                <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1">{t.pointer}</span>
                <span className="hidden rounded-md border border-gray-200 bg-gray-50 px-2 py-1 font-mono sm:inline">{t.keys}</span>
              </div>
              <button
                ref={startBtn}
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
          <div className="absolute inset-0 top-8 flex items-center justify-center bg-white/85 p-4 backdrop-blur-[2px]">
            <div className="flex flex-col items-center gap-1 text-center">
              <p className={`text-3xl font-extrabold tracking-tight ${result.won ? 'text-[#0070f3]' : 'text-rose-600'}`}>
                {result.won ? t.winTitle : t.loseTitle}
              </p>
              <p className="text-sm text-gray-700">
                {result.won ? t.winSub(result.squashed) : result.lives <= 0 ? t.loseLives : t.loseTarget(result.squashed)}
              </p>
            </div>
          </div>
        )}
      </div>

      <p className="hidden shrink-0 text-center font-mono text-[11px] text-gray-500 sm:block" aria-hidden>
        {t.keys}
      </p>
      <p className="sr-only" aria-live="polite" data-sqb-live>
        {announce}
      </p>
    </div>
  );
}
