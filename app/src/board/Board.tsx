import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { Canvas, Picture, Skia, useFont, useImage, type SkImage, type SkPicture } from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  withDecay,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { ZoomIn, ZoomOut } from '../ui/icons';
import type { HiddenObject, LevelData } from '@core/types/level';
import { motionNow, objectPosition, roamState } from '../game/CreatureMotion';
import { analyzeScene, FULL_SPREAD } from '../game/sceneAnalysis';
import { sceneSource } from '../platform/assets';
import { colors } from '../theme';
import { MAX_ZOOM, MIN_ZOOM, PAGE_H, PAGE_W } from './constants';
import { createLoupePaints } from './paints';
import { renderFrame, type FoundInfo, type SceneData } from './renderer';
import { buildScene } from './scene';

const FONT = require('@expo-google-fonts/playfair-display/600SemiBold/PlayfairDisplay_600SemiBold.ttf');

// Room around the spread when it is fitted, and how far a zoomed page may be dragged past its edge
const FIT_PAD = 8;
const OVERSCROLL = 8;
// Dragging the loupe this close to an edge of a zoomed page scrolls the page along
const EDGE_ZONE = 44;
const EDGE_SPEED = 9; // px per frame at the very edge
const TAP_SLOP = 10;

const NONE = 0;
const PAGE = 1;
const LOUPE = 2;

export interface BoardProps {
  level: LevelData;
  foundIds: string[];
  foundAt: Record<string, { x: number; y: number }>;
  radarTargetId: string | null;
  nudgeTarget: HiddenObject | null; // Hint tier 2
  isTurning: boolean;
  fogged: boolean;
  /** Same contract as the web sketchbook: normalized spread coords + the point on screen */
  onInspect: (nx: number, ny: number, screenPos: { x: number; y: number }) => void;
  /** Artwork to decode in the background (the next page) */
  preload?: string[];
  /**
   * False while a dialog covers the board. Gesture Handler recognises gestures natively, under
   * React views as well, so the board must ignore touches meant for whatever is on top of it.
   */
  active?: boolean;
  children?: React.ReactNode; // overlays (explore banner…)
}

/** Diameter of the loupe: big enough to search with, never more than ~40% of the shorter side. */
function loupeDiameter(w: number, h: number) {
  return Math.round(Math.max(110, Math.min(220, Math.min(w, h) * 0.42)));
}

/** Phones see the book tiny when it is fitted: open zoomed in so the paper fills the board. */
function defaultZoom(w: number, h: number, bookW: number, bookH: number, fit: number) {
  if (Math.min(w, h) >= 600) return 1;
  const cover = Math.max(w / bookW, h / bookH) / fit;
  // Upright phones: the wide book cannot fill the height without endless panning — take ~¾ of it
  const zoom = h > w ? Math.min(3, Math.max(1, cover * 0.72)) : Math.min(1.6, Math.max(1, cover));
  // On a tenth, like the steps of the zoom buttons
  return Math.round(zoom * 10) / 10;
}

const emptyPicture = (() => {
  const rec = Skia.PictureRecorder();
  rec.beginRecording(Skia.XYWHRect(0, 0, 1, 1));
  return rec.finishRecordingAsPicture();
})();

// Decoded artwork, kept for the session: turning back to a page (or into its night variant,
// which reuses the day artwork) is instant, and the next page is decoded ahead of time
const sceneImages = new Map<string, SkImage>();

/** Loads one scene image; keyed by its path so a new page never pairs with the old artwork. */
const SceneImage: React.FC<{ src: string; onLoad?: (src: string, image: SkImage) => void }> = ({ src, onLoad }) => {
  const image = useImage(sceneImages.has(src) ? null : sceneSource(src));
  useEffect(() => {
    if (!image) return;
    sceneImages.set(src, image);
    onLoad?.(src, image);
  }, [image, src, onLoad]);
  return null;
};

export const Board: React.FC<BoardProps> = ({
  level,
  foundIds,
  foundAt,
  radarTargetId,
  nudgeTarget,
  isTurning,
  fogged,
  onInspect,
  preload = [],
  active = true,
  children,
}) => {
  const win = useWindowDimensions();
  const compact = win.width < 640;
  const font = useFont(FONT, compact ? 11 : 13);

  const viewRef = useRef<View>(null);
  const windowOffset = useRef({ x: 0, y: 0 });
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [loaded, setLoaded] = useState<{ src: string; image: SkImage } | null>(null);
  const [zoomLabel, setZoomLabel] = useState(1);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) => (prev && prev.w === width && prev.h === height ? prev : { w: width, h: height }));
    viewRef.current?.measureInWindow((x, y) => {
      windowOffset.current = { x, y };
    });
  }, []);

  const handleImage = useCallback((src: string, image: SkImage) => setLoaded({ src, image }), []);

  /* ------------------------------- Scene data ------------------------------- */

  const diameter = size ? loupeDiameter(size.w, size.h) : 140;
  const loupePaints = useMemo(() => createLoupePaints(diameter), [diameter]);
  const cached = sceneImages.get(level.sceneImage);
  const ready = useMemo(
    () => (cached ? { src: level.sceneImage, image: cached } : loaded && loaded.src === level.sceneImage ? loaded : null),
    [cached, loaded, level.sceneImage]
  );
  const analysis = useMemo(() => (ready ? analyzeScene(ready.image, level.objects) : null), [ready, level]);
  const book = analysis?.book ?? FULL_SPREAD;
  const scene = useMemo<SceneData | null>(
    () =>
      ready && analysis
        ? buildScene({ level, image: ready.image, tints: analysis.tints, book: analysis.book, loupe: loupePaints, font, compact })
        : null,
    [ready, analysis, level, loupePaints, font, compact]
  );
  // Keep showing the previous page while the next one decodes
  const lastScene = useRef<SceneData | null>(null);
  if (scene) lastScene.current = scene;
  const shown = scene ?? lastScene.current;

  /* ----------------------------- Shared values ----------------------------- */

  const clock = useSharedValue(motionNow());
  const s = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const lx = useSharedValue(-1000);
  const ly = useSharedValue(-1000);
  // Board size, fitted scale, loupe size and the book (the paper inside the spread, page units)
  const dims = useSharedValue({ w: 0, h: 0, fit: 1, r: diameter / 2, d: diameter, bx: 0, by: 0, bw: PAGE_W, bh: PAGE_H });
  const found = useSharedValue<Record<string, FoundInfo>>({});
  const radar = useSharedValue<string | null>(null);
  const fogStart = useSharedValue(0);
  const turnStart = useSharedValue(0);
  const nudge = useSharedValue<{ x: number; y: number; t: number } | null>(null);

  const enabled = useSharedValue(active);
  // Screen rectangles of the controls drawn over the board (zoom buttons, banner): touches
  // starting there belong to them, not to the sketchbook
  const zoomRect = useSharedValue({ x: 0, y: 0, w: 0, h: 0 });
  const bannerRect = useSharedValue({ x: 0, y: 0, w: 0, h: 0 });
  useEffect(() => {
    enabled.value = active;
  }, [active, enabled]);

  const mode = useSharedValue(NONE);
  const grab = useSharedValue({ x: 0, y: 0 });
  const finger = useSharedValue({ x: 0, y: 0 });
  const panStart = useSharedValue({ tx: 0, ty: 0 });
  const pinchStart = useSharedValue({ s: 1, px: 0, py: 0 });

  /* ------------------------------ View maths ------------------------------ */

  // Translation limits: the camera frames the paper, not the transparent margin of the artwork
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

  const clampScale = useCallback(
    (scale: number) => {
      'worklet';
      const fit = dims.value.fit;
      return Math.min(fit * MAX_ZOOM, Math.max(fit * MIN_ZOOM, scale));
    },
    [dims]
  );

  const clampLoupe = useCallback(
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

  const onControls = useCallback(
    (x: number, y: number) => {
      'worklet';
      const inside = (r: { x: number; y: number; w: number; h: number }) =>
        r.w > 0 && x >= r.x - 6 && x <= r.x + r.w + 6 && y >= r.y - 6 && y <= r.y + r.h + 6;
      return !enabled.value || inside(zoomRect.value) || inside(bannerRect.value);
    },
    [enabled, zoomRect, bannerRect]
  );

  const hitLoupe = useCallback(
    (x: number, y: number) => {
      'worklet';
      const { r, d } = dims.value;
      const dx = x - lx.value;
      const dy = y - ly.value;
      if (dx * dx + dy * dy <= (r + 10) * (r + 10)) return true;
      // The wooden handle: a capsule leaving the bezel towards the bottom-right
      const px = 0.32 * d;
      const len = 0.58 * d;
      const along = (dx - px + (dy - px)) * Math.SQRT1_2;
      const t = Math.max(0, Math.min(len, along));
      const cx = px + t * Math.SQRT1_2;
      const grip = Math.max(0.05 * d, 14) + 8;
      return (dx - cx) * (dx - cx) + (dy - cx) * (dy - cx) <= grip * grip;
    },
    [dims, lx, ly]
  );

  /* --------------------------- Layout & level reset --------------------------- */

  const placed = useRef<{ w: number; h: number } | null>(null);
  // Until the player zooms by hand, every new layout (or the book being measured) re-applies the default
  const userZoomed = useRef(false);
  const bx = book.x * PAGE_W;
  const by = book.y * PAGE_H;
  const bw = book.w * PAGE_W;
  const bh = book.h * PAGE_H;
  useEffect(() => {
    if (!size || size.w === 0 || size.h === 0) return;
    const fit = Math.min((size.w - 2 * FIT_PAD) / bw, (size.h - 2 * FIT_PAD) / bh);
    const d = loupeDiameter(size.w, size.h);
    const prevZoom = s.value / dims.value.fit;
    dims.value = { w: size.w, h: size.h, fit, r: d / 2, d, bx, by, bw, bh };
    const prev = placed.current;
    placed.current = size;
    // First layout, or the phone turned: open at the default zoom for this shape
    const turned = !prev || prev.w > prev.h !== size.w > size.h;
    if (turned) userZoomed.current = false;
    const zoom = userZoomed.current ? Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prevZoom)) : defaultZoom(size.w, size.h, bw, bh, fit);
    const scale = fit * zoom;
    s.value = scale;
    const b = bounds(scale);
    tx.value = (b.minX + b.maxX) / 2;
    ty.value = (b.minY + b.maxY) / 2;
    // The loupe starts a little right of and below the middle of what is on screen
    clampLoupe(size.w * 0.6, size.h * 0.58);
    setZoomLabel(zoom);
  }, [size, bx, by, bw, bh, bounds, clampLoupe, dims, s, tx, ty]);

  // A new page opens on the middle of the spread
  useEffect(() => {
    if (!placed.current) return;
    const b = bounds(s.value);
    tx.value = (b.minX + b.maxX) / 2;
    ty.value = (b.minY + b.maxY) / 2;
    clampLoupe(lx.value, ly.value);
  }, [level.id, bounds, clampLoupe, lx, ly, s, tx, ty]);

  /* --------------------------- Game state → UI thread --------------------------- */

  const foundRef = useRef<{ level: string; map: Record<string, FoundInfo> }>({ level: level.id, map: {} });
  useEffect(() => {
    // A new page starts with nothing found (replays too: ids missing from foundIds are dropped)
    const newPage = foundRef.current.level !== level.id;
    if (newPage) foundRef.current = { level: level.id, map: {} };
    const map = { ...foundRef.current.map };
    const now = motionNow();
    let changed = false;
    for (const id of foundIds) {
      if (map[id]) continue;
      const obj = level.objects.find((o) => o.id === id);
      if (!obj) continue;
      const at = foundAt[id] ?? obj;
      let flip = obj.flip ? -1 : 1;
      if (obj.roam && obj.roam.path.length >= 2 && roamState(obj.roam, performance.now()).flip) flip = -flip;
      map[id] = { t: now, x: at.x * PAGE_W, y: at.y * PAGE_H, flip };
      changed = true;
    }
    for (const id of Object.keys(map)) {
      if (!foundIds.includes(id)) {
        delete map[id];
        changed = true;
      }
    }
    if (changed || newPage) {
      foundRef.current.map = map;
      found.value = map;
    }
  }, [foundIds, foundAt, level, found]);

  // Hint tier 3: the radar pulses on the target — glide the page there if it is off screen
  useEffect(() => {
    radar.value = radarTargetId;
    const target = radarTargetId ? level.objects.find((o) => o.id === radarTargetId) : undefined;
    if (!target) return;
    const pos = objectPosition(target, performance.now());
    const px = pos.x * PAGE_W;
    const py = pos.y * PAGE_H;
    const { w, h } = dims.value;
    const scale = s.value;
    const sx = px * scale + tx.value;
    const sy = py * scale + ty.value;
    const margin = Math.min(80, w / 5, h / 5);
    if (sx > margin && sx < w - margin && sy > margin && sy < h - margin) return;
    const b = bounds(scale);
    const glide = { duration: 520, easing: Easing.inOut(Easing.cubic) };
    tx.value = withTiming(Math.min(b.maxX, Math.max(b.minX, w / 2 - px * scale)), glide);
    ty.value = withTiming(Math.min(b.maxY, Math.max(b.minY, h / 2 - py * scale)), glide);
  }, [radarTargetId, level, radar, bounds, dims, s, tx, ty]);
  useEffect(() => {
    fogStart.value = fogged ? motionNow() : 0;
  }, [fogged, fogStart]);
  useEffect(() => {
    turnStart.value = isTurning ? motionNow() : 0;
  }, [isTurning, turnStart]);
  useEffect(() => {
    nudge.value = nudgeTarget ? { x: nudgeTarget.x * PAGE_W, y: nudgeTarget.y * PAGE_H, t: motionNow() } : null;
  }, [nudgeTarget, nudge]);

  /* ------------------------------- Frame loop ------------------------------- */

  useFrameCallback(() => {
    clock.value = motionNow();
    if (mode.value === LOUPE) {
      // Loupe held near the edge of a zoomed page: scroll the page under it
      const { w, h } = dims.value;
      const f = finger.value;
      const push = (pos: number, size: number) =>
        pos < EDGE_ZONE ? (EDGE_ZONE - pos) / EDGE_ZONE : pos > size - EDGE_ZONE ? -(pos - (size - EDGE_ZONE)) / EDGE_ZONE : 0;
      const vx = push(f.x, w);
      const vy = push(f.y, h);
      if (vx !== 0 || vy !== 0) {
        const b = bounds(s.value);
        tx.value = Math.min(b.maxX, Math.max(b.minX, tx.value + vx * EDGE_SPEED));
        ty.value = Math.min(b.maxY, Math.max(b.minY, ty.value + vy * EDGE_SPEED));
      }
      clampLoupe(f.x - grab.value.x, f.y - grab.value.y);
    } else {
      clampLoupe(lx.value, ly.value);
    }
  });

  const picture = useDerivedValue<SkPicture>(() => {
    if (!shown) return emptyPicture;
    const { w, h } = dims.value;
    return renderFrame(shown, {
      now: clock.value,
      width: w,
      height: h,
      s: s.value,
      tx: tx.value,
      ty: ty.value,
      lx: lx.value,
      ly: ly.value,
      found: found.value,
      radar: radar.value,
      fogStart: fogStart.value,
      turnStart: turnStart.value,
      nudge: nudge.value,
    });
  }, [shown]);

  /* -------------------------------- Gestures -------------------------------- */

  // The gesture is built once and reaches the game through this ref. useGame's handleInspect
  // reads the state of the render it was created in (fine for discrete web clicks); taps arrive
  // here asynchronously from the UI thread, so each one waits until the previous tap's update
  // has rendered — two quick finds can never be computed from the same stale state.
  const onInspectRef = useRef(onInspect);
  onInspectRef.current = onInspect;
  const pendingTap = useRef(false);
  const queuedTaps = useRef<[number, number, number, number][]>([]);
  const deliverTap = useCallback((nx: number, ny: number, x: number, y: number) => {
    pendingTap.current = true;
    onInspectRef.current(nx, ny, { x: windowOffset.current.x + x, y: windowOffset.current.y + y });
    // A tap the game ignores (paused, page turning…) triggers no render: don't wait forever
    setTimeout(() => {
      if (!pendingTap.current) return;
      pendingTap.current = false;
      const next = queuedTaps.current.shift();
      if (next) deliverTap(...next);
    }, 300);
  }, []);
  useEffect(() => {
    // Every render of the board follows the game's state: the next queued tap can go
    pendingTap.current = false;
    const next = queuedTaps.current.shift();
    if (next) deliverTap(...next);
  });
  const inspect = useCallback(
    (nx: number, ny: number, x: number, y: number) => {
      if (pendingTap.current) queuedTaps.current.push([nx, ny, x, y]);
      else deliverTap(nx, ny, x, y);
    },
    [deliverTap]
  );

  // Inspects the spot under a point of the board. Off the painting — a tap on the desk, or the
  // loupe put down beside the book — is not a guess: no penalty, no miss counted towards the
  // misted loupe
  const inspectAt = useCallback(
    (x: number, y: number) => {
      'worklet';
      if (!enabled.value) return;
      const px = (x - tx.value) / s.value;
      const py = (y - ty.value) / s.value;
      const { bx: left, by: top, bw: width, bh: height } = dims.value;
      if (px < left || px > left + width || py < top || py > top + height) return;
      scheduleOnRN(inspect, px / PAGE_W, py / PAGE_H, x, y);
    },
    [dims, enabled, inspect, s, tx, ty]
  );

  const syncZoom = useCallback((zoom: number) => {
    userZoomed.current = true;
    setZoomLabel(zoom);
  }, []);

  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .maxPointers(1)
      // Below this much movement a touch is a tap, above it a drag
      .minDistance(TAP_SLOP)
      .onBegin((e) => {
        if (onControls(e.x, e.y)) {
          mode.value = NONE;
          return;
        }
        cancelAnimation(tx);
        cancelAnimation(ty);
        finger.value = { x: e.x, y: e.y };
        panStart.value = { tx: tx.value, ty: ty.value };
        if (hitLoupe(e.x, e.y)) {
          mode.value = LOUPE;
          grab.value = { x: e.x - lx.value, y: e.y - ly.value };
        } else {
          mode.value = PAGE;
        }
      })
      .onUpdate((e) => {
        finger.value = { x: e.x, y: e.y };
        if (mode.value === LOUPE) {
          clampLoupe(e.x - grab.value.x, e.y - grab.value.y);
        } else if (mode.value === PAGE) {
          const b = bounds(s.value);
          tx.value = Math.min(b.maxX, Math.max(b.minX, panStart.value.tx + e.translationX));
          ty.value = Math.min(b.maxY, Math.max(b.minY, panStart.value.ty + e.translationY));
        }
      })
      .onEnd((e, success) => {
        if (mode.value === LOUPE) {
          // Wherever the loupe is put down, its crosshair inspects that spot
          if (success) inspectAt(lx.value, ly.value);
          return;
        }
        if (mode.value !== PAGE) return;
        const b = bounds(s.value);
        tx.value = withDecay({ velocity: e.velocityX, clamp: [b.minX, b.maxX] });
        ty.value = withDecay({ velocity: e.velocityY, clamp: [b.minY, b.maxY] });
      })
      .onFinalize(() => {
        mode.value = NONE;
      });

    const pinch = Gesture.Pinch()
      .onStart((e) => {
        mode.value = NONE;
        if (!enabled.value) return;
        cancelAnimation(tx);
        cancelAnimation(ty);
        cancelAnimation(s);
        pinchStart.value = { s: s.value, px: (e.focalX - tx.value) / s.value, py: (e.focalY - ty.value) / s.value };
      })
      .onUpdate((e) => {
        if (!enabled.value) return;
        const scale = clampScale(pinchStart.value.s * e.scale);
        const b = bounds(scale);
        s.value = scale;
        tx.value = Math.min(b.maxX, Math.max(b.minX, e.focalX - pinchStart.value.px * scale));
        ty.value = Math.min(b.maxY, Math.max(b.minY, e.focalY - pinchStart.value.py * scale));
      })
      .onEnd(() => {
        scheduleOnRN(syncZoom, s.value / dims.value.fit);
      });

    // Tap the page to inspect that spot, or tap the loupe to inspect under its crosshair
    const tap = Gesture.Tap()
      .maxDuration(450)
      .maxDistance(TAP_SLOP)
      .onEnd((e, success) => {
        if (!success || onControls(e.x, e.y)) return;
        if (hitLoupe(e.x, e.y)) inspectAt(lx.value, ly.value);
        else inspectAt(e.x, e.y);
      });

    return Gesture.Simultaneous(pinch, Gesture.Race(pan, tap));
  }, [
    bounds,
    clampLoupe,
    clampScale,
    dims,
    enabled,
    finger,
    grab,
    hitLoupe,
    inspectAt,
    lx,
    ly,
    mode,
    onControls,
    panStart,
    pinchStart,
    s,
    syncZoom,
    tx,
    ty,
  ]);

  /* ------------------------------ Zoom controls ------------------------------ */

  const zoomTo = useCallback(
    (zoom: number, focal?: { x: number; y: number }) => {
      const { w, h, fit } = dims.value;
      const target = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
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
      setZoomLabel(target);
    },
    [bounds, dims, s, tx, ty]
  );

  const zoom = zoomLabel;
  // The buttons move in tenths of what the label shows (1.0×, 1.1×, 1.2×…), also after a pinch
  const stepZoom = (dir: 1 | -1) => zoomTo((Math.round(zoom * 10) + dir) / 10);

  // Browsers: mouse wheel / trackpad pinch zooms around the pointer
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = viewRef.current as unknown as HTMLElement | null;
    if (!node?.addEventListener) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = node.getBoundingClientRect();
      // Linear like the buttons: one wheel notch (100 px) = 0.1×. A trackpad pinch arrives as
      // ctrl + wheel with small deltas, hence its larger factor
      const delta = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY; // Firefox counts lines
      const target = s.value / dims.value.fit - delta * (e.ctrlKey ? 0.01 : 0.001);
      zoomTo(target, { x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, [zoomTo, s, dims]);

  return (
    <View ref={viewRef} style={styles.root} onLayout={onLayout}>
      <SceneImage key={level.sceneImage} src={level.sceneImage} onLoad={handleImage} />
      {preload
        .filter((src) => src !== level.sceneImage)
        .map((src) => (
          <SceneImage key={`preload:${src}`} src={src} />
        ))}
      <GestureDetector gesture={gesture}>
        <View style={StyleSheet.absoluteFill} collapsable={false}>
          <Canvas style={StyleSheet.absoluteFill}>
            <Picture picture={picture} />
          </Canvas>
        </View>
      </GestureDetector>

      {children && (
        <View
          style={styles.banner}
          pointerEvents="box-none"
          onLayout={(e) => {
            const { x, y, width, height } = e.nativeEvent.layout;
            bannerRect.value = { x, y, w: width, h: height };
          }}
        >
          {children}
        </View>
      )}

      <View
        style={styles.zoom}
        pointerEvents="box-none"
        onLayout={(e) => {
          const { x, y, width, height } = e.nativeEvent.layout;
          zoomRect.value = { x, y, w: width, h: height };
        }}
      >
        <Pressable
          style={({ pressed }) => [styles.zoomBtn, pressed && styles.pressed, zoom <= MIN_ZOOM + 0.01 && styles.disabled]}
          onPress={() => stepZoom(-1)}
          disabled={zoom <= MIN_ZOOM + 0.01}
          accessibilityLabel="Thu nhỏ trang sách"
          hitSlop={6}
        >
          <ZoomOut size={18} color={colors.ink} />
        </Pressable>
        <Text style={styles.zoomLevel}>{zoom.toFixed(1)}×</Text>
        <Pressable
          style={({ pressed }) => [styles.zoomBtn, pressed && styles.pressed, zoom >= MAX_ZOOM - 0.01 && styles.disabled]}
          onPress={() => stepZoom(1)}
          disabled={zoom >= MAX_ZOOM - 0.01}
          accessibilityLabel="Phóng to trang sách"
          hitSlop={6}
        >
          <ZoomIn size={18} color={colors.ink} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  banner: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    maxWidth: '94%',
  },
  zoom: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    padding: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 252, 245, 0.92)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  zoomBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: 'rgba(43, 39, 33, 0.08)',
  },
  disabled: {
    opacity: 0.3,
  },
  zoomLevel: {
    minWidth: 34,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: colors.earth,
  },
});
