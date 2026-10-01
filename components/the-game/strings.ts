// UI chrome strings for /the-game (HUD, overlays, aria labels). Spanish is Mexican Spanish (tú).
// Section titles live in content/the-game.json; SHORT_LABELS are the compact board labels for narrow screens.
import type { HatId, Lang, SectionId } from './types';

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
  pickStepsTitle: string;
  pickStepsHint: string;
  steps: (n: number) => string;
  // landmark prompt
  landedOn: (section: string) => string;
  passing: (section: string) => string;
  play: string;
  justLook: string;
  keepGoing: string;
  passport: string;
  passportAria: (n: number, total: number) => string;
  // race against Jorge's pawn
  raceChip: (steps: number, lap: number) => string;
  raceChipWon: string;
  raceChipLost: string;
  raceAria: string;
  rivalBack: (n: number) => string;
  rivalAhead: (n: number) => string;
  raceTitle: string;
  raceRules: string[];
  raceStanding: (steps: number, lap: number, stamps: number, total: number) => string;
  raceWonTitle: string;
  raceWonBody: (left: number) => string;
  raceLostTitle: string;
  raceLostBody: string;
  raceAgain: string;
  raceAgainNote: string;
  raceGotIt: string;
  raceKeepExploring: string;
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
    close: 'Close',
    cancel: 'Cancel',
    dartTitle: 'Throw a dart',
    dartInstructions: 'Hold to steady your aim, let go to throw.',
    dartKeyboard: 'Keyboard: hold Space, release to throw.',
    dartSteady: 'Steady dart: your hand barely shakes.',
    dartRings: { outer: '1–2', middle: '3–4', inner: '5–6', bull: 'A sure 6' },
    dartMiss: 'Missed the board! You still move 1 space.',
    dartSteps: (n) => `${n} ${n === 1 ? 'space' : 'spaces'}!`,
    dartBull: 'Bullseye! 6 spaces.',
    dartTarget: 'Dartboard. Hold the pointer or Space to steady the aim.',
    pickStepsTitle: 'Free move',
    pickStepsHint: 'Choose exactly how many spaces to move.',
    steps: (n) => `${n} ${n === 1 ? 'space' : 'spaces'}`,
    landedOn: (s) => `You landed on ${s}.`,
    passing: (s) => `You're passing ${s}.`,
    play: 'Play',
    justLook: 'Just look',
    keepGoing: 'Keep going',
    passport: 'Passport',
    passportAria: (n, t) => `Passport: ${n} of ${t} stamps`,
    raceChip: (n, lap) => `Jorge ${n}/${lap}`,
    raceChipWon: 'You beat Jorge',
    raceChipLost: 'Jorge won the race',
    raceAria: 'The race against Jorge: standings and rules',
    rivalBack: (n) => `Jorge steps back ${n}…`,
    rivalAhead: (n) => `Jorge advances ${n}`,
    raceTitle: 'Race Jorge around the board',
    raceRules: [
      'Jorge’s pawn, the dark one with the flag, is doing one lap of the board.',
      'He advances 3 spaces at the end of every turn you take. Win a mini-game for a stamp and he steps back 1. Lose it, or skip it, and he jumps 6 ahead; you can try again right away.',
      'Collect all 11 stamps before he finishes his lap. Fewer turns means fewer steps for him, and a well-thrown dart goes further than the dice.',
    ],
    raceStanding: (n, lap, st, t) => `Jorge: ${Math.max(0, n)} of ${lap} spaces · You: ${st} of ${t} stamps`,
    raceWonTitle: 'You beat Jorge!',
    raceWonBody: (left) => `All 11 stamps, and he was still ${left} ${left === 1 ? 'space' : 'spaces'} from the finish.`,
    raceLostTitle: 'Jorge finished his lap first',
    raceLostBody: 'The board is still yours to explore, stamps and all. Or race him again from the start.',
    raceAgain: 'Race again',
    raceAgainNote: 'Racing again clears your stamps. Hats and prizes stay.',
    raceGotIt: 'Got it',
    raceKeepExploring: 'Keep exploring',
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
    close: 'Cerrar',
    cancel: 'Cancelar',
    dartTitle: 'Lanza un dardo',
    dartInstructions: 'Mantén presionado para afinar la puntería y suelta para lanzar.',
    dartKeyboard: 'Con teclado: mantén Espacio y suéltalo para lanzar.',
    dartSteady: 'Dardo firme: casi no te tiembla la mano.',
    dartRings: { outer: '1–2', middle: '3–4', inner: '5–6', bull: 'Un 6 seguro' },
    dartMiss: '¡Fallaste el tablero! Igual avanzas 1 casilla.',
    dartSteps: (n) => `¡${n} ${n === 1 ? 'casilla' : 'casillas'}!`,
    dartBull: '¡Diana! 6 casillas.',
    dartTarget: 'Tablero de dardos. Mantén presionado o usa Espacio para afinar la puntería.',
    pickStepsTitle: 'Movimiento libre',
    pickStepsHint: 'Elige exactamente cuántas casillas avanzar.',
    steps: (n) => `${n} ${n === 1 ? 'casilla' : 'casillas'}`,
    landedOn: (s) => `Caíste en ${s}.`,
    passing: (s) => `Vas pasando por ${s}.`,
    play: 'Jugar',
    justLook: 'Solo ver',
    keepGoing: 'Seguir',
    passport: 'Pasaporte',
    passportAria: (n, t) => `Pasaporte: ${n} de ${t} sellos`,
    raceChip: (n, lap) => `Jorge ${n}/${lap}`,
    raceChipWon: 'Le ganaste a Jorge',
    raceChipLost: 'Jorge ganó la carrera',
    raceAria: 'La carrera contra Jorge: cómo va y cómo se juega',
    rivalBack: (n) => `Jorge retrocede ${n}…`,
    rivalAhead: (n) => `Jorge avanza ${n}`,
    raceTitle: 'Carrera contra Jorge',
    raceRules: [
      'La ficha de Jorge, la oscura con la bandera, le está dando una vuelta al tablero.',
      'Avanza 3 casillas al final de cada turno que tomas. Si ganas un minijuego por un sello, retrocede 1. Si lo pierdes o te lo saltas, se adelanta 6; puedes intentarlo otra vez ahí mismo.',
      'Junta los 11 sellos antes de que termine su vuelta. Entre menos turnos uses, menos avanza él, y un dardo bien lanzado llega más lejos que el dado.',
    ],
    raceStanding: (n, lap, st, t) => `Jorge: ${Math.max(0, n)} de ${lap} casillas · Tú: ${st} de ${t} sellos`,
    raceWonTitle: '¡Le ganaste a Jorge!',
    raceWonBody: (left) => `Los 11 sellos, y a él todavía le ${left === 1 ? 'faltaba 1 casilla' : `faltaban ${left} casillas`} para llegar.`,
    raceLostTitle: 'Jorge terminó su vuelta primero',
    raceLostBody: 'El tablero sigue siendo tuyo para explorar, con todo y sellos. O échate otra carrera desde el principio.',
    raceAgain: 'Otra carrera',
    raceAgainNote: 'Una carrera nueva borra tus sellos. Los gorros y premios se quedan.',
    raceGotIt: 'Entendido',
    raceKeepExploring: 'Seguir explorando',
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

/** Strings for the landmark flow (prompt, section card, mini-game host, wheel, passport) and the overview. */
export interface FlowStrings {
  // prompt
  playHint: string;
  raceHint: string;
  // section card
  stampEarned: string;
  stampMissing: string;
  funFact: string;
  storyCard: string;
  readStory: string;
  playAgain: string;
  opensNewTab: string;
  // mini-game host
  miniGame: string;
  skipGame: string;
  loadingGame: string;
  gameError: string;
  youWon: string;
  soClose: string;
  lostBody: string;
  tryAgain: string;
  // stamp
  stampTitle: string;
  stampBody: (section: string) => string;
  spinWheel: string;
  // wheel
  wheelTitle: string;
  wheelHint: string;
  spin: string;
  spinning: string;
  youGot: string;
  slice: Record<'story' | 'fact' | 'dart' | 'move' | 'hat', string>;
  prizeStory: string;
  prizeFact: string;
  prizeDart: string;
  prizeDartBody: string;
  prizeMove: string;
  prizeMoveBody: string;
  prizeHat: (hat: string) => string;
  prizeHatBody: string;
  wearIt: string;
  wearing: string;
  takeOff: string;
  continue: string;
  // passport
  passportTitle: string;
  passportIntro: (n: number, total: number) => string;
  stampsHeading: string;
  notYet: string;
  hatsHeading: string;
  noHats: string;
  storiesHeading: string;
  noStories: string;
  reset: string;
  resetConfirm: string;
  resetYes: string;
  resetDone: string;
  // final reward
  finalKicker: string;
  finalTitle: string;
  finalBody: string;
  emailJorge: string;
  // overview
  overviewSections: string;
  overviewSectionsIntro: string;
  ratherPlay: string;
  backToGame: string;
  hats: Record<HatId, string>;
}

export const FLOW_STRINGS: Record<Lang, FlowStrings> = {
  en: {
    playHint: 'Win the mini-game to earn this stamp.',
    raceHint: 'You need all 11 stamps before Jorge finishes his lap. Win: he steps back 1. Lose or skip: he jumps 6.',
    stampEarned: 'Stamp collected',
    stampMissing: 'Win the mini-game to earn this stamp',
    funFact: 'Fun fact',
    storyCard: 'Story card',
    readStory: 'Read the story',
    playAgain: 'Play again',
    opensNewTab: '(opens in a new tab)',
    miniGame: 'Mini-game',
    skipGame: 'Skip mini-game',
    loadingGame: 'Loading the mini-game…',
    gameError: 'This mini-game couldn’t load. Skip it to see the landmark.',
    youWon: 'You won!',
    soClose: 'So close!',
    lostBody: 'Give it another go, or just have a look around this landmark.',
    tryAgain: 'Try again',
    stampTitle: 'Stamp earned!',
    stampBody: (s) => `${s} is now in your passport.`,
    spinWheel: 'Spin the prize wheel',
    wheelTitle: 'Prize wheel',
    wheelHint: 'Every slice is a prize. Spin it!',
    spin: 'Spin',
    spinning: 'Spinning…',
    youGot: 'You got',
    slice: { story: 'Story', fact: 'Fun fact', dart: 'Dart', move: 'Move', hat: 'Hat' },
    prizeStory: 'A story card',
    prizeFact: 'A fun fact',
    prizeDart: 'A steady dart',
    prizeDartBody: 'Your hand barely shakes on the next throw. Find it next to the dice.',
    prizeMove: 'A free move',
    prizeMoveBody: 'Pick exactly how many spaces to move, 1 to 6. Find it next to the dice.',
    prizeHat: (h) => `A new hat: ${h}`,
    prizeHatBody: 'Your pawn can wear it on the board.',
    wearIt: 'Wear it',
    wearing: 'Wearing',
    takeOff: 'Take it off',
    continue: 'Continue',
    passportTitle: 'Your passport',
    passportIntro: (n, t) => `${n} of ${t} stamps. Win a landmark’s mini-game to earn its stamp.`,
    stampsHeading: 'Stamps',
    notYet: 'Not yet',
    hatsHeading: 'Hats',
    noHats: 'No hats yet. Win them on the prize wheel.',
    storiesHeading: 'Story cards',
    noStories: 'No story cards yet. Win them on the prize wheel.',
    reset: 'Reset progress',
    resetConfirm: 'Erase every stamp, hat and prize?',
    resetYes: 'Yes, reset',
    resetDone: 'Progress reset.',
    finalKicker: 'All 11 stamps!',
    finalTitle: 'You toured all of Jorge. Now say hi.',
    finalBody: 'You’ve seen the whole board. If any of it made you think of a project or a role, Jorge would love to hear from you.',
    emailJorge: 'Email Jorge',
    overviewSections: 'Eleven landmarks',
    overviewSectionsIntro: 'Every stop on the board, in one scroll.',
    ratherPlay: 'Rather play?',
    backToGame: 'Back to the board',
    hats: {
      propeller: 'Propeller cap',
      chef: 'Chef’s hat',
      scarf: 'Navy and white scarf',
      headphones: 'Headphones',
      beanie: 'Beanie',
      beret: 'Beret',
    },
  },
  es: {
    playHint: 'Gana el minijuego para conseguir este sello.',
    raceHint: 'Necesitas los 11 sellos antes de que Jorge termine su vuelta. Si ganas, retrocede 1. Si pierdes o te lo saltas, se adelanta 6.',
    stampEarned: 'Sello conseguido',
    stampMissing: 'Gana el minijuego para conseguir este sello',
    funFact: 'Dato curioso',
    storyCard: 'Tarjeta de historia',
    readStory: 'Leer la historia',
    playAgain: 'Jugar otra vez',
    opensNewTab: '(se abre en otra pestaña)',
    miniGame: 'Minijuego',
    skipGame: 'Saltar minijuego',
    loadingGame: 'Cargando el minijuego…',
    gameError: 'Este minijuego no pudo cargar. Sáltalo para ver el lugar.',
    youWon: '¡Ganaste!',
    soClose: '¡Casi!',
    lostBody: 'Inténtalo otra vez o nada más échale un ojo a este lugar.',
    tryAgain: 'Intentar otra vez',
    stampTitle: '¡Sello conseguido!',
    stampBody: (s) => `${s} ya está en tu pasaporte.`,
    spinWheel: 'Girar la ruleta de premios',
    wheelTitle: 'Ruleta de premios',
    wheelHint: 'Cada rebanada es un premio. ¡Gírala!',
    spin: 'Girar',
    spinning: 'Girando…',
    youGot: 'Te tocó',
    slice: { story: 'Historia', fact: 'Dato', dart: 'Dardo', move: 'Mover', hat: 'Gorro' },
    prizeStory: 'Una tarjeta de historia',
    prizeFact: 'Un dato curioso',
    prizeDart: 'Un dardo firme',
    prizeDartBody: 'En tu próximo tiro casi no te va a temblar la mano. Lo encuentras junto al dado.',
    prizeMove: 'Un movimiento libre',
    prizeMoveBody: 'Elige exactamente cuántas casillas avanzar, de 1 a 6. Lo encuentras junto al dado.',
    prizeHat: (h) => `Un gorro nuevo: ${h}`,
    prizeHatBody: 'Tu ficha lo puede usar en el tablero.',
    wearIt: 'Ponérselo',
    wearing: 'Lo trae puesto',
    takeOff: 'Quitárselo',
    continue: 'Continuar',
    passportTitle: 'Tu pasaporte',
    passportIntro: (n, t) => `${n} de ${t} sellos. Gana el minijuego de cada lugar para conseguir su sello.`,
    stampsHeading: 'Sellos',
    notYet: 'Todavía no',
    hatsHeading: 'Gorros',
    noHats: 'Todavía no tienes gorros. Gánalos en la ruleta de premios.',
    storiesHeading: 'Tarjetas de historia',
    noStories: 'Todavía no tienes tarjetas de historia. Gánalas en la ruleta de premios.',
    reset: 'Reiniciar progreso',
    resetConfirm: '¿Borrar todos los sellos, gorros y premios?',
    resetYes: 'Sí, reiniciar',
    resetDone: 'Progreso reiniciado.',
    finalKicker: '¡Los 11 sellos!',
    finalTitle: 'Recorriste todo el mundo de Jorge. Ahora salúdalo.',
    finalBody: 'Ya viste todo el tablero. Si algo te hizo pensar en un proyecto o en una vacante, a Jorge le encantaría saber de ti.',
    emailJorge: 'Escribirle a Jorge',
    overviewSections: 'Once lugares',
    overviewSectionsIntro: 'Cada parada del tablero, en un solo scroll.',
    ratherPlay: '¿Mejor quieres jugar?',
    backToGame: 'Volver al tablero',
    hats: {
      propeller: 'Gorra con hélice',
      chef: 'Gorro de chef',
      scarf: 'Bufanda azul marino y blanco',
      headphones: 'Audífonos',
      beanie: 'Gorro tejido',
      beret: 'Boina',
    },
  },
};
