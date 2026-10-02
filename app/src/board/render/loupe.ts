import { ClipOp, FilterMode, MipmapMode, Skia, type SkCanvas, type SkPicture } from '@shopify/react-native-skia';
import { alternate, EASE_IN, EASE_IN_OUT, track } from '../anim';
import { LOUPE_ZOOM } from '../constants';
import { drawLoupeBody } from '../scene/loupeBody';
import { drawBook } from './book';
import type { FrameState, Pose, SceneData } from './types';

/** The brass loupe (a flashlight on night pages), magnifying whatever is under it. */
export function drawLoupe(c: SkCanvas, S: SceneData, F: FrameState, poses: Pose[], leaf: SkPicture | null) {
  'worklet';
  const L = S.loupe;
  const { r, lensR } = L;
  const now = F.now;
  const px = (F.lx - F.tx) / F.s; // page point under the crosshair
  const py = (F.ly - F.ty) / F.s;

  c.save();
  c.translate(F.lx, F.ly);

  // Hint tier 2: the loupe tugs gently towards the target
  let still = true;
  if (F.nudge) {
    still = false;
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

  if (L.body) {
    // Grip, bezel and shadows drawn once; laid on whole device pixels unless it is being tugged
    const body = L.body;
    const pr = S.pixelRatio;
    const ox = still ? Math.round(F.lx * pr) / pr - F.lx : 0;
    const oy = still ? Math.round(F.ly * pr) / pr - F.ly : 0;
    const src = Skia.XYWHRect(0, 0, body.image.width(), body.image.height());
    const dst = Skia.XYWHRect(body.rect.x + ox, body.rect.y + oy, body.rect.width, body.rect.height);
    c.drawImageRectOptions(body.image, src, dst, FilterMode.Linear, MipmapMode.None, L.bodyPaint);
  } else {
    drawLoupeBody(c, L);
  }

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
  const seen = lensR / z; // page units
  if (leaf) c.drawPicture(leaf);
  else drawBook(c, S, F, poses, true, { x0: px - seen, y0: py - seen, x1: px + seen, y1: py + seen });
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
