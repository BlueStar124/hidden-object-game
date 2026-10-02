import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { Canvas, Picture, Skia, type SkImage, type SkPicture } from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  withDecay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { ZoomIn, ZoomOut } from '../ui/icons';
import type { HiddenObject, LevelData } from '@core/types/level';
import { PAGE_TURN_MS, type PageTurn } from '@core/hooks/useGame';
import { motionNow, objectPosition, roamState } from '../game/CreatureMotion';
import { analyzeScene, SAMPLE_WIDTH, type SceneAnalysis } from '../game/sceneAnalysis';
import { loadSceneImage, type LoadedScene } from '../platform/sceneImage';
import { colors } from '../theme';
import { MAX_ZOOM, MIN_ZOOM, PAGE_H, PAGE_W } from './constants';
import { createLoupePaints } from './paints';
import { recordPage, renderFrame, type FoundInfo, type FrameState, type PageFlip, type SceneData } from './renderer';
import { buildScene } from './scene';

// Room around the spread when it is fitted, and how far a zoomed page may be dragged past its edge
const FIT_PAD = 8;
const OVERSCROLL = 8;
// Dragging the loupe this close to an edge of a zoomed page scrolls the page along
const EDGE_ZONE = 44;
const EDGE_SPEED = 9; // px per frame at the very edge
const TAP_SLOP = 10;

// The leaf comes down a moment before the game opens the new page, so the swap never shows
const FLIP_MS = PAGE_TURN_MS - 80;
// How far the camera draws back at the height of a page turn
const FLIP_DRAW_BACK = 0.91;
// The pages around this one are prepared once it has settled
const SETTLE_MS = 500;
const NO_PAGES: LevelData[] = [];

/** A page turn, with the page it turns to. */
type Flip = PageFlip & { page: LevelData };

const NONE = 0;
const PAGE = 1;
const LOUPE = 2;

export interface BoardProps {
  level: LevelData;
  foundIds: string[];
  foundAt: Record<string, { x: number; y: number }>;
  radarTargetId: string | null;
  nudgeTarget: HiddenObject | null; // Hint tier 2
  /** The page turn in progress: the leaf turns over (left or right) to that page */
  turn: PageTurn | null;
  fogged: boolean;
  /** Same contract as the web sketchbook: normalized spread coords + the point on screen */
  onInspect: (nx: number, ny: number, screenPos: { x: number; y: number }) => void;
  /** Pages likely to be turned to next: decoded and laid out in the background */
  preload?: LevelData[];
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

const emptyPicture = (() => {
  const rec = Skia.PictureRecorder();
  rec.beginRecording(Skia.XYWHRect(0, 0, 1, 1));
  return rec.finishRecordingAsPicture();
})();

// Decoded artwork of the pages around the current one: turning back (or into a page's night,
// which reuses the day artwork) is instant, and the pages next door are decoded ahead of time
const sceneImages = new Map<string, LoadedScene>();
const loadingImages = new Set<string>();
const MAX_IMAGES = 5;

// What the artwork tells about a page (chameleon tints, where the paper is): read once per page
const analyses = new Map<string, SceneAnalysis>();
function analysisOf(level: LevelData, scene: LoadedScene): SceneAnalysis {
  let analysis = analyses.get(level.id);
  if (!analysis) {
    analysis = analyzeScene(scene.readPixels(SAMPLE_WIDTH), level.objects);
    analyses.set(level.id, analysis);
  }
  return analysis;
}

export const Board: React.FC<BoardProps> = ({
  level,
  foundIds,
  foundAt,
  radarTargetId,
  nudgeTarget,
  turn,
  fogged,
  onInspect,
  preload = NO_PAGES,
  active = true,
  children,
}) => {
  const win = useWindowDimensions();
  const compact = win.width < 640;

  const viewRef = useRef<View>(null);
  const windowOffset = useRef({ x: 0, y: 0 });
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  // Bumped whenever artwork finishes decoding (or a page has been laid out in the background)
  const [decoded, setDecoded] = useState(0);
  const [zoomLabel, setZoomLabel] = useState(1);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) => (prev && prev.w === width && prev.h === height ? prev : { w: width, h: height }));
    viewRef.current?.measureInWindow((x, y) => {
      windowOffset.current = { x, y };
    });
  }, []);

  /* ------------------------------- Scene data ------------------------------- */

  const diameter = size ? loupeDiameter(size.w, size.h) : 140;
  const loupePaints = useMemo(() => createLoupePaints(diameter), [diameter]);
  // Pages laid out for this loupe size and layout, ready to be drawn
  const scenes = useMemo(() => new Map<string, SceneData>(), [loupePaints, compact]);
  const prepare = useCallback(
    (page: LevelData): SceneData | null => {
      const cached = scenes.get(page.id);
      if (cached) return cached;
      const loaded = sceneImages.get(page.sceneImage);
      if (!loaded) return null;
      const { tints, book } = analysisOf(page, loaded);
      const prepared = buildScene({ level: page, image: loaded.image, tints, book, loupe: loupePaints, compact });
      scenes.set(page.id, prepared);
      return prepared;
    },
    [scenes, loupePaints, compact]
  );
  // (`decoded`: try again once the artwork has arrived)
  const scene = useMemo(() => prepare(level), [prepare, level, decoded]);
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
  const flipStart = useSharedValue(0);
  const nudge = useSharedValue<{ x: number; y: number; t: number } | null>(null);

  const enabled = useSharedValue(active);
  // Screen rectangles of the controls drawn over the board (zoom buttons, banner): touches
  // starting there belong to them, not to the sketchbook
  const zoomRect = useSharedValue({ x: 0, y: 0, w: 0, h: 0 });
  const bannerRect = useSharedValue({ x: 0, y: 0, w: 0, h: 0 });

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
  // While a page turns, the turn moves the camera
  const turning = useRef(false);
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
    const zoom = userZoomed.current ? Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prevZoom)) : 1;
    const scale = fit * zoom;
    s.value = scale;
    if (resized || !turning.current) {
      const b = bounds(scale);
      tx.value = (b.minX + b.maxX) / 2;
      ty.value = (b.minY + b.maxY) / 2;
    }
    // The loupe starts a little right of and below the middle of what is on screen; a new page
    // (whose paper sits a pixel or two elsewhere) leaves it where the player put it
    if (resized) clampLoupe(size.w * 0.6, size.h * 0.58);
    else clampLoupe(lx.value, ly.value);
    setZoomLabel(zoom);
  }, [size, bx, by, bw, bh, bounds, clampLoupe, dims, lx, ly, s, tx, ty]);

  // A new page opens on the middle of the spread (a page turn glides there itself)
  useEffect(() => {
    if (!placed.current) return;
    if (!turning.current) {
      const b = bounds(s.value);
      tx.value = (b.minX + b.maxX) / 2;
      ty.value = (b.minY + b.maxY) / 2;
    }
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
    nudge.value = nudgeTarget ? { x: nudgeTarget.x * PAGE_W, y: nudgeTarget.y * PAGE_H, t: motionNow() } : null;
  }, [nudgeTarget, nudge]);

  /* -------------------------------- Page turn -------------------------------- */

  const [flip, setFlip] = useState<Flip | null>(null);
  const [landed, setLanded] = useState(false);
  turning.current = flip !== null;

  useEffect(() => {
    enabled.value = active && !flip;
  }, [active, flip, enabled]);

  // The frame as it is on screen, to record a page with (optionally with the camera elsewhere)
  const frameFor = useCallback(
    (foundMap: Record<string, FoundInfo>, camera?: { tx: number; ty: number }): FrameState => ({
      now: motionNow(),
      width: dims.value.w,
      height: dims.value.h,
      s: s.value,
      tx: camera ? camera.tx : tx.value,
      ty: camera ? camera.ty : ty.value,
      lx: lx.value,
      ly: ly.value,
      found: foundMap,
      radar: null,
      fogStart: 0,
      nudge: null,
      flip: null,
      flipStart: 0,
      warm: [],
    }),
    [dims, lx, ly, s, tx, ty]
  );

  // While the leaf turns, the camera glides to the middle of the spread, drawing back a little
  // on the way so the raised leaf stays in view. The page being opened is recorded as it will
  // look from there
  const openTo = useCallback(
    (pending: Flip, next: SceneData): Flip => {
      const scale = s.value;
      const centre = (k: number) => {
        const b = bounds(k);
        return { tx: (b.minX + b.maxX) / 2, ty: (b.minY + b.maxY) / 2 };
      };
      const back = centre(scale * FLIP_DRAW_BACK);
      const camera = centre(scale);
      const leg = { duration: pending.duration / 2, easing: Easing.inOut(Easing.quad) };
      s.value = withSequence(withTiming(scale * FLIP_DRAW_BACK, leg), withTiming(scale, leg));
      tx.value = withSequence(withTiming(back.tx, leg), withTiming(camera.tx, leg));
      ty.value = withSequence(withTiming(back.ty, leg), withTiming(camera.ty, leg));
      return { ...pending, to: recordPage(next, frameFor({}, camera)), S: next };
    },
    [bounds, frameFor, s, tx, ty]
  );

  // A turn begins: the page as it is now, stamps and all, becomes the leaf. It goes as soon as
  // the page it turns to is ready — usually at once, the neighbours being prepared ahead
  const turnSeen = useRef<PageTurn | null>(null);
  useEffect(() => {
    if (!turn || turnSeen.current === turn || !shown) return;
    turnSeen.current = turn;
    flipStart.value = 0;
    setLanded(false);
    const pending: Flip = {
      from: recordPage(shown, frameFor(foundRef.current.map)),
      to: null,
      dir: turn.direction,
      S: shown,
      duration: FLIP_MS,
      page: turn.level,
    };
    const next = prepare(turn.level);
    setFlip(next ? openTo(pending, next) : pending);
  }, [turn, shown, frameFor, flipStart, prepare, openTo]);

  // …or once its artwork has decoded
  useEffect(() => {
    if (!flip || flip.to) return;
    const next = prepare(flip.page);
    if (next) setFlip(openTo(flip, next));
  }, [flip, prepare, decoded, openTo]);

  const flipTo = flip?.to ?? null;
  const flipDuration = flip?.duration ?? 0;
  useEffect(() => {
    if (!flipTo) return;
    flipStart.value = motionNow();
    const t = setTimeout(() => setLanded(true), flipDuration);
    return () => clearTimeout(t);
  }, [flipTo, flipDuration, flipStart]);

  // Landed: back to the live page once the game has opened it (the last frame holds until then)
  useEffect(() => {
    if (!flip || !landed || !scene) return;
    if (level.id !== flip.page.id && turn) return;
    flipStart.value = 0;
    setFlip(null);
  }, [flip, landed, scene, level.id, turn, flipStart]);

  // What the frame worklet needs of the turn
  const flipFrame = useMemo<PageFlip | null>(
    () => (flip ? { from: flip.from, to: flip.to, dir: flip.dir, S: flip.S, duration: flip.duration } : null),
    [flip]
  );

  /* ------------------------- Pages around this one ------------------------- */

  // Once this page has settled (never during a turn), the neighbours are decoded and laid out,
  // one at a time, so that turning to them costs nothing
  const [around, setAround] = useState<LevelData[]>(NO_PAGES);
  useEffect(() => {
    if (flip) return;
    const t = setTimeout(() => setAround(preload), SETTLE_MS);
    return () => clearTimeout(t);
  }, [preload, flip]);
  useEffect(() => {
    if (flip) return;
    const page = around.find((p) => !scenes.has(p.id) && sceneImages.has(p.sceneImage));
    if (!page) return;
    const t = setTimeout(() => {
      prepare(page);
      setDecoded((n) => n + 1); // on to the next one
    }, 120);
    return () => clearTimeout(t);
  }, [around, decoded, flip, prepare, scenes]);

  const sources = useMemo(() => {
    const list = [level.sceneImage];
    if (flip) list.push(flip.page.sceneImage);
    for (const p of around) list.push(p.sceneImage);
    return [...new Set(list)];
  }, [level.sceneImage, flip, around]);

  // The artwork of this page, the one it turns to and its neighbours is loaded; only that stays
  useEffect(() => {
    for (const src of sources) {
      if (sceneImages.has(src) || loadingImages.has(src)) continue;
      loadingImages.add(src);
      loadSceneImage(src)
        .then((loaded) => {
          sceneImages.set(src, loaded);
          setDecoded((n) => n + 1);
        })
        .catch((e) => console.warn(e))
        .finally(() => loadingImages.delete(src));
    }
  }, [sources]);
  useEffect(() => {
    for (const src of [...sceneImages.keys()]) {
      if (sceneImages.size <= MAX_IMAGES) break;
      if (!sources.includes(src)) sceneImages.delete(src);
    }
    const alive = new Set([...sceneImages.values()].map((loaded) => loaded.image));
    for (const [id, prepared] of scenes) if (!alive.has(prepared.image)) scenes.delete(id);
  }, [sources, decoded, scenes]);

  // The neighbours' artwork is kept on the GPU as well (see renderFrame). Same images, same
  // array: the frame worklet is only rebuilt when they change
  const warmRef = useRef<SkImage[]>([]);
  const warm = useMemo(() => {
    const images = around.map((p) => sceneImages.get(p.sceneImage)?.image).filter((img): img is SkImage => !!img);
    const prev = warmRef.current;
    if (images.length === prev.length && images.every((img, i) => img === prev[i])) return prev;
    warmRef.current = images;
    return images;
  }, [around, decoded]);

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
    const base = shown ?? flipFrame?.S;
    if (!base) return emptyPicture;
    const { w, h } = dims.value;
    return renderFrame(base, {
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
      nudge: nudge.value,
      flip: flipFrame,
      flipStart: flipStart.value,
      warm,
    });
  }, [shown, flipFrame, warm]);

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
  const zoomIdle = flip !== null;
  // The buttons move in tenths of what the label shows (1.0×, 1.1×, 1.2×…), also after a pinch
  const stepZoom = (dir: 1 | -1) => zoomTo((Math.round(zoom * 10) + dir) / 10);

  // Browsers: mouse wheel / trackpad pinch zooms around the pointer
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = viewRef.current as unknown as HTMLElement | null;
    if (!node?.addEventListener) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (turning.current) return; // the page turn moves the camera
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
          disabled={zoomIdle || zoom <= MIN_ZOOM + 0.01}
          accessibilityLabel="Thu nhỏ trang sách"
          hitSlop={6}
        >
          <ZoomOut size={18} color={colors.ink} />
        </Pressable>
        <Text style={styles.zoomLevel}>{zoom.toFixed(1)}×</Text>
        <Pressable
          style={({ pressed }) => [styles.zoomBtn, pressed && styles.pressed, zoom >= MAX_ZOOM - 0.01 && styles.disabled]}
          onPress={() => stepZoom(1)}
          disabled={zoomIdle || zoom >= MAX_ZOOM - 0.01}
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
