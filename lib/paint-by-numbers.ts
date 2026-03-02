// Pure utility functions for paint-by-numbers generation — no React, only Canvas/Web APIs.
// This file is designed to be extractable to any project without framework dependencies.

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface PBNConfig {
  colorCount: number;       // 4–30
  minRegionSize: number;    // minimum pixels for a region before merging
  showTint: boolean;        // light color fill inside outline regions
  maxPreviewDim: number;    // max dimension for preview processing
}

export interface PaintRecipe {
  parts: { paint: string; amount: number }[];
}

export interface PaletteEntry {
  index: number;            // 1-based display number
  r: number;
  g: number;
  b: number;
  hex: string;
  recipe: PaintRecipe;
  pixelCount: number;
}

export interface PBNResult {
  palette: PaletteEntry[];
  outlineCanvas: HTMLCanvasElement;
  quantizedCanvas: HTMLCanvasElement;
  paletteCardCanvas: HTMLCanvasElement;
  pixelMap: Uint16Array;    // cluster index per pixel
  width: number;
  height: number;
}

export const DEFAULT_CONFIG: PBNConfig = {
  colorCount: 14,
  minRegionSize: 80,
  showTint: true,
  maxPreviewDim: 800,
};

export const DIFFICULTY_PRESETS: { label: string; colorCount: number; minRegionSize: number }[] = [
  { label: 'Easy', colorCount: 8, minRegionSize: 200 },
  { label: 'Medium', colorCount: 14, minRegionSize: 80 },
  { label: 'Hard', colorCount: 22, minRegionSize: 30 },
];

// ─── Internal helpers ────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return dr * dr + dg * dg + db * db;
}

// ─── K-means color quantization ──────────────────────────────────────────────

interface QuantizeResult {
  centroids: [number, number, number][];
  pixelMap: Uint16Array;
  pixelCounts: number[];
}

function samplePixels(data: Uint8ClampedArray, sampleCount: number): [number, number, number][] {
  const totalPixels = data.length / 4;
  const step = Math.max(1, Math.floor(totalPixels / sampleCount));
  const samples: [number, number, number][] = [];
  for (let i = 0; i < data.length; i += step * 4) {
    samples.push([data[i], data[i + 1], data[i + 2]]);
  }
  return samples;
}

function kMeansPPInit(samples: [number, number, number][], k: number): [number, number, number][] {
  const centroids: [number, number, number][] = [];
  const rng = () => Math.random(); // deterministic seed not needed for visual output

  // Pick first centroid randomly
  centroids.push(samples[Math.floor(rng() * samples.length)]);

  const distances = new Float64Array(samples.length);
  distances.fill(Infinity);

  for (let c = 1; c < k; c++) {
    const last = centroids[c - 1];
    let totalDist = 0;
    for (let i = 0; i < samples.length; i++) {
      const d = colorDistance(samples[i][0], samples[i][1], samples[i][2], last[0], last[1], last[2]);
      if (d < distances[i]) distances[i] = d;
      totalDist += distances[i];
    }

    // Weighted random selection
    let threshold = rng() * totalDist;
    let chosen = 0;
    for (let i = 0; i < samples.length; i++) {
      threshold -= distances[i];
      if (threshold <= 0) { chosen = i; break; }
    }
    centroids.push(samples[chosen]);
  }

  return centroids;
}

function kMeansIterate(
  samples: [number, number, number][],
  centroids: [number, number, number][],
  maxIter: number,
): [number, number, number][] {
  const k = centroids.length;
  const assignments = new Uint16Array(samples.length);
  let current = centroids.map(c => [...c] as [number, number, number]);

  for (let iter = 0; iter < maxIter; iter++) {
    // Assign samples to nearest centroid
    for (let i = 0; i < samples.length; i++) {
      let bestDist = Infinity;
      let bestK = 0;
      for (let j = 0; j < k; j++) {
        const d = colorDistance(samples[i][0], samples[i][1], samples[i][2], current[j][0], current[j][1], current[j][2]);
        if (d < bestDist) { bestDist = d; bestK = j; }
      }
      assignments[i] = bestK;
    }

    // Recompute centroids
    const sums = Array.from({ length: k }, () => [0, 0, 0]);
    const counts = new Uint32Array(k);
    for (let i = 0; i < samples.length; i++) {
      const a = assignments[i];
      sums[a][0] += samples[i][0];
      sums[a][1] += samples[i][1];
      sums[a][2] += samples[i][2];
      counts[a]++;
    }

    let converged = true;
    for (let j = 0; j < k; j++) {
      if (counts[j] === 0) continue;
      const nr = Math.round(sums[j][0] / counts[j]);
      const ng = Math.round(sums[j][1] / counts[j]);
      const nb = Math.round(sums[j][2] / counts[j]);
      if (nr !== current[j][0] || ng !== current[j][1] || nb !== current[j][2]) converged = false;
      current[j] = [nr, ng, nb];
    }

    if (converged) break;
  }

  return current;
}

export function quantizeColors(data: Uint8ClampedArray, width: number, height: number, k: number): QuantizeResult {
  const sampleCount = Math.min(width * height, 20000);
  const samples = samplePixels(data, sampleCount);
  const initCentroids = kMeansPPInit(samples, k);
  const centroids = kMeansIterate(samples, initCentroids, 20);

  // Assign all pixels to nearest centroid
  const totalPixels = width * height;
  const pixelMap = new Uint16Array(totalPixels);
  const pixelCounts = new Array(k).fill(0) as number[];

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    const r = data[idx], g = data[idx + 1], b = data[idx + 2];
    let bestDist = Infinity;
    let bestK = 0;
    for (let j = 0; j < k; j++) {
      const d = colorDistance(r, g, b, centroids[j][0], centroids[j][1], centroids[j][2]);
      if (d < bestDist) { bestDist = d; bestK = j; }
    }
    pixelMap[i] = bestK;
    pixelCounts[bestK]++;
  }

  return { centroids, pixelMap, pixelCounts };
}

// ─── Region detection (flood fill) ──────────────────────────────────────────

export function detectRegions(
  pixelMap: Uint16Array,
  width: number,
  height: number,
  minRegionSize: number,
): Int32Array {
  const totalPixels = width * height;
  const regionMap = new Int32Array(totalPixels);
  regionMap.fill(-1);
  let regionId = 0;
  const regionSizes: number[] = [];
  const regionColors: number[] = []; // cluster index for each region

  // Flood fill
  const stack: number[] = [];
  for (let i = 0; i < totalPixels; i++) {
    if (regionMap[i] !== -1) continue;
    const color = pixelMap[i];
    const currentRegion = regionId++;
    let size = 0;

    stack.push(i);
    while (stack.length > 0) {
      const p = stack.pop()!;
      if (regionMap[p] !== -1) continue;
      if (pixelMap[p] !== color) continue;
      regionMap[p] = currentRegion;
      size++;

      const x = p % width;
      const y = (p - x) / width;
      if (x > 0) stack.push(p - 1);
      if (x < width - 1) stack.push(p + 1);
      if (y > 0) stack.push(p - width);
      if (y < height - 1) stack.push(p + width);
    }

    regionSizes.push(size);
    regionColors.push(color);
  }

  // Merge tiny regions into their largest neighbor using a pixel index
  // (avoids O(tinyRegions * totalPixels) full scans that freeze the UI)
  if (minRegionSize > 1) {
    // Build index: region → list of pixel indices (single pass)
    const regionPixels = new Map<number, number[]>();
    for (let i = 0; i < totalPixels; i++) {
      const rid = regionMap[i];
      let list = regionPixels.get(rid);
      if (!list) { list = []; regionPixels.set(rid, list); }
      list.push(i);
    }

    // Sort tiny regions smallest-first so they merge into larger neighbors
    const tinyRegions: number[] = [];
    for (let r = 0; r < regionSizes.length; r++) {
      if (regionSizes[r] > 0 && regionSizes[r] < minRegionSize) tinyRegions.push(r);
    }
    tinyRegions.sort((a, b) => regionSizes[a] - regionSizes[b]);

    for (const r of tinyRegions) {
      const pixels = regionPixels.get(r);
      if (!pixels || pixels.length === 0) continue;

      // Find neighboring region with most shared border pixels
      const neighborCounts = new Map<number, number>();
      for (const i of pixels) {
        const x = i % width;
        const y = (i - x) / width;
        if (x > 0)          { const nr = regionMap[i - 1];     if (nr !== r) neighborCounts.set(nr, (neighborCounts.get(nr) || 0) + 1); }
        if (x < width - 1)  { const nr = regionMap[i + 1];     if (nr !== r) neighborCounts.set(nr, (neighborCounts.get(nr) || 0) + 1); }
        if (y > 0)          { const nr = regionMap[i - width];  if (nr !== r) neighborCounts.set(nr, (neighborCounts.get(nr) || 0) + 1); }
        if (y < height - 1) { const nr = regionMap[i + width];  if (nr !== r) neighborCounts.set(nr, (neighborCounts.get(nr) || 0) + 1); }
      }

      if (neighborCounts.size === 0) continue;

      let bestNeighbor = -1;
      let bestCount = 0;
      for (const [nRegion, count] of neighborCounts) {
        if (count > bestCount) { bestCount = count; bestNeighbor = nRegion; }
      }
      if (bestNeighbor === -1) continue;

      // Reassign pixels using the index (no full scan)
      for (const i of pixels) {
        regionMap[i] = bestNeighbor;
      }

      // Update index: append pixels to the target region's list
      const targetPixels = regionPixels.get(bestNeighbor);
      if (targetPixels) {
        for (const i of pixels) targetPixels.push(i);
      } else {
        regionPixels.set(bestNeighbor, pixels);
      }
      regionPixels.delete(r);

      regionSizes[bestNeighbor] += regionSizes[r];
      regionSizes[r] = 0;
    }
  }

  return regionMap;
}

// ─── Outline generation ──────────────────────────────────────────────────────

interface RegionInfo {
  id: number;
  colorIndex: number;
  centroidX: number;
  centroidY: number;
  size: number;
}

function computeRegionInfo(
  regionMap: Int32Array,
  pixelMap: Uint16Array,
  width: number,
  height: number,
): RegionInfo[] {
  const regMap = new Map<number, { sumX: number; sumY: number; count: number; colorIndex: number }>();

  for (let i = 0; i < regionMap.length; i++) {
    const rid = regionMap[i];
    const x = i % width;
    const y = (i - x) / width;
    let entry = regMap.get(rid);
    if (!entry) {
      entry = { sumX: 0, sumY: 0, count: 0, colorIndex: pixelMap[i] };
      regMap.set(rid, entry);
    }
    entry.sumX += x;
    entry.sumY += y;
    entry.count++;
  }

  const regions: RegionInfo[] = [];
  for (const [id, info] of regMap) {
    if (info.count === 0) continue;
    regions.push({
      id,
      colorIndex: info.colorIndex,
      centroidX: Math.round(info.sumX / info.count),
      centroidY: Math.round(info.sumY / info.count),
      size: info.count,
    });
  }

  return regions;
}

// Map from colorIndex to display number (1-based, sorted by pixel count descending)
function buildColorNumberMap(palette: PaletteEntry[]): Map<number, number> {
  const map = new Map<number, number>();
  // palette is already sorted by index = 1-based display number
  for (const entry of palette) {
    map.set(entry.index - 1, entry.index); // colorIndex is 0-based, display is 1-based
  }
  return map;
}

export function generateOutline(
  regionMap: Int32Array,
  pixelMap: Uint16Array,
  centroids: [number, number, number][],
  width: number,
  height: number,
  showTint: boolean,
  palette: PaletteEntry[],
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Fill white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Optional tint fill
  if (showTint) {
    for (let i = 0; i < regionMap.length; i++) {
      const ci = pixelMap[i];
      const c = centroids[ci];
      const idx = i * 4;
      // Blend 20% color with white
      data[idx] = Math.round(255 * 0.8 + c[0] * 0.2);
      data[idx + 1] = Math.round(255 * 0.8 + c[1] * 0.2);
      data[idx + 2] = Math.round(255 * 0.8 + c[2] * 0.2);
    }
  }

  // Draw outlines: pixel is an edge if any neighbor has a different region
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const rid = regionMap[i];
      let isEdge = false;

      if (x > 0 && regionMap[i - 1] !== rid) isEdge = true;
      else if (x < width - 1 && regionMap[i + 1] !== rid) isEdge = true;
      else if (y > 0 && regionMap[i - width] !== rid) isEdge = true;
      else if (y < height - 1 && regionMap[i + width] !== rid) isEdge = true;

      if (isEdge) {
        const idx = i * 4;
        data[idx] = 0;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // Place numbered labels at region centroids
  const regions = computeRegionInfo(regionMap, pixelMap, width, height);
  const colorNumberMap = buildColorNumberMap(palette);

  // Scale font size based on image dimension
  const baseFontSize = Math.max(8, Math.min(16, Math.round(Math.min(width, height) / 60)));

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Only label regions above a visible size threshold
  const labelThreshold = Math.max(20, baseFontSize * baseFontSize);

  for (const region of regions) {
    if (region.size < labelThreshold) continue;
    const displayNum = colorNumberMap.get(region.colorIndex);
    if (displayNum === undefined) continue;

    const label = String(displayNum);
    const fontSize = Math.max(7, Math.round(baseFontSize * Math.min(1, Math.sqrt(region.size / 200))));
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;

    // White background behind number for readability
    const metrics = ctx.measureText(label);
    const pad = 2;
    const tw = metrics.width + pad * 2;
    const th = fontSize + pad * 2;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(region.centroidX - tw / 2, region.centroidY - th / 2, tw, th);

    ctx.fillStyle = '#000000';
    ctx.fillText(label, region.centroidX, region.centroidY);
  }

  return canvas;
}

// ─── Paint recipe calculation ────────────────────────────────────────────────

const ACRYLIC_PAINTS = [
  { name: 'Phthalo Blue', r: 0, g: 36, b: 156 },
  { name: 'Quinacridone Magenta', r: 181, g: 26, b: 92 },
  { name: 'Cadmium Yellow', r: 254, g: 211, b: 48 },
  { name: 'Mars Black', r: 28, g: 28, b: 28 },
  { name: 'Titanium White', r: 245, g: 245, b: 243 },
] as const;

export function calculatePaintRecipe(r: number, g: number, b: number): PaintRecipe {
  // Convert to CMYK-like decomposition relative to our acrylic palette
  // Use a simple approach: express the target color as a weighted mix of our base paints

  const target = [r, g, b];

  // Iterative least-squares mix (greedy approach)
  const weights = new Float64Array(ACRYLIC_PAINTS.length);

  // Start with white as base
  const whiteIdx = 4;
  weights[whiteIdx] = 1;

  // Iteratively adjust to minimize distance
  for (let iter = 0; iter < 50; iter++) {
    // Current mixed color
    let totalWeight = 0;
    for (let i = 0; i < weights.length; i++) totalWeight += weights[i];
    if (totalWeight === 0) { weights[whiteIdx] = 1; totalWeight = 1; }

    const mixed = [0, 0, 0];
    for (let i = 0; i < ACRYLIC_PAINTS.length; i++) {
      const w = weights[i] / totalWeight;
      mixed[0] += ACRYLIC_PAINTS[i].r * w;
      mixed[1] += ACRYLIC_PAINTS[i].g * w;
      mixed[2] += ACRYLIC_PAINTS[i].b * w;
    }

    // Error
    const err = [target[0] - mixed[0], target[1] - mixed[1], target[2] - mixed[2]];

    // Find the paint that reduces error most
    let bestPaint = 0;
    let bestImprovement = -Infinity;
    for (let i = 0; i < ACRYLIC_PAINTS.length; i++) {
      const improvement =
        err[0] * (ACRYLIC_PAINTS[i].r - mixed[0]) +
        err[1] * (ACRYLIC_PAINTS[i].g - mixed[1]) +
        err[2] * (ACRYLIC_PAINTS[i].b - mixed[2]);
      if (improvement > bestImprovement) {
        bestImprovement = improvement;
        bestPaint = i;
      }
    }

    if (bestImprovement <= 0) break;

    weights[bestPaint] += 0.1;
  }

  // Normalize to integer ratios
  let totalWeight = 0;
  for (let i = 0; i < weights.length; i++) totalWeight += weights[i];

  const parts: { paint: string; amount: number }[] = [];
  // Scale so smallest non-zero becomes 1
  const nonZero: number[] = [];
  for (let i = 0; i < weights.length; i++) {
    if (weights[i] > 0.05) nonZero.push(weights[i] / totalWeight);
  }
  const minVal = Math.min(...nonZero);
  const scale = minVal > 0 ? 1 / minVal : 1;

  for (let i = 0; i < ACRYLIC_PAINTS.length; i++) {
    const normalized = weights[i] / totalWeight;
    if (normalized < 0.03) continue;
    const amount = Math.max(1, Math.round(normalized * scale));
    parts.push({ paint: ACRYLIC_PAINTS[i].name, amount });
  }

  // Sort by amount descending
  parts.sort((a, b) => b.amount - a.amount);

  return { parts };
}

// ─── Palette card generator ──────────────────────────────────────────────────

export function generatePaletteCard(palette: PaletteEntry[]): HTMLCanvasElement {
  const rowHeight = 60;
  const padding = 20;
  const cardWidth = 500;
  const headerHeight = 50;
  const cardHeight = headerHeight + padding + palette.length * rowHeight + padding;

  const canvas = document.createElement('canvas');
  canvas.width = cardWidth;
  canvas.height = cardHeight;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, cardWidth, cardHeight);

  // Header
  ctx.fillStyle = '#1f2937';
  ctx.font = 'bold 20px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Paint by Numbers — Color Palette', padding, headerHeight / 2 + 4);

  // Divider
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, headerHeight);
  ctx.lineTo(cardWidth - padding, headerHeight);
  ctx.stroke();

  const startY = headerHeight + padding;

  for (let i = 0; i < palette.length; i++) {
    const entry = palette[i];
    const y = startY + i * rowHeight;

    // Color swatch
    const swatchSize = 36;
    ctx.fillStyle = entry.hex;
    ctx.fillRect(padding, y + (rowHeight - swatchSize) / 2, swatchSize, swatchSize);
    ctx.strokeStyle = '#d1d5db';
    ctx.strokeRect(padding, y + (rowHeight - swatchSize) / 2, swatchSize, swatchSize);

    // Number
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(`#${entry.index}`, padding + swatchSize + 12, y + 8);

    // Hex
    ctx.fillStyle = '#6b7280';
    ctx.font = '13px Arial, sans-serif';
    ctx.fillText(entry.hex, padding + swatchSize + 12, y + 28);

    // Recipe
    const recipeStr = entry.recipe.parts.map(p => `${p.amount} ${p.paint}`).join(' + ');
    ctx.fillStyle = '#374151';
    ctx.font = '11px Arial, sans-serif';
    const maxRecipeWidth = cardWidth - (padding + swatchSize + 120) - padding;
    // Truncate if needed
    let displayRecipe = recipeStr;
    if (ctx.measureText(displayRecipe).width > maxRecipeWidth) {
      while (displayRecipe.length > 0 && ctx.measureText(displayRecipe + '...').width > maxRecipeWidth) {
        displayRecipe = displayRecipe.slice(0, -1);
      }
      displayRecipe += '...';
    }
    ctx.fillText(displayRecipe, padding + swatchSize + 120, y + 18);
  }

  return canvas;
}

// ─── Quantized preview ───────────────────────────────────────────────────────

export function generateQuantizedPreview(
  pixelMap: Uint16Array,
  centroids: [number, number, number][],
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  for (let i = 0; i < pixelMap.length; i++) {
    const c = centroids[pixelMap[i]];
    const idx = i * 4;
    data[idx] = c[0];
    data[idx + 1] = c[1];
    data[idx + 2] = c[2];
    data[idx + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

// ─── Downsample utility ──────────────────────────────────────────────────────

export function downsampleImage(image: HTMLImageElement, maxDim: number): ImageData {
  const ratio = Math.min(maxDim / image.width, maxDim / image.height, 1);
  const w = Math.round(image.width * ratio);
  const h = Math.round(image.height * ratio);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

export function imageToImageData(image: HTMLImageElement): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, 0, 0);
  return ctx.getImageData(0, 0, image.width, image.height);
}

// ─── Pipeline orchestrator ───────────────────────────────────────────────────

export function generatePaintByNumbers(imageData: ImageData, config: PBNConfig): PBNResult {
  const { width, height } = imageData;
  const { colorCount, minRegionSize, showTint } = config;

  const k = clamp(colorCount, 2, 30);

  // 1. Quantize colors
  const { centroids, pixelMap, pixelCounts } = quantizeColors(imageData.data, width, height, k);

  // 2. Detect regions
  const regionMap = detectRegions(pixelMap, width, height, minRegionSize);

  // 3. Build palette entries (sorted by pixel count descending for numbering)
  const indexedCounts = centroids.map((c, i) => ({ i, count: pixelCounts[i], c }));
  indexedCounts.sort((a, b) => b.count - a.count);

  const palette: PaletteEntry[] = indexedCounts
    .filter(e => e.count > 0)
    .map((entry, displayIdx) => ({
      index: displayIdx + 1,
      r: entry.c[0],
      g: entry.c[1],
      b: entry.c[2],
      hex: rgbToHex(entry.c[0], entry.c[1], entry.c[2]),
      recipe: calculatePaintRecipe(entry.c[0], entry.c[1], entry.c[2]),
      pixelCount: entry.count,
    }));

  // Remap palette: the outline generator needs to go from pixelMap colorIndex → display number.
  // We built palette sorted by count, but pixelMap uses original centroid indices.
  // buildColorNumberMap inside generateOutline handles this, but we need palette entries
  // to have their `index` as the 1-based display number and their original centroid index
  // recoverable. We store original index on the entry for the mapping.
  // Actually, the mapping works because palette[i].index = displayIdx+1 and the
  // original colorIndex = indexedCounts[i].i. buildColorNumberMap maps colorIndex → displayNumber.
  // We need to make buildColorNumberMap use the same mapping.

  // Rebuild the color number map explicitly
  const colorToDisplay = new Map<number, number>();
  for (let d = 0; d < indexedCounts.length; d++) {
    if (indexedCounts[d].count > 0) {
      colorToDisplay.set(indexedCounts[d].i, d + 1);
    }
  }

  // Override buildColorNumberMap in generateOutline — instead we pass palette with correct mapping
  // Adjust palette entries so that index-1 maps to original color index
  // Actually let's just pass the palette as-is and fix generateOutline to use colorToDisplay

  // 4. Generate outline
  const outlineCanvas = generateOutlineWithMap(
    regionMap, pixelMap, centroids, width, height, showTint, colorToDisplay,
  );

  // 5. Generate quantized preview
  const quantizedCanvas = generateQuantizedPreview(pixelMap, centroids, width, height);

  // 6. Generate palette card
  const paletteCardCanvas = generatePaletteCard(palette);

  return {
    palette,
    outlineCanvas,
    quantizedCanvas,
    paletteCardCanvas,
    pixelMap,
    width,
    height,
  };
}

// Internal outline with explicit color-to-display-number map
function generateOutlineWithMap(
  regionMap: Int32Array,
  pixelMap: Uint16Array,
  centroids: [number, number, number][],
  width: number,
  height: number,
  showTint: boolean,
  colorToDisplay: Map<number, number>,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  if (showTint) {
    for (let i = 0; i < regionMap.length; i++) {
      const ci = pixelMap[i];
      const c = centroids[ci];
      const idx = i * 4;
      data[idx] = Math.round(255 * 0.8 + c[0] * 0.2);
      data[idx + 1] = Math.round(255 * 0.8 + c[1] * 0.2);
      data[idx + 2] = Math.round(255 * 0.8 + c[2] * 0.2);
    }
  }

  // Draw outlines
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const rid = regionMap[i];
      let isEdge = false;

      if (x > 0 && regionMap[i - 1] !== rid) isEdge = true;
      else if (x < width - 1 && regionMap[i + 1] !== rid) isEdge = true;
      else if (y > 0 && regionMap[i - width] !== rid) isEdge = true;
      else if (y < height - 1 && regionMap[i + width] !== rid) isEdge = true;

      if (isEdge) {
        const idx = i * 4;
        data[idx] = 0;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // Place numbered labels
  const regions = computeRegionInfo(regionMap, pixelMap, width, height);
  const baseFontSize = Math.max(8, Math.min(16, Math.round(Math.min(width, height) / 60)));
  const labelThreshold = Math.max(20, baseFontSize * baseFontSize);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const region of regions) {
    if (region.size < labelThreshold) continue;
    const displayNum = colorToDisplay.get(region.colorIndex);
    if (displayNum === undefined) continue;

    const label = String(displayNum);
    const fontSize = Math.max(7, Math.round(baseFontSize * Math.min(1, Math.sqrt(region.size / 200))));
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;

    const metrics = ctx.measureText(label);
    const pad = 2;
    const tw = metrics.width + pad * 2;
    const th = fontSize + pad * 2;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(region.centroidX - tw / 2, region.centroidY - th / 2, tw, th);

    ctx.fillStyle = '#000000';
    ctx.fillText(label, region.centroidX, region.centroidY);
  }

  return canvas;
}
