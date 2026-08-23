import type { Estado } from '@/lib/quehaceres';

/** Los colores del semáforo, en un solo lugar para la lista y el plano. */
export const ESTILO: Record<Estado, { punto: string; texto: string; barra: string; borde: string }> = {
  vencido: { punto: 'bg-red-500', texto: 'text-red-600', barra: 'bg-red-500', borde: 'border-red-200' },
  hoy: { punto: 'bg-blue-500', texto: 'text-blue-600', barra: 'bg-blue-500', borde: 'border-blue-200' },
  pronto: { punto: 'bg-amber-500', texto: 'text-amber-600', barra: 'bg-amber-400', borde: 'border-amber-200' },
  ok: { punto: 'bg-gray-300', texto: 'text-gray-500', barra: 'bg-gray-300', borde: 'border-gray-100' },
};

export const EMOJIS = [
  '🧽', '🪴', '🚿', '🖥️', '🔥', '🛏️', '👟', '🧊', '🧹', '🧺', '🗑️', '🪟', '🍽️', '🚽', '🧴',
  '☕', '💻', '🚮', '🫧', '💧', '🪥', '🛌', '💊', '🎧', '🎒', '🧘', '🪞', '🚪', '🐜', '👕',
];
