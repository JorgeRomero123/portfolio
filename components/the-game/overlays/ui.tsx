'use client';

// Shared pieces for the landmark overlays: button styles, the passport stamp seal, hat glyphs,
// hand-rolled confetti and tiny Web Audio sounds (only ever played when progress.soundOn).
import { useEffect, useId, useRef } from 'react';
import { SECTIONS, sectionById } from '../content';
import { SHORT_LABELS } from '../strings';
import type { HatId, Lang, SectionId } from '../types';
import { focusRing } from '../hud/Dialog';

export const btnPrimary = `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0070f3] px-4 text-sm font-semibold text-white transition-[background-color,transform] duration-300 hover:bg-[#0060d0] active:scale-[0.98] ${focusRing}`;
export const btnSecondary = `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-900 transition-[border-color,transform] duration-300 hover:border-gray-400 active:scale-[0.98] ${focusRing}`;
export const btnGhost = `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium text-gray-600 hover:text-gray-900 ${focusRing}`;

/** Sheet panel: full-width bottom sheet on phones, centred card from `sm` up. */
export const sheetPanel =
  'flex w-full flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.18)] sm:rounded-2xl';

/** Mix a #rrggbb colour with white (t > 0) or black (t < 0). */
export function shade(hex: string, t: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.round(t >= 0 ? c + (255 - c) * t : c * (1 + t)),
  );
  return `#${ch.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

export const sectionIndex = (id: SectionId) => SECTIONS.findIndex((s) => s.id === id);

/** Low-poly facet cluster for card headers (decorative). */
export function Facets({ color, className = '' }: { color: string; className?: string }) {
  return (
    <svg viewBox="0 0 120 80" className={className} aria-hidden preserveAspectRatio="xMaxYMid slice">
      <polygon points="40,80 78,22 96,80" fill={shade(color, 0.35)} />
      <polygon points="78,22 120,0 120,56" fill={color} />
      <polygon points="78,22 120,56 96,80" fill={shade(color, -0.15)} />
      <polygon points="96,80 120,56 120,80" fill={shade(color, -0.3)} />
      <polygon points="60,0 120,0 78,22" fill={shade(color, 0.55)} />
      <polygon points="40,80 60,40 78,22" fill={shade(color, 0.7)} />
    </svg>
  );
}

// ── Stamp seal ──────────────────────────────────────────────────────────────────────────────
export function StampSeal({
  section,
  lang,
  earned = true,
  size = 96,
  className = '',
}: {
  section: SectionId;
  lang: Lang;
  earned?: boolean;
  size?: number;
  className?: string;
}) {
  const uid = useId().replace(/:/g, '');
  const sec = sectionById(section);
  const i = sectionIndex(section);
  const tilt = ((i * 37) % 17) - 8;
  const color = earned ? sec.color : '#9ca3af';
  const label = SHORT_LABELS[section][lang].toUpperCase();
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      style={{ transform: `rotate(${earned ? tilt : 0}deg)` }}
      aria-hidden
    >
      <defs>
        <path id={`arc-${uid}`} d="M 50,50 m -35,0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" />
        <filter id={`ink-${uid}`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={i + 3} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" />
        </filter>
      </defs>
      {earned ? (
        <g filter={`url(#ink-${uid})`} opacity={0.92}>
          <circle cx="50" cy="50" r="46" fill="none" stroke={color} strokeWidth="3.5" />
          <circle cx="50" cy="50" r="41" fill="none" stroke={color} strokeWidth="1.2" />
          <circle cx="50" cy="50" r="27" fill={color} opacity={0.13} />
          <circle cx="50" cy="50" r="27" fill="none" stroke={color} strokeWidth="1.2" />
          <text fill={color} fontSize="7.4" fontWeight={700} fontFamily="var(--font-geist-mono), monospace">
            <textPath href={`#arc-${uid}`} textLength={214} lengthAdjust="spacing">
              {`${label} • THE GAME • JRR •`}
            </textPath>
          </text>
          <text
            x="50"
            y="53"
            textAnchor="middle"
            fill={color}
            fontSize="19"
            fontWeight={800}
            fontFamily="var(--font-geist-sans), sans-serif"
          >
            {String(i + 1).padStart(2, '0')}
          </text>
          <polygon points="50,60 52,65 57,65 53,68 55,73 50,70 45,73 47,68 43,65 48,65" fill={color} />
        </g>
      ) : (
        <g>
          <circle cx="50" cy="50" r="45" fill="#fff" stroke={color} strokeWidth="2" strokeDasharray="5 5" />
          <text x="50" y="56" textAnchor="middle" fill={color} fontSize="18" fontWeight={700} fontFamily="var(--font-geist-sans), sans-serif">
            {String(i + 1).padStart(2, '0')}
          </text>
        </g>
      )}
    </svg>
  );
}

// ── Hat glyphs ──────────────────────────────────────────────────────────────────────────────
export function HatGlyph({ hat, size = 40 }: { hat: HatId; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 40 40', 'aria-hidden': true } as const;
  switch (hat) {
    case 'propeller':
      return (
        <svg {...common}>
          <path d="M8 30a12 12 0 0 1 24 0z" fill="#06b6d4" />
          <path d="M8 30a12 12 0 0 1 12-12v12z" fill="#22d3ee" />
          <rect x="5" y="29" width="30" height="4" rx="2" fill="#0e7490" />
          <rect x="19" y="10" width="2" height="8" fill="#374151" />
          <path d="M8 10l12-1.5V11zM32 10l-12-1.5V11z" fill="#f97316" />
        </svg>
      );
    case 'chef':
      return (
        <svg {...common}>
          <circle cx="13" cy="16" r="7" fill="#f3f4f6" />
          <circle cx="27" cy="16" r="7" fill="#e5e7eb" />
          <circle cx="20" cy="12" r="8" fill="#fff" stroke="#e5e7eb" />
          <rect x="11" y="18" width="18" height="14" rx="2" fill="#f9fafb" stroke="#e5e7eb" />
          <rect x="11" y="28" width="18" height="4" fill="#dc2626" />
        </svg>
      );
    case 'scarf':
      return (
        <svg {...common}>
          <path d="M6 14h28v8H6z" fill="#132257" />
          <path d="M10 14h4v8h-4zM20 14h4v8h-4zM30 14h4v8h-4z" fill="#fff" />
          <path d="M24 22h7v12h-7z" fill="#132257" />
          <path d="M24 26h7v3h-7z" fill="#fff" />
          <path d="M24 34h2v3h-2zM29 34h2v3h-2z" fill="#132257" />
        </svg>
      );
    case 'headphones':
      return (
        <svg {...common}>
          <path d="M8 24v-4a12 12 0 0 1 24 0v4" fill="none" stroke="#374151" strokeWidth="3" />
          <rect x="5" y="21" width="8" height="12" rx="3" fill="#c026d3" />
          <rect x="27" y="21" width="8" height="12" rx="3" fill="#a21caf" />
        </svg>
      );
    case 'beanie':
      return (
        <svg {...common}>
          <circle cx="20" cy="8" r="4" fill="#fbbf24" />
          <path d="M8 28a12 14 0 0 1 24 0z" fill="#16a34a" />
          <path d="M8 28a12 14 0 0 1 12-14v14z" fill="#22c55e" />
          <rect x="6" y="26" width="28" height="7" rx="2" fill="#15803d" />
        </svg>
      );
    case 'beret':
      return (
        <svg {...common}>
          <ellipse cx="20" cy="24" rx="15" ry="7" fill="#7c3aed" />
          <ellipse cx="18" cy="22" rx="11" ry="4.5" fill="#8b5cf6" />
          <rect x="19" y="13" width="2" height="5" rx="1" fill="#4c1d95" />
          <rect x="11" y="28" width="18" height="3" rx="1.5" fill="#5b21b6" />
        </svg>
      );
  }
}

// ── Confetti ────────────────────────────────────────────────────────────────────────────────
/** One burst of low-poly confetti over the parent (which must be `relative`). Nothing with reduced motion. */
export function Confetti({ colors, reducedMotion, origin = { x: 0.5, y: 0.45 } }: {
  colors: string[];
  reducedMotion: boolean;
  origin?: { x: number; y: number };
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const cfg = useRef({ colors, origin });
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || reducedMotion) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    const { colors: cols, origin: o } = cfg.current;
    const parts = Array.from({ length: 130 }, () => {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
      const v = 5 + Math.random() * 9;
      return {
        x: w * o.x,
        y: h * o.y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.4,
        s: 5 + Math.random() * 6,
        c: cols[Math.floor(Math.random() * cols.length)],
      };
    });
    let raf = 0;
    const start = performance.now();
    const frame = (now: number) => {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.vy += 0.32;
        p.vx *= 0.985;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - Math.max(0, t - 1.6) / 0.8);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.moveTo(0, -p.s / 2);
        ctx.lineTo(p.s / 2, p.s / 2);
        ctx.lineTo(-p.s / 2, p.s / 3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      if (t < 2.4) raf = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, w, h);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion]);
  return <canvas ref={ref} className="pointer-events-none absolute inset-0 z-10 h-full w-full" aria-hidden />;
}

// ── Sound ───────────────────────────────────────────────────────────────────────────────────
let audio: AudioContext | null = null;
function ctx(): AudioContext | null {
  try {
    if (!audio) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      audio = new Ctx();
    }
    if (audio.state === 'suspended') void audio.resume();
    return audio;
  } catch {
    return null;
  }
}

/** Short blip. Callers must check progress.soundOn first. */
export function blip(freq: number, dur = 0.03, gain = 0.05, type: OscillatorType = 'square') {
  const a = ctx();
  if (!a) return;
  try {
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(gain, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    o.connect(g).connect(a.destination);
    o.start();
    o.stop(a.currentTime + dur + 0.01);
  } catch {
    // ignore
  }
}

/** External link attributes. */
export const extLink = (href: string) =>
  /^https?:\/\//.test(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {};
