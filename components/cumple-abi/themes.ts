// Temáticas de la ruleta. Para agregar una, añade un objeto a la lista:
// la ruleta se reparte sola en tantas rebanadas como haya.
export type Theme = {
  /** Nombre de la temática (sale en la tarjeta del resultado). */
  label: string;
  /** Versión corta para la rebanada si `label` es largo (máx. ~10 letras). */
  short?: string;
  emoji: string;
  /** La instrucción que ve el invitado cuando le toca. */
  prompt: string;
};

export const THEMES: Theme[] = [
  {
    label: 'Francia',
    emoji: '🥐',
    prompt: 'Dibuja algo de Francia: la Torre Eiffel, un croissant, una boina, una baguette… ¡tú eliges!',
  },
  {
    label: 'Snoopy',
    emoji: '🐶',
    prompt: 'Dibuja a Snoopy. Puntos extra si va arriba de su casita.',
  },
  {
    label: 'Amélie',
    emoji: '🍓',
    prompt: 'Dibuja algo de Amélie: el gnomo viajero, una crème brûlée, Montmartre…',
  },
  {
    label: 'Dibuja a Abi',
    short: 'Abi',
    emoji: '🎂',
    prompt: 'Dibuja a Abi, la cumpleañera. ¡Que salga guapísima!',
  },
  {
    label: 'Dibuja a Charlie',
    short: 'Charlie',
    emoji: '✏️',
    prompt: 'Dibuja a Charlie.',
  },
];
