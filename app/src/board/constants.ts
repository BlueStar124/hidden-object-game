import { SPRITE_BASE_WIDTH } from '@core/game/CamoSampler';

/** The watercolour spread is drawn in its own pixel space: 1760 × 1240 "page units". */
export const PAGE_W = 1760;
export const PAGE_H = 1240;

/** Page units per CSS pixel of the web sketchbook at its full 960px width (for shadow & glow sizes). */
export const PX = PAGE_W / 960;

/** Magnification of the loupe over the page as it is shown. */
export const LOUPE_ZOOM = 2.4;

/** Sprite box size in page units. */
export const spriteSize = (scale: number | undefined) => SPRITE_BASE_WIDTH * (scale ?? 1) * PAGE_W;

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;
