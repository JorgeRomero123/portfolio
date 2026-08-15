'use client'

import { useState } from 'react'
import { playTone } from './audio'
import { NOTES_ES, SCALES, STRINGS, degreeOf, midiToFreq, noteNameEs } from './music'

const FRET_COUNT = 15
const MARKERS = new Set([3, 5, 7, 9, 15])
const DOUBLE_MARKER = 12

/** De la 1ª cuerda (aguda, arriba) a la 6ª (grave, abajo), como se ve en un diagrama. */
const ROWS = [...STRINGS].reverse()

export default function Diapason() {
  const [rootPc, setRootPc] = useState(4) // Mi
  const [scaleId, setScaleId] = useState(SCALES[0].id)
  const [showDegrees, setShowDegrees] = useState(false)

  const scale = SCALES.find((s) => s.id === scaleId)!

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 sm:p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Diapasón interactivo</h2>
        <p className="text-gray-500 text-sm mb-6">
          Elige una tónica y una escala para ver dónde caen las notas. Haz clic en cualquier traste
          para oírlo.
        </p>

        <div className="space-y-5">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Tónica
            </span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {NOTES_ES.map((note, pc) => (
                <button
                  key={note}
                  onClick={() => setRootPc(pc)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    rootPc === pc
                      ? 'bg-[#0070f3] border-[#0070f3] text-white'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {note}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-end">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Escala
              </span>
              <select
                value={scaleId}
                onChange={(e) => setScaleId(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                {SCALES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              {[
                { label: 'Notas', value: false },
                { label: 'Grados', value: true },
              ].map(({ label, value }) => (
                <button
                  key={label}
                  onClick={() => setShowDegrees(value)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    showDegrees === value ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-4 text-sm text-gray-600">
          <span className="font-semibold text-gray-900">
            {NOTES_ES[rootPc]} · {scale.name}.
          </span>{' '}
          {scale.note}
        </p>
      </div>

      {/* Mástil */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 sm:p-6 overflow-x-auto">
        <div className="min-w-[760px]">
          {ROWS.map((string) => (
            <div key={string.number} className="flex items-center">
              <div className="w-16 shrink-0 pr-2 text-right">
                <span className="text-sm font-semibold text-gray-700">{string.short}</span>
                <span className="ml-1 text-xs font-mono text-gray-400">{string.number}</span>
              </div>

              {Array.from({ length: FRET_COUNT + 1 }, (_, fret) => {
                const midi = string.midi + fret
                const degree = degreeOf(midi, rootPc, scale)
                const isRoot = degree === '1'
                const isMarker = MARKERS.has(fret) || fret === DOUBLE_MARKER

                return (
                  <button
                    key={fret}
                    onClick={() => playTone(midiToFreq(midi), 1.4)}
                    title={`${noteNameEs(midi)} · cuerda ${string.number}, traste ${fret}`}
                    className={`relative flex-1 h-11 flex items-center justify-center group ${
                      isMarker ? 'bg-gray-50/80' : ''
                    } ${fret === 0 ? 'border-r-[3px] border-gray-900 mr-0.5' : 'border-r border-gray-200'}`}
                  >
                    {/* La cuerda */}
                    <span
                      className="absolute inset-x-0 top-1/2 h-px bg-gray-300"
                      style={{ height: `${0.5 + (string.number - 1) * 0.22}px` }}
                    />
                    {degree ? (
                      <span
                        className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-transform group-hover:scale-110 ${
                          isRoot
                            ? 'bg-[#0070f3] text-white'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {showDegrees ? degree : noteNameEs(midi)}
                      </span>
                    ) : (
                      <span className="relative z-10 w-8 h-8 rounded-full group-hover:bg-gray-100 transition-colors" />
                    )}
                  </button>
                )
              })}
            </div>
          ))}

          {/* Numeración de trastes */}
          <div className="flex items-center mt-1">
            <div className="w-16 shrink-0" />
            {Array.from({ length: FRET_COUNT + 1 }, (_, fret) => (
              <div
                key={fret}
                className={`flex-1 text-center text-xs ${fret === 0 ? 'mr-0.5' : ''} ${
                  MARKERS.has(fret) || fret === DOUBLE_MARKER
                    ? 'font-bold text-gray-700'
                    : 'text-gray-400'
                }`}
              >
                {fret === DOUBLE_MARKER ? '12 ••' : fret}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-2">Cómo usar esto</h3>
        <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
          <li>
            Los círculos azules oscuros son la tónica: la nota que da nombre a la escala y el sitio
            donde todo suena en reposo.
          </li>
          <li>
            Empieza con <span className="font-medium text-gray-900">Mi · Pentatónica menor</span> y
            fíjate en el bloque de los trastes 12 al 15. Esa es la primera posición que aprende todo
            el mundo para improvisar.
          </li>
          <li>
            Con «Todas las notas» puedes estudiar los nombres del mástil. Truco: el traste 12 repite
            las cuerdas al aire una octava más arriba.
          </li>
        </ul>
      </div>
    </div>
  )
}
