'use client'

import { useState } from 'react'

interface Exercise {
  nombre: string
  series?: number
  reps?: string
  tiempo?: string
  video: string
}

interface Day {
  dia: string
  nombre: string
  ejercicios: Exercise[]
}

interface RoutineData {
  programa: {
    duracion: string
    objetivo: string
    notas: string[]
  }
  dias: Day[]
}

const routineData: RoutineData = {
  "programa": {
    "duracion": "4 semanas",
    "objetivo": "Bajar una talla de pantalón cuidando la espalda baja",
    "notas": [
      "Repetir la misma rutina durante 4 semanas",
      "Priorizar técnica sobre peso",
      "Si hay dolor lumbar, detener el ejercicio"
    ]
  },
  "dias": [
    {
      "dia": "Día 1",
      "nombre": "Pierna y glúteo",
      "ejercicios": [
        {
          "nombre": "Prensa",
          "series": 4,
          "reps": "12-15",
          "video": "https://www.youtube.com/watch?v=IZxyjW7MPJQ"
        },
        {
          "nombre": "Hip thrust",
          "series": 4,
          "reps": "12",
          "video": "https://www.youtube.com/watch?v=LM8XHLYJoYs"
        },
        {
          "nombre": "Split squat",
          "series": 3,
          "reps": "10 por pierna",
          "video": "https://www.youtube.com/watch?v=2C-uNgKwPLE"
        },
        {
          "nombre": "Curl femoral",
          "series": 3,
          "reps": "12-15",
          "video": "https://www.youtube.com/watch?v=1Tq3QdYUuHs"
        },
        {
          "nombre": "Abductores en máquina",
          "series": 3,
          "reps": "15",
          "video": "https://www.youtube.com/watch?v=G_8LItOiZ0E"
        },
        {
          "nombre": "Plancha frontal",
          "series": 3,
          "reps": "30 segundos",
          "video": "https://www.youtube.com/watch?v=ASdvN_XEl_c"
        }
      ]
    },
    {
      "dia": "Día 2",
      "nombre": "Espalda alta y core",
      "ejercicios": [
        {
          "nombre": "Jalón al pecho",
          "series": 4,
          "reps": "12",
          "video": "https://www.youtube.com/watch?v=lueEJGjTuPQ"
        },
        {
          "nombre": "Remo con pecho apoyado",
          "series": 4,
          "reps": "12",
          "video": "https://www.youtube.com/watch?v=GZbfZ033f74"
        },
        {
          "nombre": "Face pull",
          "series": 3,
          "reps": "15",
          "video": "https://www.youtube.com/watch?v=rep-qVOkqgk"
        },
        {
          "nombre": "Curl de bíceps en máquina",
          "series": 3,
          "reps": "12",
          "video": "https://www.youtube.com/watch?v=ykJmrZ5v0Oo"
        },
        {
          "nombre": "Pallof press",
          "series": 3,
          "reps": "12 por lado",
          "video": "https://www.youtube.com/watch?v=F0dP8k0tJ4A"
        },
        {
          "nombre": "Dead bug",
          "series": 3,
          "reps": "10 por lado",
          "video": "https://www.youtube.com/watch?v=I5xbsA71v1A"
        }
      ]
    },
    {
      "dia": "Día 3",
      "nombre": "Cardio y movilidad",
      "ejercicios": [
        {
          "nombre": "Caminata inclinada",
          "tiempo": "35-45 minutos",
          "video": "https://www.youtube.com/watch?v=QXj8G6Gk0Lo"
        },
        {
          "nombre": "Movilidad de cadera y espalda",
          "tiempo": "10 minutos",
          "video": "https://www.youtube.com/watch?v=4BOTvaRaDjI"
        },
        {
          "nombre": "Bird dog",
          "series": 3,
          "reps": "10 por lado",
          "video": "https://www.youtube.com/watch?v=wiFNA3sqjCA"
        }
      ]
    },
    {
      "dia": "Día 4",
      "nombre": "Pecho, hombro y tríceps",
      "ejercicios": [
        {
          "nombre": "Press de pecho en máquina",
          "series": 4,
          "reps": "12",
          "video": "https://www.youtube.com/watch?v=FzQ6X8Kp3tE"
        },
        {
          "nombre": "Press inclinado con mancuernas",
          "series": 3,
          "reps": "10-12",
          "video": "https://www.youtube.com/watch?v=8iPEnn-ltC8"
        },
        {
          "nombre": "Elevaciones laterales",
          "series": 3,
          "reps": "15",
          "video": "https://www.youtube.com/watch?v=3VcKaXpzqRo"
        },
        {
          "nombre": "Tríceps en cuerda",
          "series": 3,
          "reps": "12-15",
          "video": "https://www.youtube.com/watch?v=vB5OHsJ3EME"
        },
        {
          "nombre": "Plancha lateral",
          "series": 3,
          "reps": "25 segundos por lado",
          "video": "https://www.youtube.com/watch?v=K2VljzCC16g"
        }
      ]
    },
    {
      "dia": "Día 5",
      "nombre": "Pierna ligera y estabilidad",
      "ejercicios": [
        {
          "nombre": "Step-ups",
          "series": 3,
          "reps": "10 por pierna",
          "video": "https://www.youtube.com/watch?v=dQqApCGd5Ss"
        },
        {
          "nombre": "Extensión de pierna",
          "series": 3,
          "reps": "15",
          "video": "https://www.youtube.com/watch?v=YyvSfVjQeL0"
        },
        {
          "nombre": "Curl femoral",
          "series": 3,
          "reps": "15",
          "video": "https://www.youtube.com/watch?v=1Tq3QdYUuHs"
        },
        {
          "nombre": "Glute bridge",
          "series": 3,
          "reps": "15",
          "video": "https://www.youtube.com/watch?v=m2Zx-57cSok"
        },
        {
          "nombre": "Abductores",
          "series": 3,
          "reps": "15",
          "video": "https://www.youtube.com/watch?v=G_8LItOiZ0E"
        },
        {
          "nombre": "Dead bug",
          "series": 3,
          "reps": "10 por lado",
          "video": "https://www.youtube.com/watch?v=I5xbsA71v1A"
        }
      ]
    },
    {
      "dia": "Día 6",
      "nombre": "Cardio",
      "ejercicios": [
        {
          "nombre": "Natación o cardio continuo",
          "tiempo": "40-50 minutos",
          "video": "https://www.youtube.com/watch?v=Eg7U0jZ3JZ0"
        },
        {
          "nombre": "Estiramientos",
          "tiempo": "10 minutos",
          "video": "https://www.youtube.com/watch?v=2pLT-olgUJs"
        }
      ]
    }
  ]
}

// Function to get today's workout day (cycles through 6 days)
function getTodaysDayIndex(): number {
  // Start date for the routine (January 7, 2026 in local timezone)
  const startDate = new Date(2026, 0, 7) // Year, Month (0-indexed), Day
  const today = new Date()

  // Reset time to midnight for accurate day calculation
  startDate.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)

  // Calculate days elapsed since start
  const diffTime = today.getTime() - startDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  // Cycle through 6 days (0-5)
  return diffDays % 6
}

export default function ExerciseRoutine() {
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const todayIndex = getTodaysDayIndex()
  const currentDayIndex = selectedDay !== null ? selectedDay : todayIndex

  const extractVideoId = (url: string): string | null => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^&?\/\s]{11})/)
    return match ? match[1] : null
  }

  return (
    <div className="space-y-8">
      {/* Program Info */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-2">Programa de Ejercicios</h2>
        <p className="text-lg mb-1"><span className="font-semibold">Duración:</span> {routineData.programa.duracion}</p>
        <p className="text-lg mb-4"><span className="font-semibold">Objetivo:</span> {routineData.programa.objetivo}</p>

        <div className="bg-white/10 rounded-lg p-4 mt-4">
          <h3 className="font-semibold text-lg mb-2">Notas Importantes:</h3>
          <ul className="list-disc list-inside space-y-1">
            {routineData.programa.notas.map((nota, index) => (
              <li key={index}>{nota}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Day Selector */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {routineData.dias.map((day, index) => {
          const isToday = index === todayIndex
          const isSelected = index === currentDayIndex

          return (
            <button
              key={index}
              onClick={() => setSelectedDay(index)}
              className={`p-4 rounded-lg font-semibold transition-all ${
                isSelected
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                  : isToday
                  ? 'bg-blue-100 border-2 border-blue-500 text-blue-700'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } ${isToday && !isSelected ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}
            >
              <div className="text-sm">{day.dia}</div>
              <div className="text-xs mt-1">{day.nombre}</div>
              {isToday && !isSelected && (
                <div className="text-xs mt-1 font-bold">HOY</div>
              )}
            </button>
          )
        })}
      </div>

      {/* Current Day's Exercises */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-800">
            {routineData.dias[currentDayIndex].dia}: {routineData.dias[currentDayIndex].nombre}
          </h2>
          {currentDayIndex === todayIndex && (
            <span className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
              Hoy
            </span>
          )}
        </div>

        <div className="space-y-6">
          {routineData.dias[currentDayIndex].ejercicios.map((ejercicio, index) => {
            const videoId = extractVideoId(ejercicio.video)

            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {index + 1}. {ejercicio.nombre}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      {ejercicio.series && (
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                          {ejercicio.series} series
                        </span>
                      )}
                      {ejercicio.reps && (
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-semibold">
                          {ejercicio.reps} reps
                        </span>
                      )}
                      {ejercicio.tiempo && (
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold">
                          {ejercicio.tiempo}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <a
                      href={ejercicio.video}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors text-center text-sm"
                    >
                      Ver video
                    </a>
                  </div>
                </div>

                {videoId && (
                  <div className="mt-4">
                    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                      <iframe
                        className="absolute top-0 left-0 w-full h-full rounded-lg"
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title={ejercicio.nombre}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Day 7 Rest Day Notice */}
      <div className="bg-gray-100 rounded-lg p-6 text-center">
        <p className="text-gray-700">
          <span className="font-semibold">Día 7:</span> Descanso completo o actividad ligera (caminar, estiramientos)
        </p>
      </div>
    </div>
  )
}
