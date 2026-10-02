/**
 * Reads a painting's pixels once (see platform/sceneImage) to find:
 * - the chameleon tints: the paint colours around each chameleon object, so it can be repainted
 *   in them;
 * - the book: the artwork is a photo of the open sketchbook on a transparent margin, and the
 *   camera frames the paper rather than the whole image.
 */
import { SPRITE_BASE_WIDTH, type HiddenObject } from '../../core/model';
import type { ScenePixels } from '../../platform/sceneImage';

/** The colours a chameleon object is repainted in. */
export interface CamoTint {
  fill: string; // Light glaze of the surrounding paint (sprite is multiplied onto the page)
  ink: string; // Outline colour taken from the darker strokes nearby
}

/** Normalized (0–1) rectangle of the visible sketchbook within the spread image. */
export interface BookRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SceneAnalysis {
  tints: Record<string, CamoTint>;
  book: BookRect;
}

export const SAMPLE_WIDTH = 880; // Half of the 1760px artwork is plenty for averaging colours

type RGB = [number, number, number];

const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

const css = (c: RGB) => `rgb(${c.map((v) => Math.round(Math.max(0, Math.min(255, v)))).join(', ')})`;

// The paint colours under a chameleon object: a light glaze of the average, outlines from the darker strokes
function sampleAround({ width: w, height: h, data: px }: ScenePixels, obj: HiddenObject): CamoTint | null {
  const cx = obj.x * w;
  const cy = obj.y * h;
  const r = Math.max(3, (SPRITE_BASE_WIDTH * (obj.scale ?? 1) * w) / 2);

  const samples: { c: RGB; lum: number }[] = [];
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) continue;
      const i = (y * w + x) * 4;
      if (px[i + 3] < 200) continue; // Skip the transparent margin around the book
      const c: RGB = [px[i], px[i + 1], px[i + 2]];
      samples.push({ c, lum: 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2] });
    }
  }
  if (samples.length === 0) return null;

  const average = (list: typeof samples): RGB => {
    const sum: RGB = [0, 0, 0];
    for (const s of list) {
      sum[0] += s.c[0];
      sum[1] += s.c[1];
      sum[2] += s.c[2];
    }
    return [sum[0] / list.length, sum[1] / list.length, sum[2] / list.length];
  };

  const avg = average(samples);
  samples.sort((a, b) => a.lum - b.lum);
  // The darker third of the patch ≈ the local brush strokes; blend it with the average
  // so outlines read like the painting's own texture instead of fresh black ink.
  const dark = average(samples.slice(0, Math.max(1, Math.floor(samples.length * 0.3))));

  return {
    fill: css(mix(avg, [255, 255, 255], 0.5)),
    ink: css(mix(dark, avg, 0.4)),
  };
}

/** Bounding box of the opaque pixels — the paper of the sketchbook. */
function bookBounds({ width: w, height: h, data: px }: ScenePixels): BookRect {
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (px[(y * w + x) * 4 + 3] < 128) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (x1 < x0 || y1 < y0) return FULL_SPREAD;
  return { x: x0 / w, y: y0 / h, w: (x1 + 1 - x0) / w, h: (y1 + 1 - y0) / h };
}

export const FULL_SPREAD: BookRect = { x: 0, y: 0, w: 1, h: 1 };

export function analyzeScene(pixels: ScenePixels | null, objects: HiddenObject[]): SceneAnalysis {
  if (!pixels) return { tints: {}, book: FULL_SPREAD };
  const tints: Record<string, CamoTint> = {};
  for (const obj of objects) {
    if (obj.camo !== 'chameleon') continue;
    const tint = sampleAround(pixels, obj);
    if (tint) tints[obj.id] = tint;
  }
  return { tints, book: bookBounds(pixels) };
}
