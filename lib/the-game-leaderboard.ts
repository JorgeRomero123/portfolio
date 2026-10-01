// Server-only helpers for /api/the-game/*: database access that degrades when Supabase isn't
// configured, token hashing and a best-effort rate limiter.
import { createHash, randomBytes } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * The shared Supabase client, or null when SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are missing.
 * lib/supabase.ts throws at import time without them, so it is imported lazily, after the check.
 */
export async function getDb(): Promise<SupabaseClient | null> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    return (await import('@/lib/supabase')).supabase;
  } catch {
    return null;
  }
}

export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
export const newToken = () => randomBytes(24).toString('base64url');

export const json = (body: unknown, status = 200, headers?: Record<string, string>) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
export const fail = (error: string, status: number) => json({ error }, status);
export const unavailable = () => fail('unavailable', 503);

/** Random-looking strings the browser sends (nonce, token): url-safe, bounded length. */
export const isKey = (v: unknown, min = 16, max = 128): v is string =>
  typeof v === 'string' && v.length >= min && v.length <= max && /^[A-Za-z0-9_-]+$/.test(v);

export const isUuid = (v: unknown): v is string =>
  typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

// ── Rate limiting ───────────────────────────────────────────────────────────────────────────
// Per IP, in this server instance's memory: nothing is stored, and a cold start or another
// instance starts from zero, so it only blunts bursts. The database adds a global cap on new runs
// per minute (the_game_record_run) that holds across instances.
const hits = new Map<string, number[]>();

function clientIp(req: NextRequest): string {
  return req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}

/** True when this request is within `limit` per `windowMs` for its IP and bucket. */
export function allow(req: NextRequest, bucket: string, limit: number, windowMs: number): boolean {
  const key = `${bucket}:${clientIp(req)}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  }
  return true;
}

/** Writes per IP: runs and nickname changes, each. */
export const WRITE_LIMIT = { limit: 10, windowMs: 10 * 60_000 };
/** New runs per minute across everyone (enforced in the database). */
export const GLOBAL_RUNS_PER_MINUTE = 60;
