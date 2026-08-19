'use client';

import { useEffect, useState } from 'react';

/**
 * Stop moving for a while and the page says something. Rotates so a long
 * idle doesn't repeat the same line back at you.
 */
export function useEasterEggs() {
  const [idleHint, setIdleHint] = useState<string | null>(null);

  useEffect(() => {
    const LINES = [
      'still there? there are 25 tools further down.',
      'every card links to the real thing.',
      'the 360° tours are actual client work.',
    ];
    let i = 0;
    let idle: ReturnType<typeof setTimeout> | null = null;
    let clear: ReturnType<typeof setTimeout> | null = null;

    const arm = () => {
      if (idle) clearTimeout(idle);
      idle = setTimeout(() => {
        setIdleHint(LINES[i % LINES.length]);
        i++;
        if (clear) clearTimeout(clear);
        clear = setTimeout(() => setIdleHint(null), 4200);
        arm();
      }, 12000);
    };

    const wake = () => { setIdleHint(null); arm(); };
    const events: Array<keyof WindowEventMap> = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, wake, { passive: true }));
    arm();

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, wake));
      if (idle) clearTimeout(idle);
      if (clear) clearTimeout(clear);
    };
  }, []);

  return { idleHint };
}
