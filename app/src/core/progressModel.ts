import type { SpriteType } from './spriteTypes';

export interface PageResult {
  sceneId: string;
  stars: number;
  highScore: number;
  bestTime: number;
  completedAt: string;
  creaturesFound?: string[]; // Optional hidden critters ever spotted on this page
}

/**
 * What is stored on the device (key `detective_sketchbook_progress_v1`). The field names are
 * those of the first web version, so old saves keep working: `sceneResults` is keyed by page id.
 */
export interface GameProgress {
  schemaVersion: number; // See core/progress: older saves are brought up to date when read
  unlockedScenes: string[]; // Pages unlocked by clearing the previous one (kept for old saves)
  sceneResults: Record<string, PageResult>;
  totalScore: number; // Sum of every page's best score
  // Every object ever spotted, per page id — feeds the "Sổ Tay Sinh Vật" album
  discovered: Record<string, string[]>;
  // The page the player was last in (day or night): "Chơi tiếp" on the home screen opens it
  lastPageId?: string;
  /** Pages entered in the book, separately for day and night; challenges require prior play. */
  playedPages?: string[];
  /** Story day pages completed in story/book mode (stars >= 1), unlocking the next day page. */
  storyCleared?: string[];
  settings?: GameSettings;
  solvedMysteries?: string[]; // Chapter ids whose mystery was solved on the deduction board
  stamps?: Record<string, DailyStamp>; // Daily pages done, by the player's local day ('2026-10-12')
  cover?: CoverSticker[]; // The player's own inside cover
  rareFound?: string[]; // Kinds (SpriteType) of golden critters caught at least once
}

/** A daily page done: a stamp in the detective's passport. */
export interface DailyStamp {
  pageId: string;
  countryId: string;
  time: number; // Seconds the hunt took (the best of the day)
}

/** A sticker on the inside cover, at a place the player chose. */
export interface CoverSticker {
  type: SpriteType;
  x: number; // Centre, 0–1 of the cover's width
  y: number; // Centre, 0–1 of the cover's height
  rotation: number; // Degrees
  scale: number; // 1 = the default sticker size
}

/** The player's preferences, saved with the progress (the first web version already wrote them here). */
export interface GameSettings {
  soundEnabled: boolean; // false: the player muted the game
  wash?: boolean; // Former switch of the watercolour wash (now always on): kept in old saves, no longer read
}

