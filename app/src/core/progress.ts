import type { GameProgress, PageResult } from './model';

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

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const isRecord = (v: unknown): v is Fields => typeof v === 'object' && v !== null && !Array.isArray(v);
const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : []);
const count = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, v) : 0);

/**
 * A save of any version, read back safely: missing or damaged fields become empty ones, fields
 * this version does not know are kept, dangerous prototype keys are removed, and older saves are brought up to date.
 */
export function readProgress(raw: unknown): GameProgress {
  const data = isRecord(raw) ? raw : {};

  // Strip dangerous prototype pollution keys
  const cleanData: Fields = {};
  for (const [k, v] of Object.entries(data)) {
    if (!DANGEROUS_KEYS.has(k)) {
      cleanData[k] = v;
    }
  }

  const sceneResults: Record<string, PageResult> = {};
  if (isRecord(cleanData.sceneResults)) {
    for (const [pageId, r] of Object.entries(cleanData.sceneResults)) {
      if (!isRecord(r) || DANGEROUS_KEYS.has(pageId)) continue;
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
  if (isRecord(cleanData.discovered)) {
    for (const [pageId, seen] of Object.entries(cleanData.discovered)) {
      if (!DANGEROUS_KEYS.has(pageId)) discovered[pageId] = strings(seen);
    }
  }

  const playCount: Record<string, number> = {};
  if (isRecord(cleanData.playCount)) {
    for (const [pageId, n] of Object.entries(cleanData.playCount)) {
      if (!DANGEROUS_KEYS.has(pageId)) playCount[pageId] = count(n);
    }
  }

  // Sound stays on unless the player turned it off
  const settings = isRecord(cleanData.settings) ? { ...cleanData.settings, soundEnabled: cleanData.settings.soundEnabled !== false } : undefined;

  const upToDate = typeof cleanData.schemaVersion === 'number' && cleanData.schemaVersion >= SCHEMA_VERSION;
  const bestScores = Object.values(sceneResults).reduce((sum, r) => sum + r.highScore, 0);
  const result: GameProgress = {
    ...cleanData,
    schemaVersion: SCHEMA_VERSION,
    unlockedScenes: strings(cleanData.unlockedScenes),
    sceneResults,
    totalScore: upToDate ? count(cleanData.totalScore) : bestScores,
    discovered,
    settings, // (a damaged value is dropped rather than kept as an unknown field)
  };
  if (typeof cleanData.lastPageId === 'string') {
    result.lastPageId = cleanData.lastPageId;
  } else {
    delete result.lastPageId;
  }
  if (cleanData.playCount && isRecord(cleanData.playCount)) {
    result.playCount = playCount;
  } else {
    delete result.playCount;
  }
  if (cleanData.rareFound) {
    result.rareFound = strings(cleanData.rareFound);
  } else {
    delete result.rareFound;
  }
  if (cleanData.solvedMysteries) {
    result.solvedMysteries = strings(cleanData.solvedMysteries);
  } else {
    delete result.solvedMysteries;
  }
  return result;
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
  /** Returns the current in-memory progress. */
  current(): GameProgress {
    return load();
  },

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

  /** Increment and return the play count for a page (used to seed replays). */
  recordPlay(pageId: string): number {
    const current = load();
    const countNum = (current.playCount?.[pageId] ?? 0) + 1;
    save({
      ...current,
      playCount: { ...(current.playCount || {}), [pageId]: countNum },
    });
    return countNum;
  },

  playCount(pageId: string): number {
    return load().playCount?.[pageId] ?? 0;
  },

  /** Records finding a rare shiny variant of a sprite. */
  recordRare(spriteType: string): void {
    const current = load();
    const rares = current.rareFound || [];
    if (rares.includes(spriteType)) return;
    save({
      ...current,
      rareFound: [...rares, spriteType],
    });
  },

  isRareFound(spriteType: string): boolean {
    return (load().rareFound || []).includes(spriteType);
  },

  /** Export the current save as a base64 encoded string. */
  exportSave(): string {
    const json = JSON.stringify(load());
    if (typeof btoa === 'function') {
      try {
        return btoa(unescape(encodeURIComponent(json)));
      } catch {
        // Fallback
      }
    }
    return json;
  },

  /** Import a save string (base64 or raw JSON) safely. */
  importSave(dataStr: string): { success: boolean; error?: string } {
    try {
      let json = dataStr.trim();
      if (typeof atob === 'function' && !json.startsWith('{')) {
        try {
          json = decodeURIComponent(escape(atob(json)));
        } catch {
          // If atob fails, might already be raw json
        }
      }
      const parsed = JSON.parse(json);
      if (!isRecord(parsed)) {
        return { success: false, error: 'Dữ liệu không đúng định dạng' };
      }
      const loaded = readProgress(parsed);
      save(loaded);
      return { success: true };
    } catch {
      return { success: false, error: 'Không thể giải mã bản lưu' };
    }
  },
};

const SOUND_STORAGE_KEY = 'detective_sketchbook_sound_enabled_v1';

export function loadSoundEnabled(): boolean {
  try {
    const val = localStorage.getItem(SOUND_STORAGE_KEY);
    return val !== null ? val === 'true' : true;
  } catch {
    return true;
  }
}

export function saveSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, String(enabled));
  } catch {
    // ignore
  }
}

const REVEAL_EFFECT_STORAGE_KEY = 'detective_sketchbook_reveal_effect_v1';

export function loadRevealEffect(): boolean {
  try {
    const val = localStorage.getItem(REVEAL_EFFECT_STORAGE_KEY);
    return val !== null ? val === 'true' : true;
  } catch {
    return true;
  }
}

export function saveRevealEffect(enabled: boolean): void {
  try {
    localStorage.setItem(REVEAL_EFFECT_STORAGE_KEY, String(enabled));
  } catch {
    // ignore
  }
}

// Request persistent storage on Web where supported to prevent Safari/browsers from evicting saves
if (typeof navigator !== 'undefined' && 'storage' in navigator && navigator.storage?.persist) {
  navigator.storage.persist().catch(() => {});
}
