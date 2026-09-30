// Colour helpers for the board. Everything derives from each section's accent colour but stays soft/light.
import { Color } from 'three';
import { sectionById } from '../content';
import { SECTION_IDS } from '../types';

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
