// Typed access to content/the-game.json. Safe to import from server and client code.
import raw from '@/content/the-game.json';
import type { L10n, SectionId } from './types';

export interface SectionContent {
  id: SectionId;
  /** Section accent colour; the board derives its terrain palette from it. */
  color: string;
  title: L10n;
}

export interface GameContent {
  sections: SectionContent[];
}

export const GAME_CONTENT = raw as GameContent;
export const SECTIONS = GAME_CONTENT.sections;
export const sectionById = (id: SectionId) => SECTIONS.find((s) => s.id === id)!;
