import { TUNING } from './music'

/**
 * El currículo: etapas → niveles → ejercicios.
 *
 * Regla de diseño: un nivel se termina en uno o dos minutos y hace una sola
 * cosa. La teoría y la práctica se alternan entre niveles, no dentro de ellos,
 * para que nunca haya que leer un muro de texto antes de tocar.
 */

export type Exercise =
  | QuizExercise
  | EarExercise
  | FretboardExercise
  | PlayNoteExercise
  | PlayChordExercise
  | TuneExercise
  | RhythmExercise

/** Pregunta de opción múltiple, opcionalmente con un diagrama de acorde. */
export interface QuizExercise {
  kind: 'quiz'
  prompt: string
  options: string[]
  answer: number
  explain: string
  chordId?: string
}

/** Suena algo y hay que reconocerlo. */
export interface EarExercise {
  kind: 'ear'
  prompt: string
  source: { type: 'chord'; id: string } | { type: 'note'; midi: number }
  options: string[]
  answer: number
  explain: string
}

/** Localizar una nota en el mástil tocando el traste correcto. */
export interface FretboardExercise {
  kind: 'fretboard'
  prompt: string
  string: number // 6 = la más grave
  fret: number
  explain: string
}

/** Tocar una nota de verdad; se verifica con el micrófono. */
export interface PlayNoteExercise {
  kind: 'playNote'
  prompt: string
  string: number
  fret: number
}

/**
 * Tocar un acorde arpegiado, cuerda por cuerda. Se verifica nota a nota: es
 * más fiable que analizar un rasgueo y además es justo el ejercicio que
 * enseña a detectar qué dedo está apagando una cuerda.
 */
export interface PlayChordExercise {
  kind: 'playChord'
  chordId: string
}

/** Afinar una cuerda hasta dejarla dentro de ±5 cents. */
export interface TuneExercise {
  kind: 'tune'
  string: number
}

/** Marcar el pulso a tiempo. No necesita micrófono. */
export interface RhythmExercise {
  kind: 'rhythm'
  prompt: string
  bpm: number
  beats: number
}

export type LevelKind = 'teoria' | 'practica' | 'oido' | 'mastil' | 'ritmo'

export interface Level {
  id: string
  title: string
  kind: LevelKind
  exercises: Exercise[]
}

export interface Stage {
  id: string
  name: string
  subtitle: string
  /** Clases Tailwind del degradado que identifica la etapa. */
  accent: string
  ring: string
  text: string
  levels: Level[]
}

const openString = (n: number) => TUNING[6 - n]

export const STAGES: Stage[] = [
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'orientacion',
    name: 'Reconoce tu guitarra',
    subtitle: 'Antes de tocar, saber qué estás tocando',
    accent: 'from-sky-500 to-blue-600',
    ring: 'ring-blue-200',
    text: 'text-blue-600',
    levels: [
      {
        id: 'cuerdas',
        title: 'Las seis cuerdas',
        kind: 'teoria',
        exercises: [
          {
            kind: 'quiz',
            prompt: '¿Cuál es la primera cuerda?',
            options: ['La más delgada', 'La más gruesa', 'La del centro'],
            answer: 0,
            explain:
              'Se numeran desde la más delgada. Suena raro al principio porque es la de abajo cuando tocas sentado.',
          },
          {
            kind: 'quiz',
            prompt: 'De la 6ª a la 1ª, ¿en qué orden van las cuerdas al aire?',
            options: ['Do Re Mi Fa Sol La', 'Mi La Re Sol Si Mi', 'Mi Re Do Si La Sol'],
            answer: 1,
            explain: 'Mi La Re Sol Si Mi. Las dos Mi están a dos octavas de distancia.',
          },
          {
            kind: 'quiz',
            prompt: '¿Cuál es la cuerda más grave?',
            options: ['La 1ª', 'La 3ª', 'La 6ª'],
            answer: 2,
            explain: 'La 6ª, la más gruesa. Cuanto más gruesa la cuerda, más grave el sonido.',
          },
        ],
      },
      {
        id: 'diagramas',
        title: 'Leer un diagrama',
        kind: 'teoria',
        exercises: [
          {
            kind: 'quiz',
            prompt: '¿Qué significa una X encima de una cuerda?',
            options: ['Que esa cuerda no debe sonar', 'Que la tocas al aire', 'Que va la cejilla'],
            answer: 0,
            explain: 'La X marca una cuerda que hay que esquivar o apagar. El círculo O sí suena, pero sin pisarla.',
          },
          {
            kind: 'quiz',
            prompt: 'En este acorde, ¿cuántas cuerdas tienes que pisar?',
            chordId: 'Em',
            options: ['Dos', 'Tres', 'Ninguna'],
            answer: 0,
            explain: 'Solo dos. Las otras cuatro suenan al aire, y por eso Mi menor es el primer acorde de todo el mundo.',
          },
          {
            kind: 'quiz',
            prompt: 'Los números bajo el diagrama, ¿qué indican?',
            chordId: 'Am',
            options: ['El traste', 'El dedo que usas', 'El orden de rasgueo'],
            answer: 1,
            explain: '1 índice, 2 medio, 3 anular, 4 meñique. El traste se lee por la fila del dibujo.',
          },
        ],
      },
      {
        id: 'afinar',
        title: 'Afina la sexta',
        kind: 'practica',
        exercises: [{ kind: 'tune', string: 6 }],
      },
      {
        id: 'primera-nota',
        title: 'Tu primera nota',
        kind: 'practica',
        exercises: [
          { kind: 'playNote', prompt: 'Toca la 6ª cuerda al aire, sin pisar nada.', string: 6, fret: 0 },
          { kind: 'playNote', prompt: 'Ahora la 1ª cuerda al aire, la más delgada.', string: 1, fret: 0 },
        ],
      },
      {
        id: 'oido-cuerdas',
        title: '¿Qué cuerda sonó?',
        kind: 'oido',
        exercises: [
          {
            kind: 'ear',
            prompt: 'Escucha y di qué cuerda al aire es.',
            source: { type: 'note', midi: openString(6) },
            options: ['6ª (Mi grave)', '3ª (Sol)', '1ª (Mi agudo)'],
            answer: 0,
            explain: 'Grave y con cuerpo: es la 6ª.',
          },
          {
            kind: 'ear',
            prompt: 'Escucha y di qué cuerda al aire es.',
            source: { type: 'note', midi: openString(1) },
            options: ['6ª (Mi grave)', '4ª (Re)', '1ª (Mi agudo)'],
            answer: 2,
            explain: 'La misma nota que la 6ª pero dos octavas arriba.',
          },
          {
            kind: 'ear',
            prompt: 'Una más. ¿Cuál es?',
            source: { type: 'note', midi: openString(5) },
            options: ['5ª (La)', '2ª (Si)', '1ª (Mi agudo)'],
            answer: 0,
            explain: 'La 5ª cuerda al aire da un La, la nota con la que se afina media orquesta.',
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'mi-menor',
    name: 'Tu primer acorde',
    subtitle: 'Mi menor, dos dedos, seis cuerdas',
    accent: 'from-emerald-500 to-teal-600',
    ring: 'ring-emerald-200',
    text: 'text-emerald-600',
    levels: [
      {
        id: 'em-teoria',
        title: 'Conoce Mi menor',
        kind: 'teoria',
        exercises: [
          {
            kind: 'quiz',
            prompt: '¿En qué traste van los dos dedos de Mi menor?',
            chordId: 'Em',
            options: ['En el primero', 'En el segundo', 'En el tercero'],
            answer: 1,
            explain: 'Los dos en el segundo traste, en las cuerdas 5ª y 4ª.',
          },
          {
            kind: 'quiz',
            prompt: '¿Cuántas cuerdas suenan en Mi menor?',
            chordId: 'Em',
            options: ['Cuatro', 'Cinco', 'Las seis'],
            answer: 2,
            explain: 'Las seis. No hay ninguna X, así que puedes rasguear de arriba abajo sin miedo.',
          },
          {
            kind: 'quiz',
            prompt: '¿Por qué un acorde se llama "menor"?',
            options: [
              'Porque tiene menos cuerdas',
              'Porque su tercera nota está medio tono más abajo',
              'Porque se toca más flojo',
            ],
            answer: 1,
            explain:
              'Esa media distancia es lo que le da el color triste. Bajar esa nota medio tono convierte un mayor en menor.',
          },
        ],
      },
      {
        id: 'em-tocar',
        title: 'Forma Mi menor',
        kind: 'practica',
        exercises: [{ kind: 'playChord', chordId: 'Em' }],
      },
      {
        id: 'em-oido',
        title: 'Alegre o triste',
        kind: 'oido',
        exercises: [
          {
            kind: 'ear',
            prompt: '¿Este acorde suena mayor o menor?',
            source: { type: 'chord', id: 'Em' },
            options: ['Mayor, alegre', 'Menor, triste'],
            answer: 1,
            explain: 'Mi menor. Ese color melancólico es la marca de los acordes menores.',
          },
          {
            kind: 'ear',
            prompt: '¿Y este?',
            source: { type: 'chord', id: 'E' },
            options: ['Mayor, alegre', 'Menor, triste'],
            answer: 0,
            explain: 'Mi mayor. Es Mi menor con un dedo más, y ese dedo le cambia el ánimo por completo.',
          },
          {
            kind: 'ear',
            prompt: 'Uno más, sin pistas.',
            source: { type: 'chord', id: 'Am' },
            options: ['Mayor, alegre', 'Menor, triste'],
            answer: 1,
            explain: 'La menor. Ya distingues mayores de menores de oído.',
          },
        ],
      },
      {
        id: 'em-limpio',
        title: 'Mi menor limpio',
        kind: 'practica',
        exercises: [{ kind: 'playChord', chordId: 'Em' }],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'la-menor',
    name: 'El primer cambio',
    subtitle: 'La menor y moverse entre dos acordes',
    accent: 'from-violet-500 to-purple-600',
    ring: 'ring-violet-200',
    text: 'text-violet-600',
    levels: [
      {
        id: 'am-teoria',
        title: 'Conoce La menor',
        kind: 'teoria',
        exercises: [
          {
            kind: 'quiz',
            prompt: '¿Qué cuerda NO debe sonar en La menor?',
            chordId: 'Am',
            options: ['La 6ª', 'La 1ª', 'Ninguna, suenan todas'],
            answer: 0,
            explain: 'La X sobre la 6ª: empieza a rasguear desde la 5ª.',
          },
          {
            kind: 'quiz',
            prompt: 'Mirando los dos acordes, ¿qué tienen en común Mi menor y La menor?',
            chordId: 'Am',
            options: [
              'Es la misma forma movida una cuerda',
              'No se parecen en nada',
              'Ambos usan cejilla',
            ],
            answer: 0,
            explain:
              'La misma figura desplazada. Por eso el cambio entre los dos es de los más fáciles que existen.',
          },
        ],
      },
      {
        id: 'am-tocar',
        title: 'Forma La menor',
        kind: 'practica',
        exercises: [{ kind: 'playChord', chordId: 'Am' }],
      },
      {
        id: 'am-em-oido',
        title: '¿Cuál de los dos?',
        kind: 'oido',
        exercises: [
          {
            kind: 'ear',
            prompt: 'Ya conoces los dos. ¿Cuál suena?',
            source: { type: 'chord', id: 'Em' },
            options: ['Mi menor', 'La menor'],
            answer: 0,
            explain: 'Mi menor: más grave, porque suenan las seis cuerdas.',
          },
          {
            kind: 'ear',
            prompt: '¿Y ahora?',
            source: { type: 'chord', id: 'Am' },
            options: ['Mi menor', 'La menor'],
            answer: 1,
            explain: 'La menor. Al no sonar la 6ª, el acorde arranca más arriba.',
          },
        ],
      },
      {
        id: 'cambio-1',
        title: 'De Mi menor a La menor',
        kind: 'practica',
        exercises: [
          { kind: 'playChord', chordId: 'Em' },
          { kind: 'playChord', chordId: 'Am' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'mayores',
    name: 'Los acordes mayores',
    subtitle: 'Sol, Do y Re: con esto ya se tocan canciones',
    accent: 'from-amber-500 to-orange-600',
    ring: 'ring-amber-200',
    text: 'text-amber-600',
    levels: [
      {
        id: 'g-teoria',
        title: 'Conoce Sol mayor',
        kind: 'teoria',
        exercises: [
          {
            kind: 'quiz',
            prompt: 'En Sol mayor, ¿qué dedos conviene usar en el traste 3?',
            chordId: 'G',
            options: ['Índice y medio', 'Anular y meñique', 'Da igual cuáles'],
            answer: 1,
            explain:
              'Anular y meñique. Es más incómodo al principio, pero deja el índice libre y hace que el cambio a Do y a Re salga solo.',
          },
          {
            kind: 'quiz',
            prompt: '¿Cuántas cuerdas suenan en Sol mayor?',
            chordId: 'G',
            options: ['Cuatro', 'Cinco', 'Las seis'],
            answer: 2,
            explain: 'Las seis, igual que en Mi menor.',
          },
        ],
      },
      {
        id: 'g-tocar',
        title: 'Forma Sol mayor',
        kind: 'practica',
        exercises: [{ kind: 'playChord', chordId: 'G' }],
      },
      {
        id: 'c-teoria',
        title: 'Conoce Do mayor',
        kind: 'teoria',
        exercises: [
          {
            kind: 'quiz',
            prompt: '¿Qué dedo va en el traste 3 de la 5ª cuerda en Do mayor?',
            chordId: 'C',
            options: ['El índice', 'El anular', 'El meñique'],
            answer: 1,
            explain: 'El anular estirado. Es el dedo que más cuesta colocar sin apagar la cuerda de al lado.',
          },
          {
            kind: 'quiz',
            prompt: 'En Do mayor, ¿qué cuerda no suena?',
            chordId: 'C',
            options: ['La 6ª', 'La 1ª', 'La 3ª'],
            answer: 0,
            explain: 'La 6ª lleva X, igual que en La menor.',
          },
        ],
      },
      {
        id: 'c-tocar',
        title: 'Forma Do mayor',
        kind: 'practica',
        exercises: [{ kind: 'playChord', chordId: 'C' }],
      },
      {
        id: 'd-tocar',
        title: 'Re mayor',
        kind: 'practica',
        exercises: [
          { kind: 'playChord', chordId: 'D' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'mastil',
    name: 'El mástil',
    subtitle: 'Dejar de tocar de memoria y empezar a ver',
    accent: 'from-rose-500 to-pink-600',
    ring: 'ring-rose-200',
    text: 'text-rose-600',
    levels: [
      {
        id: 'trastes-teoria',
        title: 'Cómo funcionan los trastes',
        kind: 'teoria',
        exercises: [
          {
            kind: 'quiz',
            prompt: 'Avanzar un traste, ¿cuánto sube la nota?',
            options: ['Un tono', 'Medio tono', 'Una octava'],
            answer: 1,
            explain: 'Medio tono, la distancia más pequeña de la música occidental. Doce trastes son una octava.',
          },
          {
            kind: 'quiz',
            prompt: 'El traste 12 de cualquier cuerda suena…',
            options: [
              'Igual que la cuerda al aire pero una octava más agudo',
              'Una nota sin relación con la cuerda al aire',
              'Igual que la cuerda al aire',
            ],
            answer: 0,
            explain: 'Por eso el traste 12 lleva doble marca: ahí el mástil se repite desde el principio.',
          },
          {
            kind: 'quiz',
            prompt: 'Entre Mi y Fa, ¿cuántos trastes hay?',
            options: ['Uno', 'Dos', 'Tres'],
            answer: 0,
            explain:
              'Mi–Fa y Si–Do son los dos pares que están pegados. Los demás tienen un traste de por medio.',
          },
        ],
      },
      {
        id: 'encuentra-1',
        title: 'Encuentra la nota',
        kind: 'mastil',
        exercises: [
          {
            kind: 'fretboard',
            prompt: 'Toca Fa en la 6ª cuerda.',
            string: 6,
            fret: 1,
            explain: 'Mi está al aire y Fa va pegado: traste 1.',
          },
          {
            kind: 'fretboard',
            prompt: 'Toca Sol en la 6ª cuerda.',
            string: 6,
            fret: 3,
            explain: 'De Fa a Sol hay un tono, o sea dos trastes: el 3.',
          },
          {
            kind: 'fretboard',
            prompt: 'Toca La en la 6ª cuerda.',
            string: 6,
            fret: 5,
            explain: 'Traste 5. Y de paso: ahí suena igual que la 5ª cuerda al aire.',
          },
        ],
      },
      {
        id: 'encuentra-2',
        title: 'Encuentra la nota II',
        kind: 'mastil',
        exercises: [
          {
            kind: 'fretboard',
            prompt: 'Toca Do en la 5ª cuerda.',
            string: 5,
            fret: 3,
            explain: 'Traste 3 de la 5ª. Es la nota grave del acorde de Do mayor.',
          },
          {
            kind: 'fretboard',
            prompt: 'Toca Re en la 5ª cuerda.',
            string: 5,
            fret: 5,
            explain: 'Traste 5, que suena igual que la 4ª cuerda al aire.',
          },
          {
            kind: 'fretboard',
            prompt: 'Toca Mi en la 4ª cuerda.',
            string: 4,
            fret: 2,
            explain: 'Traste 2. Es una de las notas que ya pisas sin saberlo en Mi menor.',
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'ritmo',
    name: 'Ritmo y música',
    subtitle: 'Lo que separa tocar acordes de tocar canciones',
    accent: 'from-cyan-500 to-sky-600',
    ring: 'ring-cyan-200',
    text: 'text-cyan-600',
    levels: [
      {
        id: 'compas-teoria',
        title: 'El compás',
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
            prompt: '¿Qué significa 90 BPM?',
            options: ['90 pulsos por minuto', '90 compases por minuto', '90 notas por canción'],
            answer: 0,
            explain: 'Beats per minute. A más BPM, más rápido va la canción.',
          },
          {
            kind: 'quiz',
            prompt: 'Al rasguear, ¿qué debe hacer la mano entre golpe y golpe?',
            options: [
              'Detenerse y esperar el siguiente',
              'Seguir moviéndose aunque no toque las cuerdas',
              'Levantarse de la guitarra',
            ],
            answer: 1,
            explain:
              'La muñeca no para nunca: sube y baja como un péndulo y solo roza las cuerdas cuando toca. Es el secreto de que el ritmo suene natural y no a tirones.',
          },
        ],
      },
      {
        id: 'pulso',
        title: 'Marca el pulso',
        kind: 'ritmo',
        exercises: [
          { kind: 'rhythm', prompt: 'Escucha cuatro pulsos y sigue marcando al mismo tiempo.', bpm: 70, beats: 8 },
        ],
      },
      {
        id: 'pulso-rapido',
        title: 'Sube el tempo',
        kind: 'ritmo',
        exercises: [{ kind: 'rhythm', prompt: 'Lo mismo, pero más rápido.', bpm: 100, beats: 8 }],
      },
      {
        id: 'progresion-teoria',
        title: 'Por qué esos acordes',
        kind: 'teoria',
        exercises: [
          {
            kind: 'quiz',
            prompt: 'Mi menor, Do, Sol y Re aparecen juntos en cientos de canciones. ¿Por qué?',
            options: [
              'Porque son los más fáciles',
              'Porque pertenecen a la misma tonalidad',
              'Porque suenan fuerte',
            ],
            answer: 1,
            explain:
              'Comparten notas y pertenecen a la tonalidad de Sol. Por eso encajan entre sí en cualquier orden.',
          },
          {
            kind: 'quiz',
            prompt: 'Si una progresión te deja con sensación de "falta algo", normalmente es porque…',
            options: [
              'No ha vuelto al acorde de inicio',
              'Tocaste demasiado rápido',
              'Falta una cuerda',
            ],
            answer: 0,
            explain:
              'El acorde de tónica es el que da reposo. Volver a él es lo que hace que una frase suene terminada.',
          },
        ],
      },
      {
        id: 'cancion',
        title: 'Tu primera progresión',
        kind: 'practica',
        exercises: [
          { kind: 'playChord', chordId: 'Em' },
          { kind: 'playChord', chordId: 'C' },
          { kind: 'playChord', chordId: 'G' },
        ],
      },
    ],
  },
]

export const ALL_LEVELS: { level: Level; stage: Stage; index: number }[] = STAGES.flatMap((stage) =>
  stage.levels.map((level) => ({ level, stage, index: 0 }))
).map((entry, index) => ({ ...entry, index }))

/** Ids en el orden del camino. Referencia estable: el currículo es estático. */
export const LEVEL_IDS = ALL_LEVELS.map((l) => l.level.id)

export const LEVEL_COUNT = ALL_LEVELS.length

export const findLevel = (id: string) => ALL_LEVELS.find((l) => l.level.id === id)
