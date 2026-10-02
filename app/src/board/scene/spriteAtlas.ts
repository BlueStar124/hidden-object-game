import { ClipOp, Skia, type SkColorFilter, type SkImage, type SkImageFilter, type SkRect } from '@shopify/react-native-skia';
import { drawPartsAtRest, type Part } from './spriteParts';

/**
 * Sprites of a page drawn once, at rest, into a sheet. Paths are what a frame spends most of its
 * time on: while a sprite is still and seen at most a little larger than it was drawn here, the
 * renderer draws its cell from the sheet — one textured quad — instead of its shapes.
 *
 * CanvasKit's Multiply path can copy the destination for each camouflaged sprite. These cells
 * are drawn over white instead, letting Modulate scale the painting's colours without that copy
 * (see render/book). Revealed sprites share the sheet, with transparent backgrounds.
 */

export interface AtlasCell {
  src: SkRect; // pixels in the sheet
  dst: SkRect; // the same, in the sprite's view box
}

export interface Sheet {
  image: SkImage;
  /** Device pixels per page unit it was drawn at */
  density: number;
}

export type SpriteAtlas = Sheet;

export interface AtlasEntry {
  parts: Part[];
  bounds: SkRect; // view box
  w: number; // sprite box size, page units
  /** Applied to the sprite as a whole: a colour filter, or a shadow beyond `bounds` */
  filter?: SkColorFilter | null;
  shadow?: { dy: number; sigma: number; color: string } | null; // view-box units
  background?: 'white'; // hidden cells: white leaves the painting unchanged under Modulate
}

// Room between cells, so filtering never picks up a neighbour
const PAD = 4;
const MAX_SIDE = 2048;

/** Device pixels per page unit to draw sprites at: what the fitted page needs, with room to zoom in a little. */
export function atlasDensity(fit: number, pixelRatio: number): number {
  const d = Math.min(4, Math.max(0.5, 1.5 * fit * pixelRatio));
  return Math.round(d * 4) / 4; // steps, so small layout changes keep the sheet
}

/** What a cell covers, its shadow included (view box). */
function cellBounds(e: AtlasEntry): SkRect {
  const b = e.bounds;
  if (!e.shadow) return b;
  const reach = 3 * e.shadow.sigma;
  return Skia.XYWHRect(b.x - reach, b.y - reach, b.width + 2 * reach, b.height + 2 * reach + Math.max(0, e.shadow.dy));
}

/**
 * Packs the entries in rows and draws them over `background` (transparent or white). Returns a
 * cell per entry (same order), or null when nothing could be drawn (the renderer then draws shapes).
 */
export function buildSheet(
  entries: AtlasEntry[],
  density: number,
  background: 'transparent' | 'white'
): { sheet: Sheet | null; cells: AtlasCell[] } {
  if (entries.length === 0) return { sheet: null, cells: [] };
  const boxes = entries.map(cellBounds);
  let d = density;
  for (let attempt = 0; attempt < 4; attempt++) {
    const sizes = entries.map((e, i) => {
      const k = (e.w / 48) * d; // sheet pixels per view-box unit
      return { k, w: Math.ceil(boxes[i].width * k), h: Math.ceil(boxes[i].height * k) };
    });
    // Shelf packing, tallest first
    const order = sizes.map((_, i) => i).sort((a, b) => sizes[b].h - sizes[a].h);
    const at: { x: number; y: number }[] = [];
    let x = 0;
    let y = 0;
    let row = 0;
    let width = 0;
    for (const i of order) {
      const cw = sizes[i].w + 2 * PAD;
      if (x > 0 && x + cw > MAX_SIDE) {
        y += row;
        x = 0;
        row = 0;
      }
      at[i] = { x: x + PAD, y: y + PAD };
      x += cw;
      width = Math.max(width, x);
      row = Math.max(row, sizes[i].h + 2 * PAD);
    }
    const height = y + row;
    if (height > MAX_SIDE || width > MAX_SIDE) {
      d *= 0.8 * Math.sqrt(MAX_SIDE / Math.max(height, width));
      continue;
    }

    const surface = Skia.Surface.Make(width, height);
    if (!surface) return { sheet: null, cells: [] };
    const canvas = surface.getCanvas();
    canvas.clear(Skia.Color(background));
    const white = Skia.Paint();
    white.setColor(Skia.Color('white'));
    const cells = entries.map((e, i) => {
      const { k, w, h } = sizes[i];
      const { x: cx, y: cy } = at[i];
      const box = boxes[i];
      // Include the gutter: linear sampling along the opaque cell's edge must see white.
      if (e.background === 'white') canvas.drawRect(Skia.XYWHRect(cx - PAD, cy - PAD, w + 2 * PAD, h + 2 * PAD), white);
      canvas.save();
      canvas.clipRect(Skia.XYWHRect(cx, cy, w, h), ClipOp.Intersect, false);
      canvas.translate(cx, cy);
      canvas.scale(k, k);
      canvas.translate(-box.x, -box.y);
      const group = groupPaint(e);
      if (group) canvas.saveLayer(group);
      drawPartsAtRest(canvas, e.parts);
      if (group) canvas.restore();
      canvas.restore();
      return { src: Skia.XYWHRect(cx, cy, w, h), dst: Skia.XYWHRect(box.x, box.y, w / k, h / k) };
    });
    surface.flush();
    const image = surface.makeImageSnapshot();
    surface.dispose();
    return { sheet: { image, density: d }, cells };
  }
  return { sheet: null, cells: [] };
}

function groupPaint(e: AtlasEntry) {
  if (!e.filter && !e.shadow) return null;
  const p = Skia.Paint();
  if (e.filter) p.setColorFilter(e.filter);
  if (e.shadow) {
    const { dy, sigma, color } = e.shadow;
    const shadow: SkImageFilter = Skia.ImageFilter.MakeDropShadow(0, dy, sigma, sigma, Skia.Color(color), null);
    p.setImageFilter(shadow);
  }
  return p;
}
