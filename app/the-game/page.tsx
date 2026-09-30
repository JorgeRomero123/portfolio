import type { Metadata } from 'next';
import { headers } from 'next/headers';
import GameStage from '@/components/the-game/GameStage';
import { LangProvider } from '@/components/the-game/lang';
import type { Lang } from '@/components/the-game/types';

export const metadata: Metadata = {
  title: 'The Game | Jorge Romero Romanis',
  description:
    'A playable low-poly board game that tours Jorge Romero Romanis’s work and passions: software, drone video, 360° content, music, board games and more. Roll the dice or throw a dart to explore.',
};

/** 'es' when the browser prefers Spanish over English (by q-value), else 'en'. */
function pickLang(acceptLanguage: string | null): Lang {
  if (!acceptLanguage) return 'en';
  const prefs = acceptLanguage
    .split(',')
    .map((part, i) => {
      const [tag, ...params] = part.trim().toLowerCase().split(';');
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
      const qv = q ? Number(q.slice(2)) : 1;
      return { lang: tag.split('-')[0], q: Number.isFinite(qv) ? qv : 0, i };
    })
    .filter((p) => p.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i);
  const first = prefs.find((p) => p.lang === 'es' || p.lang === 'en');
  return first?.lang === 'es' ? 'es' : 'en';
}

export default async function TheGamePage() {
  const initialLang = pickLang((await headers()).get('accept-language'));
  return (
    <LangProvider initialLang={initialLang}>
      <section aria-labelledby="the-game-title" className="relative">
        <GameStage />
      </section>
      {/* Task 2 fills this with server-rendered content (the no-game overview of every section). */}
      <section id="overview" tabIndex={-1} className="scroll-mt-16 outline-none" />
    </LangProvider>
  );
}
