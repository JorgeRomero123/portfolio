'use client';

import { useEffect, useRef, useState } from 'react';

type Handles = {
  onSpurs: () => void;
  onSpursEnd: () => void;
};

/**
 * Two rewards for sticking around:
 *  - type "COYS" anywhere and the whole page defects to Tottenham navy/white
 *  - stop moving for a while and the page says something
 */
export function useEasterEggs({ onSpurs, onSpursEnd }: Handles) {
  const [spurs, setSpurs] = useState(false);
  const [idleHint, setIdleHint] = useState<string | null>(null);

  const cbs = useRef({ onSpurs, onSpursEnd });
  cbs.current = { onSpurs, onSpursEnd };

  // ---- typed secret ----
  useEffect(() => {
    const SECRET = 'coys';
    let buf = '';
    let timer: ReturnType<typeof setTimeout> | null = null;

    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      // never hijack real typing
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if (e.key.length !== 1) return;

      buf = (buf + e.key.toLowerCase()).slice(-SECRET.length);
      if (buf !== SECRET) return;

      buf = '';
      setSpurs(true);
      cbs.current.onSpurs();
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setSpurs(false);
        cbs.current.onSpursEnd();
      }, 6000);
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (timer) clearTimeout(timer);
    };
  }, []);

  // ---- idle nudges ----
  useEffect(() => {
    const LINES = [
      'still there? drag the cloud.',
      'psst — try typing COYS.',
      'there are 25 tools further down.',
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

  return { spurs, idleHint };
}
