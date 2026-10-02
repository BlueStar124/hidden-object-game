import { useCallback, useEffect, useRef } from 'react';
import { Easing, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import type { HiddenObject, Page } from '../core/model';
import { motionNow, objectPosition, roamState } from '../core/motion';
import { PAGE_H, PAGE_W } from './constants';
import type { FoundInfo } from './render';
import type { Camera } from './useCamera';

/**
 * The state of the case, handed to the UI thread for the renderer: what was found (and when, so
 * it can bloom back into colour), the hint radar and nudge, and the misted loupe.
 */
export interface CaseMarks {
  found: SharedValue<Record<string, FoundInfo>>;
  radar: SharedValue<string | null>;
  fogStart: SharedValue<number>;
  nudge: SharedValue<{ x: number; y: number; t: number } | null>;
  /** The found objects as they are now (to record the page for a turn) */
  foundNow: () => Record<string, FoundInfo>;
}

export function useCaseMarks(
  page: Page,
  foundIds: string[],
  foundAt: Record<string, { x: number; y: number }>,
  radarTargetId: string | null,
  nudgeTarget: HiddenObject | null,
  fogged: boolean,
  camera: Camera
): CaseMarks {
  const found = useSharedValue<Record<string, FoundInfo>>({});
  const radar = useSharedValue<string | null>(null);
  const fogStart = useSharedValue(0);
  const nudge = useSharedValue<{ x: number; y: number; t: number } | null>(null);

  const foundRef = useRef<{ page: string; map: Record<string, FoundInfo> }>({ page: page.id, map: {} });
  useEffect(() => {
    // A new page starts with nothing found (replays too: ids missing from foundIds are dropped)
    const newPage = foundRef.current.page !== page.id;
    if (newPage) foundRef.current = { page: page.id, map: {} };
    const map = { ...foundRef.current.map };
    const now = motionNow();
    let changed = false;
    for (const id of foundIds) {
      if (map[id]) continue;
      const obj = page.objects.find((o) => o.id === id);
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
  }, [foundIds, foundAt, page, found]);

  // Hint tier 3: the radar pulses on the target — glide the page there if it is off screen
  const { bounds, dims, s, tx, ty } = camera;
  useEffect(() => {
    radar.value = radarTargetId;
    const target = radarTargetId ? page.objects.find((o) => o.id === radarTargetId) : undefined;
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
  }, [radarTargetId, page, radar, bounds, dims, s, tx, ty]);

  useEffect(() => {
    fogStart.value = fogged ? motionNow() : 0;
  }, [fogged, fogStart]);

  // Hint tier 2: the loupe tugs towards the target
  useEffect(() => {
    nudge.value = nudgeTarget ? { x: nudgeTarget.x * PAGE_W, y: nudgeTarget.y * PAGE_H, t: motionNow() } : null;
  }, [nudgeTarget, nudge]);

  const foundNow = useCallback(() => foundRef.current.map, []);
  return { found, radar, fogStart, nudge, foundNow };
}
