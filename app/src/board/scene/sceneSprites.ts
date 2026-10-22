import { BlendMode, Skia, TileMode } from '@shopify/react-native-skia';
import type { HiddenObject, SpriteType } from '../../core/model';
import { isCreature, STARTLE } from '../../content/bestiary';
import { STARTLE_FLUTTER, STARTLE_HOP, STARTLE_NONE, STARTLE_SCURRY, STARTLE_SPLASH } from '../anim';
import { PAGE_H, PAGE_W, spriteSize } from '../constants';
import {
  CAMO_CHAMELEON,
  CAMO_INK,
  CAMO_INVISIBLE,
  LENS_PLAIN,
  LENS_PRISM,
  LENS_TINY,
  type SceneSprite,
} from '../render/types';
import type { CamoTint } from './analyze';
import { createBoardPaints } from './paints';
import { buildSheet, type AtlasEntry, type SpriteAtlas } from './spriteAtlas';
import {
  ANIM_BLINK,
  ANIM_GLOW_SPOT,
  ANIM_TAIL,
  ANIM_WAVE,
  ANIM_WING,
  partsAnimate,
  spriteBounds,
  spriteParts,
  type Part,
} from './spriteParts';

export const isPainted = (o: HiddenObject) => !o.spriteType || o.spriteType !== 'seal';

export const boardPaints = createBoardPaints();

export const SHY_OFFSET: Record<string, [number, number]> = {
  below: [0, 0.55],
  above: [0, -0.55],
  left: [-0.55, 0],
  right: [0.55, 0],
};

export const STARTLE_KIND = {
  none: STARTLE_NONE,
  hop: STARTLE_HOP,
  scurry: STARTLE_SCURRY,
  splash: STARTLE_SPLASH,
  flutter: STARTLE_FLUTTER,
};

export const FOUND_MOTION = [ANIM_WING, ANIM_TAIL, ANIM_WAVE, ANIM_GLOW_SPOT];

/** Stable per-object blink offset so hidden creatures never blink in unison. */
export function blinkDelay(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(hash) % 4600;
}

export function waterPaint(w: number, waterline: number) {
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

/** The way a thing went between the day and the night: a gentle arc from where it was to where it is. */
export function dayTrail(from: { x: number; y: number }, to: { x: number; y: number }) {
  const ax = from.x * PAGE_W;
  const ay = from.y * PAGE_H;
  const bx = to.x * PAGE_W;
  const by = to.y * PAGE_H;
  const bow = 0.2;
  const cx = (ax + bx) / 2 - (by - ay) * bow;
  const cy = (ay + by) / 2 + (bx - ax) * bow;
  return Skia.PathBuilder.Make().moveTo(ax, ay).quadTo(cx, cy, bx, by).build();
}

export function buildSprite(obj: HiddenObject, tint: CamoTint | undefined, night: boolean): SceneSprite {
  const type = obj.spriteType!;
  const w = spriteSize(obj.scale);
  const camo = obj.camo === 'chameleon' ? CAMO_CHAMELEON : obj.camo === 'invisible' ? CAMO_INVISIBLE : CAMO_INK;
  const lens = obj.requires === 'prism' ? LENS_PRISM : obj.requires === 'twin-lens' ? LENS_TINY : LENS_PLAIN;
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

  const page = camo === CAMO_INVISIBLE ? null : spriteParts(type, hiddenVariant, tint);
  const found = spriteParts(type, 'base');
  return {
    id: obj.id,
    x: obj.x * PAGE_W,
    y: obj.y * PAGE_H,
    w,
    rot: obj.rotation ?? 0,
    flip: obj.flip ? -1 : 1,
    camo,
    lens,
    shy: obj.shy ?? null,
    shyDx: SHY_OFFSET[shyFrom]?.[0] ?? 0,
    shyDy: SHY_OFFSET[shyFrom]?.[1] ?? 0,
    jump: shyFrom === 'jump',
    roam,
    bob: !!roam?.bob,
    blinkDelay: blinkDelay(obj.id),
    page,
    loupe: spriteParts(type, camo === CAMO_INVISIBLE ? (lens === LENS_PLAIN ? 'invisible' : 'base') : hiddenVariant, tint),
    found,
    glow: glows ? spriteParts(type, camo === CAMO_CHAMELEON ? 'glowChameleon' : 'glow', tint) : null,
    bounds: Skia.XYWHRect(-1.4 * w, -1.4 * w, 2.8 * w, 2.8 * w),
    box: Skia.XYWHRect(-w / 2, -w / 2, w, w),
    water: obj.waterline !== undefined ? waterPaint(w, obj.waterline) : null,
    occluder,
    occluderBounds: occluder ? occluder.computeTightBounds() : null,
    pageCell: null,
    foundCell: null,
    blinks: partsAnimate(found, [ANIM_BLINK]),
    gold: !!obj.rare,
    dayTrail: obj.dayAt ? dayTrail(obj.dayAt, obj) : null,
    dayX: (obj.dayAt?.x ?? 0) * PAGE_W,
    dayY: (obj.dayAt?.y ?? 0) * PAGE_H,
    startle: STARTLE_KIND[STARTLE[type] ?? 'none'],
  };
}

export function layOutAtlas(sprites: SceneSprite[], objects: HiddenObject[], density: number): SpriteAtlas | null {
  const entries: AtlasEntry[] = [];
  const index = new Map<Part[], Map<number, number>>();
  const entryOf = (parts: Part[], type: SpriteType, w: number) => {
    let bySize = index.get(parts);
    if (!bySize) index.set(parts, (bySize = new Map()));
    let i = bySize.get(w);
    if (i === undefined) {
      i = entries.push({ parts, bounds: spriteBounds(type), w }) - 1;
      bySize.set(w, i);
    }
    return i;
  };
  const types = new Map(objects.map((o) => [o.id, o.spriteType!]));
  const wanted = sprites.map((sp) => {
    const type = types.get(sp.id)!;
    return {
      page: sp.page && sp.page.length ? entryOf(sp.page, type, sp.w) : -1,
      found: sp.gold || partsAnimate(sp.found, FOUND_MOTION) ? -1 : entryOf(sp.found, type, sp.w),
    };
  });
  const hiddenEntries: AtlasEntry[] = [];
  const hiddenWanted = sprites.map((sp, i) => {
    if (wanted[i].page < 0 || sp.water) return -1;
    return hiddenEntries.push({
      ...entries[wanted[i].page],
      filter: sp.camo === CAMO_INK ? boardPaints.inkFilter : null,
      background: 'white',
    }) - 1;
  });
  const foundEntries: AtlasEntry[] = [];
  const foundWanted = sprites.map((sp, i) => wanted[i].found < 0
    ? -1 : foundEntries.push(entries[wanted[i].found]) - 1);
  const { sheet, cells } = buildSheet([...hiddenEntries, ...foundEntries], density, 'transparent');
  if (!sheet) return null;
  sprites.forEach((sp, i) => {
    sp.pageCell = hiddenWanted[i] >= 0 ? cells[hiddenWanted[i]] : null;
    sp.foundCell = foundWanted[i] >= 0 ? cells[hiddenEntries.length + foundWanted[i]] : null;
  });
  return sheet;
}

