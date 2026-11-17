import { clamp, hsvToRgb, rgbToHsv, rgbToHex, hexToRgb, isHex, normHex, prefs } from './util.js';

// Ink-friendly defaults: strong, flat colours that read on fabric.
const DEFAULT_SWATCHES = [
  '#141414', '#ffffff', '#c9c9c4', '#6b6b6b', '#d7263d', '#f46036', '#f5b700', '#a4c639',
  '#2e8b57', '#1b998b', '#2e5eaa', '#0b3c5d', '#5f4bb6', '#e6a9c1', '#8c5a3c', '#f1e6d0',
];

function dragOn(el, fn) {
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    el.setPointerCapture(e.pointerId);
    const r = el.getBoundingClientRect();
    const go = (ev) => fn(clamp((ev.clientX - r.left) / r.width, 0, 1), clamp((ev.clientY - r.top) / r.height, 0, 1), ev.type === 'pointerup');
    go(e);
    const mv = (ev) => go(ev);
    const up = (ev) => {
      go(ev);
      el.removeEventListener('pointermove', mv);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
    el.addEventListener('pointermove', mv);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  });
}

export class ColorPicker {
  constructor(root, { get, set }) {
    this.root = root;
    this.get = get;
    this.set = set;
    this.custom = prefs.get('swatches', []);
    root.innerHTML = `
      <div class="cp-sv"><canvas></canvas><i class="cp-knob"></i></div>
      <div class="cp-hue"><i class="cp-knob"></i></div>
      <div class="cp-row">
        <span class="cp-old"></span><span class="cp-new"></span>
        <input class="cp-hex" maxlength="7" spellcheck="false" autocomplete="off" autocapitalize="off">
      </div>
      <div class="cp-label">Recent</div>
      <div class="cp-swatches cp-recent"></div>
      <div class="cp-label">Palette <button class="cp-add" type="button">Add current</button></div>
      <div class="cp-swatches cp-palette"></div>`;
    this.sv = root.querySelector('.cp-sv');
    this.svCv = this.sv.querySelector('canvas');
    this.svKnob = this.sv.querySelector('.cp-knob');
    this.hue = root.querySelector('.cp-hue');
    this.hueKnob = this.hue.querySelector('.cp-knob');
    this.hex = root.querySelector('.cp-hex');
    this.hsv = [0, 0, 0];

    dragOn(this.sv, (x, y, end) => {
      this.hsv[1] = x;
      this.hsv[2] = 1 - y;
      this.emit(end);
    });
    dragOn(this.hue, (x, _y, end) => {
      this.hsv[0] = x * 359.9;
      this.drawSV();
      this.emit(end);
    });
    this.hex.addEventListener('input', () => {
      if (isHex(this.hex.value) && this.hex.value.replace('#', '').length === 6) {
        this.setHex(normHex(this.hex.value), true);
        this.set(normHex(this.hex.value), true);
      }
    });
    this.hex.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.hex.blur();
    });
    root.querySelector('.cp-add').addEventListener('click', () => {
      const c = this.get();
      if (!this.custom.includes(c) && !DEFAULT_SWATCHES.includes(c)) {
        this.custom.unshift(c);
        this.custom = this.custom.slice(0, 16);
        prefs.set('swatches', this.custom);
        this.renderSwatches();
      }
    });
  }

  open() {
    this.start = this.get();
    this.root.querySelector('.cp-old').style.background = this.start;
    this.setHex(this.start);
    this.renderSwatches();
  }

  setHex(hex, fromInput) {
    const [r, g, b] = hexToRgb(hex);
    const [h, s, v] = rgbToHsv(r, g, b);
    if (s > 0.001 && v > 0.001) this.hsv[0] = h;
    this.hsv[1] = s;
    this.hsv[2] = v;
    this.drawSV();
    this.paint(hex, fromInput);
  }

  drawSV() {
    const cv = this.svCv;
    const r = this.sv.getBoundingClientRect();
    const dpr = Math.min(2, devicePixelRatio || 1);
    const w = Math.max(1, Math.round((r.width || 280) * dpr)), h = Math.max(1, Math.round((r.height || 200) * dpr));
    if (cv.width !== w || cv.height !== h) {
      cv.width = w;
      cv.height = h;
    }
    const x = cv.getContext('2d');
    const [hr, hg, hb] = hsvToRgb(this.hsv[0], 1, 1);
    x.fillStyle = `rgb(${hr},${hg},${hb})`;
    x.fillRect(0, 0, w, h);
    const g1 = x.createLinearGradient(0, 0, w, 0);
    g1.addColorStop(0, '#fff');
    g1.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g1;
    x.fillRect(0, 0, w, h);
    const g2 = x.createLinearGradient(0, 0, 0, h);
    g2.addColorStop(0, 'rgba(0,0,0,0)');
    g2.addColorStop(1, '#000');
    x.fillStyle = g2;
    x.fillRect(0, 0, w, h);
  }

  paint(hex, fromInput) {
    this.svKnob.style.left = this.hsv[1] * 100 + '%';
    this.svKnob.style.top = (1 - this.hsv[2]) * 100 + '%';
    this.svKnob.style.background = hex;
    this.hueKnob.style.left = (this.hsv[0] / 360) * 100 + '%';
    this.root.querySelector('.cp-new').style.background = hex;
    if (!fromInput) this.hex.value = hex.toUpperCase();
  }

  emit(final) {
    const hex = rgbToHex(...hsvToRgb(...this.hsv));
    this.paint(hex);
    this.set(hex, final);
  }

  renderSwatches() {
    const mk = (list, el) => {
      el.innerHTML = '';
      for (const c of list) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'sw' + (c === this.get() ? ' on' : '');
        b.style.background = c;
        b.title = c;
        b.addEventListener('click', () => {
          this.setHex(c);
          this.set(c, true);
          this.renderSwatches();
        });
        el.appendChild(b);
      }
    };
    const recent = prefs.get('recent', []);
    mk(recent.length ? recent : ['#141414'], this.root.querySelector('.cp-recent'));
    const pal = this.root.querySelector('.cp-palette');
    mk([...this.custom, ...DEFAULT_SWATCHES], pal);
    // only custom ones are removable (long press)
    [...pal.children].slice(0, this.custom.length).forEach((b) => b.classList.add('custom'));
    pal.querySelectorAll('.custom').forEach((b) => {
      let t;
      b.addEventListener('pointerdown', () => {
        t = setTimeout(() => {
          this.custom = this.custom.filter((x) => x !== b.title);
          prefs.set('swatches', this.custom);
          this.renderSwatches();
        }, 650);
      });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => b.addEventListener(ev, () => clearTimeout(t)));
    });
  }
}

export function pushRecent(c) {
  let r = prefs.get('recent', []);
  r = [c, ...r.filter((x) => x !== c)].slice(0, 10);
  prefs.set('recent', r);
}
