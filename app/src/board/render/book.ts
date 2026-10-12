import { ClipOp, FilterMode, MipmapMode, Skia, type SkCanvas } from '@shopify/react-native-skia';
import { bloom, clamp01, ease, EASE_IN_OUT, EASE_OUT, loop, track } from '../anim';
import { drawSprite } from './sprites';
import {
  CAMO_CHAMELEON,
  CAMO_INVISIBLE,
  FOUND_FADE_MS,
  REVEAL_MS,
  WASH_ALPHA,
  WASH_FADE_MS,
  type FrameState,
  type Pose,
  type SceneData,
  type SceneSprite,
} from './types';
import type { AtlasCell } from '../scene/spriteAtlas';

/** The painted spread: artwork, camouflaged sprites, the scraps of painting over them, night. */

/** What part of the spread is seen (page units); sprites wholly outside it are skipped. */
export interface View {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

function inView(view: View | null, x: number, y: number, reach: number): boolean {
  'worklet';
  return !view || (x + reach > view.x0 && x - reach < view.x1 && y + reach > view.y0 && y - reach < view.y1);
}

// Sheet cells are drawn up to this much larger than they were drawn at before shapes take over
const SHEET_STRETCH = 1.15;

function drawImage(c: SkCanvas, S: SceneData, magnified: boolean) {
  'worklet';
  if (magnified) c.drawImageRectCubic(S.image, S.imageRect, S.pageRect, 1 / 3, 1 / 3, S.paints.image);
  else c.drawImageRectOptions(S.image, S.imageRect, S.pageRect, FilterMode.Linear, MipmapMode.Linear, S.paints.image);
}

function drawNight(c: SkCanvas, S: SceneData, F: FrameState) {
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
function drawGlints(c: SkCanvas, S: SceneData, sp: SceneSprite, pose: Pose, now: number, fade: number) {
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

/**
 * The watercolour wash (see WASH_ALPHA): one layer over what is seen of the page, with a soft patch
 * cleared around every find. Day pages only, never in the loupe.
 */
function drawWash(c: SkCanvas, S: SceneData, F: FrameState, view: View | null) {
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

/**
 * The spread itself: artwork, camouflaged sprites, occluders, night, found sprites, glowing eyes.
 * `view`: the part of the spread that is seen (null: all of it).
 */
export function drawBook(c: SkCanvas, S: SceneData, F: FrameState, poses: Pose[], inLoupe: boolean, view: View | null) {
  'worklet';
  const P = S.paints;
  const now = F.now;
  drawImage(c, S, inLoupe);

  // Sprites at rest come from the sheet while it is sharp enough at this zoom (never in the loupe)
  const atlas = S.atlas;
  const fromSheet = (sp: SceneSprite, cell: AtlasCell | null, pose: Pose): AtlasCell | null => {
    const sheet = atlas;
    if (!sheet || inLoupe || F.s * S.pixelRatio > sheet.density * SHEET_STRETCH || !cell || (sp.blinks && pose.blink !== 1)) return null;
    return cell;
  };

  // Still hidden (z 15) — fading out for a moment once found
  for (let i = 0; i < S.sprites.length; i++) {
    const sp = S.sprites[i];
    const pose = poses[i];
    const fade = pose.found ? 1 - clamp01(pose.age / FOUND_FADE_MS) : 1;
    if (fade <= 0) continue;
    const parts = inLoupe ? sp.loupe : sp.page;
    if (!parts || !inView(view, pose.x, pose.y, 2.2 * sp.w)) continue;
    const cell = fromSheet(sp, sp.pageCell, pose);
    if (sp.camo === CAMO_CHAMELEON) {
      drawSprite(c, sp, pose, parts, P.chameleon, 0.95 * fade, false, P.glowSpot, atlas, cell, P.chameleonModulate, 0.95);
    } else if (sp.camo === CAMO_INVISIBLE) {
      const glow = track([0, 0.5, 1], [0.7, 1, 0.7], EASE_IN_OUT, loop(now, 2400));
      drawSprite(c, sp, pose, parts, P.invisible, glow * fade, false, P.glowSpot, atlas, cell);
    } else {
      drawSprite(c, sp, pose, parts, P.ink, 0.8 * fade, false, P.glowSpot, atlas, cell, P.inkModulate, 0.8);
    }
    if (sp.gold) drawGlints(c, S, sp, pose, now, fade);
  }

  // Scraps of painting over tucked-away sprites (z 16)
  for (let i = 0; i < S.sprites.length; i++) {
    const occ = S.sprites[i].occluder;
    const ob = S.sprites[i].occluderBounds;
    if (!occ || (ob && !inView(view, ob.x + ob.width / 2, ob.y + ob.height / 2, Math.max(ob.width, ob.height) / 2))) continue;
    c.save();
    c.clipPath(occ, ClipOp.Intersect, true);
    drawImage(c, S, inLoupe);
    c.restore();
  }

  // The loupe shows the true colours: the wash is for the page seen by eye (z 16.5)
  if (!inLoupe) drawWash(c, S, F, view);

  if (!inLoupe) drawNight(c, S, F);

  // Found: blooming back into colour (z 19)
  for (let i = 0; i < S.sprites.length; i++) {
    const pose = poses[i];
    if (!pose.found) continue;
    const sp = S.sprites[i];
    if (!inView(view, pose.x, pose.y, 2.2 * sp.w * Math.max(1, pose.bs))) continue;
    if (pose.age < 1100) {
      const b = bloom(pose.age / 1100);
      const reach = 1.9 * sp.w * Math.SQRT1_2 * b.scale;
      P.bloom.setAlphaf(b.opacity);
      c.save();
      c.translate(pose.x, pose.y);
      c.scale(reach, reach);
      c.drawCircle(0, 0, Math.SQRT1_2, P.bloom);
      c.restore();
    }
    drawSprite(
      c,
      sp,
      pose,
      sp.found,
      sp.gold ? (inLoupe ? P.foundGoldLoupe : P.foundGoldPage) : inLoupe ? P.foundLoupe : P.foundPage,
      0.9 * clamp01(pose.age / FOUND_FADE_MS + 0.15),
      false,
      P.glowSpot,
      atlas,
      fromSheet(sp, sp.foundCell, pose)
    );
  }

  // Daily page: the spread around the corner in play is washed over (z 19.5, under glowing eyes,
  // which a daily page never has)
  if (S.focus) {
    for (let i = 0; i < S.focusVeil.length; i++) c.drawRect(S.focusVeil[i], P.focusVeil);
    c.drawRect(S.focus, P.focusEdge);
  }

  // Night: only the eyes of creatures still hiding shine above the darkness (z 20)
  if (!inLoupe && S.night) {
    for (let i = 0; i < S.sprites.length; i++) {
      const sp = S.sprites[i];
      if (!sp.glow || poses[i].found || !inView(view, poses[i].x, poses[i].y, 2.2 * sp.w)) continue;
      drawSprite(c, sp, poses[i], sp.glow, P.plain, 1, true, P.glowSpot);
    }
  }
}
