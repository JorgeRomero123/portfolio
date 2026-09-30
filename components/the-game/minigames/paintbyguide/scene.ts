// Pinta con guía: the pre-sketched design (a small lake landscape) and the gouache palette.
// Canvas coordinates are 320×240. Regions are listed in painter's order (later ones sit on top),
// so overlaps resolve naturally and each region's pencil line is covered by whatever lies above it.

export interface Paint {
  hex: string;
  /** Text colour for the hint number drawn on this paint. */
  ink: string;
  name: { en: string; es: string };
}

export const PAINTS: Paint[] = [
  { hex: '#8cc8ec', ink: '#12324a', name: { en: 'sky blue', es: 'azul cielo' } },
  { hex: '#f6c343', ink: '#4a3503', name: { en: 'yellow', es: 'amarillo' } },
  { hex: '#f28cb8', ink: '#4c0f2c', name: { en: 'pink', es: 'rosa' } },
  { hex: '#6cbf5a', ink: '#12330c', name: { en: 'green', es: 'verde' } },
  { hex: '#3d63a8', ink: '#ffffff', name: { en: 'deep blue', es: 'azul marino' } },
  { hex: '#9b6a45', ink: '#ffffff', name: { en: 'brown', es: 'café' } },
];

export type Box = [x: number, y: number, w: number, h: number];

export interface Region {
  id: string;
  d: string;
  box: Box;
  /** Index into PAINTS. */
  need: number;
  hint: [number, number];
  name: { en: string; es: string };
  /** With article, for sentences ("the sky" / "el cielo"). */
  the: { en: string; es: string };
  /** Extra invisible stroke on the hit path so thin shapes stay ≥ 44 px to tap. */
  hitPad?: number;
}

export const REGIONS: Region[] = [
  {
    id: 'sky',
    d: 'M0 0H320V240H0Z',
    box: [0, 0, 320, 240],
    need: 0,
    hint: [36, 34],
    name: { en: 'Sky', es: 'Cielo' },
    the: { en: 'the sky', es: 'el cielo' },
  },
  {
    id: 'sun',
    d: 'M219 56a26 26 0 1 0 52 0a26 26 0 1 0 -52 0Z',
    box: [219, 30, 52, 52],
    need: 1,
    hint: [245, 56],
    name: { en: 'Sun', es: 'Sol' },
    the: { en: 'the sun', es: 'el sol' },
  },
  {
    id: 'mountain',
    d: 'M20 172L118 68L158 108L190 82L276 172Z',
    box: [20, 68, 256, 104],
    need: 4,
    hint: [120, 104],
    name: { en: 'Mountain', es: 'Montaña' },
    the: { en: 'the mountain', es: 'la montaña' },
  },
  {
    id: 'hillR',
    d: 'M146 178Q200 116 320 126V178Z',
    box: [146, 116, 174, 62],
    need: 3,
    hint: [196, 158],
    name: { en: 'Right hill', es: 'Colina derecha' },
    the: { en: 'the right hill', es: 'la colina derecha' },
  },
  {
    id: 'hillL',
    d: 'M0 178V134Q55 102 140 148Q154 158 166 178Z',
    box: [0, 108, 166, 70],
    need: 3,
    hint: [44, 150],
    name: { en: 'Left hill', es: 'Colina izquierda' },
    the: { en: 'the left hill', es: 'la colina izquierda' },
  },
  {
    id: 'shore',
    d: 'M0 172Q160 164 320 172V240H0Z',
    box: [0, 164, 320, 76],
    need: 1,
    hint: [236, 226],
    name: { en: 'Shore', es: 'Orilla' },
    the: { en: 'the shore', es: 'la orilla' },
  },
  {
    id: 'lake',
    d: 'M24 198Q26 180 118 179Q214 178 226 196Q222 216 124 218Q28 218 24 198Z',
    box: [24, 178, 202, 40],
    need: 0,
    hint: [124, 198],
    name: { en: 'Lake', es: 'Lago' },
    the: { en: 'the lake', es: 'el lago' },
  },
  {
    id: 'trunk',
    d: 'M258 146H280L284 224H254Z',
    box: [254, 146, 30, 78],
    need: 5,
    hint: [269, 196],
    name: { en: 'Trunk', es: 'Tronco' },
    the: { en: 'the trunk', es: 'el tronco' },
    hitPad: 10,
  },
  {
    id: 'crown',
    d: 'M269 86C301 84 316 114 304 136C296 156 242 158 234 138C222 116 236 86 269 86Z',
    box: [226, 84, 84, 72],
    need: 2,
    hint: [269, 118],
    name: { en: 'Treetop', es: 'Copa del árbol' },
    the: { en: 'the treetop', es: 'la copa del árbol' },
  },
];

/** Keyboard reading order: top to bottom, left to right. Indices into REGIONS. */
export const KEY_ORDER = [0, 1, 2, 4, 3, 8, 7, 6, 5];

/** Back-and-forth brush path that covers a box when stroked with `width`. */
export function brushPath([x, y, w, h]: Box, width: number): string {
  const step = width * 0.6;
  const pad = width / 2;
  const pts: string[] = [];
  let right = false;
  for (let yy = y - step / 4; yy <= y + h + step / 2; yy += step / 2) {
    pts.push(`${(right ? x + w + pad : x - pad).toFixed(1)} ${yy.toFixed(1)}`);
    right = !right;
  }
  return `M${pts.join('L')}`;
}
