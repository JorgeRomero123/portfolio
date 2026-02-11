// Pure utility functions for photo color enhancement — no React, only Canvas API.

export interface ColorAdjustments {
  brightness: number;      // -100 to +100
  contrast: number;        // -100 to +100
  saturation: number;      // 0 to 200 (100 = unchanged)
  temperature: number;     // -100 to +100 (neg = cool, pos = warm)
  autoLevels: boolean;
  autoWhiteBalance: boolean;
}

export const DEFAULT_ADJUSTMENTS: ColorAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 100,
  temperature: 0,
  autoLevels: false,
  autoWhiteBalance: false,
};

export const COLOR_PRESETS: { label: string; adjustments: Partial<ColorAdjustments> }[] = [
  { label: 'Vivid', adjustments: { contrast: 20, saturation: 140 } },
  { label: 'B&W', adjustments: { saturation: 0 } },
  { label: 'Warm', adjustments: { temperature: 40, saturation: 110 } },
  { label: 'Cool', adjustments: { temperature: -40, saturation: 110 } },
];

export function isDefaultAdjustments(adj: ColorAdjustments): boolean {
  return (
    adj.brightness === DEFAULT_ADJUSTMENTS.brightness &&
    adj.contrast === DEFAULT_ADJUSTMENTS.contrast &&
    adj.saturation === DEFAULT_ADJUSTMENTS.saturation &&
    adj.temperature === DEFAULT_ADJUSTMENTS.temperature &&
    adj.autoLevels === DEFAULT_ADJUSTMENTS.autoLevels &&
    adj.autoWhiteBalance === DEFAULT_ADJUSTMENTS.autoWhiteBalance
  );
}

// ---------- Internal helpers ----------

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}

function hue2rgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

interface ChannelHistogram {
  r: Uint32Array;
  g: Uint32Array;
  b: Uint32Array;
}

function buildHistogram(data: Uint8ClampedArray): ChannelHistogram {
  const r = new Uint32Array(256);
  const g = new Uint32Array(256);
  const b = new Uint32Array(256);
  for (let i = 0; i < data.length; i += 4) {
    r[data[i]]++;
    g[data[i + 1]]++;
    b[data[i + 2]]++;
  }
  return { r, g, b };
}

function findPercentile(channel: Uint32Array, totalPixels: number, percentile: number): number {
  const target = Math.floor(totalPixels * percentile);
  let cumulative = 0;
  for (let i = 0; i < 256; i++) {
    cumulative += channel[i];
    if (cumulative >= target) return i;
  }
  return 255;
}

function cloneImageData(src: ImageData): ImageData {
  return new ImageData(new Uint8ClampedArray(src.data), src.width, src.height);
}

// ---------- Public processing functions ----------

/**
 * Per-channel 1st/99th percentile stretch for auto-levels.
 */
export function applyAutoLevels(src: ImageData): ImageData {
  const out = cloneImageData(src);
  const d = out.data;
  const totalPixels = src.width * src.height;
  const hist = buildHistogram(d);

  const channels: Array<{ histogram: Uint32Array; offset: number }> = [
    { histogram: hist.r, offset: 0 },
    { histogram: hist.g, offset: 1 },
    { histogram: hist.b, offset: 2 },
  ];

  for (const ch of channels) {
    const lo = findPercentile(ch.histogram, totalPixels, 0.01);
    const hi = findPercentile(ch.histogram, totalPixels, 0.99);
    const range = hi - lo || 1;
    for (let i = ch.offset; i < d.length; i += 4) {
      d[i] = clamp(Math.round(((d[i] - lo) / range) * 255), 0, 255);
    }
  }

  return out;
}

/**
 * Gray-world white balance: scale R/G/B channels to equalize mean luminance.
 */
export function applyGrayWorldWB(src: ImageData): ImageData {
  const out = cloneImageData(src);
  const d = out.data;
  const n = src.width * src.height;

  let sumR = 0, sumG = 0, sumB = 0;
  for (let i = 0; i < d.length; i += 4) {
    sumR += d[i];
    sumG += d[i + 1];
    sumB += d[i + 2];
  }

  const avgR = sumR / n;
  const avgG = sumG / n;
  const avgB = sumB / n;
  const avgGray = (avgR + avgG + avgB) / 3;

  const scaleR = avgGray / (avgR || 1);
  const scaleG = avgGray / (avgG || 1);
  const scaleB = avgGray / (avgB || 1);

  for (let i = 0; i < d.length; i += 4) {
    d[i] = clamp(Math.round(d[i] * scaleR), 0, 255);
    d[i + 1] = clamp(Math.round(d[i + 1] * scaleG), 0, 255);
    d[i + 2] = clamp(Math.round(d[i + 2] * scaleB), 0, 255);
  }

  return out;
}

/**
 * Brightness adjustment: offset ±128 mapped from ±100.
 */
export function applyBrightness(src: ImageData, amount: number): ImageData {
  const out = cloneImageData(src);
  const d = out.data;
  const offset = (amount / 100) * 128;

  for (let i = 0; i < d.length; i += 4) {
    d[i] = clamp(Math.round(d[i] + offset), 0, 255);
    d[i + 1] = clamp(Math.round(d[i + 1] + offset), 0, 255);
    d[i + 2] = clamp(Math.round(d[i + 2] + offset), 0, 255);
  }

  return out;
}

/**
 * Contrast adjustment: scale around 128, factor maps from 0–2×.
 */
export function applyContrast(src: ImageData, amount: number): ImageData {
  const out = cloneImageData(src);
  const d = out.data;
  // amount -100 → factor 0, amount 0 → factor 1, amount +100 → factor 2
  const factor = (amount + 100) / 100;

  for (let i = 0; i < d.length; i += 4) {
    d[i] = clamp(Math.round(128 + (d[i] - 128) * factor), 0, 255);
    d[i + 1] = clamp(Math.round(128 + (d[i + 1] - 128) * factor), 0, 255);
    d[i + 2] = clamp(Math.round(128 + (d[i + 2] - 128) * factor), 0, 255);
  }

  return out;
}

/**
 * Saturation adjustment: RGB→HSL, multiply S, HSL→RGB.
 * amount: 0 = fully desaturated, 100 = unchanged, 200 = double saturation.
 */
export function applySaturation(src: ImageData, amount: number): ImageData {
  const out = cloneImageData(src);
  const d = out.data;
  const factor = amount / 100;

  for (let i = 0; i < d.length; i += 4) {
    const [h, s, l] = rgbToHsl(d[i], d[i + 1], d[i + 2]);
    const newS = clamp(s * factor, 0, 1);
    const [r, g, b] = hslToRgb(h, newS, l);
    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
  }

  return out;
}

/**
 * Temperature shift: positive = warm (boost R, reduce B), negative = cool (boost B, reduce R).
 */
export function applyTemperature(src: ImageData, amount: number): ImageData {
  const out = cloneImageData(src);
  const d = out.data;
  // Map ±100 to ±30 intensity shift
  const shift = (amount / 100) * 30;

  for (let i = 0; i < d.length; i += 4) {
    d[i] = clamp(Math.round(d[i] + shift), 0, 255);       // R
    d[i + 2] = clamp(Math.round(d[i + 2] - shift), 0, 255); // B
  }

  return out;
}

/**
 * Pipeline: levels → WB → brightness → contrast → saturation → temperature.
 * Starts from the original ImageData passed in. Skips steps at default values. No mutation.
 */
export function applyAllAdjustments(src: ImageData, adj: ColorAdjustments): ImageData {
  let result = src;

  if (adj.autoLevels) {
    result = applyAutoLevels(result);
  }
  if (adj.autoWhiteBalance) {
    result = applyGrayWorldWB(result);
  }
  if (adj.brightness !== 0) {
    result = applyBrightness(result, adj.brightness);
  }
  if (adj.contrast !== 0) {
    result = applyContrast(result, adj.contrast);
  }
  if (adj.saturation !== 100) {
    result = applySaturation(result, adj.saturation);
  }
  if (adj.temperature !== 0) {
    result = applyTemperature(result, adj.temperature);
  }

  // If nothing changed, return a clone so caller always gets a fresh ImageData
  if (result === src) {
    return cloneImageData(src);
  }

  return result;
}

/**
 * Downsample an image to fit within maxDim for fast preview processing.
 */
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
