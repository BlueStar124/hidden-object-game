import type { GameProgress, PageResult } from './model';

/**
 * Saved progress: stars, best scores, and every object ever spotted. Stored as JSON in
 * localStorage (iOS/Android: SQLite-backed, installed in index.ts), under the key of the first
 * web version — players who switch keep their progress, and fields this version does not use
 * survive every save.
 */

const STORAGE_KEY = 'detective_sketchbook_progress_v1';

const EMPTY: GameProgress = {
  unlockedScenes: [],
  sceneResults: {},
  totalScore: 0,
  discovered: {},
};

function load(): GameProgress {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? { ...EMPTY, ...JSON.parse(data) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

function save(progress: GameProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.warn('Unable to save progress', e);
  }
}

export const progress = {
  /** A case closed: keeps the best stars, score and time, and unlocks the next page. */
  recordVictory(
    pageId: string,
    nextPageId: string | null,
    score: number,
    stars: number,
    timeTaken: number,
    creaturesFound: string[] = []
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
    if (nextPageId && !unlockedScenes.includes(nextPageId)) unlockedScenes.push(nextPageId);
    save({
      ...current,
      unlockedScenes,
      sceneResults: { ...current.sceneResults, [pageId]: result },
      totalScore: current.totalScore + score,
    });
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

  /** All object ids ever spotted on a page (older saves only kept the bonus critters). */
  discovered(pageId: string): string[] {
    const current = load();
    return Array.from(
      new Set([...(current.discovered[pageId] || []), ...(current.sceneResults[pageId]?.creaturesFound || [])])
    );
  },
};
