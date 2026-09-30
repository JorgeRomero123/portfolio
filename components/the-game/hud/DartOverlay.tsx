'use client';

// "Throw a dart": a wandering reticle over a dartboard. Hold (pointer or Space) to steady it —
// the drift shrinks gradually while held — and let go to throw. Rings: outer 1–2, middle 3–4,
// inner 5–6 (darker wedge = the higher number), bullseye = jump to any section. Missing = 1 step.
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue } from 'framer-motion';
import { STRINGS } from '../strings';
import type { Lang } from '../types';
import { Dialog, cardClass, focusRing } from './Dialog';

export type DartResult =
  | { kind: 'steps'; steps: number; ring: 'outer' | 'middle' | 'inner' | 'miss' }
  | { kind: 'bull' };

const SECTORS = 12;
const RINGS = [
  { r0: 0.7, r1: 1, lo: '#ffffff', hi: '#dbe8fd' },
  { r0: 0.4, r1: 0.7, lo: '#eef4ff', hi: '#b9d3fb' },
  { r0: 0.1, r1: 0.4, lo: '#dbe8fd', hi: '#8fb8f7' },
];
const BULL = 0.1;

export function scoreDart(nx: number, ny: number): DartResult {
  const r = Math.hypot(nx, ny);
  if (r > 1) return { kind: 'steps', steps: 1, ring: 'miss' };
  if (r <= BULL) return { kind: 'bull' };
  const a = (Math.atan2(ny, nx) + Math.PI * 2) % (Math.PI * 2);
  const hi = Math.floor(a / ((Math.PI * 2) / SECTORS)) % 2 === 1 ? 1 : 0;
  if (r <= 0.4) return { kind: 'steps', steps: 5 + hi, ring: 'inner' };
  if (r <= 0.7) return { kind: 'steps', steps: 3 + hi, ring: 'middle' };
  return { kind: 'steps', steps: 1 + hi, ring: 'outer' };
}

function wedge(r0: number, r1: number, a0: number, a1: number) {
  const R0 = r0 * 100;
  const R1 = r1 * 100;
  const p = (r: number, a: number) => `${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`;
  return `M${p(R0, a0)} L${p(R1, a0)} A${R1} ${R1} 0 0 1 ${p(R1, a1)} L${p(R0, a1)} A${R0} ${R0} 0 0 0 ${p(R0, a0)} Z`;
}

const smoothstep = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

type Phase = 'aim' | 'flying' | 'done';

export function DartOverlay({
  lang,
  reducedMotion,
  steady,
  onResult,
  onCancel,
}: {
  lang: Lang;
  reducedMotion: boolean;
  /** Bonus "steady dart": much smaller drift. */
  steady: boolean;
  onResult: (r: DartResult) => void;
  onCancel: () => void;
}) {
  const s = STRINGS[lang];
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const [phase, setPhase] = useState<Phase>('aim');
  const [hit, setHit] = useState<{ x: number; y: number; result: DartResult } | null>(null);
  const [holding, setHolding] = useState(false);
  const st = useRef({ held: false, holdT: 0, t: 0, ph: [0, 0, 0, 0] });
  const cancelBtn = useRef<HTMLButtonElement>(null);
  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  const base = steady ? 0.42 : 1.06;
  const min = steady ? 0.05 : 0.2;

  // Wandering reticle (Lissajous-ish sum of sines).
  useEffect(() => {
    if (phase !== 'aim') return;
    const S = st.current;
    S.ph = [Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28];
    S.t = Math.random() * 10;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (S.held) S.holdT += dt;
      const k = S.held ? smoothstep(S.holdT / 1.3) : 0;
      const amp = (base + (min - base) * k) * 100;
      S.t += dt * (reducedMotion ? 0.55 : 1) * (1 - 0.4 * k);
      const t = S.t;
      rx.set(amp * (0.62 * Math.sin(1.13 * t + S.ph[0]) + 0.38 * Math.sin(2.71 * t + S.ph[1])));
      ry.set(amp * (0.62 * Math.sin(1.37 * t + S.ph[2]) + 0.38 * Math.sin(2.23 * t + S.ph[3])));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, base, min, reducedMotion, rx, ry]);

  const hold = () => {
    if (phase !== 'aim' || st.current.held) return;
    st.current.held = true;
    st.current.holdT = 0;
    setHolding(true);
  };
  const release = () => {
    const S = st.current;
    if (phase !== 'aim' || !S.held) return;
    S.held = false;
    setHolding(false);
    const x = rx.get() + (Math.random() - 0.5) * 4;
    const y = ry.get() + (Math.random() - 0.5) * 4;
    setHit({ x, y, result: scoreDart(x / 100, y / 100) });
    setPhase('flying');
  };
  // Keep latest handlers for the document listeners.
  const handlers = useRef({ hold, release });
  useEffect(() => {
    handlers.current = { hold, release };
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.target === cancelBtn.current) return;
      e.preventDefault();
      if (!e.repeat) handlers.current.hold();
    };
    const up = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.target === cancelBtn.current) return;
      e.preventDefault();
      handlers.current.release();
    };
    document.addEventListener('keydown', down, true);
    document.addEventListener('keyup', up, true);
    return () => {
      document.removeEventListener('keydown', down, true);
      document.removeEventListener('keyup', up, true);
    };
  }, []);

  // flying → done → report
  useEffect(() => {
    if (phase === 'flying') {
      const id = window.setTimeout(() => setPhase('done'), reducedMotion ? 0 : 380);
      return () => window.clearTimeout(id);
    }
    if (phase === 'done' && hit) {
      const id = window.setTimeout(() => onResultRef.current(hit.result), 1300);
      return () => window.clearTimeout(id);
    }
  }, [phase, hit, reducedMotion]);

  const resultText = !hit
    ? ''
    : hit.result.kind === 'bull'
      ? s.dartBull
      : hit.result.ring === 'miss'
        ? s.dartMiss
        : s.dartSteps(hit.result.steps);

  return (
    <Dialog
      labelledBy="tg-dart-title"
      describedBy="tg-dart-desc"
      onClose={() => {
        if (phase === 'aim') onCancel();
      }}
      reducedMotion={reducedMotion}
      panelClassName={`${cardClass} w-full max-w-md p-4 sm:p-5`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="tg-dart-title" className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
          {s.dartTitle}
        </h2>
        {steady && <span className="text-xs font-semibold text-[#0070f3]">{s.dartSteady}</span>}
      </div>
      <p id="tg-dart-desc" className="mt-0.5 text-sm text-gray-600">
        {s.dartInstructions}
      </p>

      <div
        role="button"
        tabIndex={0}
        data-autofocus
        aria-label={s.dartTarget}
        aria-pressed={holding}
        className={`relative mx-auto mt-3 aspect-square w-[min(100%,46svh,360px)] cursor-crosshair touch-none select-none rounded-full ${focusRing}`}
        onPointerDown={(e) => {
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          hold();
        }}
        onPointerUp={release}
        onPointerCancel={release}
      >
        <svg viewBox="-125 -125 250 250" className="h-full w-full overflow-visible" aria-hidden>
          <circle r={112} fill="#f3ecdc" stroke="#e5dcc6" strokeWidth={2} />
          {RINGS.map((ring, ri) =>
            Array.from({ length: SECTORS }, (_, k) => {
              const a0 = (k * Math.PI * 2) / SECTORS;
              const a1 = ((k + 1) * Math.PI * 2) / SECTORS;
              return (
                <path
                  key={`${ri}-${k}`}
                  d={wedge(ring.r0, ring.r1, a0, a1)}
                  fill={k % 2 === 1 ? ring.hi : ring.lo}
                  stroke="#c7d6ee"
                  strokeWidth={0.6}
                />
              );
            }),
          )}
          <circle r={BULL * 100} fill="#0070f3" stroke="#fff" strokeWidth={1.2} />
          <path d="M0 -5.5 L1.6 -1.7 5.4 -1.7 2.4 0.7 3.4 4.6 0 2.3 -3.4 4.6 -2.4 0.7 -5.4 -1.7 -1.6 -1.7Z" fill="#fff" />
          {[
            { y: -85, t: s.dartRings.outer },
            { y: -55, t: s.dartRings.middle },
            { y: -25, t: s.dartRings.inner },
          ].map((l) => (
            <text
              key={l.y}
              y={l.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={9}
              fontWeight={700}
              fill="#1f2937"
              stroke="#fff"
              strokeWidth={3}
              paintOrder="stroke"
              fontFamily="var(--font-geist-mono), monospace"
            >
              {l.t}
            </text>
          ))}

          {phase === 'aim' && (
            <motion.g style={{ x: rx, y: ry }}>
              <circle r={8} fill="none" stroke="#fff" strokeWidth={3.5} />
              <circle r={8} fill="none" stroke="#111827" strokeWidth={1.6} />
              <path d="M-13 0H-4M4 0H13M0 -13V-4M0 4V13" stroke="#111827" strokeWidth={1.6} strokeLinecap="round" />
              <circle r={1.4} fill="#e11d48" />
            </motion.g>
          )}

          {hit && (
            <motion.g
              initial={reducedMotion ? { x: hit.x, y: hit.y, scale: 1 } : { x: 10, y: 190, scale: 2.2, opacity: 0.6 }}
              animate={{ x: hit.x, y: hit.y, scale: 1, opacity: 1 }}
              transition={{ duration: reducedMotion ? 0 : 0.36, ease: [0.2, 0.7, 0.3, 1] }}
            >
              <line x1={0} y1={0} x2={9} y2={30} stroke="#374151" strokeWidth={2.4} strokeLinecap="round" />
              <path d="M9 30 L3 42 L10 36 L17 40 Z" fill="#0070f3" />
              <circle r={2} fill="#111827" />
            </motion.g>
          )}
        </svg>
      </div>

      <div className="mt-2 min-h-[1.75rem] text-center" aria-live="assertive">
        <AnimatePresence>
          {phase === 'done' && (
            <motion.p
              key="res"
              initial={reducedMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-base font-bold text-gray-900"
            >
              {resultText}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-1 flex items-center justify-between gap-3">
        <p className="text-xs text-gray-500">
          <span className="font-semibold text-gray-700">★</span> {s.dartRings.bull} · {s.dartKeyboard}
        </p>
        <button
          ref={cancelBtn}
          type="button"
          onClick={onCancel}
          disabled={phase !== 'aim'}
          className={`min-h-11 shrink-0 rounded-xl px-3 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-40 ${focusRing}`}
        >
          {s.cancel}
        </button>
      </div>
    </Dialog>
  );
}
