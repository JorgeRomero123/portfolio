'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { C } from '@/components/illustration/ink';
import Tree, { TallTree } from '@/components/illustration/Tree';
import { JorgeAtLaptop } from '@/components/illustration/Jorge';
import { Birds, DeskLamp, Drone, Mailbox, PottedPlant } from '@/components/illustration/objects';
import { ButtonPanel, Ding, ElevatorCar, ElevatorShaft, FloorDial } from '@/components/illustration/elevator';
import { Rooftop } from '@/components/illustration/building';
import { PROJECTS, STATS } from '@/components/home/data';

/**
 * The homepage as a building. Scrolling carries the elevator car down a glass shaft
 * (it's `position: sticky` inside the shaft column, so the browser does the travelling);
 * the doors close while you scroll and open when you stop, with a ding on a new floor.
 * The button panel is the floor navigation.
 */

type Fonts = { display: string; body: string; mono: string };

/** Top to bottom, matching the order of the sections on the page. */
const FLOORS = [
  { id: 'roof', key: 'R', label: 'hello' },
  { id: 'work', key: '4', label: 'work' },
  { id: 'tools', key: '3', label: 'tools' },
  { id: 'gallery', key: '2', label: 'gallery' },
  { id: 'contact', key: '1', label: 'contact' },
];
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

export default function BuildingExperience({ fonts }: { fonts: Fonts }) {
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

  const goTo = (i: number) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    floorRefs.current[i]?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  };

  const floorRef = (i: number) => (el: HTMLElement | null) => { floorRefs.current[i] = el; };

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
          <div aria-hidden style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'clip' }}>
            {Array.from({ length: 40 }, (_, i) => <ElevatorShaft key={i} style={{ ...fill, flex: '0 0 auto' }} />)}
          </div>
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
          <Roof refCb={floorRef(0)} fonts={fonts} onWork={() => goTo(1)} onTools={() => goTo(2)} />
          <WorkFloor refCb={floorRef(1)} fonts={fonts} />
          <Placeholder refCb={floorRef(2)} fonts={fonts} floor={FLOORS[2]} wall={C.peach} />
          <Placeholder refCb={floorRef(3)} fonts={fonts} floor={FLOORS[3]} wall="#F2CBC6" />
          <Placeholder refCb={floorRef(4)} fonts={fonts} floor={FLOORS[4]} wall={C.lavender} />
          <Street />
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
            onClick={(e) => { e.preventDefault(); goTo(i); }}
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

function FloorPlate({ fonts, k, label }: { fonts: Fonts; k: string; label: string }) {
  return (
    <div style={{ ...card(3), display: 'inline-flex', alignItems: 'center', gap: 10, padding: '4px 12px 4px 4px', background: C.mustard, fontFamily: fonts.mono, fontSize: 13, fontWeight: 700 }}>
      <span style={{ width: 26, height: 26, borderRadius: '50%', background: C.cream, border: `2px solid ${INK}`, display: 'grid', placeItems: 'center' }}>{k}</span>
      {label}
    </div>
  );
}

/* ---------------------------------------------------------------- roof */

function Roof({ refCb, fonts, onWork, onTools }: FloorProps & { onWork: () => void; onTools: () => void }) {
  return (
    <section id="roof" ref={refCb} style={{ position: 'relative', background: SKY, minHeight: 'max(100vh, 640px)', display: 'flex', flexDirection: 'column' }}>
      <Birds style={{ position: 'absolute', top: '4%', left: '38%', width: 'clamp(90px,12vw,150px)', height: 'auto' }} />
      <Drone className="bld-bob" style={{ position: 'absolute', top: '6%', right: '6%', width: 'clamp(100px,14vw,180px)', height: 'auto' }} />

      <div className="bld-hero" style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.15fr 1fr', alignItems: 'end', gap: 'clamp(16px,3vw,40px)', padding: 'clamp(110px,16vh,160px) clamp(18px,4vw,52px) 0' }}>
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
                Browse the 25 tools
              </a>
            </div>
          </div>
          {/* sign posts down to the parapet */}
          <div aria-hidden style={{ display: 'flex', justifyContent: 'space-around', height: 'clamp(28px,5vh,56px)' }}>
            {[0, 1].map((i) => <div key={i} style={{ width: 14, background: C.bark, border: `3px solid ${INK}`, borderTop: 'none' }} />)}
          </div>
        </div>

        <div className="bld-roofprops" style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <Rooftop parapet={false} style={{ ...fill, flex: '1 1 auto', minWidth: 0 }} />
          <PottedPlant style={{ width: '24%', height: 'auto', flex: '0 0 auto', marginBottom: -4 }} />
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
      <FloorPlate fonts={fonts} k="4" label="work" />
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

/* --------------------------------------------------------- placeholders */

function Placeholder({ refCb, fonts, floor, wall }: FloorProps & { floor: (typeof FLOORS)[number]; wall: string }) {
  return (
    <Storey id={floor.id} refCb={refCb} wall={wall} minHeight="62vh">
      <FloorPlate fonts={fonts} k={floor.key} label={floor.label} />
      <div style={{ ...card(6), maxWidth: 440, margin: 'clamp(40px,8vh,90px) auto', overflow: 'hidden', transform: 'rotate(-1.5deg)' }}>
        <div aria-hidden style={{ height: 22, background: `repeating-linear-gradient(-45deg, ${C.mustard} 0 14px, ${INK} 14px 28px)`, borderBottom: `3px solid ${INK}` }} />
        <div style={{ padding: '20px 24px 24px', textAlign: 'center' }}>
          <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 30, letterSpacing: '-0.03em' }}>Under construction</div>
          <p style={{ margin: '8px 0 0', fontSize: 17 }}>The {floor.label} floor is next. The elevator still stops here.</p>
        </div>
      </div>
    </Storey>
  );
}

/* ---------------------------------------------------------------- street */

function Street() {
  return (
    <div aria-hidden style={{ position: 'relative', background: SKY }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '24px clamp(12px,3vw,40px) 0', gap: 12 }}>
        <TallTree style={{ width: 'clamp(70px,10vw,130px)', height: 'auto' }} />
        <Mailbox style={{ width: 'clamp(90px,12vw,160px)', height: 'auto' }} />
        <Tree style={{ width: 'clamp(120px,18vw,240px)', height: 'auto' }} />
      </div>
      <div style={{ height: 40, background: `${dots(0.3)}, ${C.green}`, borderTop: `3px solid ${INK}` }} />
    </div>
  );
}
