import type { LevelKind } from './curriculum'

const PATHS: Record<LevelKind, React.ReactNode> = {
  // Bombilla: teoría
  teoria: (
    <>
      <path d="M9 18h6M10 21h4" strokeLinecap="round" />
      <path d="M12 3a6 6 0 00-3.6 10.8c.5.4.8 1 .9 1.6l.1.6h5.2l.1-.6c.1-.6.4-1.2.9-1.6A6 6 0 0012 3z" />
    </>
  ),
  // Micrófono: voz
  voz: (
    <>
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21M9 21h6" strokeLinecap="round" />
    </>
  ),
  // Ondas: oído
  oido: (
    <>
      <path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4" strokeLinecap="round" />
    </>
  ),
  // Pulmón/aire: aliento
  aliento: (
    <>
      <path d="M12 3v8" strokeLinecap="round" />
      <path d="M12 11c0-2-2-3-3.5-3S5 9.5 5 12s1 8 3.5 8S12 17 12 11z" strokeLinejoin="round" />
      <path d="M12 11c0-2 2-3 3.5-3S19 9.5 19 12s-1 8-3.5 8S12 17 12 11z" strokeLinejoin="round" />
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
