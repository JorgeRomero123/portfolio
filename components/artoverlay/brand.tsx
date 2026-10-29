/**
 * Art Overlay's brand, shared by everything on this site that advertises it: the
 * homepage card and the building's billboard.
 */

/** Art Overlay's palette (its `globals.css` tokens), so what we draw looks like the product. */
export const AO = {
  tinta: '#1d1836',
  tenue: '#554e6c',
  acento: '#6b3bf2',
  sol: '#ffcf33',
  coral: '#ff6647',
  hoja: '#2fb57c',
  lila: '#c79bea',
};

export function ArtOverlayLogo() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden focusable="false" style={{ flex: 'none' }}>
      <circle cx="9" cy="14.5" r="7.5" fill={AO.sol} />
      <rect x="9.5" y="2.5" width="12.5" height="12.5" rx="2.5" fill={AO.coral} style={{ mixBlendMode: 'multiply' }} />
      <path d="M8 8.5 C13 6.5 19.5 8 21 13 C22.5 18 18 22.5 12.5 21.5" fill="none" stroke={AO.tinta} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
