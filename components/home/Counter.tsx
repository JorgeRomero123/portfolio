'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, useInView } from 'framer-motion';
import { usePrefersReducedMotion } from './lib/usePrefersReducedMotion';

/** Count-up driven by a Framer Motion animation, fired once on entry. */
export default function Counter({
  to,
  suffix = '',
  duration = 1.7,
}: {
  to: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-12%' });
  const reduced = usePrefersReducedMotion();
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView || reduced) return;

    const controls = animate(0, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setN(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, to, duration, reduced]);

  // Reduced motion skips the tween entirely rather than setting state for it.
  const shown = reduced ? to : n;

  return (
    <span ref={ref}>
      {shown.toLocaleString('en-US')}
      {suffix}
    </span>
  );
}
