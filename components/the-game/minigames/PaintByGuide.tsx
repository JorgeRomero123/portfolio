'use client';

// Pinta con guía: a pre-sketched landscape on an easel, 18 pencil areas in 12 paints, each with a
// small colour hint (like a guided workshop). Pick a paint, tap an area to brush it in. A wrong colour
// still fills (marked, repaintable) and costs 2 s. Win = every area in its colour before the 40 s run out.
// Mouse, touch and keyboard: arrows move between areas (roving focus), 1–9 0 - = or [ ] pick, Enter paints.
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import type { MiniGameProps } from '../types';
import { KEY_ORDER, PAINTS, REGIONS, brushPath } from './paintbyguide/scene';

const TIME = 40; // seconds
const PAINT_KEYS = '1234567890-='; // one key per paint, in palette order
const PENALTY = 2; // seconds per wrong stroke
const N = REGIONS.length;
const ACCENT = '#ec4899';
const PAPER = '#fffdf8';

const T = {
  en: {
    time: 'Time',
    painted: (n: number) => `${n}/${N} painted`,
    keys: '1–9 0 - = or [ ] pick a paint · Arrows move · Enter paints',
    touch: 'Pick a paint, then tap the areas with the same number.',
    clock: 'The clock starts with your first brushstroke.',
    canvas: `Canvas with ${N} pencil-sketched areas`,
    palette: 'Paints',
    paint: (n: number, name: string) => `Paint ${n}: ${name}`,
    region: (name: string, need: string, n: number, state: string) => `${name}, needs ${need} (${n}), ${state}`,
    empty: 'currently empty',
    right: (c: string) => `painted ${c}, correct`,
    wrong: (c: string) => `painted ${c}, wrong colour`,
    picked: (c: string) => `${cap(c)} on your brush.`,
    good: (r: string, done: number) => `${cap(r)}, done. ${done} of ${N}.`,
    oops: (r: string, need: string, c: string) => `Oops, ${r} needs ${need}, not ${c}. −${PENALTY} s.`,
    same: 'Already that colour.',
    tenLeft: '10 seconds left.',
    win: 'Your first painting!',
    winSub: (s: number) => `${N}/${N} with ${s} s to spare`,
    lose: (n: number) => `Time! ${n}/${N} painted.`,
    loseSub: 'There’s always a second canvas.',
    time_left: 'Time left',
  },
  es: {
    time: 'Tiempo',
    painted: (n: number) => `${n}/${N} pintadas`,
    keys: '1–9 0 - = o [ ] para elegir pintura · Flechas para moverte · Enter para pintar',
    touch: 'Elige una pintura y toca las áreas con el mismo número.',
    clock: 'El reloj arranca con tu primera pincelada.',
    canvas: `Lienzo con ${N} áreas bocetadas a lápiz`,
    palette: 'Pinturas',
    paint: (n: number, name: string) => `Pintura ${n}: ${name}`,
    region: (name: string, need: string, n: number, state: string) => `${name}, va en ${need} (${n}), ${state}`,
    empty: 'aún sin pintar',
    right: (c: string) => `ahora con ${c}, correcto`,
    wrong: (c: string) => `ahora con ${c}, color equivocado`,
    picked: (c: string) => `${cap(c)} en tu pincel.`,
    good: (r: string, done: number) => `${cap(r)}, ¡perfecto! ${done} de ${N}.`,
    oops: (r: string, need: string, c: string) => `Uy, ${r} va en ${need}, no en ${c}. −${PENALTY} s.`,
    same: 'Ya tiene ese color.',
    tenLeft: 'Quedan 10 segundos.',
    win: '¡Tu primera pintura!',
    winSub: (s: number) => `${N}/${N} y te sobraron ${s} s`,
    lose: (n: number) => `¡Se acabó el tiempo! Pintaste ${n}/${N}.`,
    loseSub: 'Siempre hay un segundo lienzo.',
    time_left: 'Tiempo restante',
  },
};

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface Cell {
  cur: number | null;
  prev: number | null;
  /** Stroke counter: remounts the brush layer so the animation replays on every repaint. */
  n: number;
}

type Phase = 'play' | 'won' | 'lost';

// --- sound: one lazily created context, tiny synth blips -------------------------------
type Blip = 'pick' | 'paint' | 'wrong' | 'win' | 'lose';
const NOTES: Record<Blip, [number, number][]> = {
  pick: [[620, 0]],
  paint: [
    [660, 0],
    [880, 0.06],
  ],
  wrong: [[196, 0]],
  win: [
    [659, 0],
    [784, 0.1],
    [988, 0.2],
    [1319, 0.32],
  ],
  lose: [
    [330, 0],
    [247, 0.14],
  ],
};
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
        for (const [freq, at] of NOTES[kind]) {
          const o = c.createOscillator();
          const g = c.createGain();
          const t0 = c.currentTime + at;
          o.type = kind === 'wrong' || kind === 'lose' ? 'sine' : 'triangle';
          o.frequency.value = freq;
          const peak = kind === 'pick' ? 0.035 : 0.07;
          g.gain.setValueAtTime(0.0001, t0);
          g.gain.exponentialRampToValueAtTime(peak, t0 + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + (kind === 'pick' ? 0.08 : 0.2));
          o.connect(g).connect(c.destination);
          o.start(t0);
          o.stop(t0 + 0.24);
        }
      } catch {
        // no audio available
      }
    },
    [soundOn],
  );
}

const BLOB = 'M24 4C36 3 45 12 44 24C44 36 35 45 23 44C11 44 3 35 4 23C5 12 12 5 24 4Z';
const SPARKS: [number, number, number, number][] = [
  // x, y (easel coords), size, delay ms
  [30, 30, 15, 0],
  [334, 44, 17, 160],
  [346, 222, 12, 320],
  [16, 196, 13, 480],
  [216, 12, 11, 640],
  [120, 252, 10, 800],
];

export default function PaintByGuide({ lang, reducedMotion, soundOn, onFinish }: MiniGameProps) {
  const t = T[lang];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const blip = useBlips(soundOn);

  const [cells, setCells] = useState<Cell[]>(() => REGIONS.map(() => ({ cur: null, prev: null, n: 0 })));
  const [brush, setBrush] = useState(0);
  const [cursor, setCursor] = useState(KEY_ORDER[0]);
  const [kbFocus, setKbFocus] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('play');
  const [started, setStarted] = useState(false);
  const [left, setLeft] = useState(TIME * 1000);
  const [mistakes, setMistakes] = useState(0);
  const [penaltyKey, setPenaltyKey] = useState(0);
  const [live, setLive] = useState('');
  const [endInfo, setEndInfo] = useState({ secs: 0, done: 0 });

  const regionRefs = useRef<(SVGPathElement | null)[]>([]);
  const deadline = useRef(0);
  const phaseRef = useRef<Phase>('play');
  const finished = useRef(false);
  const warned = useRef(false);
  const endTimer = useRef<number | undefined>(undefined);
  const mistakesRef = useRef(0);
  const doneRef = useRef(0);

  const correctCount = cells.filter((c, i) => c.cur === REGIONS[i].need).length;

  // Focus the first area once the host dialog has settled (see host quirk: it may grab Skip).
  useEffect(() => {
    const first = () => regionRefs.current[KEY_ORDER[0]];
    const raf = requestAnimationFrame(() => first()?.focus({ preventScroll: true }));
    const to = window.setTimeout(() => {
      const a = document.activeElement as HTMLElement | null;
      if (!a || a === document.body || a.dataset?.testid === 'skip-minigame') first()?.focus({ preventScroll: true });
    }, 400);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(to);
      window.clearTimeout(endTimer.current);
    };
  }, []);

  const end = useCallback(
    (won: boolean, done: number) => {
      if (phaseRef.current !== 'play') return;
      phaseRef.current = won ? 'won' : 'lost';
      // The palette unmounts at the end; keep focus inside the game instead of dropping to <body>.
      if ((document.activeElement as HTMLElement | null)?.hasAttribute('aria-pressed')) {
        regionRefs.current[KEY_ORDER[0]]?.focus({ preventScroll: true });
      }
      setPhase(phaseRef.current);
      const rem = Math.max(0, deadline.current - performance.now());
      const secs = Math.ceil(rem / 1000);
      setEndInfo({ secs, done });
      if (!won) setLeft(0);
      blip(won ? 'win' : 'lose');
      const score = won
        ? Math.round(
            Math.max(
              40,
              Math.min(
                100,
                50 + Math.min(40, (80 * rem) / (TIME * 1000)) + (mistakesRef.current ? 0 : 10) - 6 * mistakesRef.current,
              ),
            ),
          )
        : Math.round(Math.min(44, (44 * done) / N));
      setLive(won ? `${t.win} ${t.winSub(secs)}` : t.lose(done));
      endTimer.current = window.setTimeout(
        () => {
          if (finished.current) return;
          finished.current = true;
          onFinish({ won, score });
        },
        won ? 2200 : 1500,
      );
    },
    [blip, onFinish, t],
  );

  const start = useCallback(() => {
    if (started) return;
    deadline.current = performance.now() + TIME * 1000;
    setStarted(true);
  }, [started]);

  // Clock.
  useEffect(() => {
    if (!started || phase !== 'play') return;
    const id = window.setInterval(() => {
      const rem = deadline.current - performance.now();
      setLeft(Math.max(0, rem));
      if (!warned.current && rem <= 10_000 && rem > 0) {
        warned.current = true;
        setLive(t.tenLeft);
      }
      if (rem <= 0) {
        end(false, doneRef.current);
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [started, phase, end, t]);

  const pick = useCallback(
    (i: number) => {
      if (phaseRef.current !== 'play') return;
      const p = ((i % PAINTS.length) + PAINTS.length) % PAINTS.length;
      setBrush(p);
      setLive(t.picked(PAINTS[p].name[lang]));
      blip('pick');
    },
    [blip, lang, t],
  );

  const paint = (i: number) => {
    if (phaseRef.current !== 'play') return;
    const r = REGIONS[i];
    if (cells[i].cur === brush) {
      setLive(t.same);
      return;
    }
    start();
    const ok = brush === r.need;
    const next = cells.map((c, j) => (j === i ? { cur: brush, prev: c.cur, n: c.n + 1 } : c));
    setCells(next);
    const done = next.filter((c, j) => c.cur === REGIONS[j].need).length;
    doneRef.current = done;
    if (ok) {
      blip('paint');
      setLive(t.good(r.the[lang], done));
      if (done === N) end(true, done);
    } else {
      blip('wrong');
      deadline.current -= PENALTY * 1000;
      mistakesRef.current += 1;
      setMistakes(mistakesRef.current);
      setPenaltyKey((k) => k + 1);
      setLive(t.oops(r.the[lang], PAINTS[r.need].name[lang], PAINTS[brush].name[lang]));
    }
  };

  const moveTo = (i: number) => {
    setCursor(i);
    regionRefs.current[i]?.focus({ preventScroll: true });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const paintKey = e.key.length === 1 ? PAINT_KEYS.indexOf(e.key) : -1;
    if (paintKey >= 0 && paintKey < PAINTS.length) {
      e.preventDefault();
      pick(paintKey);
      return;
    }
    if (e.key === '[' || e.key === ']') {
      e.preventDefault();
      pick(brush + (e.key === ']' ? 1 : -1));
      return;
    }
    const target = e.target as Element;
    if (!target.hasAttribute('data-region')) return;
    const k = KEY_ORDER.indexOf(cursor);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      moveTo(KEY_ORDER[(k + 1) % N]);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      moveTo(KEY_ORDER[(k - 1 + N) % N]);
    } else if (e.key === 'Home') {
      e.preventDefault();
      moveTo(KEY_ORDER[0]);
    } else if (e.key === 'End') {
      e.preventDefault();
      moveTo(KEY_ORDER[N - 1]);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!e.repeat) {
        setKbFocus(true);
        paint(cursor);
      }
    }
  };

  const playing = phase === 'play';
  const won = phase === 'won';
  const anim = !reducedMotion;
  const secsLeft = Math.ceil(left / 1000);
  const frac = left / (TIME * 1000);
  const pencil = won ? 0 : 1;

  const regionLabel = (i: number) => {
    const r = REGIONS[i];
    const c = cells[i].cur;
    const state = c === null ? t.empty : c === r.need ? t.right(PAINTS[c].name[lang]) : t.wrong(PAINTS[c].name[lang]);
    return t.region(r.name[lang], PAINTS[r.need].name[lang], r.need + 1, state);
  };

  return (
    <div className="flex h-full min-h-[460px] flex-col gap-2 p-3 sm:gap-3 sm:p-5" onKeyDown={onKeyDown}>
      <style>{`
        @keyframes pbg-brush { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
        @keyframes pbg-settle { 0%, 75% { opacity: 0 } 100% { opacity: 1 } }
        @keyframes pbg-spark { 0% { transform: scale(0) rotate(0deg); opacity: 0 } 45% { transform: scale(1) rotate(45deg); opacity: 1 } 100% { transform: scale(0) rotate(90deg); opacity: 0 } }
        @keyframes pbg-pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.45 } }
        @keyframes pbg-pop { from { transform: translateY(8px) scale(0.96); opacity: 0 } to { transform: none; opacity: 1 } }
        @keyframes pbg-float { from { transform: translateY(0); opacity: 1 } to { transform: translateY(-14px); opacity: 0 } }
        .pbg-brush { animation: pbg-brush var(--pbg-d) cubic-bezier(.45,.05,.4,1) both }
        .pbg-settle { animation: pbg-settle var(--pbg-d) linear both }
        .pbg-spark { transform-box: fill-box; transform-origin: center; animation: pbg-spark 1.1s ease-out both infinite }
        .pbg-pulse { animation: pbg-pulse 1.2s ease-in-out infinite }
        .pbg-pop { animation: pbg-pop .35s cubic-bezier(.22,1,.36,1) both }
        .pbg-float { animation: pbg-float .9s ease-out both }
      `}</style>

      {/* Status: painted count, clock bar, seconds */}
      <div className="flex items-center gap-3">
        <p className="shrink-0 text-sm font-semibold text-gray-900" aria-hidden>
          {t.painted(correctCount)}
        </p>
        <div
          className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-pink-100"
          role="img"
          aria-label={`${t.time_left}: ${secsLeft} s`}
        >
          <div
            className="h-full origin-left rounded-full"
            style={{
              background: frac < 0.29 ? '#e11d48' : ACCENT,
              transform: `scaleX(${frac})`,
              transition: anim ? 'transform 100ms linear' : undefined,
            }}
          />
        </div>
        <p className="relative w-12 shrink-0 text-right font-mono text-sm font-bold tabular-nums text-gray-900" aria-hidden>
          {secsLeft}s
          {penaltyKey > 0 && playing && (
            <span
              key={penaltyKey}
              className={`absolute -top-3 right-0 text-xs text-rose-600 ${anim ? 'pbg-float' : 'opacity-0'}`}
            >
              −{PENALTY}s
            </span>
          )}
        </p>
      </div>

      {/* Easel + canvas */}
      <div className="relative min-h-0 flex-1">
        <svg
          viewBox="0 0 360 300"
          className="absolute inset-0 h-full w-full select-none"
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => e.preventDefault()}
          onPointerLeave={() => setHover(null)}
        >
          <defs>
            {REGIONS.map((r) => (
              <clipPath key={r.id} id={`${uid}-c-${r.id}`}>
                <path d={r.d} />
              </clipPath>
            ))}
            <pattern
              id={`${uid}-bristle`}
              width="14"
              height="9"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(-14)"
            >
              <path d="M0 1.5H8M5 5.5H14M1 8H6" stroke="#fff" strokeOpacity="0.18" strokeWidth="0.9" />
              <path d="M3 3.4H12M0 7H4M9 7.4H14" stroke="#000" strokeOpacity="0.07" strokeWidth="0.7" />
            </pattern>
          </defs>

          {/* Easel legs */}
          <g aria-hidden stroke="#a07850" strokeWidth="1.2" fill="#d6b48c">
            <path d="M176 4H184L186 298H174Z" fill="#c9a57c" />
            <path d="M172 6L182 8L78 298H64Z" />
            <path d="M178 8L188 6L296 298H282Z" />
            <rect x="170" y="2" width="20" height="10" rx="3" />
          </g>

          {/* Canvas */}
          <rect x="24" y="25" width="320" height="240" rx="3" fill="#0f172a" opacity="0.1" aria-hidden />
          <g transform="translate(20 20)">
            <rect width="320" height="240" rx="2" fill={PAPER} aria-hidden />

            {/* Paint + pencil, painter's order */}
            <g aria-hidden>
              {REGIONS.map((r, i) => {
                const c = cells[i];
                const dur = `${Math.round(Math.min(800, Math.max(320, 300 + (r.box[2] * r.box[3]) / 120)))}ms`;
                const bw = r.id === 'sky' || r.id === 'shore' ? 34 : 24;
                return (
                  <g key={r.id}>
                    <g clipPath={`url(#${uid}-c-${r.id})`}>
                      <path d={r.d} fill={PAPER} />
                      {c.prev !== null && <path d={r.d} fill={PAINTS[c.prev].hex} />}
                      {c.cur !== null && (
                        <g key={c.n} style={{ ['--pbg-d' as string]: dur }}>
                          <path d={r.d} fill={PAINTS[c.cur].hex} className={anim ? 'pbg-settle' : undefined} />
                          {anim && (
                            <path
                              d={brushPath(r.box, bw)}
                              pathLength={1}
                              fill="none"
                              stroke={PAINTS[c.cur].hex}
                              strokeWidth={bw}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeDasharray="1 1"
                              className="pbg-brush"
                            />
                          )}
                          <path d={r.d} fill={`url(#${uid}-bristle)`} />
                        </g>
                      )}
                    </g>
                    {!won && c.cur !== null && c.cur !== r.need && (
                      <path
                        d={r.d}
                        fill="none"
                        stroke="#e11d48"
                        strokeWidth="2.5"
                        strokeDasharray="5 4"
                        clipPath={`url(#${uid}-c-${r.id})`}
                      />
                    )}
                    {r.id !== 'sky' && (
                      <path
                        d={r.d}
                        fill="none"
                        stroke="#6b7280"
                        strokeWidth="1.1"
                        strokeLinejoin="round"
                        opacity={pencil * (c.cur === null ? 0.7 : 0.22)}
                        style={{ transition: anim ? 'opacity 400ms' : undefined }}
                      />
                    )}
                  </g>
                );
              })}
            </g>

            {/* Wrong-colour marks and colour hints */}
            {!won && (
              <g aria-hidden>
                {REGIONS.map((r, i) => {
                  const c = cells[i].cur;
                  if (c === r.need) return null;
                  const wrong = c !== null;
                  const p = PAINTS[r.need];
                  return (
                    <g key={r.id}>
                      <g transform={`translate(${r.hint[0]} ${r.hint[1]})`}>
                        {wrong && (
                          <circle
                            r="12.5"
                            fill="#fff"
                            stroke="#e11d48"
                            strokeWidth="2"
                            className={anim ? 'pbg-pulse' : undefined}
                          />
                        )}
                        <circle r="9" fill={p.hex} stroke="#fff" strokeWidth="1.6" />
                        <text
                          y="3.6"
                          textAnchor="middle"
                          fontSize={r.need >= 9 ? 9 : 10.5}
                          fontWeight="700"
                          fill={p.ink}
                          style={{ fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' }}
                        >
                          {r.need + 1}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>
            )}

            {/* Interactive areas (roving tabindex), in painter's order so taps hit the topmost */}
            <g role="group" aria-label={t.canvas}>
              {REGIONS.map((r, i) => (
                <path
                  key={r.id}
                  ref={(el) => {
                    regionRefs.current[i] = el;
                  }}
                  d={r.d}
                  data-region={r.id}
                  data-autofocus={i === KEY_ORDER[0] ? '' : undefined}
                  role="button"
                  tabIndex={i === cursor ? 0 : -1}
                  aria-label={regionLabel(i)}
                  aria-disabled={!playing || undefined}
                  fill="transparent"
                  stroke="transparent"
                  strokeWidth={r.hitPad ?? 0}
                  pointerEvents="all"
                  className={`outline-none ${playing ? 'cursor-pointer' : ''}`}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    if (!playing) return;
                    setKbFocus(false);
                    setCursor(i);
                    paint(i);
                  }}
                  onPointerEnter={(e) => {
                    if (e.pointerType === 'mouse') setHover(i);
                  }}
                  onFocus={(e) => {
                    setCursor(i);
                    setKbFocus(e.currentTarget.matches(':focus-visible'));
                  }}
                  onBlur={() => setKbFocus(false)}
                />
              ))}
            </g>

            {/* Hover (mouse) and keyboard focus outlines */}
            {playing && hover !== null && hover !== (kbFocus ? cursor : -1) && (
              <path
                d={REGIONS[hover].d}
                fill="none"
                stroke={PAINTS[brush].hex}
                strokeWidth="3"
                strokeDasharray="6 4"
                pointerEvents="none"
                aria-hidden
                clipPath={`url(#${uid}-c-${REGIONS[hover].id})`}
              />
            )}
            {playing && kbFocus && (
              <g pointerEvents="none" aria-hidden clipPath={`url(#${uid}-c-${REGIONS[cursor].id})`}>
                <path d={REGIONS[cursor].d} fill="none" stroke="#fff" strokeWidth="8" />
                <path d={REGIONS[cursor].d} fill="none" stroke="#0070f3" strokeWidth="4.5" />
              </g>
            )}

            <rect width="320" height="240" rx="2" fill="none" stroke="#d1d5db" strokeWidth="1" aria-hidden />
            {won && (
              <rect
                x="-5"
                y="-5"
                width="330"
                height="250"
                rx="4"
                fill="none"
                stroke="#b98b5e"
                strokeWidth="7"
                className={anim ? 'pbg-pop' : undefined}
                aria-hidden
              />
            )}
          </g>

          {/* Ledge with the loaded brush */}
          <g aria-hidden>
            <rect x="8" y="262" width="344" height="12" rx="3" fill="#c9a57c" stroke="#a07850" strokeWidth="1.2" />
            <g transform="translate(24 256)">
              <rect x="0" y="0" width="70" height="6" rx="3" fill="#374151" />
              <rect x="68" y="-0.5" width="14" height="7" rx="1" fill="#cbd5e1" />
              <path d="M82 -1.5Q96 3 82 7.5Z" fill={PAINTS[brush].hex} stroke="#0f172a" strokeOpacity="0.25" />
            </g>
          </g>

          {/* Gallery sparkle */}
          {won && anim && (
            <g aria-hidden fill={ACCENT}>
              {SPARKS.map(([x, y, s, delay], i) => (
                <path
                  key={i}
                  className="pbg-spark"
                  style={{ animationDelay: `${delay}ms` }}
                  d={`M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z`}
                  fill={i % 2 ? '#f6c343' : ACCENT}
                />
              ))}
            </g>
          )}
        </svg>
      </div>

      {/* Palette, or the gallery label at the end */}
      {playing ? (
        <div className="flex flex-col items-center gap-1.5">
          <div
            role="group"
            aria-label={t.palette}
            className="grid grid-cols-6 justify-items-center gap-x-1.5 gap-y-1 rounded-2xl bg-gray-50 px-2 py-1.5 ring-1 ring-gray-100 sm:gap-x-2.5 sm:px-3"
          >
            {PAINTS.map((p, i) => {
              const on = brush === i;
              return (
                <button
                  key={p.hex}
                  type="button"
                  aria-pressed={on}
                  aria-label={t.paint(i + 1, p.name[lang])}
                  onClick={() => pick(i)}
                  className={`relative flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070f3] focus-visible:ring-offset-2 ${
                    on ? '-translate-y-1' : 'hover:-translate-y-0.5'
                  }`}
                >
                  <svg viewBox="0 0 48 48" className="h-10 w-10" aria-hidden>
                    <path
                      d={BLOB}
                      fill={p.hex}
                      stroke="#0f172a"
                      strokeOpacity={on ? 0.9 : 0.12}
                      strokeWidth={on ? 2.5 : 1}
                      style={{ transform: `rotate(${i * 57}deg)`, transformOrigin: '24px 24px' }}
                    />
                    <ellipse cx="17" cy="16" rx="6" ry="3.5" fill="#fff" opacity="0.35" transform="rotate(-30 17 16)" />
                    <text
                      x="24"
                      y="29"
                      textAnchor="middle"
                      fontSize={i >= 9 ? 12.5 : 14}
                      fontWeight="700"
                      fill={p.ink}
                      style={{ fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' }}
                    >
                      {i + 1}
                    </text>
                  </svg>
                  {on && (
                    <span
                      className="absolute -bottom-1.5 h-1.5 w-5 rounded-full"
                      style={{ background: '#0070f3' }}
                      aria-hidden
                    />
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-center text-xs text-gray-600">
            {!started ? (
              <span className="font-medium text-pink-700">{t.clock} </span>
            ) : null}
            <span className="pointer-coarse:hidden">{t.keys}</span>
            <span className="hidden pointer-coarse:inline">{started ? t.touch : ''}</span>
          </p>
        </div>
      ) : (
        <div className="flex min-h-[124px] items-center justify-center">
          <div
            className={`rounded-2xl bg-white px-5 py-2.5 text-center shadow-md ring-1 ${
              won ? 'ring-pink-200' : 'ring-gray-200'
            } ${anim ? 'pbg-pop' : ''}`}
          >
            <p className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
              {won ? t.win : t.lose(endInfo.done)}
            </p>
            <p className="text-sm text-gray-600">
              {won ? t.winSub(endInfo.secs) : t.loseSub}
              {won && mistakes === 0 ? ' ✦' : ''}
            </p>
          </div>
        </div>
      )}

      <p aria-live="polite" className="sr-only">
        {live}
      </p>
    </div>
  );
}
