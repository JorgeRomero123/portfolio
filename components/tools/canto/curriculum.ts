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
  /**
   * A ciegas: suena la tónica en vez de la nota buscada, así que hay que
   * encontrar el intervalo por uno mismo en lugar de copiar una altura. Es el
   * salto real entre imitar y cantar.
   */
  blind?: boolean
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

// ═══════════════════════════════════════════════════════════════════════════
// Segunda mitad: a partir de aquí se asume que ya afinas notas sueltas.
// ═══════════════════════════════════════════════════════════════════════════

STAGES.push(
  {
    id: 'intervalos-dificiles',
    name: 'Intervalos difíciles',
    subtitle: 'Cuartas, sextas y los saltos que bajan',
    accent: 'from-indigo-500 to-indigo-700',
    ring: 'ring-indigo-200',
    text: 'text-indigo-600',
    levels: [
      {
        id: 'cuarta-sexta-teoria',
        title: 'Cuarta y sexta',
        kind: 'teoria',
        exercises: [
          {
            kind: 'quiz',
            prompt: 'La cuarta justa y la quinta justa se confunden mucho. ¿Cuál suena más "abierta"?',
            options: ['La cuarta', 'La quinta', 'Suenan igual'],
            answer: 1,
            explain:
              'La quinta es más ancha y más estable. La cuarta suena algo más cerrada y con una ligera tensión.',
          },
          {
            kind: 'quiz',
            prompt: '¿Por qué cuesta más cantar un intervalo hacia abajo que hacia arriba?',
            options: [
              'Porque la voz pierde apoyo al bajar y tiende a quedarse corta',
              'Porque las notas graves no existen en la escala',
              'No cuesta más, es igual',
            ],
            answer: 0,
            explain:
              'Al bajar se suele aflojar el aire y la nota se queda por encima o se desploma. Bajar pide el mismo apoyo que subir.',
          },
        ],
      },
      {
        id: 'cuarta-vs-quinta',
        title: 'Cuarta o quinta',
        kind: 'oido',
        exercises: [
          {
            kind: 'ear',
            prompt: '¿Qué intervalo es?',
            offsets: [0, 5],
            options: ['Cuarta justa', 'Quinta justa'],
            answer: 0,
            explain: 'Cuarta. Es el salto del principio del himno nupcial.',
          },
          {
            kind: 'ear',
            prompt: '¿Y este?',
            offsets: [0, 7],
            options: ['Cuarta justa', 'Quinta justa'],
            answer: 1,
            explain: 'Quinta. Un poco más ancha y más luminosa que la anterior.',
          },
          {
            kind: 'ear',
            prompt: 'Uno más, sin pistas.',
            offsets: [0, 9],
            options: ['Cuarta justa', 'Quinta justa', 'Sexta mayor'],
            answer: 2,
            explain: 'Sexta mayor. Ya se oye claramente más ancha que la quinta.',
          },
        ],
      },
      {
        id: 'cantar-cuarta-sexta',
        title: 'Canta los saltos anchos',
        kind: 'voz',
        exercises: [
          { kind: 'sequence', prompt: 'Tónica y cuarta.', offsets: [0, 5] },
          { kind: 'sequence', prompt: 'Ahora la sexta, que es bastante más arriba.', offsets: [0, 9] },
        ],
      },
      {
        id: 'descendentes',
        title: 'Saltos hacia abajo',
        kind: 'voz',
        exercises: [
          { kind: 'sequence', prompt: 'De la quinta a la tónica, bajando.', offsets: [7, 0] },
          { kind: 'sequence', prompt: 'Ahora desde la octava. No aflojes el aire al bajar.', offsets: [12, 5, 0] },
        ],
      },
    ],
  },

  {
    id: 'escala-menor',
    name: 'La escala menor',
    subtitle: 'El otro color, y cómo se canta',
    accent: 'from-slate-500 to-slate-700',
    ring: 'ring-slate-200',
    text: 'text-slate-600',
    levels: [
      {
        id: 'menor-teoria',
        title: 'Qué cambia en la menor',
        kind: 'teoria',
        exercises: [
          {
            kind: 'quiz',
            prompt: 'Respecto a la mayor, ¿qué nota cambia y le da el color triste?',
            options: ['La tercera, que baja medio tono', 'La quinta, que sube', 'La tónica'],
            answer: 0,
            explain:
              'La tercera bajada medio tono. Con ese único cambio la escala pasa de alegre a melancólica.',
          },
          {
            kind: 'quiz',
            prompt: 'La escala menor natural, ¿es una escala nueva o la mayor empezada en otro sitio?',
            options: [
              'Es la mayor empezando desde su sexto grado',
              'Es una escala completamente distinta',
              'Es la mayor al revés',
            ],
            answer: 0,
            explain:
              'Las mismas notas, otro punto de partida. Por eso a cada tonalidad mayor le corresponde una menor "relativa".',
          },
        ],
      },
      {
        id: 'menor-oido',
        title: 'Distingue las dos escalas',
        kind: 'oido',
        exercises: [
          {
            kind: 'ear',
            prompt: 'Escucha la escala. ¿Mayor o menor?',
            offsets: [0, 2, 4, 5, 7],
            options: ['Mayor', 'Menor'],
            answer: 0,
            explain: 'Mayor. La tercera nota sonó alta y alegre.',
          },
          {
            kind: 'ear',
            prompt: '¿Y esta?',
            offsets: [0, 2, 3, 5, 7],
            options: ['Mayor', 'Menor'],
            answer: 1,
            explain: 'Menor: la tercera bajó medio tono y todo cambió de carácter.',
          },
        ],
      },
      {
        id: 'menor-cantar',
        title: 'Canta la escala menor',
        kind: 'voz',
        exercises: [
          { kind: 'sequence', prompt: 'Subiendo. Cuidado con la tercera: va más baja de lo que pide el oído.', offsets: [0, 2, 3, 5, 7] },
        ],
      },
      {
        id: 'menor-arpegio',
        title: 'Arpegio menor',
        kind: 'voz',
        exercises: [
          { kind: 'sequence', prompt: 'Tónica, tercera menor, quinta, y de vuelta.', offsets: [0, 3, 7, 3, 0] },
        ],
      },
    ],
  },

  {
    id: 'a-ciegas',
    name: 'Encontrar la nota solo',
    subtitle: 'Dejar de imitar y empezar a cantar',
    accent: 'from-teal-500 to-teal-700',
    ring: 'ring-teal-200',
    text: 'text-teal-600',
    levels: [
      {
        id: 'audiacion-teoria',
        title: 'Oírla antes de cantarla',
        kind: 'teoria',
        exercises: [
          {
            kind: 'quiz',
            prompt: 'Los cantantes afinados, ¿qué hacen antes de emitir una nota?',
            options: [
              'La imaginan primero y luego la producen',
              'La buscan deslizando la voz hasta acertar',
              'Cantan y corrigen sobre la marcha',
            ],
            answer: 0,
            explain:
              'Se llama audiación: la oyes dentro de la cabeza y solo entonces la sueltas. Buscar deslizando es lo que suena a desafinado.',
          },
          {
            kind: 'quiz',
            prompt: 'Entonces, si no estás seguro de una nota, lo mejor es…',
            options: [
              'Tomarte un segundo en silencio para imaginarla',
              'Cantarla flojito y subir hasta encontrarla',
              'Cantarla fuerte para no dudar',
            ],
            answer: 0,
            explain:
              'Un segundo de silencio ahorra tres de deslizamiento. En los ejercicios que vienen, imagina antes de abrir la boca.',
          },
        ],
      },
      {
        id: 'ciegas-tercera',
        title: 'Encuentra la tercera',
        kind: 'voz',
        exercises: [
          { kind: 'matchPitch', prompt: 'Te doy la tónica. Canta la tercera mayor.', offset: 4, blind: true },
        ],
      },
      {
        id: 'ciegas-quinta',
        title: 'Encuentra la quinta',
        kind: 'voz',
        exercises: [
          { kind: 'matchPitch', prompt: 'Misma tónica. Ahora la quinta.', offset: 7, blind: true },
        ],
      },
      {
        id: 'ciegas-octava',
        title: 'Encuentra la octava',
        kind: 'voz',
        exercises: [
          { kind: 'matchPitch', prompt: 'La misma nota, una octava arriba.', offset: 12, blind: true },
          { kind: 'matchPitch', prompt: 'Y una cuarta, que es la que más se resiste.', offset: 5, blind: true },
        ],
      },
    ],
  },

  {
    id: 'agilidad',
    name: 'Agilidad y aguante',
    subtitle: 'Más notas, más rápido, más tiempo',
    accent: 'from-fuchsia-500 to-purple-700',
    ring: 'ring-fuchsia-200',
    text: 'text-fuchsia-600',
    levels: [
      {
        id: 'escala-completa',
        title: 'La escala entera',
        kind: 'voz',
        exercises: [
          { kind: 'sequence', prompt: 'Ocho notas hasta la octava. Sin prisa.', offsets: [0, 2, 4, 5, 7, 9, 11, 12] },
        ],
      },
      {
        id: 'escala-vuelta',
        title: 'Ida y vuelta',
        kind: 'voz',
        exercises: [
          { kind: 'sequence', prompt: 'Sube cinco notas y baja las mismas.', offsets: [0, 2, 4, 5, 7, 5, 4, 2, 0] },
        ],
      },
      {
        id: 'aguante',
        title: 'Ocho segundos',
        kind: 'aliento',
        exercises: [
          { kind: 'sustain', prompt: 'Dosifica el aire desde el principio.', offset: 4, seconds: 8 },
        ],
      },
      {
        id: 'pulso-rapido',
        title: 'Pulso rápido',
        kind: 'ritmo',
        exercises: [
          { kind: 'rhythm', prompt: 'Más rápido que antes. Escucha la entrada completa.', bpm: 120, beats: 12 },
        ],
      },
    ],
  },

  {
    id: 'canciones',
    name: 'Cantar canciones',
    subtitle: 'Frases largas, respiración y repertorio',
    accent: 'from-lime-600 to-green-700',
    ring: 'ring-lime-200',
    text: 'text-lime-700',
    levels: [
      {
        id: 'frase-teoria',
        title: 'Frasear',
        kind: 'teoria',
        exercises: [
          {
            kind: 'quiz',
            prompt: 'Al preparar una canción, ¿qué conviene marcar antes de cantarla entera?',
            options: [
              'Dónde vas a respirar',
              'Dónde vas a cantar más fuerte',
              'Cuántos compases tiene',
            ],
            answer: 0,
            explain:
              'Las respiraciones. Si no las decides tú, las decide el pánico a mitad de frase y la nota se cae.',
          },
          {
            kind: 'quiz',
            prompt: 'Una nota larga al final de una frase larga se suele desafinar hacia…',
            options: ['Arriba', 'Abajo', 'No se desafina'],
            answer: 1,
            explain:
              'Hacia abajo, porque se acaba el aire y cae la presión. Guarda aire para el final, no lo gastes al principio.',
          },
          {
            kind: 'quiz',
            prompt: 'Si una canción es demasiado aguda para ti, lo correcto es…',
            options: [
              'Cambiarla de tono para que entre en tu rango',
              'Forzar hasta que salga',
              'Cantarla en falsete siempre',
            ],
            answer: 0,
            explain:
              'Transportarla. Los cantantes profesionales lo hacen constantemente; forzar solo te lesiona.',
          },
        ],
      },
      {
        id: 'frase-1',
        title: 'Frase larga',
        kind: 'voz',
        exercises: [
          { kind: 'sequence', prompt: 'Primera frase completa, seis notas.', offsets: [0, 0, 7, 7, 9, 7] },
        ],
      },
      {
        id: 'frase-2',
        title: 'La respuesta',
        kind: 'voz',
        exercises: [
          { kind: 'sequence', prompt: 'La frase que contesta, bajando hasta la tónica.', offsets: [5, 5, 4, 4, 2, 2, 0] },
        ],
      },
      {
        id: 'cierre',
        title: 'Cerrar bien',
        kind: 'aliento',
        exercises: [
          { kind: 'sustain', prompt: 'La última nota de una canción: seis segundos, firme hasta el final.', offset: 0, seconds: 6 },
        ],
      },
    ],
  }
)

export const ALL_LEVELS = STAGES.flatMap((stage) => stage.levels.map((level) => ({ level, stage })))

/** Ids en el orden del camino. Referencia estable: el currículo es estático. */
export const LEVEL_IDS = ALL_LEVELS.map((l) => l.level.id)
