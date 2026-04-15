import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';

// US Letter en puntos (1 pt = 1/72 inch)
const LETTER_WIDTH = 612;
const LETTER_HEIGHT = 792;
const MM_TO_PT = 72 / 25.4;
const MARGIN_PT = 5 * MM_TO_PT;
const GAP_PT = 3 * MM_TO_PT;

// DPI de impresión para el resize de las imágenes
const PRINT_DPI = 300;
const PT_TO_PX_300 = PRINT_DPI / 72;

// Grillas por cantidad de imágenes.
// Elegidas para maximizar el área útil en tamaño carta y mantener proporción razonable.
function gridFor(count: number): { cols: number; rows: number } {
  if (count <= 1) return { cols: 1, rows: 1 };
  if (count === 2) return { cols: 1, rows: 2 };
  if (count === 3) return { cols: 1, rows: 3 };
  if (count === 4) return { cols: 2, rows: 2 };
  if (count <= 6) return { cols: 2, rows: 3 };
  if (count <= 9) return { cols: 3, rows: 3 };
  if (count <= 12) return { cols: 3, rows: 4 };
  if (count <= 16) return { cols: 4, rows: 4 };
  return { cols: 4, rows: 5 }; // hasta 20 por página
}

type Buf = Buffer | Uint8Array;

async function toCoverJpeg(buf: Buf, widthPt: number, heightPt: number): Promise<Buffer> {
  // Tamaño en píxeles a 300 DPI para impresión limpia
  const widthPx = Math.round(widthPt * PT_TO_PX_300);
  const heightPx = Math.round(heightPt * PT_TO_PX_300);

  return await sharp(buf)
    .rotate() // respeta EXIF orientation
    .resize(widthPx, heightPx, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
}

/**
 * Compone múltiples imágenes en un PDF tamaño carta.
 * Grid equitativo automático según count, orientación vertical, object-fit cover.
 * Si hay más imágenes que entradas en un grid, usa múltiples páginas.
 */
export async function composeImagesToPdf(images: Buf[]): Promise<Uint8Array> {
  if (images.length === 0) throw new Error('No hay imágenes para componer');

  const pdf = await PDFDocument.create();

  const { cols, rows } = gridFor(images.length);
  const perPage = cols * rows;
  const totalPages = Math.ceil(images.length / perPage);

  const usableW = LETTER_WIDTH - MARGIN_PT * 2;
  const usableH = LETTER_HEIGHT - MARGIN_PT * 2;
  const cellW = (usableW - GAP_PT * (cols - 1)) / cols;
  const cellH = (usableH - GAP_PT * (rows - 1)) / rows;

  for (let page = 0; page < totalPages; page++) {
    const pageDoc = pdf.addPage([LETTER_WIDTH, LETTER_HEIGHT]);
    const start = page * perPage;
    const end = Math.min(start + perPage, images.length);

    for (let i = start; i < end; i++) {
      const idx = i - start;
      const col = idx % cols;
      const row = Math.floor(idx / cols);

      // Origen de PDF es bottom-left. Convertimos al sistema top-left para que row=0 sea arriba.
      const x = MARGIN_PT + col * (cellW + GAP_PT);
      const y = LETTER_HEIGHT - MARGIN_PT - (row + 1) * cellH - row * GAP_PT;

      const jpegBytes = await toCoverJpeg(images[i], cellW, cellH);
      const embedded = await pdf.embedJpg(jpegBytes);
      pageDoc.drawImage(embedded, { x, y, width: cellW, height: cellH });
    }
  }

  return await pdf.save();
}

export function describeLayout(count: number): string {
  const { cols, rows } = gridFor(count);
  const perPage = cols * rows;
  const pages = Math.ceil(count / perPage);
  const grid = `${cols}×${rows}`;
  if (pages === 1) return `${count} foto(s) en 1 hoja Carta (${grid})`;
  return `${count} fotos en ${pages} hojas Carta (${grid} por hoja)`;
}
