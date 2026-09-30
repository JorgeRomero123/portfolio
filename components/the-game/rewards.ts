// Reward rules for /the-game — the ONE place that decides stamps and prize-wheel outcomes.
// Pure functions (no React); the overlays call these and then persist with updateProgress().
import { facts, sectionById, story } from './content';
import { HAT_IDS, SECTION_IDS, type HatId, type Progress, type SectionId } from './types';

// ── Stamp rule ──────────────────────────────────────────────────────────────────────────────
/**
 * THE STAMP RULE: a section's FIRST mini-game win always presses its stamp into the passport,
 * then the visitor spins the prize wheel for a bonus. Later wins in an already-stamped section
 * spin the wheel only. The stamp is never a wheel slice, so all 11 stamps are reachable without
 * grinding. Change it here and the whole flow follows.
 */
export function winEarnsStamp(progress: Progress, section: SectionId): boolean {
  return !progress.stamps.includes(section);
}

export const TOTAL_STAMPS = SECTION_IDS.length;
export const hasAllStamps = (p: Progress) => SECTION_IDS.every((id) => p.stamps.includes(id));

// ── Hats ────────────────────────────────────────────────────────────────────────────────────
/** Section-themed hats. Spurs gets a scarf in club colours only (no crest or sponsor). */
export const SECTION_HAT: Partial<Record<SectionId, HatId>> = {
  drone: 'propeller',
  kitchen: 'chef',
  spurs: 'scarf',
  music: 'headphones',
};

/** The hat a win in `section` would award, or null when every hat is owned. */
export function nextHat(progress: Progress, section: SectionId): HatId | null {
  const themed = SECTION_HAT[section];
  if (themed && !progress.hats.includes(themed)) return themed;
  const generic: HatId[] = ['beanie', 'beret'];
  const pool = [...generic, ...HAT_IDS.filter((h) => !generic.includes(h))];
  return pool.find((h) => !progress.hats.includes(h)) ?? null;
}

// ── Fun facts ───────────────────────────────────────────────────────────────────────────────
/**
 * The first real fact is always shown on the section card. `factsSeen[section]` counts the extra
 * facts won on the wheel, so the card shows facts[0 .. factsSeen] and the wheel offers the next one.
 */
export function visibleFactCount(progress: Progress, section: SectionId): number {
  const all = facts(sectionById(section));
  return Math.min(all.length, 1 + (progress.factsSeen[section] ?? 0));
}
export function nextFactIndex(progress: Progress, section: SectionId): number | null {
  const i = visibleFactCount(progress, section);
  return i < facts(sectionById(section)).length ? i : null;
}

// ── Prize wheel ─────────────────────────────────────────────────────────────────────────────
export type SliceKind = 'story' | 'fact' | 'dart' | 'move' | 'hat';

/** Relative weight = how many wheel segments a prize gets. Story cards and hats are the big ones. */
const SLICE_WEIGHT: Record<SliceKind, number> = { story: 2, hat: 2, fact: 2, dart: 1, move: 1 };
const SLICE_ORDER: SliceKind[] = ['story', 'hat', 'fact', 'dart', 'move'];
const MIN_SEGMENTS = 6;

/** Which prizes are still worth offering for this section. Darts and moves are always offered. */
export function offeredSlices(progress: Progress, section: SectionId): SliceKind[] {
  const sec = sectionById(section);
  return SLICE_ORDER.filter((k) => {
    if (k === 'story') return !!story(sec) && !progress.storiesUnlocked.includes(section);
    if (k === 'fact') return nextFactIndex(progress, section) !== null;
    if (k === 'hat') return nextHat(progress, section) !== null;
    return true;
  });
}

/** The wheel's segments, interleaved so the same prize rarely sits next to itself. */
export function wheelSegments(progress: Progress, section: SectionId): SliceKind[] {
  const offered = offeredSlices(progress, section);
  const segs: SliceKind[] = [];
  const maxW = Math.max(...offered.map((k) => SLICE_WEIGHT[k]));
  for (let r = 0; r < maxW; r++) for (const k of offered) if (SLICE_WEIGHT[k] > r) segs.push(k);
  const base = [...segs];
  while (segs.length < MIN_SEGMENTS) segs.push(...base);
  return segs;
}

/** Decide the outcome BEFORE animating: a segment index picked uniformly (so weights = segment counts). */
export function pickSegment(segments: SliceKind[], rng: () => number = Math.random): number {
  return Math.min(segments.length - 1, Math.floor(rng() * segments.length));
}

export type WonPrize =
  | { kind: 'story' }
  | { kind: 'fact'; index: number }
  | { kind: 'dart' }
  | { kind: 'move' }
  | { kind: 'hat'; hat: HatId };

/** Resolve a slice into a concrete prize and the progress patch that grants it. */
export function grant(progress: Progress, section: SectionId, kind: SliceKind): { prize: WonPrize; patch: Partial<Progress> } {
  switch (kind) {
    case 'story':
      return { prize: { kind }, patch: { storiesUnlocked: [...progress.storiesUnlocked, section] } };
    case 'fact': {
      const index = nextFactIndex(progress, section);
      if (index === null) return grant(progress, section, 'dart');
      return {
        prize: { kind, index },
        patch: { factsSeen: { ...progress.factsSeen, [section]: (progress.factsSeen[section] ?? 0) + 1 } },
      };
    }
    case 'hat': {
      const hat = nextHat(progress, section);
      if (!hat) return grant(progress, section, 'move');
      return { prize: { kind, hat }, patch: { hats: [...progress.hats, hat] } };
    }
    case 'dart':
      return { prize: { kind }, patch: { bonusDarts: progress.bonusDarts + 1 } };
    case 'move':
      return { prize: { kind }, patch: { freeMoves: progress.freeMoves + 1 } };
  }
}
