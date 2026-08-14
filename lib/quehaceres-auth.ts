/**
 * Candado por PIN para /tools/quehaceres.
 *
 * La verificación es del lado del servidor: el PIN nunca se manda al navegador.
 * Al acertar se emite una cookie httpOnly con un HMAC del PIN, que las rutas de
 * API revisan en cada llamada.
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

export const COOKIE_QUEHACERES = 'quehaceres_sesion';
const DIAS_SESION = 90;

function secreto(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error('AUTH_SECRET no está configurado');
  return s;
}

/** PIN esperado, o null si no se ha configurado el tool. */
export function pinConfigurado(): string | null {
  const pin = process.env.QUEHACERES_PIN?.trim();
  return pin ? pin : null;
}

function token(pin: string): string {
  return createHmac('sha256', secreto()).update(`quehaceres:${pin}`).digest('hex');
}

function igualSeguro(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function pinCorrecto(intento: string): boolean {
  const esperado = pinConfigurado();
  return esperado !== null && igualSeguro(intento, esperado);
}

export async function abrirSesion(pin: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_QUEHACERES, token(pin), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: DIAS_SESION * 24 * 60 * 60,
  });
}

export async function cerrarSesion(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_QUEHACERES);
}

/** true si la petición trae una cookie de sesión válida. */
export async function sesionValida(): Promise<boolean> {
  const pin = pinConfigurado();
  if (!pin) return false;

  const cookie = (await cookies()).get(COOKIE_QUEHACERES)?.value;
  return !!cookie && igualSeguro(cookie, token(pin));
}
