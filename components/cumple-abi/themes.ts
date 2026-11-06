// Opciones de la ruleta, agrupadas por temática. Para agregar una, añade un objeto
// al grupo que corresponda (o un grupo nuevo): la ruleta se reparte sola y mezcla
// los grupos para que no queden rebanadas de la misma temática juntas.
export type Theme = {
  /** Texto corto para la rebanada (máx. ~11 letras). */
  short: string;
  /** Título en la tarjeta del resultado. */
  label: string;
  emoji: string;
  /** La instrucción que ve el invitado cuando le toca. */
  prompt: string;
  /** Temática a la que pertenece (se llena sola desde GROUPS). */
  group: string;
  /** Identificador estable (se llena solo): así se guarda qué opciones ya salieron. */
  id: string;
};

type Group = { group: string; items: Omit<Theme, 'group' | 'id'>[] };

const GROUPS: Group[] = [
  {
    group: 'Francia',
    items: [
      { short: 'Torre Eiffel', label: 'La Torre Eiffel', emoji: '🗼', prompt: 'Dibuja la Torre Eiffel. Con fuegos artificiales si te sientes con ganas.' },
      { short: 'Croissant', label: 'Un croissant', emoji: '🥐', prompt: 'Dibuja un croissant recién horneado, bien doradito.' },
      { short: 'Baguette', label: 'Una baguette', emoji: '🥖', prompt: 'Dibuja una baguette… o a alguien en bici llevándola bajo el brazo.' },
      { short: 'Macarons', label: 'Macarons', emoji: '🍪', prompt: 'Dibuja una torre de macarons de colores.' },
      { short: 'Mimo', label: 'Un mimo francés', emoji: '🎭', prompt: 'Dibuja un mimo: playera de rayas, boina y cara blanca.' },
      { short: 'Arco', label: 'El Arco del Triunfo', emoji: '🏛️', prompt: 'Dibuja el Arco del Triunfo.' },
    ],
  },
  {
    group: 'Snoopy',
    items: [
      { short: 'Su casita', label: 'Snoopy en su casita', emoji: '🏠', prompt: 'Dibuja a Snoopy dormido arriba de su casita roja.' },
      { short: 'Woodstock', label: 'Woodstock', emoji: '🐤', prompt: 'Dibuja a Woodstock, el pajarito amarillo amigo de Snoopy.' },
      { short: 'Aviador', label: 'Snoopy aviador', emoji: '🛩️', prompt: 'Dibuja a Snoopy de piloto, con su gorro y bufanda al viento.' },
      { short: 'Joe Cool', label: 'Joe Cool', emoji: '😎', prompt: 'Dibuja a Snoopy en modo Joe Cool: lentes oscuros y mucha actitud.' },
      { short: 'Bailando', label: 'Snoopy bailando', emoji: '💃', prompt: 'Dibuja a Snoopy en su baile feliz.' },
    ],
  },
  {
    group: 'Amélie',
    items: [
      { short: 'Gnomo', label: 'El gnomo viajero', emoji: '🧙', prompt: 'Dibuja al gnomo viajero posando frente a algún lugar del mundo.' },
      { short: 'Crème brûlée', label: 'Una crème brûlée', emoji: '🍮', prompt: 'Dibuja una crème brûlée a punto de romper su costra con la cuchara.' },
      { short: 'Frambuesas', label: 'Frambuesas en los dedos', emoji: '🍓', prompt: 'Dibuja una mano con una frambuesa en cada dedo.' },
      { short: 'Flequillo', label: 'Amélie y su flequillo', emoji: '💇‍♀️', prompt: 'Dibuja a Amélie con su flequillo y su sonrisa traviesa.' },
      { short: 'Sacré-Cœur', label: 'El Sacré-Cœur', emoji: '⛪', prompt: 'Dibuja el Sacré-Cœur en lo alto de Montmartre.' },
    ],
  },
  {
    group: 'Stitch',
    items: [
      { short: 'Stitch', label: 'Stitch', emoji: '👽', prompt: 'Dibuja a Stitch con sus orejotas y su sonrisa de travieso.' },
      { short: 'Stitch y Angel', label: 'Stitch y Angel', emoji: '💗', prompt: 'Dibuja a Stitch con Angel, su novia rosa.' },
      { short: 'Surfista', label: 'Stitch surfista', emoji: '🏄', prompt: 'Dibuja a Stitch surfeando una ola en Hawái.' },
      { short: 'Ukulele', label: 'Stitch con ukulele', emoji: '🎸', prompt: 'Dibuja a Stitch tocando el ukulele.' },
    ],
  },
  {
    group: 'Toy Story',
    items: [
      { short: 'Woody', label: 'Woody', emoji: '🤠', prompt: 'Dibuja a Woody con su sombrero de vaquero.' },
      { short: 'Buzz', label: 'Buzz Lightyear', emoji: '🚀', prompt: 'Dibuja a Buzz Lightyear… ¡al infinito y más allá!' },
      { short: 'Rex', label: 'Rex', emoji: '🦖', prompt: 'Dibuja a Rex, el dinosaurio más nervioso del cuarto.' },
      { short: 'Marcianitos', label: 'Los marcianitos', emoji: '🛸', prompt: 'Dibuja a los marcianitos verdes de tres ojos. «¡La garra!»' },
      { short: 'Jessie', label: 'Jessie', emoji: '👢', prompt: 'Dibuja a Jessie, la vaquera de trenza roja.' },
      { short: 'Hamm', label: 'Hamm', emoji: '🐷', prompt: 'Dibuja a Hamm, el cochinito alcancía.' },
    ],
  },
  {
    group: 'Abi',
    items: [
      { short: 'Abi', label: 'Abi', emoji: '🎂', prompt: 'Dibuja a Abi, la cumpleañera. ¡Que salga guapísima!' },
      { short: 'Abi parisina', label: 'Abi en París', emoji: '💋', prompt: 'Dibuja a Abi de parisina: boina, labios rojos y un café en la mano.' },
    ],
  },
  {
    group: 'Charlie',
    items: [
      { short: 'Charlie', label: 'Charlie', emoji: '✏️', prompt: 'Dibuja a Charlie.' },
    ],
  },
];

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Reparte los grupos en orden alterno (Francia, Snoopy, Amélie, Abi, …). */
function interleave(groups: Group[]): Theme[] {
  const out: Theme[] = [];
  const longest = Math.max(...groups.map((g) => g.items.length));
  for (let i = 0; i < longest; i++) {
    for (const g of groups) {
      const item = g.items[i];
      if (item) out.push({ ...item, group: g.group, id: slug(`${g.group}-${item.short}`) });
    }
  }
  return out;
}

export const THEMES: Theme[] = interleave(GROUPS);
export const THEME_IDS = new Set(THEMES.map((t) => t.id));
