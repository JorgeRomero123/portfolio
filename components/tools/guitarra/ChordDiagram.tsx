import type { Chord } from './music'

const STRING_GAP = 18
const FRET_GAP = 22
const X0 = 18
const Y0 = 34
const FRETS_SHOWN = 5

interface Props {
  chord: Chord
  /** Ancho en px del SVG renderizado */
  width?: number
  /** Oculta los números de dedo bajo el diagrama */
  hideFingers?: boolean
  className?: string
}

/**
 * Diagrama de acorde en SVG. Se lee como si tuvieras la guitarra de frente:
 * la cuerda más grave (6ª) queda a la izquierda.
 */
export default function ChordDiagram({ chord, width = 124, hideFingers = false, className = '' }: Props) {
  const played = chord.frets.filter((f) => f > 0)
  const maxFret = played.length ? Math.max(...played) : 1
  const baseFret = maxFret > FRETS_SHOWN ? Math.min(...played) : 1
  const showNut = baseFret === 1

  const stringX = (i: number) => X0 + i * STRING_GAP
  const fretY = (f: number) => Y0 + f * FRET_GAP
  const dotY = (f: number) => Y0 + (f - 0.5) * FRET_GAP

  const boardWidth = STRING_GAP * 5
  const boardHeight = FRET_GAP * FRETS_SHOWN

  return (
    <svg
      viewBox="0 0 126 172"
      width={width}
      height={(width * 172) / 126}
      className={className}
      role="img"
      aria-label={`Diagrama del acorde ${chord.name}`}
    >
      {/* Marcadores de cuerda al aire / cuerda muda */}
      {chord.frets.map((f, i) => {
        const x = stringX(i)
        if (f === -1) {
          return (
            <g key={i} stroke="#9ca3af" strokeWidth="1.6" strokeLinecap="round">
              <line x1={x - 4} y1={18} x2={x + 4} y2={26} />
              <line x1={x - 4} y1={26} x2={x + 4} y2={18} />
            </g>
          )
        }
        if (f === 0) {
          return <circle key={i} cx={x} cy={22} r={4} fill="none" stroke="#4b5563" strokeWidth="1.6" />
        }
        return null
      })}

      {/* Cejuela o indicador de traste inicial */}
      {showNut ? (
        <rect x={X0 - 1} y={Y0 - 4} width={boardWidth + 2} height={4} rx={1} fill="#111827" />
      ) : (
        <text x={X0 - 8} y={dotY(1) + 4} textAnchor="end" fontSize="11" fill="#6b7280" fontWeight="600">
          {baseFret}
        </text>
      )}

      {/* Trastes */}
      {Array.from({ length: FRETS_SHOWN + 1 }, (_, f) => (
        <line
          key={f}
          x1={X0}
          y1={fretY(f)}
          x2={X0 + boardWidth}
          y2={fretY(f)}
          stroke="#d1d5db"
          strokeWidth="1"
        />
      ))}

      {/* Cuerdas */}
      {chord.frets.map((_, i) => (
        <line
          key={i}
          x1={stringX(i)}
          y1={Y0}
          x2={stringX(i)}
          y2={Y0 + boardHeight}
          stroke="#9ca3af"
          strokeWidth={0.7 + (5 - i) * 0.18}
        />
      ))}

      {/* Cejilla */}
      {chord.barre && (
        <rect
          x={stringX(6 - chord.barre.fromString) - 6}
          y={dotY(chord.barre.fret - baseFret + 1) - 6}
          width={(chord.barre.fromString - chord.barre.toString) * STRING_GAP + 12}
          height={12}
          rx={6}
          fill="#0070f3"
        />
      )}

      {/* Dedos pisados */}
      {chord.frets.map((f, i) => {
        if (f <= 0) return null
        const rel = f - baseFret + 1
        if (rel < 1 || rel > FRETS_SHOWN) return null
        const isBarreNote =
          chord.barre && f === chord.barre.fret && 6 - i <= chord.barre.fromString && 6 - i >= chord.barre.toString
        if (isBarreNote) return null
        return <circle key={i} cx={stringX(i)} cy={dotY(rel)} r={6} fill="#0070f3" />
      })}

      {/* Números de dedo */}
      {!hideFingers &&
        chord.fingers.map((finger, i) =>
          finger > 0 && chord.frets[i] > 0 ? (
            <text
              key={i}
              x={stringX(i)}
              y={Y0 + boardHeight + 15}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill="#6b7280"
            >
              {finger}
            </text>
          ) : null
        )}
    </svg>
  )
}
