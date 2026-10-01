// Random leaderboard nicknames themed on the board: board games, drones, football, cooking, music.
// Pure: pass your own `random` to make it deterministic. Every result is NICK_MAX characters or fewer.
import { NICK_MAX } from './rules';
import type { Lang } from '../types';

const EN_ADJ = [
  'Turbo', 'Sneaky', 'Lucky', 'Crispy', 'Spicy', 'Funky', 'Mighty', 'Hover', 'Golden', 'Rapid',
  'Sizzling', 'Groovy', 'Jazzy', 'Tactical', 'Cosmic', 'Zesty', 'Nimble', 'Bold', 'Loud', 'Sly',
];
const EN_NOUN = [
  'Meeple', 'Dice', 'Rook', 'Pawn', 'Drone', 'Rotor', 'Striker', 'Keeper', 'Volley', 'Taco',
  'Salsa', 'Skillet', 'Whisk', 'Churro', 'Drummer', 'Bassline', 'Riff', 'Encore', 'Tempo', 'Pretzel',
];

// Spanish puts the adjective after the noun and makes it agree: [masculine, feminine].
const ES_NOUN: [string, 'm' | 'f'][] = [
  ['Meeple', 'm'], ['Dado', 'm'], ['Peón', 'm'], ['Torre', 'f'], ['Dron', 'm'], ['Hélice', 'f'],
  ['Delantero', 'm'], ['Portera', 'f'], ['Chilena', 'f'], ['Taco', 'm'], ['Salsa', 'f'], ['Sartén', 'f'],
  ['Churro', 'm'], ['Tamal', 'm'], ['Batería', 'f'], ['Bajista', 'm'], ['Guitarra', 'f'], ['Trompeta', 'f'],
  ['Molcajete', 'm'], ['Comal', 'm'],
];
const ES_ADJ: [string, string][] = [
  ['Turbo', 'Turbo'], ['Veloz', 'Veloz'], ['Picoso', 'Picosa'], ['Crujiente', 'Crujiente'],
  ['Dorado', 'Dorada'], ['Astuto', 'Astuta'], ['Suertudo', 'Suertuda'], ['Bravo', 'Brava'],
  ['Cósmico', 'Cósmica'], ['Ruidoso', 'Ruidosa'], ['Sabroso', 'Sabrosa'], ['Volador', 'Voladora'],
  ['Funky', 'Funky'], ['Valiente', 'Valiente'], ['Ninja', 'Ninja'], ['Rítmico', 'Rítmica'],
  ['Feroz', 'Feroz'], ['Chido', 'Chida'], ['Épico', 'Épica'], ['Ligero', 'Ligera'],
];

const pick = <T,>(xs: readonly T[], random: () => number) => xs[Math.floor(random() * xs.length) % xs.length];

function once(lang: Lang, random: () => number): string {
  if (lang === 'es') {
    const [noun, g] = pick(ES_NOUN, random);
    const [m, f] = pick(ES_ADJ, random);
    return `${noun} ${g === 'm' ? m : f}`;
  }
  return `${pick(EN_ADJ, random)} ${pick(EN_NOUN, random)}`;
}

/** A playful nickname in the visitor's language, different from `avoid` when possible. */
export function randomNickname(lang: Lang, random: () => number = Math.random, avoid?: string): string {
  for (let i = 0; i < 20; i++) {
    const n = once(lang, random);
    if (n.length <= NICK_MAX && n !== avoid) return n;
  }
  return lang === 'es' ? 'Meeple Veloz' : 'Turbo Meeple';
}
