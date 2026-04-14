export function parseMessage(message: string): { copias: number; tipo: 'color' | 'bn' } {
  const lower = (message || '').toLowerCase();
  const match = lower.match(/(\d+)\s*(copia|copias|impresion|impresiones|unidad|unidades)?/);
  const copias = match ? Math.max(1, parseInt(match[1], 10)) : 1;
  const tipo: 'color' | 'bn' = /\bcolor\b/.test(lower) ? 'color' : 'bn';
  return { copias, tipo };
}
