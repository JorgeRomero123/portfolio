'use client';

// Visitor progress for /the-game, persisted to localStorage (`the-game:v1`).
// Every storage access is guarded: if localStorage throws or holds junk, the game runs on
// DEFAULT_PROGRESS (kept in memory for the visit).
import { useCallback, useSyncExternalStore } from 'react';
import { TILE_COUNT } from './board/layout';
import { DEFAULT_PROGRESS, HAT_IDS, SECTION_IDS, type HatId, type Progress, type SectionId } from './types';

const KEY = 'the-game:v1';

const isSection = (v: unknown): v is SectionId => typeof v === 'string' && (SECTION_IDS as readonly string[]).includes(v);
const isHat = (v: unknown): v is HatId => typeof v === 'string' && (HAT_IDS as readonly string[]).includes(v);
const count = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);
const uniq = <T,>(a: T[]) => Array.from(new Set(a));
const lapSteps = (v: unknown) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.max(-TILE_COUNT, Math.min(TILE_COUNT, Math.round(v))) : 0;

/** Coerces anything into a valid Progress, keeping whatever fields are valid. */
export function sanitizeProgress(raw: unknown): Progress {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_PROGRESS };
  const r = raw as Record<string, unknown>;
  const arr = (v: unknown) => (Array.isArray(v) ? v : []);
  const factsSeen: Progress['factsSeen'] = {};
  if (r.factsSeen && typeof r.factsSeen === 'object') {
    for (const [k, v] of Object.entries(r.factsSeen as Record<string, unknown>)) {
      if (isSection(k)) factsSeen[k] = count(v);
    }
  }
  const hats = uniq(arr(r.hats).filter(isHat));
  return {
    stamps: uniq(arr(r.stamps).filter(isSection)),
    hats,
    wornHat: isHat(r.wornHat) && hats.includes(r.wornHat) ? r.wornHat : null,
    bonusDarts: count(r.bonusDarts),
    freeMoves: count(r.freeMoves),
    storiesUnlocked: uniq(arr(r.storiesUnlocked).filter(isSection)),
    factsSeen,
    pawnTile: count(r.pawnTile),
    soundOn: r.soundOn === true,
    rivalSteps: lapSteps(r.rivalSteps),
    race: r.race === 'won' || r.race === 'lost' ? r.race : 'running',
  };
}

export function loadProgress(): Progress {
  try {
    const s = window.localStorage.getItem(KEY);
    return s ? sanitizeProgress(JSON.parse(s)) : { ...DEFAULT_PROGRESS };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function saveProgress(p: Progress): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // storage full or blocked: progress lives in memory for this visit
  }
}

// ------------------------------------------------------------------ shared store
let current: Progress | null = null;
const listeners = new Set<() => void>();

function snapshot(): Progress {
  if (!current) current = loadProgress();
  return current;
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Read the latest progress outside React (e.g. inside an async turn). */
export const getProgress = snapshot;

export type ProgressUpdate = Partial<Progress> | ((prev: Progress) => Partial<Progress>);

/** Merge a change into progress, persist it and notify every useProgress() consumer. */
export function updateProgress(update: ProgressUpdate): Progress {
  const prev = snapshot();
  const patch = typeof update === 'function' ? update(prev) : update;
  current = sanitizeProgress({ ...prev, ...patch });
  saveProgress(current);
  listeners.forEach((fn) => fn());
  return current;
}

/**
 * `const [progress, update] = useProgress()`. Server render and hydration see DEFAULT_PROGRESS;
 * the stored progress arrives right after hydration.
 */
export function useProgress(): [Progress, (update: ProgressUpdate) => Progress] {
  const progress = useSyncExternalStore(subscribe, snapshot, () => DEFAULT_PROGRESS);
  const update = useCallback((u: ProgressUpdate) => updateProgress(u), []);
  return [progress, update];
}
