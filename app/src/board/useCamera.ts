import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { cancelAnimation, Easing, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { MAX_ZOOM, MIN_ZOOM, PAGE_H, PAGE_W } from './constants';
import type { SceneData } from './render';

/**
 * The camera over the sketchbook and the loupe lying on it. The page maps to the screen as
 * `screen = page * s + t`; the camera frames the paper (not the transparent margin of the
 * painting) and zooms from 1× (fitted) to MAX_ZOOM. Shared values: gestures move them on the UI
 * thread, the renderer reads them every frame.
 */

// Room around the spread when it is fitted, and how far a zoomed page may be dragged past its edge
const FIT_PAD = 8;
const OVERSCROLL = 8;

/** Diameter of the loupe: big enough to search with, never more than ~40% of the shorter side. */
export function loupeDiameter(w: number, h: number) {
  return Math.round(Math.max(110, Math.min(220, Math.min(w, h) * 0.42)));
}

/** Board size, fitted scale, loupe size and the book (the paper inside the spread, page units). */
export interface BoardDims {
  w: number;
  h: number;
  fit: number;
  r: number;
  d: number;
  bx: number;
  by: number;
  bw: number;
  bh: number;
}

export interface Camera {
  s: SharedValue<number>;
  tx: SharedValue<number>;
  ty: SharedValue<number>;
  /** The loupe's centre, on screen */
  lx: SharedValue<number>;
  ly: SharedValue<number>;
  dims: SharedValue<BoardDims>;
  /** Translation limits at a scale (worklet) */
  bounds: (scale: number) => { minX: number; maxX: number; minY: number; maxY: number };
  /** Translation that centres the spread at a scale (worklet) */
  centre: (scale: number) => { tx: number; ty: number };
  clampScale: (scale: number) => number;
  /** Puts the loupe down at a screen point, kept on the board (worklet) */
  placeLoupe: (x: number, y: number) => void;
  /** Zoom shown on the buttons (1.0×…) */
  zoom: number;
  /** Zooms to a level, around a screen point (instantly) or the middle (animated) */
  zoomTo: (zoom: number, focal?: { x: number; y: number }) => void;
  /** The player zoomed by hand (pinch): keep that zoom from now on */
  markZoomed: (zoom: number) => void;
}

export function useCamera(
  size: { w: number; h: number } | null,
  shown: SceneData | null,
  pageId: string,
  diameter: number,
  /** True while a page turns: the turn moves the camera itself */
  turning: MutableRefObject<boolean>
): Camera {
  const s = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const lx = useSharedValue(-1000);
  const ly = useSharedValue(-1000);
  const dims = useSharedValue<BoardDims>({ w: 0, h: 0, fit: 1, r: diameter / 2, d: diameter, bx: 0, by: 0, bw: PAGE_W, bh: PAGE_H });
  const [zoom, setZoom] = useState(1);

  const bounds = useCallback(
    (scale: number) => {
      'worklet';
      const { w, h, bx, by, bw, bh } = dims.value;
      const cw = bw * scale;
      const ch = bh * scale;
      const fitsX = cw <= w - 2 * FIT_PAD;
      const fitsY = ch <= h - 2 * FIT_PAD;
      return {
        minX: (fitsX ? (w - cw) / 2 : w - cw - OVERSCROLL) - bx * scale,
        maxX: (fitsX ? (w - cw) / 2 : OVERSCROLL) - bx * scale,
        minY: (fitsY ? (h - ch) / 2 : h - ch - OVERSCROLL) - by * scale,
        maxY: (fitsY ? (h - ch) / 2 : OVERSCROLL) - by * scale,
      };
    },
    [dims]
  );

  const centre = useCallback(
    (scale: number) => {
      'worklet';
      const b = bounds(scale);
      return { tx: (b.minX + b.maxX) / 2, ty: (b.minY + b.maxY) / 2 };
    },
    [bounds]
  );

  const clampScale = useCallback(
    (scale: number) => {
      'worklet';
      const fit = dims.value.fit;
      return Math.min(fit * MAX_ZOOM, Math.max(fit * MIN_ZOOM, scale));
    },
    [dims]
  );

  const placeLoupe = useCallback(
    (x: number, y: number) => {
      'worklet';
      // The loupe may be parked anywhere on the desk (off the painting it inspects nothing and
      // costs nothing); its centre just stays on the board so it can always be picked up again
      const { w, h } = dims.value;
      const m = 18;
      lx.value = Math.min(w - m, Math.max(m, x));
      ly.value = Math.min(h - m, Math.max(m, y));
    },
    [dims, lx, ly]
  );

  /* --------------------------- Layout & page changes --------------------------- */

  const placed = useRef<{ w: number; h: number } | null>(null);
  // Until the player zooms by hand, every new layout (or the book being measured) re-applies the default
  const userZoomed = useRef(false);
  // The paper of the page on screen (the previous page's while the next one decodes: no jump)
  const book = shown?.bookRRect.rect;
  const bx = book?.x ?? 0;
  const by = book?.y ?? 0;
  const bw = book?.width ?? PAGE_W;
  const bh = book?.height ?? PAGE_H;
  useEffect(() => {
    if (!size || size.w === 0 || size.h === 0) return;
    const fit = Math.min((size.w - 2 * FIT_PAD) / bw, (size.h - 2 * FIT_PAD) / bh);
    const d = loupeDiameter(size.w, size.h);
    const prevZoom = s.value / dims.value.fit;
    dims.value = { w: size.w, h: size.h, fit, r: d / 2, d, bx, by, bw, bh };
    const prev = placed.current;
    placed.current = size;
    const resized = !prev || prev.w !== size.w || prev.h !== size.h;
    // First layout, or the phone turned: start fitted at 1.0×.
    const turned = !prev || prev.w > prev.h !== size.w > size.h;
    if (turned) userZoomed.current = false;
    const level = userZoomed.current ? Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prevZoom)) : 1;
    const scale = fit * level;
    s.value = scale;
    if (resized || !turning.current) {
      const c = centre(scale);
      tx.value = c.tx;
      ty.value = c.ty;
    }
    // The loupe starts a little right of and below the middle of what is on screen; a new page
    // (whose paper sits a pixel or two elsewhere) leaves it where the player put it
    if (resized) placeLoupe(size.w * 0.6, size.h * 0.58);
    else placeLoupe(lx.value, ly.value);
    setZoom(level);
  }, [size, bx, by, bw, bh, centre, placeLoupe, dims, lx, ly, s, tx, ty, turning]);

  // A new page opens on the middle of the spread (a page turn glides there itself)
  useEffect(() => {
    if (!placed.current) return;
    if (!turning.current) {
      const c = centre(s.value);
      tx.value = c.tx;
      ty.value = c.ty;
    }
    placeLoupe(lx.value, ly.value);
  }, [pageId, centre, placeLoupe, lx, ly, s, tx, ty, turning]);

  /* ---------------------------------- Zoom ---------------------------------- */

  const zoomTo = useCallback(
    (level: number, focal?: { x: number; y: number }) => {
      const { w, h, fit } = dims.value;
      const target = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, level));
      const fx = focal?.x ?? w / 2;
      const fy = focal?.y ?? h / 2;
      const px = (fx - tx.value) / s.value;
      const py = (fy - ty.value) / s.value;
      const scale = fit * target;
      const b = bounds(scale);
      const nx = Math.min(b.maxX, Math.max(b.minX, fx - px * scale));
      const ny = Math.min(b.maxY, Math.max(b.minY, fy - py * scale));
      const timing = { duration: focal ? 0 : 240, easing: Easing.out(Easing.cubic) };
      userZoomed.current = true;
      cancelAnimation(tx);
      cancelAnimation(ty);
      s.value = focal ? scale : withTiming(scale, timing);
      tx.value = focal ? nx : withTiming(nx, timing);
      ty.value = focal ? ny : withTiming(ny, timing);
      setZoom(target);
    },
    [bounds, dims, s, tx, ty]
  );

  const markZoomed = useCallback((level: number) => {
    userZoomed.current = true;
    setZoom(level);
  }, []);

  return { s, tx, ty, lx, ly, dims, bounds, centre, clampScale, placeLoupe, zoom, zoomTo, markZoomed };
}
