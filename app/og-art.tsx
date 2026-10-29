// Shared artwork for the site's Open Graph / Twitter image and its icons (next/og ImageResponse).
// The share image is the homepage in small: the building in cutaway on the left (shaft, car,
// floors in their wall colours) and the hero sign with the numbers on the right.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { ALL_TOOLS } from '@/lib/tools';

export const ogSize = { width: 1200, height: 630 };
export const ogAlt =
  'Jorge Romero Romanis, software engineer: I build for millions, then go build something fun. A portfolio you ride down in an elevator.';

/** The building's palette (see components/illustration/ink.tsx). */
const INK = '#1B1B1B';
const PAPER = '#F4EDE1';
const CREAM = '#FFFAF2';
const PINK = '#D98580';
const MUSTARD = '#E5A23C';
const STEEL = '#CFCBC3';
const SKY = '#DCDAF5';
const dots = 'radial-gradient(circle, rgba(27,27,27,0.16) 1.6px, transparent 2.2px)';

/**
 * Static TTFs kept in the repo: Satori reads neither woff2 nor variable fonts, and a download at
 * build time would fail the deploy the day that request does.
 */
function font(file: string) {
  return readFile(path.join(process.cwd(), 'app', 'fonts', file));
}

/** The homepage's floors below the roof, top to bottom, in their wall colours. */
const FLOORS = [
  { key: '5', label: 'work', wall: '#B8B6EA' },
  { key: '4', label: 'game room', wall: '#F3DCA4' },
  { key: '3', label: 'tools', wall: '#F0C49B' },
  { key: '2', label: 'gallery', wall: '#F2CBC6' },
  { key: '1', label: 'contact', wall: '#CDE0C3' },
];

/** Same numbers the home leads with. */
const STATS = [
  { value: '1.5M', label: 'users on PayPal Fastlane', bg: PINK },
  { value: '400%', label: 'DAU growth at Microsoft Bing', bg: MUSTARD },
  { value: String(ALL_TOOLS.length), label: 'tools on this site', bg: '#CDE0C3' },
];

/** The glass shaft with the car parked at the roof, Jorge inside. */
function Shaft() {
  return (
    <div style={{ display: 'flex', position: 'relative', width: 70, background: '#DFDAE4', borderRight: `4px solid ${INK}` }}>
      <div style={{ position: 'absolute', left: 33, top: 0, bottom: 0, width: 2, background: INK }} />
      <div
        style={{
          position: 'absolute', left: 8, top: 52, width: 50, height: 70, display: 'flex',
          background: STEEL, border: `3px solid ${INK}`, borderRadius: 4, padding: 4,
        }}
      >
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', background: '#F0C49B', border: `2px solid ${INK}` }}>
          <div style={{ width: 16, height: 16, borderRadius: 16, background: '#E2A57F', border: `2px solid ${INK}`, borderTop: '5px solid #2A211C' }} />
          <div style={{ width: 22, height: 22, background: '#8FA882', border: `2px solid ${INK}`, borderRadius: '6px 6px 0 0', marginTop: -1 }} />
        </div>
      </div>
    </div>
  );
}

function Building() {
  return (
    <div style={{ display: 'flex', width: 360, border: `4px solid ${INK}`, boxShadow: `8px 8px 0 ${INK}`, background: PAPER }}>
      <Shaft />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* the roof, with the billboard */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 150, background: SKY, padding: '0 18px' }}>
          <div
            style={{
              display: 'flex', flexDirection: 'column', width: '100%', padding: '10px 14px',
              background: 'linear-gradient(150deg,#fff3b0 0%,#ffe0c7 36%,#ecdcf7 70%,#cddfff 100%)',
              border: `5px solid #3A3A3A`, outline: `3px solid ${INK}`, color: '#1d1836',
            }}
          >
            <div style={{ display: 'flex', fontSize: 15, fontWeight: 700 }}>Art Overlay</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <div style={{ display: 'flex', fontSize: 40, fontWeight: 700, letterSpacing: -1.5 }}>1,000+</div>
              <div style={{ display: 'flex', fontSize: 14, fontWeight: 700, color: '#6b3bf2' }}>daily users</div>
            </div>
          </div>
        </div>
        {FLOORS.map((f) => (
          <div key={f.key} style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 14px', background: f.wall, borderTop: `4px solid ${INK}` }}>
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '2px 8px 2px 3px', background: MUSTARD,
                border: `2.5px solid ${INK}`, fontFamily: 'JetBrains Mono', fontSize: 14, fontWeight: 700,
              }}
            >
              <div style={{ width: 20, height: 20, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: CREAM, border: `2px solid ${INK}`, fontSize: 12 }}>
                {f.key}
              </div>
              {f.label}
            </div>
          </div>
        ))}
        <div style={{ height: 16, background: '#3F8F45', borderTop: `4px solid ${INK}` }} />
      </div>
    </div>
  );
}

export async function renderOg() {
  const [sansBold, sansMedium, monoBold, monoMedium] = await Promise.all([
    font('FamiljenGrotesk-Bold.ttf'),
    font('FamiljenGrotesk-Medium.ttf'),
    font('JetBrainsMono-Bold.ttf'),
    font('JetBrainsMono-Medium.ttf'),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', gap: 44, padding: '40px 48px 44px',
          background: PAPER, backgroundImage: dots, backgroundSize: '14px 14px',
          fontFamily: 'Familjen Grotesk', color: INK,
        }}
      >
        <Building />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {/* the hero sign */}
          <div style={{ display: 'flex', flexDirection: 'column', background: CREAM, border: `4px solid ${INK}`, boxShadow: `10px 10px 0 ${INK}`, padding: '28px 34px 30px' }}>
            <div style={{ display: 'flex', fontFamily: 'JetBrains Mono', fontSize: 17, fontWeight: 500, letterSpacing: 3.4 }}>
              MÉXICO · SOFTWARE ENGINEER · BUILDS TOO MUCH
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 14, fontSize: 104, fontWeight: 700, letterSpacing: -4.5, lineHeight: 1 }}>
              Hi, I’m
              <div style={{ display: 'flex', marginLeft: 22, padding: '0 12px', background: PINK }}>Jorge.</div>
            </div>
            <div style={{ display: 'flex', marginTop: 14, fontSize: 36, fontWeight: 700, letterSpacing: -0.8, lineHeight: 1.1 }}>
              I build for millions, then go build something fun.
            </div>
          </div>

          {/* the numbers, as stickers */}
          <div style={{ display: 'flex', gap: 18 }}>
            {STATS.map((s) => (
              <div key={s.value} style={{ flex: 1, display: 'flex', flexDirection: 'column', background: s.bg, border: `3px solid ${INK}`, boxShadow: `5px 5px 0 ${INK}`, padding: '10px 14px 12px' }}>
                <div style={{ display: 'flex', fontSize: 40, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1 }}>{s.value}</div>
                <div style={{ display: 'flex', fontSize: 17, fontWeight: 500, lineHeight: 1.2, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignSelf: 'flex-start', fontFamily: 'JetBrains Mono', fontSize: 19, fontWeight: 700, background: MUSTARD, border: `3px solid ${INK}`, padding: '5px 14px' }}>
            jorgeromeroromanis.com
          </div>
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        { name: 'Familjen Grotesk', data: sansBold, weight: 700, style: 'normal' },
        { name: 'Familjen Grotesk', data: sansMedium, weight: 500, style: 'normal' },
        { name: 'JetBrains Mono', data: monoBold, weight: 700, style: 'normal' },
        { name: 'JetBrains Mono', data: monoMedium, weight: 500, style: 'normal' },
      ],
    },
  );
}

/**
 * The JR mark as an icon, in the building's colours: ink letters on mustard inside an ink
 * border, like the floor plates. `radius` is 0 for the home-screen icon, because iOS cuts its
 * own corners on top.
 */
export async function renderIcon(px: number, radius: number) {
  const monoBold = await font('JetBrainsMono-Bold.ttf');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: MUSTARD, borderRadius: radius, border: `${Math.max(2, Math.round(px * 0.06))}px solid ${INK}`, color: INK,
          fontFamily: 'JetBrains Mono', fontSize: px * 0.5, fontWeight: 700, letterSpacing: -px * 0.035,
        }}
      >
        JR
      </div>
    ),
    {
      width: px,
      height: px,
      fonts: [{ name: 'JetBrains Mono', data: monoBold, weight: 700, style: 'normal' }],
    },
  );
}
