'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Lenis owns the scroll position; GSAP's ticker drives Lenis. Wiring them in
 * this direction — rather than letting each run its own rAF — is what keeps
 * ScrollTrigger's pinning in sync with the smoothed position. Run them
 * independently and pinned sections jitter by a frame.
 */
export function useSmoothScroll(enabled: boolean) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (!enabled) return;

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    });
    lenisRef.current = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [enabled]);

  /** Anchor navigation has to go through Lenis, or it fights the smoothing. */
  const scrollTo = (hash: string) => {
    const el = document.querySelector(hash);
    if (!el) return;
    if (lenisRef.current) lenisRef.current.scrollTo(el as HTMLElement, { offset: 0 });
    else el.scrollIntoView({ behavior: 'smooth' });
  };

  return { scrollTo };
}
