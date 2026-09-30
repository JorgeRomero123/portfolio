'use client';

// Minimal accessible modal for the game stage: traps focus, restores it on close, Escape closes.
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
  /** 'bottom' docks the panel above the turn controls so the pawn (screen centre) stays visible. */
  placement?: 'center' | 'bottom';
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
    (first ?? el)?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (!el) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
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
      document.removeEventListener('keydown', onKey, true);
      if (prev && document.contains(prev)) prev.focus({ preventScroll: true });
    };
  }, []);

  return (
    <motion.div
      className={`absolute inset-0 z-40 flex justify-center p-4 ${placement === 'bottom' ? 'items-end pb-40 sm:pb-44' : 'items-center'} ${backdropClassName}`}
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

export const cardClass = 'rounded-2xl border border-gray-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.12)]';
export const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070f3] focus-visible:ring-offset-2 focus-visible:ring-offset-white';
