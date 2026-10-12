import type { CoverSticker, DailyStamp, GameProgress, PageResult, SpriteType } from './model';

/**
 * Saved progress: stars, best scores, and every object ever spotted. Stored as JSON in
 * localStorage (iOS/Android: SQLite-backed, installed in index.ts), under the key of the first
 * web version — players who switch keep their progress, and fields this version does not use
 * survive every save.
 */

const STORAGE_KEY = 'detective_sketchbook_progress_v1';

/**
 * Version of what is saved under that key. 2: `totalScore` is the sum of each page's best score
 * (version 1, unversioned, added every win to it — replays included).
 */
export const SCHEMA_VERSION = 2;

type Fields = Record<string, unknown>;

const isRecord = (v: unknown): v is Fields => typeof v === 'object' && v !== null && !Array.isArray(v);
const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : []);
const count = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, v) : 0);
const between = (v: unknown, min: number, max: number, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;

/** Passport stamps kept: about a year of daily pages, so the save never keeps growing. */
export const MAX_STAMPS = 400;
/** Stickers on the inside cover, at most. */
export const MAX_STICKERS = 60;

function readStamps(v: unknown): Record<string, DailyStamp> | undefined {
  if (!isRecord(v)) return undefined;
  const stamps: Record<string, DailyStamp> = {};
  for (const [day, s] of Object.entries(v)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !isRecord(s) || typeof s.pageId !== 'string') continue;
    stamps[day] = { pageId: s.pageId, countryId: typeof s.countryId === 'string' ? s.countryId : '', time: count(s.time) };
  }
  return stamps;
}

function readCover(v: unknown): CoverSticker[] | undefined {
  if (!Array.isArray(v)) return undefined;
  return v
    .filter((s): s is Record<string, unknown> => isRecord(s) && typeof s.type === 'string')
    .slice(0, MAX_STICKERS)
    .map((s) => ({
      type: s.type as SpriteType, // an unknown drawing is skipped where stickers are shown
      x: between(s.x, 0, 1, 0.5),
      y: between(s.y, 0, 1, 0.5),
      rotation: between(s.rotation, -360, 360, 0),
      scale: between(s.scale, 0.4, 3, 1),
    }));
}

/**
 * A save of any version, read back safely: missing or damaged fields become empty ones, fields
 * this version does not know are kept, and older saves are brought up to date.
 */
export function readProgress(raw: unknown): GameProgress {
  const data = isRecord(raw) ? raw : {};

  const sceneResults: Record<string, PageResult> = {};
  if (isRecord(data.sceneResults)) {
    for (const [pageId, r] of Object.entries(data.sceneResults)) {
      if (!isRecord(r)) continue;
      sceneResults[pageId] = {
        ...r,
        sceneId: pageId,
        stars: Math.min(3, count(r.stars)),
        highScore: count(r.highScore),
        bestTime: count(r.bestTime),
        completedAt: typeof r.completedAt === 'string' ? r.completedAt : '',
        creaturesFound: strings(r.creaturesFound),
      };
    }
  }

  const discovered: Record<string, string[]> = {};
  if (isRecord(data.discovered)) {
    for (const [pageId, seen] of Object.entries(data.discovered)) discovered[pageId] = strings(seen);
  }
  // (Damaged values are dropped rather than kept as unknown fields)
  const solvedMysteries = Array.isArray(data.solvedMysteries) ? strings(data.solvedMysteries) : undefined;
  const stamps = readStamps(data.stamps);
  const cover = readCover(data.cover);

  // Sound stays on unless the player turned it off
  const settings = isRecord(data.settings) ? { ...data.settings, soundEnabled: data.settings.soundEnabled !== false } : undefined;

  const upToDate = typeof data.schemaVersion === 'number' && data.schemaVersion >= SCHEMA_VERSION;
  const bestScores = Object.values(sceneResults).reduce((sum, r) => sum + r.highScore, 0);
  return {
    ...data,
    schemaVersion: SCHEMA_VERSION,
    unlockedScenes: strings(data.unlockedScenes),
    sceneResults,
    totalScore: upToDate ? count(data.totalScore) : bestScores,
    discovered,
    lastPageId: typeof data.lastPageId === 'string' ? data.lastPageId : undefined,
    settings, // (a damaged value is dropped rather than kept as an unknown field)
    solvedMysteries,
    stamps,
    cover,
  };
}

/**
 * The save, kept in memory once read: this module is its only writer, so the page index and the
 * album can ask for every page without reading storage (SQLite on iOS/Android) each time.
 */
let copy: GameProgress | null = null;

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

function save(progress: GameProgress): void {
  copy = progress;
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
      // A replay only adds what it beats the page's best score by
      totalScore: current.totalScore + result.highScore - (existing?.highScore || 0),
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

  /** The player is in this page now: "Chơi tiếp" comes back to it next time. */
  recordVisit(pageId: string): void {
    const current = load();
    if (current.lastPageId === pageId) return;
    save({ ...current, lastPageId: pageId });
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
    // Days sort as text ('2026-10-12'): drop the oldest beyond the limit
    const days = Object.keys(stamps).sort();
    for (const old of days.slice(0, Math.max(0, days.length - MAX_STAMPS))) delete stamps[old];
    save({ ...current, stamps });
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
