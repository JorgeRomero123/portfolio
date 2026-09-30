'use client';

// Meeple memory: 12 face-down tiles (6 pairs of board-game pieces) on a felt board.
// The clock (40 s) starts on the first flip. Win = every pair found before it runs out.
// Mouse, touch and keyboard (roving tabindex grid: arrows move, Enter/Space flip).
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { MiniGameProps } from '../types';
import { FACE_IDS, FACE_NAMES, Face, TileBack, type FaceId } from './meeplememory/faces';

const PAIRS = 6;
const TOTAL = PAIRS * 2;
const TIME = 40; // seconds
const HIDE_MS = 750; // how long a mismatched pair stays up
const ACCENT = '#16a34a';

const T = {
  en: {
    time: 'Time',
    moves: 'Moves',
    pairs: 'Pairs',
    keys: 'Arrow keys move · Enter or Space flips',
    board: 'Memory board, 12 tiles',
    tile: (n: number) => `Tile ${n}`,
    down: 'face down',
    matched: 'matched',
    up: 'face up',
    flipped: (name: string) => `${cap(name)}.`,
    match: (name: string, p: number) => `Match! ${cap(name)}. ${p} of ${PAIRS} pairs.`,
    noMatch: (a: string, b: string) => `${cap(a)} and ${b}: no match.`,
    tenLeft: '10 seconds left.',
    win: (s: number) => `${PAIRS}/${PAIRS} — all pairs with ${s}s to spare!`,
    lose: (p: number) => `Time! ${p}/${PAIRS} pairs found.`,
    start: 'The clock starts on your first flip.',
  },
  es: {
    time: 'Tiempo',
    moves: 'Jugadas',
    pairs: 'Pares',
    keys: 'Flechas para moverte · Enter o Espacio para voltear',
    board: 'Tablero de memorama, 12 fichas',
    tile: (n: number) => `Ficha ${n}`,
    down: 'boca abajo',
    matched: 'encontrada',
    up: 'boca arriba',
    flipped: (name: string) => `${cap(name)}.`,
    match: (name: string, p: number) => `¡Par! ${cap(name)}. ${p} de ${PAIRS} pares.`,
    noMatch: (a: string, b: string) => `${cap(a)} y ${b}: no son pareja.`,
    tenLeft: 'Quedan 10 segundos.',
    win: (s: number) => `${PAIRS}/${PAIRS} — ¡todos los pares y te sobraron ${s} s!`,
    lose: (p: number) => `¡Se acabó el tiempo! Encontraste ${p}/${PAIRS} pares.`,
    start: 'El reloj arranca con tu primer volteo.',
  },
};

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface Card {
  face: FaceId;
  matched: boolean;
}

function shuffle<U>(a: U[]): U[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

/** 6 distinct pieces, at most 2 meeples so colour alone rarely decides a pair. */
function deal(): Card[] {
  const meeples = shuffle(FACE_IDS.filter((f) => f.startsWith('meeple'))).slice(0, 2);
  const others = shuffle(FACE_IDS.filter((f) => !f.startsWith('meeple'))).slice(0, PAIRS - 2);
  const faces = [...meeples, ...others];
  return shuffle([...faces, ...faces]).map((face) => ({ face, matched: false }));
}

// --- sound: one lazily created context, tiny synth blips -------------------------------
type Blip = 'flip' | 'match' | 'miss' | 'win' | 'lose';
function useBlips(soundOn: boolean) {
  const ctx = useRef<AudioContext | null>(null);
  useEffect(
    () => () => {
      void ctx.current?.close().catch(() => {});
      ctx.current = null;
    },
    [],
  );
  return useCallback(
    (kind: Blip) => {
      if (!soundOn) return;
      try {
        if (!ctx.current) {
          const Ctx =
            window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          ctx.current = new Ctx();
        }
        const c = ctx.current;
        void c.resume();
        const notes: Record<Blip, [number, number][]> = {
          flip: [[660, 0]],
          match: [
            [784, 0],
            [1175, 0.08],
          ],
          miss: [[196, 0]],
          win: [
            [784, 0],
            [988, 0.1],
            [1175, 0.2],
            [1568, 0.3],
          ],
          lose: [
            [330, 0],
            [247, 0.14],
          ],
        };
        for (const [freq, at] of notes[kind]) {
          const o = c.createOscillator();
          const g = c.createGain();
          const t0 = c.currentTime + at;
          o.type = kind === 'miss' || kind === 'lose' ? 'sine' : 'triangle';
          o.frequency.value = freq;
          g.gain.setValueAtTime(0.0001, t0);
          g.gain.exponentialRampToValueAtTime(kind === 'flip' ? 0.04 : 0.08, t0 + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + (kind === 'flip' ? 0.08 : 0.22));
          o.connect(g).connect(c.destination);
          o.start(t0);
          o.stop(t0 + 0.25);
        }
      } catch {
        // no audio available
      }
    },
    [soundOn],
  );
}

// --- layout: 4×3 or 3×4, whichever gives bigger tiles in the space we have -------------
const GAP = 10;
const CHROME = 112; // HUD + key hint + padding, in px
function fit(w: number, h: number) {
  const aw = Math.max(0, w - 24);
  const ah = Math.max(0, h - CHROME);
  const size = (cols: number, rows: number) =>
    Math.min((aw - GAP * (cols - 1)) / cols, (ah - GAP * (rows - 1)) / rows);
  const wide = size(4, 3);
  const tall = size(3, 4);
  const cols = wide >= tall ? 4 : 3;
  const tile = Math.floor(Math.max(56, Math.min(128, Math.max(wide, tall))));
  return { cols, tile };
}

type Phase = 'play' | 'won' | 'lost';

export default function MeepleMemory({ lang, reducedMotion, soundOn, onFinish }: MiniGameProps) {
  const t = T[lang];
  const blip = useBlips(soundOn);
  const [cards, setCards] = useState<Card[]>(deal);
  const [open, setOpen] = useState<number[]>([]); // face-up, unmatched (0–2)
  const [moves, setMoves] = useState(0);
  const [misses, setMisses] = useState(0);
  const [active, setActive] = useState(0);
  const [started, setStarted] = useState(false);
  const [left, setLeft] = useState(TIME);
  const [phase, setPhase] = useState<Phase>('play');
  const [msg, setMsg] = useState('');
  const [popped, setPopped] = useState<number[]>([]);
  const [box, setBox] = useState({ w: 390, h: 600 });

  const root = useRef<HTMLDivElement>(null);
  const tiles = useRef<(HTMLButtonElement | null)[]>([]);
  const hideTimer = useRef<number | undefined>(undefined);
  const deadline = useRef(0);
  const finished = useRef(false);
  const result = useRef({ won: false, score: 0 });

  const pairs = cards.filter((c) => c.matched).length / 2;
  const { cols, tile } = fit(box.w, box.h);
  const rows = TOTAL / cols;
  const say = useCallback((s: string) => setMsg((m) => (m === s ? `${s} ` : s)), []);

  // Measure the container the host gives us.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setBox((b) => (Math.abs(b.w - width) < 1 && Math.abs(b.h - height) < 1 ? b : { w: width, h: height }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Focus the first tile after the host has placed its own focus.
  useEffect(() => {
    const id = requestAnimationFrame(() => tiles.current[0]?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(id);
  }, []);

  // Clock: starts on the first flip, stops when the round ends.
  useEffect(() => {
    if (!started || phase !== 'play') return;
    if (!deadline.current) deadline.current = performance.now() + TIME * 1000;
    let warned = false;
    const id = window.setInterval(() => {
      const s = Math.max(0, (deadline.current - performance.now()) / 1000);
      setLeft(s);
      if (!warned && s <= 10) {
        warned = true;
        say(t.tenLeft);
      }
      if (s <= 0) setPhase('lost');
    }, 100);
    return () => window.clearInterval(id);
  }, [started, phase, say, t.tenLeft]);

  // End state: show the result briefly, then report once.
  useEffect(() => {
    if (phase === 'play') return;
    window.clearTimeout(hideTimer.current);
    if (phase === 'lost') {
      result.current = { won: false, score: Math.round((pairs / PAIRS) * 40) };
      say(t.lose(pairs));
      blip('lose');
    }
    const id = window.setTimeout(() => {
      if (finished.current) return;
      finished.current = true;
      onFinish(result.current);
    }, 1400);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per phase change
  }, [phase]);

  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  const flip = useCallback(
    (i: number) => {
      if (phase !== 'play') return;
      const card = cards[i];
      if (card.matched || open.includes(i)) return;
      // A third tap while a mismatch is showing turns those two back down right away.
      const current = open.length >= 2 ? [] : open;
      window.clearTimeout(hideTimer.current);
      if (!started) setStarted(true);
      const next = [...current, i];
      const name = FACE_NAMES[card.face][lang];
      if (next.length < 2) {
        setOpen(next);
        blip('flip');
        say(t.flipped(name));
        return;
      }
      const [a, b] = next;
      setMoves((m) => m + 1);
      if (cards[a].face === cards[b].face) {
        const updated = cards.map((c, k) => (k === a || k === b ? { ...c, matched: true } : c));
        const p = updated.filter((c) => c.matched).length / 2;
        setCards(updated);
        setOpen([]);
        setPopped([a, b]);
        if (p === PAIRS) {
          const s = Math.max(0, (deadline.current || performance.now() + TIME * 1000) - performance.now()) / 1000;
          const score = Math.round(45 + 40 * (s / TIME) + 15 * Math.max(0, 1 - misses / 10));
          result.current = { won: true, score: Math.max(50, Math.min(100, score)) };
          setLeft(s);
          setPhase('won');
          blip('win');
          say(t.win(Math.ceil(s)));
        } else {
          blip('match');
          say(t.match(name, p));
        }
      } else {
        setOpen(next);
        setMisses((m) => m + 1);
        blip('miss');
        say(t.noMatch(FACE_NAMES[cards[a].face][lang], name));
        hideTimer.current = window.setTimeout(() => setOpen([]), HIDE_MS);
      }
    },
    [blip, cards, lang, misses, open, phase, say, started, t],
  );

  const move = (to: number) => {
    setActive(to);
    tiles.current[to]?.focus({ preventScroll: true });
  };

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    let to = -1;
    if (e.key === 'ArrowRight') to = c < cols - 1 ? i + 1 : i;
    else if (e.key === 'ArrowLeft') to = c > 0 ? i - 1 : i;
    else if (e.key === 'ArrowDown') to = r < rows - 1 ? i + cols : i;
    else if (e.key === 'ArrowUp') to = r > 0 ? i - cols : i;
    else if (e.key === 'Home') to = r * cols;
    else if (e.key === 'End') to = r * cols + cols - 1;
    if (to >= 0) {
      e.preventDefault();
      move(to);
    }
  };

  const secs = Math.ceil(left);
  const urgent = started && phase === 'play' && left <= 10;
  const flipMs = reducedMotion ? 0 : 320;

  return (
    <div ref={root} className="flex h-full min-h-[420px] flex-col items-center gap-3 px-3 pt-3 pb-3 select-none">
      <style>{`
        .mm-inner{transition:transform ${flipMs}ms cubic-bezier(.3,.7,.4,1);transform-style:preserve-3d}
        .mm-side{backface-visibility:hidden;-webkit-backface-visibility:hidden}
        .mm-fade{transition:opacity 140ms linear}
        @keyframes mm-pop{0%{transform:scale(1)}40%{transform:scale(1.12)}100%{transform:scale(1)}}
        .mm-pop{animation:mm-pop 380ms ease-out}
        @keyframes mm-in{from{opacity:0;transform:translateY(6px) scale(.96)}to{opacity:1;transform:none}}
        .mm-end{animation:mm-in 260ms ease-out}
      `}</style>

      {/* HUD */}
      <div className="flex w-full max-w-xl items-center gap-3 text-sm" style={{ maxWidth: cols * tile + (cols - 1) * GAP }}>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between font-mono text-xs text-gray-500">
            <span>{t.time}</span>
            <span className={`text-base font-bold tabular-nums ${urgent ? 'text-rose-600' : 'text-gray-900'}`}>{secs}s</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100" aria-hidden>
            <div
              className="h-full rounded-full"
              style={{
                width: `${(left / TIME) * 100}%`,
                background: urgent ? '#e11d48' : ACCENT,
                transition: reducedMotion ? 'none' : 'width 100ms linear',
              }}
            />
          </div>
        </div>
        <div className="text-center">
          <div className="font-mono text-xs text-gray-500">{t.pairs}</div>
          <div className="text-base font-bold tabular-nums text-gray-900">
            {pairs}/{PAIRS}
          </div>
        </div>
        <div className="text-center">
          <div className="font-mono text-xs text-gray-500">{t.moves}</div>
          <div className="text-base font-bold tabular-nums text-gray-900">{moves}</div>
        </div>
      </div>

      {/* Felt board */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        <div
          role="grid"
          aria-label={t.board}
          aria-rowcount={rows}
          aria-colcount={cols}
          className="rounded-3xl p-2.5 shadow-inner sm:p-3"
          style={{
            touchAction: 'none',
            background:
              'radial-gradient(circle at 30% 20%, rgba(255,255,255,.55), transparent 60%), repeating-linear-gradient(45deg, rgba(22,163,74,.05) 0 2px, transparent 2px 6px), #dcfce7',
            boxShadow: 'inset 0 2px 10px rgba(21,128,61,.18), 0 0 0 1px rgba(22,163,74,.2)',
          }}
        >
          {Array.from({ length: rows }, (_, r) => (
            <div key={r} role="row" className="flex" style={{ gap: GAP, marginTop: r ? GAP : 0 }}>
              {Array.from({ length: cols }, (_, c) => {
                const i = r * cols + c;
                const card = cards[i];
                const up = card.matched || open.includes(i);
                const name = FACE_NAMES[card.face][lang];
                const label = `${t.tile(i + 1)}, ${up ? `${name}, ${card.matched ? t.matched : t.up}` : t.down}`;
                return (
                  <div key={i} role="gridcell" style={{ width: tile, height: tile, perspective: 600 }}>
                    <button
                      ref={(el) => {
                        tiles.current[i] = el;
                      }}
                      type="button"
                      tabIndex={i === active ? 0 : -1}
                      aria-label={label}
                      aria-disabled={card.matched || phase !== 'play' || undefined}
                      onFocus={() => setActive(i)}
                      onClick={() => {
                        setActive(i);
                        flip(i);
                      }}
                      onKeyDown={(e) => onKey(e, i)}
                      className={`group relative block h-full w-full rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-[#0070f3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#dcfce7] ${
                        card.matched ? 'cursor-default' : 'cursor-pointer'
                      } ${popped.includes(i) && !reducedMotion ? 'mm-pop' : ''}`}
                    >
                      {reducedMotion ? (
                        <>
                          <span
                            className={`mm-fade absolute inset-0 overflow-hidden rounded-2xl ${up ? 'opacity-0' : 'opacity-100'}`}
                            style={{ background: ACCENT, boxShadow: '0 3px 0 #166534' }}
                          >
                            <TileBack />
                          </span>
                          <FaceSide up={up} matched={card.matched} face={card.face} fade />
                        </>
                      ) : (
                        <span
                          className="mm-inner absolute inset-0 block rounded-2xl"
                          style={{ transform: up ? 'rotateY(180deg)' : 'none' }}
                        >
                          <span
                            className="mm-side absolute inset-0 overflow-hidden rounded-2xl transition-transform duration-150 group-hover:-translate-y-0.5"
                            style={{ background: ACCENT, boxShadow: '0 3px 0 #166534' }}
                          >
                            <TileBack />
                          </span>
                          <FaceSide up matched={card.matched} face={card.face} flipped />
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {phase !== 'play' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
            <p
              className={`${reducedMotion ? '' : 'mm-end'} max-w-xs rounded-2xl bg-white/95 px-5 py-3 text-center text-lg font-bold text-gray-900 shadow-lg ring-1 ring-black/5`}
            >
              <span className="mr-1.5" style={{ color: phase === 'won' ? ACCENT : '#e11d48' }} aria-hidden>
                {phase === 'won' ? '✓' : '⏱'}
              </span>
              {phase === 'won' ? t.win(Math.ceil(left)) : t.lose(pairs)}
            </p>
          </div>
        )}
      </div>

      <p className="min-h-4 text-center text-xs leading-tight text-gray-500" aria-hidden>
        {started ? (moves < 2 ? t.keys : '') : `${t.start} ${t.keys}`}
      </p>
      <p aria-live="polite" role="status" className="sr-only">
        {msg}
      </p>
    </div>
  );
}

function FaceSide({
  up,
  matched,
  face,
  fade,
  flipped,
}: {
  up: boolean;
  matched: boolean;
  face: FaceId;
  fade?: boolean;
  flipped?: boolean;
}) {
  return (
    <span
      className={`absolute inset-0 rounded-2xl p-[14%] ${flipped ? 'mm-side' : ''} ${fade ? `mm-fade ${up ? 'opacity-100' : 'opacity-0'}` : ''}`}
      style={{
        transform: flipped ? 'rotateY(180deg)' : undefined,
        background: matched ? '#f0fdf4' : '#ffffff',
        boxShadow: matched
          ? `0 0 0 3px ${ACCENT}, 0 3px 0 #bbf7d0`
          : '0 0 0 1px rgba(15,23,42,.08), 0 3px 0 #e2e8f0',
      }}
    >
      <Face id={face} />
    </span>
  );
}
