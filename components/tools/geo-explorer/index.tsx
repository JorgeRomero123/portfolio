'use client'

import dynamic from 'next/dynamic'

// deck.gl and MapLibre both touch `window` and WebGL at module scope, so the
// explorer is loaded client-side only.
const GeoExplorer = dynamic(() => import('./GeoExplorer'), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border border-gray-200 bg-gray-50 animate-pulse" style={{ height: 'min(72vh, 640px)' }} />
  ),
})

export default function GeoExplorerLoader() {
  return <GeoExplorer />
}
