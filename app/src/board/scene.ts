import { BlendMode, Skia, TileMode, type SkFont, type SkImage } from '@shopify/react-native-skia';
import type { HiddenObject, LevelData } from '@core/types/level';
import { isCreature } from '@core/data/bestiary';
import type { BookRect, CamoTint } from '../game/sceneAnalysis';
import { PAGE_H, PAGE_W, PX, spriteSize } from './constants';
import { createBoardPaints, lampShader, moonPath, type LoupePaints } from './paints';
import {
  CAMO_CHAMELEON,
  CAMO_INK,
  CAMO_INVISIBLE,
  type NightScene,
  type SceneData,
  type SceneMark,
  type SceneSprite,
} from './renderer';
import { spriteParts } from './spriteParts';

const boardPaints = createBoardPaints();

// Fixed star field in the upper part of the spread (normalized x, y, size) — as in NightSky.tsx
const STARS: [number, number, number][] = [
  [0.06, 0.08, 1.2],
  [0.13, 0.16, 0.8],
  [0.21, 0.06, 1],
  [0.29, 0.13, 0.7],
  [0.36, 0.05, 1.3],
  [0.44, 0.11, 0.8],
  [0.57, 0.07, 1.1],
  [0.63, 0.15, 0.7],
  [0.71, 0.05, 0.9],
  [0.78, 0.12, 1.2],
  [0.86, 0.07, 0.8],
  [0.93, 0.14, 1],
  [0.1, 0.25, 0.7],
  [0.52, 0.2, 0.9],
  [0.9, 0.24, 0.7],
];

const SHY_OFFSET: Record<string, [number, number]> = {
  below: [0, 0.55],
  above: [0, -0.55],
  left: [-0.55, 0],
  right: [0.55, 0],
};

/** Stable per-object blink offset so hidden creatures never blink in unison (as on the web). */
function blinkDelay(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(hash) % 4600;
}

const isPainted = (o: HiddenObject) => !!o.spriteType && o.spriteType !== 'seal';

function waterPaint(w: number, waterline: number) {
  const p = Skia.Paint();
  p.setBlendMode(BlendMode.DstIn);
  p.setShader(
    Skia.Shader.MakeLinearGradient(
      { x: 0, y: -w / 2 },
      { x: 0, y: w / 2 },
      [Skia.Color('#000'), Skia.Color('#000'), Skia.Color('rgba(0, 0, 0, 0)')],
      [0, Math.min(1, waterline), Math.min(1, waterline + 0.14)],
      TileMode.Clamp
    )
  );
  return p;
}

function buildSprite(obj: HiddenObject, tint: CamoTint | undefined, night: boolean): SceneSprite {
  const type = obj.spriteType!;
  const w = spriteSize(obj.scale);
  const camo = obj.camo === 'chameleon' ? CAMO_CHAMELEON : obj.camo === 'invisible' ? CAMO_INVISIBLE : CAMO_INK;
  const hiddenVariant = camo === CAMO_CHAMELEON ? 'chameleon' : 'base';
  const shyFrom = obj.shy?.from ?? 'below';
  const roam = obj.roam && obj.roam.path.length >= 2 ? obj.roam : null;
  const glows = night && isCreature(type) && obj.glow !== false && camo !== CAMO_INVISIBLE;

  let occluder = null;
  if (obj.occluder && obj.occluder.length >= 3) {
    const shape = Skia.PathBuilder.Make();
    obj.occluder.forEach(([x, y], i) => (i ? shape.lineTo(x * PAGE_W, y * PAGE_H) : shape.moveTo(x * PAGE_W, y * PAGE_H)));
    occluder = shape.close().build();
  }

  return {
    id: obj.id,
    x: obj.x * PAGE_W,
    y: obj.y * PAGE_H,
    w,
    rot: obj.rotation ?? 0,
    flip: obj.flip ? -1 : 1,
    camo,
    shy: obj.shy ?? null,
    shyDx: SHY_OFFSET[shyFrom]?.[0] ?? 0,
    shyDy: SHY_OFFSET[shyFrom]?.[1] ?? 0,
    jump: shyFrom === 'jump',
    roam,
    bob: !!roam?.bob,
    blinkDelay: blinkDelay(obj.id),
    page: camo === CAMO_INVISIBLE ? null : spriteParts(type, hiddenVariant, tint),
    loupe: spriteParts(type, camo === CAMO_INVISIBLE ? 'invisible' : hiddenVariant, tint),
    found: spriteParts(type, 'base'),
    glow: glows ? spriteParts(type, camo === CAMO_CHAMELEON ? 'glowChameleon' : 'glow', tint) : null,
    bounds: Skia.XYWHRect(-1.4 * w, -1.4 * w, 2.8 * w, 2.8 * w),
    box: Skia.XYWHRect(-w / 2, -w / 2, w, w),
    water: obj.waterline !== undefined ? waterPaint(w, obj.waterline) : null,
    occluder,
  };
}

function buildNight(level: LevelData): NightScene {
  const r = 0.016 * PAGE_W;
  return {
    lamps: (level.nightLights ?? []).map((l, i) => ({
      x: l.x * PAGE_W,
      y: l.y * PAGE_H,
      hole: l.r * PAGE_W * 1.15,
      glow: l.r * PAGE_W,
      shader: lampShader(l.color),
      delay: ((i * 0.53) % 4) * 1000,
    })),
    stars: STARS.map(([x, y, s], i) => ({ x: x * PAGE_W, y: y * PAGE_H, r: 1.5 * s * PX, delay: ((i * 0.37) % 3) * 1000 })),
    moon: moonPath(0.07 * PAGE_W + r, 0.07 * PAGE_H + r, r),
  };
}

export interface SceneOptions {
  level: LevelData;
  image: SkImage;
  tints: Record<string, CamoTint>;
  book: BookRect;
  loupe: LoupePaints;
  font: SkFont | null;
  compact: boolean;
}

export function buildScene({ level, image, tints, book, loupe, font, compact }: SceneOptions): SceneData {
  const night = !!level.isNight;
  const pageRect = Skia.XYWHRect(0, 0, PAGE_W, PAGE_H);
  const marks: SceneMark[] = level.objects.map((o) => {
    const label = o.name.normalize('NFC');
    return {
      id: o.id,
      x: o.x * PAGE_W,
      y: o.y * PAGE_H,
      roam: o.roam && o.roam.path.length >= 2 ? o.roam : null,
      label,
      labelWidth: font ? font.getTextWidth(label) : 0,
    };
  });
  const lensR = loupe.lensR;
  return {
    image,
    imageRect: Skia.XYWHRect(0, 0, image.width(), image.height()),
    pageRect,
    pageRRect: Skia.RRectXY(pageRect, 4 * PX, 4 * PX),
    bookRRect: Skia.RRectXY(Skia.XYWHRect(book.x * PAGE_W, book.y * PAGE_H, book.w * PAGE_W, book.h * PAGE_H), 4 * PX, 4 * PX),
    sprites: level.objects.filter(isPainted).map((o) => buildSprite(o, tints[o.id], night)),
    marks,
    night: night ? buildNight(level) : null,
    paints: boardPaints,
    loupe,
    lensRRect: Skia.RRectXY(Skia.XYWHRect(-lensR, -lensR, 2 * lensR, 2 * lensR), lensR, lensR),
    font,
    fontSize: compact ? 11 : 13,
    fontAscent: font ? -font.getMetrics().ascent : 0,
    stampSize: compact ? 32 : 44,
  };
}
