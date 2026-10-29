import { promises as fs } from 'fs';
import path from 'path';
import type { Metadata } from 'next';
import { Familjen_Grotesk, Newsreader, JetBrains_Mono } from 'next/font/google';
import BuildingExperience, { type FramedPhoto, type Panorama } from '@/components/building/BuildingExperience';
import { getGalleryData } from '@/lib/content';
import type { Photo360Data } from '@/lib/types';

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

/** Six landscape photos for the gallery wall: one from each place first, then the rest in order. */
async function getFramedPhotos(): Promise<FramedPhoto[]> {
  try {
    const landscape = (await getGalleryData()).photos.filter((p) => !p.isPortrait);
    const picks = [...new Map(landscape.map((p) => [p.category, p] as const)).values()];
    for (const p of landscape) {
      if (picks.length >= 6) break;
      if (!picks.includes(p)) picks.push(p);
    }
    return picks.slice(0, 6).map((p) => ({
      url: p.url,
      place: p.category,
      // drone frames are named after the camera's files
      drone: p.title.startsWith('DJI_'),
    }));
  } catch {
    return [];
  }
}

async function getPanoramas(): Promise<Panorama[]> {
  try {
    const file = path.join(process.cwd(), 'content', 'photos360.json');
    const data: Photo360Data = JSON.parse(await fs.readFile(file, 'utf8'));
    return data.photos.slice(0, 3).map(({ id, url, title }) => ({ id, url, title }));
  } catch {
    return [];
  }
}

export default async function BuildingPage() {
  const [photos, panoramas] = await Promise.all([getFramedPhotos(), getPanoramas()]);
  return (
    <BuildingExperience
      photos={photos}
      panoramas={panoramas}
      fonts={{
        display: familjen.style.fontFamily,
        body: newsreader.style.fontFamily,
        mono: mono.style.fontFamily,
      }}
    />
  );
}
