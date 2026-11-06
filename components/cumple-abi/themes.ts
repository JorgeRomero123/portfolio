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
};

type Group = { group: string; items: Omit<Theme, 'group'>[] };

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
      { short: 'Fotomatón', label: 'El fotomatón', emoji: '📸', prompt: 'Dibuja una tira de fotos de fotomatón con cuatro caras distintas.' },
      { short: 'Flequillo', label: 'Amélie y su flequillo', emoji: '💇‍♀️', prompt: 'Dibuja a Amélie con su flequillo y su sonrisa traviesa.' },
      { short: 'Sacré-Cœur', label: 'El Sacré-Cœur', emoji: '⛪', prompt: 'Dibuja el Sacré-Cœur en lo alto de Montmartre.' },
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

/** Reparte los grupos en orden alterno (Francia, Snoopy, Amélie, Abi, …). */
function interleave(groups: Group[]): Theme[] {
  const out: Theme[] = [];
  const longest = Math.max(...groups.map((g) => g.items.length));
  for (let i = 0; i < longest; i++) {
    for (const g of groups) {
      const item = g.items[i];
      if (item) out.push({ ...item, group: g.group });
    }
  }
  return out;
}

export const THEMES: Theme[] = interleave(GROUPS);
