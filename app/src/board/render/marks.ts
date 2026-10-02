import type { SkCanvas } from '@shopify/react-native-skia';
import { roamState } from '../../core/motion';
import { BACK_OUT, clamp01, ease, EASE_OUT, lerp, loop } from '../anim';
import { PAGE_H, PAGE_W } from '../constants';
import type { FrameState, SceneData, SceneMark } from './types';

/** Marks drawn over the painting: the hint radar and the stamps on everything found. */

function markPosition(m: SceneMark, F: FrameState): { x: number; y: number } {
  'worklet';
  const f = F.found[m.id];
  if (f) return { x: f.x, y: f.y };
  if (m.roam && m.roam.path.length >= 2) {
    const r = roamState(m.roam, F.now);
    return { x: r.x * PAGE_W, y: r.y * PAGE_H };
  }
  return { x: m.x, y: m.y };
}

/** Hint tier 3: radar rings pulsing on the target (screen px, z 20). */
export function drawRadar(c: SkCanvas, S: SceneData, F: FrameState) {
  'worklet';
  if (!F.radar) return;
  let mark: SceneMark | null = null;
  for (let i = 0; i < S.marks.length; i++) if (S.marks[i].id === F.radar) mark = S.marks[i];
  if (!mark) return;
  const P = S.paints;
  const pos = markPosition(mark, F);
  const x = pos.x * F.s + F.tx;
  const y = pos.y * F.s + F.ty;
  const p = ease(EASE_OUT, loop(F.now, 1400));
  P.radarRing.setAlphaf(1 - p);
  c.drawCircle(x, y, 29 * lerp(0.2, 1.8, p), P.radarRing);
  c.drawCircle(x, y, 4, P.radarGlow);
  c.drawCircle(x, y, 4, P.radarDot);
}

/** Ink stamps on everything found (z 25): screen px, or inked on the page for a recorded page. */
export function drawStamps(c: SkCanvas, S: SceneData, F: FrameState, onPage: boolean) {
  'worklet';
  const P = S.paints;
  const D = S.stampSize;
  for (let i = 0; i < S.marks.length; i++) {
    const m = S.marks[i];
    const f = F.found[m.id];
    if (!f) continue;
    const e = ease(BACK_OUT, clamp01((F.now - f.t) / 500));
    const a = clamp01(e);
    const k = lerp(2.2, 1, e);
    c.save();
    if (onPage) {
      // Same size on screen as the live stamps at the current zoom
      c.translate(f.x, f.y);
      c.scale(k / F.s, k / F.s);
    } else {
      c.translate(f.x * F.s + F.tx, f.y * F.s + F.ty);
      c.scale(k, k);
    }
    P.stampGlow.setAlphaf(0.08 * a);
    c.drawCircle(0, 0, D / 2, P.stampGlow);
    P.stampFill.setAlphaf(a);
    c.save();
    c.scale(D * Math.SQRT1_2, D * Math.SQRT1_2);
    c.drawCircle(0, 0, Math.SQRT1_2, P.stampFill);
    c.restore();
    P.stampRing.setAlphaf(0.55 * a);
    c.drawCircle(0, 0, D / 2 - 1, P.stampRing);
    c.restore();
  }
}
