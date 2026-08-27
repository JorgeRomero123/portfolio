// Dataset construction for the Geospatial Data Explorer.
//
// Everything is held in typed arrays rather than an array of objects: at a few
// hundred thousand points the object allocation is what stalls the main thread,
// and deck.gl can consume Float32Array/Uint8Array attributes directly without
// walking per-row accessors.

export interface GeoDataset {
  name: string
  count: number
  /** [lon, lat] interleaved, length = count * 2 */
  positions: Float32Array
  /** one metric per point, used for colour and elevation weighting */
  values: Float32Array
  /** RGB per point, length = count * 3 */
  colors: Uint8Array
  valueLabel: string
  valueUnit: string
  valueRange: [number, number]
  bounds: [number, number, number, number]
  /** Wall-clock cost of building this dataset, surfaced in the readout. */
  buildMs: number
  /** Tooltip content for a picked index. */
  describe: (index: number) => { title: string; rows: [string, string][] }
}

/** Deterministic PRNG so the demo dataset is identical on every load. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Box-Muller, so clusters fall off normally rather than as uniform discs. */
function gaussian(rand: () => number): number {
  let u = 0
  while (u === 0) u = rand()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand())
}

interface Metro {
  name: string
  lon: number
  lat: number
  /** rough metro population in millions, used as a sampling weight */
  weight: number
}

const METROS: Metro[] = [
  { name: 'Seattle', lon: -122.33, lat: 47.61, weight: 4.0 },
  { name: 'Portland', lon: -122.68, lat: 45.52, weight: 2.5 },
  { name: 'San Francisco', lon: -122.42, lat: 37.77, weight: 4.7 },
  { name: 'Los Angeles', lon: -118.24, lat: 34.05, weight: 13.2 },
  { name: 'San Diego', lon: -117.16, lat: 32.72, weight: 3.3 },
  { name: 'Las Vegas', lon: -115.14, lat: 36.17, weight: 2.3 },
  { name: 'Phoenix', lon: -112.07, lat: 33.45, weight: 4.9 },
  { name: 'Salt Lake City', lon: -111.89, lat: 40.76, weight: 1.3 },
  { name: 'Denver', lon: -104.99, lat: 39.74, weight: 2.9 },
  { name: 'Albuquerque', lon: -106.65, lat: 35.08, weight: 0.9 },
  { name: 'Dallas', lon: -96.8, lat: 32.78, weight: 7.6 },
  { name: 'Houston', lon: -95.37, lat: 29.76, weight: 7.1 },
  { name: 'San Antonio', lon: -98.49, lat: 29.42, weight: 2.6 },
  { name: 'Austin', lon: -97.74, lat: 30.27, weight: 2.3 },
  { name: 'Kansas City', lon: -94.58, lat: 39.1, weight: 2.2 },
  { name: 'Minneapolis', lon: -93.27, lat: 44.98, weight: 3.7 },
  { name: 'Chicago', lon: -87.63, lat: 41.88, weight: 9.6 },
  { name: 'St. Louis', lon: -90.2, lat: 38.63, weight: 2.8 },
  { name: 'Memphis', lon: -90.05, lat: 35.15, weight: 1.3 },
  { name: 'Nashville', lon: -86.78, lat: 36.16, weight: 2.0 },
  { name: 'Atlanta', lon: -84.39, lat: 33.75, weight: 6.1 },
  { name: 'Miami', lon: -80.19, lat: 25.76, weight: 6.2 },
  { name: 'Orlando', lon: -81.38, lat: 28.54, weight: 2.7 },
  { name: 'Charlotte', lon: -80.84, lat: 35.23, weight: 2.7 },
  { name: 'Washington DC', lon: -77.04, lat: 38.91, weight: 6.4 },
  { name: 'Philadelphia', lon: -75.17, lat: 39.95, weight: 6.2 },
  { name: 'New York', lon: -74.01, lat: 40.71, weight: 19.5 },
  { name: 'Boston', lon: -71.06, lat: 42.36, weight: 4.9 },
  { name: 'Detroit', lon: -83.05, lat: 42.33, weight: 4.3 },
  { name: 'Cleveland', lon: -81.69, lat: 41.5, weight: 2.1 },
  { name: 'Pittsburgh', lon: -79.996, lat: 40.44, weight: 2.4 },
  { name: 'Indianapolis', lon: -86.16, lat: 39.77, weight: 2.1 },
]

const INDEX_BY_NAME = new Map(METROS.map((m, i) => [m.name, i]))

/** Plausible long-haul corridors, so the synthetic data has road-like structure. */
const CORRIDOR_NAMES: [string, string][] = [
  ['Seattle', 'Portland'], ['Portland', 'San Francisco'], ['San Francisco', 'Los Angeles'],
  ['Los Angeles', 'San Diego'], ['Los Angeles', 'Las Vegas'], ['Las Vegas', 'Salt Lake City'],
  ['Los Angeles', 'Phoenix'], ['Phoenix', 'Albuquerque'], ['Salt Lake City', 'Denver'],
  ['Denver', 'Albuquerque'], ['Denver', 'Kansas City'], ['Albuquerque', 'Dallas'],
  ['Dallas', 'Houston'], ['Dallas', 'Austin'], ['Austin', 'San Antonio'],
  ['Houston', 'San Antonio'], ['Dallas', 'Kansas City'], ['Kansas City', 'St. Louis'],
  ['Minneapolis', 'Chicago'], ['Chicago', 'St. Louis'], ['Chicago', 'Detroit'],
  ['Chicago', 'Indianapolis'], ['Indianapolis', 'Cleveland'], ['Detroit', 'Cleveland'],
  ['Cleveland', 'Pittsburgh'], ['Pittsburgh', 'Philadelphia'], ['Philadelphia', 'New York'],
  ['New York', 'Boston'], ['New York', 'Washington DC'], ['Washington DC', 'Charlotte'],
  ['Charlotte', 'Atlanta'], ['Atlanta', 'Orlando'], ['Orlando', 'Miami'],
  ['Atlanta', 'Nashville'], ['Nashville', 'Memphis'], ['Memphis', 'St. Louis'],
  ['Houston', 'Atlanta'], ['Minneapolis', 'Denver'], ['Seattle', 'Salt Lake City'],
  ['Indianapolis', 'Washington DC'],
]

const CORRIDORS = CORRIDOR_NAMES.map(([a, b]) => [INDEX_BY_NAME.get(a)!, INDEX_BY_NAME.get(b)!])

/** Turbo-ish ramp: slow traffic reads cool, free-flowing reads warm. */
export const RAMP: [number, number, number][] = [
  [38, 70, 160], [40, 150, 200], [40, 190, 150],
  [180, 210, 60], [245, 180, 45], [225, 85, 55],
]

function rampColor(t: number, out: Uint8Array, offset: number) {
  const clamped = t < 0 ? 0 : t > 1 ? 1 : t
  const scaled = clamped * (RAMP.length - 1)
  const i = Math.min(RAMP.length - 2, Math.floor(scaled))
  const f = scaled - i
  const a = RAMP[i]
  const b = RAMP[i + 1]
  out[offset] = a[0] + (b[0] - a[0]) * f
  out[offset + 1] = a[1] + (b[1] - a[1]) * f
  out[offset + 2] = a[2] + (b[2] - a[2]) * f
}

function paint(values: Float32Array, min: number, max: number): Uint8Array {
  const colors = new Uint8Array(values.length * 3)
  const span = max - min || 1
  for (let i = 0; i < values.length; i++) {
    rampColor((values[i] - min) / span, colors, i * 3)
  }
  return colors
}

function computeBounds(positions: Float32Array): [number, number, number, number] {
  let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity
  for (let i = 0; i < positions.length; i += 2) {
    const lon = positions[i]
    const lat = positions[i + 1]
    if (lon < minLon) minLon = lon
    if (lon > maxLon) maxLon = lon
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
  }
  return [minLon, minLat, maxLon, maxLat]
}

/**
 * Simulated fleet telemetry: ~62% clustered in metros at urban speeds, the rest
 * strung along inter-city corridors at highway speeds. Synthetic, not observed
 * data, but it has the density contrast and linear structure that make a
 * rendering path behave the way real probe data does.
 */
export function generateFleetDataset(count: number, seed = 42): GeoDataset {
  const started = performance.now()
  const rand = mulberry32(seed)
  const positions = new Float32Array(count * 2)
  const values = new Float32Array(count)
  const origin = new Uint8Array(count) // metro index, for the tooltip
  const onRoad = new Uint8Array(count)

  const totalWeight = METROS.reduce((s, m) => s + m.weight, 0)

  for (let i = 0; i < count; i++) {
    if (rand() < 0.62) {
      // Urban cluster: pick a metro proportional to population.
      let pick = rand() * totalWeight
      let m = 0
      while (m < METROS.length - 1 && pick > METROS[m].weight) {
        pick -= METROS[m].weight
        m++
      }
      const metro = METROS[m]
      const spread = 0.06 + Math.sqrt(metro.weight) * 0.055
      positions[i * 2] = metro.lon + gaussian(rand) * spread
      positions[i * 2 + 1] = metro.lat + gaussian(rand) * spread * 0.8
      values[i] = 18 + rand() * 34 + (1 - Math.min(1, metro.weight / 12)) * 12
      origin[i] = m
      onRoad[i] = 0
    } else {
      // Corridor: sample along the segment with a little lateral scatter.
      const c = CORRIDORS[(rand() * CORRIDORS.length) | 0]
      const a = METROS[c[0]]
      const b = METROS[c[1]]
      const t = rand()
      const dx = b.lon - a.lon
      const dy = b.lat - a.lat
      const len = Math.hypot(dx, dy) || 1
      const jitter = gaussian(rand) * 0.09
      positions[i * 2] = a.lon + dx * t + (-dy / len) * jitter
      positions[i * 2 + 1] = a.lat + dy * t + (dx / len) * jitter
      values[i] = 78 + rand() * 42
      origin[i] = t < 0.5 ? c[0] : c[1]
      onRoad[i] = 1
    }
  }

  const colors = paint(values, 15, 120)

  return {
    name: 'Simulated fleet telemetry',
    count,
    positions,
    values,
    colors,
    valueLabel: 'Average speed',
    valueUnit: 'km/h',
    valueRange: [15, 120],
    bounds: computeBounds(positions),
    buildMs: performance.now() - started,
    describe: (i) => ({
      title: onRoad[i] ? 'Corridor probe' : 'Urban probe',
      rows: [
        ['Nearest metro', METROS[origin[i]].name],
        ['Average speed', `${values[i].toFixed(1)} km/h`],
        ['Position', `${positions[i * 2 + 1].toFixed(4)}, ${positions[i * 2].toFixed(4)}`],
      ],
    }),
  }
}

const LAT_KEYS = ['lat', 'latitude', 'y', 'lat_deg', 'ycoord', 'y_coord']
const LON_KEYS = ['lon', 'lng', 'long', 'longitude', 'x', 'lon_deg', 'xcoord', 'x_coord']

function detectDelimiter(line: string): string {
  const counts = [',', ';', '\t', '|'].map((d) => [d, line.split(d).length] as const)
  counts.sort((a, b) => b[1] - a[1])
  return counts[0][1] > 1 ? counts[0][0] : ','
}

/** Minimal RFC-4180-ish splitter: handles quoted fields and escaped quotes. */
function splitRow(line: string, delimiter: string): string[] {
  const out: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          field += '"'
          i++
        } else {
          quoted = false
        }
      } else {
        field += ch
      }
    } else if (ch === '"') {
      quoted = true
    } else if (ch === delimiter) {
      out.push(field)
      field = ''
    } else {
      field += ch
    }
  }
  out.push(field)
  return out
}

export class CsvError extends Error {}

/**
 * Parse a CSV into the same typed-array shape as the demo dataset. Latitude and
 * longitude columns are detected by header name; the colour metric is the first
 * other numeric column, if there is one.
 */
export function parseCsvDataset(text: string, fileName: string): GeoDataset {
  const started = performance.now()
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length < 2) throw new CsvError('That file has no data rows.')

  const delimiter = detectDelimiter(lines[0])
  const header = splitRow(lines[0], delimiter).map((h) => h.trim())
  const normalized = header.map((h) => h.toLowerCase().replace(/[^a-z0-9_]/g, ''))

  const latIdx = normalized.findIndex((h) => LAT_KEYS.includes(h))
  const lonIdx = normalized.findIndex((h) => LON_KEYS.includes(h))
  if (latIdx === -1 || lonIdx === -1) {
    throw new CsvError(
      `Could not find latitude and longitude columns. Looked for ${LAT_KEYS.join('/')} and ${LON_KEYS.join('/')}, found: ${header.join(', ')}`
    )
  }

  const rows: string[][] = []
  for (let i = 1; i < lines.length; i++) {
    const cells = splitRow(lines[i], delimiter)
    const lat = Number(cells[latIdx])
    const lon = Number(cells[lonIdx])
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) continue
    rows.push(cells)
  }
  if (rows.length === 0) throw new CsvError('No rows had a usable latitude/longitude pair.')

  // Colour metric: first numeric column that is not the coordinate pair.
  let valueIdx = -1
  for (let c = 0; c < header.length; c++) {
    if (c === latIdx || c === lonIdx) continue
    const sample = rows.slice(0, 50).map((r) => Number(r[c]))
    if (sample.filter(Number.isFinite).length > sample.length * 0.8) {
      valueIdx = c
      break
    }
  }

  const count = rows.length
  const positions = new Float32Array(count * 2)
  const values = new Float32Array(count)
  let min = Infinity
  let max = -Infinity

  for (let i = 0; i < count; i++) {
    positions[i * 2] = Number(rows[i][lonIdx])
    positions[i * 2 + 1] = Number(rows[i][latIdx])
    const v = valueIdx === -1 ? 0 : Number(rows[i][valueIdx])
    values[i] = Number.isFinite(v) ? v : 0
    if (values[i] < min) min = values[i]
    if (values[i] > max) max = values[i]
  }
  if (!Number.isFinite(min) || min === max) {
    min = 0
    max = 1
  }

  return {
    name: fileName,
    count,
    positions,
    values,
    colors: paint(values, min, max),
    valueLabel: valueIdx === -1 ? 'Uniform' : header[valueIdx],
    valueUnit: '',
    valueRange: [min, max],
    bounds: computeBounds(positions),
    buildMs: performance.now() - started,
    describe: (i) => ({
      title: `Row ${i + 1}`,
      rows: header
        .map((h, c) => [h, rows[i][c] ?? ''] as [string, string])
        .filter(([, v]) => v !== '')
        .slice(0, 6),
    }),
  }
}
