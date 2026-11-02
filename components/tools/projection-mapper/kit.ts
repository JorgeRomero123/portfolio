// Small canvas helpers shared by the effect files.

export const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function rgba(hex: string, a: number) {
  const n = parseInt((hex || '#ffffff').slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function clear(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.clearRect(0, 0, w, h);
}
