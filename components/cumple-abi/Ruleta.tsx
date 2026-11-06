'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { THEMES, THEME_IDS, type Theme } from './themes';

const INK = '#1B1B1B';
const PAPER = '#F4EDE1';
const SLICE_COLORS = ['#D98580', '#B8B6EA', '#E5A23C', '#6C7DE0', '#F0C49B', '#3F8F45'];

const SIZE = 320;
const R = SIZE / 2 - 6;
const C = SIZE / 2;

const LOCAL_KEY = 'cumple-abi:salieron';
const API = '/api/cumple-abi';

function polar(angleDeg: number, radius: number) {
  // 0° = arriba, sentido horario.
  const a = ((angleDeg - 90) * Math.PI) / 180;
  // Redondeado: servidor y navegador difieren en el último decimal y rompen la hidratación.
  const round = (v: number) => Math.round(v * 100) / 100;
  return [round(C + radius * Math.cos(a)), round(C + radius * Math.sin(a))];
}

function slicePath(start: number, end: number) {
  const [x1, y1] = polar(start, R);
  const [x2, y2] = polar(end, R);
  const large = end - start > 180 ? 1 : 0;
  return `M ${C} ${C} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`;
}

function sliceColor(i: number, n: number) {
  // Evita que la última rebanada repita color con la primera.
  const color = SLICE_COLORS[i % SLICE_COLORS.length];
  if (i === n - 1 && n > 1 && color === SLICE_COLORS[0]) return SLICE_COLORS[2];
  return color;
}

/** Tamaños de texto según cuántas rebanadas quedan. */
function sizing(n: number, label: string) {
  if (n <= 12) return { emoji: 22, emojiAt: 0.84, text: label.length > 8 ? 14 : 17, textAt: 0.66 };
  if (n <= 20) return { emoji: 15, emojiAt: 0.86, text: label.length > 9 ? 9.5 : 11, textAt: 0.74 };
  return { emoji: 12, emojiAt: 0.88, text: label.length > 9 ? 7.5 : 9, textAt: 0.77 };
}

/** Lo que se ve en la ruleta: lo que no ha salido, más el último resultado (hasta el siguiente giro). */
const onWheel = (taken: Set<string>, keep?: string) =>
  THEMES.filter((t) => !taken.has(t.id) || t.id === keep);

function readLocal(): Set<string> {
  try {
    const ids = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]') as unknown;
    return new Set(Array.isArray(ids) ? ids.filter((id) => typeof id === 'string' && THEME_IDS.has(id)) : []);
  } catch {
    return new Set();
  }
}

function writeLocal(taken: Set<string>) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify([...taken]));
  } catch {
    /* sin almacenamiento: solo dura mientras la página esté abierta */
  }
}

export default function Ruleta() {
  const [taken, setTaken] = useState<Set<string>>(() => new Set());
  // 'shared': Supabase lleva la cuenta para todos. 'local': cada celular la suya.
  const [mode, setMode] = useState<'loading' | 'shared' | 'local'>('loading');
  const [current, setCurrent] = useState<Theme | null>(null);
  const [result, setResult] = useState<Theme | null>(null);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [duration, setDuration] = useState(4200);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const wheel = onWheel(taken, current?.id);
  const n = wheel.length;
  const slice = 360 / Math.max(n, 1);
  const remaining = THEMES.length - taken.size;

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(API, { cache: 'no-store' });
      if (!res.ok) throw new Error();
      const { salieron } = (await res.json()) as { salieron: string[] };
      if (!busy.current) setTaken(new Set(salieron));
      setMode('shared');
    } catch {
      // Si ya estábamos compartiendo, un fallo de red no borra lo que sabemos.
      if (modeRef.current !== 'shared') {
        setTaken(readLocal());
        setMode('local');
      }
    }
  }, []);

  // Carga inicial y, en modo compartido, se pone al día con lo que giran los demás.
  useEffect(() => {
    refresh();
    const id = setInterval(() => {
      if (!busy.current && document.visibilityState === 'visible') refresh();
    }, 8000);
    return () => clearInterval(id);
  }, [refresh]);

  async function pick(): Promise<{ id: string; taken: Set<string> } | 'agotadas'> {
    if (mode === 'shared') {
      try {
        const res = await fetch(API, { method: 'POST' });
        const body = (await res.json()) as { opcion?: string; salieron?: string[]; agotadas?: boolean };
        if (body.agotadas) {
          setTaken(new Set(body.salieron));
          return 'agotadas';
        }
        if (res.ok && body.opcion && body.salieron) return { id: body.opcion, taken: new Set(body.salieron) };
        if (res.status === 429 || res.status === 409) throw new Error('retry');
      } catch (e) {
        if ((e as Error).message === 'retry') throw e;
      }
      // El servidor dejó de responder: seguimos en este celular.
      setMode('local');
    }
    const left = THEMES.filter((t) => !taken.has(t.id));
    if (left.length === 0) return 'agotadas';
    const id = left[Math.floor(Math.random() * left.length)].id;
    const next = new Set(taken).add(id);
    writeLocal(next);
    return { id, taken: next };
  }

  async function spin() {
    if (busy.current) return;
    busy.current = true;
    setError(null);
    setResult(null);
    setSpinning(true);

    let outcome: Awaited<ReturnType<typeof pick>>;
    try {
      outcome = await pick();
    } catch {
      setError('Hubo un empujón en la fila, ¡gira otra vez!');
      busy.current = false;
      setSpinning(false);
      return;
    }
    if (outcome === 'agotadas') {
      setCurrent(null);
      busy.current = false;
      setSpinning(false);
      return;
    }

    const theme = THEMES.find((t) => t.id === outcome.id)!;
    const list = onWheel(outcome.taken, theme.id);
    const index = list.indexOf(theme);
    const s = 360 / list.length;
    // Se lee al girar (no en el render) para no desajustar la hidratación.
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const jitter = (Math.random() - 0.5) * s * 0.6;
    // Rotación (mod 360) que deja el centro de la rebanada bajo la flecha de arriba.
    const target = (((-(index + 0.5) * s + jitter) % 360) + 360) % 360;
    const now = ((rotation % 360) + 360) % 360;
    const delta = (target - now + 360) % 360;

    setTaken(outcome.taken);
    setCurrent(theme);
    setDuration(reducedMotion ? 600 : 4200);
    setRotation(rotation + 360 * (reducedMotion ? 1 : 6) + delta);
  }

  function onSpinEnd() {
    if (!busy.current) return;
    setResult(current);
    busy.current = false;
    setSpinning(false);
  }

  async function restart() {
    if (mode === 'shared') {
      try {
        const res = await fetch(API, { method: 'DELETE' });
        if (res.ok) {
          setTaken(new Set());
          setCurrent(null);
          setResult(null);
          return;
        }
      } catch {
        /* abajo */
      }
      refresh();
      return;
    }
    writeLocal(new Set());
    setTaken(new Set());
    setCurrent(null);
    setResult(null);
  }

  const exhausted = remaining === 0 && !spinning;

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="font-mono text-xs font-bold uppercase tracking-widest">
        {mode === 'loading' ? '…' : `Quedan ${remaining} de ${THEMES.length}`}
      </p>

      <div className="relative" style={{ width: SIZE, maxWidth: '100%' }}>
        {/* Flecha */}
        <div className="absolute left-1/2 -top-3 z-10 -translate-x-1/2" aria-hidden>
          <svg width="36" height="40" viewBox="0 0 36 40">
            <path d="M18 38 L4 6 Q18 -2 32 6 Z" fill="#D98580" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          </svg>
        </div>

        {/* overflow-hidden + pointer-events-none: al girar, las esquinas del SVG cuadrado
            salen del círculo y tapaban el botón de abajo. */}
        <div className="overflow-hidden rounded-full" style={{ boxShadow: `6px 6px 0 ${INK}` }}>
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="pointer-events-none block h-auto w-full"
            role="img"
            aria-label={`Ruleta con ${n} opciones: ${wheel.map((t) => t.label).join(', ')}`}
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: `transform ${duration}ms cubic-bezier(0.12, 0.7, 0.12, 1)`,
            }}
            onTransitionEnd={onSpinEnd}
          >
            <circle cx={C} cy={C} r={SIZE / 2} fill={INK} />
            {n === 0 && <circle cx={C} cy={C} r={R} fill={PAPER} />}
            {wheel.map((t, i) => {
              const start = i * slice;
              const mid = start + slice / 2;
              const z = sizing(n, t.short);
              return (
                <g key={t.id}>
                  <path
                    d={n === 1 ? `M ${C} ${C - R} A ${R} ${R} 0 1 1 ${C - 0.01} ${C - R} Z` : slicePath(start, start + slice)}
                    fill={sliceColor(i, n)}
                    stroke={INK}
                    strokeWidth={n > 20 ? 2 : 3}
                    strokeLinejoin="round"
                  />
                  <g transform={`rotate(${mid} ${C} ${C})`}>
                    <text x={C} y={C - R * z.emojiAt} textAnchor="middle" fontSize={z.emoji}>
                      {t.emoji}
                    </text>
                    <text
                      transform={`rotate(-90 ${C} ${C})`}
                      x={C + R * z.textAt}
                      y={C}
                      textAnchor="end"
                      dominantBaseline="middle"
                      fontSize={z.text}
                      fontWeight="700"
                      fill={INK}
                      style={{ fontFamily: 'var(--font-abi-display), sans-serif' }}
                    >
                      {t.short}
                    </text>
                  </g>
                </g>
              );
            })}
            <circle cx={C} cy={C} r="22" fill={PAPER} stroke={INK} strokeWidth="3" />
            <circle cx={C} cy={C} r="6" fill={INK} />
          </svg>
        </div>
      </div>

      {exhausted ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-xl italic">¡Ya salieron todas las opciones! 🎉</p>
          <button
            type="button"
            onClick={restart}
            className="rounded-lg border-[3px] border-[#1B1B1B] bg-[#B8B6EA] px-6 py-3 text-lg font-bold shadow-[4px_4px_0_#1B1B1B] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1B1B1B] active:translate-x-1 active:translate-y-1 active:shadow-none focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#6C7DE0]"
            style={{ fontFamily: 'var(--font-abi-display), sans-serif' }}
          >
            Empezar de nuevo
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={spin}
          disabled={spinning || mode === 'loading'}
          className="rounded-lg border-[3px] border-[#1B1B1B] bg-[#E5A23C] px-10 py-4 text-2xl font-bold text-[#1B1B1B] shadow-[4px_4px_0_#1B1B1B] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1B1B1B] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-60 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_#1B1B1B] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#6C7DE0]"
          style={{ fontFamily: 'var(--font-abi-display), sans-serif' }}
        >
          {spinning ? 'Girando…' : result ? '¡Otra vez!' : '¡Girar!'}
        </button>
      )}

      {error && <p className="text-base italic text-[#B4433D]">{error}</p>}

      <div aria-live="polite" className="mb-8 min-h-[9rem] w-full max-w-sm">
        {result && (
          <div className="abi-pop -rotate-1 rounded-lg border-[3px] border-[#1B1B1B] bg-white p-5 text-center shadow-[5px_5px_0_#1B1B1B]">
            <p className="font-mono text-xs uppercase tracking-widest text-[#1B1B1B]/70">Te tocó · {result.group}</p>
            <p className="mt-1 text-4xl font-bold" style={{ fontFamily: 'var(--font-abi-display), sans-serif' }}>
              {result.emoji} {result.label}
            </p>
            <p className="mt-3 text-lg leading-snug">{result.prompt}</p>
            <p className="mt-3 text-sm text-[#1B1B1B]/70">Ahora ve al lienzo y dibújalo ✨</p>
          </div>
        )}
      </div>
    </div>
  );
}
