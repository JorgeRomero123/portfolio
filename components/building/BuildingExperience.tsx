'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { C } from '@/components/illustration/ink';
import Tree, { TallTree } from '@/components/illustration/Tree';
import { JorgeAtLaptop, JorgePlayingCards, JorgeWithCamera } from '@/components/illustration/Jorge';
import {
  Birds, Camera360, Coffee, CoysPennant, DeskLamp, Drawing, Drone, Mailbox, PottedPlant, Projector,
} from '@/components/illustration/objects';
import { ButtonPanel, Ding, ElevatorCar, FloorDial } from '@/components/illustration/elevator';
import { Rooftop } from '@/components/illustration/building';
import ArtOverlayBillboard from './ArtOverlayBillboard';
import GameBoard from './GameBoard';
import { PROJECTS, STATS, TRUTHS } from '@/components/home/data';
import { ALL_TOOLS, TOOL_CATEGORIES } from '@/lib/tools';

/**
 * The homepage as a building. Scrolling carries the elevator car down a glass shaft
 * (it's `position: sticky` inside the shaft column, so the browser does the travelling);
 * the doors close while you scroll and open when you stop, with a ding on a new floor.
 * The button panel is the floor navigation.
 */

type Fonts = { display: string; body: string; mono: string };
export type FramedPhoto = { url: string; place: string; drone: boolean };
export type Panorama = { id: string; url: string; title: string };

type FloorId = (typeof FLOORS)[number]['id'];
const floorIndex = (id: FloorId) => FLOORS.findIndex((f) => f.id === id);

const EMAIL = 'jorgeromanis@yahoo.com.mx';

/** Top to bottom, matching the order of the sections on the page. */
const FLOORS = [
  { id: 'roof', key: 'R', label: 'hello' },
  { id: 'work', key: '4', label: 'work' },
  { id: 'tools', key: '3', label: 'tools' },
  { id: 'gallery', key: '2', label: 'gallery' },
  { id: 'contact', key: '1', label: 'contact' },
] as const;
/** The dial reads bottom to top. */
const DIAL = [...FLOORS].reverse().map((f) => f.key);
const PANEL_H = 56 + FLOORS.length * 46; // ButtonPanel's viewBox height

const INK = '#1B1B1B';
const SKY = '#DCDAF5';
const dots = (opacity = 0.35, size = 7) =>
  `radial-gradient(circle, rgba(27,27,27,${opacity}) 1.1px, transparent 1.6px) 0 0 / ${size}px ${size}px`;
const card = (shadow = 5): CSSProperties => ({
  background: C.cream,
  border: `3px solid ${INK}`,
  boxShadow: `${shadow}px ${shadow}px 0 ${INK}`,
  borderRadius: 8,
});
const fill = { width: '100%', height: 'auto', display: 'block' } as const;

/**
 * The glass shaft, in CSS rather than tiled <ElevatorShaft> drawings: it has to run the
 * whole page, which on a phone is several times taller than on a laptop. Same parts —
 * steel rails, a beam every storey, twin cables, glare on lavender glass.
 */
const SHAFT: CSSProperties = {
  position: 'absolute',
  inset: 0,
  borderLeft: `12px solid ${C.steel}`,
  borderRight: `12px solid ${C.steel}`,
  boxShadow: `inset 3px 0 0 ${INK}, inset -3px 0 0 ${INK}`,
  background: [
    `repeating-linear-gradient(180deg, transparent 0 292px, ${INK} 292px 295px, ${C.steel} 295px 303px, ${INK} 303px 306px)`,
    `linear-gradient(90deg, transparent calc(50% - 9px), ${INK} calc(50% - 9px) calc(50% - 7px), transparent calc(50% - 7px) calc(50% + 7px), ${INK} calc(50% + 7px) calc(50% + 9px), transparent calc(50% + 9px))`,
    'repeating-linear-gradient(-50deg, transparent 0 120px, rgba(255,250,242,.7) 120px 128px, transparent 128px 200px)',
    '#DFDAE4',
  ].join(', '),
};

export default function BuildingExperience({ fonts, photos, panoramas, gameColors }: {
  fonts: Fonts;
  photos: FramedPhoto[];
  panoramas: Panorama[];
  /** The Game's stop colours, for the little board on the link to it. */
  gameColors: string[];
}) {
  const floorRefs = useRef<(HTMLElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [moving, setMoving] = useState(false);
  const [ding, setDing] = useState(false);
  const activeRef = useRef(0);
  const dingedAt = useRef(0);

  useEffect(() => {
    let raf = 0;
    let stopTimer: ReturnType<typeof setTimeout> | undefined;
    let dingTimer: ReturnType<typeof setTimeout> | undefined;

    // the floor whose top has passed the car (which sits ~40% down the viewport)
    const update = () => {
      raf = 0;
      const line = window.innerHeight * 0.4;
      let a = 0;
      floorRefs.current.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top <= line) a = i;
      });
      activeRef.current = a;
      setActive(a);
    };

    const onScroll = () => {
      setMoving(true);
      if (!raf) raf = requestAnimationFrame(update);
      clearTimeout(stopTimer);
      stopTimer = setTimeout(() => {
        setMoving(false);
        if (activeRef.current !== dingedAt.current) {
          dingedAt.current = activeRef.current;
          setDing(true);
          clearTimeout(dingTimer);
          dingTimer = setTimeout(() => setDing(false), 1300);
        }
      }, 380);
    };

    raf = requestAnimationFrame(update);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
      clearTimeout(stopTimer);
      clearTimeout(dingTimer);
    };
  }, []);

  const goTo = (id: FloorId) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    floorRefs.current[floorIndex(id)]?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  };

  const floorRef = (id: FloorId) => (el: HTMLElement | null) => { floorRefs.current[floorIndex(id)] = el; };

  return (
    <div style={{ background: C.paper, color: INK, fontFamily: fonts.body, overflowX: 'clip' }}>
      <style>{`
        .bld { --shaft: clamp(84px, 13vw, 176px); }
        .bld a:focus-visible { outline: 3px solid ${C.cornflower}; outline-offset: 3px; }
        .bld-panel a { position: absolute; left: 6%; right: 6%; border-radius: 999px; }
        .bld-bob { animation: bld-bob 3.2s ease-in-out infinite; }
        @keyframes bld-bob { 0%,100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-10px) rotate(2deg); } }
        .bld-pop { animation: bld-pop .35s cubic-bezier(.3,1.6,.5,1) both; }
        @keyframes bld-pop { from { transform: scale(.3) rotate(-20deg); opacity: 0; } }
        .bld-lift { transition: transform .25s, box-shadow .25s; }
        .bld-lift:hover { transform: translate(-3px,-3px) rotate(0deg) !important; box-shadow: 9px 9px 0 ${INK} !important; }
        @media (prefers-reduced-motion: reduce) { .bld-bob, .bld-pop { animation: none; } }
        @media (max-width: 760px) {
          .bld { --shaft: 74px; }
          .bld-panel { display: none; }
          .bld-hero { grid-template-columns: 1fr !important; }
          .bld-roofprops { max-width: 340px; margin-left: auto; }
        }
      `}</style>

      <div className="bld" style={{ display: 'grid', gridTemplateColumns: 'var(--shaft) 1fr', maxWidth: 1320, margin: '0 auto', borderLeft: `3px solid ${INK}`, borderRight: `3px solid ${INK}` }}>
        {/* ===== SHAFT + CAR ===== */}
        {/* only the glass is clipped, so the ding can pop out over the floors */}
        <div style={{ position: 'relative', zIndex: 3, borderRight: `3px solid ${INK}`, background: C.paper }}>
          <div aria-hidden style={SHAFT} />
          <div style={{ position: 'sticky', top: '14vh', padding: '0 4px', zIndex: 2 }}>
            <FloorDial floors={DIAL} current={DIAL.length - 1 - active} style={fill} />
            <div style={{ position: 'relative' }}>
              <ElevatorCar doors={moving ? 'closed' : 'open'} style={fill} />
              {ding && <Ding className="bld-pop" style={{ position: 'absolute', left: '62%', top: '-6%', width: '90%', height: 'auto' }} />}
            </div>
          </div>
        </div>

        {/* ===== FLOORS ===== */}
        <div style={{ minWidth: 0 }}>
          <Roof refCb={floorRef('roof')} fonts={fonts} gameColors={gameColors} onWork={() => goTo('work')} onTools={() => goTo('tools')} />
          <WorkFloor refCb={floorRef('work')} fonts={fonts} />
          <ToolsFloor refCb={floorRef('tools')} fonts={fonts} />
          <GalleryFloor refCb={floorRef('gallery')} fonts={fonts} photos={photos} panoramas={panoramas} />
          <ContactFloor refCb={floorRef('contact')} fonts={fonts} />
          <Street fonts={fonts} />
        </div>
      </div>

      {/* ===== BUTTON PANEL (navigation) ===== */}
      <nav aria-label="Floors" className="bld-panel" style={{ position: 'fixed', right: 18, bottom: 18, width: 150, zIndex: 40, filter: `drop-shadow(4px 4px 0 ${INK})` }}>
        <ButtonPanel floors={FLOORS} active={active} style={fill} />
        {FLOORS.map((f, i) => (
          <a
            key={f.id}
            href={`#${f.id}`}
            aria-label={`Floor ${f.key}: ${f.label}`}
            aria-current={i === active ? 'location' : undefined}
            onClick={(e) => { e.preventDefault(); goTo(f.id); }}
            style={{ top: `${((26 + i * 46) / PANEL_H) * 100}%`, height: `${(40 / PANEL_H) * 100}%` }}
          />
        ))}
      </nav>
    </div>
  );
}

/* ================================================================ floors */

type FloorProps = { refCb: (el: HTMLElement | null) => void; fonts: Fonts };

/** A storey with its front wall removed: coloured back wall, side walls, ceiling, slab. */
function Storey({ id, refCb, wall, children, minHeight }: {
  id: string; refCb: FloorProps['refCb']; wall: string; children: ReactNode; minHeight?: string;
}) {
  return (
    <section id={id} ref={refCb} style={{ position: 'relative', scrollMarginTop: 0 }}>
      <div style={{ background: C.steel, height: 14, borderBottom: `3px solid ${INK}` }} />
      <div style={{
        position: 'relative', background: wall, minHeight,
        borderLeft: `16px solid ${C.peach}`, borderRight: `16px solid ${C.peach}`,
        boxShadow: `inset 3px 0 0 ${INK}, inset -3px 0 0 ${INK}`,
        padding: 'clamp(28px,4vw,56px) clamp(18px,4vw,52px) 0',
      }}>
        {/* halftone shade on the lower wall */}
        <div aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '30%', background: dots(0.18), pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>{children}</div>
      </div>
      {/* floor slab */}
      <div style={{ height: 30, borderTop: `3px solid ${INK}`, borderBottom: `3px solid ${INK}`, background: `${dots(0.4)}, linear-gradient(${C.peach} 0 8px, ${C.steel} 8px)` }} />
    </section>
  );
}

function FloorPlate({ fonts, id }: { fonts: Fonts; id: FloorId }) {
  const { key: k, label } = FLOORS[floorIndex(id)];
  return (
    <div style={{ ...card(3), display: 'inline-flex', alignItems: 'center', gap: 10, padding: '4px 12px 4px 4px', background: C.mustard, fontFamily: fonts.mono, fontSize: 13, fontWeight: 700 }}>
      <span style={{ width: 26, height: 26, borderRadius: '50%', background: C.cream, border: `2px solid ${INK}`, display: 'grid', placeItems: 'center' }}>{k}</span>
      {label}
    </div>
  );
}

/* ---------------------------------------------------------------- roof */

function Roof({ refCb, fonts, gameColors, onWork, onTools }: FloorProps & { gameColors: string[]; onWork: () => void; onTools: () => void }) {
  return (
    <section id="roof" ref={refCb} style={{ position: 'relative', background: SKY, minHeight: 'max(100vh, 640px)', display: 'flex', flexDirection: 'column' }}>
      <Birds style={{ position: 'absolute', zIndex: 3, top: 14, left: '30%', width: 'clamp(80px,10vw,130px)', height: 'auto' }} />
      <Drone className="bld-bob" style={{ position: 'absolute', zIndex: 3, top: 'clamp(40px,7vh,70px)', right: '3%', width: 'clamp(90px,12vw,160px)', height: 'auto' }} />

      {/* everything standing on the roof; the billboard's legs run down behind it */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {['22%', '68%'].map((left) => (
          <span
            key={left}
            aria-hidden
            style={{
              position: 'absolute', top: 0, bottom: 0, left, width: 26, zIndex: 0,
              borderLeft: `3px solid ${INK}`, borderRight: `3px solid ${INK}`,
              background: `repeating-linear-gradient(45deg, transparent 0 9px, ${INK} 9px 11px), repeating-linear-gradient(-45deg, transparent 0 9px, ${INK} 9px 11px), ${C.steel}`,
            }}
          />
        ))}

        <div style={{ padding: 'clamp(84px,12vh,120px) clamp(18px,4vw,52px) 0' }}>
          <ArtOverlayBillboard />
        </div>

        <div className="bld-hero" style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.15fr 1fr', alignItems: 'end', gap: 'clamp(16px,3vw,40px)', padding: 'clamp(48px,7vh,80px) clamp(18px,4vw,52px) 0' }}>
          {/* the hero copy, on a sign planted on the roof */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
            <div style={{ ...card(7), padding: 'clamp(20px,3vw,36px)', position: 'relative', zIndex: 1 }}>
              <div style={{ fontFamily: fonts.mono, fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14 }}>
                méxico · software engineer · builds too much
              </div>
              <h1 style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 'clamp(48px,7.2vw,104px)', lineHeight: 0.92, letterSpacing: '-0.045em', margin: 0 }}>
                {/* inline-block so the highlight can't paint over the tight line above */}
                Hi, I&rsquo;m <span style={{ background: C.pink, padding: '0 0.1em', display: 'inline-block', lineHeight: 1 }}>Jorge.</span>
              </h1>
              <p style={{ fontFamily: fonts.display, fontWeight: 600, fontSize: 'clamp(22px,2.6vw,34px)', lineHeight: 1.08, letterSpacing: '-0.02em', margin: '14px 0 0' }}>
                I build for millions, then go build something fun.
              </p>
              <p style={{ fontSize: 'clamp(16px,1.35vw,19px)', lineHeight: 1.55, margin: '16px 0 0', maxWidth: 520 }}>
                By day I ship production software to 1.5 million people. By night I build browser
                toys nobody asked for: a singing coach, a chore tracker that emails my roommate, a
                360° tour engine.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 24 }}>
                <a href="#work" onClick={(e) => { e.preventDefault(); onWork(); }} className="bld-lift" style={{ ...card(4), background: INK, color: C.paper, textDecoration: 'none', fontFamily: fonts.display, fontWeight: 700, padding: '12px 20px' }}>
                  Take the elevator down ↓
                </a>
                <a href="#tools" onClick={(e) => { e.preventDefault(); onTools(); }} className="bld-lift" style={{ ...card(4), background: C.mustard, color: INK, textDecoration: 'none', fontFamily: fonts.display, fontWeight: 700, padding: '12px 20px' }}>
                  Browse the {ALL_TOOLS.length} tools
                </a>
              </div>
              {/* the board game is just a link to it, like on the old homepage */}
              <a href="/the-game" className="bld-lift" style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 22, padding: '8px 16px 8px 8px', border: `2.5px dashed ${INK}`, borderRadius: 10, color: INK, textDecoration: 'none' }}>
                <GameBoard colors={gameColors} style={{ width: 'clamp(84px,9vw,112px)', height: 'auto', flex: '0 0 auto' }} />
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontFamily: fonts.mono, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase' }}>the playable portfolio</span>
                  <span style={{ display: 'block', fontFamily: fonts.display, fontWeight: 700, fontSize: 'clamp(17px,1.6vw,21px)', lineHeight: 1.15, marginTop: 3 }}>Play my portfolio as a board game →</span>
                </span>
              </a>
            </div>
            {/* sign posts down to the parapet */}
            <div aria-hidden style={{ display: 'flex', justifyContent: 'space-around', height: 'clamp(28px,5vh,56px)' }}>
              {[0, 1].map((i) => <div key={i} style={{ width: 14, background: C.bark, border: `3px solid ${INK}`, borderTop: 'none' }} />)}
            </div>
          </div>

          <div className="bld-roofprops" style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <Rooftop parapet={false} style={{ ...fill, flex: '1 1 auto', minWidth: 0 }} />
            <PottedPlant style={{ width: '24%', height: 'auto', flex: '0 0 auto', marginBottom: -4 }} />
          </div>
        </div>
      </div>

      {/* parapet */}
      <div style={{ height: 14, background: C.steel, border: `3px solid ${INK}`, borderLeft: 'none', borderRight: 'none' }} />
      <div style={{ height: 44, background: `${dots(0.15)}, ${C.peach}` }} />
      <div style={{ height: 30, borderTop: `3px solid ${INK}`, borderBottom: `3px solid ${INK}`, background: `${dots(0.4)}, linear-gradient(${C.peach} 0 8px, ${C.steel} 8px)` }} />
    </section>
  );
}

/* ---------------------------------------------------------------- work */

const STAT_COLORS = [C.pink, C.mustard, C.green, C.cornflower];

function WorkFloor({ refCb, fonts }: FloorProps) {
  return (
    <Storey id="work" refCb={refCb} wall={C.lavender}>
      <FloorPlate fonts={fonts} id="work" />
      <h2 style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 'clamp(36px,5vw,68px)', letterSpacing: '-0.04em', lineHeight: 1, margin: '20px 0 0' }}>
        Things I&rsquo;ve shipped
      </h2>

      {/* the numbers, painted straight onto the wall */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))', gap: 'clamp(16px,2.5vw,32px)', marginTop: 'clamp(24px,3vw,40px)' }}>
        {STATS.map((s, i) => (
          <div key={s.label}>
            <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 'clamp(48px,5.5vw,76px)', lineHeight: 0.9, letterSpacing: '-0.05em' }}>
              <span style={{ background: STAT_COLORS[i % STAT_COLORS.length], padding: '0 0.08em', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' }}>
                {s.value}{s.suffix}
              </span>
            </div>
            <div style={{ fontSize: 16, lineHeight: 1.4, marginTop: 10, maxWidth: 240 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* projects, pinned to the wall */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 'clamp(20px,2.5vw,32px)', marginTop: 'clamp(36px,5vw,64px)' }}>
        {PROJECTS.map((p, i) => (
          <a
            key={p.title}
            href={p.href}
            target={p.href.startsWith('http') ? '_blank' : undefined}
            rel={p.href.startsWith('http') ? 'noreferrer' : undefined}
            className="bld-lift"
            style={{ ...card(5), color: INK, textDecoration: 'none', padding: '26px 22px 22px', position: 'relative', transform: `rotate(${i % 2 ? 0.8 : -0.8}deg)` }}
          >
            <span aria-hidden style={{ position: 'absolute', top: -12, left: '50%', width: 70, height: 20, marginLeft: -35, background: C.mustard, opacity: 0.9, border: `2px solid ${INK}`, transform: `rotate(${i % 2 ? 3 : -3}deg)` }} />
            <span style={{ fontFamily: fonts.mono, fontSize: 12, border: `2px solid ${INK}`, borderRadius: 999, padding: '2px 10px' }}>{p.tag}</span>
            <h3 style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 30, letterSpacing: '-0.03em', lineHeight: 1, margin: '14px 0 10px', whiteSpace: 'pre-line' }}>{p.title}</h3>
            <div style={{ fontSize: 16, lineHeight: 1.55 }}>{p.body}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
              {p.tech.map((t) => (
                <span key={t} style={{ fontFamily: fonts.mono, fontSize: 11, background: C.paper, border: `1.5px solid ${INK}`, borderRadius: 4, padding: '1px 7px' }}>{t}</span>
              ))}
            </div>
          </a>
        ))}
      </div>

      {/* furniture along the floor */}
      <div aria-hidden style={{ display: 'flex', alignItems: 'flex-end', gap: 'clamp(8px,2vw,24px)', marginTop: 'clamp(32px,5vw,56px)' }}>
        <PottedPlant style={{ width: 'clamp(70px,9vw,120px)', height: 'auto' }} />
        <JorgeAtLaptop style={{ width: 'clamp(190px,26vw,320px)', height: 'auto' }} />
        <DeskLamp style={{ width: 'clamp(70px,9vw,120px)', height: 'auto' }} />
      </div>
    </Storey>
  );
}

/* ---------------------------------------------------------------- tools */

const SHELF_ACCENTS = [C.cornflower, C.pink, C.green];

/** The workshop: every tool as a labelled box on a shelf, one shelf per category. */
function ToolsFloor({ refCb, fonts }: FloorProps) {
  return (
    <Storey id="tools" refCb={refCb} wall={C.peach}>
      <Drawing style={{ position: 'absolute', top: -18, right: 0, width: 'clamp(84px,11vw,150px)', height: 'auto', transform: 'rotate(4deg)' }} />
      <FloorPlate fonts={fonts} id="tools" />
      <h2 style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 'clamp(36px,5vw,68px)', letterSpacing: '-0.04em', lineHeight: 1, margin: '20px 0 0' }}>
        The workshop
      </h2>
      <p style={{ fontSize: 'clamp(16px,1.4vw,19px)', lineHeight: 1.5, margin: '12px 0 0', maxWidth: 560 }}>
        {ALL_TOOLS.length} browser tools and games, built for an audience of mostly me. Every
        one of them works. Take one off the shelf.
      </p>

      {TOOL_CATEGORIES.map((cat, ci) => {
        const accent = SHELF_ACCENTS[ci % SHELF_ACCENTS.length];
        return (
          <div key={cat.label} style={{ marginTop: 'clamp(28px,4vw,44px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, fontFamily: fonts.mono, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              <span style={{ width: 14, height: 14, background: accent, border: `2px solid ${INK}`, borderRadius: 3 }} />
              {cat.label}
              <span style={{ opacity: 0.6 }}>· {cat.tools.length}</span>
            </div>
            {/* no column gap, so the plank under each box joins its neighbours into one shelf */}
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(118px, 1fr))', rowGap: 28 }}>
              {cat.tools.map((t, i) => (
                <li key={t.href} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <a
                    href={t.href}
                    title={t.description}
                    className="bld-lift"
                    style={{ ...card(3), alignSelf: 'center', width: '84%', color: INK, textDecoration: 'none', overflow: 'hidden', marginBottom: -3, transform: `rotate(${(((i * 7) % 5) - 2) * 0.9}deg)` }}
                  >
                    <div style={{ height: 8, background: accent, borderBottom: `2.5px solid ${INK}` }} />
                    <div aria-hidden style={{ fontSize: 26, textAlign: 'center', marginTop: 8 }}>{t.icon}</div>
                    <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 14.5, lineHeight: 1.15, textAlign: 'center', padding: '6px 8px 10px' }}>{t.name}</div>
                  </a>
                  <div aria-hidden style={{ height: 12, background: `${dots(0.35)}, ${C.bark}`, borderTop: `3px solid ${INK}`, borderBottom: `3px solid ${INK}` }} />
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginTop: 'clamp(32px,5vw,56px)' }}>
        <div aria-hidden style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
          <Projector style={{ width: 'clamp(120px,16vw,210px)', height: 'auto' }} />
          <PottedPlant style={{ width: 'clamp(64px,8vw,110px)', height: 'auto' }} />
        </div>
        <a href="/tools" className="bld-lift" style={{ ...card(4), background: INK, color: C.paper, textDecoration: 'none', fontFamily: fonts.display, fontWeight: 700, padding: '12px 20px', marginBottom: 16 }}>
          The whole workshop, with descriptions →
        </a>
      </div>
    </Storey>
  );
}

/* -------------------------------------------------------------- gallery */

const FRAMES = [C.bark, C.mustard, C.charcoal, C.cornflower, C.green, C.pink];

/** A nail and the string a frame hangs from. */
const Hanger = () => (
  <svg aria-hidden viewBox="0 0 60 26" style={{ position: 'absolute', top: -26, left: '50%', width: 60, marginLeft: -30 }}>
    <path d="M 4 26 L 30 4 L 56 26" fill="none" stroke={INK} strokeWidth={2} />
    <circle cx={30} cy={4} r={3.5} fill={C.charcoal} stroke={INK} strokeWidth={1.5} />
  </svg>
);

function GalleryFloor({ refCb, fonts, photos, panoramas }: FloorProps & { photos: FramedPhoto[]; panoramas: Panorama[] }) {
  return (
    <Storey id="gallery" refCb={refCb} wall="#F2CBC6">
      <FloorPlate fonts={fonts} id="gallery" />
      <h2 style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 'clamp(36px,5vw,68px)', letterSpacing: '-0.04em', lineHeight: 1, margin: '20px 0 0' }}>
        The gallery
      </h2>
      <p style={{ fontSize: 'clamp(16px,1.4vw,19px)', lineHeight: 1.5, margin: '12px 0 0', maxWidth: 560 }}>
        Photography and drone work from the trips, and 360° panoramas you can step into. I
        shoot these for real clients too.
      </p>

      {/* the wall of frames */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '56px clamp(20px,3vw,40px)', marginTop: 64 }}>
        {photos.map((ph, i) => (
          <div key={ph.url} style={{ position: 'relative', transform: `rotate(${i % 2 ? 1.2 : -1}deg)` }}>
            <Hanger />
            <a href="/gallery" className="bld-lift" style={{ display: 'block', background: FRAMES[i % FRAMES.length], border: `3px solid ${INK}`, boxShadow: `5px 5px 0 ${INK}`, padding: 12, color: INK, textDecoration: 'none' }}>
              <div style={{ background: C.cream, border: `2px solid ${INK}`, padding: 8 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ph.url} alt={`${ph.drone ? 'Drone photo' : 'Photo'} from ${ph.place}`} loading="lazy" style={{ display: 'block', width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', border: `2px solid ${INK}` }} />
              </div>
            </a>
            <div style={{ fontFamily: fonts.mono, fontSize: 12, marginTop: 10, textAlign: 'center' }}>
              {ph.place}{ph.drone ? ' · from the drone' : ''}
            </div>
          </div>
        ))}
      </div>

      {/* the 360 room: portholes into panoramas */}
      <div style={{ ...card(6), background: C.lavender, marginTop: 'clamp(48px,6vw,72px)', padding: 'clamp(20px,3vw,32px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 24, alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 30, letterSpacing: '-0.03em', lineHeight: 1 }}>The 360° room</div>
          <p style={{ fontSize: 16, lineHeight: 1.45, margin: '8px 0 0' }}>Pick a window and look around.</p>
        </div>
        {panoramas.map((pano) => (
          <a key={pano.id} href={`/gallery360/${pano.id}`} className="bld-lift" style={{ justifySelf: 'center', textAlign: 'center', color: INK, textDecoration: 'none', borderRadius: '50%' }}>
            <span style={{ position: 'relative', display: 'block', width: 'clamp(110px,12vw,150px)', aspectRatio: '1', borderRadius: '50%', overflow: 'hidden', border: `4px solid ${INK}`, boxShadow: `4px 4px 0 ${INK}` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pano.url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <svg aria-hidden viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0 }}>
                <ellipse cx={50} cy={50} rx={49} ry={18} fill="none" stroke={C.cream} strokeWidth={1.6} opacity={0.8} />
                <ellipse cx={50} cy={50} rx={18} ry={49} fill="none" stroke={C.cream} strokeWidth={1.6} opacity={0.8} />
              </svg>
            </span>
            <span style={{ display: 'block', fontFamily: fonts.mono, fontSize: 12, marginTop: 10 }}>{pano.title} ↗</span>
          </a>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginTop: 'clamp(32px,5vw,56px)' }}>
        <div aria-hidden style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
          <JorgeWithCamera style={{ width: 'clamp(110px,13vw,170px)', height: 'auto' }} />
          <Camera360 style={{ width: 'clamp(90px,11vw,150px)', height: 'auto' }} />
        </div>
        <nav aria-label="More from the gallery" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          {[['/gallery', 'All photos'], ['/gallery360', '360° photos'], ['/tours', 'Virtual tours'], ['/videos', 'Videos']].map(([href, label], i) => (
            <a key={href} href={href} className="bld-lift" style={{ ...card(3), background: [C.mustard, C.cream, C.cream, C.cream][i], color: INK, textDecoration: 'none', fontFamily: fonts.display, fontWeight: 700, padding: '8px 14px' }}>
              {label} →
            </a>
          ))}
        </nav>
      </div>
    </Storey>
  );
}

/* -------------------------------------------------------------- contact */

const NOTE_COLORS = [C.cream, C.mustard, C.cream, C.peach];

function ContactFloor({ refCb, fonts }: FloorProps) {
  return (
    <Storey id="contact" refCb={refCb} wall="#CDE0C3">
      <FloorPlate fonts={fonts} id="contact" />
      <h2 style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 'clamp(40px,6.4vw,92px)', letterSpacing: '-0.045em', lineHeight: 1.06, margin: '20px 0 0', maxWidth: '14ch' }}>
        Let&rsquo;s build something{' '}
        {/* the highlight starts a fifth of the way down, clear of the line above's descenders */}
        <span style={{ background: `linear-gradient(transparent 20%, ${C.mustard} 20%)`, padding: '0 0.08em', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' }}>you&rsquo;d actually use.</span>
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 'clamp(28px,4vw,56px)', marginTop: 'clamp(32px,4vw,52px)', alignItems: 'start' }}>
        {/* the mailbox is the email link */}
        <div>
          <a href={`mailto:${EMAIL}`} className="bld-lift" style={{ ...card(6), display: 'flex', alignItems: 'center', gap: 16, padding: '14px 22px 14px 10px', color: INK, textDecoration: 'none' }}>
            <Mailbox style={{ width: 'clamp(80px,9vw,110px)', height: 'auto', flex: '0 0 auto' }} />
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontFamily: fonts.mono, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase' }}>write to me</span>
              <span style={{ display: 'block', fontFamily: fonts.display, fontWeight: 700, fontSize: 'clamp(16px,1.7vw,22px)', marginTop: 4 }}>{EMAIL.replace(/@.*/, '')}@<wbr />{EMAIL.replace(/.*@/, '')}</span>
            </span>
          </a>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginTop: 20 }}>
            <a href="/about" className="bld-lift" style={{ ...card(4), background: INK, color: C.paper, textDecoration: 'none', fontFamily: fonts.display, fontWeight: 700, padding: '12px 20px' }}>
              More about me →
            </a>
            <a href="/agent.md" style={{ fontFamily: fonts.mono, fontSize: 13, color: INK }}>Are you an AI agent? Read this</a>
          </div>
        </div>

        {/* the stuff a résumé leaves out, pinned to the wall */}
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 22 }}>
          {TRUTHS.map((t, i) => (
            <li key={t.k} style={{ ...card(4), background: NOTE_COLORS[i % NOTE_COLORS.length], padding: '18px 16px 16px', position: 'relative', transform: `rotate(${i % 2 ? 1.5 : -1.5}deg)` }}>
              <span aria-hidden style={{ position: 'absolute', top: -9, left: '50%', width: 16, height: 16, marginLeft: -8, borderRadius: '50%', background: C.pink, border: `2.5px solid ${INK}` }} />
              <div style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{t.k}</div>
              <div style={{ fontSize: 16, lineHeight: 1.45, marginTop: 6 }}>{t.v}</div>
              {t.k === 'allegiance' && <CoysPennant style={{ position: 'absolute', right: -10, bottom: -30, width: 76, height: 'auto', transform: 'rotate(8deg)' }} />}
            </li>
          ))}
        </ul>
      </div>

      {/* the card table: the games are one click away */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'clamp(12px,3vw,32px)', flexWrap: 'wrap', marginTop: 'clamp(40px,5vw,64px)' }}>
        <JorgePlayingCards style={{ width: 'clamp(200px,24vw,300px)', height: 'auto' }} />
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em' }}>Deal me in?</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
            <a href="/games/once-ideal.html" className="bld-lift" style={{ ...card(3), color: INK, textDecoration: 'none', fontFamily: fonts.display, fontWeight: 700, padding: '8px 14px' }}>⚽ Once Ideal</a>
            <a href="/games/naufrago.html" className="bld-lift" style={{ ...card(3), color: INK, textDecoration: 'none', fontFamily: fonts.display, fontWeight: 700, padding: '8px 14px' }}>🏝️ Náufrago</a>
          </div>
        </div>
        <Coffee style={{ width: 'clamp(60px,7vw,90px)', height: 'auto', marginLeft: 'auto' }} />
      </div>
    </Storey>
  );
}

/* ---------------------------------------------------------------- street */

function Street({ fonts }: { fonts: Fonts }) {
  return (
    <footer style={{ position: 'relative', background: SKY }}>
      <div aria-hidden style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '24px clamp(12px,3vw,40px) 0', gap: 12 }}>
        <TallTree style={{ width: 'clamp(70px,10vw,130px)', height: 'auto' }} />
        <Tree style={{ width: 'clamp(120px,18vw,240px)', height: 'auto' }} />
      </div>
      <div style={{ background: `${dots(0.3)}, ${C.green}`, borderTop: `3px solid ${INK}`, padding: '14px clamp(12px,3vw,40px)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontFamily: fonts.mono, fontSize: 12, fontWeight: 700, color: INK }}>
        <span style={{ background: C.cream, padding: '2px 8px', border: `2px solid ${INK}` }}>© 2026 Jorge Romero Romanis</span>
        <span style={{ background: C.cream, padding: '2px 8px', border: `2px solid ${INK}` }}>built in méxico · {ALL_TOOLS.length} tools · COYS</span>
      </div>
    </footer>
  );
}
