import { promises as fs } from 'fs';
import path from 'path';
import type { GalleryData, VideosData, ToursData } from './types';

const contentDirectory = path.join(process.cwd(), 'content');

export async function getGalleryData(): Promise<GalleryData> {
  const filePath = path.join(contentDirectory, 'gallery.json');
  const fileContents = await fs.readFile(filePath, 'utf8');
  return JSON.parse(fileContents);
}

export async function getVideosData(): Promise<VideosData> {
  const filePath = path.join(contentDirectory, 'videos.json');
  const fileContents = await fs.readFile(filePath, 'utf8');
  return JSON.parse(fileContents);
}

export async function getToursData(): Promise<ToursData> {
  const filePath = path.join(contentDirectory, 'tours.json');
  const fileContents = await fs.readFile(filePath, 'utf8');
  return JSON.parse(fileContents);
}

export async function getAboutContent(): Promise<string> {
  const filePath = path.join(contentDirectory, 'about.md');
  const fileContents = await fs.readFile(filePath, 'utf8');
  return fileContents;
}
