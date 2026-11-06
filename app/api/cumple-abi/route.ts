import type { NextRequest } from 'next/server';
import { THEMES, THEME_IDS } from '@/components/cumple-abi/themes';
import { allow, fail, getDb, json, unavailable } from '@/lib/the-game-leaderboard';

// La ruleta del cumple de Abi: qué opciones ya salieron, compartido entre todos los
// celulares. Sin Supabase (o sin la tabla de supabase/cumple-abi.sql) responde 503 y la
// página lleva la cuenta en cada celular.

const TABLE = 'cumple_abi_sorteo';

async function salieron() {
  const db = await getDb();
  if (!db) return null;
  const { data, error } = await db.from(TABLE).select('opcion');
  if (error) return null;
  return { db, ids: (data as { opcion: string }[]).map((r) => r.opcion).filter((id) => THEME_IDS.has(id)) };
}

/** GET → { salieron: string[] } */
export async function GET() {
  const s = await salieron();
  if (!s) return unavailable();
  return json({ salieron: s.ids });
}

/**
 * POST → gira: el servidor elige al azar entre las que quedan y la aparta, para que dos
 * invitados nunca se lleven la misma. { opcion, salieron } o 409 { agotadas: true }.
 */
export async function POST(req: NextRequest) {
  if (!allow(req, 'cumple-abi', 30, 60_000)) return fail('Más despacio 🙂', 429);
  for (let intento = 0; intento < 5; intento++) {
    const s = await salieron();
    if (!s) return unavailable();
    const tomadas = new Set(s.ids);
    const quedan = THEMES.filter((t) => !tomadas.has(t.id));
    if (quedan.length === 0) return json({ agotadas: true, salieron: s.ids }, 409);
    const opcion = quedan[Math.floor(Math.random() * quedan.length)].id;
    const { error } = await s.db.from(TABLE).insert({ opcion });
    if (!error) return json({ opcion, salieron: [...s.ids, opcion] });
    if (error.code !== '23505') return unavailable(); // 23505: alguien más la sacó justo ahora
  }
  return fail('Intenta otra vez', 409);
}

/** DELETE → vuelve a empezar, solo cuando ya salieron todas. */
export async function DELETE() {
  const s = await salieron();
  if (!s) return unavailable();
  if (s.ids.length < THEMES.length) return fail('Todavía quedan opciones', 409);
  const { error } = await s.db.from(TABLE).delete().neq('opcion', '');
  if (error) return unavailable();
  return json({ salieron: [] });
}
