import React, { useCallback, useMemo, useRef, useState } from 'react';
import { PixelRatio, Pressable, StyleSheet, Text, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { Canvas, Picture, Skia, type SkPicture } from '@shopify/react-native-skia';
import { GestureDetector } from 'react-native-gesture-handler';
import { useDerivedValue, useFrameCallback, useSharedValue } from 'react-native-reanimated';
import type { HiddenObject, Page, PageTurn } from '../core/model';
import { motionNow } from '../core/motion';
import { ZoomIn, ZoomOut } from '../ui/icons';
import { colors } from '../ui/theme';
import { MAX_ZOOM, MIN_ZOOM } from './constants';
import { renderFrame } from './render';
import { createLoupePaints } from './scene/paints';
import { atlasDensity } from './scene/spriteAtlas';
import { useBoardGestures } from './useBoardGestures';
import { fittedScale, loupeDiameter, useCamera } from './useCamera';
import { useCaseMarks } from './useCaseMarks';
import { usePageTurn } from './usePageTurn';
import { usePagesAround } from './usePagesAround';
import { useSceneLibrary } from './useSceneLibrary';
import { useWarmUp } from './useWarmUp';

/**
 * The sketchbook: the painted page with its hidden objects, the loupe, the zoom buttons. Drawn
 * with Skia, one picture per frame on the UI thread (render/), from pages prepared on the JS
 * thread (scene/). The pieces:
 *
 *   useSceneLibrary  artwork decoded & pages laid out, ready to draw
 *   useCamera        zoom & pan, and where the loupe lies
 *   useCaseMarks     the case's state for the renderer (found, radar, mist, nudge)
 *   usePageTurn      a page turning over to the next one
 *   usePagesAround   the neighbouring pages, prepared ahead
 *   useWarmUp        the GPU set up for what is still to come, while a dialog covers the board
 *   useBoardGestures touch, pinch, wheel → camera, loupe and inspections
 */

export interface BoardProps {
  page: Page;
  foundIds: string[];
  foundAt: Record<string, { x: number; y: number }>;
  radarTargetId: string | null;
  nudgeTarget: HiddenObject | null; // Hint tier 2
  /** The page turn in progress: the leaf turns over (left or right) to that page */
  turn: PageTurn | null;
  fogged: boolean;
  /** A spot to inspect: normalized spread coordinates, and the point in the window */
  onInspect: (nx: number, ny: number, screenPos: { x: number; y: number }) => void;
  /** Pages likely to be turned to next: decoded and laid out in the background */
  preload: Page[];
  /** False while a dialog covers the board */
  active?: boolean;
  children?: React.ReactNode; // overlays (explore banner…)
}

const emptyPicture = (() => {
  const rec = Skia.PictureRecorder();
  rec.beginRecording(Skia.XYWHRect(0, 0, 1, 1));
  return rec.finishRecordingAsPicture();
})();

export const Board = React.memo<BoardProps>(function Board({
  page,
  foundIds,
  foundAt,
  radarTargetId,
  nudgeTarget,
  turn,
  fogged,
  onInspect,
  preload,
  active = true,
  children,
}) {
  const win = useWindowDimensions();
  const compact = win.width < 640;

  const viewRef = useRef<View>(null);
  const windowOffset = useRef({ x: 0, y: 0 });
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) => (prev && prev.w === width && prev.h === height ? prev : { w: width, h: height }));
    viewRef.current?.measureInWindow((x, y) => {
      windowOffset.current = { x, y };
    });
  }, []);

  const diameter = size ? loupeDiameter(size.w, size.h) : 140;
  const loupePaints = useMemo(() => createLoupePaints(diameter, PixelRatio.get()), [diameter]);
  // While a page turns, the turn moves the camera (the hooks below read it during their effects)
  const turning = useRef(false);

  // The order of these hooks is the order their effects run in: keep it
  const density = size ? atlasDensity(fittedScale(size.w, size.h), PixelRatio.get()) : 1;
  const library = useSceneLibrary(page, loupePaints, compact, density);
  const camera = useCamera(size, library.shown, page.id, diameter, turning);
  const marks = useCaseMarks(page, foundIds, foundAt, radarTargetId, nudgeTarget, fogged, camera);
  const pageTurn = usePageTurn(turn, page, library, camera, marks.foundNow, turning);
  const warm = usePagesAround(library, page, preload, pageTurn.turningTo);
  const warmUp = useWarmUp(library.scene, !active, camera);

  /* --------------------------------- Frame --------------------------------- */

  const clock = useSharedValue(motionNow());
  useFrameCallback(() => {
    clock.value = motionNow();
  });
  const { shown } = library;
  const { flip, flipStart } = pageTurn;
  const { s, tx, ty, lx, ly, dims } = camera;
  const { found, radar, fogStart, nudge } = marks;
  const picture = useDerivedValue<SkPicture>(() => {
    const base = shown ?? flip?.S;
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
      flip,
      flipStart: flipStart.value,
      warm,
      warmUp,
    });
  }, [shown, flip, warm, warmUp]);

  const { gesture, zoomRect, bannerRect } = useBoardGestures(camera, active && !flip, onInspect, windowOffset, viewRef, turning);

  /* ------------------------------ Zoom buttons ------------------------------ */

  const { zoom, zoomTo } = camera;
  // The buttons move in tenths of what the label shows (1.0×, 1.1×, 1.2×…), also after a pinch
  const stepZoom = (dir: 1 | -1) => zoomTo((Math.round(zoom * 10) + dir) / 10);
  const zoomIdle = flip !== null; // the page turn moves the camera

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
});

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
