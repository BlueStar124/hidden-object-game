import { beforeEach, describe, expect, test } from '@jest/globals';
import { progress, readProgress, SCHEMA_VERSION } from '../src/core/progress';

const KEY = 'detective_sketchbook_progress_v1';

/** The device's localStorage, in memory. */
class MemoryStorage implements Storage {
  private items = new Map<string, string>();
  get length() {
    return this.items.size;
  }
  clear() {
    this.items.clear();
  }
  key(index: number) {
    return [...this.items.keys()][index] ?? null;
  }
  getItem(key: string) {
    return this.items.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.items.set(key, value);
  }
  removeItem(key: string) {
    this.items.delete(key);
  }
}

let storage: MemoryStorage;
const saved = () => JSON.parse(storage.getItem(KEY) ?? 'null');

beforeEach(() => {
  storage = new MemoryStorage();
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
});

/** A save of the first web version: no schemaVersion, a total inflated by replays. */
const firstVersionSave = {
  currentChapter: 2,
  unlockedScenes: ['marina-bay-sands', 'gardens-by-the-bay'],
  sceneResults: {
    'marina-bay-sands': { sceneId: 'marina-bay-sands', stars: 3, highScore: 1250, bestTime: 45, completedAt: '2026-09-01T00:00:00.000Z' },
    'merlion-park': { sceneId: 'merlion-park', stars: 1, highScore: 800, bestTime: 170, completedAt: '2026-09-02T00:00:00.000Z' },
  },
  totalScore: 9999,
  settings: { soundEnabled: false },
};

describe('reading a save', () => {
  test('nothing saved yet', () => {
    expect(readProgress(null)).toEqual({ schemaVersion: SCHEMA_VERSION, unlockedScenes: [], sceneResults: {}, totalScore: 0, discovered: {} });
    expect(progress.pageResult('marina-bay-sands')).toBeUndefined();
    expect(progress.discovered('marina-bay-sands')).toEqual([]);
  });

  test('unreadable JSON counts as nothing saved', () => {
    storage.setItem(KEY, '{ bad json');
    expect(progress.pageResult('marina-bay-sands')).toBeUndefined();
    progress.recordVictory('marina-bay-sands', null, 500, 2, 60);
    expect(saved().totalScore).toBe(500);
  });

  test('a first-version save keeps its results; its total becomes the sum of best scores', () => {
    const read = readProgress(firstVersionSave);
    expect(read.schemaVersion).toBe(SCHEMA_VERSION);
    expect(read.totalScore).toBe(1250 + 800);
    expect(read.unlockedScenes).toEqual(['marina-bay-sands', 'gardens-by-the-bay']);
    expect(read.sceneResults['marina-bay-sands']).toEqual({ ...firstVersionSave.sceneResults['marina-bay-sands'], creaturesFound: [] });
  });

  test('fields this version does not use are kept', () => {
    const read = readProgress(firstVersionSave);
    expect(read).toMatchObject({ currentChapter: 2, settings: { soundEnabled: false } });
  });

  test('an up-to-date save keeps its total', () => {
    expect(readProgress({ ...firstVersionSave, schemaVersion: SCHEMA_VERSION, totalScore: 2100 }).totalScore).toBe(2100);
  });

  test('damaged fields are replaced, never trusted', () => {
    const read = readProgress({
      unlockedScenes: 'marina-bay-sands',
      sceneResults: { good: { stars: 7, highScore: -5, bestTime: 'fast' }, bad: 'oops' },
      discovered: { good: ['gecko', 3, null], bad: 'frog' },
      totalScore: Number.NaN,
      schemaVersion: SCHEMA_VERSION,
    });
    expect(read.unlockedScenes).toEqual([]);
    expect(read.sceneResults).toEqual({
      good: { sceneId: 'good', stars: 3, highScore: 0, bestTime: 0, completedAt: '', creaturesFound: [] },
    });
    expect(read.discovered).toEqual({ good: ['gecko'], bad: [] });
    expect(read.totalScore).toBe(0);
    expect(readProgress([1, 2, 3]).sceneResults).toEqual({});
  });
});

describe('winning a page', () => {
  test('keeps the best stars, score and time, and unlocks the next page once', () => {
    progress.recordVictory('marina-bay-sands', 'gardens-by-the-bay', 500, 2, 60, ['gecko']);
    progress.recordVictory('marina-bay-sands', 'gardens-by-the-bay', 400, 3, 90, ['frog']);
    expect(progress.pageResult('marina-bay-sands')).toMatchObject({ stars: 3, highScore: 500, bestTime: 60 });
    expect(progress.pageResult('marina-bay-sands')?.creaturesFound?.sort()).toEqual(['frog', 'gecko']);
    expect(saved().unlockedScenes).toEqual(['gardens-by-the-bay']);
    expect(saved().schemaVersion).toBe(SCHEMA_VERSION);
  });

  test('a replay only adds to the total what it beats the best score by', () => {
    progress.recordVictory('marina-bay-sands', null, 500, 2, 60);
    expect(saved().totalScore).toBe(500);
    progress.recordVictory('marina-bay-sands', null, 700, 3, 50);
    expect(saved().totalScore).toBe(700);
    progress.recordVictory('marina-bay-sands', null, 400, 1, 90);
    expect(saved().totalScore).toBe(700);
    progress.recordVictory('merlion-park', null, 300, 1, 100);
    expect(saved().totalScore).toBe(1000);
  });

  test('on a first-version save, the total is corrected before the win is added', () => {
    storage.setItem(KEY, JSON.stringify(firstVersionSave));
    progress.recordVictory('marina-bay-sands', null, 1300, 3, 40);
    expect(saved()).toMatchObject({ schemaVersion: SCHEMA_VERSION, totalScore: 1300 + 800, currentChapter: 2, settings: { soundEnabled: false } });
  });
});

describe('the album', () => {
  test('a find is remembered once, together with critters saved by older versions', () => {
    storage.setItem(KEY, JSON.stringify(firstVersionSave));
    progress.recordVictory('merlion-park', null, 100, 1, 100, ['gecko']);
    progress.recordDiscovery('merlion-park', 'secret-amulet');
    progress.recordDiscovery('merlion-park', 'secret-amulet');
    expect(progress.discovered('merlion-park').sort()).toEqual(['gecko', 'secret-amulet']);
    expect(saved().settings).toEqual({ soundEnabled: false });
  });
});
