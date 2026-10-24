import { ClipOp, FilterMode, MipmapMode, type SkCanvas } from '@shopify/react-native-skia';
import { bloom, clamp01, loop, track, EASE_IN_OUT } from '../anim';
import { drawSprite } from './sprites';
import {
  CAMO_CHAMELEON,
  CAMO_INVISIBLE,
  DAY_TRAIL_MS,
  FOUND_FADE_MS,
  LENS_PRISM,
  LENS_TINY,
  TINY_ZOOM_FROM,
  TINY_ZOOM_FULL,
  type FrameState,
  type Pose,
  type SceneData,
  type SceneSprite,
} from './types';
import type { AtlasCell } from '../scene/spriteAtlas';
import {
  drawGlints,
  drawInPrism,
  drawNight,
  drawWash,
  inView,
  type View,
} from './bookEffects';

export type { View };

/** The painted spread: artwork, camouflaged sprites, the scraps of painting over them, night. */

// Sheet cells are drawn up to this much larger than they were drawn at before shapes take over
const SHEET_STRETCH = 1.15;

function drawImage(c: SkCanvas, S: SceneData, magnified: boolean) {
  'worklet';
  if (magnified) c.drawImageRectCubic(S.image, S.imageRect, S.pageRect, 1 / 3, 1 / 3, S.paints.image);
  else c.drawImageRectOptions(S.image, S.imageRect, S.pageRect, FilterMode.Linear, MipmapMode.Linear, S.paints.image);
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
      // (Invisible ink has no page drawing: this is always the loupe)
      const glow = track([0, 0.5, 1], [0.7, 1, 0.7], EASE_IN_OUT, loop(now, 2400));
      if (sp.lens === LENS_PRISM) {
        if (view) drawInPrism(c, S, sp, pose, parts, i, glow * fade, now, view);
      } else if (sp.lens === LENS_TINY) {
        const seen = clamp01((F.zoom - TINY_ZOOM_FROM) / (TINY_ZOOM_FULL - TINY_ZOOM_FROM));
        if (seen > 0) drawSprite(c, sp, pose, parts, P.tiny, seen * fade, false, P.glowSpot, atlas, cell);
      } else {
        drawSprite(c, sp, pose, parts, P.invisible, glow * fade, false, P.glowSpot, atlas, cell);
      }
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

  // Day and night: the ways found things went since the day, under them (z 18.5)
  for (let i = 0; i < S.sprites.length; i++) {
    const sp = S.sprites[i];
    if (!sp.dayTrail || !poses[i].found) continue;
    const a = 0.85 * clamp01(poses[i].age / DAY_TRAIL_MS);
    P.dayTrail.setAlphaf(a);
    c.drawPath(sp.dayTrail, P.dayTrail);
    P.dayRing.setAlphaf(a);
    c.drawCircle(sp.dayX, sp.dayY, 0.45 * sp.w, P.dayRing);
  }

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
