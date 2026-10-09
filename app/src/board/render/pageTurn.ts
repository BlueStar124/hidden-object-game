import { ClipOp, Skia, type SkCanvas, type SkPicture } from '@shopify/react-native-skia';
import { clamp01, cubicBezier } from '../anim';
import { PAGE_H, PAGE_W } from '../constants';
import { drawBook } from './book';
import { drawStamps } from './marks';
import { posesAt } from './sprites';
import type { FrameState, PageFlip, Pose, SceneData } from './types';

/* ---------------------------------- Page turn ---------------------------------- */

// The leaf is drawn as flat strips, so the paper can bend as it turns
const FLIP_STRIPS = 7;
// How far (radians) the free edge leads the spine side while it lifts, and trails as it lands
const FLIP_BEND = 0.55;
// Distance of the eye from the spine, in leaf widths: the lifted edge swells towards the viewer
const FLIP_DEPTH = 6.5;
// Neighbouring strips overlap by this much (page units) so no hairline shows between them
const FLIP_SEAM = 1.2;

/** Shade on a strip of the leaf at angle phi: the more it stands up, the darker; its back is in its own shade. */
function leafShade(phi: number, front: boolean): number {
  'worklet';
  const tilt = 1 - Math.abs(Math.cos(phi));
  return front ? 0.34 * Math.pow(tilt, 1.4) : 0.42 * Math.pow(tilt, 1.2) + 0.06 * Math.sin(phi);
}

export function flipProgress(F: FrameState): number {
  'worklet';
  const T = F.flip;
  if (!T || !T.to || !F.flipStart) return 0;
  return clamp01((F.now - F.flipStart) / T.duration);
}

/**
 * The spread while a leaf turns about the spine (page units). Underneath, the half the leaf
 * lifts off already shows the new page and the other half still the old one; the leaf carries
 * the old page on its front and the facing half of the new page on its back.
 */
export function drawFlip(c: SkCanvas, T: PageFlip, p: number) {
  'worklet';
  const to = T.to;
  if (!to || p <= 0) {
    c.drawPicture(T.from);
    return;
  }
  if (p >= 1) {
    c.drawPicture(to);
    return;
  }
  const S = T.S;
  const P = S.paints;
  const d = T.dir < 0 ? -1 : 1;
  const book = S.bookRRect.rect;
  const x0 = book.x + book.width / 2; // the spine
  const yc = book.y + book.height / 2;
  const half = book.width / 2;
  const depth = FLIP_DEPTH * half;

  // Lifts, swings over, settles softly. The paper flexes: its free edge leads while the leaf
  // rises (the corner comes up at once) and trails behind as it comes down
  const theta = Math.PI * cubicBezier(0.55, 0, 0.35, 1, p);
  const flex = Math.sin(2 * theta);
  const bend = FLIP_BEND * (flex < 0 ? -Math.sqrt(-flex) : Math.sqrt(flex));
  const lift = Math.sin(theta);

  // The leaf strip by strip from the spine: the angle of each, and where it starts (x along the
  // desk away from the spine, z up towards the viewer)
  const n = FLIP_STRIPS;
  const len = half / n;
  const phis: number[] = [];
  const xs: number[] = [];
  const zs: number[] = [];
  let x = 0;
  let z = 0;
  const angleAt = (j: number) => Math.min(Math.PI, Math.max(0, theta + (bend * j) / n));
  for (let i = 0; i < n; i++) {
    const phi = angleAt(i + 0.5);
    phis.push(phi);
    xs.push(x);
    zs.push(z);
    x += len * Math.cos(phi);
    z += len * Math.sin(phi);
  }
  // Free edge on screen, measured from the spine (positive: still over the half it lifted off)
  const tip = (depth * x) / (depth - z);

  // Underneath
  c.save();
  c.clipRect(Skia.XYWHRect(0, 0, x0, PAGE_H), ClipOp.Intersect, false);
  c.drawPicture(d > 0 ? T.from : to);
  c.restore();
  c.save();
  c.clipRect(Skia.XYWHRect(x0, 0, PAGE_W - x0, PAGE_H), ClipOp.Intersect, false);
  c.drawPicture(d > 0 ? to : T.from);
  c.restore();

  // Shadows of the raised leaf: beyond its free edge, and in the gutter on the other side
  const out = tip >= 0 ? d : -d; // away from the spine, on the side the free edge is over
  const band = Skia.XYWHRect(0, book.y, 1, book.height);
  c.save();
  c.clipRRect(S.paperRRect, ClipOp.Intersect, true);
  P.flipCast.setAlphaf(0.42 * lift);
  c.save();
  c.translate(x0 + d * tip, 0);
  c.scale(out * half * (0.06 + 0.34 * lift), 1);
  c.drawRect(band, P.flipCast);
  c.restore();
  P.flipCast.setAlphaf(0.26 * lift);
  c.save();
  c.translate(x0, 0);
  c.scale(-out * half * 0.2, 1);
  c.drawRect(band, P.flipCast);
  c.restore();
  c.restore();

  // The leaf, farthest strips first
  const order: number[] = [];
  for (let i = 0; i < n; i++) order.push(i);
  order.sort((a, b) => zs[a] + 0.5 * len * Math.sin(phis[a]) - (zs[b] + 0.5 * len * Math.sin(phis[b])));
  for (let k = 0; k < n; k++) {
    const i = order[k];
    const phi = phis[i];
    const cs = Math.cos(phi);
    const sn = Math.sin(phi);
    const u0 = i * len;
    const xa = xs[i];
    const za = zs[i];
    const xb = xa + len * cs;
    const zb = za + len * sn;
    // Its front faces the viewer while, on screen, it still runs away from the spine
    const front = (depth * xb) / (depth - zb) >= (depth * xa) / (depth - za);
    // u (distance from the spine along the leaf) → screen: the strip turned by phi about the
    // edge it shares with the previous one, seen in perspective (a 3×3 homography)
    const m = [cs, 0, xa - u0 * cs, 0, 1, 0, -sn / depth, 0, 1 - (za - u0 * sn) / depth];
    // Half of the spread printed on this face: the leaf's own on its front, the other on its back
    const side = front ? d : -d;
    const strip = Skia.XYWHRect(side > 0 ? x0 + u0 - FLIP_SEAM : x0 - u0 - len - FLIP_SEAM, 0, len + 2 * FLIP_SEAM, PAGE_H);
    c.save();
    c.translate(x0, yc);
    c.scale(d, 1);
    c.concat(m);
    c.scale(side, 1);
    c.translate(-x0, -yc);
    c.clipRect(strip, ClipOp.Intersect, true);
    c.drawPicture(front ? T.from : to);
    // Lit from above, the shade running smoothly across the strip from one joint to the next
    const inner = leafShade(angleAt(i), front);
    const outer = leafShade(angleAt(i + 1), front);
    if (Math.max(inner, outer) > 0.004) {
      c.clipRRect(S.paperRRect, ClipOp.Intersect, true);
      P.flipShade.setAlphaf(Math.min(inner, outer));
      c.drawRect(strip, P.flipShade);
      // …plus a ramp from the darker joint to the lighter one
      const darkInner = inner > outer;
      c.translate(x0 + side * (darkInner ? u0 : u0 + len), 0);
      c.scale((darkInner ? side : -side) * len, 1);
      P.flipRamp.setAlphaf(Math.abs(inner - outer));
      c.drawRect(Skia.XYWHRect(0, 0, 1, PAGE_H), P.flipRamp);
    }
    c.restore();
  }
}

/** Records a page as it looks now, flat and in page units, for a page turn. */
export function recordPage(S: SceneData, F: FrameState): SkPicture {
  'worklet';
  const recorder = Skia.PictureRecorder();
  const c = recorder.beginRecording(S.pageRect);
  // Snapshotting runs on JS too, where scene buffers captured by worklets are immutable.
  const poses: Pose[] = [];
  for (let i = 0; i < S.poses.length; i++) poses.push({ ...S.poses[i] });
  posesAt(S, F, poses);
  c.save();
  c.clipRRect(S.pageRRect, ClipOp.Intersect, true);
  drawBook(c, S, F, poses, false, null);
  c.restore();
  drawStamps(c, S, F, true);
  const picture = recorder.finishRecordingAsPicture();
  recorder.dispose();
  return picture;
}
