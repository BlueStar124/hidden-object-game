/**
 * Worklet versions of the CSS animations used by the web sketchbook (sprites.css, Sketchbook,
 * Loupe): timing functions, keyframe tracks and the named curves, evaluated from a clock.
 */

/** CSS cubic-bezier(x1, y1, x2, y2) evaluated at progress x ∈ [0, 1]. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number, x: number): number {
  'worklet';
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  // Newton–Raphson on x(t) = x, falling back to bisection
  let t = x;
  for (let i = 0; i < 8; i++) {
    const err = ((ax * t + bx) * t + cx) * t - x;
    if (Math.abs(err) < 1e-6) return ((ay * t + by) * t + cy) * t;
    const d = (3 * ax * t + 2 * bx) * t + cx;
    if (Math.abs(d) < 1e-6) break;
    t -= err / d;
  }
  let lo = 0;
  let hi = 1;
  t = x;
  for (let i = 0; i < 30; i++) {
    const v = ((ax * t + bx) * t + cx) * t;
    if (Math.abs(v - x) < 1e-6) break;
    if (v < x) lo = t;
    else hi = t;
    t = (lo + hi) / 2;
  }
  return ((ay * t + by) * t + cy) * t;
}

export const EASE = 0;
export const EASE_IN = 1;
export const EASE_OUT = 2;
export const EASE_IN_OUT = 3;
export const LINEAR = 4;
export const BACK_OUT = 5; // cubic-bezier(0.175, 0.885, 0.32, 1.275)
export const STANDARD = 6; // cubic-bezier(0.4, 0, 0.2, 1)

export function ease(kind: number, x: number): number {
  'worklet';
  switch (kind) {
    case EASE:
      return cubicBezier(0.25, 0.1, 0.25, 1, x);
    case EASE_IN:
      return cubicBezier(0.42, 0, 1, 1, x);
    case EASE_OUT:
      return cubicBezier(0, 0, 0.58, 1, x);
    case EASE_IN_OUT:
      return cubicBezier(0.42, 0, 0.58, 1, x);
    case BACK_OUT:
      return cubicBezier(0.175, 0.885, 0.32, 1.275, x);
    case STANDARD:
      return cubicBezier(0.4, 0, 0.2, 1, x);
    default:
      return x < 0 ? 0 : x > 1 ? 1 : x;
  }
}

/**
 * One animated property: `stops` are keyframe offsets (0–1), `values` the property at each.
 * Like CSS, the timing function applies to every segment between two keyframes.
 */
export function track(stops: number[], values: number[], easing: number, p: number): number {
  'worklet';
  if (p <= stops[0]) return values[0];
  for (let i = 1; i < stops.length; i++) {
    if (p <= stops[i]) {
      const span = stops[i] - stops[i - 1];
      const f = span > 0 ? ease(easing, (p - stops[i - 1]) / span) : 1;
      return values[i - 1] + (values[i] - values[i - 1]) * f;
    }
  }
  return values[values.length - 1];
}

/** Progress within a repeating cycle (0–1), with an optional CSS-style (negative) delay. */
export function loop(nowMs: number, durationMs: number, delayMs: number = 0): number {
  'worklet';
  const t = (nowMs - delayMs) / durationMs;
  return t - Math.floor(t);
}

/** `animation-direction: alternate` with a symmetric timing function: 0 → 1 → 0. */
export function alternate(nowMs: number, durationMs: number, easing: number, delayMs: number = 0): number {
  'worklet';
  const t = (nowMs - delayMs) / durationMs;
  const cycle = Math.floor(t);
  const f = t - cycle;
  return ease(easing, cycle % 2 === 0 ? f : 1 - f);
}

/** Progress of a one-shot animation that started at `startMs` (clamped to 0–1). */
export function once(nowMs: number, startMs: number, durationMs: number): number {
  'worklet';
  const p = (nowMs - startMs) / durationMs;
  return p < 0 ? 0 : p > 1 ? 1 : p;
}

export const lerp = (a: number, b: number, t: number) => {
  'worklet';
  return a + (b - a) * t;
};

/* ------------------------ Named curves from the web CSS ------------------------ */

/** spriteBlink 4.6s: eyes close briefly at ~94% of every cycle. */
export function blinkScale(nowMs: number, delayMs: number): number {
  'worklet';
  return track([0, 0.91, 0.94, 1], [1, 1, 0.12, 1], EASE, loop(nowMs, 4600, delayMs));
}

/** shyPeek (ease-in-out): opacity and offset (fraction of the sprite size, towards `from`). */
export function shyPeek(phase: number): { opacity: number; out: number } {
  'worklet';
  return {
    opacity: track([0, 0.08, 0.4, 0.48, 1], [0, 1, 1, 0, 0], EASE_IN_OUT, phase),
    out: track([0, 0.08, 0.4, 0.48, 1], [1, 0, 0, 1, 1], EASE_IN_OUT, phase),
  };
}

/** shyJump (linear): leaps out of hiding in an arc. Offsets are fractions of the sprite size. */
export function shyJump(phase: number): { opacity: number; dx: number; dy: number; rotate: number } {
  'worklet';
  const at = [0, 0.24, 0.42, 0.48, 1];
  return {
    opacity: track([0, 0.06, 0.42, 0.48, 1], [0, 1, 1, 0, 0], LINEAR, phase),
    dx: track(at, [-0.45, 0, 0.45, 0.45, 0.45], LINEAR, phase),
    dy: track(at, [0.55, -0.18, 0.55, 0.55, 0.55], LINEAR, phase),
    rotate: track(at, [-55, 0, 55, 55, 55], LINEAR, phase),
  };
}

/** foundBounce 0.6s: the sprite pops when it is found. */
export function foundBounce(p: number): { scale: number; rotate: number } {
  'worklet';
  const at = [0, 0.4, 0.7, 1];
  return {
    scale: track(at, [1, 1.4, 0.9, 1], BACK_OUT, p),
    rotate: track(at, [0, -8, 4, 0], BACK_OUT, p),
  };
}

/** watercolorBloom 1.1s ease-out: a wash of colour spreading behind a found sprite. */
export function bloom(p: number): { scale: number; opacity: number } {
  'worklet';
  return {
    scale: lerp(0.3, 1.35, ease(EASE_OUT, p)),
    opacity: track([0, 0.3, 1], [0, 1, 0], EASE_OUT, p),
  };
}
