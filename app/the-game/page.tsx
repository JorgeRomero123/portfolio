import type { Metadata } from 'next';
import GameStage from '@/components/the-game/GameStage';
import Overview, { IntroText } from '@/components/the-game/Overview';
import { LangProvider } from '@/components/the-game/lang';

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

export default function TheGamePage() {
  // English by default, like the rest of the site; the in-game toggle switches to Spanish.
  return (
    <LangProvider initialLang="en">
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
