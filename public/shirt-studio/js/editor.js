import { clamp, dist, prefs, makeCanvas, freeCanvas, hexToRgb, rgbToHex } from './util.js';
import { BRUSHES, BRUSH_IDS, StrokeRenderer, strokeBBox, widthAt } from './brushes.js';
import { renderOp, composite, textLayout, drawText, ensureFont } from './render.js';
import { pushRecent } from './color.js';

const $ = (s) => document.querySelector(s);
const REF_W = 4500;

function normAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export class Editor {
  constructor(ui) {
    this.ui = ui;
    this.stage = $('#stage');
    this.board = $('#board');
    this.bgEl = $('#bg');
    this.guides = $('#guides');
    this.cursor = $('#cursor');
    this.loupe = $('#loupe');
    this.zoomLabel = $('#zoomlabel');
    this.strokeCv = document.createElement('canvas');
    this.strokeCv.id = 'strokecv';
    this.pickCv = makeCanvas(1, 1);
    this.pickCtx = this.pickCv.getContext('2d', { willReadFrequently: true });

    this.doc = null;
    const saved = prefs.get('brushes', {});
    this.brush = {};
    for (const id of Object.keys(BRUSHES)) {
      const B = BRUSHES[id];
      const v = Math.sqrt((B.size - B.min) / (REF_W * B.max - B.min));
      this.brush[id] = Object.assign({ v, op: B.opacity, smooth: B.smooth }, saved[id] || {});
    }
    let t = prefs.get('tool', 'ink');
    if (!(t in BRUSHES) && t !== 'fill' && t !== 'picker') t = 'ink';
    this.tool = t;
    this.lastBrush = BRUSH_IDS.includes(t) ? t : prefs.get('lastBrush', 'ink');
    this.color = prefs.get('color', '#141414');
    this.sym = false;
    this.fillTol = prefs.get('fillTol', 40);
    this.finger = prefs.get('finger', 'auto');
    this.penSeen = prefs.get('penSeen', false);

    this.view = { z: 1, r: 0, tx: 0, ty: 0, flip: false };
    this.fitZ = 1;
    this.isFit = true;
    this.touches = new Map();
    this.action = null;
    this.gesture = null;
    this.single = null;
    this.pan = null;
    this.penDown = false;
    this.penUpAt = 0;
    this.blockTouches = false;
    this.placing = false;
    this.raf = 0;
    this.bindInput();
  }

  // ---------------- setup ----------------
  open(doc) {
    this.doc = doc;
    this.board.style.width = doc.workW + 'px';
    this.board.style.height = doc.workH + 'px';
    this.strokeCv.width = doc.workW;
    this.strokeCv.height = doc.workH;
    this.sctx = this.strokeCv.getContext('2d');
    this.view.flip = false;
    this.sym = false;
    this.syncLayers();
    this.applyBg();
    this.drawGuides();
    this.fit();
  }

  close() {
    this.cancelAction();
    this.cancelSingle();
    this.gesture = null;
    if (this.placing) this.endPlacing();
    this.board.querySelectorAll('canvas').forEach((c) => c.remove());
    freeCanvas(this.strokeCv);
    this.doc = null;
  }

  syncLayers() {
    const d = this.doc;
    this.board.querySelectorAll('canvas').forEach((c) => c.remove());
    d.layers.forEach((L, i) => {
      L.cv.style.opacity = L.opacity;
      L.cv.style.visibility = L.visible ? 'visible' : 'hidden';
      this.board.insertBefore(L.cv, this.guides);
      if (i === d.active) this.board.insertBefore(this.strokeCv, this.guides);
    });
  }

  applyBg() {
    const s = this.doc.settings;
    if (s.bg === 'shirt') {
      this.bgEl.className = '';
      this.bgEl.style.background = s.shirt;
    } else {
      this.bgEl.className = 'checker';
      this.bgEl.style.background = '';
    }
  }

  drawGuides() {
    const d = this.doc, s = d.settings, W = d.workW, H = d.workH;
    this.guides.setAttribute('viewBox', `0 0 ${W} ${H}`);
    let h = '';
    const c = 'rgba(64,140,255,0.75)';
    if (this.sym) h += `<line x1="${W / 2}" y1="0" x2="${W / 2}" y2="${H}" stroke="${c}" stroke-width="2"/>`;
    else if (s.guides) h += `<line x1="${W / 2}" y1="0" x2="${W / 2}" y2="${H}" stroke="${c}" stroke-width="1" stroke-dasharray="6 6"/>`;
    if (s.guides) {
      const m = (0.5 * 300) * d.ws; // half-inch safety margin
      if (W > m * 6) h += `<rect x="${m}" y="${m}" width="${W - 2 * m}" height="${H - 2 * m}" stroke="rgba(64,140,255,0.35)" stroke-width="1" stroke-dasharray="3 5"/>`;
    }
    this.guides.innerHTML = h;
  }

  fingerDraws() {
    return this.finger === 'draw' || (this.finger === 'auto' && !this.penSeen);
  }

  // ---------------- brushes ----------------
  get railBrush() {
    return this.tool in BRUSHES ? this.tool : this.lastBrush;
  }
  sizeFor(id, v = this.brush[id].v) {
    const B = BRUSHES[id];
    const W = this.doc ? this.doc.W : REF_W;
    const max = Math.max(B.min + 1, W * B.max);
    return B.min + (max - B.min) * v * v;
  }
  saveBrushes() {
    prefs.set('brushes', this.brush);
  }

  setTool(t) {
    if (t === 'text') return this.ui.openText();
    this.tool = t;
    if (BRUSH_IDS.includes(t)) {
      this.lastBrush = t;
      prefs.set('lastBrush', t);
    }
    prefs.set('tool', t);
    this.hideCursor();
    this.ui.refreshTools();
  }

  setColor(hex) {
    this.color = hex;
    prefs.set('color', hex);
    if (this.placing && this.textDraft) {
      this.textDraft.c = hex;
      this.renderDraft();
    }
    this.ui.refreshColor();
  }

  toggleSym() {
    this.sym = !this.sym;
    this.drawGuides();
    this.ui.refreshTools();
    this.ui.toast(this.sym ? 'Mirror on — strokes repeat across the centre' : 'Mirror off');
  }

  // ---------------- view ----------------
  lin(v = this.view) {
    const c = Math.cos(v.r), s = Math.sin(v.r), fx = v.flip ? -1 : 1;
    return [v.z * c * fx, v.z * s * fx, -v.z * s, v.z * c];
  }
  applyView() {
    const [a, b, c, d] = this.lin();
    this.board.style.transform = `matrix(${a},${b},${c},${d},${this.view.tx},${this.view.ty})`;
  }
  toWork(cx, cy, v = this.view) {
    const [a, b, c, d] = this.lin(v);
    const dx = cx - v.tx, dy = cy - v.ty, det = a * d - b * c;
    return [(d * dx - c * dy) / det, (-b * dx + a * dy) / det];
  }
  toDoc(cx, cy) {
    const [x, y] = this.toWork(cx, cy);
    return [x / this.doc.ws, y / this.doc.ws];
  }
  // put work point (wx, wy) at screen (sx, sy)
  anchor(wx, wy, sx, sy) {
    const [a, b, c, d] = this.lin();
    this.view.tx = sx - (a * wx + c * wy);
    this.view.ty = sy - (b * wx + d * wy);
  }
  frameBox() {
    const top = 76, bottom = 100, side = 96;
    const vw = innerWidth, vh = innerHeight;
    return { x: side, y: top, w: Math.max(100, vw - side * 2), h: Math.max(100, vh - top - bottom) };
  }
  fit(animate) {
    if (!this.doc) return;
    const f = this.frameBox(), d = this.doc;
    const z = Math.min(f.w / d.workW, f.h / d.workH);
    this.fitZ = z;
    const go = () => {
      this.view.z = z;
      this.view.r = 0;
      this.anchor(d.workW / 2, d.workH / 2, f.x + f.w / 2, f.y + f.h / 2);
      this.applyView();
    };
    if (animate) {
      this.board.style.transition = 'transform .28s cubic-bezier(.2,.8,.2,1)';
      go();
      setTimeout(() => (this.board.style.transition = ''), 300);
    } else go();
    this.isFit = true;
  }
  onResize() {
    if (!this.doc) return;
    if (this.isFit) return this.fit();
    const [wx, wy] = this.lastCenter || [this.doc.workW / 2, this.doc.workH / 2];
    this.anchor(wx, wy, innerWidth / 2, innerHeight / 2);
    this.applyView();
  }
  rememberCenter() {
    this.lastCenter = this.toWork(innerWidth / 2, innerHeight / 2);
  }
  zoomAt(sx, sy, k) {
    const [wx, wy] = this.toWork(sx, sy);
    this.view.z = clamp(this.view.z * k, this.fitZ * 0.2, Math.max(8, this.fitZ * 30));
    this.anchor(wx, wy, sx, sy);
    this.applyView();
    this.isFit = false;
    this.showZoom();
  }
  toggleFlip() {
    const [wx, wy] = this.toWork(innerWidth / 2, innerHeight / 2);
    this.view.flip = !this.view.flip;
    this.anchor(wx, wy, innerWidth / 2, innerHeight / 2);
    this.applyView();
    this.ui.toast(this.view.flip ? 'Canvas flipped (view only)' : 'Canvas back to normal');
  }
  showZoom() {
    const pct = Math.round((this.view.z / this.fitZ) * 100);
    const deg = Math.round((normAngle(this.view.r) * 180) / Math.PI);
    this.zoomLabel.textContent = deg ? `${pct}%  ·  ${deg}°` : `${pct}%`;
    this.zoomLabel.classList.add('show');
    clearTimeout(this._zt);
    this._zt = setTimeout(() => this.zoomLabel.classList.remove('show'), 700);
  }

  // ---------------- input ----------------
  bindInput() {
    const s = this.stage;
    s.addEventListener('pointerdown', (e) => this.onDown(e));
    s.addEventListener('pointermove', (e) => this.onMove(e));
    s.addEventListener('pointerup', (e) => this.onUp(e));
    s.addEventListener('pointercancel', (e) => this.onUp(e, true));
    s.addEventListener('pointerleave', (e) => {
      if (e.pointerType !== 'touch') this.hideCursor();
    });
    s.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    s.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    s.addEventListener('contextmenu', (e) => e.preventDefault());
    s.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        if (!this.doc) return;
        if (e.ctrlKey || e.metaKey) this.zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.01));
        else {
          this.view.tx -= e.deltaX;
          this.view.ty -= e.deltaY;
          this.isFit = false;
          this.applyView();
        }
        this.rememberCenter();
      },
      { passive: false }
    );
  }

  onDown(e) {
    if (!this.doc) return;
    e.preventDefault();
    try {
      this.stage.setPointerCapture(e.pointerId);
    } catch {}
    const t = e.pointerType;
    if (t === 'pen') {
      if (!this.penSeen) {
        this.penSeen = true;
        prefs.set('penSeen', true);
      }
      this.penDown = true;
      this.hideCursor();
      // Pencil wins: drop whatever a resting palm or finger had started.
      if (this.action && this.action.type === 'finger') this.cancelAction();
      this.cancelSingle();
      this.gesture = null;
      if (this.touches.size) this.blockTouches = true;
      if (!this.action) this.startAction(e, 'pen');
      return;
    }
    if (t === 'mouse') {
      if (e.button === 0) this.startAction(e, 'mouse');
      else this.pan = { id: e.pointerId, x: e.clientX, y: e.clientY };
      return;
    }
    // touch
    if (this.penDown || performance.now() - this.penUpAt < 300) return; // palm
    this.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.blockTouches) return;
    const n = this.touches.size;
    if (n === 1) {
      if (this.placing || this.fingerDraws()) this.startAction(e, 'finger');
      else this.startSingle(e);
    } else if (n === 2) {
      if (this.action && this.action.type === 'finger') this.cancelAction();
      this.cancelSingle();
      this.startGesture();
    } else if (this.gesture) {
      this.gesture.max = Math.max(this.gesture.max, n);
    }
  }

  onMove(e) {
    if (!this.doc) return;
    const a = this.action;
    if (a && e.pointerId === a.id) return this.moveAction(e);
    const t = e.pointerType;
    if (t === 'pen' || t === 'mouse') {
      if (this.pan && this.pan.id === e.pointerId) {
        this.view.tx += e.clientX - this.pan.x;
        this.view.ty += e.clientY - this.pan.y;
        this.pan.x = e.clientX;
        this.pan.y = e.clientY;
        this.isFit = false;
        this.applyView();
        return;
      }
      if (!a) this.hover(e);
      return;
    }
    const tp = this.touches.get(e.pointerId);
    if (!tp) return;
    tp.x = e.clientX;
    tp.y = e.clientY;
    if (this.gesture) this.moveGesture();
    else if (this.single && this.single.id === e.pointerId) this.moveSingle(e);
  }

  onUp(e, cancelled) {
    if (!this.doc) return;
    if (e.pointerType === 'pen') {
      this.penDown = false;
      this.penUpAt = performance.now();
    }
    if (this.action && e.pointerId === this.action.id) this.endAction(e);
    if (this.pan && this.pan.id === e.pointerId) {
      this.pan = null;
      this.rememberCenter();
    }
    if (this.touches.has(e.pointerId)) {
      this.touches.delete(e.pointerId);
      if (this.gesture && this.touches.size < 2) {
        this.endGesture(cancelled);
        this.blockTouches = this.touches.size > 0;
      }
      if (this.single && this.single.id === e.pointerId) this.endSingle();
      if (this.touches.size === 0) this.blockTouches = false;
    }
  }

  // ---- two/three finger gestures: pan, pinch zoom, rotate, tap to undo/redo
  startGesture() {
    const ids = [...this.touches.keys()].slice(0, 2);
    const p = ids.map((id) => ({ ...this.touches.get(id) }));
    this.gesture = { ids, p0: p, v0: { ...this.view }, t0: performance.now(), moved: false, max: 2 };
  }
  moveGesture() {
    const g = this.gesture;
    const p = g.ids.map((id) => this.touches.get(id));
    if (!p[0] || !p[1]) return;
    const [a0, b0] = g.p0, [a1, b1] = p;
    const m0x = (a0.x + b0.x) / 2, m0y = (a0.y + b0.y) / 2;
    const mx = (a1.x + b1.x) / 2, my = (a1.y + b1.y) / 2;
    const d0 = dist(a0.x, a0.y, b0.x, b0.y) || 1, d1 = dist(a1.x, a1.y, b1.x, b1.y) || 1;
    const ang0 = Math.atan2(b0.y - a0.y, b0.x - a0.x), ang1 = Math.atan2(b1.y - a1.y, b1.x - a1.x);
    const dAng = normAngle(ang1 - ang0);
    if (!g.moved && (Math.abs(d1 - d0) > 14 || dist(mx, my, m0x, m0y) > 14 || Math.abs(dAng) > 0.12)) g.moved = true;
    if (!g.moved) return;
    const [wx, wy] = this.toWork(m0x, m0y, g.v0);
    this.view.z = clamp(g.v0.z * (d1 / d0), this.fitZ * 0.2, Math.max(8, this.fitZ * 30));
    let r = normAngle(g.v0.r + dAng);
    for (const snap of [0, Math.PI / 2, -Math.PI / 2, Math.PI]) if (Math.abs(normAngle(r - snap)) < 0.07) r = snap;
    this.view.r = r;
    this.anchor(wx, wy, mx, my);
    this.applyView();
    this.isFit = false;
    this.showZoom();
  }
  endGesture(cancelled) {
    const g = this.gesture;
    this.gesture = null;
    if (!g || cancelled) return;
    const dur = performance.now() - g.t0;
    if (!g.moved && dur < 320) {
      if (g.max >= 3) this.ui.redo();
      else this.ui.undo();
    } else if (g.moved && dur < 400 && this.view.z / g.v0.z < 0.6) {
      this.fit(true); // quick pinch-in snaps to fit
    }
    this.rememberCenter();
  }

  // ---- one finger when the Pencil is the drawing tool: drag pans, hold picks colour
  startSingle(e) {
    const s = { id: e.pointerId, x0: e.clientX, y0: e.clientY, lx: e.clientX, ly: e.clientY, mode: 'pending' };
    s.timer = setTimeout(() => {
      if (this.single === s && s.mode === 'pending') {
        s.mode = 'pick';
        this.startPick(s.lx, s.ly);
      }
    }, 420);
    this.single = s;
  }
  moveSingle(e) {
    const s = this.single;
    if (s.mode === 'pending' && dist(e.clientX, e.clientY, s.x0, s.y0) > 10) {
      clearTimeout(s.timer);
      s.mode = 'pan';
    }
    if (s.mode === 'pan') {
      this.view.tx += e.clientX - s.lx;
      this.view.ty += e.clientY - s.ly;
      this.isFit = false;
      this.applyView();
    } else if (s.mode === 'pick') this.movePick(e.clientX, e.clientY);
    s.lx = e.clientX;
    s.ly = e.clientY;
  }
  endSingle() {
    const s = this.single;
    clearTimeout(s.timer);
    if (s.mode === 'pick') this.finishPick();
    if (s.mode === 'pan') this.rememberCenter();
    this.single = null;
  }
  cancelSingle() {
    const s = this.single;
    if (!s) return;
    clearTimeout(s.timer);
    if (s.mode === 'pick') this.hideLoupe();
    this.single = null;
  }

  // ---- tool actions
  startAction(e, type) {
    const [dx, dy] = this.toDoc(e.clientX, e.clientY);
    if (this.placing) {
      this.action = { id: e.pointerId, type, kind: 'textdrag', lx: dx, ly: dy };
      return;
    }
    if (this.tool === 'picker') {
      this.action = { id: e.pointerId, type, kind: 'pick' };
      this.startPick(e.clientX, e.clientY);
      return;
    }
    if (this.tool === 'fill') {
      this.action = { id: e.pointerId, type, kind: 'fill' };
      this.doFill(dx, dy);
      return;
    }
    if (this.tool in BRUSHES) this.beginStroke(e, type);
  }
  moveAction(e) {
    const a = this.action;
    if (a.kind === 'stroke') {
      const list = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
      if (list && list.length) for (const ev of list) this.addPoint(ev);
      else this.addPoint(e);
      this.schedule();
    } else if (a.kind === 'pick') this.movePick(e.clientX, e.clientY);
    else if (a.kind === 'textdrag') {
      const [dx, dy] = this.toDoc(e.clientX, e.clientY);
      this.textDraft.x += dx - a.lx;
      this.textDraft.y += dy - a.ly;
      a.lx = dx;
      a.ly = dy;
      this.renderDraft();
    }
  }
  endAction() {
    const a = this.action;
    if (a.kind === 'stroke') this.endStroke();
    else if (a.kind === 'pick') this.finishPick();
    this.action = null;
  }
  cancelAction() {
    const a = this.action;
    if (!a) return;
    if (a.kind === 'stroke') this.cancelStroke();
    else if (a.kind === 'pick') this.hideLoupe();
    this.action = null;
  }

  // ---------------- strokes ----------------
  beginStroke(e, type) {
    const d = this.doc, L = d.layer;
    if (!L.visible) {
      this.ui.toast('This layer is hidden');
      return;
    }
    const id = this.tool, bs = this.brush[id];
    const op = { t: 's', b: id, c: this.color, sz: this.sizeFor(id), op: bs.op, sym: this.sym, seed: (Math.random() * 4294967296) >>> 0, pts: [] };
    const st = { op, L, rend: new StrokeRenderer(op, d.W), smooth: bs.smooth, n: 0, rect: null, pen: type === 'pen', eraser: id === 'eraser', raw: null };
    this.action = { id: e.pointerId, type, kind: 'stroke', st };
    const sc = this.sctx;
    sc.setTransform(1, 0, 0, 1, 0, 0);
    sc.clearRect(0, 0, d.workW, d.workH);
    if (st.eraser) {
      d.bctx.setTransform(1, 0, 0, 1, 0, 0);
      d.bctx.clearRect(0, 0, d.workW, d.workH);
      d.bctx.drawImage(L.cv, 0, 0);
      this.strokeCv.style.visibility = 'hidden';
    } else {
      this.strokeCv.style.visibility = 'visible';
      this.strokeCv.style.opacity = op.op * L.opacity;
    }
    sc.setTransform(d.ws, 0, 0, d.ws, 0, 0);
    this.addPoint(e);
    this.schedule();
  }

  pressure(ev, st) {
    if (!st.pen) return 1;
    const p = ev.pressure;
    return p > 0 ? clamp(p, 0.02, 1) : 0.4;
  }

  addPoint(ev) {
    const st = this.action.st, op = st.op, P = op.pts;
    const [x, y] = this.toDoc(ev.clientX, ev.clientY);
    const p = this.pressure(ev, st);
    st.raw = [x, y];
    if (st.n === 0) {
      st.sx = x; st.sy = y; st.sp = p;
    } else {
      const a = 1 - st.smooth * 0.9;
      st.sx += (x - st.sx) * a;
      st.sy += (y - st.sy) * a;
      st.sp += (p - st.sp) * 0.45;
      const minD = 0.75 / (this.view.z * this.doc.ws);
      if (dist(st.sx, st.sy, P[P.length - 3], P[P.length - 2]) < minD) return;
    }
    P.push(st.sx, st.sy, st.sp);
    st.n++;
    this.growRect(st, st.sx, st.sy);
  }

  growRect(st, x, y) {
    const d = this.doc, op = st.op;
    const w = widthAt(op.b, op.sz, 1) * 0.6 + 2;
    const xs = op.sym ? [x, d.W - x] : [x];
    for (const xx of xs) {
      const x0 = Math.max(0, Math.floor((xx - w) * d.ws)), y0 = Math.max(0, Math.floor((y - w) * d.ws));
      const x1 = Math.min(d.workW, Math.ceil((xx + w) * d.ws)), y1 = Math.min(d.workH, Math.ceil((y + w) * d.ws));
      const r = st.rect;
      if (!r) st.rect = { x0, y0, x1, y1 };
      else {
        r.x0 = Math.min(r.x0, x0); r.y0 = Math.min(r.y0, y0);
        r.x1 = Math.max(r.x1, x1); r.y1 = Math.max(r.y1, y1);
      }
    }
  }

  schedule() {
    if (!this.raf) this.raf = requestAnimationFrame(() => {
      this.raf = 0;
      const a = this.action;
      if (a && a.kind === 'stroke') {
        a.st.rend.drawUpTo(this.sctx, false);
        if (a.st.eraser) this.eraserRefresh(a.st);
      }
    });
  }

  // Live eraser: layer = snapshot minus the eraser buffer, redrawn only where touched.
  eraserRefresh(st, rr) {
    const r = rr || (st.rect && { x: st.rect.x0, y: st.rect.y0, w: st.rect.x1 - st.rect.x0, h: st.rect.y1 - st.rect.y0 });
    if (!r || r.w <= 0 || r.h <= 0) return;
    const c = st.L.ctx;
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(r.x, r.y, r.w, r.h);
    c.drawImage(this.doc.buf, r.x, r.y, r.w, r.h, r.x, r.y, r.w, r.h);
    c.globalCompositeOperation = 'destination-out';
    c.globalAlpha = st.op.op;
    c.drawImage(this.strokeCv, r.x, r.y, r.w, r.h, r.x, r.y, r.w, r.h);
    c.restore();
  }

  endStroke() {
    const st = this.action.st, op = st.op, d = this.doc, L = st.L;
    if (!st.n) return this.cancelStroke();
    // Smoothing trails the pen; ease the line into the exact lift-off point.
    if (st.raw && st.smooth > 0.05) {
      const [x, y] = st.raw, a = 1 - st.smooth * 0.9;
      for (let i = 0; i < 4; i++) {
        st.sx += (x - st.sx) * Math.max(a, 0.5);
        st.sy += (y - st.sy) * Math.max(a, 0.5);
        const P = op.pts;
        if (dist(st.sx, st.sy, P[P.length - 3], P[P.length - 2]) > 0.5) {
          P.push(st.sx, st.sy, st.sp);
          st.n++;
          this.growRect(st, st.sx, st.sy);
        }
      }
    }
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
    st.rend.drawUpTo(this.sctx, true);
    op.pts = Float32Array.from(op.pts);
    op.bb = strokeBBox(op, d.W);
    const r = d.rectFor(op.bb);
    let patch;
    if (st.eraser) {
      this.eraserRefresh(st, r);
      patch = d.patchFrom(d.buf, r);
    } else {
      patch = d.patchFrom(L.cv, r);
      composite(L.ctx, this.strokeCv, r, op.op, false);
    }
    this.clearStroke();
    d.commit(L, op, patch);
    if (!st.eraser) pushRecent(op.c);
  }

  cancelStroke() {
    const a = this.action;
    if (a && a.st && a.st.eraser && a.st.rect) {
      const r = a.st.rect;
      const c = a.st.L.ctx;
      c.save();
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0);
      c.drawImage(this.doc.buf, r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0, r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0);
      c.restore();
    }
    this.clearStroke();
    this.action = null;
  }

  clearStroke() {
    const sc = this.sctx;
    sc.setTransform(1, 0, 0, 1, 0, 0);
    sc.clearRect(0, 0, this.strokeCv.width, this.strokeCv.height);
  }

  // ---------------- fill ----------------
  doFill(dx, dy) {
    const d = this.doc, L = d.layer;
    if (!L.visible) return this.ui.toast('This layer is hidden');
    const w = d.workW, h = d.workH;
    const ix = Math.floor(dx * d.ws), iy = Math.floor(dy * d.ws);
    if (ix < 0 || iy < 0 || ix >= w || iy >= h) return;
    const tmp = makeCanvas(w, h);
    const tctx = tmp.getContext('2d', { willReadFrequently: true });
    for (const l of d.layers) {
      if (!l.visible) continue;
      tctx.globalAlpha = l.opacity;
      tctx.drawImage(l.cv, 0, 0);
    }
    const data = tctx.getImageData(0, 0, w, h).data;
    freeCanvas(tmp);
    const j0 = (iy * w + ix) * 4;
    const sr = data[j0], sg = data[j0 + 1], sb = data[j0 + 2], sa = data[j0 + 3];
    const tol = this.fillTol;
    const match = (i) => {
      const j = i * 4;
      if (Math.abs(data[j + 3] - sa) > tol) return false;
      if (sa < 8 && data[j + 3] < 8) return true;
      return Math.abs(data[j] - sr) <= tol && Math.abs(data[j + 1] - sg) <= tol && Math.abs(data[j + 2] - sb) <= tol;
    };
    const mask = new Uint8Array(w * h);
    const stack = [ix, iy];
    let minx = ix, maxx = ix, miny = iy, maxy = iy, count = 0;
    while (stack.length) {
      const y = stack.pop();
      let x = stack.pop();
      let i = y * w + x;
      if (mask[i]) continue;
      while (x > 0 && !mask[i - 1] && match(i - 1)) { x--; i--; }
      let up = false, down = false;
      while (x < w && !mask[i] && match(i)) {
        mask[i] = 1;
        count++;
        if (x < minx) minx = x;
        if (x > maxx) maxx = x;
        if (y < miny) miny = y;
        if (y > maxy) maxy = y;
        if (y > 0) {
          const u = i - w;
          if (!mask[u] && match(u)) { if (!up) { stack.push(x, y - 1); up = true; } } else up = false;
        }
        if (y < h - 1) {
          const dn = i + w;
          if (!mask[dn] && match(dn)) { if (!down) { stack.push(x, y + 1); down = true; } } else down = false;
        }
        x++;
        i++;
      }
    }
    if (!count) return;
    // grow 2 px so the fill tucks under anti-aliased line edges
    const R = 2;
    const bx = Math.max(0, minx - R), by = Math.max(0, miny - R);
    const bw = Math.min(w, maxx + R + 1) - bx, bh = Math.min(h, maxy + R + 1) - by;
    const hor = new Uint8Array(bw * bh);
    for (let y = 0; y < bh; y++) {
      const row = (by + y) * w;
      for (let x = 0; x < bw; x++) {
        const gx = bx + x;
        let on = 0;
        for (let k = -R; k <= R && !on; k++) {
          const xx = gx + k;
          if (xx >= 0 && xx < w && mask[row + xx]) on = 1;
        }
        hor[y * bw + x] = on;
      }
    }
    const [cr, cg, cb] = hexToRgb(this.color);
    const img = new ImageData(bw, bh);
    const px = img.data;
    for (let y = 0; y < bh; y++) {
      for (let x = 0; x < bw; x++) {
        let on = 0;
        for (let k = -R; k <= R && !on; k++) {
          const yy = y + k;
          if (yy >= 0 && yy < bh && hor[yy * bw + x]) on = 1;
        }
        if (on) {
          const o = (y * bw + x) * 4;
          px[o] = cr; px[o + 1] = cg; px[o + 2] = cb; px[o + 3] = 255;
        }
      }
    }
    const maskCv = makeCanvas(bw, bh);
    maskCv.getContext('2d').putImageData(img, 0, 0);
    const patch = d.patchFrom(L.cv, { x: bx, y: by, w: bw, h: bh });
    // Fill goes behind existing marks on the layer so line art stays on top.
    L.ctx.save();
    L.ctx.globalCompositeOperation = 'destination-over';
    L.ctx.drawImage(maskCv, bx, by);
    L.ctx.restore();
    const op = { t: 'f', c: this.color, mask: maskCv, px: [bx, by], ws: d.ws, bb: [bx / d.ws, by / d.ws, (bx + bw) / d.ws, (by + bh) / d.ws] };
    d.commit(L, op, patch);
    pushRecent(op.c);
  }

  // ---------------- eyedropper ----------------
  sampleAt(cx, cy) {
    const d = this.doc;
    const [wx, wy] = this.toWork(cx, cy);
    const ix = Math.floor(wx), iy = Math.floor(wy);
    if (ix < 0 || iy < 0 || ix >= d.workW || iy >= d.workH) return null;
    const c = this.pickCtx;
    c.clearRect(0, 0, 1, 1);
    for (const L of d.layers) {
      if (!L.visible) continue;
      c.globalAlpha = L.opacity;
      c.drawImage(L.cv, ix, iy, 1, 1, 0, 0, 1, 1);
    }
    c.globalAlpha = 1;
    const p = c.getImageData(0, 0, 1, 1).data;
    if (p[3] < 12) return null;
    return rgbToHex(p[0], p[1], p[2]);
  }
  startPick(cx, cy) {
    this.picked = null;
    this.loupe.style.display = 'block';
    this.movePick(cx, cy);
  }
  movePick(cx, cy) {
    const hex = this.sampleAt(cx, cy);
    if (hex) this.picked = hex;
    this.loupe.style.left = cx + 'px';
    this.loupe.style.top = cy + 'px';
    const top = this.picked || 'rgba(0,0,0,0)';
    this.loupe.style.background = `linear-gradient(${top} 50%, ${this.color} 50%)`;
  }
  finishPick() {
    this.hideLoupe();
    if (this.picked) this.setColor(this.picked);
  }
  hideLoupe() {
    this.loupe.style.display = 'none';
  }

  // ---------------- hover cursor (Pencil hover on M2+ iPads, mouse) ----------------
  hover(e) {
    if (!(this.tool in BRUSHES) || this.placing) return this.hideCursor();
    const size = widthAt(this.tool, this.sizeFor(this.tool), 1) * this.doc.ws * this.view.z;
    const c = this.cursor;
    c.style.display = 'block';
    c.style.width = c.style.height = Math.max(4, size) + 'px';
    c.style.left = e.clientX + 'px';
    c.style.top = e.clientY + 'px';
    clearTimeout(this._ct);
    this._ct = setTimeout(() => this.hideCursor(), 1500);
  }
  hideCursor() {
    this.cursor.style.display = 'none';
  }

  // ---------------- text ----------------
  async beginPlacing(str, font) {
    await ensureFont(font);
    const d = this.doc;
    let [x, y] = this.toDoc(innerWidth / 2, innerHeight / 2);
    x = clamp(x, d.W * 0.1, d.W * 0.9);
    y = clamp(y, d.H * 0.1, d.H * 0.9);
    const sz = this.textDraft?.sz || prefs.get('textSize', Math.round(d.W * 0.1));
    this.textDraft = { t: 'x', str, font, sz: Math.min(sz, d.W * 0.5), c: this.color, x, y };
    this.placing = true;
    document.body.classList.add('placing');
    this.strokeCv.style.visibility = 'visible';
    this.strokeCv.style.opacity = 1;
    this.renderDraft();
  }
  renderDraft() {
    const d = this.doc, t = this.textDraft;
    if (!t) return;
    this.clearStroke();
    const sc = this.sctx;
    sc.setTransform(d.ws, 0, 0, d.ws, 0, 0);
    drawText(sc, t);
    const bb = textLayout(t).bb;
    sc.setLineDash([8 / (d.ws * this.view.z), 6 / (d.ws * this.view.z)]);
    sc.lineWidth = 1.5 / (d.ws * this.view.z);
    sc.strokeStyle = 'rgba(64,140,255,0.9)';
    sc.strokeRect(bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]);
    sc.setLineDash([]);
  }
  setTextSize(sz) {
    if (!this.textDraft) return;
    this.textDraft.sz = sz;
    prefs.set('textSize', sz);
    this.renderDraft();
  }
  commitText() {
    const d = this.doc, L = d.layer, t = this.textDraft;
    if (!t || !t.str.trim()) return this.endPlacing();
    if (!L.visible) {
      this.ui.toast('This layer is hidden');
      return;
    }
    t.bb = textLayout(t).bb;
    const r = d.rectFor(t.bb);
    const op = { ...t };
    const patch = d.patchFrom(L.cv, r);
    renderOp(L.ctx, d.bctx, op, d.ws, 0, 0, d.W);
    d.commit(L, op, patch);
    pushRecent(op.c);
    this.endPlacing();
  }
  endPlacing() {
    this.placing = false;
    this.textDraft = this.textDraft ? { sz: this.textDraft.sz } : null;
    document.body.classList.remove('placing');
    if (this.sctx) this.clearStroke();
    this.ui.hideTextbar();
  }
}
