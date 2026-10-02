import { ClipOp, Skia, type SkCanvas } from '@shopify/react-native-skia';
import { alternate, EASE_IN, EASE_IN_OUT, track } from '../anim';
import { LOUPE_ZOOM } from '../constants';
import { drawBook } from './book';
import { drawFlip } from './pageTurn';
import type { FrameState, Pose, SceneData } from './types';

/** The brass loupe (a flashlight on night pages), magnifying whatever is under it. */
export function drawLoupe(c: SkCanvas, S: SceneData, F: FrameState, poses: Pose[], flip: number) {
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
  if (F.flip) drawFlip(c, F.flip, flip);
  else drawBook(c, S, F, poses, true);
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
