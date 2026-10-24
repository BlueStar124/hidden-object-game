import { describe, expect, test } from '@jest/globals';
import { evaluateStoryProgress, getCountryLockReason, getPageLockReason } from '../src/core/story';
import { COUNTRIES, pagesOf, story, allStoryRefs } from '../src/content';
import { mergeProgress, readProgress, SCHEMA_VERSION } from '../src/core/progress';
import type { GameProgress, PageRef } from '../src/core/model';

describe('story progression rules', () => {
  const allRefs = allStoryRefs();
  const sgPages = pagesOf(COUNTRIES.find((c) => c.id === 'singapore')!);
  const thPages = pagesOf(COUNTRIES.find((c) => c.id === 'thailand')!);
  const vnPages = pagesOf(COUNTRIES.find((c) => c.id === 'vietnam')!);

  test('a brand new player has only the first page of Singapore unlocked', () => {
    const emptyProgress: GameProgress = {
      schemaVersion: SCHEMA_VERSION,
      unlockedScenes: [],
      sceneResults: {},
      totalScore: 0,
      discovered: {},
    };

    const state = evaluateStoryProgress(allRefs, emptyProgress);
    expect(state.unlockedPageIds.has(sgPages[0].day.id)).toBe(true);
    expect(state.unlockedPageIds.has(sgPages[1].day.id)).toBe(false);
    expect(state.unlockedCountryIds.has('singapore')).toBe(true);
    expect(state.unlockedCountryIds.has('thailand')).toBe(false);
    expect(state.unlockedCountryIds.has('vietnam')).toBe(false);
    expect(state.nextDayPage?.id).toBe(sgPages[0].day.id);
    expect(state.journeyCompleted).toBe(false);

    // Night page of page 1 is locked because day page is not cleared yet
    if (sgPages[0].night) {
      expect(state.unlockedPageIds.has(sgPages[0].night.id)).toBe(false);
    }
  });

  test('a challenge win (stars without a story clear) does not unlock the journey', () => {
    const late = vnPages[vnPages.length - 1].day.id;
    const challengeWin: GameProgress = {
      schemaVersion: SCHEMA_VERSION,
      unlockedScenes: [],
      sceneResults: {
        [late]: { sceneId: late, stars: 3, highScore: 2000, bestTime: 50, completedAt: new Date().toISOString() },
      },
      totalScore: 2000,
      discovered: {},
    };
    const state = evaluateStoryProgress(allRefs, challengeWin);
    expect(state.unlockedPageIds.has(sgPages[1].day.id)).toBe(false);
    expect(state.unlockedPageIds.has(late)).toBe(false);
    expect(state.unlockedCountryIds.has('thailand')).toBe(false);
    expect(state.unlockedCountryIds.has('vietnam')).toBe(false);
    expect(state.nextDayPage?.id).toBe(sgPages[0].day.id);
  });

  test('winning a day page unlocks next day page and its night variant', () => {
    const p1Id = sgPages[0].day.id;
    const progressWithP1: GameProgress = {
      schemaVersion: SCHEMA_VERSION,
      unlockedScenes: [p1Id],
      storyCleared: [p1Id],
      sceneResults: {
        [p1Id]: {
          sceneId: p1Id,
          stars: 2,
          highScore: 1000,
          bestTime: 40,
          completedAt: new Date().toISOString(),
        },
      },
      totalScore: 1000,
      discovered: {},
    };

    const state = evaluateStoryProgress(allRefs, progressWithP1);
    expect(state.unlockedPageIds.has(sgPages[0].day.id)).toBe(true);
    expect(state.unlockedPageIds.has(sgPages[1].day.id)).toBe(true);
    if (sgPages[0].night) {
      expect(state.unlockedPageIds.has(sgPages[0].night.id)).toBe(true);
    }
    expect(state.nextDayPage?.id).toBe(sgPages[1].day.id);
  });

  test('crossing country boundary: Singapore -> Thailand -> Vietnam', () => {
    // Clear all Singapore pages
    const sgCleared = sgPages.map((r) => r.day.id);
    const sgDoneProgress: GameProgress = {
      schemaVersion: SCHEMA_VERSION,
      unlockedScenes: sgCleared,
      storyCleared: sgCleared,
      sceneResults: Object.fromEntries(
        sgCleared.map((id) => [
          id,
          { sceneId: id, stars: 1, highScore: 500, bestTime: 50, completedAt: new Date().toISOString() },
        ])
      ),
      totalScore: sgCleared.length * 500,
      discovered: {},
    };

    const stateAfterSg = evaluateStoryProgress(allRefs, sgDoneProgress);
    expect(stateAfterSg.unlockedCountryIds.has('singapore')).toBe(true);
    expect(stateAfterSg.unlockedCountryIds.has('thailand')).toBe(true);
    expect(stateAfterSg.unlockedCountryIds.has('vietnam')).toBe(false);
    expect(stateAfterSg.unlockedPageIds.has(thPages[0].day.id)).toBe(true);
    expect(stateAfterSg.unlockedPageIds.has(thPages[1].day.id)).toBe(false);
    expect(stateAfterSg.nextDayPage?.id).toBe(thPages[0].day.id);

    // Clear all Thailand pages
    const thCleared = thPages.map((r) => r.day.id);
    const thDoneProgress: GameProgress = {
      ...sgDoneProgress,
      unlockedScenes: [...sgCleared, ...thCleared],
      storyCleared: [...sgCleared, ...thCleared],
      sceneResults: {
        ...sgDoneProgress.sceneResults,
        ...Object.fromEntries(
          thCleared.map((id) => [
            id,
            { sceneId: id, stars: 1, highScore: 500, bestTime: 50, completedAt: new Date().toISOString() },
          ])
        ),
      },
    };

    const stateAfterTh = evaluateStoryProgress(allRefs, thDoneProgress);
    expect(stateAfterTh.unlockedCountryIds.has('vietnam')).toBe(true);
    expect(stateAfterTh.unlockedPageIds.has(vnPages[0].day.id)).toBe(true);
    expect(stateAfterTh.nextDayPage?.id).toBe(vnPages[0].day.id);

    // Clear all Vietnam pages
    const vnCleared = vnPages.map((r) => r.day.id);
    const allDoneProgress: GameProgress = {
      ...thDoneProgress,
      unlockedScenes: [...sgCleared, ...thCleared, ...vnCleared],
      storyCleared: [...sgCleared, ...thCleared, ...vnCleared],
      sceneResults: {
        ...thDoneProgress.sceneResults,
        ...Object.fromEntries(
          vnCleared.map((id) => [
            id,
            { sceneId: id, stars: 1, highScore: 500, bestTime: 50, completedAt: new Date().toISOString() },
          ])
        ),
      },
    };

    const finalState = evaluateStoryProgress(allRefs, allDoneProgress);
    expect(finalState.journeyCompleted).toBe(true);
    expect(finalState.nextDayPage).toBeNull();
  });

  test('lock reasons explain exact prerequisite', () => {
    const emptyProgress: GameProgress = {
      schemaVersion: SCHEMA_VERSION,
      unlockedScenes: [],
      sceneResults: {},
      totalScore: 0,
      discovered: {},
    };

    // Reason for locked Thailand
    const thReason = story.countryLockReason('thailand', emptyProgress);
    expect(thReason).toContain('Singapore');
    expect(thReason).toContain('9');

    // Reason for locked Vietnam
    const vnReason = story.countryLockReason('vietnam', emptyProgress);
    expect(vnReason).toContain('Thái Lan');
    expect(vnReason).toContain('9');

    // Reason for locked day page 5 of Singapore
    const p5Reason = story.lockReason(sgPages[4].day.id, emptyProgress);
    expect(p5Reason).toContain('Trang 4');
  });

  test('already cleared pages are always replayable', () => {
    const p1Id = sgPages[0].day.id;
    const p2Id = sgPages[1].day.id;
    const progressWithTwo: GameProgress = {
      schemaVersion: SCHEMA_VERSION,
      unlockedScenes: [p1Id, p2Id],
      storyCleared: [p1Id, p2Id],
      sceneResults: {
        [p1Id]: { sceneId: p1Id, stars: 3, highScore: 1500, bestTime: 30, completedAt: new Date().toISOString() },
        [p2Id]: { sceneId: p2Id, stars: 1, highScore: 800, bestTime: 55, completedAt: new Date().toISOString() },
      },
      totalScore: 2300,
      discovered: {},
    };

    const state = evaluateStoryProgress(allRefs, progressWithTwo);
    expect(state.unlockedPageIds.has(p1Id)).toBe(true);
    expect(state.unlockedPageIds.has(p2Id)).toBe(true);
    expect(state.unlockedPageIds.has(sgPages[2].day.id)).toBe(true);
  });
});

describe('schema migration to version 3', () => {
  test('legacy saves without storyCleared derive it from won scenes', () => {
    const legacySave = {
      schemaVersion: 2,
      unlockedScenes: ['marina-bay-sands'],
      sceneResults: {
        'marina-bay-sands': {
          sceneId: 'marina-bay-sands',
          stars: 2,
          highScore: 1200,
          bestTime: 45,
          completedAt: '2026-09-01T00:00:00.000Z',
        },
      },
      totalScore: 1200,
      discovered: {},
    };

    const migrated = readProgress(legacySave);
    expect(migrated.schemaVersion).toBe(3);
    expect(migrated.storyCleared).toEqual(['marina-bay-sands']);
  });

  test('merging preserves storyCleared sets', () => {
    const local: GameProgress = {
      schemaVersion: 3,
      unlockedScenes: ['page-a'],
      storyCleared: ['page-a'],
      sceneResults: {},
      totalScore: 100,
      discovered: {},
    };

    const remote: GameProgress = {
      schemaVersion: 3,
      unlockedScenes: ['page-b'],
      storyCleared: ['page-b'],
      sceneResults: {},
      totalScore: 200,
      discovered: {},
    };

    const merged = mergeProgress(local, remote);
    expect(merged.storyCleared).toContain('page-a');
    expect(merged.storyCleared).toContain('page-b');
  });
});
