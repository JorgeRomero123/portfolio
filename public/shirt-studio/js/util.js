export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);

export const uid = () =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-5);

// Small deterministic PRNG so textured strokes look identical every time
// they are re-rendered (screen, undo/redo, full-size print export).
export function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeCanvas(w, h, opts) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  if (opts) c._ctxOpts = opts;
  return c;
}

// iOS Safari keeps canvas memory until the backing store is shrunk.
export function freeCanvas(c) {
  if (!c) return;
  c.width = 1;
  c.height = 1;
}

export const tick = () => new Promise((r) => setTimeout(r, 0));
export const frame = () => new Promise((r) => requestAnimationFrame(() => r()));

export function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
}
export function hsvToRgb(h, s, v) {
  const f = (n) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return [f(5) * 255, f(3) * 255, f(1) * 255];
}
export function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, max ? d / max : 0, max];
}
export function isHex(s) {
  return /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s.trim());
}
export function normHex(s) {
  let h = s.trim().replace('#', '').toLowerCase();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return '#' + h;
}

// localStorage can throw (private mode, blocked storage) — never let it break the app.
export const prefs = {
  get(k, d) {
    try {
      const v = localStorage.getItem('ss:' + k);
      return v == null ? d : JSON.parse(v);
    } catch {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem('ss:' + k, JSON.stringify(v));
    } catch {}
  },
};

export function timeAgo(t) {
  const s = (Date.now() - t) / 1000;
  if (s < 60) return 'Just now';
  if (s < 3600) return Math.floor(s / 60) + ' min ago';
  if (s < 86400) return Math.floor(s / 3600) + ' h ago';
  if (s < 86400 * 7) return Math.floor(s / 86400) + ' d ago';
  return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function canvasToBlob(c, type = 'image/png', q) {
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('toBlob failed'))), type, q));
}
