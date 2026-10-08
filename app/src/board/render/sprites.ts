import { ClipOp, FilterMode, MipmapMode, type SkCanvas, type SkPaint, type SkPicture } from '@shopify/react-native-skia';
import { roamState, shyPhase } from '../../core/motion';
import { alternate, blinkScale, EASE, EASE_IN_OUT, foundBounce, lerp, loop, shyJump, shyPeek, track } from '../anim';
import { PAGE_H, PAGE_W } from '../constants';
import type { AtlasCell, SpriteAtlas } from '../scene/spriteAtlas';
import { ANIM_BLINK, ANIM_GLOW_SPOT, ANIM_TAIL, ANIM_WAVE, ANIM_WING, type Part } from '../scene/spriteParts';
import type { FoundInfo, FrameState, Pose, SceneData, SceneSprite } from './types';

/** Hidden objects and creatures: where each one is this frame (its pose), and drawing it. */

function spritePose(sp: SceneSprite, now: number, f: FoundInfo | undefined, pose: Pose) {
  'worklet';
  let x = sp.x;
  let y = sp.y;
  let flip = sp.flip;
  let op = 1;
  let dx = 0;
  let dy = 0;
  let rot = 0;
  if (f) {
    x = f.x;
    y = f.y;
    flip = f.flip;
  } else {
    if (sp.roam) {
      const r = roamState(sp.roam, now);
      x = r.x * PAGE_W;
      y = r.y * PAGE_H;
      flip = sp.flip * (r.flip ? -1 : 1);
    }
    if (sp.bob) {
      dy = lerp(-0.09, 0.09, alternate(now, 1100, EASE_IN_OUT));
    } else if (sp.shy) {
      const phase = shyPhase(sp.shy, now);
      if (sp.jump) {
        const j = shyJump(phase);
        op = j.opacity;
        dx = j.dx;
        dy = j.dy;
        rot = j.rotate;
      } else {
        const k = shyPeek(phase);
        op = k.opacity;
        dx = sp.shyDx * k.out;
        dy = sp.shyDy * k.out;
      }
    }
  }

  let bs = 1;
  let br = 0;
  let wing = 1;
  let tail = 0;
  let wave = 0;
  let glowFound = 1;
  const age = f ? now - f.t : 0;
  if (f) {
    if (age < 600) {
      const b = foundBounce(age / 600);
      bs = b.scale;
      br = b.rotate;
    }
    wing = lerp(1, 0.72, alternate(age, 900, EASE_IN_OUT));
    tail = lerp(-4, 5, alternate(age, 1600, EASE_IN_OUT));
    wave = lerp(-12, 10, alternate(age, 700, EASE_IN_OUT));
    glowFound = track([0, 0.5, 1], [1, 0.45, 1], EASE_IN_OUT, loop(age, 1800));
  }

  pose.x = x;
  pose.y = y;
  pose.flip = flip;
  pose.op = op;
  pose.dx = dx;
  pose.dy = dy;
  pose.rot = rot;
  pose.bs = bs;
  pose.br = br;
  pose.blink = blinkScale(now, -sp.blinkDelay);
  pose.wing = wing;
  pose.tail = tail;
  pose.wave = wave;
  pose.glowFound = glowFound;
  pose.glowNight = track([0, 0.35, 0.6, 1], [0.15, 1, 1, 0.15], EASE, loop(now, 2600, -sp.blinkDelay));
  pose.found = !!f;
  pose.age = age;
}

export function posesAt(S: SceneData, F: FrameState, poses = S.poses): Pose[] {
  'worklet';
  for (let i = 0; i < S.sprites.length; i++) {
    spritePose(S.sprites[i], F.now, F.found[S.sprites[i].id], poses[i]);
  }
  return poses;
}

function drawParts(c: SkCanvas, parts: Part[], pose: Pose, glowMode: boolean, spotPaint: SkPaint) {
  'worklet';
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.k === 0) {
      c.drawPicture(p.pic as SkPicture);
      continue;
    }
    const inner = p.parts as Part[];
    if (p.k === 1) {
      c.save();
      c.concat(p.m as number[]);
      drawParts(c, inner, pose, glowMode, spotPaint);
      c.restore();
      continue;
    }
    const ox = p.ox as number;
    const oy = p.oy as number;
    if (p.anim === ANIM_BLINK && pose.blink !== 1) {
      c.save();
      c.translate(ox, oy);
      c.scale(1, pose.blink);
      c.translate(-ox, -oy);
      drawParts(c, inner, pose, glowMode, spotPaint);
      c.restore();
    } else if (p.anim === ANIM_WING && pose.found) {
      c.save();
      c.translate(ox, oy);
      c.scale(pose.wing, 1);
      c.translate(-ox, -oy);
      drawParts(c, inner, pose, glowMode, spotPaint);
      c.restore();
    } else if ((p.anim === ANIM_TAIL || p.anim === ANIM_WAVE) && pose.found) {
      c.save();
      c.rotate(p.anim === ANIM_TAIL ? pose.tail : pose.wave, ox, oy);
      drawParts(c, inner, pose, glowMode, spotPaint);
      c.restore();
    } else if (p.anim === ANIM_GLOW_SPOT && (glowMode || pose.found)) {
      spotPaint.setAlphaf(glowMode ? pose.glowNight : pose.glowFound);
      c.saveLayer(spotPaint, p.bounds);
      drawParts(c, inner, pose, glowMode, spotPaint);
      c.restore();
    } else {
      drawParts(c, inner, pose, glowMode, spotPaint);
    }
  }
}

/**
 * One sprite, as a group: `layer` (camouflage blend, colour filter, shadow…) applies to the whole
 * drawing at `alpha`. From the sheet, a single image takes that paint itself; shapes
 * need a layer.
 */
export function drawSprite(
  c: SkCanvas,
  sp: SceneSprite,
  pose: Pose,
  parts: Part[],
  layer: SkPaint,
  alpha: number,
  glowMode: boolean,
  spotPaint: SkPaint,
  atlas: SpriteAtlas | null = null,
  cell: AtlasCell | null = null,
  modulate: SkPaint[] | null = null,
  baseOpacity = 1
) {
  'worklet';
  const a = alpha * pose.op;
  if (a <= 0.004 || parts.length === 0) return;
  const w = sp.w;
  c.save();
  c.translate(pose.x, pose.y);
  if (sp.rot) c.rotate(sp.rot, 0, 0);
  if (pose.flip < 0) c.scale(-1, 1);
  if (sp.water) c.clipRect(sp.box, ClipOp.Intersect, true);
  layer.setAlphaf(a);
  const cellPaint = cell && modulate
    ? modulate[Math.max(0, Math.min(128, Math.round(a / baseOpacity * 128)))]
    : layer;
  // The waterline fades the group: that still takes a layer
  const direct = atlas !== null && cell !== null && !sp.water;
  if (!direct) c.saveLayer(layer, sp.bounds);
  c.save();
  if (pose.dx !== 0 || pose.dy !== 0) c.translate(pose.dx * w, pose.dy * w);
  if (pose.rot !== 0) c.rotate(pose.rot, 0, 0);
  if (pose.bs !== 1) c.scale(pose.bs, pose.bs);
  if (pose.br !== 0) c.rotate(pose.br, 0, 0);
  const k = w / 48;
  c.scale(k, k);
  c.translate(-24, -24);
  if (atlas && cell) {
    c.drawImageRectOptions(atlas.image, cell.src, cell.dst, FilterMode.Linear, MipmapMode.None, cellPaint);
  } else {
    drawParts(c, parts, pose, glowMode, spotPaint);
  }
  c.restore();
  if (sp.water) c.drawRect(sp.box, sp.water);
  if (!direct) c.restore();
  c.restore();
}
