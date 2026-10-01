// Pinta con guía: the pre-sketched design (a lake landscape, 18 areas) and the 12-paint gouache palette.
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
  { hex: '#f08a3c', ink: '#4a2203', name: { en: 'orange', es: 'naranja' } },
  { hex: '#e2504c', ink: '#ffffff', name: { en: 'red', es: 'rojo' } },
  { hex: '#8e6bd1', ink: '#ffffff', name: { en: 'purple', es: 'morado' } },
  { hex: '#2fa39a', ink: '#ffffff', name: { en: 'teal', es: 'turquesa' } },
  { hex: '#2f7d4f', ink: '#ffffff', name: { en: 'dark green', es: 'verde oscuro' } },
  { hex: '#a8b0ba', ink: '#1f2937', name: { en: 'gray', es: 'gris' } },
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
    id: 'cloud',
    d: 'M72 50Q62 50 64 40Q66 30 80 33Q86 22 102 26Q116 22 122 34Q138 34 136 46Q134 52 124 50Z',
    box: [62, 22, 76, 30],
    need: 11,
    hint: [100, 39],
    name: { en: 'Cloud', es: 'Nube' },
    the: { en: 'the cloud', es: 'la nube' },
  },
  {
    id: 'halo',
    d: 'M205 56a40 40 0 1 0 80 0a40 40 0 1 0 -80 0Z',
    box: [205, 16, 80, 80],
    need: 6,
    hint: [222, 33],
    name: { en: 'Sun glow', es: 'Resplandor del sol' },
    the: { en: 'the sun glow', es: 'el resplandor del sol' },
    hitPad: 8,
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
    hint: [124, 118],
    name: { en: 'Mountain', es: 'Montaña' },
    the: { en: 'the mountain', es: 'la montaña' },
  },
  {
    id: 'peakL',
    d: 'M118 68L138 88L126 96L112 90L98 89Z',
    box: [98, 68, 40, 28],
    need: 8,
    hint: [118, 84],
    name: { en: 'Left peak', es: 'Cumbre izquierda' },
    the: { en: 'the left peak', es: 'la cumbre izquierda' },
    hitPad: 12,
  },
  {
    id: 'peakR',
    d: 'M190 82L204 97L192 102L182 96L174 95Z',
    box: [174, 82, 30, 20],
    need: 8,
    hint: [190, 93],
    name: { en: 'Right peak', es: 'Cumbre derecha' },
    the: { en: 'the right peak', es: 'la cumbre derecha' },
    hitPad: 12,
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
    hint: [112, 156],
    name: { en: 'Left hill', es: 'Colina izquierda' },
    the: { en: 'the left hill', es: 'la colina izquierda' },
  },
  {
    id: 'pineTall',
    d: 'M40 96L60 150H20Z',
    box: [20, 96, 40, 54],
    need: 10,
    hint: [40, 134],
    name: { en: 'Tall pine', es: 'Pino alto' },
    the: { en: 'the tall pine', es: 'el pino alto' },
  },
  {
    id: 'pineSmall',
    d: 'M74 116L88 152H60Z',
    box: [60, 116, 28, 36],
    need: 10,
    hint: [74, 140],
    name: { en: 'Small pine', es: 'Pino chico' },
    the: { en: 'the small pine', es: 'el pino chico' },
    hitPad: 8,
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
    need: 9,
    hint: [60, 198],
    name: { en: 'Lake', es: 'Lago' },
    the: { en: 'the lake', es: 'el lago' },
  },
  {
    id: 'boat',
    d: 'M102 196H152L144 209H110Z',
    box: [102, 196, 50, 13],
    need: 7,
    hint: [120, 203],
    name: { en: 'Boat', es: 'Lancha' },
    the: { en: 'the boat', es: 'la lancha' },
    hitPad: 10,
  },
  {
    id: 'sail',
    d: 'M130 166V193H154Z',
    box: [130, 166, 24, 27],
    need: 6,
    hint: [137, 184],
    name: { en: 'Sail', es: 'Vela' },
    the: { en: 'the sail', es: 'la vela' },
    hitPad: 10,
  },
  {
    id: 'rock',
    d: 'M30 236Q34 220 52 221Q70 222 72 236Z',
    box: [30, 220, 42, 16],
    need: 11,
    hint: [51, 229],
    name: { en: 'Rock', es: 'Roca' },
    the: { en: 'the rock', es: 'la roca' },
    hitPad: 10,
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
export const KEY_ORDER = [0, 1, 2, 3, 5, 6, 4, 17, 9, 10, 8, 7, 16, 14, 12, 13, 15, 11];

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
