'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { C } from '@/components/illustration/ink';
import { Drone } from '@/components/illustration/objects';

/**
 * The roof drone takes off and tails the cursor around the whole page, scrolling
 * included, but never lets itself be caught. It hovers about KEEP_AWAY px off the
 * pointer, darts off when the pointer closes in, and however fast you are, the
 * pointer never gets nearer than GAP px to its edge (cornered against the edge of
 * the screen, it slips out sideways). Clicks go straight through it anyway.
 *
 * A slow wander plus the odd gust keeps it from flying like a cursor follower.
 * When the pointer goes still for IDLE_MS (or there's none: phones until you
 * tap, or the mouse left the window) it flies back to its spot in the top-right
 * corner of the screen, still keeping its distance.
 *
 * It renders parked on the roof, which is all you get under reduced motion; the
 * script lifts it into a fixed layer over the whole page.
 *
 * Click anything that isn't clickable and it tells you so, in a speech bubble.
 */

const KEEP_AWAY = 90; // px it likes to hover from the pointer, centre to pointer
const GAP = 30; // px the pointer can never get closer than, from the drone's edge
const BOB = 12; // px the CSS bob can move the drawing; counted into the gap
const SPRING = 0.012; // pull toward the target, per frame
const DAMPING = 0.9; // velocity kept each frame
const MAX_SPEED = 14; // px per frame
const MAX_BANK = 16; // degrees of lean into the direction of travel
const WANDER = 26; // px of slow random drift around the target
const MARGIN = 8; // keep the whole drone this far inside the screen
const IDLE_MS = 2000; // a pointer this still is ignored, and the drone goes home
const TAUNT = 'You missed';
const TAUNT_MS = 1600;
/** What counts as a hit: anything a click is meant for. */
const CLICKABLE = 'a, button, input, select, textarea, label, summary, [role="button"], [role="link"], [tabindex]:not([tabindex="-1"]), [contenteditable]';
const INK = '#1B1B1B';

type Bubble = { n: number; below: boolean; right: boolean };

export default function ChaseDrone({ font, style }: { /** for the speech bubble */ font: string; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const [bubble, setBubble] = useState<Bubble | null>(null);

  // a miss: the click landed on nothing clickable (and wasn't the end of a text selection)
  useEffect(() => {
    let hide: ReturnType<typeof setTimeout> | undefined;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target || target.closest(CLICKABLE)) return;
      if (window.getSelection()?.toString()) return;
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      setBubble((b) => ({
        n: (b?.n ?? 0) + 1, // a new key restarts the pop on every miss
        below: r.top < 70, // no room above near the top of the screen
        right: r.left + r.width / 2 > document.documentElement.clientWidth / 2,
      }));
      clearTimeout(hide);
      hide = setTimeout(() => setBubble(null), TAUNT_MS);
    };
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('click', onClick);
      clearTimeout(hide);
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    const tilted = tilt.current;
    if (!el || !tilted || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const screenW = () => document.documentElement.clientWidth; // without the scrollbar
    const screenH = () => window.innerHeight;
    const home = () => ({ x: screenW() * 0.97 - el.offsetWidth, y: Math.min(70, Math.max(40, screenH() * 0.07)) });

    // take off from where it's parked on the roof
    const parked = el.getBoundingClientRect();
    let x = parked.left;
    let y = parked.top;
    Object.assign(el.style, { position: 'fixed', top: '0', left: '0', right: 'auto', transform: `translate(${x}px, ${y}px)` });

    let vx = 0;
    let vy = 0;
    let pointer: { x: number; y: number } | null = null; // viewport coordinates
    let movedAt = 0;
    let frame = 0;
    let t = 0;

    // each visit flies a little differently
    const seed = Array.from({ length: 4 }, () => Math.random() * Math.PI * 2);
    let gustX = 0;
    let gustY = 0;

    const step = () => {
      t += 1;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const maxX = screenW() - w - MARGIN;
      const maxY = screenH() - h - MARGIN;

      // slow wander: two sines per axis at unrelated speeds never quite repeat
      const wx = WANDER * (Math.sin(t * 0.011 + seed[0]) * 0.6 + Math.sin(t * 0.027 + seed[1]) * 0.4);
      const wy = WANDER * 0.7 * (Math.sin(t * 0.009 + seed[2]) * 0.6 + Math.sin(t * 0.023 + seed[3]) * 0.4);

      let tx: number;
      let ty: number;
      if (pointer && performance.now() - movedAt < IDLE_MS) {
        // stay on the side of the pointer we're already on, KEEP_AWAY out
        let dx = x + w / 2 - pointer.x;
        let dy = y + h / 2 - pointer.y;
        const d = Math.hypot(dx, dy) || 1;
        dx /= d;
        dy /= d;
        tx = pointer.x + dx * KEEP_AWAY - w / 2;
        ty = pointer.y + dy * KEEP_AWAY - h / 2;
        // closing in: a shove away, on top of the spring
        if (d < KEEP_AWAY * 0.8) {
          const push = (1 - d / (KEEP_AWAY * 0.8)) * 3;
          vx += dx * push;
          vy += dy * push;
        }
      } else {
        ({ x: tx, y: ty } = home());
      }
      tx += wx;
      ty += wy;

      // the odd gust: a small random kick that fades
      if (Math.random() < 0.02) {
        gustX = (Math.random() - 0.5) * 1.6;
        gustY = (Math.random() - 0.5) * 1.2;
      }
      gustX *= 0.94;
      gustY *= 0.94;

      vx = (vx + (tx - x) * SPRING + gustX) * DAMPING;
      vy = (vy + (ty - y) * SPRING + gustY) * DAMPING;
      const speed = Math.hypot(vx, vy);
      if (speed > MAX_SPEED) {
        vx *= MAX_SPEED / speed;
        vy *= MAX_SPEED / speed;
      }
      x += vx;
      y += vy;

      // stay on screen; bounce softly off the edges
      const keepInside = () => {
        if (x < MARGIN) { x = MARGIN; vx = Math.abs(vx) * 0.5; }
        if (x > maxX) { x = maxX; vx = -Math.abs(vx) * 0.5; }
        if (y < MARGIN) { y = MARGIN; vy = Math.abs(vy) * 0.5; }
        if (y > maxY) { y = maxY; vy = -Math.abs(vy) * 0.5; }
      };
      keepInside();

      // the hard rule: however fast the pointer is, it never reaches the drone
      if (pointer) {
        const p = pointer;
        const reach = Math.max(w, h) / 2 + BOB + GAP;
        const away = (ax: number, ay: number) => {
          x = p.x + ax * reach - w / 2;
          y = p.y + ay * reach - h / 2;
        };
        let dx = x + w / 2 - p.x;
        let dy = y + h / 2 - p.y;
        let d = Math.hypot(dx, dy);
        if (d < reach) {
          if (d < 0.01) { dx = 1; dy = 0; d = 1; }
          dx /= d;
          dy /= d;
          away(dx, dy);
          vx = dx * MAX_SPEED * 0.6;
          vy = dy * MAX_SPEED * 0.6;
          keepInside();
          // cornered: the edge pushed it back into reach, so slip out sideways,
          // toward whichever side has more room
          if (Math.hypot(x + w / 2 - p.x, y + h / 2 - p.y) < reach - 1) {
            const room = (sx: number, sy: number) => Math.min(
              sx > 0 ? maxX - x : sx < 0 ? x - MARGIN : Infinity,
              sy > 0 ? maxY - y : sy < 0 ? y - MARGIN : Infinity,
            );
            const [ax, ay] = room(-dy, dx) >= room(dy, -dx) ? [-dy, dx] : [dy, -dx];
            away(ax, ay);
            vx = ax * MAX_SPEED;
            vy = ay * MAX_SPEED;
            keepInside();
          }
        }
      }

      const bank = Math.max(-MAX_BANK, Math.min(MAX_BANK, vx * 2.2));
      // banking goes on an inner layer so the speech bubble stays level
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      tilted.style.transform = `rotate(${bank.toFixed(1)}deg)`;
      frame = requestAnimationFrame(step);
    };

    // touch only reports a tap or a drag; that's fine, it chases the finger then
    const onPointer = (e: PointerEvent) => {
      pointer = { x: e.clientX, y: e.clientY };
      movedAt = performance.now();
    };
    const onLeave = () => { pointer = null; };

    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('pointerdown', onPointer, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    frame = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('pointerdown', onPointer);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      // never clickable: clicks fall through to whatever is underneath
      style={{ position: 'absolute', top: 'clamp(40px,7vh,70px)', right: '3%', pointerEvents: 'none', willChange: 'transform', ...style }}
    >
      <div ref={tilt}>
        <Drone className="bld-bob" style={{ width: '100%', height: 'auto', display: 'block' }} />
      </div>
      {bubble && (
        <div
          key={bubble.n}
          className="bld-pop"
          style={{
            position: 'absolute',
            [bubble.below ? 'top' : 'bottom']: 'calc(100% + 8px)',
            [bubble.right ? 'right' : 'left']: '8%',
            transformOrigin: `${bubble.right ? '85%' : '15%'} ${bubble.below ? '0' : '100%'}`,
            background: C.cream,
            border: `3px solid ${INK}`,
            borderRadius: 8,
            boxShadow: `3px 3px 0 ${INK}`,
            padding: '6px 10px',
            fontFamily: font,
            fontSize: 13,
            fontWeight: 700,
            color: INK,
            whiteSpace: 'nowrap',
          }}
        >
          {TAUNT}
          {/* the tail, pointing back at the drone */}
          <span
            style={{
              position: 'absolute',
              [bubble.right ? 'right' : 'left']: 18,
              [bubble.below ? 'top' : 'bottom']: -9,
              width: 12,
              height: 12,
              background: C.cream,
              borderRight: `3px solid ${INK}`,
              borderBottom: `3px solid ${INK}`,
              transform: `rotate(${bubble.below ? 225 : 45}deg)`,
            }}
          />
        </div>
      )}
    </div>
  );
}
