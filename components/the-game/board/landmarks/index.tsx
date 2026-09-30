// Landmark model per section. Each entry renders in local space at SECTION_LAYOUT[id].landmark
// (origin on the pad surface, within a ~0.5 radius, under ~0.85 tall). BoardScene orients each one
// so its front (+z) faces the path or, for the back row, the viewer (see BoardScene's Landmarks).
// Placeholder.tsx is kept as an unused fallback.
import type { ComponentType } from 'react';
import type { SectionId } from '../../types';
import { SECTION_LAYOUT } from '../layout';
import ArtOverlay from './ArtOverlay';
import BoardGames from './BoardGames';
import Beer from './Beer';
import Drone from './Drone';
import EMarts from './EMarts';
import Kitchen from './Kitchen';
import Music from './Music';
import MyAlbumLink from './MyAlbumLink';
import Pano360 from './Pano360';
import Software from './Software';
import Spurs from './Spurs';

export type LandmarkComponent = ComponentType<{ color: string; reducedMotion: boolean }>;

export const LANDMARKS: Record<SectionId, LandmarkComponent> = {
  software: Software,
  drone: Drone,
  spurs: Spurs,
  pano360: Pano360,
  boardgames: BoardGames,
  music: Music,
  beer: Beer,
  artoverlay: ArtOverlay,
  myalbumlink: MyAlbumLink,
  emarts: EMarts,
  kitchen: Kitchen,
};

/** Height (above the pad) of each model's top, where its board label is pinned. */
export const LANDMARK_TOP: Record<SectionId, number> = {
  software: 0.78,
  drone: 0.66,
  spurs: 0.62,
  pano360: 0.82,
  boardgames: 0.6,
  music: 0.5,
  beer: 0.62,
  artoverlay: 0.56,
  myalbumlink: 0.62,
  emarts: 0.5,
  kitchen: 0.84,
};

/**
 * Yaw for a landmark model. Models face the path (layout's rotY), nudged towards the default
 * landscape camera (+z) so side sections show a 3/4 front. Back-row sections, whose path runs behind
 * them from the camera's point of view, are turned to face the lake and the viewer instead, so every
 * model shows its front in the whole-board and follow views.
 */
export function landmarkYaw(id: SectionId): number {
  const r = SECTION_LAYOUT[id].landmark.rotY;
  let dx = Math.sin(r);
  let dz = Math.cos(r);
  if (dz < -0.3) {
    dx = -dx;
    dz = -dz;
  }
  return Math.atan2(dx, dz + 0.8);
}
