'use client';

// Minimal accessible modal for the game stage: traps focus, restores it on close, Escape closes.
// Initial focus: the first `[data-autofocus]` element (also one that appears later, e.g. inside a
// lazy-loaded mini-game, until the visitor moves focus), else the first focusable element.
// Covers the stage only (absolute), not the whole page.
import { useEffect, useRef, type ReactNode } from 'react';
import { motion } from 'framer-motion';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Dialog({
  labelledBy,
  describedBy,
  onClose,
  children,
  reducedMotion,
  panelClassName = '',
  backdropClassName = 'bg-white/55 backdrop-blur-[2px]',
  placement = 'center',
}: {
  labelledBy: string;
  describedBy?: string;
  onClose: () => void;
  children: ReactNode;
  reducedMotion: boolean;
  panelClassName?: string;
  backdropClassName?: string;
  /**
   * 'bottom' docks the panel above the turn controls so the pawn (screen centre) stays visible.
   * 'sheet' is a bottom sheet on phones (full width, flush with the bottom) and centred from `sm` up.
   */
  placement?: 'center' | 'bottom' | 'sheet';
}) {
  const panel = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const el = panel.current;
    const first = el?.querySelector<HTMLElement>('[data-autofocus]') ?? el?.querySelector<HTMLElement>(FOCUSABLE);
    const initial = first ?? el;
    initial?.focus({ preventScroll: true });
    // Content that mounts later (a lazy-loaded mini-game) may bring its own `data-autofocus` control:
    // hand focus to it, as long as the visitor hasn't moved focus themselves in the meantime.
    let observer: MutationObserver | null = null;
    const stopWatching = () => {
      observer?.disconnect();
      observer = null;
      el?.removeEventListener('pointerdown', stopWatching, true);
    };
    if (el && !initial?.hasAttribute('data-autofocus')) {
      const claim = () => {
        const a = document.activeElement;
        if (a && a !== document.body && a !== el && a !== initial && el.contains(a)) return stopWatching();
        if (a && a !== document.body && !el.contains(a)) return stopWatching();
        const target = el.querySelector<HTMLElement>('[data-autofocus]');
        if (!target) return;
        target.focus({ preventScroll: true });
        if (document.activeElement === target) stopWatching();
      };
      observer = new MutationObserver(claim);
      observer.observe(el, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-autofocus'] });
      el.addEventListener('pointerdown', stopWatching, true);
    }
    const onKey = (e: KeyboardEvent) => {
      if (!el) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      stopWatching();
      const items = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null);
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const a = items[0];
      const z = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === a || !el.contains(document.activeElement))) {
        e.preventDefault();
        z.focus();
      } else if (!e.shiftKey && (document.activeElement === z || !el.contains(document.activeElement))) {
        e.preventDefault();
        a.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      stopWatching();
      document.removeEventListener('keydown', onKey, true);
      if (prev && document.contains(prev)) prev.focus({ preventScroll: true });
    };
  }, []);

  return (
    <motion.div
      className={`absolute inset-0 z-40 flex justify-center ${PLACEMENT[placement]} ${backdropClassName}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.2 }}
    >
      <motion.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        className={`outline-none ${panelClassName}`}
        initial={reducedMotion ? false : { opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: reducedMotion ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

const PLACEMENT = {
  center: 'items-center p-4',
  bottom: 'items-end p-4 pb-40 sm:pb-44',
  sheet: 'items-end p-0 pt-3 sm:items-center sm:p-4',
} as const;

export const cardClass = 'rounded-2xl border border-gray-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.12)]';
export const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070f3] focus-visible:ring-offset-2 focus-visible:ring-offset-white';
