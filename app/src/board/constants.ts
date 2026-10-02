import { SPRITE_BASE_WIDTH } from '../core/model';

/** The watercolour spread is drawn in its own pixel space: 1760 × 1240 "page units". */
export const PAGE_W = 1760;
export const PAGE_H = 1240;

/** Page units per CSS pixel of the original 960px-wide web sketchbook (shadow & glow sizes are in those). */
export const PX = PAGE_W / 960;

/** Magnification of the loupe over the page as it is shown. */
export const LOUPE_ZOOM = 2.4;

/** Sprite box size in page units. */
export const spriteSize = (scale: number | undefined) => SPRITE_BASE_WIDTH * (scale ?? 1) * PAGE_W;

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;
