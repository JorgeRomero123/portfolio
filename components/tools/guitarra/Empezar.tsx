'use client'

import ChordDiagram from './ChordDiagram'
import { STRINGS, chordById } from './music'
import type { TabId } from './GuitarraApp'

const FINGERS = [
  { n: 1, name: 'Índice' },
  { n: 2, name: 'Medio' },
  { n: 3, name: 'Anular' },
  { n: 4, name: 'Meñique' },
]

const WEEK = [
  {
    days: 'Días 1 y 2',
    goal: 'Afinar y sonar limpio',
    detail:
      'Aprende a afinar con el micrófono. Luego solo Mi menor: fórmalo, toca cuerda por cuerda y arregla la que zumbe. Nada de canciones todavía.',
  },
  {
    days: 'Días 3 y 4',
    goal: 'El primer cambio',
    detail:
      'Añade La menor. Un minuto yendo y viniendo entre Mi menor y La menor, contando cambios. Repite tres rondas con descanso.',
  },
  {
    days: 'Día 5',
    goal: 'Sol mayor',
    detail:
      'Sol es el que más cuesta al principio. Fórmalo con anular y meñique aunque sea incómodo: te ahorrará meses después.',
  },
  {
    days: 'Días 6 y 7',
    goal: 'Ritmo de verdad',
    detail:
      'Metrónomo a 60, rasgueo abajo a negras, alternando Mi menor y Sol cada dos compases. Ya estás tocando música.',
  },
]

const MISTAKES = [
  {
    title: 'Apretar con toda la fuerza',
    fix: 'Presiona lo justo para que la nota no zumbe y ni un gramo más. Prueba: aprieta, y ve aflojando hasta que empiece a sonar mal. Ese es tu punto.',
  },
  {
    title: 'El pulgar asomando por encima del mástil',
    fix: 'Al principio, pulgar detrás del mástil y más o menos enfrente del dedo medio. Así los otros dedos llegan curvados y no apagan las cuerdas de al lado.',
  },
  {
    title: 'Uñas largas en la mano que pisa',
    fix: 'Si la uña toca el traste antes que la yema, el acorde nunca va a sonar. Córtalas cortas: es la solución más rápida que existe a un acorde sucio.',
  },
  {
    title: 'Correr antes de sonar limpio',
    fix: 'Si a velocidad lenta suena mal, a velocidad rápida suena mal más veces. Baja el metrónomo hasta que salga perfecto y sube de cinco en cinco.',
  },
  {
    title: 'Practicar con la guitarra desafinada',
    fix: 'Educa el oído al revés y hace que todo suene mal por mucho que lo hagas bien. Treinta segundos de afinador antes de cada sesión.',
  },
]

export default function Empezar({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const em = chordById('Em')!

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Nunca has tocado. Empieza aquí.</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          Lo único que necesitas la primera semana es que la guitarra esté afinada y que dos acordes
          suenen sin zumbidos. Todo lo demás viene después, y viene solo si vuelves mañana.
        </p>
        <p className="text-gray-600 leading-relaxed">
          La postura importa menos de lo que dicen, pero tres cosas sí: siéntate derecho con la
          guitarra apoyada en la pierna del lado de la mano que rasguea, deja el mástil ligeramente
          hacia arriba, y no encorves la muñeca izquierda. Si te duele algo que no sean las yemas de
          los dedos, para y recoloca.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => onNavigate('afinador')}
            className="px-5 py-2.5 rounded-xl bg-[#0070f3] text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Afinar la guitarra
          </button>
          <button
            onClick={() => onNavigate('practica')}
            className="px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:border-gray-300 transition-colors"
          >
            Ver la rutina diaria
          </button>
        </div>
      </div>

      {/* Cuerdas y dedos */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-1">Las cuerdas</h3>
          <p className="text-sm text-gray-500 mb-4">
            Se numeran desde la más delgada. La 6ª es la gorda de arriba cuando tocas sentado.
          </p>
          <div className="space-y-1.5">
            {[...STRINGS].reverse().map((s) => (
              <div
                key={s.number}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100"
              >
                <span className="w-7 h-7 shrink-0 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center">
                  {s.number}
                </span>
                <span className="font-medium text-gray-900 text-sm">{s.label}</span>
                <span
                  className="ml-auto rounded-full bg-gray-300"
                  style={{ width: `${28 + s.number * 6}px`, height: `${0.8 + s.number * 0.4}px` }}
                />
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-gray-600">
            De la 6ª a la 1ª: <span className="font-medium text-gray-900">Mi La Re Sol Si Mi</span>.
            Vas a repetirlo mil veces.
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-1">Los dedos</h3>
          <p className="text-sm text-gray-500 mb-4">
            En los diagramas, el número que ves bajo cada cuerda es el dedo que la pisa.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {FINGERS.map((f) => (
              <div key={f.n} className="flex items-center gap-3 px-3 py-3 rounded-lg bg-gray-50 border border-gray-100">
                <span className="w-8 h-8 shrink-0 rounded-full bg-[#0070f3] text-white text-sm font-bold flex items-center justify-center">
                  {f.n}
                </span>
                <span className="font-medium text-gray-900 text-sm">{f.name}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-gray-600">
            El pulgar casi nunca pisa: se queda detrás del mástil haciendo de contrapeso.
          </p>
        </div>
      </div>

      {/* Leer un diagrama */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 sm:p-8">
        <h3 className="font-bold text-gray-900 mb-1">Cómo se lee un diagrama de acordes</h3>
        <p className="text-sm text-gray-500 mb-6">
          Es la guitarra de frente, colgada en la pared: las líneas verticales son las cuerdas y las
          horizontales los trastes.
        </p>
        <div className="grid sm:grid-cols-[auto_1fr] gap-8 items-center">
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-6 text-center">
            <ChordDiagram chord={em} width={150} className="mx-auto" />
            <div className="mt-2 font-bold text-gray-900">Mi menor</div>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              ['La barra negra de arriba', 'Es la cejuela, el extremo del mástil. Si no está, el número a la izquierda te dice en qué traste empieza el dibujo.'],
              ['Círculo azul', 'Ahí pones un dedo. El número de abajo dice cuál.'],
              ['O encima de la cuerda', 'Cuerda al aire: suena, pero no la pisas.'],
              ['X encima de la cuerda', 'Esa cuerda no debe sonar. Esquívala al rasguear o apágala rozándola.'],
              ['Barra azul alargada', 'Cejilla: un dedo acostado tapando varias cuerdas a la vez.'],
            ].map(([term, desc]) => (
              <li key={term} className="flex gap-3">
                <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-[#0070f3] mt-2" />
                <span>
                  <span className="font-semibold text-gray-900">{term}.</span>{' '}
                  <span className="text-gray-600">{desc}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Primera semana */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 sm:p-8">
        <h3 className="font-bold text-gray-900 mb-1">Tu primera semana</h3>
        <p className="text-sm text-gray-500 mb-6">
          Veinte minutos al día. Si un día no puedes, que sean cinco, pero que no sean cero.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {WEEK.map((w) => (
            <div key={w.days} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#0070f3]">
                {w.days}
              </div>
              <div className="font-semibold text-gray-900 mt-1 mb-2">{w.goal}</div>
              <p className="text-sm text-gray-600 leading-relaxed">{w.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Errores */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 sm:p-8">
        <h3 className="font-bold text-gray-900 mb-1">Los cinco errores que frenan a todo el mundo</h3>
        <p className="text-sm text-gray-500 mb-6">
          Ninguno tiene que ver con el talento. Todos tienen arreglo hoy mismo.
        </p>
        <div className="space-y-3">
          {MISTAKES.map((m, i) => (
            <div key={m.title} className="flex gap-4 p-4 rounded-xl border border-gray-100">
              <span className="shrink-0 w-7 h-7 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <div>
                <div className="font-semibold text-gray-900">{m.title}</div>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">{m.fix}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
