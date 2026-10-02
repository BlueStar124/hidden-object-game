import { ClipOp, FilterMode, MipmapMode, Skia, type SkCanvas, type SkPicture } from '@shopify/react-native-skia';
import { PAGE_H, PAGE_W } from '../constants';
import { drawBook } from './book';
import { drawLoupe } from './loupe';
import { drawRadar, drawStamps } from './marks';
import { drawFlip, flipProgress } from './pageTurn';
import { posesAt } from './sprites';
import type { FrameState, Pose, SceneData } from './types';

/**
 * Draws one frame of the sketchbook — page, night, stamps, hint radar, page turn and the loupe —
 * as an SkPicture, on the UI thread. Layer order keeps the z-indices of the original web version
 * (noted in comments).
 */

function drawFrame(c: SkCanvas, live: SceneData, F: FrameState) {
  'worklet';
  const camera = F.flip?.camera;
  if (camera) {
    const p = flipProgress(F);
    const t = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    F = {
      ...F,
      tx: camera.fromX + (camera.toX - camera.fromX) * t,
      ty: camera.fromY + (camera.toY - camera.fromY) * t,
    };
  }
  // While a page turns, both pages come from the turn and the frame is the page being opened
  const S = F.flip ? F.flip.S : live;
  const P = S.paints;
  const flip = flipProgress(F);
  // Calculate the bent leaf once. The board and the loupe replay the same geometry.
  let leaf: SkPicture | null = null;
  if (F.flip) {
    const recorder = Skia.PictureRecorder();
    drawFlip(recorder.beginRecording(S.pageRect), F.flip, flip);
    leaf = recorder.finishRecordingAsPicture();
    recorder.dispose();
  }
  const poses: Pose[] = F.flip ? [] : posesAt(S, F);

  // Artwork of the pages likely to come next, one invisible pixel each: it stays decoded on the
  // GPU, so turning to it never stalls a frame on the upload
  for (let i = 0; i < F.warm.length; i++) {
    const img = F.warm[i];
    c.drawImageRectOptions(
      img,
      Skia.XYWHRect(0, 0, img.width(), img.height()),
      Skia.XYWHRect(0, 0, 1, 1),
      FilterMode.Linear,
      MipmapMode.Linear,
      P.warm
    );
  }

  // The book on the desk: soft shadows under the paper
  c.save();
  c.translate(F.tx, F.ty);
  c.scale(F.s, F.s);
  const book = S.bookRRect.rect;
  c.drawOval(
    Skia.XYWHRect(book.x + 0.04 * book.width, book.y + 0.25 * book.height, 0.92 * book.width, 0.8 * book.height),
    P.castAmbient
  );
  c.drawOval(
    Skia.XYWHRect(book.x + 0.08 * book.width, book.y + 0.6 * book.height, 0.84 * book.width, 0.45 * book.height),
    P.castContact
  );
  c.save();
  c.translate(0, (S.night ? 6 : 4) * (PAGE_W / 960));
  c.drawRRect(S.bookRRect, S.night ? P.bookShadowNight : P.bookShadow);
  c.restore();
  c.clipRRect(S.pageRRect, ClipOp.Intersect, true);
  if (leaf) c.drawPicture(leaf);
  else drawBook(c, S, F, poses, false, { x0: -F.tx / F.s, y0: -F.ty / F.s, x1: (F.width - F.tx) / F.s, y1: (F.height - F.ty) / F.s });
  c.restore();

  // Screen-space marks, clipped to the book (a turning page carries its own stamps)
  if (!F.flip) {
    c.save();
    c.clipRect(Skia.XYWHRect(F.tx, F.ty, PAGE_W * F.s, PAGE_H * F.s), ClipOp.Intersect, true);
    drawRadar(c, S, F);
    drawStamps(c, S, F, false);
    c.restore();
  }

  drawLoupe(c, S, F, poses, leaf);
  leaf?.dispose();
}

/** The frame as a picture. */
export function renderFrame(live: SceneData, F: FrameState): SkPicture {
  'worklet';
  const recorder = Skia.PictureRecorder();
  const c = recorder.beginRecording(Skia.XYWHRect(0, 0, F.width, F.height));
  // Frames still to come (a page turn, a find, the radar…), so what they need of the GPU is set up
  // now, while a dialog covers the board, rather than in the middle of play. They are drawn straight
  // onto the screen, as they will be (in a layer, or clipped to a small area, the GPU would take
  // other shortcuts), then wiped before this frame. The wipe leaves one row out: wiping the whole
  // screen would let the GPU drop the warm-up unseen
  if (F.warmUp) {
    const most = Skia.XYWHRect(0, 0, F.width, Math.max(0, F.height - 1));
    c.save();
    c.clipRect(most, ClipOp.Intersect, false);
    for (let i = 0; i < F.warmUp.length; i++) drawFrame(c, live, F.warmUp[i]);
    c.clear(Skia.Color('transparent'));
    c.restore();
  }
  drawFrame(c, live, F);
  const picture = recorder.finishRecordingAsPicture();
  recorder.dispose();
  return picture;
}
