// Zero framework imports — extractable to standalone package

import type { Currency } from './types';

export function formatPrice(price: number, currency: Currency): string {
  if (!price) return '';
  const formatted = new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
  return `$${formatted} ${currency}`;
}

export function formatArea(area: number): string {
  if (!area) return '';
  return `${new Intl.NumberFormat('es-MX').format(area)} m²`;
}

export function processImageFile(file: File, maxWidth = 1200): Promise<{
  dataUrl: string;
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;

        if (w > maxWidth) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not create canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve({ dataUrl, width: w, height: h });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}
