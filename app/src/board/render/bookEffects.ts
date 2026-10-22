import { ClipOp, Skia, type SkCanvas } from '@shopify/react-native-skia';
import { clamp01, ease, EASE_IN_OUT, EASE_OUT, loop, track } from '../anim';
import { drawSprite } from './sprites';
import {
  PRISM_ANGLE,
  PRISM_BAND,
  REVEAL_MS,
  WASH_ALPHA,
  WASH_FADE_MS,
  type FrameState,
  type Pose,
  type SceneData,
  type SceneSprite,
} from './types';
import type { Part } from '../scene/spriteParts';

export interface View {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export function inView(view: View | null, x: number, y: number, reach: number): boolean {
  'worklet';
  return !view || (x + reach > view.x0 && x - reach < view.x1 && y + reach > view.y0 && y - reach < view.y1);
}

export function drawNight(c: SkCanvas, S: SceneData, F: FrameState) {
  'worklet';
  const night = S.night;
  if (!night) return;
  const P = S.paints;

  // Darkness with a hole for every lamp and for the flashlight around the loupe (z 17)
  c.saveLayer(undefined, S.pageRect);
  c.drawRect(S.pageRect, P.dark);
  for (let i = 0; i < night.lamps.length; i++) {
    const l = night.lamps[i];
    c.save();
    c.translate(l.x, l.y);
    c.scale(l.hole, l.hole);
    c.drawCircle(0, 0, 1, P.lampHole);
    c.restore();
  }
  const bx = (F.lx - F.tx) / F.s;
  const by = (F.ly - F.ty) / F.s;
  const br = (1.35 * S.loupe.r) / F.s;
  c.save();
  c.translate(bx, by);
  c.scale(br, br);
  c.drawCircle(0, 0, 1, P.beamHole);
  c.restore();
  c.restore();

  // Moon, stars and lamp glows (z 18)
  c.drawPath(night.moon, P.moonGlow);
  c.drawPath(night.moon, P.moon);
  for (let i = 0; i < night.stars.length; i++) {
    const st = night.stars[i];
    const a = track([0, 0.5, 1], [0.35, 1, 0.35], EASE_IN_OUT, loop(F.now, 3000, st.delay));
    P.starGlow.setAlphaf(0.9 * a);
    c.drawCircle(st.x, st.y, st.r, P.starGlow);
    P.star.setAlphaf(a);
    c.drawCircle(st.x, st.y, st.r, P.star);
  }
  for (let i = 0; i < night.lamps.length; i++) {
    const l = night.lamps[i];
    P.lamp.setShader(l.shader);
    P.lamp.setAlphaf(track([0, 0.5, 1], [0.85, 1, 0.85], EASE_IN_OUT, loop(F.now, 4000, l.delay)));
    c.save();
    c.translate(l.x, l.y);
    c.scale(l.glow * Math.SQRT2, l.glow * Math.SQRT2);
    c.drawCircle(0, 0, Math.SQRT1_2, P.lamp);
    c.restore();
  }
}

// Where the two glints of a golden critter sit (fractions of its box) and how long one twinkle lasts (ms)
const GLINTS = [
  { dx: 0.34, dy: -0.3, r: 0.3, delay: 0 },
  { dx: -0.3, dy: 0.24, r: 0.22, delay: 900 },
];
const GLINT_MS = 1800;

/** A golden critter still hiding: two small glints come and go on it. */
export function drawGlints(c: SkCanvas, S: SceneData, sp: SceneSprite, pose: Pose, now: number, fade: number) {
  'worklet';
  const glint = S.paints.goldGlint;
  for (let i = 0; i < GLINTS.length; i++) {
    const g = GLINTS[i];
    const twinkle = track([0, 0.15, 0.3, 1], [0, 1, 0, 0], EASE_IN_OUT, loop(now, GLINT_MS, g.delay));
    if (twinkle <= 0) continue;
    glint.setAlphaf(twinkle * fade);
    c.save();
    c.translate(pose.x + g.dx * sp.w, pose.y + g.dy * sp.w);
    c.scale(g.r * sp.w, g.r * sp.w);
    c.drawCircle(0, 0, 1, glint);
    c.restore();
  }
}

// The prism's drawings change colour this often (ms), each a step behind the one before
const PRISM_STEP_MS = 220;

/**
 * A drawing in light (LENS_PRISM), seen through the loupe: only inside the rainbow band the prism
 * casts across the lens (loupe.ts draws the band), its glow running through the rainbow.
 */
export function drawInPrism(
  c: SkCanvas,
  S: SceneData,
  sp: SceneSprite,
  pose: Pose,
  parts: Part[],
  index: number,
  alpha: number,
  now: number,
  view: View
) {
  'worklet';
  // The loupe is centred on the middle of what it shows (page units)
  const cx = (view.x0 + view.x1) / 2;
  const cy = (view.y0 + view.y1) / 2;
  const seen = (view.x1 - view.x0) / 2;
  const half = PRISM_BAND * seen;
  const colours = S.paints.prism;
  c.save();
  // The band's own rectangle (loupe paints), as loupe.ts lays it over the lens
  c.translate(cx, cy);
  c.rotate(PRISM_ANGLE, 0, 0);
  c.scale(seen, half);
  c.clipRect(S.loupe.prismRect, ClipOp.Intersect, true);
  c.scale(1 / seen, 1 / half);
  c.rotate(-PRISM_ANGLE, 0, 0);
  c.translate(-cx, -cy);
  drawSprite(c, sp, pose, parts, colours[(Math.floor(now / PRISM_STEP_MS) + index) % colours.length], alpha, false, S.paints.glowSpot);
  c.restore();
}

/**
 * The watercolour wash (see WASH_ALPHA): one layer over what is seen of the page, with a soft patch
 * cleared around every find. Day pages only, never in the loupe.
 */
export function drawWash(c: SkCanvas, S: SceneData, F: FrameState, view: View | null) {
  'worklet';
  if (S.night || F.reveal < 0) return;
  const fade = F.reveal > 0 ? 1 - clamp01((F.now - F.reveal) / WASH_FADE_MS) : 1;
  if (fade <= 0) return;
  const P = S.paints;
  const page = S.pageRect;
  // Only what is on screen: the layer costs in proportion to its area
  const x0 = view ? Math.max(page.x, view.x0) : page.x;
  const y0 = view ? Math.max(page.y, view.y0) : page.y;
  const x1 = view ? Math.min(page.x + page.width, view.x1) : page.x + page.width;
  const y1 = view ? Math.min(page.y + page.height, view.y1) : page.y + page.height;
  if (x1 <= x0 || y1 <= y0) return;
  const bounds = Skia.XYWHRect(x0, y0, x1 - x0, y1 - y0);
  c.saveLayer(undefined, bounds);
  P.wash.setAlphaf(WASH_ALPHA * fade);
  c.drawRect(bounds, P.wash);
  for (let i = 0; i < S.marks.length; i++) {
    const m = S.marks[i];
    const f = F.found[m.id];
    if (!f) continue;
    const grow = ease(EASE_OUT, clamp01((F.now - f.t) / REVEAL_MS));
    if (grow <= 0) continue;
    for (let j = 0; j < m.reveal.length; j++) {
      const b = m.reveal[j];
      const r = b.r * grow;
      if (!inView(view, f.x + b.dx, f.y + b.dy, r)) continue;
      c.save();
      c.translate(f.x + b.dx, f.y + b.dy);
      c.scale(r, r);
      c.drawCircle(0, 0, 1, P.washHole);
      c.restore();
    }
  }
  c.restore();
}

