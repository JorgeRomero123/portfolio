// Colour helpers for the board. Everything derives from each section's accent colour but stays soft/light.
import { Color } from 'three';
import { sectionById } from '../content';
import { SECTION_IDS, type SectionId } from '../types';

export const ACCENT = '#0070f3';
export const PAGE_BG = '#f9fafb'; // tailwind gray-50
export const TABLE_SHADOW = '#1e293b';
export const CREAM = '#f3ecdc';
export const INK = '#1f2937';

export const SECTION_COLORS: readonly Color[] = SECTION_IDS.map((id) => new Color(sectionById(id).color));

const hsl = { h: 0, s: 0, l: 0 };
/** Same hue as `c`, with the given saturation and lightness (sRGB HSL). */
export function tone(c: Color, s: number, l: number): Color {
  c.getHSL(hsl);
  return new Color().setHSL(hsl.h, s, l);
}

/**
 * Ground per section patch: a calm land palette of six muted hues (sage, teal-sage, meadow,
 * dusty lavender, wheat, clay). Section accents live on the landmark rings and tile sides instead.
 */
const SAGE = '#aec3a2';
const TEAL_SAGE = '#9dbfae';
const MEADOW = '#afc68f';
const LAVENDER = '#b9b3c6';
const WHEAT = '#d3c898';
const CLAY = '#d5b995';
const GROUND: Record<SectionId, string> = {
  software: SAGE,
  drone: TEAL_SAGE,
  spurs: MEADOW,
  pano360: LAVENDER,
  boardgames: MEADOW,
  music: LAVENDER,
  beer: WHEAT,
  artoverlay: CLAY,
  myalbumlink: TEAL_SAGE,
  emarts: WHEAT,
  kitchen: CLAY,
};
export const SECTION_GROUND: readonly Color[] = SECTION_IDS.map((id) => new Color(GROUND[id]));
