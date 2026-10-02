import { ClipOp, FilterMode, MipmapMode, Skia, type SkPicture } from '@shopify/react-native-skia';
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

export function renderFrame(live: SceneData, F: FrameState): SkPicture {
  'worklet';
  const recorder = Skia.PictureRecorder();
  const c = recorder.beginRecording(Skia.XYWHRect(0, 0, F.width, F.height));
  // While a page turns, both pages come from the turn and the frame is the page being opened
  const S = F.flip ? F.flip.S : live;
  const P = S.paints;
  const flip = flipProgress(F);
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
  if (F.flip) drawFlip(c, F.flip, flip);
  else drawBook(c, S, F, poses, false);
  c.restore();

  // Screen-space marks, clipped to the book (a turning page carries its own stamps)
  if (!F.flip) {
    c.save();
    c.clipRect(Skia.XYWHRect(F.tx, F.ty, PAGE_W * F.s, PAGE_H * F.s), ClipOp.Intersect, true);
    drawRadar(c, S, F);
    drawStamps(c, S, F, false);
    c.restore();
  }

  drawLoupe(c, S, F, poses, flip);

  return recorder.finishRecordingAsPicture();
}
