// Landmark model per section. Each entry renders in local space at SECTION_LAYOUT[id].landmark
// (origin on the pad surface, +z towards the path). Replace Placeholder with one file per section.
import type { ComponentType } from 'react';
import type { SectionId } from '../../types';
import Placeholder from './Placeholder';

export type LandmarkComponent = ComponentType<{ color: string; reducedMotion: boolean }>;

export const LANDMARKS: Record<SectionId, LandmarkComponent> = {
  software: Placeholder,
  drone: Placeholder,
  spurs: Placeholder,
  pano360: Placeholder,
  boardgames: Placeholder,
  music: Placeholder,
  beer: Placeholder,
  artoverlay: Placeholder,
  myalbumlink: Placeholder,
  emarts: Placeholder,
  kitchen: Placeholder,
};
