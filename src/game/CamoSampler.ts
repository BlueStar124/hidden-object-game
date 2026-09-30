import { HiddenObject } from '../types/level';

/** Sprite width as a fraction of the spread width, before the per-object `scale`. */
export const SPRITE_BASE_WIDTH = 0.044;

export interface CamoTint {
  fill: string; // Light glaze of the surrounding paint (sprite is multiplied onto the page)
  ink: string; // Outline color taken from the darker strokes nearby
}

const SAMPLE_WIDTH = 880; // Half of the 1760px artwork is plenty for averaging colors
const pixelCache = new Map<string, Promise<ImageData | null>>();

function loadPixels(src: string): Promise<ImageData | null> {
  let pending = pixelCache.get(src);
  if (!pending) {
    pending = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const w = SAMPLE_WIDTH;
        const h = Math.round((img.naturalHeight * w) / img.naturalWidth);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, w, h);
        try {
          resolve(ctx.getImageData(0, 0, w, h));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });
    pixelCache.set(src, pending);
  }
  return pending;
}

type RGB = [number, number, number];

const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

const css = (c: RGB) => `rgb(${c.map((v) => Math.round(Math.max(0, Math.min(255, v)))).join(' ')})`;

function sampleAround(data: ImageData, obj: HiddenObject): CamoTint | null {
  const { width: w, height: h, data: px } = data;
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

/** Picks up the local paint colors under every chameleon object of a scene. */
export async function sampleCamoTints(
  sceneImage: string,
  objects: HiddenObject[]
): Promise<Record<string, CamoTint>> {
  const data = await loadPixels(sceneImage);
  const tints: Record<string, CamoTint> = {};
  if (!data) return tints;

  for (const obj of objects) {
    if (obj.camo !== 'chameleon') continue;
    const tint = sampleAround(data, obj);
    if (tint) tints[obj.id] = tint;
  }
  return tints;
}
