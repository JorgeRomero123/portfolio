'use client';

// Prize wheel: a low-poly, toy-like wheel. The outcome is decided BEFORE the animation (rewards.ts),
// then the wheel winds up, spins and decelerates to land on it while a flapper ticks against the pegs.
// Reduced motion: no spin, the prize fades in. Sound (a tick per peg) only when progress.soundOn.
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { facts, sectionById } from '../content';
import { getProgress, updateProgress } from '../progress';
import { grant, pickSegment, wheelSegments, type SliceKind, type WonPrize } from '../rewards';
import { FLOW_STRINGS } from '../strings';
import type { Lang, SectionId } from '../types';
import { Dialog } from '../hud/Dialog';
import { StoryBlock } from './SectionCard';
import { Confetti, HatGlyph, blip, btnPrimary, btnSecondary, shade, sheetPanel } from './ui';

const SLICE_COLOR: Record<SliceKind, string> = {
  story: '#0070f3',
  fact: '#7c3aed',
  dart: '#f97316',
  move: '#16a34a',
  hat: '#ec4899',
};

const R = 96; // rim radius (viewBox units)
const WIND_MS = 420;
const SPIN_MS = 4300;
const TURNS = 5;
const FLAP_ZONE = 9; // degrees before a peg where the flapper starts bending
const FLAP_MAX = 30;

const rad = (deg: number) => ((deg - 90) * Math.PI) / 180; // 0° = top, clockwise
const pt = (deg: number, r: number) => [Math.cos(rad(deg)) * r, Math.sin(rad(deg)) * r] as const;
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function SliceGlyph({ kind }: { kind: SliceKind }) {
  // Tiny white pictograms, drawn in a 20×20 box centred on the origin.
  switch (kind) {
    case 'story':
      return <path d="M-7-6h9l5 5v8h-14z M2-6v5h5" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinejoin="round" />;
    case 'fact':
      return (
        <g fill="#fff">
          <path d="M0-8a5.5 5.5 0 0 1 3.5 9.8V4h-7V1.8A5.5 5.5 0 0 1 0-8z" />
          <rect x="-3" y="5" width="6" height="2.2" rx="1" />
        </g>
      );
    case 'dart':
      return (
        <g fill="none" stroke="#fff" strokeWidth={1.8}>
          <circle r="7" />
          <circle r="2.6" fill="#fff" />
        </g>
      );
    case 'move':
      return <path d="M-7 5l5-5 3 3 6-8M3-5h4v4" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />;
    case 'hat':
      return (
        <g fill="#fff">
          <path d="M-6 3a6 7 0 0 1 12 0z" />
          <rect x="-8" y="3" width="16" height="3" rx="1.5" />
        </g>
      );
  }
}

export function PrizeWheel({
  section,
  lang,
  reducedMotion,
  soundOn,
  onDone,
}: {
  section: SectionId;
  lang: Lang;
  reducedMotion: boolean;
  soundOn: boolean;
  onDone: () => void;
}) {
  const f = FLOW_STRINGS[lang];
  // Frozen at open: the wheel shows what this spin can give.
  const [segments] = useState(() => wheelSegments(getProgress(), section));
  const [phase, setPhase] = useState<'ready' | 'spinning' | 'done'>('ready');
  const [winner, setWinner] = useState<number | null>(null);
  const [prize, setPrize] = useState<WonPrize | null>(null);
  const [wornNow, setWornNow] = useState(false);
  const wheel = useRef<SVGGElement>(null);
  const flap = useRef<SVGGElement>(null);
  const cont = useRef<HTMLButtonElement>(null);
  const raf = useRef(0);
  const n = segments.length;
  const seg = 360 / n;

  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  useEffect(() => {
    if (phase === 'done') cont.current?.focus({ preventScroll: true });
  }, [phase]);

  const reveal = useCallback(
    (idx: number) => {
      const { prize: p, patch } = grant(getProgress(), section, segments[idx]);
      updateProgress(patch);
      setPrize(p);
      setWinner(idx);
      setPhase('done');
      if (soundOn) {
        blip(660, 0.12, 0.06, 'triangle');
        window.setTimeout(() => blip(990, 0.18, 0.06, 'triangle'), 110);
      }
    },
    [section, segments, soundOn],
  );

  const spin = useCallback(() => {
    if (phase !== 'ready') return;
    const idx = pickSegment(segments);
    const jitter = (Math.random() - 0.5) * seg * 0.6;
    const target = (idx + 0.5) * seg + jitter; // wheel-local angle that must end under the pointer
    const finalRot = ((((-target) % 360) + 360) % 360) + TURNS * 360;
    if (reducedMotion) {
      wheel.current?.setAttribute('transform', `rotate(${finalRot % 360})`);
      reveal(idx);
      return;
    }
    setPhase('spinning');
    const start = performance.now();
    const wind = -16;
    let flapAngle = 0;
    let lastPeg = 0;
    let last = start;
    const frame = (now: number) => {
      const el = now - start;
      let rot: number;
      if (el < WIND_MS) rot = wind * easeInOut(el / WIND_MS);
      else {
        const t = Math.min(1, (el - WIND_MS) / SPIN_MS);
        rot = wind + (finalRot - wind) * easeOutQuart(t);
      }
      wheel.current?.setAttribute('transform', `rotate(${rot})`);

      // Flapper: pegs sit at k*seg; a peg's screen angle is k*seg + rot. Bend as one approaches the top.
      const dt = Math.min(64, now - last);
      last = now;
      const phaseInSeg = (((rot % seg) + seg) % seg); // angle of the nearest peg past the top
      const toPeg = phaseInSeg - seg; // negative: degrees until the next peg reaches the top
      const bend = toPeg > -FLAP_ZONE ? (1 + toPeg / FLAP_ZONE) * FLAP_MAX : 0;
      flapAngle = bend > flapAngle ? bend : flapAngle * Math.pow(0.0005, dt / 1000); // fast snap back
      flap.current?.setAttribute('transform', `rotate(${-flapAngle})`);
      const peg = Math.floor(rot / seg);
      if (peg !== lastPeg && el > WIND_MS) {
        lastPeg = peg;
        if (soundOn) blip(1700, 0.018, 0.035);
      }

      if (el < WIND_MS + SPIN_MS) raf.current = requestAnimationFrame(frame);
      else {
        flap.current?.setAttribute('transform', 'rotate(0)');
        reveal(idx);
      }
    };
    raf.current = requestAnimationFrame(frame);
  }, [phase, reducedMotion, reveal, seg, segments, soundOn]);

  const close = () => {
    if (phase === 'spinning') return;
    onDone();
  };

  const sec = sectionById(section);
  const confettiColors = [sec.color, '#0070f3', '#f97316', '#16a34a', '#ec4899', '#facc15'];

  return (
    <Dialog
      labelledBy="tg-wheel-title"
      describedBy="tg-wheel-hint"
      onClose={close}
      reducedMotion={reducedMotion}
      placement="sheet"
      backdropClassName="bg-gray-900/40"
      panelClassName={`${sheetPanel} relative max-h-[calc(100%-0.75rem)] sm:max-h-[calc(100%-2rem)] sm:max-w-md`}
    >
      {phase === 'done' && !reducedMotion && <Confetti colors={confettiColors} reducedMotion={reducedMotion} origin={{ x: 0.5, y: 0.3 }} />}
      <div className="h-1.5 shrink-0" style={{ background: sec.color }} aria-hidden />
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-4">
        <div className="text-center">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">{sec.title[lang]}</p>
          <h2 id="tg-wheel-title" className="text-xl font-bold tracking-tight text-gray-900">
            {f.wheelTitle}
          </h2>
          <p id="tg-wheel-hint" className="mt-0.5 text-sm text-gray-600">
            {f.wheelHint}
          </p>
        </div>

        <div
          className={`relative mx-auto mt-3 aspect-square transition-[width] duration-300 ${
            phase === 'done' ? 'w-[min(170px,45vw)]' : 'w-[min(290px,74vw)]'
          }`}
        >
          <svg viewBox="-110 -112 220 222" className="h-full w-full overflow-visible" role="img" aria-label={segments.map((k) => f.slice[k]).join(', ')}>
            <defs>
              <filter id="tg-wheel-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0f172a" floodOpacity="0.22" />
              </filter>
            </defs>
            {/* base / bevel */}
            <circle r={R + 10} fill="#e5e7eb" filter="url(#tg-wheel-shadow)" />
            <circle r={R + 7} fill="#fff" />
            <g ref={wheel}>
              {segments.map((kind, i) => {
                const a = pt(i * seg, R);
                const b = pt((i + 1) * seg, R);
                const m = pt((i + 0.5) * seg, R * Math.cos((seg * Math.PI) / 360));
                const c = SLICE_COLOR[kind];
                const dim = winner !== null && winner !== i;
                const [lx, ly] = pt((i + 0.5) * seg, R * 0.62);
                const [gx, gy] = pt((i + 0.5) * seg, R * 0.36);
                return (
                  <g key={i} style={{ opacity: dim ? 0.35 : 1, transition: 'opacity 400ms' }}>
                    <polygon points={`0,0 ${a.join(',')} ${m.join(',')}`} fill={shade(c, 0.12)} />
                    <polygon points={`0,0 ${m.join(',')} ${b.join(',')}`} fill={shade(c, -0.12)} />
                    <text
                      x={lx}
                      y={ly}
                      fill="#fff"
                      fontSize={n > 8 ? 9 : 10.5}
                      fontWeight={700}
                      textAnchor="middle"
                      dominantBaseline="central"
                      transform={`rotate(${(i + 0.5) * seg} ${lx} ${ly})`}
                      style={{ fontFamily: 'var(--font-geist-sans), sans-serif' }}
                    >
                      {f.slice[kind]}
                    </text>
                    <g transform={`translate(${gx} ${gy}) rotate(${(i + 0.5) * seg}) scale(0.8)`}>
                      <SliceGlyph kind={kind} />
                    </g>
                  </g>
                );
              })}
              {winner !== null && (
                <polygon
                  points={`0,0 ${pt(winner * seg, R).join(',')} ${pt((winner + 1) * seg, R).join(',')}`}
                  fill="none"
                  stroke="#fff"
                  strokeWidth={4}
                  strokeLinejoin="round"
                  className="motion-safe:animate-pulse"
                />
              )}
              {segments.map((_, i) => {
                const [x, y] = pt(i * seg, R + 1);
                return <circle key={`peg-${i}`} cx={x} cy={y} r={3.6} fill="#fff" stroke="#9ca3af" strokeWidth={1.2} />;
              })}
            </g>
            {/* hub */}
            <polygon points={[0, 60, 120, 180, 240, 300].map((d) => pt(d, 17).join(',')).join(' ')} fill="#fff" filter="url(#tg-wheel-shadow)" />
            <polygon points={[0, 60, 120, 180, 240, 300].map((d) => pt(d, 12).join(',')).join(' ')} fill={sec.color} />
            <polygon points={`0,0 ${pt(300, 12).join(',')} ${pt(0, 12).join(',')} ${pt(60, 12).join(',')}`} fill={shade(sec.color, 0.3)} />
            {/* flapper pointer, pivot at the top */}
            <g transform="translate(0 -112)">
              <g ref={flap}>
                <polygon points="-9,0 9,0 0,26" fill="#111827" />
                <polygon points="0,0 9,0 0,26" fill="#374151" />
              </g>
              <circle r="4.5" fill="#fff" stroke="#111827" strokeWidth="2" />
            </g>
          </svg>
        </div>

        <AnimatePresence mode="wait">
          {phase !== 'done' ? (
            <motion.div key="spin" className="mt-4 flex justify-center" exit={{ opacity: 0 }}>
              <button
                type="button"
                data-testid="wheel-spin"
                data-autofocus
                onClick={spin}
                aria-disabled={phase === 'spinning'}
                className={`${btnPrimary} min-h-12 min-w-44 text-base aria-disabled:opacity-70`}
              >
                {phase === 'spinning' ? f.spinning : f.spin}
              </button>
            </motion.div>
          ) : (
            prize && (
              <motion.div
                key="result"
                className="mt-4"
                initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reducedMotion ? 0.4 : 0.35 }}
              >
                <PrizeResult
                  prize={prize}
                  section={section}
                  lang={lang}
                  wornNow={wornNow}
                  onWear={() => {
                    if (prize.kind !== 'hat') return;
                    updateProgress({ wornHat: prize.hat });
                    setWornNow(true);
                  }}
                />
                <div className="mt-4 flex justify-center">
                  <button ref={cont} type="button" data-testid="wheel-continue" onClick={onDone} className={`${btnSecondary} min-w-40`}>
                    {f.continue}
                  </button>
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>
        <p className="sr-only" aria-live="polite">
          {prize ? `${f.youGot}: ${f.slice[prize.kind]}` : ''}
        </p>
      </div>
    </Dialog>
  );
}

function PrizeResult({
  prize,
  section,
  lang,
  wornNow,
  onWear,
}: {
  prize: WonPrize;
  section: SectionId;
  lang: Lang;
  wornNow: boolean;
  onWear: () => void;
}) {
  const f = FLOW_STRINGS[lang];
  const color = SLICE_COLOR[prize.kind];
  const head = (title: string) => (
    <>
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color }}>
        {f.youGot}
      </p>
      <h3 className="mt-0.5 text-lg font-bold tracking-tight text-gray-900">{title}</h3>
    </>
  );
  switch (prize.kind) {
    case 'story':
      return (
        <div className="space-y-2 text-center">
          {head(f.prizeStory)}
          <div className="text-left">
            <StoryBlock section={section} lang={lang} />
          </div>
        </div>
      );
    case 'fact': {
      const fact = facts(sectionById(section))[prize.index];
      return (
        <div className="text-center">
          {head(f.prizeFact)}
          {fact && <p className="mt-2 rounded-xl bg-gray-50 p-4 text-left text-sm leading-relaxed text-gray-700">{fact[lang]}</p>}
        </div>
      );
    }
    case 'dart':
      return (
        <div className="text-center">
          {head(`+1 · ${f.prizeDart}`)}
          <p className="mt-1 text-sm text-gray-600">{f.prizeDartBody}</p>
        </div>
      );
    case 'move':
      return (
        <div className="text-center">
          {head(`+1 · ${f.prizeMove}`)}
          <p className="mt-1 text-sm text-gray-600">{f.prizeMoveBody}</p>
        </div>
      );
    case 'hat':
      return (
        <div className="flex flex-col items-center text-center">
          <HatGlyph hat={prize.hat} size={56} />
          {head(f.prizeHat(f.hats[prize.hat]))}
          <p className="mt-1 text-sm text-gray-600">{f.prizeHatBody}</p>
          <button type="button" onClick={onWear} aria-pressed={wornNow} className={`${btnPrimary} mt-3`}>
            {wornNow ? `✓ ${f.wearing}` : f.wearIt}
          </button>
        </div>
      );
  }
}
