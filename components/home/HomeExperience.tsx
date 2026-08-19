'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useMotionValueEvent,
} from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

import { createHeroScene, type HeroHandle } from './lib/heroScene';
import { createWorldScene, type WorldHandle } from './lib/worldScene';
import { useSmoothScroll } from './lib/useSmoothScroll';
import { useEasterEggs } from './lib/useEasterEggs';
import { usePrefersReducedMotion } from './lib/usePrefersReducedMotion';
import Counter from './Counter';
import ProjectCard from './ProjectCard';
import ToolWall from './ToolWall';
import GalleryTile from './GalleryTile';
import {
  MONO, SANS, NAV_LINKS, TECH, STATS, TRUTHS, PROJECTS, TOOL_COUNT,
} from './data';

type Hero = { url: string; title: string } | null;

/**
 * Division of labour between the two motion libraries:
 *   GSAP + ScrollTrigger  → scroll choreography (pinning, scrub, batch reveals,
 *                            SplitText). Anything tied to scroll position.
 *   Framer Motion         → component-level interaction (spring tilt, counters,
 *                            hover, AnimatePresence overlays).
 * Lenis smooths the scroll both of them read from.
 */
export default function HomeExperience({
  photographyHero = null,
  panoramaHero = null,
}: {
  photographyHero?: Hero;
  panoramaHero?: Hero;
} = {}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const heroCanvasRef = useRef<HTMLCanvasElement>(null);
  const worldCanvasRef = useRef<HTMLCanvasElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const exploreRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const heroHandle = useRef<HeroHandle | null>(null);
  const worldHandle = useRef<WorldHandle | null>(null);

  const reduced = usePrefersReducedMotion();
  const { scrollTo } = useSmoothScroll(!reduced);

  const { spurs, idleHint } = useEasterEggs({
    onSpurs: () => {
      heroHandle.current?.setPalette('spurs');
      heroHandle.current?.burst();
      worldHandle.current?.setPalette('spurs');
    },
    onSpursEnd: () => {
      heroHandle.current?.setPalette('default');
      worldHandle.current?.setPalette('default');
    },
  });

  // ---- nav: hide going down, reveal coming back up ----
  const { scrollY } = useScroll();
  const navY = useSpring(0, { stiffness: 320, damping: 34 });
  const lastY = useRef(0);
  useMotionValueEvent(scrollY, 'change', (y) => {
    const goingDown = y > lastY.current && y > 220;
    navY.set(goingDown ? -110 : 0);
    lastY.current = y;
  });

  // ---- hero parallax on the copy block ----
  const { scrollYProgress: heroProgress } = useScroll({
    target: rootRef,
    offset: ['start start', '80vh start'],
  });
  const heroCopyY = useTransform(heroProgress, [0, 1], [0, 90]);
  const heroCopyOpacity = useTransform(heroProgress, [0, 0.75], [1, 0]);

  // ---- WebGL ----
  useEffect(() => {
    if (heroCanvasRef.current) {
      try {
        heroHandle.current = createHeroScene(heroCanvasRef.current, { reducedMotion: reduced });
      } catch (e) { console.warn('hero scene', e); }
    }
    if (worldCanvasRef.current) {
      try {
        worldHandle.current = createWorldScene(worldCanvasRef.current, { reducedMotion: reduced });
      } catch (e) { console.warn('world scene', e); }
    }

    const onResize = () => {
      heroHandle.current?.resize();
      worldHandle.current?.resize();
    };
    window.addEventListener('resize', onResize);

    // Feed the cursor to the hero shader so the cloud reacts before any drag.
    const onPointer = (e: PointerEvent) => {
      const c = heroCanvasRef.current;
      if (!c) return;
      const r = c.getBoundingClientRect();
      const inside = e.clientY >= r.top && e.clientY <= r.bottom;
      heroHandle.current?.setPointer(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        -(((e.clientY - r.top) / r.height) * 2 - 1),
        inside,
      );
    };
    window.addEventListener('pointermove', onPointer);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointer);
      heroHandle.current?.dispose();
      worldHandle.current?.dispose();
      heroHandle.current = null;
      worldHandle.current = null;
    };
  }, [reduced]);

  // ---- GSAP: headline split, batch reveals, pinned horizontal gallery ----
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger, SplitText);

    const ctx = gsap.context(() => {
      // headline — per-character rise out of a masked line
      if (headlineRef.current && !reduced) {
        const split = SplitText.create(headlineRef.current, {
          type: 'chars,lines',
          mask: 'lines',
        });
        gsap.from(split.chars, {
          yPercent: 118,
          opacity: 0,
          duration: 0.95,
          ease: 'power4.out',
          stagger: 0.021,
          delay: 0.15,
        });
      }

      // scroll reveals
      if (reduced) {
        gsap.set('[data-reveal]', { opacity: 1, y: 0 });
      } else {
        ScrollTrigger.batch('[data-reveal]', {
          start: 'top 86%',
          onEnter: (els) => gsap.to(els, {
            opacity: 1, y: 0, duration: 0.85, stagger: 0.08,
            ease: 'power3.out', overwrite: true,
          }),
        });
      }

      // pinned horizontal gallery — ScrollTrigger creates the scroll distance
      // itself, so the section no longer needs a hand-computed height.
      const track = trackRef.current;
      const section = exploreRef.current;
      if (track && section && !reduced) {
        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + 40);

        gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: () => '+=' + distance(),
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (barRef.current) barRef.current.style.width = 8 + self.progress * 92 + '%';
            },
          },
        });
      }
    }, rootRef);

    return () => ctx.revert();
  }, [reduced]);

  const accent = spurs ? '#ffffff' : '#ff6a3d';

  return (
    <div
      ref={rootRef}
      style={{
        background: spurs ? '#0a0e1c' : '#0b0a09',
        color: '#f6f0e9',
        fontFamily: SANS,
        // `clip` (not `hidden`) prevents horizontal overflow WITHOUT creating a
        // scroll container — which would otherwise break ScrollTrigger's pinning.
        overflowX: 'clip',
        position: 'relative',
        transition: 'background 0.6s ease',
      }}
    >
      <style>{`
        ::selection{background:${accent};color:#0b0a09;}
        @keyframes jrr-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes jrr-marquee2{from{transform:translateX(-50%)}to{transform:translateX(0)}}
        [data-reveal]{opacity:0;transform:translateY(28px);}
        @media (prefers-reduced-motion: reduce){
          [data-reveal]{opacity:1!important;transform:none!important;}
          .jrr-marquee{animation:none!important;}
        }
        a:focus-visible{outline:2px solid ${accent};outline-offset:4px;border-radius:4px;}
        .jrr-navlink:focus-visible::after{transform:scaleX(1);transform-origin:left;}
        .jrr-navlink{position:relative;}
        .jrr-navlink::after{content:'';position:absolute;left:0;bottom:-5px;width:100%;height:1px;background:${accent};transform:scaleX(0);transform-origin:right;transition:transform .35s cubic-bezier(.2,.6,.2,1);}
        .jrr-navlink:hover::after{transform:scaleX(1);transform-origin:left;}
        @media (max-width:860px){
          .jrr-navlinks{gap:18px!important;}
          .jrr-hint-drag{display:none!important;}
        }
        @media (max-width:680px){
          .jrr-navbar{padding:14px 18px!important;}
          .jrr-brandtext{display:none!important;}
          .jrr-navlinks{gap:14px!important;font-size:11px!important;letter-spacing:0.04em!important;}
          .jrr-available{display:none!important;}
        }
        @media (max-width:430px){
          .jrr-navlinks .jrr-hide-xs{display:none!important;}
          .jrr-cta-row a{flex:1 1 auto;text-align:center;}
        }
      `}</style>

      {/* ===== NAV ===== */}
      <motion.nav
        className="jrr-navbar"
        style={{
          y: navY,
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px',
          backdropFilter: 'blur(8px)',
          background: 'linear-gradient(#0b0a09cc,#0b0a0900)',
        }}
      >
        <a
          href="#top"
          onClick={(e) => { e.preventDefault(); scrollTo('#top'); }}
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}
        >
          <motion.span
            whileHover={{ rotate: -8, scale: 1.08 }}
            transition={{ type: 'spring', stiffness: 380, damping: 14 }}
            style={{
              width: 34, height: 34, border: `1.5px solid ${accent}`, color: accent, display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontWeight: 700,
              fontSize: 13, letterSpacing: '-0.04em', flex: '0 0 auto',
            }}
          >
            JR
          </motion.span>
          <span className="jrr-brandtext" style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em', color: '#c0b6ac' }}>
            jorge romero romanis
          </span>
        </a>

        <div className="jrr-navlinks" style={{ display: 'flex', alignItems: 'center', gap: 28, fontFamily: MONO, fontSize: 12, letterSpacing: '0.08em' }}>
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => { e.preventDefault(); scrollTo(l.href); }}
              className={`jrr-navlink${l.label === 'live demo' ? ' jrr-hide-xs' : ''}`}
              style={{ color: '#c0b6ac', textDecoration: 'none', whiteSpace: 'nowrap' }}
            >
              {l.label}
            </a>
          ))}
          <span className="jrr-available" style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#8fb98a' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#7ed47a' }} />
            available
          </span>
        </div>
      </motion.nav>

      {/* ===== HERO ===== */}
      <section id="top" style={{ position: 'relative', height: '100vh', minHeight: 680, overflow: 'hidden' }}>
        <canvas ref={heroCanvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />

        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', overflow: 'hidden' }}>
          <div className="jrr-marquee" style={{
            display: 'flex', width: 'max-content', animation: 'jrr-marquee 26s linear infinite',
            fontWeight: 700, fontSize: 'clamp(90px,13vw,190px)', letterSpacing: '-0.03em',
            whiteSpace: 'nowrap', color: 'transparent', WebkitTextStroke: '1.3px rgba(255,255,255,0.08)',
          }}>
            <span style={{ padding: '0 38px' }}>SOFTWARE&nbsp;×&nbsp;PHOTOGRAPHY&nbsp;×&nbsp;360°&nbsp;×&nbsp;</span>
            <span style={{ padding: '0 38px' }}>SOFTWARE&nbsp;×&nbsp;PHOTOGRAPHY&nbsp;×&nbsp;360°&nbsp;×&nbsp;</span>
          </div>
        </div>

        <motion.div
          style={{
            y: heroCopyY, opacity: heroCopyOpacity,
            position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex',
            flexDirection: 'column', justifyContent: 'center', padding: '0 clamp(24px,7vw,110px)',
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: 13, letterSpacing: '0.28em', textTransform: 'uppercase', color: accent, marginBottom: 22 }}>
            méxico · software engineer · builds too much
          </div>

          <h1 ref={headlineRef} style={{ fontSize: 'clamp(54px,8.5vw,118px)', lineHeight: 0.92, fontWeight: 700, letterSpacing: '-0.035em', maxWidth: '11ch' }}>
            Hi, I&rsquo;m Jorge.
          </h1>

          <div style={{ display: 'block', color: '#9a8d80', fontWeight: 500, fontSize: 'clamp(27px,4.2vw,58px)', letterSpacing: '-0.02em', marginTop: 14, lineHeight: 1 }}>
            I build for millions, then go build something silly.
          </div>

          <p style={{ fontSize: 'clamp(16px,1.5vw,20px)', lineHeight: 1.55, color: '#c0b6ac', marginTop: 26, maxWidth: 560 }}>
            By day I ship production software to hundreds of thousands of people. By night I
            build browser toys nobody asked for — a singing coach, a chore tracker that emails
            my roommate, a 360° tour engine.
          </p>

          <div className="jrr-cta-row" style={{ display: 'flex', gap: 14, marginTop: 34, pointerEvents: 'auto', flexWrap: 'wrap' }}>
            <motion.a
              href="#work"
              onClick={(e) => { e.preventDefault(); scrollTo('#work'); }}
              whileHover={{ scale: 1.045 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 420, damping: 17 }}
              style={{ textDecoration: 'none', fontSize: 15, fontWeight: 600, color: '#0b0a09', background: accent, borderRadius: 12, padding: '15px 28px', display: 'inline-block' }}
            >
              See my work →
            </motion.a>
            <motion.a
              href="#demo"
              onClick={(e) => { e.preventDefault(); scrollTo('#demo'); }}
              whileHover={{ scale: 1.045, borderColor: 'rgba(255,255,255,0.45)' }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 420, damping: 17 }}
              style={{ textDecoration: 'none', fontSize: 15, fontWeight: 600, color: '#f6f0e9', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, padding: '15px 28px', display: 'inline-block' }}
            >
              Step into a 3D scene
            </motion.a>
          </div>
        </motion.div>

        <div className="jrr-hint-drag" style={{ position: 'absolute', bottom: 30, right: 40, fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', color: '#7a6e63' }}>
          the cloud follows your cursor ↺
        </div>
      </section>

      {/* ===== TECH MARQUEE ===== */}
      <div style={{ borderTop: '1px solid #211e1b', borderBottom: '1px solid #211e1b', padding: '20px 0', overflow: 'hidden', background: '#0d0c0b' }}>
        <div className="jrr-marquee" style={{ display: 'flex', width: 'max-content', animation: 'jrr-marquee2 30s linear infinite', fontFamily: MONO, fontSize: 14, letterSpacing: '0.1em', color: '#6b635a' }}>
          {[0, 1].map((dup) => (
            <span key={dup} style={{ display: 'flex', gap: 46, paddingRight: 46 }}>
              {TECH.map((tech) => (
                <span key={tech} style={{ display: 'contents' }}>
                  <span>{tech}</span>
                  <span style={{ color: accent }}>/</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ===== STATS ===== */}
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: 'clamp(90px,14vh,170px) clamp(24px,7vw,40px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(200px,100%),1fr))', gap: 34 }}>
          {STATS.map((s) => (
            <div key={s.label} data-reveal>
              <div style={{ fontFamily: MONO, fontSize: 38, fontWeight: 700, color: '#ffd089' }}>
                <Counter to={s.value} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: 14, color: '#9a8d80', marginTop: 6, lineHeight: 1.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== TRUTHS — the stuff a résumé leaves out ===== */}
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '0 clamp(24px,7vw,40px) clamp(80px,12vh,140px)' }}>
        <div data-reveal style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginBottom: 34, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: MONO, fontSize: 13, color: accent, letterSpacing: '0.1em' }}>01</span>
          <h2 style={{ fontSize: 'clamp(30px,4.4vw,52px)', fontWeight: 700, letterSpacing: '-0.03em' }}>
            The stuff a résumé leaves out
          </h2>
        </div>

        <div style={{ display: 'grid', gap: 0, borderTop: '1px solid #211e1b' }}>
          {TRUTHS.map((t) => (
            <motion.div
              key={t.k}
              data-reveal
              whileHover={{ backgroundColor: '#111010', paddingLeft: 14 }}
              transition={{ duration: 0.28 }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(140px,0.28fr) 1fr',
                gap: 20,
                alignItems: 'baseline',
                padding: '22px 0',
                borderBottom: '1px solid #211e1b',
              }}
            >
              <span style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b635a' }}>
                {t.k}
              </span>
              <span style={{ fontSize: 'clamp(16px,1.7vw,21px)', lineHeight: 1.5, color: '#c8bfb5' }}>
                {t.v}
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== SELECTED WORK ===== */}
      <section id="work" style={{ maxWidth: 1180, margin: '0 auto', padding: '0 clamp(24px,7vw,40px) clamp(60px,10vh,120px)' }}>
        <div data-reveal style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginBottom: 48, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: MONO, fontSize: 13, color: accent, letterSpacing: '0.1em' }}>02</span>
          <h2 style={{ fontSize: 'clamp(34px,5vw,60px)', fontWeight: 700, letterSpacing: '-0.03em' }}>Things I shipped</h2>
          <span style={{ fontFamily: MONO, fontSize: 13, color: '#7a6e63', letterSpacing: '0.04em', marginLeft: 'auto' }}>2 companies · 2 solo</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(330px,100%),1fr))', gap: 24 }}>
          {PROJECTS.map((p, i) => (
            <ProjectCard key={p.title} project={p} index={i} />
          ))}
        </div>
      </section>

      {/* ===== THE PILE — 25 tools ===== */}
      <section id="tools" style={{ maxWidth: 1180, margin: '0 auto', padding: 'clamp(40px,8vh,90px) clamp(24px,7vw,40px) clamp(80px,12vh,140px)' }}>
        <div data-reveal style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginBottom: 20, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: MONO, fontSize: 13, color: accent, letterSpacing: '0.1em' }}>03</span>
          <h2 style={{ fontSize: 'clamp(34px,5vw,60px)', fontWeight: 700, letterSpacing: '-0.03em' }}>The pile</h2>
          <span style={{ fontFamily: MONO, fontSize: 13, color: '#7a6e63', letterSpacing: '0.04em', marginLeft: 'auto' }}>{TOOL_COUNT} working tools</span>
        </div>

        <p data-reveal style={{ fontSize: 'clamp(16px,1.6vw,19px)', lineHeight: 1.6, color: '#9a8d80', maxWidth: '58ch', marginBottom: 50 }}>
          Every one of these is a real route on this site, built because I personally needed it
          and it was faster to write than to find. Some are genuinely useful. One tracks whose
          turn it is to clean the apartment.
        </p>

        <ToolWall />
      </section>

      {/* ===== EXPLORE — GSAP-PINNED HORIZONTAL GALLERY ===== */}
      <section
        ref={exploreRef}
        id="explore"
        style={{
          position: 'relative', background: '#0d0c0b', borderTop: '1px solid #211e1b',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          // With motion reduced the GSAP pin never runs, which would strand the
          // track inside a clipped 100vh box and make tiles 3-4 unreachable.
          // Fall back to a natively scrollable row instead.
          height: reduced ? 'auto' : '100vh',
          padding: reduced ? 'clamp(70px,10vh,110px) 0' : 0,
          overflowX: reduced ? 'auto' : 'hidden',
          overflowY: 'hidden',
        }}
      >
        <div style={{ padding: '0 clamp(24px,7vw,40px)', marginBottom: 32, display: 'flex', alignItems: 'baseline', gap: 18, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: MONO, fontSize: 13, color: accent, letterSpacing: '0.1em' }}>04</span>
          <h2 style={{ fontSize: 'clamp(30px,4.5vw,54px)', fontWeight: 700, letterSpacing: '-0.03em' }}>Other things I make</h2>
          <span style={{ fontFamily: MONO, fontSize: 12, color: '#7a6e63', marginLeft: 'auto' }}>keep scrolling →</span>
        </div>

        <div ref={trackRef} style={{ display: 'flex', gap: 26, padding: '0 clamp(24px,7vw,40px)', willChange: 'transform' }}>
          <GalleryTile
            href="/gallery" title="Photography" index="01 / 04"
            copy="Light, landscape, and the shots I keep coming back to."
            width="min(64vw,560px)" gradient="radial-gradient(120% 120% at 20% 15%,#2a1c14,#0c0b0a)" icon="📷"
            image={photographyHero?.url} imageAlt={photographyHero?.title}
          />

          <GalleryTile
            href="/gallery360" title="360° Tours" index="02 / 04"
            copy="Walkthroughs I shoot and build for real clients."
            width="min(64vw,560px)" gradient="radial-gradient(120% 120% at 75% 25%,#161a2e,#0c0b0a)" icon="🌐"
            image={panoramaHero?.url} imageAlt={panoramaHero?.title}
          />

          <div style={{ flex: '0 0 auto', width: 'min(70vw,640px)' }}>
            <div style={{ width: '100%', height: '54vh', maxHeight: 460, borderRadius: 16, overflow: 'hidden', border: '1px solid #2a2622', background: '#000' }}>
              <iframe
                src="https://www.youtube.com/embed/mLDi3wrbtpc?si=NFQJJMPjjCzVupzO"
                title="Aerial videography"
                style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 18 }}>
              <h3 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>Aerial videography</h3>
              <span style={{ fontFamily: MONO, fontSize: 12, color: '#7a6e63' }}>03 / 04</span>
            </div>
            <p style={{ fontSize: 14, color: '#9a8d80', lineHeight: 1.55, marginTop: 6, maxWidth: '46ch' }}>
              I fly the drone badly and edit the footage well. This is the edit.
            </p>
          </div>

          <Link href="/tools" style={{ flex: '0 0 auto', width: 'min(64vw,560px)', textDecoration: 'none', color: 'inherit' }}>
            <div style={{ width: '100%', height: '54vh', maxHeight: 460, borderRadius: 16, overflow: 'hidden', border: '1px solid #2a2622', background: 'radial-gradient(120% 120% at 20% 15%,#1a130f,#0c0b0a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: MONO, fontSize: 13, color: accent, letterSpacing: '0.1em', textAlign: 'center', lineHeight: 2 }}>
                &lt;/&gt;<br />
                <span style={{ color: '#9a8d80' }}>{TOOL_COUNT} interactive experiments</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 18 }}>
              <h3 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>Interactive tools</h3>
              <span style={{ fontFamily: MONO, fontSize: 12, color: '#7a6e63' }}>04 / 04</span>
            </div>
            <p style={{ fontSize: 14, color: '#9a8d80', lineHeight: 1.55, marginTop: 6, maxWidth: '46ch' }}>
              Generative toys, converters, and a few things I needed exactly once.
            </p>
          </Link>
        </div>

        <div style={{ padding: '0 clamp(24px,7vw,40px)', marginTop: 34 }}>
          <div style={{ height: 2, background: '#211e1b', borderRadius: 2, overflow: 'hidden', maxWidth: 340 }}>
            <div ref={barRef} style={{ height: '100%', width: '8%', background: accent, borderRadius: 2 }} />
          </div>
        </div>
      </section>

      {/* ===== LIVE 3D DEMO ===== */}
      <section id="demo" style={{ position: 'relative', height: '100vh', minHeight: 600, overflow: 'hidden', borderTop: '1px solid #211e1b' }}>
        <canvas ref={worldCanvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', cursor: 'grab' }} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 'clamp(90px,12vh,120px) clamp(24px,7vw,40px) 40px' }}>
          <div style={{ maxWidth: 560 }}>
            <h2 style={{ fontSize: 'clamp(32px,5vw,58px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>Step inside a 3D scene.</h2>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: '#c0b6ac', marginTop: 18, maxWidth: 460 }}>
              No video, no screenshot — a real-time WebGL world rendered on your machine. Drag
              to look around, the way a 360° tour feels. Nobody asked for this one either.
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontFamily: MONO, fontSize: 11, color: '#8a7e72', letterSpacing: '0.08em' }}>
            <span>three.js · custom GLSL · renders only while on screen</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>drag to look around <span style={{ fontSize: 15 }}>↺</span></span>
          </div>
        </div>
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: 22, height: 22, margin: '-11px 0 0 -11px', pointerEvents: 'none', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '50%' }} />
      </section>

      {/* ===== CONTACT ===== */}
      <section id="contact" style={{ maxWidth: 1180, margin: '0 auto', padding: 'clamp(90px,16vh,180px) clamp(24px,7vw,40px) 70px' }}>
        <div data-reveal style={{ fontFamily: MONO, fontSize: 13, color: accent, letterSpacing: '0.1em', marginBottom: 24 }}>05 · let&rsquo;s talk</div>
        <h2 data-reveal style={{ fontSize: 'clamp(44px,8vw,104px)', fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 0.95 }}>
          Let&rsquo;s build<br />something <span style={{ color: accent, fontStyle: 'italic' }}>you&rsquo;d actually use.</span>
        </h2>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 48 }}>
          <motion.a
            href="mailto:jorgeromanis@yahoo.com.mx"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 17 }}
            style={{ textDecoration: 'none', fontSize: 16, fontWeight: 600, color: '#0b0a09', background: accent, borderRadius: 14, padding: '18px 34px', display: 'inline-block' }}
          >
            jorgeromanis@yahoo.com.mx
          </motion.a>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 420, damping: 17 }} style={{ display: 'inline-block' }}>
            <Link href="/about" style={{ textDecoration: 'none', fontSize: 16, fontWeight: 600, color: '#f6f0e9', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 14, padding: '18px 34px', display: 'inline-block' }}>
              More about me →
            </Link>
          </motion.div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginTop: 'clamp(70px,12vh,130px)', paddingTop: 28, borderTop: '1px solid #211e1b', fontFamily: MONO, fontSize: 12, color: '#6b635a', letterSpacing: '0.06em' }}>
          <span>© 2026 Jorge Romero Romanis</span>
          <span>built in méxico · {TOOL_COUNT} tools · COYS</span>
        </div>
      </section>

      {/* ===== IDLE NUDGE ===== */}
      <AnimatePresence>
        {idleHint && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed', bottom: 26, left: 0, right: 0, zIndex: 60,
              display: 'flex', justifyContent: 'center', pointerEvents: 'none',
            }}
          >
            <span style={{
              fontFamily: MONO, fontSize: 12, letterSpacing: '0.06em', color: '#c0b6ac',
              background: 'rgba(18,17,16,0.92)', border: '1px solid #2a2622',
              borderRadius: 999, padding: '11px 20px', backdropFilter: 'blur(10px)',
              whiteSpace: 'nowrap',
            }}>
              {idleHint}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== COYS ===== */}
      <AnimatePresence>
        {spurs && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            style={{
              // Centred with flex rather than a translate pair: Framer owns the
              // transform while animating `scale`, and a hard-coded translate in
              // `style` fights it — the element freezes at its initial values.
              position: 'fixed', inset: 0, zIndex: 70, pointerEvents: 'none',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', textAlign: 'center',
              // A scrim turns this from text fighting the hero copy into a
              // deliberate takeover moment.
              background: 'rgba(10,14,28,0.78)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div style={{ fontSize: 'clamp(54px,11vw,150px)', fontWeight: 700, letterSpacing: '-0.05em', color: '#fff', lineHeight: 0.9, textShadow: '0 6px 60px rgba(0,0,0,0.75)' }}>
              COYS
            </div>
            <div style={{ fontFamily: MONO, fontSize: 13, letterSpacing: '0.22em', color: '#c8d1e8', marginTop: 14, textTransform: 'uppercase' }}>
              come on you spurs
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
