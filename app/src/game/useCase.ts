import { useCallback, useEffect, useRef, useState } from 'react';
import {
  clockTick,
  openCase,
  recordExploreFind,
  recordFind,
  recordHint,
  recordMiss,
} from '../core/caseFile';
import { detectObject } from '../core/detection';
import { nextHint } from '../core/hints';
import type { CaseState, Page } from '../core/model';
import { progress } from '../core/progress';
import { sound } from '../platform/sound';
import type { Notify } from './useNotices';

// Anti-spam: this many wrong taps within the window mists up the loupe for a moment
const FOG_MISSES = 4;
const FOG_WINDOW_MS = 3000;
const FOG_DURATION_MS = 3000;

/** The case of the page being played, and what the player can do in it. */
export interface Case {
  state: CaseState;
  /** The loupe is misted up: nothing can be inspected for a moment */
  isFogged: boolean;
  /** Set when this victory opened the page's night variant for the first time (its title) */
  unlockedNight: string | null;
  screenShake: boolean;
  inspect: (nx: number, ny: number, at: { x: number; y: number }) => void;
  requestHint: (targetObjectId?: string) => void;
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
  },
  notify: Notify
): Case {
  const { clockRuns, isTurning, nextPage, night } = context;

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

  // After the case is closed: the remaining critters & secret go into the album (no score)
  const inspectWhileExploring = useCallback(
    (nx: number, ny: number, at: { x: number; y: number }) => {
      const leftovers = page.objects.filter((o) => o.isBonus || o.isSecret);
      const result = detectObject(nx, ny, leftovers, c.foundItems);
      if (result.hit && result.object) {
        const found = result.object;
        sound.playFound(1);
        sound.playVoice(found.spriteType);
        progress.recordDiscovery(page.id, found.id);
        notify(`${found.name} · đã ghi vào Sổ Tay!`, at, 'info');
        update((s) => recordExploreFind(s, found, result.position));
      } else if (result.hidingObject) {
        sound.playRustle();
        notify('Suỵt… nó vừa trốn mất! Chờ nó ló ra nhé', at, 'info');
      }
    },
    [page, c.foundItems, notify, update]
  );

  const inspect = useCallback(
    (nx: number, ny: number, at: { x: number; y: number }) => {
      if (c.isPaused || c.isGameOver || isTurning) return;
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
        const found = result.object;
        recentMisses.current.at = [];
        sound.playFound(c.combo);
        sound.playVoice(found.spriteType);
        progress.recordDiscovery(page.id, found.id);

        const find = recordFind(c, page, found, result.position);
        const tag = found.isBonus ? ' · Sinh vật ẩn!' : found.isSecret ? ' · Bí mật!' : '';
        notify(`+${find.earned}${find.combo > 1 ? ` (×${find.combo})` : ''}${tag}`, at);

        let unlockedNight: string | null | undefined;
        if (find.solved) {
          sound.playVictory();
          const wasPassed = (progress.pageResult(page.id)?.stars ?? 0) > 0;
          const foundItems = find.changes.foundItems ?? c.foundItems;
          const critters = page.objects.filter((o) => o.isBonus && foundItems.includes(o.id)).map((o) => o.id);
          progress.recordVictory(
            page.id,
            nextPage?.id ?? null,
            find.solved.score,
            find.solved.stars,
            page.timeLimit - c.remainingTime,
            critters
          );
          // First clear of a day page opens its night variant
          unlockedNight = !wasPassed && night ? night.title : null;
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
    [c, page, isTurning, fogUntil, nextPage, night, notify, inspectWhileExploring]
  );

  const requestHint = useCallback(
    (targetObjectId?: string) => {
      if (c.isCompleted || c.isPaused || c.isGameOver) return;
      const hint = nextHint(
        c.activeHint,
        c.revealedTextIds ?? [],
        page.objects,
        c.foundItems,
        lastLoupePos.current,
        targetObjectId
      );
      if (!hint) return;
      sound.playHint();
      update((s) => recordHint(s, hint));
    },
    [c, page, update]
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
    inspect,
    requestHint,
    togglePause,
    explore,
  };
}
