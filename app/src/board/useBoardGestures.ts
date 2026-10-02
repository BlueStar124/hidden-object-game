import { useCallback, useEffect, useMemo, useRef, type MutableRefObject, type RefObject } from 'react';
import { Platform, type View } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { cancelAnimation, useFrameCallback, useSharedValue, withDecay, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { PAGE_H, PAGE_W } from './constants';
import type { Camera } from './useCamera';

/**
 * Touch on the sketchbook (recognised natively, on the UI thread):
 * - drag the loupe (by its lens or wooden handle) — put down, it inspects under its crosshair;
 * - drag the page when zoomed in, pinch to zoom; mouse wheel / trackpad on the web;
 * - tap a spot to inspect it, or tap the loupe to inspect under its crosshair.
 * Off the painting (the desk) a tap or the loupe put down is no guess: no penalty.
 */

// Below this much movement a touch is a tap, above it a drag
const TAP_SLOP = 10;
// Dragging the loupe this close to an edge of a zoomed page scrolls the page along
const EDGE_ZONE = 44;
const EDGE_SPEED = 9; // px per frame at the very edge

const NONE = 0;
const PAGE = 1;
const LOUPE = 2;

type Rect = { x: number; y: number; w: number; h: number };

export interface BoardGestures {
  gesture: ReturnType<typeof Gesture.Simultaneous>;
  /** Screen rectangles of the controls over the board: touches starting there belong to them */
  zoomRect: SharedValue<Rect>;
  bannerRect: SharedValue<Rect>;
}

export function useBoardGestures(
  camera: Camera,
  /** False while a dialog covers the board or a page turns */
  enabledNow: boolean,
  onInspect: (nx: number, ny: number, screenPos: { x: number; y: number }) => void,
  /** The board's position in the window (inspection points are reported in window coordinates) */
  windowOffset: MutableRefObject<{ x: number; y: number }>,
  viewRef: RefObject<View | null>,
  turning: MutableRefObject<boolean>
): BoardGestures {
  const { s, tx, ty, lx, ly, dims, bounds, clampScale, placeLoupe, zoomTo, markZoomed } = camera;

  // Gesture Handler recognises gestures natively, under React views as well: the board must
  // ignore touches meant for whatever is on top of it
  const enabled = useSharedValue(enabledNow);
  useEffect(() => {
    enabled.value = enabledNow;
  }, [enabledNow, enabled]);
  const zoomRect = useSharedValue<Rect>({ x: 0, y: 0, w: 0, h: 0 });
  const bannerRect = useSharedValue<Rect>({ x: 0, y: 0, w: 0, h: 0 });

  const mode = useSharedValue(NONE);
  const grab = useSharedValue({ x: 0, y: 0 });
  const finger = useSharedValue({ x: 0, y: 0 });
  const panStart = useSharedValue({ tx: 0, ty: 0 });
  const pinchStart = useSharedValue({ s: 1, px: 0, py: 0 });

  const onControls = useCallback(
    (x: number, y: number) => {
      'worklet';
      const inside = (r: Rect) => r.w > 0 && x >= r.x - 6 && x <= r.x + r.w + 6 && y >= r.y - 6 && y <= r.y + r.h + 6;
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

  // Loupe held near the edge of a zoomed page: scroll the page under it
  useFrameCallback(() => {
    if (mode.value === LOUPE) {
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
      placeLoupe(f.x - grab.value.x, f.y - grab.value.y);
    } else {
      placeLoupe(lx.value, ly.value);
    }
  });

  /* -------------------------- Taps → the game (JS) -------------------------- */

  // The gesture is built once and reaches the game through this ref. The game's inspect handler
  // reads the state of the render it was created in; taps arrive here asynchronously from the UI
  // thread, so each one waits until the previous tap's update has rendered — two quick finds can
  // never be computed from the same stale state.
  const onInspectRef = useRef(onInspect);
  onInspectRef.current = onInspect;
  const pendingTap = useRef(false);
  const queuedTaps = useRef<[number, number, number, number][]>([]);
  const deliverTap = useCallback(
    (nx: number, ny: number, x: number, y: number) => {
      pendingTap.current = true;
      onInspectRef.current(nx, ny, { x: windowOffset.current.x + x, y: windowOffset.current.y + y });
      // A tap the game ignores (paused, page turning…) triggers no render: don't wait forever
      setTimeout(() => {
        if (!pendingTap.current) return;
        pendingTap.current = false;
        const next = queuedTaps.current.shift();
        if (next) deliverTap(...next);
      }, 300);
    },
    [windowOffset]
  );
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

  // Inspects the spot under a point of the board — if it is on the paper
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

  /* -------------------------------- Gestures -------------------------------- */

  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .maxPointers(1)
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
          placeLoupe(e.x - grab.value.x, e.y - grab.value.y);
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
        scheduleOnRN(markZoomed, s.value / dims.value.fit);
      });

    const tap = Gesture.Tap()
      .maxDuration(450)
      .maxDistance(TAP_SLOP)
      .onEnd((e, success) => {
        if (!success || onControls(e.x, e.y)) return;
        if (hitLoupe(e.x, e.y)) inspectAt(lx.value, ly.value);
        else inspectAt(e.x, e.y);
      });

    return Gesture.Simultaneous(pinch, Gesture.Race(pan, tap));
  }, [bounds, placeLoupe, clampScale, dims, enabled, finger, grab, hitLoupe, inspectAt, lx, ly, mode, onControls, panStart, pinchStart, s, markZoomed, tx, ty]);

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
  }, [zoomTo, s, dims, viewRef, turning]);

  return { gesture, zoomRect, bannerRect };
}
