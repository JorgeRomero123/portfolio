'use client';

// Language for /the-game. It starts in `initialLang` (English, like the rest of the site); a visitor's
// explicit choice is remembered in localStorage (`the-game:lang`) and wins on later visits.
import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import type { Lang } from './types';

const KEY = 'the-game:lang';
const listeners = new Set<() => void>();

function readStored(): Lang | null {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === 'en' || v === 'es' ? v : null;
  } catch {
    return null;
  }
}

// In-memory fallback so the toggle still works when localStorage throws.
let memory: Lang | null = null;

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

interface LangValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LangContext = createContext<LangValue | null>(null);

export function LangProvider({ initialLang, children }: { initialLang: Lang; children: ReactNode }) {
  const lang = useSyncExternalStore(
    subscribe,
    () => memory ?? readStored() ?? initialLang,
    () => initialLang,
  );

  const setLang = useCallback((next: Lang) => {
    memory = next;
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      // storage unavailable: the in-memory value still applies for this visit
    }
    listeners.forEach((fn) => fn());
  }, []);

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);
  return (
    <LangContext.Provider value={value}>
      <div lang={lang}>{children}</div>
    </LangContext.Provider>
  );
}

export function useLang(): LangValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>');
  return ctx;
}
