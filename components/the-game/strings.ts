// UI chrome strings for /the-game (HUD, overlays, aria labels). Spanish is Mexican Spanish (tú).
// Section titles live in content/the-game.json; SHORT_LABELS are the compact board labels for narrow screens.
import type { Lang, SectionId } from './types';

export interface UiStrings {
  title: string;
  stageLabel: string;
  boardAria: string;
  loading: string;
  skip: string;
  roll: string;
  throwDart: string;
  freeMove: (n: number) => string;
  steadyDart: (n: number) => string;
  viewBoard: string;
  followPawn: string;
  langButton: string;
  langAria: string;
  soundOnAria: string;
  soundOffAria: string;
  shortcuts: string;
  start: string;
  hint: string;
  rolling: string;
  rolled: (n: number) => string;
  moving: (n: number) => string;
  pawnOn: (section: string) => string;
  jumpingTo: (section: string) => string;
  close: string;
  cancel: string;
  // dart overlay
  dartTitle: string;
  dartInstructions: string;
  dartKeyboard: string;
  dartSteady: string;
  dartRings: { outer: string; middle: string; inner: string; bull: string };
  dartMiss: string;
  dartSteps: (n: number) => string;
  dartBull: string;
  dartTarget: string;
  // pickers
  pickSectionTitle: string;
  pickSectionHint: string;
  pickStepsTitle: string;
  pickStepsHint: string;
  steps: (n: number) => string;
  // landmark prompt (temporary)
  landedOn: (section: string) => string;
  passing: (section: string) => string;
  play: string;
  justLook: string;
  keepGoing: string;
}

export const STRINGS: Record<Lang, UiStrings> = {
  en: {
    title: 'The Game',
    stageLabel: 'The Game: a playable board tour of Jorge',
    boardAria: '3D game board. Use the buttons below to play.',
    loading: 'Setting up the board…',
    skip: 'Skip the game',
    roll: 'Roll the dice',
    throwDart: 'Throw a dart',
    freeMove: (n) => `Free move · ${n}`,
    steadyDart: (n) => `Steady dart · ${n}`,
    viewBoard: 'View whole board',
    followPawn: 'Follow pawn',
    langButton: 'ES',
    langAria: 'Cambiar a español',
    soundOnAria: 'Sound is on. Turn sound off',
    soundOffAria: 'Sound is off. Turn sound on',
    shortcuts: 'R roll · D dart · V view',
    start: 'Start',
    hint: 'Roll the dice or throw a dart to explore.',
    rolling: 'Rolling…',
    rolled: (n) => `You rolled a ${n}!`,
    moving: (n) => `Moving ${n} ${n === 1 ? 'space' : 'spaces'}`,
    pawnOn: (s) => `You're on ${s}.`,
    jumpingTo: (s) => `Jumping to ${s}!`,
    close: 'Close',
    cancel: 'Cancel',
    dartTitle: 'Throw a dart',
    dartInstructions: 'Hold to steady your aim, let go to throw.',
    dartKeyboard: 'Keyboard: hold Space, release to throw.',
    dartSteady: 'Steady dart: your hand barely shakes.',
    dartRings: { outer: '1–2', middle: '3–4', inner: '5–6', bull: 'Any section' },
    dartMiss: 'Missed the board! You still move 1 space.',
    dartSteps: (n) => `${n} ${n === 1 ? 'space' : 'spaces'}!`,
    dartBull: 'Bullseye! Pick any section.',
    dartTarget: 'Dartboard. Hold the pointer or Space to steady the aim.',
    pickSectionTitle: 'Bullseye! Where to?',
    pickSectionHint: 'Your pawn jumps straight to that landmark.',
    pickStepsTitle: 'Free move',
    pickStepsHint: 'Choose exactly how many spaces to move.',
    steps: (n) => `${n} ${n === 1 ? 'space' : 'spaces'}`,
    landedOn: (s) => `You landed on ${s}.`,
    passing: (s) => `You're passing ${s}.`,
    play: 'Play',
    justLook: 'Just look',
    keepGoing: 'Keep going',
  },
  es: {
    title: 'El Juego',
    stageLabel: 'El Juego: un recorrido jugable por el mundo de Jorge',
    boardAria: 'Tablero de juego en 3D. Usa los botones de abajo para jugar.',
    loading: 'Armando el tablero…',
    skip: 'Saltar el juego',
    roll: '¡Tira el dado!',
    throwDart: 'Lanza un dardo',
    freeMove: (n) => `Movimiento libre · ${n}`,
    steadyDart: (n) => `Dardo firme · ${n}`,
    viewBoard: 'Ver todo el tablero',
    followPawn: 'Seguir mi ficha',
    langButton: 'EN',
    langAria: 'Switch to English',
    soundOnAria: 'El sonido está activado. Desactivar sonido',
    soundOffAria: 'El sonido está desactivado. Activar sonido',
    shortcuts: 'R dado · D dardo · V vista',
    start: 'Salida',
    hint: 'Tira el dado o lanza un dardo para explorar.',
    rolling: 'Tirando…',
    rolled: (n) => `¡Sacaste ${n}!`,
    moving: (n) => `Avanzas ${n} ${n === 1 ? 'casilla' : 'casillas'}`,
    pawnOn: (s) => `Estás en ${s}.`,
    jumpingTo: (s) => `¡Saltas a ${s}!`,
    close: 'Cerrar',
    cancel: 'Cancelar',
    dartTitle: 'Lanza un dardo',
    dartInstructions: 'Mantén presionado para afinar la puntería y suelta para lanzar.',
    dartKeyboard: 'Con teclado: mantén Espacio y suéltalo para lanzar.',
    dartSteady: 'Dardo firme: casi no te tiembla la mano.',
    dartRings: { outer: '1–2', middle: '3–4', inner: '5–6', bull: 'Cualquier sección' },
    dartMiss: '¡Fallaste el tablero! Igual avanzas 1 casilla.',
    dartSteps: (n) => `¡${n} ${n === 1 ? 'casilla' : 'casillas'}!`,
    dartBull: '¡Diana! Elige cualquier sección.',
    dartTarget: 'Tablero de dardos. Mantén presionado o usa Espacio para afinar la puntería.',
    pickSectionTitle: '¡Diana! ¿A dónde vas?',
    pickSectionHint: 'Tu ficha salta directo a ese lugar.',
    pickStepsTitle: 'Movimiento libre',
    pickStepsHint: 'Elige exactamente cuántas casillas avanzar.',
    steps: (n) => `${n} ${n === 1 ? 'casilla' : 'casillas'}`,
    landedOn: (s) => `Caíste en ${s}.`,
    passing: (s) => `Vas pasando por ${s}.`,
    play: 'Jugar',
    justLook: 'Solo ver',
    keepGoing: 'Seguir',
  },
};

/** Compact board labels for narrow screens. */
export const SHORT_LABELS: Record<SectionId, Record<Lang, string>> = {
  software: { en: 'Software', es: 'Software' },
  drone: { en: 'Drone', es: 'Dron' },
  spurs: { en: 'Spurs', es: 'Spurs' },
  pano360: { en: '360°', es: '360°' },
  boardgames: { en: 'Games', es: 'Juegos' },
  music: { en: 'Music', es: 'Música' },
  beer: { en: 'Beer', es: 'Cerveza' },
  artoverlay: { en: 'artoverlay', es: 'artoverlay' },
  myalbumlink: { en: 'myalbumlink', es: 'myalbumlink' },
  emarts: { en: 'e.marts', es: 'e.marts' },
  kitchen: { en: 'Kitchen', es: 'Cocina' },
};
