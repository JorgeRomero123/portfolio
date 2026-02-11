// Pure utility functions for photo grid alignment — no React, only Canvas API.

export interface Transform {
  rotation: number;
  scale: number;
  translateX: number;
  translateY: number;
  flipH: boolean;
  flipV: boolean;
}

export interface GridSettings {
  cellSize: number;
  color: string;
  opacity: number;
  lineWidth: number;
  visible: boolean;
}

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const DEFAULT_TRANSFORM: Transform = {
  rotation: 0,
  scale: 1,
  translateX: 0,
  translateY: 0,
  flipH: false,
  flipV: false,
};

export const DEFAULT_GRID: GridSettings = {
  cellSize: 50,
  color: '#00aaff',
  opacity: 40,
  lineWidth: 1,
  visible: true,
};

/**
 * Sobel edge detection + weighted angle histogram → dominant skew angle.
 * Returns null if no dominant alignment is found.
 */
export function detectSkewAngle(image: HTMLImageElement): number | null {
  const maxDim = 1000;
  const ratio = Math.min(maxDim / image.width, maxDim / image.height, 1);
  const w = Math.round(image.width * ratio);
  const h = Math.round(image.height * ratio);

  const tmpCanvas = document.createElement('canvas');
  tmpCanvas.width = w;
  tmpCanvas.height = h;
  const tmpCtx = tmpCanvas.getContext('2d')!;
  tmpCtx.drawImage(image, 0, 0, w, h);
  const imgData = tmpCtx.getImageData(0, 0, w, h);
  const pixels = imgData.data;

  // Grayscale
  const gray = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    gray[i] = 0.2126 * pixels[i * 4] + 0.7152 * pixels[i * 4 + 1] + 0.0722 * pixels[i * 4 + 2];
  }

  // Sobel
  const magnitude = new Float32Array(w * h);
  const angle = new Float32Array(w * h);

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const tl = gray[(y - 1) * w + (x - 1)];
      const tc = gray[(y - 1) * w + x];
      const tr = gray[(y - 1) * w + (x + 1)];
      const ml = gray[y * w + (x - 1)];
      const mr = gray[y * w + (x + 1)];
      const bl = gray[(y + 1) * w + (x - 1)];
      const bc = gray[(y + 1) * w + x];
      const br = gray[(y + 1) * w + (x + 1)];

      const gx = -tl - 2 * ml - bl + tr + 2 * mr + br;
      const gy = -tl - 2 * tc - tr + bl + 2 * bc + br;

      magnitude[idx] = Math.sqrt(gx * gx + gy * gy);
      angle[idx] = Math.atan2(gy, gx) * (180 / Math.PI);
    }
  }

  // Threshold: top 20% edge pixels
  const mags = Array.from(magnitude).filter((m) => m > 0);
  mags.sort((a, b) => a - b);
  const threshold = mags[Math.floor(mags.length * 0.8)] || 0;

  // Weighted angle histogram (mod 90), 180 bins covering -45 to +45
  const binCount = 180;
  const histogram = new Float32Array(binCount);
  let totalWeight = 0;

  for (let i = 0; i < w * h; i++) {
    if (magnitude[i] < threshold) continue;
    let a = angle[i] % 90;
    if (a > 45) a -= 90;
    if (a < -45) a += 90;
    const bin = Math.round((a + 45) * (binCount - 1) / 90);
    if (bin >= 0 && bin < binCount) {
      histogram[bin] += magnitude[i];
      totalWeight += magnitude[i];
    }
  }

  // Find peak
  let peakBin = 0;
  let peakVal = 0;
  for (let i = 0; i < binCount; i++) {
    if (histogram[i] > peakVal) {
      peakVal = histogram[i];
      peakBin = i;
    }
  }

  const avgVal = totalWeight / binCount;
  if (peakVal < avgVal * 2) return null;

  return (peakBin * 90) / (binCount - 1) - 45;
}

/**
 * Largest axis-aligned rectangle inscribed inside a rotated W×H rectangle.
 * Formula: w = (W·cosα − H·sinα) / cos2α, h = (H·cosα − W·sinα) / cos2α
 */
export function computeInscribedCrop(
  imgW: number,
  imgH: number,
  rotationDeg: number,
): { width: number; height: number } {
  const alpha = Math.abs(rotationDeg * Math.PI / 180);

  // No rotation → full image
  if (alpha < 1e-6) return { width: imgW, height: imgH };

  const sinA = Math.sin(alpha);
  const cosA = Math.cos(alpha);
  const cos2A = Math.cos(2 * alpha);

  // Near 45° the cos2α denominator → 0; fall back to inscribed square
  if (Math.abs(cos2A) < 1e-6) {
    const side = Math.min(imgW, imgH) / (sinA + cosA);
    return { width: side, height: side };
  }

  let w = (imgW * cosA - imgH * sinA) / cos2A;
  let h = (imgH * cosA - imgW * sinA) / cos2A;

  // For large angles the formula can go negative; clamp to bounding box
  if (w <= 0 || h <= 0) {
    const bw = imgW * cosA + imgH * sinA;
    const bh = imgW * sinA + imgH * cosA;
    const aspect = imgW / imgH;
    w = Math.min(bw, bh * aspect);
    h = w / aspect;
  }

  return { width: w, height: h };
}

/** Checkerboard transparency pattern. */
export function drawCheckerboard(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  patternSize = 12,
): void {
  for (let x = 0; x < w; x += patternSize) {
    for (let y = 0; y < h; y += patternSize) {
      ctx.fillStyle = ((x + y) / patternSize) % 2 === 0 ? '#e0e0e0' : '#ffffff';
      ctx.fillRect(x, y, patternSize, patternSize);
    }
  }
}

/** Grid overlay lines. */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  grid: GridSettings,
): void {
  if (!grid.visible) return;
  ctx.save();
  ctx.globalAlpha = grid.opacity / 100;
  ctx.strokeStyle = grid.color;
  ctx.lineWidth = grid.lineWidth;
  ctx.beginPath();
  for (let x = 0; x <= w; x += grid.cellSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = 0; y <= h; y += grid.cellSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();
  ctx.restore();
}

/** Draw the image centered in canvas with rotate/scale/translate. */
export function drawTransformedImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  cw: number,
  ch: number,
  transform: Transform,
): void {
  ctx.save();
  ctx.translate(cw / 2 + transform.translateX, ch / 2 + transform.translateY);
  ctx.rotate((transform.rotation * Math.PI) / 180);
  ctx.scale(
    transform.scale * (transform.flipH ? -1 : 1),
    transform.scale * (transform.flipV ? -1 : 1),
  );

  const fitScale = Math.min(cw / image.width, ch / image.height);
  const drawW = image.width * fitScale;
  const drawH = image.height * fitScale;
  ctx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();
}

const HANDLE_SIZE = 8;

/** Dim outside crop rect, draw dashed border + 8 handles. */
export function drawCropOverlay(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  crop: CropRect,
): void {
  // Dim outside
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  // Top
  ctx.fillRect(0, 0, cw, crop.y);
  // Bottom
  ctx.fillRect(0, crop.y + crop.height, cw, ch - crop.y - crop.height);
  // Left
  ctx.fillRect(0, crop.y, crop.x, crop.height);
  // Right
  ctx.fillRect(crop.x + crop.width, crop.y, cw - crop.x - crop.width, crop.height);
  ctx.restore();

  // Dashed border
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(crop.x, crop.y, crop.width, crop.height);
  ctx.setLineDash([]);
  ctx.restore();

  // Rule-of-thirds lines
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 0.5;
  for (let i = 1; i < 3; i++) {
    const vx = crop.x + (crop.width * i) / 3;
    const hy = crop.y + (crop.height * i) / 3;
    ctx.beginPath();
    ctx.moveTo(vx, crop.y);
    ctx.lineTo(vx, crop.y + crop.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(crop.x, hy);
    ctx.lineTo(crop.x + crop.width, hy);
    ctx.stroke();
  }
  ctx.restore();

  // 8 handles (4 corners + 4 edge midpoints)
  const handles = getCropHandlePositions(crop);
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 1;
  for (const pos of Object.values(handles)) {
    ctx.fillRect(pos.x - HANDLE_SIZE / 2, pos.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
    ctx.strokeRect(pos.x - HANDLE_SIZE / 2, pos.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
  }
  ctx.restore();
}

export type HandleName =
  | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
  | 'topMid' | 'bottomMid' | 'leftMid' | 'rightMid';

export function getCropHandlePositions(crop: CropRect): Record<HandleName, { x: number; y: number }> {
  const { x, y, width: w, height: h } = crop;
  return {
    topLeft:     { x, y },
    topRight:    { x: x + w, y },
    bottomLeft:  { x, y: y + h },
    bottomRight: { x: x + w, y: y + h },
    topMid:      { x: x + w / 2, y },
    bottomMid:   { x: x + w / 2, y: y + h },
    leftMid:     { x, y: y + h / 2 },
    rightMid:    { x: x + w, y: y + h / 2 },
  };
}

/** Hit-test: returns the handle name if pointer is within threshold, else null. */
export function hitTestHandle(
  crop: CropRect,
  px: number,
  py: number,
  threshold = 10,
): HandleName | null {
  const handles = getCropHandlePositions(crop);
  for (const [name, pos] of Object.entries(handles)) {
    if (Math.abs(px - pos.x) < threshold && Math.abs(py - pos.y) < threshold) {
      return name as HandleName;
    }
  }
  return null;
}

/** Hit-test: is the pointer inside the crop rect? */
export function isInsideCrop(crop: CropRect, px: number, py: number): boolean {
  return px >= crop.x && px <= crop.x + crop.width && py >= crop.y && py <= crop.y + crop.height;
}

/**
 * Full-resolution render for export. Returns a canvas element.
 * - With crop: renders transformed image, then extracts the crop region (scaled from canvas-space to full-res)
 * - Without crop: renders at original image W×H centered (clips to original dimensions, no expanded bounding box)
 */
export function renderForExport(
  image: HTMLImageElement,
  transform: Transform,
  canvasDisplayW: number,
  canvasDisplayH: number,
  crop?: CropRect | null,
): HTMLCanvasElement {
  const ow = image.width;
  const oh = image.height;
  const rad = (transform.rotation * Math.PI) / 180;
  const s = transform.scale;

  if (crop && crop.width > 0 && crop.height > 0) {
    // Scale factor from canvas-display space → full-res image space
    const fitScale = Math.min(canvasDisplayW / ow, canvasDisplayH / oh);
    const fullResScale = 1 / fitScale;

    // Full-res intermediate canvas (same proportions as display canvas)
    const fullW = Math.round(canvasDisplayW * fullResScale);
    const fullH = Math.round(canvasDisplayH * fullResScale);

    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = fullW;
    tmpCanvas.height = fullH;
    const tmpCtx = tmpCanvas.getContext('2d')!;

    // Draw transformed image at full res
    tmpCtx.translate(fullW / 2 + transform.translateX * fullResScale, fullH / 2 + transform.translateY * fullResScale);
    tmpCtx.rotate(rad);
    tmpCtx.scale(s * (transform.flipH ? -1 : 1), s * (transform.flipV ? -1 : 1));
    tmpCtx.drawImage(image, -ow / 2, -oh / 2, ow, oh);

    // Extract crop region (scale crop coords from display → full-res)
    const cx = Math.round(crop.x * fullResScale);
    const cy = Math.round(crop.y * fullResScale);
    const cw = Math.round(crop.width * fullResScale);
    const ch = Math.round(crop.height * fullResScale);

    const outCanvas = document.createElement('canvas');
    outCanvas.width = cw;
    outCanvas.height = ch;
    const outCtx = outCanvas.getContext('2d')!;
    outCtx.drawImage(tmpCanvas, cx, cy, cw, ch, 0, 0, cw, ch);

    return outCanvas;
  }

  // No crop: render at original image dimensions, centered (no expanded bounding box)
  const outCanvas = document.createElement('canvas');
  outCanvas.width = ow;
  outCanvas.height = oh;
  const ctx = outCanvas.getContext('2d')!;

  ctx.translate(ow / 2, oh / 2);
  ctx.rotate(rad);
  ctx.scale(s * (transform.flipH ? -1 : 1), s * (transform.flipV ? -1 : 1));
  ctx.drawImage(image, -ow / 2, -oh / 2, ow, oh);

  return outCanvas;
}
