import { ClipOp, FilterMode, MipmapMode, type SkCanvas } from '@shopify/react-native-skia';
import { bloom, clamp01, EASE_IN_OUT, loop, track } from '../anim';
import { drawSprite, type SpriteCell } from './sprites';
import {
  CAMO_CHAMELEON,
  CAMO_INVISIBLE,
  FOUND_FADE_MS,
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
  const fromSheet = (sp: SceneSprite, cell: AtlasCell | null, pose: Pose, hidden: boolean): SpriteCell | null => {
    const sheet = atlas;
    if (!sheet || inLoupe || F.s * S.pixelRatio > sheet.density * SHEET_STRETCH || !cell || (sp.blinks && pose.blink !== 1)) return null;
    return {
      sheet: sheet.image, cell, plain: P.sheet,
      ...(hidden ? {
        modulate: sp.camo === CAMO_CHAMELEON ? P.chameleonModulate : P.inkModulate,
        baseOpacity: sp.camo === CAMO_CHAMELEON ? 0.95 : 0.8,
      } : {}),
    };
  };

  // Still hidden (z 15) — fading out for a moment once found
  for (let i = 0; i < S.sprites.length; i++) {
    const sp = S.sprites[i];
    const pose = poses[i];
    const fade = pose.found ? 1 - clamp01(pose.age / FOUND_FADE_MS) : 1;
    if (fade <= 0) continue;
    const parts = inLoupe ? sp.loupe : sp.page;
    if (!parts || !inView(view, pose.x, pose.y, 2.2 * sp.w)) continue;
    const cell = fromSheet(sp, sp.pageCell, pose, true);
    if (sp.camo === CAMO_CHAMELEON) {
      drawSprite(c, sp, pose, parts, P.chameleon, 0.95 * fade, false, P.glowSpot, cell);
    } else if (sp.camo === CAMO_INVISIBLE) {
      const glow = track([0, 0.5, 1], [0.7, 1, 0.7], EASE_IN_OUT, loop(now, 2400));
      drawSprite(c, sp, pose, parts, P.invisible, glow * fade, false, P.glowSpot, cell);
    } else {
      drawSprite(c, sp, pose, parts, P.ink, 0.8 * fade, false, P.glowSpot, cell);
    }
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
      inLoupe ? P.foundLoupe : P.foundPage,
      0.9 * clamp01(pose.age / FOUND_FADE_MS + 0.15),
      false,
      P.glowSpot,
      fromSheet(sp, sp.foundCell, pose, false)
    );
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
