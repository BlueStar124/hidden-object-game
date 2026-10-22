import type { CoverSticker, DailyStamp, GameProgress, PageResult } from './model';
import {
  latestStamps,
  MAX_STAMPS,
  MAX_STICKERS,
  readProgress,
  SCHEMA_VERSION,
  STORAGE_KEY,
} from './progressSchema';
import {
  BACKUP_GAME,
  mergeProgress,
  readBackup,
  union,
} from './progressMerge';

export {
  SCHEMA_VERSION,
  MAX_STAMPS,
  MAX_STICKERS,
  readProgress,
  mergeProgress,
  readBackup,
};

/**
 * Saved progress: stars, best scores, and every object ever spotted. Stored as JSON in
 * localStorage (iOS/Android: SQLite-backed, installed in index.ts), under the key of the first
 * web version — players who switch keep their progress, and fields this version does not use
 * survive every save.
 */

let copy: GameProgress | null = null;
const listeners = new Set<() => void>();

// Web: another tab of the game saved — read the save again
if (typeof addEventListener === 'function') {
  addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY || e.key === null) copy = null;
  });
}

function load(): GameProgress {
  if (copy) return copy;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    copy = readProgress(data ? JSON.parse(data) : null);
  } catch {
    copy = readProgress(null);
  }
  return copy;
}

function save(p: GameProgress): void {
  copy = p;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch (e) {
    console.warn('Unable to save progress', e);
  }
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      // A cloud sync observer must never interrupt a local save.
    }
  }
}

export const progress = {
  /** Watches local saves so platform services can mirror them without entering game rules. */
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /* ---- Backups ---- */

  /** The whole save as the text of a backup file. */
  backup(): string {
    return JSON.stringify({ game: BACKUP_GAME, savedAt: new Date().toISOString(), save: load() });
  },

  /** Brings a backup back, merged into this device's save (nothing is lost); false if it is not one. */
  restore(text: string): boolean {
    const other = readBackup(text);
    if (!other) return false;
    save(mergeProgress(load(), other));
    return true;
  },

  /**
   * Another player's save in place of this device's (null: a fresh one), keeping this device's
   * settings: an account signing in must not take over the progress of the one before it.
   */
  replace(text: string | null): void {
    const next = (text ? readBackup(text) : null) ?? readProgress(null);
    save({ ...next, settings: load().settings ?? next.settings });
  },

  /** A case closed: keeps the best stars, score and time, and unlocks the next page in story mode. */
  recordVictory(
    pageId: string,
    nextPageId: string | null,
    score: number,
    stars: number,
    timeTaken: number,
    creaturesFound: string[] = [],
    isStoryBook: boolean = true
  ): void {
    const current = load();
    const existing = current.sceneResults[pageId];
    const result: PageResult = {
      sceneId: pageId,
      stars: Math.max(stars, existing?.stars || 0),
      highScore: Math.max(score, existing?.highScore || 0),
      bestTime: existing ? Math.min(timeTaken, existing.bestTime) : timeTaken,
      completedAt: new Date().toISOString(),
      creaturesFound: Array.from(new Set([...(existing?.creaturesFound || []), ...creaturesFound])),
    };
    const unlockedScenes = [...current.unlockedScenes];
    if (isStoryBook && nextPageId && !unlockedScenes.includes(nextPageId)) {
      unlockedScenes.push(nextPageId);
    }
    const storyCleared = isStoryBook
      ? Array.from(new Set([...(current.storyCleared ?? []), pageId]))
      : current.storyCleared;

    save({
      ...current,
      unlockedScenes,
      storyCleared,
      sceneResults: { ...current.sceneResults, [pageId]: result },
      // A replay only adds what it beats the page's best score by
      totalScore: current.totalScore + result.highScore - (existing?.highScore || 0),
    });
  },

  /** Current in-memory save object (read-only reference). */
  get(): GameProgress {
    return load();
  },

  /** Story day pages completed in story mode. */
  storyCleared(): string[] {
    return load().storyCleared ?? [];
  },

  /** Whether a page was cleared in story mode. */
  isStoryCleared(pageId: string): boolean {
    return (load().storyCleared ?? []).includes(pageId);
  },

  /** Explicitly unlocked page ids. */
  unlockedScenes(): string[] {
    return load().unlockedScenes ?? [];
  },

  pageResult(pageId: string): PageResult | undefined {
    return load().sceneResults[pageId];
  },

  /** Remembers a find straight away, even if the page is never finished. */
  recordDiscovery(pageId: string, objectId: string): void {
    const current = load();
    const seen = current.discovered[pageId] || [];
    if (seen.includes(objectId)) return;
    save({ ...current, discovered: { ...current.discovered, [pageId]: [...seen, objectId] } });
  },

  /** The player is in this page now: "Chơi tiếp" comes back to it next time. */
  recordVisit(pageId: string): void {
    const current = load();
    const playedPages = current.playedPages ?? [];
    if (current.lastPageId === pageId && playedPages.includes(pageId)) return;
    save({ ...current, lastPageId: pageId, playedPages: union(playedPages, [pageId]) });
  },

  /** Prior book visits, including evidence kept by older versions. */
  playedPages(): string[] {
    const current = load();
    return union(current.playedPages, Object.keys(current.sceneResults).filter((id) => current.sceneResults[id].stars > 0));
  },

  /** The page the player was last in (it may be gone from the content since), if any. */
  lastPage(): string | undefined {
    return load().lastPageId;
  },

  /* ---- Chapter mysteries ---- */

  isMysterySolved(chapterId: string): boolean {
    return (load().solvedMysteries ?? []).includes(chapterId);
  },

  recordMysterySolved(chapterId: string): void {
    const current = load();
    const solved = current.solvedMysteries ?? [];
    if (solved.includes(chapterId)) return;
    save({ ...current, solvedMysteries: [...solved, chapterId] });
  },

  /* ---- Golden critters ---- */

  /** Kinds of golden critters caught at least once. */
  rareFound(): string[] {
    return load().rareFound ?? [];
  },

  /** A golden critter caught: true the first time of its kind. */
  recordRareFind(kind: string): boolean {
    const current = load();
    const found = current.rareFound ?? [];
    if (found.includes(kind)) return false;
    save({ ...current, rareFound: [...found, kind] });
    return true;
  },

  /* ---- Passport ---- */

  /** Daily pages done, by day. */
  stamps(): Record<string, DailyStamp> {
    return load().stamps ?? {};
  },

  /** A daily page done: its stamp (the best time, when the same day is played again). */
  recordStamp(day: string, stamp: DailyStamp): void {
    const current = load();
    const stamps = { ...current.stamps };
    const existing = stamps[day];
    if (existing && existing.time <= stamp.time) return;
    stamps[day] = stamp;
    save({ ...current, stamps: latestStamps(stamps) });
  },

  /* ---- Inside cover ---- */

  cover(): CoverSticker[] {
    return load().cover ?? [];
  },

  saveCover(stickers: CoverSticker[]): void {
    save({ ...load(), cover: stickers.slice(0, MAX_STICKERS) });
  },

  /* ---- Settings ---- */

  /** Whether the player wants sound (on until they turn it off). */
  soundEnabled(): boolean {
    return load().settings?.soundEnabled !== false;
  },

  /** Remembers the sound switch for the next time the game opens. */
  setSoundEnabled(enabled: boolean): void {
    const current = load();
    if ((current.settings?.soundEnabled !== false) === enabled) return;
    save({ ...current, settings: { ...current.settings, soundEnabled: enabled } });
  },

  /** Sum of every page's best score. */
  totalScore(): number {
    return load().totalScore;
  },

  /** All object ids ever spotted on a page (older saves only kept the bonus critters). */
  discovered(pageId: string): string[] {
    const current = load();
    return Array.from(
      new Set([...(current.discovered[pageId] || []), ...(current.sceneResults[pageId]?.creaturesFound || [])])
    );
  },
};
