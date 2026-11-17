import { db } from './db.js';
import { Doc, PRESETS } from './doc.js';
import { EditorUI, modal, confirmModal, promptModal, toast } from './ui.js';
import { timeAgo, uid } from './util.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

class App {
  constructor() {
    this.ui = new EditorUI(this);
    this.doc = null;
    this.urls = [];
    this.saveT = 0;
    this.saving = null;
    $('#g-new').onclick = () => this.newDesign();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.saveNow();
    });
    addEventListener('pagehide', () => this.saveNow());
    const standalone = navigator.standalone || matchMedia('(display-mode: standalone)').matches;
    if (!standalone)
      $('#g-tip').textContent =
        'Tip: in Safari, tap Share then Add to Home Screen. Shirt Studio then opens full screen, works offline, and your designs are protected from Safari clearing website data.';
    navigator.storage?.persist?.().catch(() => {});
    this.renderGallery();
  }

  async renderGallery() {
    const list = (await db.list()).sort((a, b) => b.updated - a.updated);
    this.urls.forEach((u) => URL.revokeObjectURL(u));
    this.urls = [];
    $('#g-count').textContent = list.length ? `${list.length} design${list.length > 1 ? 's' : ''}` : '';
    $('#g-empty').hidden = !!list.length;
    const grid = $('#g-grid');
    grid.innerHTML = '';
    for (const m of list) {
      const url = m.thumb ? URL.createObjectURL(m.thumb) : '';
      if (url) this.urls.push(url);
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <button class="card-thumb" type="button" aria-label="Open ${esc(m.name)}">${url ? `<img src="${url}" alt="" style="aspect-ratio:${m.W}/${m.H}">` : ''}</button>
        <div class="card-row">
          <div style="min-width:0"><div class="card-name">${esc(m.name)}</div>
          <div class="card-meta">${m.W / 300} × ${m.H / 300} in · ${timeAgo(m.updated)}</div></div>
          <button class="card-more" type="button" aria-label="More"><svg><use href="#i-more"/></svg></button>
        </div>`;
      card.querySelector('.card-thumb').onclick = () => this.openDesign(m.id);
      card.querySelector('.card-more').onclick = (e) => this.cardMenu(m, e.currentTarget);
      grid.appendChild(card);
    }
  }

  cardMenu(m, anchor) {
    const r = anchor.getBoundingClientRect();
    const back = document.createElement('div');
    back.className = 'modal-back';
    back.style.background = 'transparent';
    back.innerHTML = `<div class="pop menu" style="position:fixed">
      <button class="menu-item" data-a="rename" type="button">Rename</button>
      <button class="menu-item" data-a="dup" type="button">Duplicate</button>
      <div class="menu-sep"></div>
      <button class="menu-item danger" data-a="del" type="button">Delete</button></div>`;
    $('#modals').appendChild(back);
    const pop = back.firstElementChild;
    const pr = pop.getBoundingClientRect();
    pop.style.left = Math.max(12, Math.min(r.right - pr.width, innerWidth - pr.width - 12)) + 'px';
    pop.style.top = Math.min(r.bottom + 6, innerHeight - pr.height - 12) + 'px';
    back.addEventListener('pointerdown', (e) => e.target === back && back.remove());
    pop.querySelectorAll('[data-a]').forEach(
      (b) =>
        (b.onclick = async () => {
          back.remove();
          const a = b.dataset.a;
          if (a === 'rename') {
            const n = await promptModal('Rename design', m.name);
            if (n) {
              m.name = n;
              await db.putMeta(m);
              this.renderGallery();
            }
          } else if (a === 'dup') {
            const data = await db.getData(m.id);
            const id = uid();
            await db.put({ ...m, id, name: m.name + ' copy', created: Date.now(), updated: Date.now() }, { ...data, id });
            this.renderGallery();
          } else if (a === 'del') {
            if (await confirmModal(`Delete “${m.name}”?`, 'This removes the design from this iPad. It can’t be undone.', 'Delete', true)) {
              await db.del(m.id);
              this.renderGallery();
            }
          }
        })
    );
  }

  newDesign() {
    const shape = (p) => {
      const s = 46 / Math.max(p.W, p.H);
      return `<i style="width:${p.W * s}px;height:${p.H * s}px"></i>`;
    };
    const m = modal(
      `<h2>New design</h2><p>Pick the print area. You can draw anywhere inside it; the file comes out at 300 dpi.</p>
       <div class="presets">${PRESETS.map(
         (p) => `<button class="preset" type="button" data-p="${p.id}"><span class="preset-shape">${shape(p)}</span><span><b>${p.label}</b><span>${p.sub} · ${p.W} × ${p.H} px</span></span></button>`
       ).join('')}</div>
       <div class="modal-actions"><button class="btn ghost" type="button" data-a="no">Cancel</button></div>`,
      { wide: true }
    );
    m.el.querySelector('[data-a=no]').onclick = m.close;
    m.el.querySelectorAll('[data-p]').forEach(
      (b) =>
        (b.onclick = async () => {
          m.close();
          const preset = PRESETS.find((p) => p.id === b.dataset.p);
          const n = (await db.list()).length + 1;
          const doc = Doc.blank(preset, `Design ${n}`);
          this.doc = doc;
          this.ui.open(doc);
          this.saveNow();
        })
    );
  }

  async openDesign(id) {
    const [meta, data] = await Promise.all([db.getMeta(id), db.getData(id)]);
    if (!meta || !data) return toast('Could not open this design');
    const doc = await Doc.fromRecord(meta, data);
    this.doc = doc;
    this.ui.open(doc);
  }

  async closeEditor() {
    const doc = this.doc;
    if (!doc) return;
    if (this.ui.ed.placing) this.ui.ed.commitText();
    await this.saveNow();
    this.ui.close();
    this.doc = null;
    doc.dispose();
    $('#gallery').hidden = false;
    this.renderGallery();
  }

  scheduleSave() {
    clearTimeout(this.saveT);
    this.saveT = setTimeout(() => this.saveNow(), 1200);
  }

  async saveNow() {
    clearTimeout(this.saveT);
    if (this.saving) await this.saving;
    const doc = this.doc;
    if (!doc || !doc.metaDirty) return;
    doc.metaDirty = false;
    this.saving = (async () => {
      try {
        const { meta, data } = await doc.toRecord();
        await db.put(meta, data);
      } catch (e) {
        console.error('save failed', e);
        doc.metaDirty = true;
        toast('Could not save — storage may be full');
      }
    })();
    await this.saving;
    this.saving = null;
  }
}

window.app = new App();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
