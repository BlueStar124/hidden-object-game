import { useEffect, useRef, useState } from 'react';
import { motionNow } from '../core/motion';
import { CAMO_INVISIBLE, recordPage, type FoundInfo, type FrameState, type SceneData } from './render';
import type { Camera } from './useCamera';

/**
 * The first page turn, the first find, the first hint… each draws something the GPU has not drawn
 * yet, and getting it ready (compiling its shaders) can freeze a frame for a good part of a second.
 * So once per kind of page (day, night), while a dialog covers the board, one frame also draws all
 * of that at once — invisibly — and play never stops for it later.
 */

// Kinds of page already warmed up in this run of the app
const warmed = new Set<string>();

// After the dialog has settled in; for a few frames
const DELAY_MS = 700;
const HOLD_MS = 250;

function warmFrames(S: SceneData, camera: Camera): FrameState[] {
  const now = motionNow();
  const { w, h } = camera.dims.value;
  const s = camera.s.value;
  const tx = camera.tx.value;
  const ty = camera.ty.value;
  // Everything found a moment ago: hidden sprites still fading out, found ones blooming, stamps
  const found: Record<string, FoundInfo> = {};
  for (const m of S.marks) found[m.id] = { t: now - 300, x: m.x, y: m.y, flip: 1 };
  // The loupe over a sprite (invisible ink if there is some: it has its own glow)
  const target = S.sprites.find((sp) => sp.camo === CAMO_INVISIBLE) ?? S.sprites[0];
  const base: FrameState = {
    now,
    width: w,
    height: h,
    s,
    tx,
    ty,
    lx: target ? target.x * s + tx : w / 2,
    ly: target ? target.y * s + ty : h / 2,
    found,
    radar: S.marks[0]?.id ?? null,
    fogStart: now - 500,
    nudge: target ? { x: target.x + 200, y: target.y, t: now - 400 } : null,
    flip: null,
    flipStart: 0,
    warm: [],
  };
  // …and a leaf turning, the loupe over the spine: early, halfway, late, both ways
  const page = recordPage(S, base);
  const duration = 1000;
  const book = S.bookRRect.rect;
  const spine = { lx: (book.x + book.width / 2) * s + tx, ly: (book.y + book.height / 2) * s + ty };
  const turning = (dir: number, p: number): FrameState => ({
    ...base,
    ...spine,
    flip: { from: page, to: page, dir, S, duration },
    flipStart: now - p * duration,
  });
  return [base, turning(1, 0.2), turning(1, 0.5), turning(1, 0.8), turning(-1, 0.5)];
}

/** Frames for the renderer to warm up with (null: none now). `covered`: a dialog is over the board. */
export function useWarmUp(scene: SceneData | null, covered: boolean, camera: Camera): FrameState[] | null {
  const [frames, setFrames] = useState<FrameState[] | null>(null);
  const kind = scene ? (scene.night ? 'night' : 'day') : null;
  const cameraRef = useRef(camera);
  cameraRef.current = camera;

  useEffect(() => {
    if (!scene || !covered || !kind || warmed.has(kind)) return;
    const t = setTimeout(() => {
      if (cameraRef.current.dims.value.w === 0) return;
      warmed.add(kind);
      setFrames(warmFrames(scene, cameraRef.current));
    }, DELAY_MS);
    return () => clearTimeout(t);
  }, [scene, covered, kind]);

  useEffect(() => {
    if (!frames) return;
    const t = setTimeout(() => setFrames(null), HOLD_MS);
    return () => clearTimeout(t);
  }, [frames]);

  return frames;
}
