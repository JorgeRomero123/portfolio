'use client';

// "Split the G": the second half of the beer mini-game, played on a pint that was poured well.
// A target time is shown ("Split the G: 6.40 s"). The visitor starts the sip, the glass tips up
// out of view (POV), a timer runs in sight for the first third of the target and then hides, and
// a Stop button appears. Stopping within SPLIT_TOL of the target leaves the beer line through the
// middle of the G; too early and it sits above the letter, too late and below.
// The glass carries a plain letter G only: no brewery logo or wordmark.
import { useEffect, useRef, useState } from 'react';
import type { Lang } from '../../types';

/** Seconds either side of the target that still split the G. The one difficulty knob. */
export const SPLIT_TOL = 0.15;
const T_MIN = 5;
const T_MAX = 8;
const SHOWN = 1 / 3; // share of the target during which the timer stays visible
const LATE_LIMIT = 3; // seconds past the target before the sip ends on its own
const REVEAL_MS = 2400;

// Glass geometry (viewBox 360 × 400): base centre at (GX, GY), y grows downwards.
const GX = 180;
const GY = 338;
const GH = 230;
const GBW = 42;
const GTW = 62;
const G_AT = 0.56; // height of the middle of the G, as a fraction of the glass
const DROP = 0.2; // how far the beer line moves per second of error, as a fraction of the glass
const FULL = 0.86;
const HEAD = 0.1;

const T = {
  en: {
    title: 'Split the G',
    how: 'The timer hides after the first third. Stop it right on the target.',
    start: 'Take the sip',
    stop: 'Stop',
    target: 'Target',
    hidden: 'Timer hidden. Keep counting…',
    split: 'You split the G!',
    early: 'Too early',
    late: 'Too late',
    result: (t: string, d: string) => `You stopped at ${t} s (${d}).`,
    sipping: 'The timer is running.',
    glass: 'A pint of stout with a letter G on the glass',
  },
  es: {
    title: 'Parte la G',
    how: 'El cronómetro se esconde después del primer tercio. Deténlo justo en la meta.',
    start: 'Dale el trago',
    stop: '¡Alto!',
    target: 'Meta',
    hidden: 'Cronómetro escondido. Sigue contando…',
    split: '¡Partiste la G!',
    early: 'Muy pronto',
    late: 'Te pasaste',
    result: (t: string, d: string) => `Paraste en ${t} s (${d}).`,
    sipping: 'El cronómetro está corriendo.',
    glass: 'Un tarro de cerveza oscura con una letra G en el vidrio',
  },
};

type Stage = 'ready' | 'shown' | 'blind' | 'reveal';

const hw = (f: number) => GBW + (GTW - GBW) * f;
const yAt = (f: number) => GY - f * GH;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const signed = (v: number) => `${Math.abs(v) < 0.005 ? '±' : v > 0 ? '+' : '−'}${Math.abs(v).toFixed(2)}`;

export default function SplitTheG({
  lang,
  reducedMotion,
  onSound,
  onDone,
}: {
  lang: Lang;
  reducedMotion: boolean;
  onSound: (kind: 'start' | 'split' | 'miss') => void;
  /** `err` is seconds off the target (negative = stopped early). */
  onDone: (ok: boolean, err: number) => void;
}) {
  const t = T[lang];
  const [target] = useState(() => Math.round((T_MIN + Math.random() * (T_MAX - T_MIN)) * 20) / 20);
  const [stage, setStage] = useState<Stage>('ready');
  const [elapsed, setElapsed] = useState(0);
  const [err, setErr] = useState(0);
  const t0 = useRef(0);
  const stageRef = useRef<Stage>('ready');
  const timers = useRef<number[]>([]);
  const startBtn = useRef<HTMLButtonElement>(null);
  const stopBtn = useRef<HTMLButtonElement>(null);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  const go = (s: Stage) => {
    stageRef.current = s;
    setStage(s);
  };

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((id) => window.clearTimeout(id));
  }, []);

  // Keyboard focus follows the one control on screen.
  useEffect(() => {
    const el = stage === 'ready' ? startBtn.current : stage === 'blind' ? stopBtn.current : null;
    if (!el) return;
    const id = requestAnimationFrame(() => el.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(id);
  }, [stage]);

  // Visible timer: only ticks while it can be seen.
  useEffect(() => {
    if (stage !== 'shown') return;
    let raf = 0;
    const tick = () => {
      setElapsed((performance.now() - t0.current) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stage]);

  const stop = () => {
    if (stageRef.current !== 'blind') return;
    const total = (performance.now() - t0.current) / 1000;
    const e = total - target;
    const ok = Math.abs(e) <= SPLIT_TOL;
    setElapsed(total);
    setErr(e);
    go('reveal');
    onSound(ok ? 'split' : 'miss');
    timers.current.push(window.setTimeout(() => onDoneRef.current(ok, e), REVEAL_MS));
  };

  const start = () => {
    if (stageRef.current !== 'ready') return;
    t0.current = performance.now();
    setElapsed(0);
    go('shown');
    onSound('start');
    timers.current.push(
      window.setTimeout(() => {
        if (stageRef.current === 'shown') go('blind');
      }, target * SHOWN * 1000),
      window.setTimeout(stop, (target + LATE_LIMIT) * 1000),
    );
  };

  const sipping = stage === 'shown' || stage === 'blind';
  const ok = stage === 'reveal' && Math.abs(err) <= SPLIT_TOL;
  // Beer line: full before the sip; afterwards the error decides where it stopped.
  const level = stage === 'reveal' ? clamp(G_AT - err * DROP, 0.16, FULL) : FULL;
  const head = stage === 'reveal' ? 0.045 : HEAD;
  const band = SPLIT_TOL * DROP;
  const move = reducedMotion ? 'opacity 200ms linear' : 'transform 850ms cubic-bezier(.4,0,.2,1), opacity 600ms ease-in';
  const stopEvent = (e: { stopPropagation: () => void }) => e.stopPropagation();

  return (
    <div
      className="absolute inset-0 z-10 cursor-default overflow-hidden rounded-2xl bg-[#fffaf2]"
      data-split-stage={stage}
      data-split-target={target.toFixed(2)}
      onPointerDown={stopEvent}
      onPointerUp={stopEvent}
      onPointerMove={stopEvent}
      onKeyDown={stopEvent}
      onKeyUp={stopEvent}
    >
      <svg viewBox="0 0 360 400" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full" role="img" aria-label={t.glass}>
        <defs>
          <clipPath id="stg-inside">
            <polygon points={`${GX - GBW},${GY} ${GX + GBW},${GY} ${GX + GTW},${GY - GH} ${GX - GTW},${GY - GH}`} />
          </clipPath>
        </defs>
        <rect x="-400" y="-300" width="1160" height="1000" fill="#fffaf2" />
        <polygon points="-400,352 760,352 760,700 -400,700" fill="#dcc09a" />
        <polygon points="-400,352 760,352 760,364 -400,364" fill="#f3e2c7" />
        <g
          style={{
            transformBox: 'view-box',
            transformOrigin: `${GX}px ${GY - GH / 2}px`,
            transform: sipping && !reducedMotion ? 'translate(0px, -330px) rotate(-38deg) scale(2.3)' : 'none',
            opacity: sipping ? 0 : 1,
            transition: move,
          }}
        >
          <polygon
            points={`${GX - GBW - 3},${GY + 9} ${GX + GBW + 3},${GY + 9} ${GX + GTW + 3},${GY - GH - 1} ${GX - GTW - 3},${GY - GH - 1}`}
            fill="#eff6ff"
            fillOpacity="0.55"
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <g clipPath="url(#stg-inside)">
            <rect x={GX - 90} y={yAt(level + head)} width="180" height={head * GH + 2} fill="#f3e6c8" />
            <rect x={GX - 90} y={yAt(level)} width="180" height={level * GH + 4} fill="#1c120d" />
            <rect x={GX - 90} y={yAt(level)} width="180" height="3" fill="#3b2418" />
            {/* lacing left behind on the way down */}
            {stage === 'reveal' && (
              <rect x={GX - 90} y={yAt(FULL)} width="180" height={(FULL - level - head) * GH} fill="#f3e6c8" opacity="0.28" />
            )}
          </g>
          {stage === 'reveal' && (
            <g stroke={ok ? '#059669' : '#9ca3af'} strokeWidth="1.2" strokeDasharray="4 3">
              <line x1={GX - hw(G_AT) - 8} x2={GX + hw(G_AT) + 8} y1={yAt(G_AT + band)} y2={yAt(G_AT + band)} />
              <line x1={GX - hw(G_AT) - 8} x2={GX + hw(G_AT) + 8} y1={yAt(G_AT - band)} y2={yAt(G_AT - band)} />
            </g>
          )}
          <text
            x={GX}
            y={yAt(G_AT) + 22}
            textAnchor="middle"
            fontSize="62"
            fontWeight="800"
            fill="#d9a441"
            stroke="#5b3a12"
            strokeWidth="1.4"
            paintOrder="stroke"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            G
          </text>
          <polygon points={`${GX - GBW + 6},${GY - 8} ${GX - GBW + 13},${GY - 8} ${GX - GTW + 16},${GY - GH + 10} ${GX - GTW + 8},${GY - GH + 10}`} fill="#ffffff" opacity="0.35" />
          <polygon points={`${GX - GBW - 3},${GY} ${GX + GBW + 3},${GY} ${GX + GBW + 3},${GY + 9} ${GX - GBW - 3},${GY + 9}`} fill="#cbd5e1" opacity="0.7" />
        </g>
      </svg>

      {/* Target, always in sight */}
      <div className="pointer-events-none absolute inset-x-0 top-3 flex flex-col items-center gap-0.5 text-center">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-amber-800">{t.title}</p>
        <p className="font-mono text-3xl font-bold tabular-nums text-gray-900">
          <span className="sr-only">{t.target}: </span>
          {target.toFixed(2)} s
        </p>
      </div>

      {stage === 'ready' && (
        <div className="absolute inset-x-0 bottom-3 flex flex-col items-center gap-2 px-3">
          <p className="max-w-xs rounded-xl bg-white/95 px-3 py-1.5 text-center text-xs font-medium text-gray-700 shadow-sm ring-1 ring-amber-100">
            {t.how}
          </p>
          <button
            ref={startBtn}
            type="button"
            data-testid="split-start"
            onClick={start}
            className="min-h-12 min-w-44 rounded-xl bg-[#d97706] px-6 text-base font-semibold text-white shadow-md transition-transform duration-150 hover:bg-[#b45309] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d97706] focus-visible:ring-offset-2"
          >
            {t.start}
          </button>
        </div>
      )}

      {sipping && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-3">
          <p
            className="font-mono text-6xl font-bold tabular-nums text-gray-900 transition-opacity duration-300"
            style={{ opacity: stage === 'shown' ? 1 : 0 }}
            aria-hidden
          >
            {elapsed.toFixed(2)}
          </p>
          {stage === 'blind' && (
            <>
              <p className="text-sm font-medium text-gray-600" aria-hidden>
                {t.hidden}
              </p>
              <button
                ref={stopBtn}
                type="button"
                data-testid="split-stop"
                onClick={stop}
                className="min-h-16 min-w-52 rounded-2xl bg-gray-900 px-8 text-xl font-bold text-white shadow-lg transition-transform duration-150 hover:bg-gray-800 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d97706] focus-visible:ring-offset-2"
              >
                {t.stop}
              </button>
            </>
          )}
        </div>
      )}

      {stage === 'reveal' && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center px-3">
          <p
            className={`rounded-xl px-4 py-2 text-center shadow-lg ring-1 ${
              ok ? 'bg-emerald-50 text-emerald-800 ring-emerald-300' : 'bg-white text-gray-800 ring-gray-200'
            }`}
          >
            <span className="block text-lg font-bold">{ok ? t.split : err < 0 ? t.early : t.late}</span>
            <span className="block font-mono text-sm tabular-nums">
              {elapsed.toFixed(2)} s · {signed(err)}
            </span>
          </p>
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {stage === 'reveal'
          ? `${ok ? t.split : err < 0 ? t.early : t.late} ${t.result(elapsed.toFixed(2), signed(err))}`
          : stage === 'blind'
            ? t.hidden
            : stage === 'shown'
              ? t.sipping
              : `${t.title}: ${target.toFixed(2)} s. ${t.how}`}
      </p>
    </div>
  );
}
