import { promises as fs } from 'fs';
import path from 'path';
import HomeExperience from '@/components/home/HomeExperience';
import { getGalleryData } from '@/lib/content';
import type { Photo360Data } from '@/lib/types';

/** First real frame from a collection, used as the hero image for its tile. */
async function getPhotographyHero() {
  try {
    const { photos } = await getGalleryData();
    const hero = photos.find((p) => !p.isPortrait) ?? photos[0];
    return hero ? { url: hero.url, title: hero.title } : null;
  } catch {
    return null;
  }
}

async function getPanoramaHero() {
  try {
    const file = path.join(process.cwd(), 'content', 'photos360.json');
    const data: Photo360Data = JSON.parse(await fs.readFile(file, 'utf8'));
    const hero = data.photos[0];
    return hero ? { url: hero.url, title: hero.title } : null;
  } catch {
    return null;
  }
}

export default async function Home() {
  const [photographyHero, panoramaHero] = await Promise.all([
    getPhotographyHero(),
    getPanoramaHero(),
  ]);

  return <HomeExperience photographyHero={photographyHero} panoramaHero={panoramaHero} />;
}
