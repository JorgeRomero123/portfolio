import type { LevelKind } from './curriculum'

const PATHS: Record<LevelKind, React.ReactNode> = {
  // Bombilla: teoría
  teoria: (
    <>
      <path d="M9 18h6M10 21h4" strokeLinecap="round" />
      <path d="M12 3a6 6 0 00-3.6 10.8c.5.4.8 1 .9 1.6l.1.6h5.2l.1-.6c.1-.6.4-1.2.9-1.6A6 6 0 0012 3z" />
    </>
  ),
  // Púa sobre cuerdas: práctica
  practica: (
    <>
      <path d="M12 3c3.3 0 6 2.2 6 5 0 3.3-2.7 6.4-6 13-3.3-6.6-6-9.7-6-13 0-2.8 2.7-5 6-5z" />
      <path d="M12 8v4" strokeLinecap="round" />
    </>
  ),
  // Ondas: oído
  oido: (
    <>
      <path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4" strokeLinecap="round" />
    </>
  ),
  // Rejilla: mástil
  mastil: (
    <>
      <path d="M4 4v16M9.3 4v16M14.7 4v16M20 4v16" strokeLinecap="round" />
      <path d="M4 9h16M4 15h16" strokeLinecap="round" />
    </>
  ),
  // Metrónomo: ritmo
  ritmo: (
    <>
      <path d="M9 3h6l4 18H5L9 3z" strokeLinejoin="round" />
      <path d="M17 8L8 15" strokeLinecap="round" />
    </>
  ),
}

export default function LevelIcon({ kind, size = 22 }: { kind: LevelKind; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      {PATHS[kind]}
    </svg>
  )
}
