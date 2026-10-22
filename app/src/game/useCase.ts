import { useCallback, useEffect, useRef, useState } from 'react';
import {
  clockTick,
  openCase,
  recordExploreFind,
  recordFind,
  recordHint,
  recordMiss,
} from '../core/caseFile';
import { isFriendChallenge } from '../core/challenge';
import { inFocus } from '../core/daily';
import { detectObject } from '../core/detection';
import { nextHint } from '../core/hints';
import { isOptionalObject, type CaseState, type HiddenObject, type Page } from '../core/model';
import { canAffordHint, hintCost } from '../core/scoring';
import { sound } from '../platform/sound';
import type { PlayMode } from './useNavigation';
import type { Notify } from './useNotices';
import { handleDiscovery, handleVictoryRecord } from './useCaseEffects';

// Anti-spam: this many wrong taps within the window mists up the loupe for a moment
const FOG_MISSES = 4;
const FOG_WINDOW_MS = 3000;
const FOG_DURATION_MS = 3000;

export interface HintRefusal {
  needed: number;
  current: number;
  timestamp: number;
}

/** The case of the page being played, and what the player can do in it. */
export interface Case {
  state: CaseState;
  /** The loupe is misted up: nothing can be inspected for a moment */
  isFogged: boolean;
  /** Set when this victory opened the page's night variant for the first time (its title) */
  unlockedNight: string | null;
  screenShake: boolean;
  hintRefusal: HintRefusal | null;
  inspect: (nx: number, ny: number, at: { x: number; y: number }) => void;
  /** `at`: where to say so (screen point) when the score cannot pay for the hint. Returns true if granted. */
  requestHint: (targetObjectId: string | undefined, at: { x: number; y: number }) => boolean;
  togglePause: () => void;
  /** After the case is closed: keep hunting the critters & secret left (no clock, no score) */
  explore: (exploring: boolean) => void;
}

interface Store {
  visit: number;
  state: CaseState;
  fogUntil: number;
  unlockedNight: string | null;
}

const open = (visit: number, page: Page): Store => ({ visit, state: openCase(page), fogUntil: 0, unlockedNight: null });

export function useCase(
  page: Page,
  visit: number,
  context: {
    /** The clock runs (no story card open over the page) */
    clockRuns: boolean;
    isTurning: boolean;
    /** The page after this one: clearing this page unlocks it */
    nextPage: Page | null;
    /** This page's night variant (when this is a day page that has one) */
    night: Page | undefined;
    /** A daily page earns a passport stamp rather than counting as playing the page */
    mode: PlayMode;
    isNight?: boolean;
  },
  notify: Notify
): Case {
  const { clockRuns, isTurning, nextPage, night, mode, isNight = false } = context;
  const friendHunt = mode.kind === 'challenge' && isFriendChallenge(mode.challenge);

  // A page opened (or opened again) starts a new case — in the same render, so nothing of the
  // previous case ever shows on the new page
  const [stored, setStore] = useState<Store>(() => open(visit, page));
  let store = stored;
  if (stored.visit !== visit) {
    store = open(visit, page);
    setStore(store);
  }
  const c = store.state;
  const { fogUntil } = store;
  const update = useCallback((change: (s: CaseState) => CaseState) => setStore((s) => ({ ...s, state: change(s.state) })), []);

  const [screenShake, setScreenShake] = useState(false);
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setScreenShake(false);
    return () => {
      if (shakeTimer.current !== null) clearTimeout(shakeTimer.current);
      shakeTimer.current = null;
    };
  }, [visit]);
  const [hintRefusal, setHintRefusal] = useState<HintRefusal | null>(null);
  useEffect(() => {
    setHintRefusal(null);
  }, [visit]);
  const lastLoupePos = useRef({ nx: 0.5, ny: 0.5 });
  const recentMisses = useRef({ visit, at: [] as number[] });
  const lastFogNotice = useRef(0);
  if (recentMisses.current.visit !== visit) recentMisses.current = { visit, at: [] };

  // The mist lifts by itself
  useEffect(() => {
    if (!fogUntil) return;
    const t = setTimeout(() => setStore((s) => ({ ...s, fogUntil: 0 })), Math.max(0, fogUntil - Date.now()));
    return () => clearTimeout(t);
  }, [fogUntil]);

  // The clock: one second at a time, while the investigation is on
  useEffect(() => {
    if (c.isPaused || c.isCompleted || c.isGameOver || !clockRuns) return;
    const timer = setInterval(() => update(clockTick), 1000);
    return () => clearInterval(timer);
  }, [c.isPaused, c.isCompleted, c.isGameOver, clockRuns, update]);

  const discover = useCallback(
    (found: HiddenObject, at: { x: number; y: number }) => {
      handleDiscovery(found, at, page.id, friendHunt, notify);
    },
    [page.id, friendHunt, notify]
  );

  // After the case is closed: the remaining critters, clues & secret go into the album (no score)
  const inspectWhileExploring = useCallback(
    (nx: number, ny: number, at: { x: number; y: number }) => {
      const leftovers = page.objects.filter(isOptionalObject);
      const result = detectObject(nx, ny, leftovers, c.foundItems);
      if (result.hit && result.object) {
        const found = result.object;
        sound.playFound(1);
        sound.playVoice(found.spriteType);
        discover(found, at);
        notify(found.isClue ? `${found.name} · mảnh manh mối!` : `${found.name} · đã ghi vào Sổ Tay!`, at, 'info');
        update((s) => recordExploreFind(s, found, result.position));
      } else if (result.hidingObject) {
        sound.playRustle();
        notify('Suỵt… nó vừa trốn mất! Chờ nó ló ra nhé', at, 'info');
      }
    },
    [page, c.foundItems, notify, update, discover]
  );

  const inspect = useCallback(
    (nx: number, ny: number, at: { x: number; y: number }) => {
      if (c.isPaused || c.isGameOver || isTurning) return;
      // A daily page: only its corner is in play (no mistake for a tap beside it)
      if (!inFocus(page, nx, ny)) return;
      if (c.isCompleted) {
        if (c.isExploring) inspectWhileExploring(nx, ny, at);
        return;
      }
      lastLoupePos.current = { nx, ny };

      // Misted loupe: nothing can be inspected until it clears
      if (Date.now() < fogUntil) {
        if (Date.now() - lastFogNotice.current > 900) {
          lastFogNotice.current = Date.now();
          notify('Kính lúp còn mờ hơi nước…', at, 'info');
        }
        return;
      }

      const result = detectObject(nx, ny, page.objects, c.foundItems);

      if (result.hit && result.object) {
        setHintRefusal(null);
        const found = result.object;
        recentMisses.current.at = [];
        sound.playFound(c.combo);
        sound.playVoice(found.spriteType);
        discover(found, at);

        const find = recordFind(c, page, found, result.position);
        const tag = found.isBonus ? ' · Sinh vật ẩn!' : found.isSecret ? ' · Bí mật!' : found.isClue ? ' · Mảnh manh mối!' : '';
        notify(`+${find.earned}${find.combo > 1 ? ` (×${find.combo})` : ''}${tag}`, at);

        let unlockedNight: string | null | undefined;
        if (find.solved) {
          const foundItems = find.changes.foundItems ?? c.foundItems;
          unlockedNight = handleVictoryRecord(
            find.solved,
            page,
            c,
            mode,
            friendHunt,
            nextPage,
            night,
            isNight,
            foundItems
          );
        }
        setStore((s) => ({
          ...s,
          state: { ...s.state, ...find.changes },
          unlockedNight: unlockedNight === undefined ? s.unlockedNight : unlockedNight,
        }));
      } else if (result.hidingObject) {
        // Right spot, wrong moment: the shy creature has ducked out of sight
        sound.playRustle();
        notify('Suỵt… nó vừa trốn mất! Chờ nó ló ra nhé', at, 'info');
      } else if (result.outOfTurn) {
        // Right object, too early: the trail is followed in order
        sound.playRustle();
        notify('Chưa tới lượt! Lần theo dấu vết đúng thứ tự nhé', at, 'info');
      } else {
        // A wrong guess; a burst of them mists up the loupe
        const now = Date.now();
        const misses = [...recentMisses.current.at.filter((t) => now - t < FOG_WINDOW_MS), now];
        const fogged = misses.length >= FOG_MISSES;
        recentMisses.current.at = fogged ? [] : misses;
        if (fogged) {
          lastFogNotice.current = now;
          sound.playFog();
          notify('Kính lúp mờ hơi nước! Bình tĩnh quan sát nào…', at, 'info');
        } else {
          sound.playWrong();
        }
        setScreenShake(true);
        if (shakeTimer.current !== null) clearTimeout(shakeTimer.current);
        shakeTimer.current = setTimeout(() => {
          shakeTimer.current = null;
          setScreenShake(false);
        }, 350);
        setStore((s) => ({ ...s, state: recordMiss(s.state), fogUntil: fogged ? now + FOG_DURATION_MS : s.fogUntil }));
      }
    },
    [c, page, isTurning, fogUntil, nextPage, night, mode, isNight, friendHunt, notify, inspectWhileExploring, discover]
  );

  const requestHint = useCallback(
    (targetObjectId: string | undefined, at: { x: number; y: number }): boolean => {
      if (c.isCompleted || c.isPaused || c.isGameOver) return false;
      const hint = nextHint(
        c.activeHint,
        c.revealedTextIds ?? [],
        page.objects,
        c.foundItems,
        lastLoupePos.current,
        targetObjectId
      );
      if (!hint) return false;
      const isFree = hint.level === 1 && !c.freeHintUsed;
      if (!canAffordHint(c.score, hint.level, isFree)) {
        sound.playWrong();
        const needed = hintCost(hint.level, isFree);
        notify(`Cần ${needed} điểm để dùng gợi ý này (bạn có ${c.score} điểm) — tìm thêm vật nhé!`, at, 'info');
        setHintRefusal({ needed, current: c.score, timestamp: Date.now() });
        return false;
      }
      sound.playHint();
      setHintRefusal(null);
      update((s) => recordHint(s, hint));
      return true;
    },
    [c, page, update, notify]
  );

  const togglePause = useCallback(() => update((s) => ({ ...s, isPaused: !s.isPaused })), [update]);

  const explore = useCallback(
    (exploring: boolean) => update((s) => (s.isCompleted ? { ...s, isExploring: exploring } : s)),
    [update]
  );

  return {
    state: c,
    isFogged: fogUntil > 0,
    unlockedNight: store.unlockedNight,
    screenShake,
    hintRefusal,
    inspect,
    requestHint,
    togglePause,
    explore,
  };
}
