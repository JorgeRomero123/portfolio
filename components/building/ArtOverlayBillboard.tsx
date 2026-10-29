import { Bricolage_Grotesque, Knewave } from 'next/font/google';
import { AO, ArtOverlayLogo } from '@/components/artoverlay/brand';
import { C } from '@/components/illustration/ink';

/**
 * A rooftop billboard for Art Overlay, the newest thing Jorge has shipped. The poster is
 * in Art Overlay's own colours and type; everything around it (steel frame, catwalk,
 * floodlights, the snipe sticker, Arty breaking out of the frame) is what makes it read
 * as a real billboard rather than a card.
 */

const bricolage = Bricolage_Grotesque({ subsets: ['latin'], weight: ['500', '700', '800'] });
const knewave = Knewave({ subsets: ['latin'], weight: '400' });

const INK = '#1B1B1B';
const HREF = 'https://artoverlay.com/?utm_source=portfolio&utm_medium=referral&utm_campaign=building-billboard';

/** Flat shapes behind the copy, like the product's own. */
const SHAPES: React.CSSProperties[] = [
  { width: '34%', aspectRatio: '1', borderRadius: '50%', background: AO.coral, right: '18%', top: '30%' },
  { width: '52%', height: '22%', background: AO.hoja, right: '-12%', top: '6%', transform: 'rotate(-18deg)' },
  { width: '46%', aspectRatio: '2', borderRadius: '50%', background: AO.lila, left: '-10%', bottom: '-14%', transform: 'rotate(10deg)' },
  { width: '30%', aspectRatio: '1.6', background: AO.sol, right: '-4%', bottom: '-6%', clipPath: 'polygon(20% 0, 100% 0, 80% 100%, 0 100%)' },
];

/** Floodlights on the catwalk, as a fraction of the board's width. */
const LIGHTS = [0.18, 0.5, 0.82];

export default function ArtOverlayBillboard() {
  return (
    <a
      href={HREF}
      target="_blank"
      rel="noopener"
      className={`aob ${bricolage.className}`}
      aria-label="Art Overlay, the newest thing I've built, with 1,000+ daily active users. Opens artoverlay.com"
      style={{ display: 'block', position: 'relative', zIndex: 1, color: AO.tinta, textDecoration: 'none' }}
    >
      <style>{`
        .aob-frame { transition: transform .3s cubic-bezier(.2,.6,.2,1); }
        .aob:hover .aob-frame { transform: translateY(-3px); }
        .aob:focus-visible { outline: 3px solid ${AO.acento}; outline-offset: 6px; }
        .aob-grid { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, .7fr); }
        /* sized by width so he stays in the right-hand column; at that width he's a little
           taller than the poster, which is what lifts him out over the frame */
        .aob-arty { position: absolute; right: 1%; bottom: 0; width: 44%; height: auto; }
        @media (max-width: 760px) {
          .aob-grid { grid-template-columns: 1fr; }
          .aob-arty { position: relative; right: auto; display: block; height: auto; width: 72%; margin: -10px auto 0; }
        }
      `}</style>

      {/* steel frame, bolted at the corners */}
      <div className="aob-frame" style={{ position: 'relative', background: C.charcoal, border: `3px solid ${INK}`, boxShadow: `7px 7px 0 ${INK}`, padding: 10 }}>
        {[{ top: 3, left: 3 }, { top: 3, right: 3 }, { bottom: 3, left: 3 }, { bottom: 3, right: 3 }].map((pos, i) => (
          <span key={i} aria-hidden style={{ position: 'absolute', ...pos, width: 7, height: 7, borderRadius: '50%', background: C.steel, border: `1.5px solid ${INK}` }} />
        ))}

        {/* the poster */}
        <div style={{ position: 'relative', border: `3px solid ${INK}`, background: 'linear-gradient(150deg,#fff3b0 0%,#ffe0c7 36%,#ecdcf7 70%,#cddfff 100%)' }}>
          <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            {SHAPES.map((s, i) => <span key={i} style={{ position: 'absolute', mixBlendMode: 'multiply', opacity: 0.85, ...s }} />)}
            {/* the joins between the paper sheets the poster is pasted up in */}
            <span style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, transparent 0 calc(25% - 1px), rgba(29,24,54,.14) calc(25% - 1px) 25%)' }} />
          </div>

          <div className="aob-grid" style={{ position: 'relative', padding: 'clamp(22px,3.4vw,44px)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>
                <ArtOverlayLogo />
                Art Overlay
              </div>
              <div className={knewave.className} style={{ color: AO.acento, fontSize: 'clamp(42px,6vw,88px)', lineHeight: 0.95, transform: 'rotate(-3deg)', transformOrigin: 'left', margin: 'clamp(12px,1.8vw,22px) 0 0' }}>
                Make something.
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px 14px', marginTop: 'clamp(14px,2vw,24px)' }}>
                <span style={{ fontWeight: 800, fontSize: 'clamp(56px,7.4vw,108px)', letterSpacing: '-0.055em', lineHeight: 0.88 }}>1,000+</span>
                <span style={{ fontWeight: 700, fontSize: 'clamp(18px,1.9vw,26px)', letterSpacing: '-0.02em', lineHeight: 1.05, maxWidth: '8ch' }}>daily active users</span>
              </div>
              <p style={{ fontWeight: 500, fontSize: 'clamp(15px,1.35vw,18px)', lineHeight: 1.45, color: AO.tenue, margin: '14px 0 0', maxWidth: '36ch' }}>
                Trace any image with your phone camera. Free, no account, nothing to install.
              </p>
              <span style={{ display: 'inline-block', marginTop: 18, background: AO.sol, border: `2.5px solid ${AO.tinta}`, borderRadius: 999, padding: '8px 18px', fontWeight: 800, fontSize: 17 }}>
                artoverlay.com →
              </span>
            </div>
          </div>

          {/* Arty is a cut-out extension: taller than the poster, so he breaks out over the frame */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="aob-arty"
            src="/artoverlay/arty.webp"
            alt=""
            width={860}
            height={762}
            loading="lazy"
            decoding="async"
            style={{ filter: `drop-shadow(5px 5px 0 ${INK})` }}
          />

          {/* the snipe: a sticker pasted over the top edge */}
          <span style={{ position: 'absolute', top: -20, left: 'clamp(16px,4vw,48px)', transform: 'rotate(-4deg)', background: AO.coral, color: '#fff', border: `3px solid ${INK}`, boxShadow: `3px 3px 0 ${INK}`, padding: '6px 14px', fontWeight: 800, fontSize: 'clamp(12px,1.1vw,15px)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            the newest from me
          </span>
        </div>

        {/* floodlight glow washing up the poster */}
        {LIGHTS.map((x) => (
          <span key={x} aria-hidden style={{ position: 'absolute', left: `${x * 100 - 16}%`, width: '32%', bottom: 0, height: '78%', clipPath: 'polygon(44% 100%, 56% 100%, 100% 0, 0 0)', background: 'linear-gradient(to top, rgba(255,243,176,.6), rgba(255,243,176,0))', mixBlendMode: 'screen', pointerEvents: 'none' }} />
        ))}
      </div>

      {/* catwalk with the floodlights on it */}
      <div aria-hidden style={{ position: 'relative', margin: '0 3%', height: 14, border: `3px solid ${INK}`, borderTop: 'none', background: `repeating-linear-gradient(90deg, ${C.steel} 0 7px, ${C.charcoal} 7px 9px)` }}>
        {LIGHTS.map((x) => (
          <span key={x} style={{ position: 'absolute', left: `calc(${x * 100}% - 14px)`, top: -16, width: 28, height: 14, background: C.charcoal, border: `2.5px solid ${INK}`, borderRadius: '8px 8px 2px 2px' }} />
        ))}
      </div>
    </a>
  );
}
