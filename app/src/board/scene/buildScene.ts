import { Skia, type SkImage } from '@shopify/react-native-skia';
import type { Page } from '../../core/model';
import { PAGE_H, PAGE_W, PX } from '../constants';
import {
  CAMO_INVISIBLE,
  LENS_PRISM,
  type SceneData,
  type SceneMark,
} from '../render/types';
import type { BookRect, CamoTint } from './analyze';
import type { LoupePaints } from './paints';
import { boardPaints, buildSprite, isPainted, layOutAtlas } from './sceneSprites';
import { buildNight, revealBlobs, veilAround } from './sceneEnvironment';

/**
 * Lays a page out for the renderer, once, on the JS thread: every sprite with its drawing in each
 * camouflage variant, occluders, waterlines, the night (lamps, stars, moon) and the paper frame,
 * and the sheet of its sprites drawn at rest (scene/spriteAtlas).
 */

// Radius of the sketchbook's rounded corners in the artwork (page units)
const PAPER_CORNER = 48;

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
      reveal: revealBlobs(o),
    };
  });
  const lensR = loupe.lensR;
  const bookRect = Skia.XYWHRect(book.x * PAGE_W, book.y * PAGE_H, book.w * PAGE_W, book.h * PAGE_H);
  const focus = page.focus ? Skia.XYWHRect(page.focus.x * PAGE_W, page.focus.y * PAGE_H, page.focus.w * PAGE_W, page.focus.h * PAGE_H) : null;
  const painted = page.objects.filter(isPainted);
  const sprites = painted.map((o) => buildSprite(o, tints[o.id], night));
  return {
    image,
    imageRect: Skia.XYWHRect(0, 0, image.width(), image.height()),
    pageRect,
    pageRRect: Skia.RRectXY(pageRect, 4 * PX, 4 * PX),
    bookRRect: Skia.RRectXY(bookRect, 4 * PX, 4 * PX),
    focus,
    focusVeil: focus ? veilAround(focus) : [],
    paperRRect: Skia.RRectXY(bookRect, PAPER_CORNER, PAPER_CORNER),
    sprites,
    poses: sprites.map((sp) => ({
      x: sp.x, y: sp.y, flip: sp.flip, op: 1, dx: 0, dy: 0, rot: 0, bs: 1, br: 0,
      blink: 1, wing: 1, tail: 0, wave: 0, glowFound: 1, glowNight: 1, found: false, age: 0,
    })),
    marks,
    night: night ? buildNight(page) : null,
    paints: boardPaints,
    loupe,
    lensRRect: Skia.RRectXY(Skia.XYWHRect(-lensR, -lensR, 2 * lensR, 2 * lensR), lensR, lensR),
    stampSize: compact ? 32 : 44,
    atlas: layOutAtlas(sprites, painted, density),
    pixelRatio,
    prism: sprites.some((sp) => sp.camo === CAMO_INVISIBLE && sp.lens === LENS_PRISM),
  };
}
