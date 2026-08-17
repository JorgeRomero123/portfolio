import type { PathStage } from '../shared-audio/levels'
import type { RhythmSpec } from '../shared-audio/RhythmExercise'

/**
 * Currículo de canto. Los ejercicios de voz no guardan notas absolutas sino
 * intervalos desde la tónica del usuario: la misma lección sirve para una voz
 * grave y para una aguda. Ver voice.ts.
 */

export type Exercise =
  | QuizExercise
  | EarExercise
  | RangeExercise
  | MatchPitchExercise
  | SustainExercise
  | SequenceExercise
  | RhythmExercise

export interface QuizExercise {
  kind: 'quiz'
  prompt: string
  options: string[]
  answer: number
  explain: string
}

export interface EarExercise {
  kind: 'ear'
  prompt: string
  /** Notas a reproducir, en semitonos desde la tónica. Suenan en secuencia. */
  offsets: number[]
  options: string[]
  answer: number
  explain: string
}

/** Calibración: mide hasta dónde llegas por abajo y por arriba. */
export interface RangeExercise {
  kind: 'range'
}

/** Suena una nota y hay que cantarla. */
export interface MatchPitchExercise {
  kind: 'matchPitch'
  prompt: string
  offset: number
}

/** Mantener una nota estable, que es lo que de verdad cuesta. */
export interface SustainExercise {
  kind: 'sustain'
  prompt: string
  offset: number
  seconds: number
}

/** Cantar varias notas seguidas; se confirman una a una. */
export interface SequenceExercise {
  kind: 'sequence'
  prompt: string
  offsets: number[]
}

export interface RhythmExercise extends RhythmSpec {
  kind: 'rhythm'
}

export type LevelKind = 'teoria' | 'voz' | 'oido' | 'aliento' | 'ritmo'

export interface Level {
  id: string
  title: string
  kind: LevelKind
  exercises: Exercise[]
}

export interface Stage extends PathStage<Level> {
  text: string
}

export const STAGES: Stage[] = [
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'tu-voz',
    name: 'Tu voz',
    subtitle: 'Antes de cantar, saber con qué cantas',
    accent: 'from-rose-500 to-pink-600',
    ring: 'ring-rose-200',
    text: 'text-rose-600',
    levels: [
      {
        id: 'como-suena',
        title: 'De dónde sale la voz',
        kind: 'teoria',
        exercises: [
          {
            kind: 'quiz',
            prompt: '¿Qué hace vibrar tus cuerdas vocales?',
            options: ['El aire que expulsas', 'El movimiento de la lengua', 'La tensión del cuello'],
            answer: 0,
            explain:
              'El aire al salir las hace vibrar. Por eso el control del aire es el 90% del canto y la garganta debería trabajar poco.',
          },
          {
            kind: 'quiz',
            prompt: 'Si te duele la garganta al cantar, normalmente significa que…',
            options: [
              'Estás progresando, es normal',
              'Estás forzando y deberías parar',
              'Necesitas cantar más agudo',
            ],
            answer: 1,
            explain:
              'Cantar no debe doler nunca. El dolor es la señal de que estás apretando con la garganta en vez de sostener con el aire.',
          },
          {
            kind: 'quiz',
            prompt: '¿Qué es "afinar" al cantar?',
            options: [
              'Cantar fuerte y claro',
              'Producir exactamente la altura de la nota buscada',
              'Cantar sin respirar',
            ],
            answer: 1,
            explain:
              'Afinar es dar en la frecuencia correcta. Ni más alto ni más bajo: exactamente esa. Se entrena, no se nace con ello.',
          },
        ],
      },
      {
        id: 'rango',
        title: 'Encuentra tu rango',
        kind: 'voz',
        exercises: [{ kind: 'range' }],
      },
      {
        id: 'respiracion',
        title: 'Respirar de verdad',
        kind: 'teoria',
        exercises: [
          {
            kind: 'quiz',
            prompt: 'Al tomar aire para cantar, ¿qué debería moverse?',
            options: ['Los hombros, subiendo', 'La barriga, hacia afuera', 'El pecho, inflándose'],
            answer: 1,
            explain:
              'La barriga. Si suben los hombros, estás respirando en la parte alta del pulmón y te quedarás sin aire a la mitad de la frase.',
          },
          {
            kind: 'quiz',
            prompt: 'Truco para comprobarlo:',
            options: [
              'Una mano en la barriga: debe empujarla al inspirar',
              'Contener la respiración diez segundos',
              'Respirar por la boca lo más rápido posible',
            ],
            answer: 0,
            explain:
              'Una mano en la barriga y otra en el pecho. Al inspirar solo debería moverse la de abajo. Tumbado boca arriba sale solo.',
          },
        ],
      },
      {
        id: 'primera-nota',
        title: 'Canta tu primera nota',
        kind: 'voz',
        exercises: [
          { kind: 'matchPitch', prompt: 'Escucha la nota y cántala con "aaa".', offset: 0 },
          { kind: 'matchPitch', prompt: 'Otra vez, un poco más arriba.', offset: 2 },
        ],
      },
      {
        id: 'agudo-grave',
        title: 'Agudo o grave',
        kind: 'oido',
        exercises: [
          {
            kind: 'ear',
            prompt: 'Suenan dos notas. ¿La segunda es más aguda o más grave?',
            offsets: [0, 7],
            options: ['Más aguda', 'Más grave'],
            answer: 0,
            explain: 'Subió una quinta. Distinguir la dirección es lo primero que necesita el oído.',
          },
          {
            kind: 'ear',
            prompt: '¿Y ahora?',
            offsets: [7, 0],
            options: ['Más aguda', 'Más grave'],
            answer: 1,
            explain: 'Bajó. Misma distancia, dirección contraria.',
          },
          {
            kind: 'ear',
            prompt: 'Esta es más difícil: la diferencia es pequeña.',
            offsets: [0, 1],
            options: ['Más aguda', 'Más grave'],
            answer: 0,
            explain:
              'Subió un semitono, la distancia más pequeña que existe. Si la oíste, tu oído va bien.',
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'afinacion',
    name: 'Afinar la voz',
    subtitle: 'Dar en la nota, y quedarse ahí',
    accent: 'from-violet-500 to-purple-600',
    ring: 'ring-violet-200',
    text: 'text-violet-600',
    levels: [
      {
        id: 'match-1',
        title: 'Da en la nota',
        kind: 'voz',
        exercises: [
          { kind: 'matchPitch', prompt: 'Cántala con "aaa".', offset: 0 },
          { kind: 'matchPitch', prompt: 'Esta sube una tercera.', offset: 4 },
          { kind: 'matchPitch', prompt: 'Y esta una quinta.', offset: 7 },
        ],
      },
      {
        id: 'sostener-teoria',
        title: 'Por qué se tambalea la nota',
        kind: 'teoria',
        exercises: [
          {
            kind: 'quiz',
            prompt: 'Al sostener una nota larga, la afinación suele caer. ¿Por qué?',
            options: [
              'Porque se acaba el aire y baja la presión',
              'Porque las cuerdas vocales se cansan de inmediato',
              'Porque el oído se acostumbra',
            ],
            answer: 0,
            explain:
              'Al final de la frase queda menos aire, baja la presión y la nota se desploma. Se arregla dosificando, no empujando más fuerte.',
          },
          {
            kind: 'quiz',
            prompt: 'Entonces, ¿cómo se sostiene una nota larga?',
            options: [
              'Soltando todo el aire al principio',
              'Dosificando un flujo constante',
              'Aguantando la respiración',
            ],
            answer: 1,
            explain: 'Flujo constante. Piensa en un globo que se desinfla despacio, no de golpe.',
          },
        ],
      },
      {
        id: 'sostener',
        title: 'Sostén la nota',
        kind: 'aliento',
        exercises: [
          { kind: 'sustain', prompt: 'Mantén la nota estable.', offset: 0, seconds: 4 },
        ],
      },
      {
        id: 'sostener-largo',
        title: 'Sostén más tiempo',
        kind: 'aliento',
        exercises: [
          { kind: 'sustain', prompt: 'Ahora seis segundos sin que se caiga.', offset: 2, seconds: 6 },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'intervalos',
    name: 'Intervalos',
    subtitle: 'Moverse de una nota a otra a propósito',
    accent: 'from-sky-500 to-blue-600',
    ring: 'ring-blue-200',
    text: 'text-blue-600',
    levels: [
      {
        id: 'intervalo-teoria',
        title: 'Qué es un intervalo',
        kind: 'teoria',
        exercises: [
          {
            kind: 'quiz',
            prompt: '¿Qué es un intervalo?',
            options: [
              'La distancia entre dos notas',
              'El silencio entre dos frases',
              'La duración de una nota',
            ],
            answer: 0,
            explain:
              'La distancia entre dos alturas. Reconocerlos de oído es lo que te permite cantar una melodía sin haberla ensayado.',
          },
          {
            kind: 'quiz',
            prompt: 'Una octava es…',
            options: [
              'La misma nota, más aguda o más grave',
              'Ocho notas distintas seguidas',
              'Un acorde de ocho sonidos',
            ],
            answer: 0,
            explain:
              'La misma nota al doble de frecuencia. Suena tan parecida que le damos el mismo nombre.',
          },
        ],
      },
      {
        id: 'segunda-tercera',
        title: 'Sube un escalón',
        kind: 'voz',
        exercises: [
          { kind: 'sequence', prompt: 'Canta las dos notas, una tras otra.', offsets: [0, 2] },
          { kind: 'sequence', prompt: 'Ahora un salto un poco mayor.', offsets: [0, 4] },
        ],
      },
      {
        id: 'reconocer-intervalo',
        title: 'Reconoce el salto',
        kind: 'oido',
        exercises: [
          {
            kind: 'ear',
            prompt: '¿Qué distancia hay entre las dos notas?',
            offsets: [0, 12],
            options: ['Una octava', 'Una tercera', 'Un semitono'],
            answer: 0,
            explain: 'Una octava: la misma nota arriba. Es el intervalo más fácil de reconocer.',
          },
          {
            kind: 'ear',
            prompt: '¿Y esta?',
            offsets: [0, 7],
            options: ['Una octava', 'Una quinta', 'Un semitono'],
            answer: 1,
            explain:
              'Una quinta justa. Es el salto del principio de "Twinkle Twinkle" y suena abierto y estable.',
          },
        ],
      },
      {
        id: 'quinta',
        title: 'Canta la quinta',
        kind: 'voz',
        exercises: [{ kind: 'sequence', prompt: 'Tónica y quinta, sin quedarte a medio camino.', offsets: [0, 7] }],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'escalas',
    name: 'La escala',
    subtitle: 'Do re mi, pero en tu voz',
    accent: 'from-emerald-500 to-teal-600',
    ring: 'ring-emerald-200',
    text: 'text-emerald-600',
    levels: [
      {
        id: 'escala-teoria',
        title: 'La escala mayor',
        kind: 'teoria',
        exercises: [
          {
            kind: 'quiz',
            prompt: 'La escala mayor tiene siete notas. ¿Están todas a la misma distancia?',
            options: [
              'Sí, todas separadas igual',
              'No: entre la 3ª y la 4ª, y entre la 7ª y la 8ª, hay medio paso',
              'No, cada una está a distinta distancia',
            ],
            answer: 1,
            explain:
              'Ese patrón desigual es justo lo que le da su sonido. Si todas estuvieran igual de separadas no sonaría a "do re mi".',
          },
          {
            kind: 'quiz',
            prompt: '¿Por qué la escala termina "pidiendo" volver al do?',
            options: [
              'Porque la séptima está a medio paso del do y tira hacia él',
              'Porque se acaba el aire',
              'Por costumbre cultural, sin más',
            ],
            answer: 0,
            explain:
              'Esa nota se llama sensible precisamente por eso: está pegadita al do y arrastra el oído hasta él.',
          },
        ],
      },
      {
        id: 'escala-sube',
        title: 'Sube la escala',
        kind: 'voz',
        exercises: [
          { kind: 'sequence', prompt: 'Do re mi fa sol, una nota por vez.', offsets: [0, 2, 4, 5, 7] },
        ],
      },
      {
        id: 'escala-baja',
        title: 'Baja la escala',
        kind: 'voz',
        exercises: [
          { kind: 'sequence', prompt: 'Ahora al revés: sol fa mi re do.', offsets: [7, 5, 4, 2, 0] },
        ],
      },
      {
        id: 'mayor-menor',
        title: 'Alegre o triste',
        kind: 'oido',
        exercises: [
          {
            kind: 'ear',
            prompt: 'Escucha las tres notas. ¿Suena mayor o menor?',
            offsets: [0, 4, 7],
            options: ['Mayor, alegre', 'Menor, triste'],
            answer: 0,
            explain: 'Tercera mayor. Ese es el color alegre.',
          },
          {
            kind: 'ear',
            prompt: '¿Y estas?',
            offsets: [0, 3, 7],
            options: ['Mayor, alegre', 'Menor, triste'],
            answer: 1,
            explain:
              'La nota del medio bajó medio tono y todo cambió de ánimo. Ese medio tono es toda la diferencia.',
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'control',
    name: 'Control',
    subtitle: 'Registros, cuidado vocal y aguante',
    accent: 'from-amber-500 to-orange-600',
    ring: 'ring-amber-200',
    text: 'text-amber-600',
    levels: [
      {
        id: 'registros',
        title: 'Voz de pecho y de cabeza',
        kind: 'teoria',
        exercises: [
          {
            kind: 'quiz',
            prompt: 'Al hablar normal, ¿qué registro usas?',
            options: ['Voz de cabeza', 'Voz de pecho', 'Falsete'],
            answer: 1,
            explain:
              'Voz de pecho: la notas vibrar en el esternón si pones la mano ahí. Es tu registro grave y medio.',
          },
          {
            kind: 'quiz',
            prompt: 'Al subir mucho, la voz "se quiebra". ¿Qué está pasando?',
            options: [
              'Estás cambiando de registro sin transición',
              'Se te acabó el aire',
              'Estás cantando demasiado fuerte',
            ],
            answer: 0,
            explain:
              'Es el paso de pecho a cabeza. Con práctica esa costura se suaviza hasta volverse imperceptible.',
          },
          {
            kind: 'quiz',
            prompt: '¿Qué le hace más daño a tu voz?',
            options: [
              'Cantar todos los días un rato',
              'Gritar y carraspear',
              'Cantar notas agudas suaves',
            ],
            answer: 1,
            explain:
              'Gritar y carraspear golpean las cuerdas vocales. Cantar a diario sin forzar, en cambio, las entrena.',
          },
        ],
      },
      {
        id: 'sostener-agudo',
        title: 'Sostén arriba',
        kind: 'aliento',
        exercises: [
          { kind: 'sustain', prompt: 'Una quinta arriba, cinco segundos. Suave, sin empujar.', offset: 7, seconds: 5 },
        ],
      },
      {
        id: 'arpegio',
        title: 'El arpegio',
        kind: 'voz',
        exercises: [
          { kind: 'sequence', prompt: 'Do mi sol mi do, nota por nota.', offsets: [0, 4, 7, 4, 0] },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'musica',
    name: 'Cantar música',
    subtitle: 'Pulso, frase y una melodía entera',
    accent: 'from-cyan-500 to-sky-600',
    ring: 'ring-cyan-200',
    text: 'text-cyan-600',
    levels: [
      {
        id: 'pulso-teoria',
        title: 'El pulso',
        kind: 'teoria',
        exercises: [
          {
            kind: 'quiz',
            prompt: 'En un compás de 4/4, ¿cuántos pulsos hay?',
            options: ['Tres', 'Cuatro', 'Seis'],
            answer: 1,
            explain: 'Cuatro, y el primero se siente más fuerte. Es el compás de casi toda la música popular.',
          },
          {
            kind: 'quiz',
            prompt: '¿Cuándo conviene respirar al cantar?',
            options: [
              'Cuando ya no queda nada de aire',
              'En los finales de frase, antes de quedarte sin aire',
              'Cada dos palabras',
            ],
            answer: 1,
            explain:
              'Se respira donde la letra tiene sentido, y antes de necesitarlo. Si esperas a quedarte sin aire, la frase ya se cayó.',
          },
        ],
      },
      {
        id: 'pulso',
        title: 'Marca el pulso',
        kind: 'ritmo',
        exercises: [
          { kind: 'rhythm', prompt: 'Escucha cuatro pulsos y sigue marcando al mismo tiempo.', bpm: 80, beats: 8 },
        ],
      },
      {
        id: 'melodia',
        title: 'Tu primera melodía',
        kind: 'voz',
        exercises: [
          {
            kind: 'sequence',
            prompt: 'Cinco notas seguidas. Tómate tu tiempo entre cada una.',
            offsets: [0, 0, 7, 7, 9],
          },
          {
            kind: 'sequence',
            prompt: 'Y el final de la frase, bajando.',
            offsets: [9, 7, 5, 5, 4],
          },
        ],
      },
    ],
  },
]

export const ALL_LEVELS = STAGES.flatMap((stage) => stage.levels.map((level) => ({ level, stage })))

/** Ids en el orden del camino. Referencia estable: el currículo es estático. */
export const LEVEL_IDS = ALL_LEVELS.map((l) => l.level.id)
