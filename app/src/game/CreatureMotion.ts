import type { HiddenObject, RoamBehavior, ShyBehavior } from '@core/types/level';

/**
 * App twin of `src/game/CreatureMotion.ts` — same maths, written as worklets so the UI thread
 * can draw shy and roaming creatures every frame. Metro routes the shared DetectionEngine's
 * import here (see metro.config.js), so a creature can only be caught where it is drawn.
 * Keep the maths in sync with the web file.
 */

// Shared clock, in the JS thread's performance.now() domain (DetectionEngine's default `now`).
// The UI thread has no access to that clock, so it rebuilds it from the wall clock.
const EPOCH = performance.now();
const PERF_MINUS_WALL = performance.now() - Date.now();
const ASPECT = 1760 / 1240;

/** Current time on the shared creature clock, callable from any thread. */
export function motionNow(): number {
  'worklet';
  return Date.now() + PERF_MINUS_WALL;
}

function cycleSeconds(period: number, offset: number | undefined, now: number): number {
  'worklet';
  const t = (now - EPOCH) / 1000 + (offset ?? 0);
  return ((t % period) + period) % period;
}

/* ---------------------------- Shy creatures ---------------------------- */

// Mirrors the shyPeek keyframes: fully out between 8% and 40%, fading in/out around them.
// Catchable while it is still clearly visible (opacity ≳ 0.4).
const VISIBLE_FROM = 0.035;
const VISIBLE_TO = 0.455;

export function shyPhase(shy: ShyBehavior, now: number): number {
  'worklet';
  return cycleSeconds(shy.period, shy.offset, now) / shy.period;
}

export function isShyVisible(shy: ShyBehavior, now: number = performance.now()): boolean {
  'worklet';
  const phase = shyPhase(shy, now);
  return phase >= VISIBLE_FROM && phase <= VISIBLE_TO;
}

/** Web-only (CSS animation delay); kept so the twin exposes the same API. */
export function shyAnimationDelay(shy: ShyBehavior, now: number = performance.now()): string {
  return `${(-cycleSeconds(shy.period, shy.offset, now)).toFixed(3)}s`;
}

/* --------------------------- Roaming creatures --------------------------- */

export interface RoamState {
  x: number;
  y: number;
  flip: boolean; // Whether the sprite must be mirrored to face its direction of travel
}

export function roamState(roam: RoamBehavior, now: number = performance.now()): RoamState {
  'worklet';
  const src = roam.path;
  const n = roam.loop ? src.length + 1 : src.length;
  const at = (i: number) => src[i % src.length];

  // Cumulative aspect-corrected length (paths are a handful of points, so no cache needed)
  let total = 0;
  for (let i = 1; i < n; i++) {
    total += Math.hypot((at(i)[0] - at(i - 1)[0]) * ASPECT, at(i)[1] - at(i - 1)[1]);
  }

  const t = cycleSeconds(roam.period, roam.offset, now) / roam.period;
  let u: number;
  let forward = true;
  if (roam.loop) {
    u = t;
  } else {
    // Ping-pong, easing into each turnaround so the creature slows down before turning
    const leg = t < 0.5 ? t * 2 : 2 - t * 2;
    forward = t < 0.5;
    u = leg * leg * (3 - 2 * leg);
  }

  const d = u * total;
  let i = 0;
  let start = 0;
  let seg = 0;
  for (; i < n - 1; i++) {
    seg = Math.hypot((at(i + 1)[0] - at(i)[0]) * ASPECT, at(i + 1)[1] - at(i)[1]);
    if (start + seg >= d || i === n - 2) break;
    start += seg;
  }
  const f = seg > 0 ? (d - start) / seg : 0;
  const [x0, y0] = at(i);
  const [x1, y1] = at(Math.min(i + 1, n - 1));

  const dx = (x1 - x0) * (forward ? 1 : -1);
  const movingLeft = dx < 0;
  const facing = roam.facing ?? 'right';
  return {
    x: x0 + (x1 - x0) * f,
    y: y0 + (y1 - y0) * f,
    flip: facing === 'right' ? movingLeft : !movingLeft,
  };
}

/** Where an object is drawn right now (roaming creatures move; everything else stays put). */
export function objectPosition(obj: HiddenObject, now: number = performance.now()): { x: number; y: number } {
  'worklet';
  if (obj.roam && obj.roam.path.length >= 2) {
    const { x, y } = roamState(obj.roam, now);
    return { x, y };
  }
  return { x: obj.x, y: obj.y };
}
