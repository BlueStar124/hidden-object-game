import { Skia, type SkCanvas, type SkImage, type SkPaint, type SkRect } from '@shopify/react-native-skia';

/**
 * The brass loupe without its glass — wooden grip, ferrule, bezel and their soft shadows — drawn
 * once into an image at the screen's pixel density. Its blurred shadows are costly to draw every
 * frame, and nothing in it changes as the loupe moves.
 */

export interface LoupeBody {
  image: SkImage;
  rect: SkRect; // where it lies around the loupe's centre (screen units)
}

/** What the body is drawn from: sizes and paints of the loupe (scene/paints createLoupePaints). */
export interface LoupeBodyShapes {
  r: number;
  d: number;
  gripW: number;
  gripH: number;
  ferruleW: number;
  ferruleH: number;
  grip: SkPaint;
  gripShadow: SkPaint;
  ferrule: SkPaint;
  ferruleShadow: SkPaint;
  bezel: SkPaint;
  bezelShadowNear: SkPaint;
  bezelShadowFar: SkPaint;
  bezelHighlight: SkPaint;
}

// Blur radius of each shadow (sigma) and how far it is offset — keep in step with the paints
const BEZEL_NEAR = { dy: 12, sigma: 16 };
const BEZEL_FAR = { dy: 24, sigma: 24 };
const GRIP_SHADOW = { dx: 5, dy: 12, sigma: 12 };
const FERRULE_SHADOW = { dy: 2, sigma: 2 };

/** The grip hangs from the bezel at the lower right, turned 45°. */
function gripFrame(L: LoupeBodyShapes) {
  'worklet';
  const q = -L.r + 0.82 * L.d;
  return { q, angle: -45 };
}

/** Draws the body from its shapes (centred on the loupe). Also the renderer's fallback. */
export function drawLoupeBody(c: SkCanvas, L: LoupeBodyShapes) {
  'worklet';
  const { q, angle } = gripFrame(L);
  // Wooden grip with its brass ferrule, tucked under the bezel
  c.save();
  c.translate(q, q);
  c.rotate(angle, 0, 0);
  const grip = Skia.RRectXY(Skia.XYWHRect(-L.gripW / 2, 0, L.gripW, L.gripH), L.gripW / 2, L.gripW / 2);
  c.save();
  c.translate(GRIP_SHADOW.dx, GRIP_SHADOW.dy);
  c.drawRRect(grip, L.gripShadow);
  c.restore();
  c.drawRRect(grip, L.grip);
  const ferrule = Skia.RRectXY(Skia.XYWHRect(-L.ferruleW / 2, 0, L.ferruleW, L.ferruleH), L.ferruleH * 0.45, L.ferruleH * 0.45);
  c.save();
  c.translate(0, FERRULE_SHADOW.dy);
  c.drawRRect(ferrule, L.ferruleShadow);
  c.restore();
  c.drawRRect(ferrule, L.ferrule);
  c.restore();

  // Brass bezel
  c.drawCircle(0, BEZEL_NEAR.dy, L.r, L.bezelShadowNear);
  c.drawCircle(0, BEZEL_FAR.dy, L.r, L.bezelShadowFar);
  c.drawCircle(0, 0, L.r, L.bezel);
  c.drawCircle(0, 0, L.r - 0.75, L.bezelHighlight);
}

/** Everything the body covers, its shadows included (3 sigma of blur). */
function bodyBounds(L: LoupeBodyShapes): { l: number; t: number; r: number; b: number } {
  let l = Infinity;
  let t = Infinity;
  let r = -Infinity;
  let b = -Infinity;
  const add = (x: number, y: number) => {
    l = Math.min(l, x);
    t = Math.min(t, y);
    r = Math.max(r, x);
    b = Math.max(b, y);
  };
  const circle = (cy: number, reach: number) => {
    add(-reach, cy - reach);
    add(reach, cy + reach);
  };
  circle(0, L.r + 1);
  circle(BEZEL_NEAR.dy, L.r + 3 * BEZEL_NEAR.sigma);
  circle(BEZEL_FAR.dy, L.r + 3 * BEZEL_FAR.sigma);
  const { q, angle } = gripFrame(L);
  const a = (angle * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const rect = (x: number, y: number, w: number, h: number, pad: number) => {
    for (const [px, py] of [
      [x - pad, y - pad],
      [x + w + pad, y - pad],
      [x - pad, y + h + pad],
      [x + w + pad, y + h + pad],
    ]) {
      add(q + cos * px - sin * py, q + sin * px + cos * py);
    }
  };
  rect(-L.gripW / 2, 0, L.gripW, L.gripH, 1);
  rect(-L.gripW / 2 + GRIP_SHADOW.dx, GRIP_SHADOW.dy, L.gripW, L.gripH, 3 * GRIP_SHADOW.sigma);
  rect(-L.ferruleW / 2, FERRULE_SHADOW.dy, L.ferruleW, L.ferruleH, 3 * FERRULE_SHADOW.sigma + 1);
  return { l, t, r, b };
}

/** Draws the body at `pixelRatio` device pixels per screen unit, its corner on the pixel grid. */
export function makeLoupeBody(L: LoupeBodyShapes, pixelRatio: number): LoupeBody | null {
  const box = bodyBounds(L);
  const x = Math.floor(box.l * pixelRatio) / pixelRatio;
  const y = Math.floor(box.t * pixelRatio) / pixelRatio;
  const w = Math.ceil((box.r - x) * pixelRatio);
  const h = Math.ceil((box.b - y) * pixelRatio);
  const surface = Skia.Surface.Make(w, h);
  if (!surface) return null;
  try {
    const c = surface.getCanvas();
    c.clear(Float32Array.of(0, 0, 0, 0));
    c.scale(pixelRatio, pixelRatio);
    c.translate(-x, -y);
    drawLoupeBody(c, L);
    surface.flush();
    return { image: surface.makeImageSnapshot(), rect: Skia.XYWHRect(x, y, w / pixelRatio, h / pixelRatio) };
  } finally {
    surface.dispose();
  }
}
