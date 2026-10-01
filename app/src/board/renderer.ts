import {
  ClipOp,
  FilterMode,
  MipmapMode,
  Skia,
  type SkCanvas,
  type SkFont,
  type SkImage,
  type SkPaint,
  type SkPath,
  type SkPicture,
  type SkRect,
  type SkRRect,
} from '@shopify/react-native-skia';
import type { RoamBehavior, ShyBehavior } from '@core/types/level';
import { roamState, shyPhase } from '../game/CreatureMotion';
import {
  alternate,
  BACK_OUT,
  bloom,
  blinkScale,
  ease,
  EASE,
  EASE_IN,
  EASE_IN_OUT,
  EASE_OUT,
  foundBounce,
  lerp,
  loop,
  shyJump,
  shyPeek,
  STANDARD,
  track,
} from './anim';
import { LOUPE_ZOOM, PAGE_H, PAGE_W } from './constants';
import type { BoardPaints, LoupePaints } from './paints';
import { ANIM_BLINK, ANIM_GLOW_SPOT, ANIM_TAIL, ANIM_WAVE, ANIM_WING, type Part } from './spriteParts';

/**
 * Draws one frame of the sketchbook — page, night, stamps, hint radar, page turn and the loupe —
 * as an SkPicture, on the UI thread. Layer order follows the web version (z-indices in comments).
 */

export const CAMO_INK = 0;
export const CAMO_CHAMELEON = 1;
export const CAMO_INVISIBLE = 2;

/** Colours bloom back over this long once something is found (web: 0.6–0.9s transitions). */
const FOUND_FADE_MS = 900;

export interface SceneSprite {
  id: string;
  x: number; // rest position, page units
  y: number;
  w: number; // sprite box size, page units
  rot: number; // degrees
  flip: number; // 1 | -1
  camo: number; // CAMO_*
  shy: ShyBehavior | null;
  shyDx: number; // hiding direction (fraction of the sprite box)
  shyDy: number;
  jump: boolean;
  roam: RoamBehavior | null;
  bob: boolean;
  blinkDelay: number; // ms ahead in the blink cycle
  page: Part[] | null; // hidden, on the page (null = invisible ink)
  loupe: Part[]; // hidden, through the loupe
  found: Part[];
  glow: Part[] | null; // night pages: glowing eyes above the darkness
  bounds: SkRect; // layer bounds in the sprite's frame
  box: SkRect; // the sprite box in its frame
  water: SkPaint | null; // waterline fade (dst-in)
  occluder: SkPath | null; // painting laid back over the sprite
}

export interface SceneMark {
  id: string;
  x: number; // page units
  y: number;
  roam: RoamBehavior | null;
  label: string;
  labelWidth: number;
}

export interface NightScene {
  lamps: {
    x: number;
    y: number;
    hole: number;
    glow: number;
    shader: ReturnType<typeof Skia.Shader.MakeRadialGradient>;
    delay: number;
  }[];
  stars: { x: number; y: number; r: number; delay: number }[];
  moon: SkPath;
}

export interface SceneData {
  image: SkImage;
  imageRect: SkRect;
  pageRect: SkRect;
  pageRRect: SkRRect;
  bookRRect: SkRRect; // the paper inside the artwork's transparent margin
  sprites: SceneSprite[];
  marks: SceneMark[];
  night: NightScene | null;
  paints: BoardPaints;
  loupe: LoupePaints;
  lensRRect: SkRRect;
  font: SkFont | null;
  fontSize: number;
  fontAscent: number;
  stampSize: number;
}

export interface FoundInfo {
  t: number; // when it was found (creature clock, ms)
  x: number; // where it stays (page units)
  y: number;
  flip: number;
}

export interface FrameState {
  now: number;
  width: number;
  height: number;
  s: number; // page → screen scale
  tx: number;
  ty: number;
  lx: number; // loupe centre on screen
  ly: number;
  found: Record<string, FoundInfo>;
  radar: string | null;
  fogStart: number;
  turnStart: number;
  nudge: { x: number; y: number; t: number } | null;
}

interface Pose {
  x: number;
  y: number;
  flip: number;
  op: number;
  dx: number;
  dy: number;
  rot: number;
  bs: number;
  br: number;
  blink: number;
  wing: number;
  tail: number;
  wave: number;
  glowFound: number;
  glowNight: number;
  found: boolean;
  age: number;
}

const clamp01 = (v: number) => {
  'worklet';
  return v < 0 ? 0 : v > 1 ? 1 : v;
};

function spritePose(sp: SceneSprite, now: number, f: FoundInfo | undefined): Pose {
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

  return {
    x,
    y,
    flip,
    op,
    dx,
    dy,
    rot,
    bs,
    br,
    blink: blinkScale(now, -sp.blinkDelay),
    wing,
    tail,
    wave,
    glowFound,
    glowNight: track([0, 0.35, 0.6, 1], [0.15, 1, 1, 0.15], EASE, loop(now, 2600, -sp.blinkDelay)),
    found: !!f,
    age,
  };
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

function drawSprite(
  c: SkCanvas,
  sp: SceneSprite,
  pose: Pose,
  parts: Part[],
  layer: SkPaint,
  alpha: number,
  glowMode: boolean,
  spotPaint: SkPaint
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
  c.saveLayer(layer, sp.bounds);
  c.save();
  if (pose.dx !== 0 || pose.dy !== 0) c.translate(pose.dx * w, pose.dy * w);
  if (pose.rot !== 0) c.rotate(pose.rot, 0, 0);
  if (pose.bs !== 1) c.scale(pose.bs, pose.bs);
  if (pose.br !== 0) c.rotate(pose.br, 0, 0);
  const k = w / 48;
  c.scale(k, k);
  c.translate(-24, -24);
  drawParts(c, parts, pose, glowMode, spotPaint);
  c.restore();
  if (sp.water) c.drawRect(sp.box, sp.water);
  c.restore();
  c.restore();
}

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

/** The spread itself: artwork, camouflaged sprites, occluders, night, found sprites, glowing eyes. */
function drawBook(c: SkCanvas, S: SceneData, F: FrameState, poses: Pose[], inLoupe: boolean) {
  'worklet';
  const P = S.paints;
  const now = F.now;
  drawImage(c, S, inLoupe);

  // Still hidden (z 15) — fading out for a moment once found
  for (let i = 0; i < S.sprites.length; i++) {
    const sp = S.sprites[i];
    const pose = poses[i];
    const fade = pose.found ? 1 - clamp01(pose.age / FOUND_FADE_MS) : 1;
    if (fade <= 0) continue;
    const parts = inLoupe ? sp.loupe : sp.page;
    if (!parts) continue;
    if (sp.camo === CAMO_CHAMELEON) {
      drawSprite(c, sp, pose, parts, P.chameleon, 0.95 * fade, false, P.glowSpot);
    } else if (sp.camo === CAMO_INVISIBLE) {
      const glow = track([0, 0.5, 1], [0.7, 1, 0.7], EASE_IN_OUT, loop(now, 2400));
      drawSprite(c, sp, pose, parts, P.invisible, glow * fade, false, P.glowSpot);
    } else {
      drawSprite(c, sp, pose, parts, P.ink, 0.8 * fade, false, P.glowSpot);
    }
  }

  // Scraps of painting over tucked-away sprites (z 16)
  for (let i = 0; i < S.sprites.length; i++) {
    const occ = S.sprites[i].occluder;
    if (!occ) continue;
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
      P.glowSpot
    );
  }

  // Night: only the eyes of creatures still hiding shine above the darkness (z 20)
  if (!inLoupe && S.night) {
    for (let i = 0; i < S.sprites.length; i++) {
      const sp = S.sprites[i];
      if (!sp.glow || poses[i].found) continue;
      drawSprite(c, sp, poses[i], sp.glow, P.plain, 1, true, P.glowSpot);
    }
  }
}

function markPosition(m: SceneMark, F: FrameState): { x: number; y: number } {
  'worklet';
  const f = F.found[m.id];
  if (f) return { x: f.x, y: f.y };
  if (m.roam && m.roam.path.length >= 2) {
    const r = roamState(m.roam, F.now);
    return { x: r.x * PAGE_W, y: r.y * PAGE_H };
  }
  return { x: m.x, y: m.y };
}

/** Hint tier 3: radar rings pulsing on the target (screen px, z 20). */
function drawRadar(c: SkCanvas, S: SceneData, F: FrameState) {
  'worklet';
  if (!F.radar) return;
  let mark: SceneMark | null = null;
  for (let i = 0; i < S.marks.length; i++) if (S.marks[i].id === F.radar) mark = S.marks[i];
  if (!mark) return;
  const P = S.paints;
  const pos = markPosition(mark, F);
  const x = pos.x * F.s + F.tx;
  const y = pos.y * F.s + F.ty;
  const p = ease(EASE_OUT, loop(F.now, 1400));
  P.radarRing.setAlphaf(1 - p);
  c.drawCircle(x, y, 29 * lerp(0.2, 1.8, p), P.radarRing);
  c.drawCircle(x, y, 4, P.radarGlow);
  c.drawCircle(x, y, 4, P.radarDot);
}

/** Ink stamps on everything found (screen px, z 25). */
function drawStamps(c: SkCanvas, S: SceneData, F: FrameState) {
  'worklet';
  const P = S.paints;
  const D = S.stampSize;
  const labelH = Math.round(S.fontSize * 1.3) + 2;
  const total = D + 4 + labelH;
  for (let i = 0; i < S.marks.length; i++) {
    const m = S.marks[i];
    const f = F.found[m.id];
    if (!f) continue;
    const e = ease(BACK_OUT, clamp01((F.now - f.t) / 500));
    const a = clamp01(e);
    const k = lerp(2.2, 1, e);
    c.save();
    c.translate(f.x * F.s + F.tx, f.y * F.s + F.ty);
    c.scale(k, k);
    const cy = -total / 2 + D / 2;
    P.stampGlow.setAlphaf(0.45 * a);
    c.drawCircle(0, cy, D / 2, P.stampGlow);
    P.stampFill.setAlphaf(a);
    c.save();
    c.translate(0, cy);
    c.scale(D * Math.SQRT1_2, D * Math.SQRT1_2);
    c.drawCircle(0, 0, Math.SQRT1_2, P.stampFill);
    c.restore();
    P.stampRing.setAlphaf(0.85 * a);
    c.drawCircle(0, cy, D / 2 - 1, P.stampRing);

    if (S.font) {
      const lw = m.labelWidth + 12;
      const top = -total / 2 + D + 4;
      const rect = Skia.RRectXY(Skia.XYWHRect(-lw / 2, top, lw, labelH), 4, 4);
      P.labelShadow.setAlphaf(0.1 * a);
      c.save();
      c.translate(0, 1);
      c.drawRRect(rect, P.labelShadow);
      c.restore();
      P.labelBg.setAlphaf(0.92 * a);
      c.drawRRect(rect, P.labelBg);
      P.labelText.setAlphaf(a);
      c.drawText(m.label, -m.labelWidth / 2, top + 1 + S.fontAscent, P.labelText, S.font);
    }
    c.restore();
  }
}

/** Page-turn sweep across the spread (z 50). */
function drawTurn(c: SkCanvas, S: SceneData, F: FrameState) {
  'worklet';
  if (!F.turnStart) return;
  const p = (F.now - F.turnStart) / 1200;
  if (p < 0 || p >= 1) return;
  const e = ease(STANDARD, p);
  const P = S.paints;
  c.save();
  c.translate(F.tx, F.ty);
  c.scale(F.s, F.s);
  c.clipRRect(S.pageRRect, ClipOp.Intersect, true);
  c.translate(PAGE_W / 2 + lerp(1, -1, e) * PAGE_W, PAGE_H / 2);
  c.skew(Math.tan((lerp(-15, -5, e) * Math.PI) / 180), 0);
  c.translate(-PAGE_W / 2, -PAGE_H / 2);
  P.turn.setAlphaf(lerp(0.8, 0, e));
  c.drawRect(S.pageRect, P.turn);
  c.restore();
}

/** The brass loupe (a flashlight on night pages), magnifying whatever is under it. */
function drawLoupe(c: SkCanvas, S: SceneData, F: FrameState, poses: Pose[]) {
  'worklet';
  const L = S.loupe;
  const { r, d, lensR } = L;
  const now = F.now;
  const px = (F.lx - F.tx) / F.s; // page point under the crosshair
  const py = (F.ly - F.ty) / F.s;

  c.save();
  c.translate(F.lx, F.ly);

  // Hint tier 2: the loupe tugs gently towards the target
  if (F.nudge) {
    const t = alternate(now - F.nudge.t, 800, EASE_IN_OUT);
    const vx = F.nudge.x - px;
    const vy = F.nudge.y - py;
    const len = Math.hypot(vx, vy);
    if (len > 1) c.translate((vx / len) * 6 * t, (vy / len) * 6 * t);
    const k = 1 + 0.06 * t;
    c.scale(k, k);
    L.nudgeGlow.setAlphaf(0.4 + 0.4 * t);
    c.drawCircle(0, 4 + 4 * t, r, L.nudgeGlow);
  }
  if (S.night) c.drawCircle(0, 0, r, L.nightGlow);

  // Wooden grip with its brass ferrule, tucked under the bezel
  c.save();
  c.translate(-r + 0.82 * d, -r + 0.82 * d);
  c.rotate(-45, 0, 0);
  const grip = Skia.RRectXY(Skia.XYWHRect(-L.gripW / 2, 0, L.gripW, L.gripH), L.gripW / 2, L.gripW / 2);
  c.save();
  c.translate(5, 12);
  c.drawRRect(grip, L.gripShadow);
  c.restore();
  c.drawRRect(grip, L.grip);
  const ferrule = Skia.RRectXY(Skia.XYWHRect(-L.ferruleW / 2, 0, L.ferruleW, L.ferruleH), L.ferruleH * 0.45, L.ferruleH * 0.45);
  c.save();
  c.translate(0, 2);
  c.drawRRect(ferrule, L.ferruleShadow);
  c.restore();
  c.drawRRect(ferrule, L.ferrule);
  c.restore();

  // Brass bezel
  c.drawCircle(0, 12, r, L.bezelShadowNear);
  c.drawCircle(0, 24, r, L.bezelShadowFar);
  c.drawCircle(0, 0, r, L.bezel);
  c.drawCircle(0, 0, r - 0.75, L.bezelHighlight);

  // Glass lens with the magnified page
  c.save();
  c.clipRRect(S.lensRRect, ClipOp.Intersect, true);
  c.drawCircle(0, 0, lensR, L.lensBg);
  const fogAge = F.fogStart ? now - F.fogStart : -1;
  const fogged = fogAge >= 0 && fogAge < 3000;
  if (fogged) c.saveLayer(L.fogLayer, Skia.XYWHRect(-lensR, -lensR, 2 * lensR, 2 * lensR));
  c.save();
  const z = LOUPE_ZOOM * F.s;
  c.scale(z, z);
  c.translate(-px, -py);
  c.clipRect(S.pageRect, ClipOp.Intersect, true);
  drawBook(c, S, F, poses, true);
  c.restore();
  if (fogged) c.restore();

  if (S.night) c.drawCircle(0, 0, lensR, L.vignette);
  if (fogged) {
    const a = track([0, 0.7, 1], [1, 0.85, 0], EASE_IN, fogAge / 3000);
    L.fogBase.setAlphaf(0.55 * a);
    c.drawCircle(0, 0, lensR, L.fogBase);
    L.fogPuffA.setAlphaf(a);
    c.drawCircle(0, 0, lensR, L.fogPuffA);
    L.fogPuffB.setAlphaf(a);
    c.drawCircle(0, 0, lensR, L.fogPuffB);
  }
  c.drawCircle(0, 0, lensR, L.specular);
  c.drawRect(Skia.XYWHRect(-1, -5, 2, 10), L.crosshair);
  c.drawRect(Skia.XYWHRect(-5, -1, 10, 2), L.crosshair);
  c.restore();

  c.restore();
}

export function renderFrame(S: SceneData, F: FrameState): SkPicture {
  'worklet';
  const recorder = Skia.PictureRecorder();
  const c = recorder.beginRecording(Skia.XYWHRect(0, 0, F.width, F.height));
  const P = S.paints;

  const poses: Pose[] = [];
  for (let i = 0; i < S.sprites.length; i++) {
    poses.push(spritePose(S.sprites[i], F.now, F.found[S.sprites[i].id]));
  }

  // The book on the desk: soft shadows under the paper
  c.save();
  c.translate(F.tx, F.ty);
  c.scale(F.s, F.s);
  const book = S.bookRRect.rect;
  c.drawOval(
    Skia.XYWHRect(book.x + 0.04 * book.width, book.y + 0.25 * book.height, 0.92 * book.width, 0.8 * book.height),
    P.castAmbient
  );
  c.drawOval(
    Skia.XYWHRect(book.x + 0.08 * book.width, book.y + 0.6 * book.height, 0.84 * book.width, 0.45 * book.height),
    P.castContact
  );
  c.save();
  c.translate(0, (S.night ? 6 : 4) * (PAGE_W / 960));
  c.drawRRect(S.bookRRect, S.night ? P.bookShadowNight : P.bookShadow);
  c.restore();
  c.clipRRect(S.pageRRect, ClipOp.Intersect, true);
  drawBook(c, S, F, poses, false);
  c.restore();

  // Screen-space marks, clipped to the book
  c.save();
  c.clipRect(Skia.XYWHRect(F.tx, F.ty, PAGE_W * F.s, PAGE_H * F.s), ClipOp.Intersect, true);
  drawRadar(c, S, F);
  drawStamps(c, S, F);
  c.restore();

  drawTurn(c, S, F);
  drawLoupe(c, S, F, poses);

  return recorder.finishRecordingAsPicture();
}
