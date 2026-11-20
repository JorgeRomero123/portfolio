'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

/**
 * Leans its children toward whoever is looking: the cursor on a laptop, a tap on a
 * phone, and on Android the way the phone is tilted. The drawing itself never
 * changes; the wrapper only rotates from its base and slides a few pixels, which
 * keeps a character charming instead of puppet-stiff.
 *
 * iOS asks permission before it hands over the gyroscope, and a permission prompt
 * on load is a terrible hello, so iPhones just follow the finger.
 */

const MAX_TURN = 10; // degrees
const MAX_SHIFT = 8; // px
/** Share of the remaining distance covered each frame: ~half a second to settle, no overshoot. */
const EASE = 0.1;

export default function LeansToward({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // both run -1..1: left/up to right/down of the element
    let goalX = 0;
    let goalY = 0;
    let x = 0;
    let y = 0;
    let frame = 0;
    let onScreen = true;
    let restingTilt: number | null = null; // how the phone was held when we started

    const clamp = (v: number) => Math.max(-1, Math.min(1, v));

    const draw = () => {
      x += (goalX - x) * EASE;
      y += (goalY - y) * EASE;
      el.style.transform = `translate(${(x * MAX_SHIFT).toFixed(2)}px, ${(y * MAX_SHIFT * 0.4).toFixed(2)}px) rotate(${(x * MAX_TURN).toFixed(2)}deg)`;
      const settled = Math.abs(goalX - x) < 0.002 && Math.abs(goalY - y) < 0.002;
      frame = settled ? 0 : requestAnimationFrame(draw);
    };
    const wake = () => {
      if (!frame && onScreen) frame = requestAnimationFrame(draw);
    };

    const lookAt = (px: number, py: number) => {
      const r = el.getBoundingClientRect();
      goalX = clamp((px - (r.left + r.width / 2)) / (window.innerWidth / 2));
      goalY = clamp((py - (r.top + r.height / 2)) / (window.innerHeight / 2));
      wake();
    };

    // On touch screens pointermove only fires while dragging; a tap arrives as pointerdown.
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' || e.type === 'pointerdown') lookAt(e.clientX, e.clientY);
    };

    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return;
      if (restingTilt === null) restingTilt = e.beta;
      goalX = clamp(e.gamma / 30);
      goalY = clamp((e.beta - restingTilt) / 30);
      wake();
    };

    // nobody to look at while it's off screen
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) wake();
    });
    io.observe(el);

    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('pointerdown', onPointer, { passive: true });
    window.addEventListener('deviceorientation', onTilt);
    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('deviceorientation', onTilt);
    };
  }, []);

  return (
    <div ref={ref} style={{ transformOrigin: '50% 100%', willChange: 'transform', ...style }}>
      {children}
    </div>
  );
}
