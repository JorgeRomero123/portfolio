// Streaming PNG encoder. iPad Safari can't hold a 4500 x 5400 canvas, so the print
// file is rendered in horizontal bands and each band's rows are fed in here.
// Uses the browser's native zlib (CompressionStream 'deflate'), so no libraries.

const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

export const canStreamPNG = () => typeof CompressionStream !== 'undefined';

export class PNGWriter {
  constructor(w, h, dpi = 300) {
    this.w = w;
    this.h = h;
    const ihdr = new Uint8Array(13);
    const dv = new DataView(ihdr.buffer);
    dv.setUint32(0, w);
    dv.setUint32(4, h);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 6; // RGBA
    const phys = new Uint8Array(9);
    const ppm = Math.round(dpi / 0.0254);
    const pv = new DataView(phys.buffer);
    pv.setUint32(0, ppm);
    pv.setUint32(4, ppm);
    phys[8] = 1;
    this.parts = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('pHYs', phys)];
    this.cs = new CompressionStream('deflate');
    this.writer = this.cs.writable.getWriter();
    this.reading = (async () => {
      const reader = this.cs.readable.getReader();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        this.parts.push(chunk('IDAT', value));
      }
    })();
  }
  // rgba: Uint8ClampedArray of rows * w * 4 (unpremultiplied, from getImageData)
  async addRows(rgba, rows) {
    const stride = this.w * 4;
    const per = Math.max(1, Math.floor((1 << 20) / stride)); // ~1 MB slices
    for (let r0 = 0; r0 < rows; r0 += per) {
      const n = Math.min(per, rows - r0);
      const out = new Uint8Array((stride + 1) * n);
      for (let r = 0; r < n; r++) {
        const src = (r0 + r) * stride;
        const o = r * (stride + 1);
        out[o] = 1; // Sub filter: compresses flat artwork well
        for (let i = 0; i < 4; i++) out[o + 1 + i] = rgba[src + i];
        for (let i = 4; i < stride; i++) out[o + 1 + i] = (rgba[src + i] - rgba[src + i - 4]) & 255;
      }
      await this.writer.write(out);
    }
  }
  async finish() {
    await this.writer.close();
    await this.reading;
    this.parts.push(chunk('IEND', new Uint8Array(0)));
    return new Blob(this.parts, { type: 'image/png' });
  }
}
