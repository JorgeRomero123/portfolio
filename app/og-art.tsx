// Shared artwork for the site's Open Graph / Twitter image and its icons (next/og ImageResponse).
// The share image is the home hero in small: the JR mark, the eyebrow, the headline and three numbers.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';

export const ogSize = { width: 1200, height: 630 };
export const ogAlt = 'Jorge Romero Romanis, software engineer: I build for millions, then go build something fun.';

const ACCENT = '#0070f3';
const INK = '#0b1b3a';

/**
 * Static TTFs kept in the repo: Satori reads neither woff2 nor variable fonts, and a download at
 * build time would fail the deploy the day that request does.
 */
function font(file: string) {
  return readFile(path.join(process.cwd(), 'app', 'fonts', file));
}

/** Same numbers the home leads with. */
const STATS = [
  { value: '1.5M', label: 'users on PayPal Fastlane' },
  { value: '400%', label: 'DAU growth at Microsoft Bing' },
  { value: '25', label: 'tools on this site' },
];

export async function renderOg() {
  const [sansBold, sansMedium, monoBold, monoMedium] = await Promise.all([
    font('SpaceGrotesk-Bold.ttf'),
    font('SpaceGrotesk-Medium.ttf'),
    font('JetBrainsMono-Bold.ttf'),
    font('JetBrainsMono-Medium.ttf'),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', position: 'relative', background: '#f7f9fc',
          padding: '50px 68px 46px', fontFamily: 'Space Grotesk', color: INK,
        }}
      >
        {/* the hero's marquee, as a faint band behind the copy */}
        <div
          style={{
            position: 'absolute', left: -46, top: 196, display: 'flex', whiteSpace: 'nowrap',
            fontSize: 232, fontWeight: 700, letterSpacing: -7, lineHeight: 1,
            color: 'rgba(11,27,58,0.035)',
          }}
        >
          SOFTWARE × PHOTOGRAPHY × 360°
        </div>

        {/* brand */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'JetBrains Mono' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div
              style={{
                width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `2.5px solid ${ACCENT}`, color: ACCENT, fontSize: 22, fontWeight: 700, letterSpacing: -1,
              }}
            >
              JR
            </div>
            <div style={{ display: 'flex', fontSize: 20, fontWeight: 500, letterSpacing: 2.4, color: '#44557a' }}>
              jorge romero romanis
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 500, letterSpacing: 1.6, color: '#047857' }}>
            <div style={{ width: 11, height: 11, borderRadius: 11, background: '#059669' }} />
            available
          </div>
        </div>

        {/* the hero copy */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontFamily: 'JetBrains Mono', fontSize: 20, fontWeight: 500, letterSpacing: 5.6, color: ACCENT }}>
            MÉXICO · SOFTWARE ENGINEER · BUILDS TOO MUCH
          </div>
          <div style={{ display: 'flex', marginTop: 16, fontSize: 138, fontWeight: 700, letterSpacing: -5, lineHeight: 1 }}>
            Hi, I’m Jorge.
          </div>
          <div style={{ display: 'flex', marginTop: 10, fontSize: 43, fontWeight: 500, letterSpacing: -0.9, color: '#64789b' }}>
            I build for millions, then go build something fun.
          </div>
        </div>

        {/* the numbers */}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 26, borderTop: '1.5px solid #dbe3ef' }}>
          {STATS.map((s) => (
            <div key={s.value} style={{ display: 'flex', alignItems: 'baseline', gap: 13 }}>
              <div style={{ display: 'flex', fontFamily: 'JetBrains Mono', fontSize: 34, fontWeight: 700, color: ACCENT }}>
                {s.value}
              </div>
              <div style={{ display: 'flex', fontSize: 20, fontWeight: 500, color: '#64789b' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        { name: 'Space Grotesk', data: sansBold, weight: 700, style: 'normal' },
        { name: 'Space Grotesk', data: sansMedium, weight: 500, style: 'normal' },
        { name: 'JetBrains Mono', data: monoBold, weight: 700, style: 'normal' },
        { name: 'JetBrains Mono', data: monoMedium, weight: 500, style: 'normal' },
      ],
    },
  );
}

/**
 * The JR mark as an icon. The nav draws it as a thin blue outline, which disappears at 16px and on
 * a dark tab bar, so the icon is the same mark filled in: blue square, white letters.
 * `radius` is 0 for the home-screen icon, because iOS cuts its own corners on top.
 */
export async function renderIcon(px: number, radius: number) {
  const monoBold = await font('JetBrainsMono-Bold.ttf');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: ACCENT, borderRadius: radius, color: '#ffffff',
          fontFamily: 'JetBrains Mono', fontSize: px * 0.56, fontWeight: 700, letterSpacing: -px * 0.035,
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
