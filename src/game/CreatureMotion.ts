import { HiddenObject, RoamBehavior, ShyBehavior } from '../types/level';

/**
 * Shared clock for creatures that move. CSS animations (shy peeking) and the JS roaming loop
 * both derive their phase from this epoch, and so does click detection — a creature can only be
 * caught where and when it is actually drawn, on the page and inside the loupe alike.
 */
const EPOCH = performance.now();
const ASPECT = 1760 / 1240;

function cycleSeconds(period: number, offset: number | undefined, now: number): number {
  const t = (now - EPOCH) / 1000 + (offset ?? 0);
  return ((t % period) + period) % period;
}

/* ---------------------------- Shy creatures ---------------------------- */

// Must match the keyframe percentages in sprites.css: fully out between 8% and 40%, fading
// in/out around them. Catchable while it is still clearly visible (opacity ≳ 0.4).
const VISIBLE_FROM = 0.035;
const VISIBLE_TO = 0.455;

export function isShyVisible(shy: ShyBehavior, now: number = performance.now()): boolean {
  const phase = cycleSeconds(shy.period, shy.offset, now) / shy.period;
  return phase >= VISIBLE_FROM && phase <= VISIBLE_TO;
}

/** Negative animation-delay that lines a freshly mounted CSS animation up with the shared clock. */
export function shyAnimationDelay(shy: ShyBehavior, now: number = performance.now()): string {
  return `${(-cycleSeconds(shy.period, shy.offset, now)).toFixed(3)}s`;
}

/* --------------------------- Roaming creatures --------------------------- */

interface PreparedPath {
  pts: [number, number][];
  cum: number[]; // Cumulative aspect-corrected length at each point
  total: number;
}

const prepared = new WeakMap<RoamBehavior, PreparedPath>();

function preparePath(roam: RoamBehavior): PreparedPath {
  let p = prepared.get(roam);
  if (!p) {
    const pts = roam.loop ? [...roam.path, roam.path[0]] : roam.path;
    const cum = [0];
    for (let i = 1; i < pts.length; i++) {
      const dx = (pts[i][0] - pts[i - 1][0]) * ASPECT;
      const dy = pts[i][1] - pts[i - 1][1];
      cum.push(cum[i - 1] + Math.hypot(dx, dy));
    }
    p = { pts, cum, total: cum[cum.length - 1] };
    prepared.set(roam, p);
  }
  return p;
}

export interface RoamState {
  x: number;
  y: number;
  flip: boolean; // Whether the sprite must be mirrored to face its direction of travel
}

export function roamState(roam: RoamBehavior, now: number = performance.now()): RoamState {
  const { pts, cum, total } = preparePath(roam);
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
  while (i < cum.length - 2 && cum[i + 1] < d) i++;
  const seg = cum[i + 1] - cum[i];
  const f = seg > 0 ? (d - cum[i]) / seg : 0;
  const [x0, y0] = pts[i];
  const [x1, y1] = pts[Math.min(i + 1, pts.length - 1)];

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
  if (obj.roam && obj.roam.path.length >= 2) {
    const { x, y } = roamState(obj.roam, now);
    return { x, y };
  }
  return { x: obj.x, y: obj.y };
}
