'use client';

import { useRef, useState } from 'react';
import { THEMES, type Theme } from './themes';

const INK = '#1B1B1B';
const PAPER = '#F4EDE1';
const SLICE_COLORS = ['#D98580', '#B8B6EA', '#E5A23C', '#6C7DE0', '#F0C49B', '#3F8F45'];

const SIZE = 320;
const R = SIZE / 2 - 6;
const C = SIZE / 2;

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

export default function Ruleta() {
  const n = THEMES.length;
  const slice = 360 / n;
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Theme | null>(null);
  const pending = useRef<number | null>(null);

  const [duration, setDuration] = useState(4200);

  function spin() {
    if (spinning) return;
    // Se lee al girar (no en el render) para no desajustar la hidratación.
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    setDuration(reducedMotion ? 600 : 4200);
    const index = Math.floor(Math.random() * n);
    const jitter = (Math.random() - 0.5) * slice * 0.7;
    // Rotación (mod 360) que deja el centro de la rebanada bajo la flecha de arriba.
    const target = (((-(index + 0.5) * slice + jitter) % 360) + 360) % 360;
    const current = ((rotation % 360) + 360) % 360;
    const delta = (target - current + 360) % 360;
    pending.current = index;
    setResult(null);
    setSpinning(true);
    setRotation(rotation + 360 * (reducedMotion ? 1 : 6) + delta);
  }

  function onSpinEnd() {
    if (pending.current === null) return;
    setResult(THEMES[pending.current]);
    pending.current = null;
    setSpinning(false);
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="relative" style={{ width: SIZE, maxWidth: '100%' }}>
        {/* Flecha */}
        <div className="absolute left-1/2 -top-3 z-10 -translate-x-1/2" aria-hidden>
          <svg width="36" height="40" viewBox="0 0 36 40">
            <path d="M18 38 L4 6 Q18 -2 32 6 Z" fill="#D98580" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          </svg>
        </div>

        <div
          className="rounded-full"
          style={{ boxShadow: `6px 6px 0 ${INK}` }}
        >
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="block w-full h-auto"
            role="img"
            aria-label={`Ruleta con ${n} opciones: ${THEMES.map((t) => t.label).join(', ')}`}
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: `transform ${duration}ms cubic-bezier(0.12, 0.7, 0.12, 1)`,
            }}
            onTransitionEnd={onSpinEnd}
          >
            <circle cx={C} cy={C} r={SIZE / 2} fill={INK} />
            {THEMES.map((t, i) => {
              const start = i * slice;
              const mid = start + slice / 2;
              return (
                <g key={`${t.group}-${t.short}`}>
                  <path
                    d={n === 1 ? `M ${C} ${C - R} A ${R} ${R} 0 1 1 ${C - 0.01} ${C - R} Z` : slicePath(start, start + slice)}
                    fill={sliceColor(i, n)}
                    stroke={INK}
                    strokeWidth="3"
                    strokeLinejoin="round"
                  />
                  <g transform={`rotate(${mid} ${C} ${C})`}>
                    <text
                      x={C}
                      y={C - R * (n > 12 ? 0.86 : 0.84)}
                      textAnchor="middle"
                      fontSize={n > 12 ? 15 : 22}
                    >
                      {t.emoji}
                    </text>
                    <text
                      transform={`rotate(-90 ${C} ${C})`}
                      x={C + R * (n > 12 ? 0.74 : 0.66)}
                      y={C}
                      textAnchor="end"
                      dominantBaseline="middle"
                      fontSize={n > 12 ? (t.short.length > 9 ? 9.5 : 11) : t.short.length > 8 ? 14 : 17}
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

      <button
        type="button"
        onClick={spin}
        disabled={spinning}
        className="rounded-lg border-[3px] border-[#1B1B1B] bg-[#E5A23C] px-10 py-4 text-2xl font-bold text-[#1B1B1B] shadow-[4px_4px_0_#1B1B1B] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1B1B1B] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-60 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_#1B1B1B] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#6C7DE0]"
        style={{ fontFamily: 'var(--font-abi-display), sans-serif' }}
      >
        {spinning ? 'Girando…' : result ? '¡Otra vez!' : '¡Girar!'}
      </button>

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
