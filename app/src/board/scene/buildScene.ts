import { BlendMode, Skia, TileMode, type SkImage } from '@shopify/react-native-skia';
import type { HiddenObject, Page, SpriteType } from '../../core/model';
import { isCreature } from '../../content/bestiary';
import { PAGE_H, PAGE_W, PX, spriteSize } from '../constants';
import {
  CAMO_CHAMELEON,
  CAMO_INK,
  CAMO_INVISIBLE,
  type NightScene,
  type SceneData,
  type SceneMark,
  type SceneSprite,
} from '../render/types';
import type { BookRect, CamoTint } from './analyze';
import { createBoardPaints, lampShader, moonPath, type LoupePaints } from './paints';
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

/**
 * Lays a page out for the renderer, once, on the JS thread: every sprite with its drawing in each
 * camouflage variant, occluders, waterlines, the night (lamps, stars, moon) and the paper frame,
 * and the sheet of its sprites drawn at rest (scene/spriteAtlas).
 */

const boardPaints = createBoardPaints();

// Radius of the sketchbook's rounded corners in the artwork (page units)
const PAPER_CORNER = 48;

// Fixed star field in the upper part of the spread (normalized x, y, size)
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

/** Stable per-object blink offset so hidden creatures never blink in unison. */
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
    shy: obj.shy ?? null,
    shyDx: SHY_OFFSET[shyFrom]?.[0] ?? 0,
    shyDy: SHY_OFFSET[shyFrom]?.[1] ?? 0,
    jump: shyFrom === 'jump',
    roam,
    bob: !!roam?.bob,
    blinkDelay: blinkDelay(obj.id),
    page,
    loupe: spriteParts(type, camo === CAMO_INVISIBLE ? 'invisible' : hiddenVariant, tint),
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
  };
}

// What keeps moving in a found sprite
const FOUND_MOTION = [ANIM_WING, ANIM_TAIL, ANIM_WAVE, ANIM_GLOW_SPOT];

/**
 * Draws the page's sprites at rest into one sheet and hands each sprite its cells: hidden on the
 * page, and found if nothing in it moves once found (wings, tails, paws, glow spots do).
 */
function layOutAtlas(sprites: SceneSprite[], objects: HiddenObject[], density: number): SpriteAtlas | null {
  const entries: AtlasEntry[] = [];
  const index = new Map<Part[], Map<number, number>>(); // same drawing at the same size: one cell
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
      found: partsAnimate(sp.found, FOUND_MOTION) ? -1 : entryOf(sp.found, type, sp.w),
    };
  });
  // Both kinds share one texture, but only hidden cells are backed with white.
  // Bake the ink filter before drawing over white, never over the backing itself.
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

function buildNight(page: Page): NightScene {
  const r = 0.016 * PAGE_W;
  return {
    lamps: (page.nightLights ?? []).map((l, i) => ({
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
  page: Page;
  image: SkImage;
  tints: Record<string, CamoTint>;
  book: BookRect;
  loupe: LoupePaints;
  compact: boolean;
  /** Device pixels per page unit to draw the sprite sheet at (scene/spriteAtlas) */
  density: number;
  pixelRatio: number;
}

export function buildScene({ page, image, tints, book, loupe, compact, density, pixelRatio }: SceneOptions): SceneData {
  const night = !!page.isNight;
  const pageRect = Skia.XYWHRect(0, 0, PAGE_W, PAGE_H);
  const marks: SceneMark[] = page.objects.map((o) => {
    return {
      id: o.id,
      x: o.x * PAGE_W,
      y: o.y * PAGE_H,
      roam: o.roam && o.roam.path.length >= 2 ? o.roam : null,
    };
  });
  const lensR = loupe.lensR;
  const bookRect = Skia.XYWHRect(book.x * PAGE_W, book.y * PAGE_H, book.w * PAGE_W, book.h * PAGE_H);
  const painted = page.objects.filter(isPainted);
  const sprites = painted.map((o) => buildSprite(o, tints[o.id], night));
  return {
    image,
    imageRect: Skia.XYWHRect(0, 0, image.width(), image.height()),
    pageRect,
    pageRRect: Skia.RRectXY(pageRect, 4 * PX, 4 * PX),
    bookRRect: Skia.RRectXY(bookRect, 4 * PX, 4 * PX),
    paperRRect: Skia.RRectXY(bookRect, PAPER_CORNER, PAPER_CORNER),
    sprites,
    marks,
    night: night ? buildNight(page) : null,
    paints: boardPaints,
    loupe,
    lensRRect: Skia.RRectXY(Skia.XYWHRect(-lensR, -lensR, 2 * lensR, 2 * lensR), lensR, lensR),
    stampSize: compact ? 32 : 44,
    atlas: layOutAtlas(sprites, painted, density),
    pixelRatio,
  };
}
