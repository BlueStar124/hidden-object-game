import type { DailyStamp, GameProgress, PageResult } from './model';
import { Fields, isRecord, latestStamps, readProgress, SCHEMA_VERSION } from './progressSchema';

export const union = (a: string[] = [], b: string[] = []) => Array.from(new Set([...a, ...b]));

export function mergeResult(a: PageResult | undefined, b: PageResult | undefined): PageResult {
  if (!a || !b) return (a ?? b)!;
  const times = [a.bestTime, b.bestTime].filter((t) => t > 0);
  return {
    ...b,
    ...a,
    stars: Math.max(a.stars, b.stars),
    highScore: Math.max(a.highScore, b.highScore),
    bestTime: times.length ? Math.min(...times) : 0,
    completedAt: a.completedAt > b.completedAt ? a.completedAt : b.completedAt,
    creaturesFound: union(a.creaturesFound, b.creaturesFound),
  };
}

/**
 * Two saves as one, losing nothing of either: every page keeps its best stars, score and time,
 * every find and stamp is kept. Where only one can win (the cover, settings, the page the player is
 * in), `current` does — unless it has none. Both are read with readProgress first.
 */
export function mergeProgress(current: GameProgress, other: GameProgress): GameProgress {
  const sceneResults: Record<string, PageResult> = {};
  for (const id of union(Object.keys(current.sceneResults), Object.keys(other.sceneResults))) {
    sceneResults[id] = mergeResult(current.sceneResults[id], other.sceneResults[id]);
  }
  const discovered: Record<string, string[]> = {};
  for (const id of union(Object.keys(current.discovered), Object.keys(other.discovered))) {
    discovered[id] = union(current.discovered[id], other.discovered[id]);
  }
  const stamps: Record<string, DailyStamp> = { ...other.stamps };
  for (const [day, stamp] of Object.entries(current.stamps ?? {})) {
    if (!stamps[day] || stamp.time <= stamps[day].time) stamps[day] = stamp;
  }
  const solved = union(current.solvedMysteries, other.solvedMysteries);
  const rare = union(current.rareFound, other.rareFound);
  const storyCleared = union(current.storyCleared, other.storyCleared);
  return {
    ...other,
    ...current,
    schemaVersion: SCHEMA_VERSION,
    unlockedScenes: union(current.unlockedScenes, other.unlockedScenes),
    storyCleared: storyCleared.length ? storyCleared : undefined,
    playedPages: union(current.playedPages, other.playedPages),
    sceneResults,
    totalScore: Object.values(sceneResults).reduce((sum, r) => sum + r.highScore, 0),
    discovered,
    lastPageId: current.lastPageId ?? other.lastPageId,
    settings: current.settings ?? other.settings,
    solvedMysteries: solved.length ? solved : undefined,
    rareFound: rare.length ? rare : undefined,
    stamps: Object.keys(stamps).length ? latestStamps(stamps) : undefined,
    cover: current.cover?.length ? current.cover : other.cover,
  };
}

/** What a backup file holds: the save, marked as this game's. */
export const BACKUP_GAME = 'the-lost-sketchbook';

/** Whether something read from a backup looks like a save at all (not just any JSON). */
export const looksLikeSave = (v: unknown): v is Fields =>
  isRecord(v) && (isRecord(v.sceneResults) || isRecord(v.discovered) || Array.isArray(v.unlockedScenes));

/**
 * The save of a backup (a file written by `progress.backup()`, or a save pasted as it is stored),
 * or null if the text is not one.
 */
export function readBackup(text: string): GameProgress | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  const save = isRecord(data) && data.game === BACKUP_GAME ? data.save : data;
  return looksLikeSave(save) ? readProgress(save) : null;
}

