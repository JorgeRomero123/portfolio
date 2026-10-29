import type { Metadata } from 'next';
import { Familjen_Grotesk, Newsreader, JetBrains_Mono } from 'next/font/google';
import BuildingExperience from '@/components/building/BuildingExperience';

/**
 * The homepage being rebuilt as a building you ride down in an elevator. Lives on its
 * own route until it replaces `/`.
 */

export const metadata: Metadata = {
  title: 'Jorge Romero Romanis — the building',
  robots: { index: false, follow: false },
};

const familjen = Familjen_Grotesk({ subsets: ['latin'] });
const newsreader = Newsreader({ subsets: ['latin'], axes: ['opsz'] });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['500', '700'] });

export default function BuildingPage() {
  return (
    <BuildingExperience
      fonts={{
        display: familjen.style.fontFamily,
        body: newsreader.style.fontFamily,
        mono: mono.style.fontFamily,
      }}
    />
  );
}
