'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DeckGL, { type DeckGLRef } from '@deck.gl/react'
import { BitmapLayer, ScatterplotLayer } from '@deck.gl/layers'
import { HeatmapLayer, HexagonLayer } from '@deck.gl/aggregation-layers'
import { TileLayer } from '@deck.gl/geo-layers'
import { WebMercatorViewport, type PickingInfo, type MapViewState } from '@deck.gl/core'

import { CsvError, generateFleetDataset, parseCsvDataset, RAMP, type GeoDataset } from './data'

type LayerType = 'scatter' | 'hexagon' | 'heatmap'
type Basemap = 'map' | 'none'

// Raster basemap drawn by deck.gl itself. Keeping the basemap inside the same
// WebGL canvas as the data avoids compositing a second canvas underneath, which
// is what a MapLibre instance would require.
//
// OpenStreetMap's standard tiles are used because they need no API key; CARTO's
// raster basemaps now return a watermarked "API KEY REQUIRED" tile instead.
const BASEMAP_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

const POINT_COUNTS = [25_000, 100_000, 250_000, 500_000]

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: -96,
  latitude: 38.5,
  zoom: 3.4,
  pitch: 0,
  bearing: 0,
}

export default function GeoExplorer() {
  const deckRef = useRef<DeckGLRef>(null)

  const [pointCount, setPointCount] = useState(100_000)
  // Generating a dataset is expensive, so it is state produced by event
  // handlers, never derived during render: useMemo is only a cache hint, and
  // when it is dropped a re-render would rebuild half a million points.
  const [dataset, setDataset] = useState<GeoDataset>(() => generateFleetDataset(100_000))
  const [isCustom, setIsCustom] = useState(false)
  const [csvError, setCsvError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const [layerType, setLayerType] = useState<LayerType>('scatter')
  const [basemap, setBasemap] = useState<Basemap>('map')
  const [radius, setRadius] = useState(60)
  const [opacity, setOpacity] = useState(0.7)
  const [hexRadius, setHexRadius] = useState(12_000)
  const [elevationScale, setElevationScale] = useState(60)

  const [viewState, setViewState] = useState<MapViewState>(INITIAL_VIEW_STATE)
  const [fps, setFps] = useState<number | null>(null)
  const [interacting, setInteracting] = useState(false)
  const idleTimer = useRef<number | undefined>(undefined)

  const selectPointCount = useCallback((n: number) => {
    setPointCount(n)
    setIsCustom(false)
    setCsvError(null)
    setDataset(generateFleetDataset(n))
  }, [])

  // Frame rate is only meaningful while the camera is moving: deck.gl does not
  // redraw when nothing changes, so a free-running counter would report the
  // browser's idle 60fps and say nothing about the cost of the layer.
  const handleViewStateChange = useCallback((next: MapViewState) => {
    setViewState(next)
    setInteracting(true)
    window.clearTimeout(idleTimer.current)
    idleTimer.current = window.setTimeout(() => setInteracting(false), 600)
  }, [])

  useEffect(() => () => window.clearTimeout(idleTimer.current), [])

  useEffect(() => {
    if (!interacting) return
    let raf = 0
    let frames = 0
    let since = performance.now()
    const tick = () => {
      frames += 1
      const now = performance.now()
      if (now - since >= 400) {
        setFps((frames * 1000) / (now - since))
        frames = 0
        since = now
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [interacting])

  const fitToBounds = useCallback((bounds: [number, number, number, number]) => {
    const el = deckRef.current?.deck?.getCanvas()
    const width = el?.clientWidth || 900
    const height = el?.clientHeight || 560
    const [minLon, minLat, maxLon, maxLat] = bounds
    if (minLon === maxLon || minLat === maxLat) {
      setViewState((v) => ({ ...v, longitude: minLon, latitude: minLat, zoom: 10 }))
      return
    }
    const fitted = new WebMercatorViewport({ width, height }).fitBounds(
      [
        [minLon, minLat],
        [maxLon, maxLat],
      ],
      { padding: 48 }
    )
    setViewState((v) => ({
      ...v,
      longitude: fitted.longitude,
      latitude: fitted.latitude,
      zoom: Math.min(fitted.zoom, 14),
    }))
  }, [])

  const loadCsv = useCallback(
    async (file: File) => {
      setCsvError(null)
      try {
        const next = parseCsvDataset(await file.text(), file.name)
        setDataset(next)
        setIsCustom(true)
        fitToBounds(next.bounds)
      } catch (err) {
        setCsvError(
          err instanceof CsvError ? err.message : 'Could not read that file as CSV.'
        )
      }
    },
    [fitToBounds]
  )

  const resetToDemo = useCallback(() => {
    setIsCustom(false)
    setCsvError(null)
    setDataset(generateFleetDataset(pointCount))
    setViewState(INITIAL_VIEW_STATE)
  }, [pointCount])

  // Pitch belongs to the layer choice, so it is set where that choice is made
  // rather than in an effect that reacts to it afterwards.
  const selectLayer = useCallback((value: LayerType) => {
    setLayerType(value)
    setViewState((v) => ({ ...v, pitch: value === 'hexagon' ? 45 : 0 }))
  }, [])

  const basemapLayer = useMemo(() => {
    if (basemap === 'none') return null
    return new TileLayer<ImageBitmap>({
      id: 'basemap',
      data: BASEMAP_TILES,
      opacity: 0.55,
      minZoom: 0,
      maxZoom: 19,
      tileSize: 256,
      renderSubLayers: (props) => {
        // Pass the sublayer props straight through; TileLayer relies on them for
        // its own bookkeeping. `data` is destructured out because it carries the
        // decoded image, which BitmapLayer takes as `image` instead.
        const { data, tile, ...rest } = props
        const { boundingBox } = tile
        return new BitmapLayer({
          ...rest,
          image: data,
          bounds: [
            boundingBox[0][0],
            boundingBox[0][1],
            boundingBox[1][0],
            boundingBox[1][1],
          ],
        })
      },
    })
  }, [basemap])

  // Aggregation layers read through accessors rather than binary attributes,
  // which HexagonLayer/HeatmapLayer do not consume for their weights. The index
  // array is built only when one of those layers is actually selected.
  const aggregationRows = useMemo(() => {
    if (layerType === 'scatter') return null
    const rows = new Array<number>(dataset.count)
    for (let i = 0; i < dataset.count; i++) rows[i] = i
    return rows
  }, [layerType, dataset])

  const dataLayers = useMemo(() => {
    if (layerType === 'scatter') {
      return [
        new ScatterplotLayer({
          id: 'points',
          data: {
            length: dataset.count,
            attributes: {
              getPosition: { value: dataset.positions, size: 2 },
              getFillColor: { value: dataset.colors, size: 3, normalized: true },
            },
          },
          radiusUnits: 'meters',
          getRadius: radius * 12,
          radiusMinPixels: 0.6,
          radiusMaxPixels: 24,
          opacity,
          pickable: true,
        }),
      ]
    }

    if (layerType === 'hexagon') {
      return [
        new HexagonLayer({
          id: 'hexagons',
          data: aggregationRows!,
          getPosition: (i: number) => [dataset.positions[i * 2], dataset.positions[i * 2 + 1]],
          getColorWeight: (i: number) => dataset.values[i],
          getElevationWeight: (i: number) => dataset.values[i],
          colorAggregation: 'MEAN',
          elevationAggregation: 'MEAN',
          colorRange: RAMP,
          radius: hexRadius,
          elevationScale,
          extruded: true,
          coverage: 0.92,
          opacity,
          pickable: true,
        }),
      ]
    }

    return [
      new HeatmapLayer({
        id: 'heatmap',
        data: aggregationRows!,
        getPosition: (i: number) => [dataset.positions[i * 2], dataset.positions[i * 2 + 1]],
        getWeight: (i: number) => dataset.values[i],
        colorRange: RAMP,
        radiusPixels: Math.max(12, radius / 2),
        intensity: 1,
        threshold: 0.05,
        opacity,
      }),
    ]
  }, [layerType, dataset, radius, opacity, hexRadius, elevationScale, aggregationRows])

  const layers = useMemo(
    () => (basemapLayer ? [basemapLayer, ...dataLayers] : dataLayers),
    [basemapLayer, dataLayers]
  )

  const getTooltip = useCallback(
    (info: PickingInfo) => {
      if (info.index < 0 || !info.picked) return null
      if (info.layer?.id === 'hexagons') {
        const bin = info.object as
          | { points?: unknown[]; count?: number; elevationValue?: number }
          | undefined
        if (!bin) return null
        const count = bin.count ?? bin.points?.length
        const mean = bin.elevationValue
        const rows = [
          count === undefined ? '' : `<div>${count.toLocaleString()} points</div>`,
          mean === undefined
            ? ''
            : `<div>${dataset.valueLabel.toLowerCase()} ${mean.toFixed(1)} ${dataset.valueUnit}</div>`,
        ].join('')
        return {
          html: `<div style="font-weight:600;margin-bottom:2px">Hex bin</div>${rows}`,
          style: TOOLTIP_STYLE,
        }
      }
      const d = dataset.describe(info.index)
      const rows = d.rows
        .map(
          ([k, v]) =>
            `<div style="display:flex;gap:10px"><span style="opacity:.65">${escapeHtml(k)}</span><span>${escapeHtml(v)}</span></div>`
        )
        .join('')
      return {
        html: `<div style="font-weight:600;margin-bottom:3px">${escapeHtml(d.title)}</div>${rows}`,
        style: TOOLTIP_STYLE,
      }
    },
    [dataset]
  )

  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-[280px_1fr] gap-4">
        {/* Controls */}
        <div className="space-y-4">
          <Panel title="Data">
            <div className="space-y-3">
              <div className="text-xs text-gray-500">
                {isCustom ? (
                  <>
                    <span className="font-medium text-gray-700">{dataset.name}</span>
                    <button
                      onClick={resetToDemo}
                      className="ml-2 text-blue-600 hover:text-blue-800 underline"
                    >
                      use demo data
                    </button>
                  </>
                ) : (
                  <>Simulated fleet telemetry, generated in your browser.</>
                )}
              </div>

              {!isCustom && (
                <div className="grid grid-cols-2 gap-1.5">
                  {POINT_COUNTS.map((n) => (
                    <button
                      key={n}
                      onClick={() => selectPointCount(n)}
                      className={`px-2 py-1.5 text-xs rounded-md border transition-colors ${
                        pointCount === n
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {n.toLocaleString()}
                    </button>
                  ))}
                </div>
              )}

              <label
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDragging(false)
                  const file = e.dataTransfer.files?.[0]
                  if (file) void loadCsv(file)
                }}
                className={`block border-2 border-dashed rounded-lg px-3 py-4 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void loadCsv(file)
                    e.target.value = ''
                  }}
                />
                <span className="text-xs text-gray-600">
                  Drop a CSV with <code className="text-[11px]">lat</code> /{' '}
                  <code className="text-[11px]">lon</code> columns
                </span>
              </label>

              {csvError && (
                <p className="text-xs text-red-600 leading-relaxed">{csvError}</p>
              )}
            </div>
          </Panel>

          <Panel title="Layer">
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    ['scatter', 'Points'],
                    ['hexagon', 'Hex 3D'],
                    ['heatmap', 'Heatmap'],
                  ] as [LayerType, string][]
                ).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => selectLayer(value)}
                    className={`px-2 py-1.5 text-xs rounded-md border transition-colors ${
                      layerType === value
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {layerType === 'scatter' && (
                <Slider
                  label="Point size"
                  value={radius}
                  min={10}
                  max={200}
                  onChange={setRadius}
                  format={(v) => `${v}`}
                />
              )}
              {layerType === 'hexagon' && (
                <>
                  <Slider
                    label="Bin radius"
                    value={hexRadius}
                    min={2000}
                    max={40000}
                    step={1000}
                    onChange={setHexRadius}
                    format={(v) => `${(v / 1000).toFixed(0)} km`}
                  />
                  <Slider
                    label="Elevation"
                    value={elevationScale}
                    min={0}
                    max={300}
                    onChange={setElevationScale}
                    format={(v) => `${v}`}
                  />
                </>
              )}
              {layerType === 'heatmap' && (
                <Slider
                  label="Blur radius"
                  value={radius}
                  min={20}
                  max={200}
                  onChange={setRadius}
                  format={(v) => `${Math.max(12, Math.round(v / 2))} px`}
                />
              )}

              <Slider
                label="Opacity"
                value={Math.round(opacity * 100)}
                min={10}
                max={100}
                onChange={(v) => setOpacity(v / 100)}
                format={(v) => `${v}%`}
              />
            </div>
          </Panel>

          <Panel title="Basemap">
            <div className="grid grid-cols-2 gap-1.5">
              {(['map', 'none'] as Basemap[]).map((value) => (
                <button
                  key={value}
                  onClick={() => setBasemap(value)}
                  className={`px-2 py-1.5 text-xs rounded-md border capitalize transition-colors ${
                    basemap === value
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </Panel>
        </div>

        {/* Map */}
        <div
          className={`relative rounded-xl overflow-hidden border border-gray-200 shadow-md ${
            basemap === 'none' ? 'bg-[#0e1116]' : 'bg-gray-100'
          }`}
          style={{ height: 'min(72vh, 640px)' }}
        >
          <DeckGL
            ref={deckRef}
            viewState={viewState}
            onViewStateChange={(e) => handleViewStateChange(e.viewState as MapViewState)}
            controller={{ dragRotate: true }}
            layers={layers}
            getTooltip={getTooltip}
            style={{ position: 'absolute', inset: '0' }}
          />

          {/* Readout */}
          <div className="absolute top-3 left-3 rounded-lg bg-white/90 backdrop-blur px-3 py-2 shadow-sm text-[11px] leading-relaxed text-gray-700 pointer-events-none">
            <div className="font-semibold text-gray-900">
              {dataset.count.toLocaleString()} points
            </div>
            {fps === null ? (
              <div className="font-mono text-gray-400">drag the map to measure</div>
            ) : (
              <div className="font-mono">
                {fps.toFixed(0)} fps
                <span className="text-gray-400">
                  {' '}
                  · {(1000 / fps).toFixed(1)}ms/frame
                </span>
              </div>
            )}
            <div className="text-gray-500">built in {dataset.buildMs.toFixed(0)}ms</div>
          </div>

          <Legend dataset={dataset} />

          {basemap !== 'none' && (
            <div className="absolute bottom-1 right-2 text-[9px] text-gray-500/80 pointer-events-none">
              © OpenStreetMap contributors
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">
        Rendered entirely with deck.gl, basemap included, in a single WebGL canvas. Positions
        and colours are uploaded to the GPU as typed-array attributes rather than per-row
        accessors, which is what keeps half a million points interactive. The demo dataset is synthetic, generated in your
        browser from a seeded PRNG. Nothing you drop here is uploaded anywhere.
      </p>
    </div>
  )
}

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(17,24,39,0.92)',
  color: 'white',
  fontSize: '11px',
  padding: '7px 9px',
  borderRadius: '6px',
  lineHeight: '1.45',
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        {title}
      </h2>
      {children}
    </div>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  format: (v: number) => string
}) {
  return (
    <label className="block">
      <span className="flex justify-between text-xs text-gray-600 mb-1">
        <span>{label}</span>
        <span className="font-mono text-gray-400">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-600"
      />
    </label>
  )
}

function Legend({ dataset }: { dataset: GeoDataset }) {
  const [min, max] = dataset.valueRange
  return (
    <div className="absolute bottom-3 left-3 rounded-lg bg-white/90 backdrop-blur px-3 py-2 shadow-sm pointer-events-none">
      <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
        {dataset.valueLabel}
      </div>
      <div
        className="h-2 w-40 rounded-full"
        style={{
          background:
            'linear-gradient(90deg, rgb(38,70,160), rgb(40,150,200), rgb(40,190,150), rgb(180,210,60), rgb(245,180,45), rgb(225,85,55))',
        }}
      />
      <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-0.5 w-40">
        <span>{min.toFixed(0)}</span>
        <span>
          {max.toFixed(0)} {dataset.valueUnit}
        </span>
      </div>
    </div>
  )
}
