import { makeCanvas, freeCanvas, uid, canvasToBlob, tick } from './util.js';
import { renderOp } from './render.js';
import { PNGWriter, canStreamPNG } from './png.js';

export const PRESETS = [
  { id: 'front', label: 'Full front', sub: '15 × 18 in', W: 4500, H: 5400 },
  { id: 'oversize', label: 'Oversize', sub: '16 × 20 in', W: 4800, H: 6000 },
  { id: 'square', label: 'Square', sub: '12 × 12 in', W: 3600, H: 3600 },
  { id: 'chest', label: 'Left chest', sub: '4 × 4 in', W: 1200, H: 1200 },
];
export const MAX_LAYERS = 6;
// Working resolution cap. Keeps every layer ~19 MB so six layers stay well inside
// iPad Safari's canvas memory budget; full print resolution comes from re-rendering
// the recorded strokes at export time.
const WORK_MAX = 2400;
const MAX_HISTORY = 80;

export class Layer {
  constructor(doc, o = {}) {
    this.id = o.id || uid();
    this.name = o.name || 'Layer';
    this.visible = o.visible !== false;
    this.opacity = o.opacity ?? 1;
    this.ops = o.ops || [];
    this.cv = makeCanvas(doc.workW, doc.workH);
    this.ctx = this.cv.getContext('2d');
    this.dirty = true;
    this.thumbDirty = true;
  }
}

export class Doc {
  constructor(m) {
    this.id = m.id || uid();
    this.name = m.name || 'Untitled';
    this.W = m.W;
    this.H = m.H;
    this.created = m.created || Date.now();
    this.updated = m.updated || Date.now();
    this.settings = Object.assign({ bg: 'checker', shirt: '#141414', guides: true }, m.settings || {});
    this.ws = Math.min(1, WORK_MAX / Math.max(this.W, this.H));
    this.workW = Math.round(this.W * this.ws);
    this.workH = Math.round(this.H * this.ws);
    this.layers = [];
    this.active = 0;
    this.undoStack = [];
    this.redoStack = [];
    this.buf = makeCanvas(this.workW, this.workH);
    this.bctx = this.buf.getContext('2d');
    this.metaDirty = true;
    this.onChange = () => {};
  }

  static blank(preset, name) {
    const d = new Doc({ name, W: preset.W, H: preset.H });
    d.layers.push(new Layer(d, { name: 'Layer 1' }));
    return d;
  }

  get layer() {
    return this.layers[this.active];
  }
  layerById(id) {
    return this.layers.find((l) => l.id === id);
  }
  indexOf(L) {
    return this.layers.indexOf(L);
  }

  rectFor(bb) {
    const s = this.ws;
    const x0 = Math.max(0, Math.floor(bb[0] * s) - 1), y0 = Math.max(0, Math.floor(bb[1] * s) - 1);
    const x1 = Math.min(this.workW, Math.ceil(bb[2] * s) + 1), y1 = Math.min(this.workH, Math.ceil(bb[3] * s) + 1);
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  patchFrom(src, r) {
    if (r.w <= 0 || r.h <= 0) return null;
    const cv = makeCanvas(r.w, r.h);
    cv.getContext('2d').drawImage(src, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h);
    return { x: r.x, y: r.y, cv };
  }

  restorePatch(L, p) {
    if (!p) return;
    L.ctx.save();
    L.ctx.setTransform(1, 0, 0, 1, 0, 0);
    L.ctx.clearRect(p.x, p.y, p.cv.width, p.cv.height);
    L.ctx.drawImage(p.cv, p.x, p.y);
    L.ctx.restore();
  }

  renderToLayer(L, op) {
    renderOp(L.ctx, this.bctx, op, this.ws, 0, 0, this.W);
  }

  touch(L, what = {}) {
    if (L) {
      L.dirty = true;
      L.thumbDirty = true;
    }
    this.metaDirty = true;
    this.updated = Date.now();
    this.onChange(what);
  }

  push(entry) {
    this.undoStack.push(entry);
    for (const e of this.redoStack) dropEntry(e, this);
    this.redoStack.length = 0;
    while (this.undoStack.length > MAX_HISTORY) dropEntry(this.undoStack.shift(), this);
  }

  // op has already been drawn onto L; patch holds the pixels it replaced.
  commit(L, op, patch) {
    L.ops.push(op);
    this.push({ k: 'op', lid: L.id, op, patch });
    this.touch(L, { ops: true });
  }

  addLayer(index = this.active + 1, from) {
    if (this.layers.length >= MAX_LAYERS) return null;
    const n = this.layers.reduce((m, l) => Math.max(m, +(/\d+$/.exec(l.name) || [0])[0]), 0) + 1;
    const L = new Layer(this, { name: from ? from.name + ' copy' : 'Layer ' + n });
    if (from) {
      L.ops = from.ops.slice();
      L.opacity = from.opacity;
      L.ctx.drawImage(from.cv, 0, 0);
    }
    this.layers.splice(index, 0, L);
    this.active = index;
    this.push({ k: 'add', layer: L, index });
    this.touch(L, { layers: true });
    return L;
  }

  deleteLayer(index = this.active) {
    if (this.layers.length <= 1) return false;
    const [L] = this.layers.splice(index, 1);
    this.active = Math.min(this.active, this.layers.length - 1);
    this.push({ k: 'del', layer: L, index });
    this.touch(null, { layers: true });
    return true;
  }

  moveLayer(from, to) {
    if (to < 0 || to >= this.layers.length || from === to) return;
    const [L] = this.layers.splice(from, 1);
    this.layers.splice(to, 0, L);
    this.active = to;
    this.push({ k: 'move', from, to });
    this.touch(null, { layers: true });
  }

  clearLayer(L = this.layer) {
    if (!L.ops.length) return;
    const snap = this.patchFrom(L.cv, { x: 0, y: 0, w: this.workW, h: this.workH });
    const ops = L.ops;
    L.ops = [];
    L.ctx.clearRect(0, 0, this.workW, this.workH);
    this.push({ k: 'clear', lid: L.id, ops, snap });
    this.touch(L, { ops: true });
  }

  undo() {
    const e = this.undoStack.pop();
    if (!e) return false;
    if (e.k === 'op') {
      const L = this.layerById(e.lid);
      if (L) {
        L.ops.pop();
        this.restorePatch(L, e.patch);
        this.touch(L, { ops: true });
      }
    } else if (e.k === 'add') {
      this.layers.splice(this.layers.indexOf(e.layer), 1);
      this.active = Math.min(Math.max(0, e.index - 1), this.layers.length - 1);
      this.touch(null, { layers: true });
    } else if (e.k === 'del') {
      this.layers.splice(e.index, 0, e.layer);
      this.active = e.index;
      this.touch(e.layer, { layers: true });
    } else if (e.k === 'move') {
      const [L] = this.layers.splice(e.to, 1);
      this.layers.splice(e.from, 0, L);
      this.active = e.from;
      this.touch(null, { layers: true });
    } else if (e.k === 'clear') {
      const L = this.layerById(e.lid);
      if (L) {
        L.ops = e.ops;
        this.restorePatch(L, e.snap);
        this.touch(L, { ops: true });
      }
    }
    this.redoStack.push(e);
    return true;
  }

  redo() {
    const e = this.redoStack.pop();
    if (!e) return false;
    if (e.k === 'op') {
      const L = this.layerById(e.lid);
      if (L) {
        L.ops.push(e.op);
        this.renderToLayer(L, e.op);
        this.touch(L, { ops: true });
      }
    } else if (e.k === 'add') {
      this.layers.splice(e.index, 0, e.layer);
      this.active = e.index;
      this.touch(e.layer, { layers: true });
    } else if (e.k === 'del') {
      this.layers.splice(this.layers.indexOf(e.layer), 1);
      this.active = Math.min(this.active, this.layers.length - 1);
      this.touch(null, { layers: true });
    } else if (e.k === 'move') {
      const [L] = this.layers.splice(e.from, 1);
      this.layers.splice(e.to, 0, L);
      this.active = e.to;
      this.touch(null, { layers: true });
    } else if (e.k === 'clear') {
      const L = this.layerById(e.lid);
      if (L) {
        L.ops = [];
        L.ctx.clearRect(0, 0, this.workW, this.workH);
        this.touch(L, { ops: true });
      }
    }
    this.undoStack.push(e);
    return true;
  }

  // Distinct ink colours across visible layers — what a screen printer charges per.
  inks() {
    const seen = new Map();
    let soft = false;
    for (const L of this.layers) {
      if (!L.visible) continue;
      for (const op of L.ops) {
        if (op.t === 's' && op.b === 'eraser') continue;
        seen.set(op.c, (seen.get(op.c) || 0) + 1);
        if ((op.t === 's' && (op.op < 1 || op.b === 'pencil')) || L.opacity < 1) soft = true;
      }
    }
    return { colors: [...seen.keys()], soft };
  }

  composite(maxW) {
    const s = maxW ? Math.min(1, maxW / this.workW) : 1;
    const c = makeCanvas(this.workW * s, this.workH * s);
    const x = c.getContext('2d');
    x.imageSmoothingQuality = 'high';
    for (const L of this.layers) {
      if (!L.visible) continue;
      x.globalAlpha = L.opacity;
      x.drawImage(L.cv, 0, 0, c.width, c.height);
    }
    return c;
  }

  // ---------- persistence ----------
  async toRecord() {
    const layers = [];
    for (const L of this.layers) {
      // Snapshot ops and pixels together so a stroke landing mid-save can't split them.
      const snapOps = L.ops.slice();
      if (L.dirty || !L.blob) {
        L.dirty = false;
        L.blob = await canvasToBlob(L.cv);
      }
      const ops = [];
      for (const op of snapOps) {
        if (op.t === 'f') {
          if (!op.maskBlob) op.maskBlob = await canvasToBlob(op.mask);
          const { mask, ...rest } = op;
          ops.push(rest);
        } else ops.push(op);
      }
      layers.push({ id: L.id, name: L.name, visible: L.visible, opacity: L.opacity, blob: L.blob, ops });
    }
    const t = this.composite(360);
    const thumb = await canvasToBlob(t);
    freeCanvas(t);
    const meta = { id: this.id, name: this.name, W: this.W, H: this.H, created: this.created, updated: this.updated, thumb };
    const data = { id: this.id, layers, active: this.active, settings: this.settings };
    return { meta, data };
  }

  static async fromRecord(meta, data) {
    const d = new Doc(Object.assign({}, meta, { settings: data.settings }));
    for (const rec of data.layers) {
      const L = new Layer(d, rec);
      for (const op of L.ops) {
        if (op.t === 'f' && !op.mask) {
          const bm = await createImageBitmap(op.maskBlob);
          op.mask = makeCanvas(bm.width, bm.height);
          op.mask.getContext('2d').drawImage(bm, 0, 0);
          bm.close?.();
        }
      }
      let ok = false;
      if (rec.blob) {
        try {
          const bm = await createImageBitmap(rec.blob);
          L.ctx.drawImage(bm, 0, 0, d.workW, d.workH);
          bm.close?.();
          L.blob = rec.blob;
          L.dirty = false;
          ok = true;
        } catch {}
      }
      if (!ok) for (const op of L.ops) d.renderToLayer(L, op);
      d.layers.push(L);
    }
    d.active = Math.min(data.active || 0, d.layers.length - 1);
    d.metaDirty = false;
    return d;
  }

  dispose() {
    for (const L of this.layers) freeCanvas(L.cv);
    for (const e of [...this.undoStack, ...this.redoStack]) dropEntry(e, null);
    freeCanvas(this.buf);
  }

  // ---------- print export ----------
  // Re-renders every recorded op at full 300 dpi in horizontal bands and streams
  // the rows into one PNG, so the file is sharp at full print size.
  async exportPrint(onProgress = () => {}) {
    if (!canStreamPNG()) {
      const c = this.composite();
      const b = await canvasToBlob(c);
      freeCanvas(c);
      return { blob: b, w: this.workW, h: this.workH, reduced: true };
    }
    const W = this.W, H = this.H;
    const bandH = Math.max(1, Math.min(H, Math.floor(5_000_000 / W)));
    const bands = Math.ceil(H / bandH);
    const comp = makeCanvas(W, bandH), cctx = comp.getContext('2d', { willReadFrequently: true });
    const lay = makeCanvas(W, bandH), lctx = lay.getContext('2d');
    const buf = makeCanvas(W, bandH), bctx = buf.getContext('2d');
    const png = new PNGWriter(W, H, 300);
    const visible = this.layers.filter((l) => l.visible);
    try {
      for (let b = 0; b < bands; b++) {
        const oy = b * bandH;
        const rows = Math.min(bandH, H - oy);
        cctx.clearRect(0, 0, W, bandH);
        for (const L of visible) {
          lctx.setTransform(1, 0, 0, 1, 0, 0);
          lctx.clearRect(0, 0, W, bandH);
          for (const op of L.ops) {
            if (op.bb[3] < oy || op.bb[1] > oy + rows) continue;
            renderOp(lctx, bctx, op, 1, 0, oy, W);
          }
          cctx.globalAlpha = L.opacity;
          cctx.drawImage(lay, 0, 0);
          cctx.globalAlpha = 1;
          await tick();
        }
        const img = cctx.getImageData(0, 0, W, rows);
        await png.addRows(img.data, rows);
        onProgress((b + 1) / bands);
      }
      const blob = await png.finish();
      return { blob, w: W, h: H };
    } finally {
      freeCanvas(comp);
      freeCanvas(lay);
      freeCanvas(buf);
    }
  }
}

function dropEntry(e, doc) {
  if (e.patch) freeCanvas(e.patch.cv);
  if (e.snap) freeCanvas(e.snap.cv);
  // A layer only referenced by history (deleted, or an undone add) can be released.
  if (e.layer && (!doc || !doc.layers.includes(e.layer))) freeCanvas(e.layer.cv);
}
