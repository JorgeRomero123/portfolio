import type { Metadata } from 'next';
import { headers } from 'next/headers';
import GameStage from '@/components/the-game/GameStage';
import Overview, { IntroText } from '@/components/the-game/Overview';
import { LangProvider } from '@/components/the-game/lang';
import type { Lang } from '@/components/the-game/types';

const TITLE = 'The Game | Jorge Romero Romanis';
const DESCRIPTION =
  'A playable low-poly board game that tours Jorge Romero Romanis’s work and passions: software, drone video, 360° content, music, board games and more. Roll the dice or throw a dart to explore, or read the short version.';

// og:image / twitter:image come from ./opengraph-image.tsx and ./twitter-image.tsx.
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://jorgeromeroromanis.com'),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/the-game' },
  openGraph: {
    type: 'website',
    url: '/the-game',
    siteName: 'Jorge Romero Romanis',
    title: TITLE,
    description: DESCRIPTION,
    locale: 'en_US',
    alternateLocale: ['es_MX'],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
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
      <section id="play" aria-labelledby="the-game-title" aria-describedby="the-game-intro" className="relative scroll-mt-16">
        <IntroText />
        <GameStage />
      </section>
      {/* The fast path for people who won't play: fully server-rendered, works without JS. */}
      <section id="overview" tabIndex={-1} aria-labelledby="overview-title" className="scroll-mt-16 outline-none">
        <Overview />
      </section>
    </LangProvider>
  );
}
