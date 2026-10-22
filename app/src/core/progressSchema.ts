import type { CoverSticker, DailyStamp, GameProgress, PageResult, SpriteType } from './model';

export const STORAGE_KEY = 'detective_sketchbook_progress_v1';

/**
 * Version of what is saved under that key.
 * 2: `totalScore` is the sum of each page's best score.
 * 3: `storyCleared` records day pages completed in story mode to enforce linear progression.
 */
export const SCHEMA_VERSION = 3;

export type Fields = Record<string, unknown>;

export const isRecord = (v: unknown): v is Fields => typeof v === 'object' && v !== null && !Array.isArray(v);
// Keys a save written by hand (or an imported file) could use to reach Object.prototype
export const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
/** The entries of a record, without the keys that would tamper with prototypes. */
export const entries = (v: Fields) => Object.entries(v).filter(([key]) => !UNSAFE_KEYS.has(key));
export const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : []);
export const count = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, v) : 0);
export const between = (v: unknown, min: number, max: number, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;

/** Passport stamps kept: about a year of daily pages, so the save never keeps growing. */
export const MAX_STAMPS = 400;
/** Stickers on the inside cover, at most. */
export const MAX_STICKERS = 60;

/** The latest stamps only (days sort as text, '2026-10-12'): a save — or two merged — stays small. */
export function latestStamps(stamps: Record<string, DailyStamp>): Record<string, DailyStamp> {
  const days = Object.keys(stamps).sort();
  for (const old of days.slice(0, Math.max(0, days.length - MAX_STAMPS))) delete stamps[old];
  return stamps;
}

export function readStamps(v: unknown): Record<string, DailyStamp> | undefined {
  if (!isRecord(v)) return undefined;
  const stamps: Record<string, DailyStamp> = {};
  for (const [day, s] of entries(v)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !isRecord(s) || typeof s.pageId !== 'string') continue;
    stamps[day] = { pageId: s.pageId, countryId: typeof s.countryId === 'string' ? s.countryId : '', time: count(s.time) };
  }
  return latestStamps(stamps);
}

export function readCover(v: unknown): CoverSticker[] | undefined {
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
    for (const [pageId, r] of entries(data.sceneResults)) {
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
    for (const [pageId, seen] of entries(data.discovered)) discovered[pageId] = strings(seen);
  }
  // (Damaged values are dropped rather than kept as unknown fields)
  const solvedMysteries = Array.isArray(data.solvedMysteries) ? strings(data.solvedMysteries) : undefined;
  const rareFound = Array.isArray(data.rareFound) ? strings(data.rareFound) : undefined;
  // Older saves did not keep visits; only finished pages and the last book page prove prior play.
  const playedPages = Array.from(new Set([
    ...strings(data.playedPages),
    ...Object.keys(sceneResults).filter((id) => sceneResults[id].stars > 0),
    ...(typeof data.lastPageId === 'string' ? [data.lastPageId] : []),
  ]));
  const stamps = readStamps(data.stamps);
  const cover = readCover(data.cover);

  // Sound stays on unless the player turned it off
  const settings = isRecord(data.settings) ? { ...data.settings, soundEnabled: data.settings.soundEnabled !== false } : undefined;

  const upToDate = typeof data.schemaVersion === 'number' && data.schemaVersion >= SCHEMA_VERSION;
  const bestScores = Object.values(sceneResults).reduce((sum, r) => sum + r.highScore, 0);

  // Schema 3 migration: older saves treat all pages won with stars > 0 as story-cleared
  const wonPageIds = Object.keys(sceneResults).filter((id) => sceneResults[id].stars > 0);
  const storyCleared = Array.from(new Set([
    ...strings(data.storyCleared),
    ...(upToDate ? [] : wonPageIds),
  ]));

  return {
    ...Object.fromEntries(entries(data)),
    schemaVersion: SCHEMA_VERSION,
    unlockedScenes: strings(data.unlockedScenes),
    storyCleared: storyCleared.length ? storyCleared : undefined,
    sceneResults,
    totalScore: upToDate ? count(data.totalScore) : bestScores,
    discovered,
    lastPageId: typeof data.lastPageId === 'string' ? data.lastPageId : undefined,
    settings, // (a damaged value is dropped rather than kept as an unknown field)
    solvedMysteries,
    stamps,
    cover,
    rareFound,
    playedPages: playedPages.length ? playedPages : undefined,
  };
}

