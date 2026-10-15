/**
 * How finely the board is drawn, per device. iOS/Android draw natively at the screen's density, so
 * nothing is changed there (displayDensity.web.ts caps it in browsers).
 */

/** Frames with nothing but creatures moving are drawn every this many (1: every frame). */
export const IDLE_FRAME_STRIDE = 1;
