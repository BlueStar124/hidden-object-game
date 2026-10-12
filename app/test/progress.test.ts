import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { MAX_STAMPS, MAX_STICKERS, mergeProgress, readBackup, readProgress, SCHEMA_VERSION } from '../src/core/progress';

const KEY = 'detective_sketchbook_progress_v1';

/** The device's localStorage, in memory. */
class MemoryStorage implements Storage {
  private items = new Map<string, string>();
  reads = 0;
  failWrites = false;
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
    this.reads++;
    return this.items.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (this.failWrites) throw new Error('QuotaExceededError');
    this.items.set(key, value);
  }
  removeItem(key: string) {
    this.items.delete(key);
  }
  /** What is stored, without counting as a read */
  peek(key: string) {
    return this.items.get(key) ?? null;
  }
}

let storage: MemoryStorage;
const saved = () => JSON.parse(storage.peek(KEY) ?? 'null');
// The `storage` listeners the module registers (a browser tab is told when another one saves)
let storageListeners: ((e: { key: string | null }) => void)[];
// The module keeps the save in memory: every test gets a fresh one, as the app does when it starts
let progress: typeof import('../src/core/progress').progress;

beforeEach(() => {
  storage = new MemoryStorage();
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
  storageListeners = [];
  Object.defineProperty(globalThis, 'addEventListener', {
    value: (type: string, listener: (e: { key: string | null }) => void) => {
      if (type === 'storage') storageListeners.push(listener);
    },
    configurable: true,
  });
  jest.resetModules();
  ({ progress } = jest.requireActual<typeof import('../src/core/progress')>('../src/core/progress'));
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

describe('the sound switch', () => {
  test('sound is on for a new player', () => {
    expect(progress.soundEnabled()).toBe(true);
    expect(readProgress({ settings: 'bad' }).settings).toBeUndefined();
  });

  test('a first-version player who muted the game stays muted', () => {
    storage.setItem(KEY, JSON.stringify(firstVersionSave));
    expect(progress.soundEnabled()).toBe(false);
  });

  test('the switch is saved, keeping the other settings', () => {
    storage.setItem(KEY, JSON.stringify({ ...firstVersionSave, settings: { soundEnabled: false, music: 0.5 } }));
    progress.setSoundEnabled(true);
    expect(saved().settings).toEqual({ soundEnabled: true, music: 0.5 });
    expect(progress.soundEnabled()).toBe(true);
  });

  test('a damaged switch counts as on', () => {
    expect(readProgress({ settings: { soundEnabled: 'no' } }).settings).toEqual({ soundEnabled: true });
  });
});

describe('chapter mysteries', () => {
  test('a solved mystery is remembered once', () => {
    expect(progress.isMysterySolved('chapter-01')).toBe(false);
    progress.recordMysterySolved('chapter-01');
    progress.recordMysterySolved('chapter-01');
    expect(saved().solvedMysteries).toEqual(['chapter-01']);
    expect(progress.isMysterySolved('chapter-01')).toBe(true);
  });

  test('a damaged list is dropped', () => {
    expect(readProgress({ solvedMysteries: 'chapter-01' }).solvedMysteries).toBeUndefined();
    expect(readProgress({ solvedMysteries: ['a', 3] }).solvedMysteries).toEqual(['a']);
  });
});

describe('the passport', () => {
  const stamp = (time: number) => ({ pageId: 'merlion-park', countryId: 'singapore', time });

  test('a daily page done stamps its day, keeping the best time of that day', () => {
    progress.recordStamp('2026-10-12', stamp(90));
    progress.recordStamp('2026-10-12', stamp(120));
    expect(progress.stamps()['2026-10-12'].time).toBe(90);
    progress.recordStamp('2026-10-12', stamp(60));
    expect(saved().stamps).toEqual({ '2026-10-12': stamp(60) });
  });

  test('only the latest days are kept', () => {
    for (let i = 0; i < MAX_STAMPS + 5; i++) {
      const day = new Date(2026, 0, 1 + i);
      progress.recordStamp(`${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`, stamp(50));
    }
    const days = Object.keys(progress.stamps()).sort();
    expect(days).toHaveLength(MAX_STAMPS);
    expect(days[0]).toBe('2026-01-06');
  });

  test('damaged stamps are skipped', () => {
    const read = readProgress({ stamps: { '2026-10-12': stamp(30), yesterday: stamp(10), '2026-10-11': { time: 5 } } });
    expect(read.stamps).toEqual({ '2026-10-12': stamp(30) });
  });
});

describe('the inside cover', () => {
  test('stickers are saved where the player put them', () => {
    const sticker = { type: 'cat' as const, x: 0.3, y: 0.6, rotation: -12, scale: 1.4 };
    progress.saveCover([sticker]);
    expect(progress.cover()).toEqual([sticker]);
  });

  test('damaged stickers are mended or skipped, and there are never too many', () => {
    const read = readProgress({ cover: [{ type: 'cat', x: 4, y: 'a', rotation: 10, scale: 9 }, { x: 0.2 }, 'cat'] });
    expect(read.cover).toEqual([{ type: 'cat', x: 1, y: 0.5, rotation: 10, scale: 3 }]);
    progress.saveCover(Array.from({ length: MAX_STICKERS + 10 }, () => ({ type: 'owl' as const, x: 0.5, y: 0.5, rotation: 0, scale: 1 })));
    expect(progress.cover()).toHaveLength(MAX_STICKERS);
  });
});

describe('backups', () => {
  const result = (stars: number, highScore: number, bestTime: number, completedAt = '2026-10-01T00:00:00.000Z') => ({
    sceneId: '',
    stars,
    highScore,
    bestTime,
    completedAt,
    creaturesFound: [] as string[],
  });

  test('two saves merge without losing anything of either', () => {
    const phone = readProgress({
      sceneResults: { a: result(3, 900, 80), b: result(1, 300, 200) },
      discovered: { a: ['cat'], b: ['dog'] },
      stamps: { '2026-10-11': { pageId: 'a', countryId: 'singapore', time: 70 } },
      solvedMysteries: ['chapter-01'],
      lastPageId: 'b',
      settings: { soundEnabled: false },
    });
    const web = readProgress({
      sceneResults: { a: result(2, 1200, 60, '2026-10-05T00:00:00.000Z'), c: result(2, 500, 120) },
      discovered: { a: ['owl'], c: ['frog'] },
      stamps: { '2026-10-11': { pageId: 'a', countryId: 'singapore', time: 50 }, '2026-10-12': { pageId: 'c', countryId: 'thailand', time: 90 } },
      solvedMysteries: ['chapter-02'],
      cover: [{ type: 'cat', x: 0.5, y: 0.5, rotation: 0, scale: 1 }],
      lastPageId: 'c',
    });
    const merged = mergeProgress(phone, web);
    expect(merged.sceneResults.a).toMatchObject({ stars: 3, highScore: 1200, bestTime: 60, completedAt: '2026-10-05T00:00:00.000Z' });
    expect(Object.keys(merged.sceneResults).sort()).toEqual(['a', 'b', 'c']);
    expect(merged.totalScore).toBe(1200 + 300 + 500);
    expect(merged.discovered.a.sort()).toEqual(['cat', 'owl']);
    expect(merged.stamps?.['2026-10-11'].time).toBe(50);
    expect(Object.keys(merged.stamps ?? {})).toHaveLength(2);
    expect(merged.solvedMysteries?.sort()).toEqual(['chapter-01', 'chapter-02']);
    // Only one can win: this device, unless it has nothing
    expect(merged.lastPageId).toBe('b');
    expect(merged.settings).toEqual({ soundEnabled: false });
    expect(merged.cover).toHaveLength(1);
  });

  test('a backup brought back on another device merges into its save', () => {
    progress.recordVictory('merlion-park', null, 800, 2, 100);
    const file = progress.backup();
    expect(JSON.parse(file)).toMatchObject({ game: 'the-lost-sketchbook', save: { sceneResults: { 'merlion-park': { stars: 2 } } } });

    storage.clear();
    jest.resetModules();
    ({ progress } = jest.requireActual<typeof import('../src/core/progress')>('../src/core/progress'));
    progress.recordVictory('gardens-by-the-bay', null, 500, 1, 150);
    expect(progress.restore(file)).toBe(true);
    expect(progress.pageResult('merlion-park')?.stars).toBe(2);
    expect(progress.pageResult('gardens-by-the-bay')?.stars).toBe(1);
    expect(saved().totalScore).toBe(1300);
  });

  test('a save pasted as it is stored works too; anything else is refused and changes nothing', () => {
    expect(readBackup(JSON.stringify(firstVersionSave))?.sceneResults['merlion-park'].highScore).toBe(800);
    for (const text of ['', 'xin chào', '{}', '[1, 2]', JSON.stringify({ game: 'the-lost-sketchbook', save: 'bad' })]) {
      expect(readBackup(text)).toBeNull();
      expect(progress.restore(text)).toBe(false);
    }
    expect(storage.peek(KEY)).toBeNull();
  });

  test('keys that would reach the prototype are ignored', () => {
    const read = readProgress(JSON.parse('{"sceneResults": {"__proto__": {"stars": 3}, "a": {"stars": 1}}, "discovered": {"constructor": ["x"]}}'));
    expect(Object.keys(read.sceneResults)).toEqual(['a']);
    expect(Object.getPrototypeOf(read.sceneResults)).toBe(Object.prototype);
    expect(read.discovered).toEqual({});
  });
});

describe('where the player left off', () => {
  test('a new player has no page to go back to', () => {
    expect(progress.lastPage()).toBeUndefined();
    expect(progress.totalScore()).toBe(0);
  });

  test('the page the player is in is remembered, written only when it changes', () => {
    progress.recordVisit('merlion-park');
    progress.recordVisit('gardens-by-the-bay-night');
    expect(progress.lastPage()).toBe('gardens-by-the-bay-night');
    expect(saved().lastPageId).toBe('gardens-by-the-bay-night');

    storage.failWrites = true; // the same page again: nothing to write
    progress.recordVisit('gardens-by-the-bay-night');
  });

  test('a damaged last page is dropped, and the rest of the save kept', () => {
    expect(readProgress({ ...firstVersionSave, lastPageId: 42 }).lastPageId).toBeUndefined();
    expect(readProgress({ ...firstVersionSave, lastPageId: 'merlion-park' })).toMatchObject({ lastPageId: 'merlion-park', currentChapter: 2 });
  });
});

describe('the copy kept in memory', () => {
  test('storage is read once, however often the page index and the album ask', () => {
    storage.setItem(KEY, JSON.stringify(firstVersionSave));
    for (let i = 0; i < 10; i++) {
      progress.pageResult('marina-bay-sands');
      progress.discovered('merlion-park');
    }
    progress.recordDiscovery('merlion-park', 'gecko');
    expect(progress.discovered('merlion-park')).toEqual(['gecko']);
    expect(storage.reads).toBe(1);
  });

  test('another browser tab saving is picked up', () => {
    expect(progress.pageResult('merlion-park')).toBeUndefined();
    storage.setItem(KEY, JSON.stringify(firstVersionSave));
    expect(progress.pageResult('merlion-park')).toBeUndefined(); // not told yet
    for (const listener of storageListeners) listener({ key: KEY });
    expect(progress.pageResult('merlion-park')?.highScore).toBe(800);
  });

  test('a win still counts for the session when storage cannot be written', () => {
    storage.failWrites = true;
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    progress.recordVictory('marina-bay-sands', 'gardens-by-the-bay', 500, 2, 60);
    expect(progress.pageResult('marina-bay-sands')?.stars).toBe(2);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
