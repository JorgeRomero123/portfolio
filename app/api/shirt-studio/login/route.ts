import { NextResponse } from 'next/server';
import {
  SHIRT_STUDIO_COOKIE,
  SHIRT_STUDIO_HOME,
  SHIRT_STUDIO_PASSWORD,
  shirtStudioToken,
} from '@/lib/shirt-studio-auth';

export async function POST(req: Request) {
  const form = await req.formData();
  const ok = String(form.get('password') ?? '').trim() === SHIRT_STUDIO_PASSWORD;
  if (!ok) return NextResponse.redirect(new URL('/shirt-studio?e=1', req.url), 303);

  const res = NextResponse.redirect(new URL(SHIRT_STUDIO_HOME, req.url), 303);
  res.cookies.set(SHIRT_STUDIO_COOKIE, await shirtStudioToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/shirt-studio',
    maxAge: 60 * 60 * 24 * 365, // a year, so the Home Screen app doesn't keep asking
  });
  return res;
}
