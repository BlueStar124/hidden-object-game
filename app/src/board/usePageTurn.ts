import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';
import { PAGE_TURN_MS, type Page, type PageTurn } from '../core/model';
import { motionNow } from '../core/motion';
import { recordPage, type FoundInfo, type FrameState, type PageFlip, type SceneData } from './render';
import type { Camera } from './useCamera';
import type { SceneLibrary } from './useSceneLibrary';

/**
 * A page turning over, from the game's request (`turn`) to the live new page:
 *
 * 1. the page on screen is recorded flat (stamps and all): it becomes the leaf;
 * 2. as soon as the page it turns to is prepared — usually at once, the neighbours being prepared
 *    ahead — that one is recorded too, the leaf starts to turn and the camera glides to the middle
 *    of the spread while keeping the player's zoom;
 * 3. the last frame holds until the game has opened the new page; then the board draws it live.
 */

// The leaf comes down a moment before the game opens the new page, so the swap never shows
const FLIP_MS = PAGE_TURN_MS - 80;

/** A turn, with the page it turns to. */
type Flip = PageFlip & { page: Page };

export interface PageTurnState {
  /** What the frame worklet needs of the turn (null: no turn on screen) */
  flip: PageFlip | null;
  /** When the leaf started to turn, on the creature clock (0: not yet) */
  flipStart: SharedValue<number>;
  /** The page being turned to, while a turn is on screen */
  turningTo: Page | null;
}

export function usePageTurn(
  turn: PageTurn | null,
  page: Page,
  library: SceneLibrary,
  camera: Camera,
  foundNow: () => Record<string, FoundInfo>,
  turning: MutableRefObject<boolean>
): PageTurnState {
  const [flip, setFlip] = useState<Flip | null>(null);
  const [landed, setLanded] = useState(false);
  const flipStart = useSharedValue(0);
  turning.current = flip !== null;

  const { s, tx, ty, lx, ly, dims, centre } = camera;
  const { scene, shown, prepare, version } = library;

  // The frame as it is on screen, to record a page with (optionally with the camera elsewhere)
  const frameFor = useCallback(
    (found: Record<string, FoundInfo>, at?: { tx: number; ty: number }): FrameState => ({
      now: motionNow(),
      width: dims.value.w,
      height: dims.value.h,
      s: s.value,
      tx: at ? at.tx : tx.value,
      ty: at ? at.ty : ty.value,
      lx: lx.value,
      ly: ly.value,
      found,
      radar: null,
      fogStart: 0,
      nudge: null,
      flip: null,
      flipStart: 0,
      warm: [],
    }),
    [dims, lx, ly, s, tx, ty]
  );

  // The page being opened is recorded as it will look once the camera has settled
  const openTo = useCallback(
    (pending: Flip, next: SceneData): Flip => {
      const scale = s.value;
      const settled = centre(scale);
      return {
        ...pending,
        to: recordPage(next, frameFor({}, settled)),
        S: next,
        camera: { fromX: tx.value, fromY: ty.value, toX: settled.tx, toY: settled.ty },
      };
    },
    [centre, frameFor, s, tx, ty]
  );

  // 1. A turn begins
  const turnSeen = useRef<PageTurn | null>(null);
  useEffect(() => {
    if (!turn || turnSeen.current === turn || !shown) return;
    turnSeen.current = turn;
    setLanded(false);
    const pending: Flip = {
      from: recordPage(shown, frameFor(foundNow())),
      to: null,
      dir: turn.direction,
      S: shown,
      duration: FLIP_MS,
      page: turn.to,
    };
    const next = prepare(turn.to);
    setFlip(next ? openTo(pending, next) : pending);
  }, [turn, shown, frameFor, foundNow, prepare, openTo]);

  // 2. …or once the artwork of the page it turns to has decoded
  useEffect(() => {
    if (!flip || flip.to) return;
    const next = prepare(flip.page);
    if (next) setFlip(openTo(flip, next));
  }, [flip, prepare, version, openTo]);

  // The clock of a turn starts when the page it opens is there. (Never reset it to 0 while a turn
  // is on screen: until React has dropped that turn, the frame would show its first page again —
  // the old page flashing back.) This effect runs before the frame worklet picks up the new turn
  const flipTo = flip?.to ?? null;
  const flipDuration = flip?.duration ?? 0;
  useEffect(() => {
    if (!flipTo) return;
    flipStart.value = motionNow();
    const t = setTimeout(() => setLanded(true), flipDuration);
    return () => clearTimeout(t);
  }, [flipTo, flipDuration, flipStart]);

  // 3. Landed: back to the live page once the game has opened it
  useEffect(() => {
    if (!flip || !landed || !scene) return;
    if (page.id !== flip.page.id && turn) return;
    if (flip.camera) {
      tx.value = flip.camera.toX;
      ty.value = flip.camera.toY;
    }
    setFlip(null);
  }, [flip, landed, scene, page.id, turn, tx, ty]);

  const flipFrame = useMemo<PageFlip | null>(
    () => (flip ? { from: flip.from, to: flip.to, dir: flip.dir, S: flip.S, duration: flip.duration, camera: flip.camera } : null),
    [flip]
  );

  return { flip: flipFrame, flipStart, turningTo: flip?.page ?? null };
}
