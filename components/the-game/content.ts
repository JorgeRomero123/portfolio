// Typed access to content/the-game.json. Safe to import from server and client code.
//
// Any string may be a placeholder that starts with `TODO(jorge): ` (see isTodo in types.ts).
// Those must never reach visitors: use the helpers below (`facts`, `story`, `links`, `text`),
// which drop placeholders, instead of reading raw fields in UI code.
import raw from '@/content/the-game.json';
import { isTodo, type L10n, type Lang, type SectionId } from './types';

export interface ContentLink {
  href: string;
  label: L10n;
}

export interface SectionContent {
  id: SectionId;
  /** Section accent colour; the board derives its terrain palette from it. */
  color: string;
  title: L10n;
  /** One-line hook shown in the prompt and overview. */
  tagline: L10n;
  /** What the 3D landmark on the board is (used for descriptions / aria). */
  landmark: L10n;
  /** The section's mini-game: display name + one how-to line including keyboard controls. */
  game: { name: L10n; howTo: L10n };
  /** Section card ("Just look"): 2–4 sentences about Jorge and this part of his life/work. */
  card: { body: L10n; links: ContentLink[] };
  /** Deeper "story card" won on the prize wheel; links to the real page/product. */
  story: { title: L10n; body: L10n; href: string };
  funFacts: L10n[];
}

export interface GameContent {
  intro: { eyebrow: L10n; heading: L10n; body: L10n };
  summary: { heading: L10n; kicker: L10n; role: L10n; bullets: L10n[] };
  contact: {
    email: string;
    aboutHref: string;
    homeContactHref: string;
    heading: L10n;
    body: L10n;
    aboutLabel: L10n;
    homeLabel: L10n;
  };
  sections: SectionContent[];
}

export const GAME_CONTENT = raw as GameContent;
export const SECTIONS = GAME_CONTENT.sections;
export const sectionById = (id: SectionId) => SECTIONS.find((s) => s.id === id)!;

/** A localized string, or null when it's a TODO placeholder in either language. */
export const text = (v: L10n | undefined, lang: Lang): string | null =>
  !v || isTodo(v.en) || isTodo(v.es) ? null : v[lang];

/** The section's real (non-placeholder) fun facts. */
export const facts = (sec: SectionContent): L10n[] => sec.funFacts.filter((f) => !isTodo(f.en) && !isTodo(f.es));

/** The section's story card, or null while it's still a placeholder. */
export const story = (sec: SectionContent) =>
  isTodo(sec.story.title.en) || isTodo(sec.story.body.en) || isTodo(sec.story.title.es) || isTodo(sec.story.body.es)
    ? null
    : sec.story;

/** Links with real labels and hrefs only. */
export const links = (sec: SectionContent): ContentLink[] =>
  sec.card.links.filter((l) => !isTodo(l.href) && !isTodo(l.label.en) && !isTodo(l.label.es));

/** True for links that leave the site (open in a new tab). */
export const isExternal = (href: string) => /^https?:\/\//.test(href);
