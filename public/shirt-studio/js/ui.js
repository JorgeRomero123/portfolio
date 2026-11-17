import { clamp, prefs, makeCanvas, freeCanvas, canvasToBlob } from './util.js';
import { BRUSHES, widthAt } from './brushes.js';
import { FONTS, fontById, ensureFont } from './render.js';
import { MAX_LAYERS } from './doc.js';
import { Editor } from './editor.js';
import { ColorPicker } from './color.js';
import { SHIRTS, drawMockup } from './mockup.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const icon = (id) => `<svg><use href="#i-${id}"/></svg>`;
const inches = (px) => {
  const v = px / 300;
  return Number.isInteger(v) ? v : v.toFixed(1);
};
export const slug = (s) => (s || 'design').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'design';

// ---------- generic slider (works with Pencil and finger) ----------
export function slider(el, { vertical, get, set, end }) {
  const fill = el.querySelector('.fill'), knob = el.querySelector('.knob');
  const render = () => {
    const v = clamp(get(), 0, 1) * 100;
    if (vertical) {
      fill.style.height = v + '%';
      knob.style.top = `clamp(6px, ${100 - v}%, calc(100% - 6px))`;
    } else {
      fill.style.width = v + '%';
      knob.style.left = `clamp(8px, ${v}%, calc(100% - 8px))`;
    }
  };
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    el.setPointerCapture(e.pointerId);
    el.classList.add('active');
    const r = el.getBoundingClientRect();
    const val = (ev) => clamp(vertical ? 1 - (ev.clientY - r.top) / r.height : (ev.clientX - r.left) / r.width, 0, 1);
    set(val(e));
    render();
    const mv = (ev) => {
      set(val(ev));
      render();
    };
    const up = () => {
      el.classList.remove('active');
      el.removeEventListener('pointermove', mv);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      end && end();
    };
    el.addEventListener('pointermove', mv);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  });
  render();
  return { render };
}

function sliderEl(cls = 'hslider') {
  const d = document.createElement('div');
  d.className = cls;
  d.innerHTML = '<i class="fill"></i><i class="knob"></i>';
  return d;
}

// ---------- modals ----------
export function modal(html, { wide, onBack } = {}) {
  const back = document.createElement('div');
  back.className = 'modal-back';
  back.innerHTML = `<div class="modal${wide ? ' wide' : ''}">${html}</div>`;
  $('#modals').appendChild(back);
  const close = () => back.remove();
  back.addEventListener('pointerdown', (e) => {
    if (e.target === back && onBack !== false) {
      close();
      onBack && onBack();
    }
  });
  return { el: back.firstElementChild, close };
}
export function confirmModal(title, body, ok = 'OK', danger) {
  return new Promise((res) => {
    const m = modal(
      `<h2>${esc(title)}</h2><p>${esc(body)}</p>
       <div class="modal-actions"><button class="btn ghost" data-a="no" type="button">Cancel</button>
       <button class="btn ${danger ? 'danger' : 'primary'}" data-a="yes" type="button">${esc(ok)}</button></div>`,
      { onBack: () => res(false) }
    );
    m.el.querySelector('[data-a=no]').onclick = () => (m.close(), res(false));
    m.el.querySelector('[data-a=yes]').onclick = () => (m.close(), res(true));
  });
}
export function promptModal(title, value, ok = 'Save') {
  return new Promise((res) => {
    const m = modal(
      `<h2>${esc(title)}</h2><input class="field" maxlength="60" value="${esc(value)}">
       <div class="modal-actions"><button class="btn ghost" data-a="no" type="button">Cancel</button>
       <button class="btn primary" data-a="yes" type="button">${esc(ok)}</button></div>`,
      { onBack: () => res(null) }
    );
    const inp = m.el.querySelector('input');
    const done = () => {
      m.close();
      res(inp.value.trim() || null);
    };
    m.el.querySelector('[data-a=no]').onclick = () => (m.close(), res(null));
    m.el.querySelector('[data-a=yes]').onclick = done;
    inp.addEventListener('keydown', (e) => e.key === 'Enter' && done());
    inp.focus();
    inp.select();
  });
}

let toastT;
export function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('show'), 1700);
}

export async function shareOrDownload(blob, name) {
  const file = new File([blob], name, { type: blob.type });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 60000);
}

// ---------- popovers ----------
const pops = {
  kind: null,
  onClose: null,
  open(kind, el, anchor, where) {
    this.close();
    this.kind = kind;
    const host = $('#pops');
    el.classList.add('pop');
    host.appendChild(el);
    $('#catcher').hidden = false;
    this.place(el, anchor, where);
  },
  place(el, anchor, where) {
    const a = anchor.getBoundingClientRect(), p = el.getBoundingClientRect();
    const vw = innerWidth, vh = innerHeight, m = 12;
    let left, top;
    if (where === 'up') {
      left = a.left + a.width / 2 - p.width / 2;
      top = a.top - p.height - 14;
    } else if (where === 'side') {
      const right = document.body.classList.contains('righty');
      left = right ? a.left - p.width - 14 : a.right + 14;
      top = a.top + a.height / 2 - p.height / 2;
    } else {
      left = a.right - p.width;
      top = a.bottom + 10;
    }
    el.style.left = clamp(left, m, vw - p.width - m) + 'px';
    el.style.top = clamp(top, m, vh - p.height - m) + 'px';
  },
  close() {
    $('#pops').innerHTML = '';
    $('#catcher').hidden = true;
    const k = this.kind;
    this.kind = null;
    const cb = this.onClose;
    this.onClose = null;
    cb && cb(k);
  },
};

// =====================================================================
export class EditorUI {
  constructor(app) {
    this.app = app;
    this.ed = new Editor(this);
    this.doc = null;
    this.toast = toast;
    document.body.classList.toggle('righty', prefs.get('righty', false));
    this.bind();
  }

  open(doc) {
    this.doc = doc;
    doc.onChange = (w) => this.onDocChange(w);
    $('#gallery').hidden = true;
    $('#editor').hidden = false;
    this.ed.open(doc);
    this.refreshAll();
  }
  close() {
    pops.close();
    this.ed.close();
    this.doc = null;
    $('#editor').hidden = true;
    $('#mockup').hidden = true;
  }

  onDocChange(w) {
    if (w.layers) this.ed.syncLayers();
    this.refreshUndo();
    this.refreshInks();
    this.refreshLayerBadge();
    if (pops.kind === 'layers') this.renderLayers();
    this.app.scheduleSave();
  }

  refreshAll() {
    this.refreshTitle();
    this.refreshTools();
    this.refreshColor();
    this.refreshUndo();
    this.refreshInks();
    this.refreshLayerBadge();
  }
  refreshTitle() {
    const d = this.doc;
    $('#t-title').innerHTML = `${esc(d.name)}<small>${inches(d.W)} × ${inches(d.H)} in</small>`;
  }
  refreshTools() {
    const ed = this.ed;
    document.querySelectorAll('#dock .tool').forEach((b) => b.classList.toggle('on', b.dataset.tool === ed.tool));
    $('#t-sym').classList.toggle('on', ed.sym);
    this.sizeSlider.render();
    this.opSlider.render();
    this.refreshReadouts();
  }
  refreshReadouts() {
    const b = this.ed.railBrush;
    $('#r-size').textContent = Math.round(this.ed.sizeFor(b));
    $('#r-opacity').textContent = Math.round(this.ed.brush[b].op * 100) + '%';
  }
  refreshColor() {
    $('#t-color i').style.background = this.ed.color;
  }
  refreshUndo() {
    $('#t-undo').disabled = !this.doc.undoStack.length;
    $('#t-redo').disabled = !this.doc.redoStack.length;
  }
  refreshLayerBadge() {
    $('#layer-badge').textContent = this.doc.layers.length;
  }
  refreshInks() {
    const { colors } = this.doc.inks();
    const chip = $('#t-inks');
    if (!colors.length) chip.innerHTML = 'No ink yet';
    else chip.innerHTML = `<span class="dots">${colors.slice(0, 4).map((c) => `<i style="background:${c}"></i>`).join('')}</span>${colors.length} ink${colors.length > 1 ? 's' : ''}`;
  }

  undo() {
    if (this.ed.action) return;
    if (this.doc.undo()) toast('Undo');
  }
  redo() {
    if (this.ed.action) return;
    if (this.doc.redo()) toast('Redo');
  }

  // ---------------- wiring ----------------
  bind() {
    const ed = this.ed;
    $('#catcher').addEventListener('pointerdown', (e) => {
      e.preventDefault();
      pops.close();
    });

    document.querySelectorAll('#dock .tool').forEach((b) =>
      b.addEventListener('click', () => {
        const t = b.dataset.tool;
        if (t === ed.tool && t !== 'text') return this.openToolSettings(b);
        ed.setTool(t);
      })
    );
    $('#t-sym').onclick = () => ed.toggleSym();
    $('#t-layers').onclick = (e) => this.toggle('layers', () => this.openLayers(e.currentTarget));
    $('#t-color').onclick = (e) => this.toggle('color', () => this.openColor(e.currentTarget));
    $('#t-undo').onclick = () => this.undo();
    $('#t-redo').onclick = () => this.redo();
    $('#t-back').onclick = () => this.app.closeEditor();
    $('#t-title').onclick = async () => {
      const n = await promptModal('Rename design', this.doc.name);
      if (n) {
        this.doc.name = n;
        this.doc.touch(null, {});
        this.refreshTitle();
      }
    };
    $('#t-inks').onclick = (e) => this.toggle('inks', () => this.openInks(e.currentTarget));
    $('#t-more').onclick = (e) => this.toggle('menu', () => this.openMenu(e.currentTarget));
    $('#t-export').onclick = (e) => this.toggle('export', () => this.openExport(e.currentTarget));
    $('#t-shirt').onclick = () => this.openMockup();

    // rail
    this.sizeSlider = slider($('#s-size'), {
      vertical: true,
      get: () => ed.brush[ed.railBrush].v,
      set: (v) => {
        ed.brush[ed.railBrush].v = Math.max(0, v);
        this.refreshReadouts();
        this.previewSize();
      },
      end: () => {
        ed.saveBrushes();
        setTimeout(() => ed.hideCursor(), 500);
      },
    });
    this.opSlider = slider($('#s-opacity'), {
      vertical: true,
      get: () => (ed.brush[ed.railBrush].op - 0.05) / 0.95,
      set: (v) => {
        ed.brush[ed.railBrush].op = 0.05 + v * 0.95;
        this.refreshReadouts();
      },
      end: () => ed.saveBrushes(),
    });

    // text bar
    this.txSlider = slider($('#tx-size'), {
      get: () => {
        const t = ed.textDraft;
        if (!t || !this.doc) return 0.3;
        return Math.sqrt(clamp((t.sz / this.doc.W - 0.02) / 0.48, 0, 1));
      },
      set: (v) => ed.setTextSize(this.doc.W * (0.02 + 0.48 * v * v)),
    });
    $('#tx-cancel').onclick = () => ed.endPlacing();
    $('#tx-done').onclick = () => ed.commitText();
    $('#tx-edit').onclick = () => this.openText(ed.textDraft);

    // mockup
    $('#mk-close').onclick = () => this.closeMockup();
    $('#mk-save').onclick = () => this.saveMockup();
    $('#mk-bgsync').onchange = (e) => {
      this.doc.settings.bg = e.target.checked ? 'shirt' : 'checker';
      ed.applyBg();
      this.doc.touch(null, {});
    };

    addEventListener('resize', () => {
      ed.onResize();
      if (!$('#mockup').hidden) this.drawMockup();
      pops.close();
    });
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('dblclick', (e) => e.preventDefault());
    document.addEventListener('keydown', (e) => this.onKey(e));
  }

  toggle(kind, openFn) {
    if (pops.kind === kind) return pops.close();
    openFn();
  }

  previewSize() {
    const ed = this.ed, b = ed.railBrush;
    if (!this.doc) return;
    const size = widthAt(b, ed.sizeFor(b), 1) * this.doc.ws * ed.view.z;
    const c = ed.cursor;
    c.style.display = 'block';
    c.style.width = c.style.height = Math.max(4, size) + 'px';
    c.style.left = innerWidth / 2 + 'px';
    c.style.top = innerHeight / 2 + 'px';
    clearTimeout(ed._ct);
  }

  onKey(e) {
    if (!this.doc || $('#editor').hidden) return;
    if (e.target.closest && e.target.closest('input, textarea')) return;
    const k = e.key.toLowerCase(), mod = e.metaKey || e.ctrlKey, ed = this.ed;
    if (mod && k === 'z') {
      e.preventDefault();
      return e.shiftKey ? this.redo() : this.undo();
    }
    if (mod && k === '0') {
      e.preventDefault();
      return ed.fit(true);
    }
    if (mod || $('#modals').children.length) return;
    const map = { b: ed.lastBrush, e: 'eraser', g: 'fill', i: 'picker' };
    if (map[k]) ed.setTool(map[k]);
    else if (k === 't') this.openText();
    else if (k === 'm') ed.toggleSym();
    else if (k === '[' || k === ']') {
      const bs = ed.brush[ed.railBrush];
      bs.v = clamp(bs.v + (k === ']' ? 0.04 : -0.04), 0, 1);
      ed.saveBrushes();
      this.refreshTools();
    }
  }

  // ---------------- tool settings ----------------
  openToolSettings(anchor) {
    const ed = this.ed, t = ed.tool;
    const el = document.createElement('div');
    el.className = 'set-pop';
    if (t in BRUSHES) {
      el.innerHTML = `<h3>${BRUSHES[t].name}<small>Streamline</small></h3>`;
      const s = sliderEl();
      el.appendChild(s);
      el.insertAdjacentHTML('beforeend', `<p>Smooths shaky lines. Higher values give cleaner curves for line art, with a little lag behind the Pencil.</p>`);
      pops.open('tool', el, anchor, 'up');
      slider(s, { get: () => ed.brush[t].smooth, set: (v) => (ed.brush[t].smooth = v), end: () => ed.saveBrushes() });
    } else if (t === 'fill') {
      el.innerHTML = `<h3>Fill<small>Gap tolerance</small></h3>`;
      const s = sliderEl();
      el.appendChild(s);
      el.insertAdjacentHTML('beforeend', `<p>How different a colour can be and still get filled. Raise it if fills leave a halo next to soft lines.</p>`);
      pops.open('tool', el, anchor, 'up');
      slider(s, {
        get: () => ed.fillTol / 160,
        set: (v) => (ed.fillTol = Math.round(4 + v * 156)),
        end: () => prefs.set('fillTol', ed.fillTol),
      });
    } else if (t === 'picker') {
      el.innerHTML = `<h3>Eyedropper</h3><p>Tap or drag on the canvas to pick a colour. With any tool, you can also press and hold one finger on the canvas.</p>`;
      pops.open('tool', el, anchor, 'up');
    }
  }

  // ---------------- colour ----------------
  openColor(anchor) {
    const el = document.createElement('div');
    el.className = 'color-pop';
    pops.open('color', el, anchor, 'up');
    const cp = new ColorPicker(el, { get: () => this.ed.color, set: (c) => this.ed.setColor(c) });
    cp.open();
    pops.place(el, anchor, 'up');
  }

  // ---------------- inks ----------------
  openInks(anchor) {
    const { colors, soft } = this.doc.inks();
    const el = document.createElement('div');
    el.className = 'inks-pop';
    el.innerHTML = `<h3>Ink colours<small>${colors.length}</small></h3>
      <div class="cp-swatches">${colors.map((c) => `<button class="sw" type="button" style="background:${c}" data-c="${c}" title="${c}"></button>`).join('')}</div>
      <p>${colors.length ? 'Screen printers usually price per colour. Tap one to draw with it again.' : 'Colours you use show up here, so you can keep the count low for screen printing.'}</p>
      ${soft ? '<p>Some marks are semi-transparent (pencil, low opacity or a faded layer). Screen printing turns those into halftone dots; DTG printing reproduces them as-is.</p>' : ''}`;
    el.querySelectorAll('[data-c]').forEach((b) => (b.onclick = () => (this.ed.setColor(b.dataset.c), pops.close())));
    pops.open('inks', el, anchor, 'down');
  }

  // ---------------- layers ----------------
  openLayers(anchor) {
    this.layersAnchor = anchor;
    this.renderLayers(true);
  }
  renderLayers(first) {
    const d = this.doc, ed = this.ed;
    const el = document.createElement('div');
    el.className = 'layers-pop';
    el.innerHTML = `<h3>Layers<small>${d.layers.length} of ${MAX_LAYERS}</small></h3><div class="layer-list scroll"></div>`;
    const list = el.querySelector('.layer-list');
    for (let i = d.layers.length - 1; i >= 0; i--) {
      const L = d.layers[i];
      const row = document.createElement('div');
      row.className = 'layer-row' + (i === d.active ? ' on' : '') + (L.visible ? '' : ' hidden-layer');
      const tw = 92, th = Math.round((92 * d.workH) / d.workW);
      const tc = makeCanvas(tw, th);
      tc.getContext('2d').drawImage(L.cv, 0, 0, tw, th);
      const thumb = document.createElement('div');
      thumb.className = 'layer-thumb';
      thumb.appendChild(tc);
      row.appendChild(thumb);
      row.insertAdjacentHTML(
        'beforeend',
        `<div class="layer-name">${esc(L.name)}<small>${L.visible ? (L.opacity < 1 ? Math.round(L.opacity * 100) + '% opacity' : L.ops.length ? L.ops.length + ' marks' : 'Empty') : 'Hidden'}</small></div>
         <button class="ib" type="button" data-a="eye" aria-label="Show or hide">${icon(L.visible ? 'eye' : 'eyeoff')}</button>`
      );
      row.addEventListener('click', async (e) => {
        if (e.target.closest('[data-a=eye]')) {
          L.visible = !L.visible;
          ed.syncLayers();
          d.touch(null, {});
          return;
        }
        if (i === d.active && e.target.closest('.layer-name')) {
          const n = await promptModal('Rename layer', L.name);
          if (n) {
            L.name = n;
            d.touch(null, {});
          }
          return;
        }
        d.active = i;
        ed.syncLayers();
        this.renderLayers();
      });
      list.appendChild(row);
    }
    const L = d.layer;
    const op = document.createElement('div');
    op.className = 'layer-op';
    op.innerHTML = `<span>Opacity ${Math.round(L.opacity * 100)}%</span>`;
    const s = sliderEl();
    op.appendChild(s);
    el.appendChild(op);
    el.insertAdjacentHTML(
      'beforeend',
      `<div class="layer-tools">
        <button class="ib" type="button" data-a="add" aria-label="New layer" ${d.layers.length >= MAX_LAYERS ? 'disabled' : ''}>${icon('plus')}</button>
        <button class="ib" type="button" data-a="dup" aria-label="Duplicate layer" ${d.layers.length >= MAX_LAYERS ? 'disabled' : ''}>${icon('copy')}</button>
        <span class="grow"></span>
        <button class="ib" type="button" data-a="up" aria-label="Move up" ${d.active >= d.layers.length - 1 ? 'disabled' : ''}>${icon('up')}</button>
        <button class="ib" type="button" data-a="down" aria-label="Move down" ${d.active <= 0 ? 'disabled' : ''}>${icon('down')}</button>
        <button class="ib" type="button" data-a="del" aria-label="Delete layer" ${d.layers.length <= 1 ? 'disabled' : ''}>${icon('trash')}</button>
      </div>`
    );
    const act = (a) => {
      if (a === 'add') d.addLayer();
      else if (a === 'dup') d.addLayer(d.active + 1, d.layer);
      else if (a === 'up') d.moveLayer(d.active, d.active + 1);
      else if (a === 'down') d.moveLayer(d.active, d.active - 1);
      else if (a === 'del') {
        d.deleteLayer();
        toast('Layer deleted — two-finger tap to undo');
      }
    };
    el.querySelectorAll('.layer-tools [data-a]').forEach((b) => (b.onclick = () => act(b.dataset.a)));

    if (first || pops.kind !== 'layers') pops.open('layers', el, this.layersAnchor, 'up');
    else {
      const old = $('#pops .layers-pop');
      el.classList.add('pop');
      el.style.cssText = old.style.cssText;
      el.style.animation = 'none';
      old.replaceWith(el);
      pops.place(el, this.layersAnchor, 'up');
    }
    slider(s, {
      get: () => L.opacity,
      set: (v) => {
        L.opacity = Math.max(0.02, v);
        L.cv.style.opacity = L.opacity;
        op.querySelector('span').textContent = `Opacity ${Math.round(L.opacity * 100)}%`;
      },
      end: () => {
        d.touch(null, {});
      },
    });
  }

  // ---------------- menu ----------------
  openMenu(anchor) {
    const d = this.doc, ed = this.ed;
    const el = document.createElement('div');
    el.className = 'menu';
    const sw = (on) => `<span class="switch${on ? ' on' : ''}"></span>`;
    const seg = (name, opts, cur) =>
      `<span class="seg" data-seg="${name}">${opts.map(([v, l]) => `<button type="button" data-v="${v}" class="${v === cur ? 'on' : ''}">${l}</button>`).join('')}</span>`;
    el.innerHTML = `
      <button class="menu-item" data-a="fit" type="button">Fit to screen <span class="hint">pinch in fast</span></button>
      <button class="menu-item" data-a="flip" type="button">Flip canvas ${sw(ed.view.flip)}</button>
      <button class="menu-item" data-a="guides" type="button">Centre guides ${sw(d.settings.guides)}</button>
      <button class="menu-item" data-a="bg" type="button">Shirt colour behind canvas ${sw(d.settings.bg === 'shirt')}</button>
      <div class="menu-sep"></div>
      <div class="menu-item">One finger ${seg('finger', [['auto', 'Auto'], ['draw', 'Draws'], ['off', 'Pans']], ed.finger)}</div>
      <div class="menu-item">Sliders ${seg('side', [['left', 'Left'], ['right', 'Right']], document.body.classList.contains('righty') ? 'right' : 'left')}</div>
      <div class="menu-sep"></div>
      <button class="menu-item" data-a="help" type="button">Gestures and tips</button>
      <button class="menu-item danger" data-a="clear" type="button">Clear layer</button>`;
    el.querySelectorAll('[data-a]').forEach(
      (b) =>
        (b.onclick = async () => {
          const a = b.dataset.a;
          if (a === 'fit') {
            pops.close();
            ed.fit(true);
          } else if (a === 'flip') {
            ed.toggleFlip();
            b.querySelector('.switch').classList.toggle('on', ed.view.flip);
          } else if (a === 'guides') {
            d.settings.guides = !d.settings.guides;
            ed.drawGuides();
            d.touch(null, {});
            b.querySelector('.switch').classList.toggle('on', d.settings.guides);
          } else if (a === 'bg') {
            d.settings.bg = d.settings.bg === 'shirt' ? 'checker' : 'shirt';
            ed.applyBg();
            d.touch(null, {});
            b.querySelector('.switch').classList.toggle('on', d.settings.bg === 'shirt');
          } else if (a === 'help') {
            pops.close();
            this.openHelp();
          } else if (a === 'clear') {
            pops.close();
            if (!d.layer.ops.length) return toast('This layer is already empty');
            d.clearLayer();
            toast('Layer cleared — two-finger tap to undo');
          }
        })
    );
    el.querySelectorAll('[data-seg]').forEach((g) =>
      g.querySelectorAll('button').forEach(
        (b) =>
          (b.onclick = () => {
            g.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
            if (g.dataset.seg === 'finger') {
              ed.finger = b.dataset.v;
              prefs.set('finger', ed.finger);
            } else {
              const right = b.dataset.v === 'right';
              document.body.classList.toggle('righty', right);
              prefs.set('righty', right);
            }
          })
      )
    );
    pops.open('menu', el, anchor, 'down');
  }

  openHelp() {
    const m = modal(
      `<h2>Gestures and tips</h2>
      <dl class="gestures">
        <dt>Pencil</dt><dd>Draws. Press harder for thicker Ink and darker Pencil.</dd>
        <dt>Two-finger tap</dt><dd>Undo</dd>
        <dt>Three-finger tap</dt><dd>Redo</dd>
        <dt>Two fingers</dt><dd>Move, zoom and rotate the canvas. Rotation snaps straight.</dd>
        <dt>Quick pinch in</dt><dd>Fit the canvas to the screen</dd>
        <dt>One finger</dt><dd>Pans the canvas once a Pencil has been used. Hold still to pick a colour.</dd>
        <dt>Tap active tool</dt><dd>Opens its settings, like Streamline for smoother lines</dd>
        <dt>Mirror</dt><dd>Strokes repeat across the centre line, for badges and emblems</dd>
        <dt>Inks</dt><dd>Counts the colours in your design, which is what screen printers charge for</dd>
      </dl>
      <p style="margin-top:18px">Your palm can rest on the screen while the Pencil is down. The print file is rebuilt from your strokes at full 300 dpi, so it stays sharp even though you draw on a lighter canvas.</p>
      <div class="modal-actions"><button class="btn primary" type="button">Got it</button></div>`,
      { wide: true }
    );
    m.el.querySelector('.btn').onclick = m.close;
  }

  // ---------------- text ----------------
  openText(existing) {
    if (!this.doc) return;
    pops.close();
    const cur = existing?.str ? existing : null;
    let font = cur?.font || prefs.get('font', 'anton');
    const m = modal(
      `<h2>${cur ? 'Edit text' : 'Add text'}</h2>
       <textarea class="field" placeholder="Type your text" maxlength="200">${esc(cur?.str || '')}</textarea>
       <div class="fonts">${FONTS.map((f) => `<button type="button" class="font-opt${f.id === font ? ' on' : ''}" data-f="${f.id}" style="font-family:'${f.family}'">${esc(f.label)}</button>`).join('')}</div>
       <div class="modal-actions"><button class="btn ghost" data-a="no" type="button">Cancel</button>
       <button class="btn primary" data-a="yes" type="button">${cur ? 'Update' : 'Place on canvas'}</button></div>`,
      { wide: true }
    );
    const ta = m.el.querySelector('textarea');
    const fontBtns = m.el.querySelectorAll('[data-f]');
    const preview = () => {
      const s = ta.value.split('\n')[0].slice(0, 14);
      fontBtns.forEach((b) => (b.textContent = s || fontById(b.dataset.f).label));
    };
    fontBtns.forEach(
      (b) =>
        (b.onclick = () => {
          font = b.dataset.f;
          fontBtns.forEach((x) => x.classList.toggle('on', x === b));
        })
    );
    ta.addEventListener('input', preview);
    preview();
    FONTS.forEach((f) => ensureFont(f.id));
    m.el.querySelector('[data-a=no]').onclick = m.close;
    m.el.querySelector('[data-a=yes]').onclick = async () => {
      const str = ta.value.replace(/\s+$/, '');
      if (!str.trim()) return ta.focus();
      prefs.set('font', font);
      m.close();
      if (cur && this.ed.placing) {
        await ensureFont(font);
        Object.assign(this.ed.textDraft, { str, font });
        this.ed.renderDraft();
      } else {
        await this.ed.beginPlacing(str, font);
        $('#textbar').hidden = false;
        this.txSlider.render();
      }
    };
    ta.focus();
  }
  hideTextbar() {
    $('#textbar').hidden = true;
  }

  // ---------------- export ----------------
  openExport(anchor) {
    const d = this.doc;
    const el = document.createElement('div');
    el.className = 'menu';
    el.innerHTML = `
      <button class="menu-item" data-a="print" type="button"><span>Print file<br><span class="hint">PNG · ${d.W} × ${d.H} · 300 dpi · transparent</span></span></button>
      <button class="menu-item" data-a="mock" type="button"><span>Shirt mockup<br><span class="hint">PNG image for sharing</span></span></button>`;
    el.querySelector('[data-a=print]').onclick = () => (pops.close(), this.exportPrint());
    el.querySelector('[data-a=mock]').onclick = () => (pops.close(), this.openMockup());
    pops.open('export', el, anchor, 'down');
  }

  async exportPrint() {
    const d = this.doc;
    if (!d.layers.some((L) => L.visible && L.ops.length)) return toast('Nothing to export yet');
    const m = modal(`<h2>Building print file</h2><p>Rendering every stroke at ${d.W} × ${d.H} px.</p><div class="progress"><i></i></div>`, { onBack: false });
    const bar = m.el.querySelector('.progress i');
    let res;
    try {
      res = await d.exportPrint((p) => (bar.style.width = Math.round(p * 100) + '%'));
    } catch (err) {
      m.close();
      console.error(err);
      return toast('Export failed: ' + (err.message || err));
    }
    m.close();
    const mb = (res.blob.size / 1048576).toFixed(1);
    const name = `${slug(d.name)}-print.png`;
    const r = modal(
      `<h2>Print file ready</h2>
       <p>${res.w} × ${res.h} px · ${mb} MB · transparent background${res.reduced ? '<br>This browser could not build the full-size file, so it is at screen resolution.' : ''}</p>
       <div class="modal-actions"><button class="btn ghost" data-a="no" type="button">Done</button>
       <button class="btn primary" data-a="yes" type="button">${icon('share')}Save or share</button></div>`
    );
    r.el.querySelector('[data-a=no]').onclick = r.close;
    r.el.querySelector('[data-a=yes]').onclick = () => shareOrDownload(res.blob, name);
  }

  // ---------------- mockup ----------------
  openMockup() {
    pops.close();
    const d = this.doc;
    this.mkDesign = d.composite(1500);
    $('#mockup').hidden = false;
    $('#mk-size').textContent = `${inches(d.W)} × ${inches(d.H)} in print`;
    $('#mk-bgsync').checked = d.settings.bg === 'shirt';
    const chips = $('#mk-chips');
    chips.innerHTML = SHIRTS.map((s) => `<button class="mk-chip${s.c === d.settings.shirt ? ' on' : ''}" type="button" data-c="${s.c}"><i style="background:${s.c}"></i>${s.label}</button>`).join('');
    chips.querySelectorAll('[data-c]').forEach(
      (b) =>
        (b.onclick = () => {
          d.settings.shirt = b.dataset.c;
          chips.querySelectorAll('.mk-chip').forEach((x) => x.classList.toggle('on', x === b));
          this.ed.applyBg();
          d.touch(null, {});
          this.drawMockup();
        })
    );
    requestAnimationFrame(() => this.drawMockup());
  }
  drawMockup() {
    const cv = $('#mk-canvas'), host = cv.parentElement.getBoundingClientRect();
    const ar = 1000 / 1080;
    let w = host.width - 40, h = host.height - 16;
    if (w / h > ar) w = h * ar;
    else h = w / ar;
    const dpr = Math.min(2, devicePixelRatio || 1);
    cv.style.width = w + 'px';
    cv.style.height = h + 'px';
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    drawMockup(cv.getContext('2d'), { w: cv.width, h: cv.height }, this.mkDesign, this.doc, this.doc.settings.shirt);
    this.buildMockupBlob();
  }
  // Safari only opens the Share sheet straight from a tap, so the image is
  // rendered ahead of time and "Save image" can share it instantly.
  buildMockupBlob() {
    clearTimeout(this.mkT);
    this.mkBlob = null;
    const key = (this.mkKey = {});
    this.mkT = setTimeout(async () => {
      const d = this.doc;
      if (!d || $('#mockup').hidden) return;
      const hi = d.composite(2400);
      const c = makeCanvas(2000, 2160);
      drawMockup(c.getContext('2d'), { w: 2000, h: 2160 }, hi, d, d.settings.shirt);
      freeCanvas(hi);
      const blob = await canvasToBlob(c);
      freeCanvas(c);
      if (this.mkKey === key) this.mkBlob = blob;
    }, 250);
  }
  async saveMockup() {
    const name = `${slug(this.doc.name)}-mockup.png`;
    if (this.mkBlob) return shareOrDownload(this.mkBlob, name);
    toast('Preparing image…');
    for (let i = 0; i < 40 && !this.mkBlob; i++) await new Promise((r) => setTimeout(r, 100));
    if (this.mkBlob) shareOrDownload(this.mkBlob, name);
  }
  closeMockup() {
    $('#mockup').hidden = true;
    freeCanvas(this.mkDesign);
    this.mkDesign = null;
  }
}
