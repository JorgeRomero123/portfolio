import type { Metadata } from 'next';
import {
  Bricolage_Grotesque, Fraunces, Familjen_Grotesk, Figtree, Instrument_Sans, Newsreader,
  JetBrains_Mono,
} from 'next/font/google';
import { STATS, PROJECTS } from '@/components/home/data';

/**
 * Temporary page for choosing the new display/body pairing. Every section renders the
 * same slice of the homepage on the new palette, so the fonts are the only variable.
 * Delete once a pairing is wired into the layout.
 */

export const metadata: Metadata = {
  title: 'Font lab',
  robots: { index: false, follow: false },
};

const bricolage = Bricolage_Grotesque({ subsets: ['latin'], axes: ['opsz', 'wdth'] });
const fraunces = Fraunces({ subsets: ['latin'], axes: ['SOFT', 'WONK', 'opsz'] });
const familjen = Familjen_Grotesk({ subsets: ['latin'] });
const figtree = Figtree({ subsets: ['latin'] });
const instrument = Instrument_Sans({ subsets: ['latin'], axes: ['wdth'] });
const newsreader = Newsreader({ subsets: ['latin'], axes: ['opsz'] });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['500', '700'] });

const C = {
  paper: '#F4EDE1',
  ink: '#1B1B1B',
  peach: '#F0C49B',
  lavender: '#B8B6EA',
  green: '#3F8F45',
  mustard: '#E5A23C',
  pink: '#D98580',
  cornflower: '#6C7DE0',
};

const HERO_PHOTO = 'https://cdn.jorgeromeroromanis.com/gallery/4fd284a0-6e88-422c-a565-9068f5a7e546.webp';

type Pairing = {
  id: string;
  name: string;
  feel: string;
  display: string;
  body: string;
  /** Extra settings for the headline, e.g. Fraunces' soft/wonky axes. */
  headline?: React.CSSProperties;
  accent: string;
};

const PAIRINGS: Pairing[] = [
  {
    id: 'a',
    name: 'Bricolage Grotesque + Figtree',
    feel: 'quirky, bold, agency',
    display: bricolage.style.fontFamily,
    body: figtree.style.fontFamily,
    headline: { fontWeight: 800, fontVariationSettings: '"opsz" 96, "wdth" 85', letterSpacing: '-0.04em' },
    accent: C.cornflower,
  },
  {
    id: 'b',
    name: 'Fraunces (soft + wonky) + Instrument Sans',
    feel: 'editorial, warm, a bit cheeky',
    display: fraunces.style.fontFamily,
    body: instrument.style.fontFamily,
    headline: { fontWeight: 800, fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144', letterSpacing: '-0.03em' },
    accent: C.pink,
  },
  {
    id: 'c',
    name: 'Familjen Grotesk + Newsreader',
    feel: 'engineer meets magazine',
    display: familjen.style.fontFamily,
    body: newsreader.style.fontFamily,
    headline: { fontWeight: 700, letterSpacing: '-0.045em' },
    accent: C.green,
  },
];

const MONO = mono.style.fontFamily;

/** 1px ink dots on an 8px grid — the halftone used for shadows and fills. */
const halftone = (color: string, size = 8) =>
  `radial-gradient(circle, ${color} 1.1px, transparent 1.6px) 0 0 / ${size}px ${size}px`;

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E\")";

const card = (shadow = 5): React.CSSProperties => ({
  background: '#fffaf2',
  border: `2.5px solid ${C.ink}`,
  boxShadow: `${shadow}px ${shadow}px 0 ${C.ink}`,
  borderRadius: 10,
});

function Section({ p, index }: { p: Pairing; index: number }) {
  const fastlane = PROJECTS[0];
  return (
    <section
      id={p.id}
      style={{
        fontFamily: p.body,
        borderTop: `3px solid ${C.ink}`,
        padding: 'clamp(40px,7vw,90px) clamp(16px,5vw,64px)',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 36 }}>
        <span
          style={{
            ...card(3), background: p.accent, fontFamily: MONO, fontWeight: 700, fontSize: 13,
            padding: '6px 12px', transform: 'rotate(-3deg)', display: 'inline-block',
          }}
        >
          option {String.fromCharCode(65 + index)}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 13 }}>{p.name}</span>
        <span style={{ fontFamily: MONO, fontSize: 13, opacity: 0.6 }}>· {p.feel}</span>
      </div>

      {/* hero */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: 'clamp(28px,4vw,56px)', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 18 }}>
            méxico · software engineer · builds too much
          </div>
          <h1 style={{ fontFamily: p.display, fontSize: 'clamp(52px,8vw,112px)', lineHeight: 0.92, margin: 0, ...p.headline }}>
            Hi, I&rsquo;m{' '}
            <span style={{ background: p.accent, padding: '0 0.12em', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' }}>
              Jorge.
            </span>
          </h1>
          <p style={{ fontFamily: p.display, fontSize: 'clamp(24px,3.2vw,42px)', lineHeight: 1.05, margin: '18px 0 0', fontWeight: 600, letterSpacing: '-0.02em', ...(p.id === 'b' ? { fontVariationSettings: '"SOFT" 100, "WONK" 1' } : {}) }}>
            I build for millions, then go build something fun.
          </p>
          <p style={{ fontSize: 'clamp(16px,1.4vw,19px)', lineHeight: 1.55, marginTop: 22, maxWidth: 540 }}>
            By day I ship production software to 1.5 million people. By night I build browser
            toys nobody asked for: a singing coach, a chore tracker that emails my roommate, a
            360° tour engine.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 30 }}>
            <a href={`#${p.id}`} style={{ ...card(4), background: C.ink, color: C.paper, textDecoration: 'none', fontWeight: 700, padding: '14px 24px' }}>
              See my work →
            </a>
            <a href={`#${p.id}`} style={{ ...card(4), background: C.mustard, color: C.ink, textDecoration: 'none', fontWeight: 700, padding: '14px 24px' }}>
              Browse the 25 tools
            </a>
          </div>
        </div>

        {/* placeholder for the building illustration: current photo, riso-treated */}
        <div style={{ ...card(8), position: 'relative', aspectRatio: '4 / 3', overflow: 'hidden', padding: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={HERO_PHOTO} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) contrast(1.25)', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: p.accent, mixBlendMode: 'multiply' }} />
          <div style={{ position: 'absolute', inset: 0, background: halftone(C.ink, 6), opacity: 0.35, mixBlendMode: 'multiply' }} />
          <span
            style={{
              ...card(3), position: 'absolute', bottom: 16, right: 16, background: C.paper,
              fontFamily: MONO, fontSize: 12, padding: '6px 10px', transform: 'rotate(2.5deg)',
            }}
          >
            your building goes here ↗
          </span>
        </div>
      </div>

      {/* stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 20, marginTop: 'clamp(48px,6vw,80px)' }}>
        {STATS.slice(0, 3).map((s, i) => (
          <div key={s.label} style={{ ...card(5), background: [C.peach, C.lavender, '#fffaf2'][i], padding: '22px 22px 24px' }}>
            <div style={{ fontFamily: p.display, fontSize: 'clamp(44px,5vw,64px)', lineHeight: 1, ...p.headline }}>
              {s.value}{s.suffix}
            </div>
            <div style={{ marginTop: 10, fontSize: 15, lineHeight: 1.45 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* project card */}
      <div style={{ ...card(6), marginTop: 24, padding: 'clamp(22px,3vw,34px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '35%', background: halftone(p.accent, 9), opacity: 0.9, pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <span style={{ fontFamily: MONO, fontSize: 12, border: `2px solid ${C.ink}`, borderRadius: 999, padding: '3px 10px' }}>{fastlane.tag}</span>
          <h2 style={{ fontFamily: p.display, fontSize: 'clamp(34px,4.4vw,56px)', lineHeight: 1, margin: '16px 0 0', ...p.headline }}>
            {fastlane.title}
          </h2>
        </div>
        <div style={{ position: 'relative', fontSize: 17, lineHeight: 1.6, alignSelf: 'end' }}>
          {fastlane.body}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
            {fastlane.tech.map((t) => (
              <span key={t} style={{ fontFamily: MONO, fontSize: 12, background: C.paper, border: `1.5px solid ${C.ink}`, padding: '2px 8px', borderRadius: 4 }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function FontLab() {
  return (
    <div style={{ background: C.paper, color: C.ink, position: 'relative', overflowX: 'clip' }}>
      {/* riso grain over everything */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN, mixBlendMode: 'multiply', opacity: 0.18, pointerEvents: 'none', zIndex: 5 }} />

      <header style={{ padding: 'clamp(28px,5vw,56px) clamp(16px,5vw,64px)', fontFamily: MONO }}>
        <h1 style={{ fontSize: 'clamp(22px,3vw,30px)', margin: 0, fontWeight: 700 }}>font lab</h1>
        <p style={{ fontSize: 14, maxWidth: 640, lineHeight: 1.6, marginTop: 10 }}>
          The same slice of the homepage in three pairings. Pick one (or mix a display from one
          with a body from another) and it replaces Geist + Space Grotesk site-wide.
        </p>
        <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
          {PAIRINGS.map((p, i) => (
            <a key={p.id} href={`#${p.id}`} style={{ ...card(3), background: p.accent, color: C.ink, textDecoration: 'none', fontSize: 13, fontWeight: 700, padding: '6px 12px' }}>
              {String.fromCharCode(65 + i)} · {p.name.split(' + ')[0]}
            </a>
          ))}
        </nav>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 24 }}>
          {Object.entries(C).map(([name, hex]) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
              <span style={{ width: 28, height: 28, background: hex, border: `2px solid ${C.ink}`, borderRadius: 6 }} />
              {name} <span style={{ opacity: 0.55 }}>{hex}</span>
            </div>
          ))}
        </div>
      </header>

      {PAIRINGS.map((p, i) => <Section key={p.id} p={p} index={i} />)}
    </div>
  );
}
