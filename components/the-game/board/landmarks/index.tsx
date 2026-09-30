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

/**
 * Where each board label's stem lands, in the model's local space: `y` is the top of the model's
 * tallest main element and `back` how far behind the pad centre (local -z) that element sits, so the
 * label lands on the model itself (e.g. the stadium's banner, the artoverlay wall) and not on empty
 * space in front of it.
 */
export const LANDMARK_LABEL: Record<SectionId, { y: number; back: number }> = {
  software: { y: 0.74, back: 0.14 },
  drone: { y: 0.72, back: 0.06 },
  spurs: { y: 0.46, back: 0.22 },
  pano360: { y: 0.84, back: 0 },
  boardgames: { y: 0.62, back: 0.27 },
  music: { y: 0.5, back: 0.12 },
  beer: { y: 0.58, back: 0.15 },
  artoverlay: { y: 0.68, back: 0.25 },
  myalbumlink: { y: 0.68, back: 0 },
  emarts: { y: 0.6, back: 0.08 },
  kitchen: { y: 0.84, back: 0.27 },
};

/** World position of a landmark's label anchor. */
export function landmarkLabelAnchor(id: SectionId): [number, number, number] {
  const { x, y, z } = SECTION_LAYOUT[id].landmark;
  const { y: top, back } = LANDMARK_LABEL[id];
  const yaw = landmarkYaw(id);
  return [x - Math.sin(yaw) * back, y + top, z - Math.cos(yaw) * back];
}

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
