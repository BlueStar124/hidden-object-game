import { ShyBehavior } from '../types/level';

/**
 * Shared clock for shy creatures. The CSS peek animation (sprites.css → shyPeek/shyJump)
 * and click detection both derive their phase from this epoch, so the creature is
 * only catchable while it is actually on screen — in the page and inside the loupe alike.
 */
const SHY_EPOCH = performance.now();

// Must match the keyframe percentages in sprites.css: fully out between 8% and 40%.
const VISIBLE_FROM = 0.05;
const VISIBLE_TO = 0.44;

function cycleSeconds(shy: ShyBehavior, now: number): number {
  const t = (now - SHY_EPOCH) / 1000 + (shy.offset ?? 0);
  return ((t % shy.period) + shy.period) % shy.period;
}

export function isShyVisible(shy: ShyBehavior, now: number = performance.now()): boolean {
  const phase = cycleSeconds(shy, now) / shy.period;
  return phase >= VISIBLE_FROM && phase <= VISIBLE_TO;
}

/** Negative animation-delay that lines a freshly mounted CSS animation up with the shared clock. */
export function shyAnimationDelay(shy: ShyBehavior, now: number = performance.now()): string {
  return `${(-cycleSeconds(shy, now)).toFixed(3)}s`;
}
