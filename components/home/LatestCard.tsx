'use client';

import { useRef } from 'react';
import { Bricolage_Grotesque, Knewave } from 'next/font/google';
import { motion, useScroll, useTransform } from 'framer-motion';
import { AO, ArtOverlayLogo } from '@/components/artoverlay/brand';

/**
 * Art Overlay's own two families, loaded only for this card: Bricolage for
 * everything that is read, Knewave for the one brush line.
 */
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], weight: ['500', '700'] });
const knewave = Knewave({ subsets: ['latin'], weight: '400' });


/** Flat shapes with a hand-drawn ink outline that never quite closes: the same ones the product uses. */
const SHAPES = {
  circle: {
    box: '0 0 110 110',
    shape: <circle cx="52" cy="58" r="48" />,
    stroke: 'M60 6 C89 5 107 27 106 53 C105 81 83 101 56 100 C28 99 8 77 10 50 C12 24 33 6 64 9',
  },
  ellipse: {
    box: '0 0 220 130',
    shape: <ellipse cx="106" cy="68" rx="102" ry="56" />,
    stroke: 'M118 7 C176 5 216 30 214 62 C212 97 166 121 108 120 C51 119 9 96 11 60 C13 28 58 6 126 10',
  },
  bar: {
    box: '0 0 320 80',
    shape: <rect x="4" y="16" width="304" height="58" />,
    stroke: 'M14 8 L316 11 L314 67 L11 64 L15 4',
  },
  rhombus: {
    box: '0 0 220 140',
    shape: <polygon points="44,14 208,14 168,134 4,134" />,
    stroke: 'M54 6 L217 9 L176 126 L13 124 L57 3',
  },
} as const;

function Shape({
  type, color, style, className, delay = 0, traced = true, reduced,
}: {
  type: keyof typeof SHAPES;
  color: string;
  style: React.CSSProperties;
  className?: string;
  delay?: number;
  /** Without it only the flat colour is drawn, for the shapes that sit furthest back. */
  traced?: boolean;
  reduced: boolean;
}) {
  const s = SHAPES[type];
  return (
    <svg viewBox={s.box} aria-hidden focusable="false" overflow="visible" className={className} style={{ position: 'absolute', ...style }}>
      <g fill={color}>{s.shape}</g>
      {traced && (
        <motion.path
          d={s.stroke}
          fill="none"
          stroke={AO.tinta}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduced ? false : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: '-18%' }}
          transition={{ duration: 1.5, delay, ease: [0.6, 0, 0.3, 1] }}
        />
      )}
    </svg>
  );
}


const PROMISES = ['Free forever', 'No account', 'Nothing to install'];

/**
 * The one loud thing on a quiet page. It is drawn as a window cut into the
 * page, with Art Overlay sitting on a layer behind it: the page casts an inner
 * shadow onto the card, the shapes and the mascot run off past the edge of the
 * opening, and everything inside scrolls a little slower than the page does.
 */
export default function LatestCard({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  // Lagging behind the scroll is what reads as depth: the further back, the more it lags.
  const farY = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [-56, 56]);
  const nearY = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [-16, 16]);

  return (
    <a
      ref={ref}
      href="https://artoverlay.com/?utm_source=portfolio&utm_medium=referral&utm_campaign=latest-card"
      target="_blank"
      rel="noopener"
      data-reveal
      className={`jrr-latest ${bricolage.className}`}
      style={{
        display: 'block', position: 'relative', overflow: 'hidden', isolation: 'isolate',
        borderRadius: 30, textDecoration: 'none', color: AO.tinta,
        background: 'linear-gradient(150deg,#fff3b0 0%,#ffe0c7 36%,#ecdcf7 70%,#cddfff 100%)',
        // the lip of the opening: a hairline, and the light catching its lower edge
        boxShadow: '0 0 0 1px rgba(11,27,58,0.07), 0 1.5px 0 #ffffff',
      }}
    >
      <style>{`
        .jrr-latest-stage{transition:transform .5s cubic-bezier(.2,.6,.2,1);}
        .jrr-latest:hover .jrr-latest-stage{transform:scale(1.018);}
        .jrr-latest-shade{transition:opacity .5s;}
        .jrr-latest:hover .jrr-latest-shade{opacity:.72;}
        .jrr-latest-cta{transition:transform .12s ease,background-color .15s;}
        .jrr-latest:hover .jrr-latest-cta{background:#5326d9;transform:translateY(-1px);}
        .jrr-latest-arrow{display:inline-block;transition:transform .3s cubic-bezier(.2,.6,.2,1);}
        .jrr-latest:hover .jrr-latest-arrow{transform:translateX(4px);}
        .jrr-latest-grid{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(0,0.92fr);align-items:center;gap:8px;padding:clamp(30px,4.4vw,58px);}
        .jrr-latest-arty{margin:-18px -56px -96px 0;}
        @media (max-width:860px){
          .jrr-latest-grid{grid-template-columns:1fr;padding:28px 24px 0;}
          .jrr-latest-arty{margin:14px auto -44px;max-width:340px;}
          /* stacked, the circle would land in the middle of the copy */
          .jrr-latest-dot{display:none;}
        }
        @media (prefers-reduced-motion: reduce){
          .jrr-latest-stage,.jrr-latest-cta,.jrr-latest-arrow{transition:none!important;transform:none!important;}
        }
      `}</style>

      <div className="jrr-latest-stage">
        {/* the furthest layer: flat shapes, multiplied over the gradient */}
        <motion.div aria-hidden style={{ y: farY, position: 'absolute', inset: '-60px 0', mixBlendMode: 'multiply', pointerEvents: 'none' }}>
          <Shape reduced={reduced} type="bar" color={AO.hoja} delay={0.3} style={{ width: 'min(46%,420px)', right: '-7%', top: 78, transform: 'rotate(-24deg)' }} />
          <Shape reduced={reduced} type="circle" color={AO.coral} className="jrr-latest-dot" delay={0.7} style={{ width: 'min(20%,170px)', right: '31%', top: '46%' }} />
          <Shape reduced={reduced} type="ellipse" color={AO.lila} traced={false} style={{ width: 'min(52%,460px)', left: '-14%', bottom: 10, transform: 'rotate(12deg)' }} />
          <Shape reduced={reduced} type="rhombus" color={AO.sol} delay={1.1} style={{ width: 'min(30%,280px)', right: '-5%', bottom: 44, transform: 'rotate(6deg)' }} />
        </motion.div>

        <motion.div className="jrr-latest-grid" style={{ y: nearY, position: 'relative' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>
              <ArtOverlayLogo />
              Art Overlay
            </div>

            <p
              className={knewave.className}
              style={{
                color: AO.acento, fontSize: 'clamp(56px,7vw,98px)', lineHeight: 0.92,
                transform: 'rotate(-3deg)', transformOrigin: 'left', margin: 'clamp(18px,2.6vw,30px) 0 0',
              }}
            >
              Make something.
            </p>

            <h3 style={{ fontSize: 'clamp(22px,2.5vw,31px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.15, marginTop: 'clamp(20px,2.8vw,32px)', maxWidth: '20ch' }}>
              Trace any image with your phone camera. Free.
            </h3>

            <p style={{ fontSize: 'clamp(15px,1.35vw,17.5px)', lineHeight: 1.6, color: AO.tenue, marginTop: 12, maxWidth: '44ch', fontWeight: 500 }}>
              Point the camera at paper, lay a reference photo over the live view and trace
              it by hand. It runs in the browser, and thousands of people draw with it every week.
            </p>

            <ul style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 22, padding: 0, listStyle: 'none', fontSize: 13.5, fontWeight: 700 }}>
              {PROMISES.map((p) => (
                <li key={p} style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 999, padding: '7px 14px' }}>{p}</li>
              ))}
            </ul>

            <span
              className="jrr-latest-cta"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 26,
                background: AO.acento, color: '#ffffff', fontSize: 16, fontWeight: 700,
                borderRadius: 12, padding: '14px 24px',
                boxShadow: '0 10px 20px -10px rgb(83 38 217 / 0.7)',
              }}
            >
              Open artoverlay.com <span className="jrr-latest-arrow" aria-hidden>→</span>
            </span>
          </div>

          {/* Arty, Art Overlay's octopus. Larger than the room it has, so the opening crops it. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="jrr-latest-arty"
            src="/artoverlay/arty.webp"
            alt="Arty, Art Overlay's octopus mascot, holding a pencil, a phone and a stack of drawings"
            width={860}
            height={762}
            loading="lazy"
            decoding="async"
            style={{ display: 'block', width: '100%', height: 'auto', filter: 'drop-shadow(0 18px 22px rgba(29,24,54,0.18))' }}
          />
        </motion.div>
      </div>

      {/* the shadow the page casts down into the opening; it sits above everything inside */}
      <span
        aria-hidden
        className="jrr-latest-shade"
        style={{
          position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none',
          boxShadow:
            'inset 0 16px 26px -12px rgba(29,24,54,0.50), inset 0 3px 5px rgba(29,24,54,0.20), ' +
            'inset 14px 0 22px -18px rgba(29,24,54,0.42), inset -14px 0 22px -18px rgba(29,24,54,0.42), ' +
            'inset 0 -10px 18px -16px rgba(29,24,54,0.30)',
        }}
      />
    </a>
  );
}
