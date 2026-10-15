import { describe, expect, test } from '@jest/globals';
import { clockTick, COMBO_WINDOW, leftovers, openCase, recordExploreFind, recordFind, recordHint, recordMiss } from '../src/core/caseFile';
import {
  canChallengePage,
  challengeSeed,
  encodeChallenge,
  FRIEND_CONTENT_VERSION,
  FRIEND_OBJECT_SCORE,
  friendChallengeRefusal,
  friendPage,
  isFriendChallenge,
  parseChallenge,
  parseFriendCode,
  readFriendChallenge,
} from '../src/core/challenge';
import { DAILY_MAX_FINDS, DAILY_MIN_FINDS, DAILY_TIME_LIMIT, dailyPage, dailyPuzzle, inFocus } from '../src/core/daily';
import { withDayTwins } from '../src/core/dayNight';
import { detectObject, nextInSequence } from '../src/core/detection';
import { nextHint } from '../src/core/hints';
import { hasSpots, layOutPage, layoutKey } from '../src/core/layout';
import { isShyVisible, objectPosition, roamState, shyPhase } from '../src/core/motion';
import { isMainObject, type Chapter, type HiddenObject, type Page, type RoamBehavior, type ShyBehavior } from '../src/core/model';
import { canDeduce, cluesOf, hasMystery, isRightAnswer, mysteryProgress } from '../src/core/mystery';
import { hashString, localDay, rng, SEED_COUNT, shuffled } from '../src/core/random';
import { cleanDisplayName, displayNameOf, NAME_MAX } from '../src/core/profile';
import { RARE_CHANCE, withRareCritter } from '../src/core/rare';
import { chapterGiving, toolsOwned, withTools } from '../src/core/tools';
import { migrantObjectId, migrantProgress, migrantSpot, withVisitors } from '../src/core/migrants';
import type { Migrant } from '../src/core/model';
import { completionBonus, foundScore, hintPenalty, mistakePenalty } from '../src/core/scoring';

const object = (id: string, extra: Partial<HiddenObject> = {}): HiddenObject => ({
  id,
  name: id,
  clue: `clue of ${id}`,
  x: 0.5,
  y: 0.5,
  radius: 0.035,
  score: 100,
  spriteType: 'compass',
  ...extra,
});

/** A time on the creature clock at which a cycle of `period` seconds is at `phase` (0–1). */
function atPhase(period: number, phase: number): number {
  const now = performance.now();
  const current = shyPhase({ period }, now);
  return now + ((phase - current + 1) % 1) * period * 1000;
}

describe('challenge eligibility', () => {
  test('requires prior play of the exact page, with day and night kept separate', () => {
    expect(canChallengePage('gardens-by-the-bay', [])).toBe(false);
    expect(canChallengePage('gardens-by-the-bay', ['gardens-by-the-bay'])).toBe(true);
    expect(canChallengePage('gardens-by-the-bay-night', ['gardens-by-the-bay'])).toBe(false);
    expect(canChallengePage('gardens-by-the-bay', ['gardens-by-the-bay-night'])).toBe(false);
    expect(canChallengePage('merlion-park', ['gardens-by-the-bay'])).toBe(false);
  });

  test('new challenges always use a reproducible nonzero seed within the code range', () => {
    for (const roll of [0, 0.25, 0.5, 0.999999, 1]) {
      const seed = challengeSeed(roll);
      expect(seed).toBeGreaterThan(0);
      expect(seed).toBeLessThan(SEED_COUNT);
      expect(parseChallenge(encodeChallenge({ country: 'SG', page: 2, night: false, seed }))?.seed).toBe(seed);
    }
  });
});

describe('scoring', () => {
  test('a find scores its points times the combo, plus 50 per combo step', () => {
    expect(foundScore(100, 1, 0)).toEqual({ earnedScore: 100, newScore: 100, combo: 1 });
    expect(foundScore(100, 2, 100)).toEqual({ earnedScore: 250, newScore: 350, combo: 2 });
    expect(foundScore(100, 3, 350)).toEqual({ earnedScore: 400, newScore: 750, combo: 3 });
    expect(foundScore(100, 0, 0).combo).toBe(1);
  });

  test('penalties never take the score below zero', () => {
    expect(mistakePenalty(50)).toBe(30);
    expect(mistakePenalty(10)).toBe(0);
    expect([1, 2].map((level) => hintPenalty(200, level))).toEqual([150, 100]);
    expect(hintPenalty(30, 2)).toBe(0);
  });

  test('closing a case: 4 points per second left, stars for a clean investigation', () => {
    expect(completionBonus(80, 1, 0)).toEqual({ timeBonus: 320, stars: 3 });
    expect(completionBonus(10.7, 0, 0).timeBonus).toBe(42);
    expect(completionBonus(60, 0, 0).stars).toBe(2); // three stars need more than a minute left
    expect(completionBonus(40, 4, 2).stars).toBe(2);
    expect(completionBonus(20, 8, 3).stars).toBe(1);
  });
});

describe('detection', () => {
  const now = performance.now();

  test('a tap on an unfound object hits it; found objects are ignored', () => {
    const target = object('target');
    expect(detectObject(0.5, 0.5, [target], [], now)).toMatchObject({ hit: true, object: target, position: { x: 0.5, y: 0.5 } });
    expect(detectObject(0.5, 0.5, [target], ['target'], now).hit).toBe(false);
  });

  test('a miss reports the nearest object', () => {
    const near = object('near', { x: 0.3 });
    const far = object('far', { x: 0.9 });
    const miss = detectObject(0.1, 0.5, [far, near], [], now);
    expect(miss.hit).toBe(false);
    expect(miss.object).toBe(near);
  });

  test('when hit areas overlap, the nearest object wins', () => {
    const a = object('a', { x: 0.5, radius: 0.05 });
    const b = object('b', { x: 0.52, radius: 0.05 });
    expect(detectObject(0.515, 0.5, [a, b], [], now).object).toBe(b);
    expect(detectObject(0.505, 0.5, [a, b], [], now).object).toBe(a);
  });

  test('the hit radius is a fraction of the page width, in both directions', () => {
    // The spread is 1760 × 1240: 0.035 of its width is 0.0497 of its height
    const target = object('target');
    expect(detectObject(0.5 + 0.04, 0.5, [target], [], now).hit).toBe(false);
    expect(detectObject(0.5, 0.5 + 0.045, [target], [], now).hit).toBe(true);
  });

  test('a shy creature can only be caught while it peeks out', () => {
    const shy: ShyBehavior = { period: 6 };
    const creature = object('gecko', { shy });
    const hidden = atPhase(shy.period, 0.7);
    const out = atPhase(shy.period, 0.2);
    expect(isShyVisible(shy, hidden)).toBe(false);
    expect(detectObject(0.5, 0.5, [creature], [], hidden)).toMatchObject({ hit: false, hidingObject: creature });
    expect(detectObject(0.5, 0.5, [creature], [], out)).toMatchObject({ hit: true, object: creature });
  });

  test('a roaming creature is caught where it is drawn at that moment', () => {
    const roam: RoamBehavior = { path: [[0.2, 0.5], [0.8, 0.5]], period: 10 };
    const creature = object('firefly', { x: 0.2, y: 0.5, roam });
    const t = atPhase(roam.period, 0.25);
    const drawn = objectPosition(creature, t);
    expect(drawn.x).toBeGreaterThan(0.3);
    expect(detectObject(0.2, 0.5, [creature], [], t).hit).toBe(false);
    const hit = detectObject(drawn.x, drawn.y, [creature], [], t);
    expect(hit.hit).toBe(true);
    expect(hit.position).toEqual(drawn);
  });
});

describe('creature motion', () => {
  test('cycles repeat exactly, and an offset shifts them', () => {
    const now = performance.now();
    expect(shyPhase({ period: 7, offset: 1.5 }, now + 7000)).toBeCloseTo(shyPhase({ period: 7, offset: 1.5 }, now), 6);
    expect(shyPhase({ period: 8, offset: 2 }, now)).toBeCloseTo(shyPhase({ period: 8 }, now + 2000), 6);
  });

  test('a ping-pong roamer goes there and back, facing its way', () => {
    const roam: RoamBehavior = { path: [[0.2, 0.4], [0.8, 0.6]], period: 10, facing: 'right' };
    const start = roamState(roam, atPhase(10, 0));
    const end = roamState(roam, atPhase(10, 0.5));
    expect(start.x).toBeCloseTo(0.2, 3);
    expect(start.y).toBeCloseTo(0.4, 3);
    expect(end.x).toBeCloseTo(0.8, 3);
    expect(end.y).toBeCloseTo(0.6, 3);
    expect(roamState(roam, atPhase(10, 0.25)).flip).toBe(false);
    expect(roamState(roam, atPhase(10, 0.75)).flip).toBe(true);
  });

  test('a looping roamer comes back to its first point', () => {
    const roam: RoamBehavior = { path: [[0.2, 0.2], [0.8, 0.2], [0.5, 0.8]], period: 12, loop: true };
    const t = atPhase(12, 0.999);
    const state = roamState(roam, t);
    expect(state.x).toBeCloseTo(0.2, 2);
    expect(state.y).toBeCloseTo(0.2, 2);
  });
});

describe('hints', () => {
  const objects = [
    object('first', { x: 0.6, y: 0.5 }),
    object('second'),
    object('secret', { isSecret: true }),
    object('critter', { isBonus: true }),
  ];
  const loupe = { nx: 0.1, ny: 0.5 };

  test('main objects first, then the secret; optional critters are never hinted', () => {
    expect(nextHint(null, [], objects, ['first'], loupe)?.targetObject.id).toBe('second');
    expect(nextHint(null, [], objects, ['first', 'second'], loupe)?.targetObject.id).toBe('secret');
    expect(nextHint(null, [], objects, ['first', 'second', 'secret'], loupe)).toBeNull();
    expect(nextHint(null, [], objects, [], loupe, 'critter')).toBeNull();
  });

  test('progressive 2-step hints per object: step 1 reveals text, step 2 reveals position', () => {
    // Initially, no text revealed
    const step1 = nextHint(null, [], objects, [], loupe);
    expect(step1).toMatchObject({ level: 1, targetObject: objects[0], clueText: 'clue of first', radarPoint: undefined });

    // With active hint at level 1 on 'first', asking again yields level 2 (position) on 'first'
    const step2 = nextHint({ level: 1, objectId: 'first' }, ['first'], objects, [], loupe);
    expect(step2).toMatchObject({ level: 2, targetObject: objects[0], radarPoint: { x: 0.6, y: 0.5 } });

    // When 'first' is found, next hint targets 'second' at level 1
    const nextObjStep1 = nextHint(null, ['first'], objects, ['first'], loupe);
    expect(nextObjStep1).toMatchObject({ level: 1, targetObject: objects[1], radarPoint: undefined });
  });

  test('after showing where it is, the button reads the next card; once all are read, it points again', () => {
    const shown = { level: 2 as const, objectId: 'first' };
    expect(nextHint(shown, ['first'], objects, [], loupe)).toMatchObject({ level: 1, targetObject: objects[1] });
    expect(nextHint(shown, ['first', 'second'], objects, [], loupe)).toMatchObject({
      level: 2,
      targetObject: objects[0],
      nudgeDirection: { x: 1, y: 0 },
    });
  });

  test('targeted hint directly on a specific object card', () => {
    // Tapping 'second' card directly while 'first' is unrevealed
    const targetedStep1 = nextHint(null, [], objects, [], loupe, 'second');
    expect(targetedStep1).toMatchObject({ level: 1, targetObject: objects[1], radarPoint: undefined });

    // Tapping 'second' card again when its text is revealed yields position
    const targetedStep2 = nextHint({ level: 1, objectId: 'second' }, ['second'], objects, [], loupe, 'second');
    expect(targetedStep2).toMatchObject({ level: 2, targetObject: objects[1], radarPoint: { x: 0.5, y: 0.5 } });
  });
});

describe('case file', () => {
  const page: Page = {
    id: 'test-page',
    title: 'Test',
    subtitle: '',
    art: 'test',
    timeLimit: 120,
    storyClue: '',
    objects: [
      object('first'),
      object('second', { roam: { path: [[0.1, 0.1], [0.9, 0.9]], period: 8 } }),
      object('secret', { isSecret: true, score: 500 }),
      object('critter', { isBonus: true }),
    ],
  };
  const [first, second, secret, critter] = page.objects;

  test('opening a case starts the clock at the page time limit', () => {
    expect(openCase(page)).toMatchObject({ pageId: 'test-page', remainingTime: 120, score: 0, combo: 1, foundItems: [] });
  });

  test('finds build a combo, and the last main object closes the case with a bonus', () => {
    const opened = openCase(page);
    const one = recordFind(opened, page, first, undefined);
    expect(one).toMatchObject({ earned: 100, combo: 1, solved: null });
    expect(one.changes).toMatchObject({ combo: 2, comboTimer: COMBO_WINDOW, foundAt: {} });

    const afterOne = { ...opened, ...one.changes };
    const two = recordFind(afterOne, page, second, { x: 0.4, y: 0.4 });
    expect(two.earned).toBe(250);
    expect(two.solved).toEqual({ timeBonus: 480, stars: 3, score: 100 + 250 + 480 });
    expect(two.changes).toMatchObject({ isCompleted: true, foundAt: { second: { x: 0.4, y: 0.4 } } });
  });

  test('the secret is optional but recorded', () => {
    const found = recordFind(openCase(page), page, secret, undefined);
    expect(found.solved).toBeNull();
    expect(found.changes.secretFound).toBe(true);
  });

  test('a wrong guess costs points and breaks the combo', () => {
    const c = { ...openCase(page), score: 100, combo: 3, comboTimer: 4 };
    expect(recordMiss(c)).toMatchObject({ mistakes: 1, score: 80, combo: 1, comboTimer: 0 });
  });

  test('the clock runs down, an idle combo wears off, and time up ends the case', () => {
    let c = { ...openCase(page), remainingTime: 2, combo: 3, comboTimer: 1 };
    c = clockTick(c);
    expect(c).toMatchObject({ remainingTime: 1, combo: 1, comboTimer: 0, isGameOver: false });
    c = clockTick(c);
    expect(c).toMatchObject({ remainingTime: 0, isGameOver: true });
    expect(clockTick(c).remainingTime).toBe(0);
  });

  test('a hint costs points and is shown until the next find', () => {
    const c = { ...openCase(page), score: 300 };
    const hinted = recordHint(c, nextHint({ level: 1, objectId: 'first' }, ['first'], page.objects, [], { nx: 0, ny: 0 })!);
    expect(hinted).toMatchObject({ hintsUsed: 1, score: 200, activeHint: { level: 2, objectId: 'first' } });
    expect(recordFind(hinted, page, first, undefined).changes.activeHint).toBeNull();
  });

  test('hint reveals text id and records it into revealedTextIds', () => {
    const opened = openCase(page);
    expect(opened.revealedTextIds).toEqual([]);
    const step1 = nextHint(null, opened.revealedTextIds, page.objects, [], { nx: 0, ny: 0 });
    const afterHint = recordHint(opened, step1!);
    expect(afterHint.revealedTextIds).toContain('first');
    expect(afterHint.activeHint?.level).toBe(1);
  });

  test('after the case is closed, leftovers can still be found for the album', () => {
    const closed = { ...openCase(page), foundItems: ['first', 'second'], isCompleted: true, score: 900 };
    expect(leftovers(closed, page)).toEqual([secret, critter]);
    const explored = recordExploreFind(closed, critter, { x: 0.3, y: 0.3 });
    expect(explored.score).toBe(900);
    expect(leftovers(explored, page)).toEqual([secret]);
  });
});

/* ------------------------------------------------------------------------- */

const pageOf = (id: string, objects: HiddenObject[], extra: Partial<Page> = {}): Page => ({
  id,
  title: id,
  subtitle: '',
  art: 'art',
  timeLimit: 300,
  storyClue: '',
  objects,
  ...extra,
});

describe('seeded chance', () => {
  test('the same seed draws the same numbers, a different one others', () => {
    const a = rng(42);
    const b = rng(42);
    const draws = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(draws);
    expect(draws.every((n) => n >= 0 && n < 1)).toBe(true);
    expect(rng(43)()).not.toBe(draws[0]);
    expect(hashString('page')).toBe(hashString('page'));
  });

  test('a shuffle keeps every item and leaves the original alone', () => {
    const items = [1, 2, 3, 4, 5, 6];
    const out = shuffled(rng(7), items);
    expect([...out].sort()).toEqual(items);
    expect(items).toEqual([1, 2, 3, 4, 5, 6]);
  });

  test('the day is the local calendar day, not the UTC one', () => {
    expect(localDay(new Date(2026, 0, 5, 0, 30))).toBe('2026-01-05');
    expect(localDay(new Date(2026, 9, 12, 23, 59))).toBe('2026-10-12');
  });
});

describe('layouts (other hiding places)', () => {
  const moving = object('moving', {
    spots: [
      { x: 0.2, y: 0.3, clue: 'by the door', radius: 0.05 },
      { x: 0.7, y: 0.6, clue: 'on the roof' },
    ],
  });
  const still = object('still', { x: 0.4, y: 0.4, occluder: [[0, 0], [1, 0], [1, 1]] });
  const page = pageOf('p', [moving, still]);

  test('seed 0 is the page as written; a page with nowhere else to hide never changes', () => {
    expect(layOutPage(page, 0)).toBe(page);
    const fixed = pageOf('fixed', [still]);
    expect(hasSpots(fixed)).toBe(false);
    expect(layOutPage(fixed, 99)).toBe(fixed);
  });

  test('a seed always picks the same spot, keeps the ids, and brings the clue of that spot', () => {
    const places = new Set<string>();
    for (let seed = 1; seed < 60; seed++) {
      const laid = layOutPage(page, seed);
      expect(layOutPage(page, seed)).toEqual(laid);
      expect(laid.id).toBe('p');
      expect(laid.objects.map((o) => o.id)).toEqual(['moving', 'still']);
      expect(laid.objects[1]).toBe(still);
      const o = laid.objects[0];
      places.add(o.clue);
      if (o.clue === 'by the door') expect(o).toMatchObject({ x: 0.2, y: 0.3, radius: 0.05 });
      if (o.clue === 'on the roof') expect(o).toMatchObject({ x: 0.7, y: 0.6, radius: moving.radius });
    }
    expect(places).toEqual(new Set(['clue of moving', 'by the door', 'on the roof']));
  });

  test('layouts of a page are told apart by the caches of the board', () => {
    expect(layoutKey(page)).toBe('p');
    expect(layoutKey(layOutPage(page, 5))).toBe('p#s5');
  });
});

describe('sequence hunts', () => {
  const steps = [object('one', { x: 0.2, order: 1 }), object('two', { x: 0.5, order: 2 }), object('three', { x: 0.8, order: 3 })];

  test('only the next step of the trail can be caught; an early one is not a mistake', () => {
    expect(nextInSequence(steps, [])).toBe(1);
    const early = detectObject(0.5, 0.5, steps, []);
    expect(early.hit).toBe(false);
    expect(early.outOfTurn?.id).toBe('two');
    expect(detectObject(0.2, 0.5, steps, []).object?.id).toBe('one');
    expect(detectObject(0.5, 0.5, steps, ['one']).hit).toBe(true);
    expect(nextInSequence(steps, ['one', 'two', 'three'])).toBeNull();
  });

  test('hints follow the trail and never point at mystery clues', () => {
    expect(nextHint(null, [], steps, [], { nx: 0, ny: 0 })?.targetObject.id).toBe('one');
    expect(nextHint(null, [], steps, ['one'], { nx: 0, ny: 0 })?.targetObject.id).toBe('two');
    expect(nextHint(null, [], steps, [], { nx: 0, ny: 0 }, 'two')).toBeNull();
    const clue = object('clue', { isClue: true });
    expect(nextHint(null, [], [clue, object('main')], [], { nx: 0, ny: 0 })?.targetObject.id).toBe('main');
  });
});

describe('mystery clues', () => {
  const clue = object('note', { isClue: true });
  const main = object('main', { x: 0.2 });
  const page = pageOf('clue-page', [main, clue]);

  test('a clue is optional: the case closes without it, and it stays to find afterwards', () => {
    expect(isMainObject(clue)).toBe(false);
    const solved = recordFind(openCase(page), page, main, undefined);
    expect(solved.solved).not.toBeNull();
    expect(leftovers({ ...openCase(page), ...solved.changes }, page)).toEqual([clue]);
  });

  const chapter: Chapter = {
    id: 'ch',
    title: 'ch',
    subtitle: '',
    prologue: [],
    pages: [{ day: page, night: pageOf('clue-night', [object('glint', { isClue: true })], { isNight: true }) }],
    mystery: {
      question: 'Who?',
      options: [{ text: 'A', nudge: 'Look again' }, { text: 'B', correct: true }],
      epilogue: ['Done'],
    },
  };

  test('the deduction board opens once every fragment of the chapter is found', () => {
    expect(hasMystery(chapter)).toBe(true);
    expect(cluesOf(chapter).map((c) => c.object.id)).toEqual(['note', 'glint']);
    const seen: Record<string, string[]> = { 'clue-page': ['note'] };
    const look = (id: string) => seen[id] ?? [];
    expect(mysteryProgress(chapter, look)).toEqual({ found: 1, total: 2 });
    expect(canDeduce(chapter, look)).toBe(false);
    seen['clue-night'] = ['glint'];
    expect(canDeduce(chapter, look)).toBe(true);
    expect(isRightAnswer(chapter, 0)).toBe(false);
    expect(isRightAnswer(chapter, 1)).toBe(true);
    expect(isRightAnswer(chapter, 9)).toBe(false);
  });

  test('a chapter without a question or fragments has no mystery', () => {
    expect(hasMystery({ ...chapter, mystery: undefined })).toBe(false);
    expect(hasMystery({ ...chapter, pages: [{ day: pageOf('x', [main]) }] })).toBe(false);
  });
});

describe('the daily page', () => {
  // Objects spread over the paper, a few of them close enough to share a corner
  const spread = (i: number) => object(`o${i}`, { x: 0.12 + (i % 6) * 0.14, y: 0.3 + Math.floor(i / 6) * 0.2, radius: 0.02 });
  const walker = object('walker', { x: 0.3, y: 0.4, roam: { path: [[0.2, 0.4], [0.4, 0.4]], period: 4 } });
  const pages = [
    pageOf('a', Array.from({ length: 12 }, (_, i) => spread(i))),
    pageOf('b', [...Array.from({ length: 12 }, (_, i) => spread(i)), walker]),
  ];
  const dayOf = (month: number, d: number) => `2026-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  test('the same day gives everyone the same puzzle; days differ', () => {
    const today = dailyPuzzle('2026-10-12', pages);
    expect(today).not.toBeNull();
    expect(dailyPuzzle('2026-10-12', pages)).toEqual(today);
    const days = Array.from({ length: 20 }, (_, i) => JSON.stringify(dailyPuzzle(dayOf(11, i + 1), pages)));
    expect(new Set(days).size).toBeGreaterThan(1);
  });

  test('a few objects inside a corner of the paper, never a roaming one', () => {
    for (let d = 1; d <= 28; d++) {
      const puzzle = dailyPuzzle(dayOf(2, d), pages)!;
      expect(puzzle.objectIds.length).toBeGreaterThanOrEqual(DAILY_MIN_FINDS);
      expect(puzzle.objectIds.length).toBeLessThanOrEqual(DAILY_MAX_FINDS);
      expect(puzzle.objectIds).not.toContain('walker');
      expect(puzzle.seed).toBeGreaterThan(0);
      expect(puzzle.seed).toBeLessThan(SEED_COUNT);
      const page = dailyPage(pages.find((p) => p.id === puzzle.pageId)!, puzzle);
      expect(page.objects.map((o) => o.id).sort()).toEqual([...puzzle.objectIds].sort());
      for (const o of page.objects) expect(inFocus(page, o.x, o.y)).toBe(true);
      expect(page).toMatchObject({ id: puzzle.pageId, timeLimit: DAILY_TIME_LIMIT, focus: puzzle.focus, layout: `d${puzzle.day}` });
    }
  });

  test('taps outside the corner are not in play; a whole page is in play everywhere', () => {
    const focused = pageOf('f', [], { focus: { x: 0.2, y: 0.2, w: 0.4, h: 0.4 } });
    expect(inFocus(focused, 0.3, 0.3)).toBe(true);
    expect(inFocus(focused, 0.9, 0.3)).toBe(false);
    expect(inFocus(pageOf('whole', []), 0.99, 0.01)).toBe(true);
  });

  test('no puzzle when no page has room for one', () => {
    expect(dailyPuzzle('2026-10-12', [pageOf('sparse', [object('alone')])])).toBeNull();
  });
});

describe('challenge codes', () => {
  test('a hunt survives the trip through its code', () => {
    const hunt = { country: 'SG', page: 3, night: false, seed: 123_456, time: 142 };
    const code = encodeChallenge(hunt);
    expect(code).toMatch(/^SG3-[0-9A-Z]{4}-142$/);
    expect(parseChallenge(code)).toEqual(hunt);
    expect(parseChallenge(encodeChallenge({ country: 'VN', page: 21, night: true, seed: 0 }))).toEqual({
      country: 'VN',
      page: 21,
      night: true,
      seed: 0,
    });
    expect(parseChallenge(encodeChallenge({ country: 'TH', page: 1, night: false, seed: SEED_COUNT - 1 }))?.seed).toBe(SEED_COUNT - 1);
  });

  test('codes are found in a pasted message or link, typed in lower case or with look-alike letters', () => {
    const code = encodeChallenge({ country: 'SG', page: 3, night: false, seed: 0, time: 90 });
    expect(parseChallenge(`Thử tìm nhanh hơn mình nhé: https://example.com/?c=${code} !`)?.time).toBe(90);
    expect(parseChallenge(code.toLowerCase())).toEqual(parseChallenge(code));
    expect(parseChallenge('SG3-OOOO')).toEqual(parseChallenge('SG3-0000'));
  });

  test('anything else is not a code', () => {
    for (const text of ['', 'xin chào', 'SG-0000', 'SG0-0000', 'SG3-00', 'SG3-UUUU']) expect(parseChallenge(text)).toBeNull();
  });
});

describe('golden critters', () => {
  const critters = [object('gecko', { isBonus: true, spriteType: 'gecko' }), object('crab', { isBonus: true, spriteType: 'crab' })];
  const page = pageOf('golden', [object('main'), ...critters]);

  test('most visits have none; a lucky roll makes one critter golden, and only that visit looks different', () => {
    expect(withRareCritter(page, RARE_CHANCE)).toBe(page);
    expect(withRareCritter(page, 0.9)).toBe(page);
    const lucky = withRareCritter(page, 0);
    expect(lucky.objects.filter((o) => o.rare).map((o) => o.id)).toEqual(['gecko']);
    expect(withRareCritter(page, RARE_CHANCE * 0.99).objects.find((o) => o.rare)?.id).toBe('crab');
    expect(layoutKey(lucky)).not.toBe(layoutKey(page));
    expect(lucky.objects.map((o) => o.id)).toEqual(page.objects.map((o) => o.id));
  });

  test('a page without critters never has one; a golden critter stays optional', () => {
    const plain = pageOf('plain', [object('main')]);
    expect(withRareCritter(plain, 0)).toBe(plain);
    const gold = withRareCritter(page, 0).objects.find((o) => o.rare)!;
    expect(isMainObject(gold)).toBe(false);
  });

  test('a note in invisible ink is never the golden one (its glints would show where it hides)', () => {
    const note = object('note', { isBonus: true, spriteType: 'letter', requires: 'uv-lens', camo: 'invisible' });
    const inked = pageOf('inked', [object('main'), note, ...critters]);
    for (let roll = 0; roll < RARE_CHANCE; roll += RARE_CHANCE / 50) {
      expect(withRareCritter(inked, roll).objects.find((o) => o.rare)?.id).not.toBe('note');
    }
    const onlyInk = pageOf('only-ink', [object('main'), note]);
    expect(withRareCritter(onlyInk, 0)).toBe(onlyInk);
  });
});

describe('day and night', () => {
  const day = pageOf('day', [object('hat', { x: 0.2, y: 0.4, clue: 'by the door' }), object('cup')]);
  const night = pageOf('day-night', [object('moved-hat', { x: 0.7, y: 0.6, dayTwin: 'hat' }), object('owl')], { isNight: true });

  test('a thing that moved knows where it was by day', () => {
    const twinned = withDayTwins(night, day);
    expect(twinned.objects[0].dayAt).toEqual({ x: 0.2, y: 0.4, clue: 'by the door' });
    expect(twinned.objects[1]).toBe(night.objects[1]);
    // The same page every time, told apart from the page as written by the board's caches
    expect(withDayTwins(night, day)).toBe(twinned);
    expect(layoutKey(twinned)).not.toBe(layoutKey(night));
  });

  test('a page where nothing moved is left as it is', () => {
    expect(withDayTwins(day, day)).toBe(day);
  });
});

describe('the detective tools', () => {
  const note = object('note', { isBonus: true, requires: 'uv-lens', camo: 'invisible' });
  const page = pageOf('toolpage', [object('main'), note]);
  const giving: Chapter = {
    id: 'giving',
    title: '',
    subtitle: '',
    prologue: [],
    pages: [{ day: page }],
    mystery: { question: '?', options: [{ text: 'a', correct: true }], epilogue: [], reward: 'uv-lens' },
  };

  test('a solved mystery hands its tool over', () => {
    expect(toolsOwned([giving], () => false)).toEqual([]);
    expect(toolsOwned([giving, giving], () => true)).toEqual(['uv-lens']);
    expect(chapterGiving([giving], 'uv-lens')).toBe(giving);
  });

  test('without the tool its objects are not there; with it, the page is as written', () => {
    const without = withTools(page, []);
    expect(without.objects.map((o) => o.id)).toEqual(['main']);
    expect(withTools(page, [])).toBe(without); // the same page every time
    expect(layoutKey(without)).not.toBe(layoutKey(page));
    expect(withTools(page, ['uv-lens'])).toBe(page);
    const plain = pageOf('plain', [object('main')]);
    expect(withTools(plain, [])).toBe(plain);
  });

  test('each tool shows only its own objects', () => {
    const sketch = object('sketch', { isBonus: true, requires: 'prism', camo: 'invisible' });
    const tiny = object('tiny', { isBonus: true, requires: 'twin-lens', camo: 'invisible' });
    const many = pageOf('many', [object('main'), note, sketch, tiny]);
    expect(withTools(many, ['prism']).objects.map((o) => o.id)).toEqual(['main', 'sketch']);
    expect(withTools(many, ['twin-lens', 'uv-lens']).objects.map((o) => o.id)).toEqual(['main', 'note', 'tiny']);
    // The same tools in any order: the same page
    expect(withTools(many, ['uv-lens', 'twin-lens'])).toBe(withTools(many, ['twin-lens', 'uv-lens']));
    expect(withTools(many, ['uv-lens', 'prism', 'twin-lens'])).toBe(many);
    const prismChapter: Chapter = { ...giving, id: 'prism-giving', mystery: { ...giving.mystery!, reward: 'prism' } };
    expect(toolsOwned([giving, prismChapter], (id) => id === 'prism-giving')).toEqual(['prism']);
  });

  test('a page laid out after the tools keeps both marks apart in its layout', () => {
    const moving = pageOf('both', [object('m', { spots: [{ x: 0.2, y: 0.3, clue: 'there' }] }), note]);
    const laid = layOutPage(withTools(moving, []), 7);
    // 't' + the tools there are (none), then 's' + the seed
    expect(laid.layout).toBe('ts7');
    expect(layoutKey(laid)).not.toBe(layoutKey(layOutPage(moving, 7)));
  });
});

describe('travelling creatures', () => {
  const swallow: Migrant = {
    id: 'swallow',
    name: 'Swallow',
    spriteType: 'swallow',
    greeting: 'Hello',
    story: 'Story',
    spots: [
      { pageId: 'a', x: 0.3, y: 0.4, clue: 'in a' },
      { pageId: 'b', x: 0.6, y: 0.5, clue: 'in b' },
    ],
  };
  const a = pageOf('a', [object('main')]);
  const b = pageOf('b', [object('main')]);
  const dayOf = (d: number) => `2026-03-${String(d).padStart(2, '0')}`;

  test('each day it is on one page, the same for everyone; days move it about', () => {
    const where = Array.from({ length: 20 }, (_, d) => migrantSpot(swallow, dayOf(d + 1)));
    expect(where.map((_, d) => migrantSpot(swallow, dayOf(d + 1)))).toEqual(where);
    expect(new Set(where)).toEqual(new Set([0, 1]));
  });

  test('it joins only the page it visits, as an optional critter with a lasting id', () => {
    const day = dayOf([...Array(20).keys()].find((d) => migrantSpot(swallow, dayOf(d + 1)) === 0)! + 1);
    const visited = withVisitors(a, day, [swallow]);
    const visitor = visited.objects.find((o) => o.id === migrantObjectId(swallow))!;
    expect(visitor).toMatchObject({ x: 0.3, y: 0.4, clue: 'in a', isBonus: true, spriteType: 'swallow' });
    expect(isMainObject(visitor)).toBe(false);
    expect(layoutKey(visited)).not.toBe(layoutKey(a));
    expect(withVisitors(b, day, [swallow])).toBe(b);
  });

  test('its journey counts the places it was met', () => {
    const seen: Record<string, string[]> = { a: [migrantObjectId(swallow)] };
    expect(migrantProgress(swallow, (id) => seen[id] ?? [])).toEqual({ met: 1, total: 2 });
    seen.b = [migrantObjectId(swallow)];
    expect(migrantProgress(swallow, (id) => seen[id] ?? [])).toEqual({ met: 2, total: 2 });
  });
});

describe("a friend's hunt", () => {
  const knows = (type: string) => type === 'cat' || type === 'owl';
  const item = (id: string, extra: Record<string, unknown> = {}) => ({ id, spriteType: 'cat', name: 'Mèo', clue: 'Trên mái nhà', x: 0.5, y: 0.5, radius: 0.03, ...extra });
  const raw = (objects: unknown[], extra: Record<string, unknown> = {}) => ({
    id: 'f1',
    code: 'H-3FA9C1D2E4B5',
    pageId: 'merlion-park',
    contentVersion: FRIEND_CONTENT_VERSION,
    title: ' Thử thách ',
    objects,
    createdAt: '2026-10-14T00:00:00Z',
    ...extra,
  });

  test('its code is found in any message', () => {
    expect(parseFriendCode('Nhập mã h-3fa9c1d2e4b5 nhé!')).toBe('H-3FA9C1D2E4B5');
    expect(parseFriendCode('SG3-7K2P-142')).toBeNull();
  });

  test('what the server sends is checked object by object', () => {
    const ok = readFriendChallenge(raw([item('a'), item('b', { camo: 'chameleon', flip: true })]), knows)!;
    expect(ok.title).toBe('Thử thách');
    expect(isFriendChallenge(ok)).toBe(true);
    expect(ok.objects.map((o) => o.id)).toEqual(['a', 'b']);
    for (const bad of [
      raw([item('a', { x: 'a' })]),
      raw([item('a', { x: 0.99 })]),
      raw([item('a'), item('a')]),
      raw([item('a', { spriteType: 'dragon' })]),
      raw([item('a', { spriteType: 'seal' })]),
      raw([item('a', { camo: 'gouache' })]),
      raw([item('a', { name: '  ' })]),
      raw([]),
      raw([item('a')], { code: 'nope' }),
      null,
    ]) {
      expect(readFriendChallenge(bad, knows)).toBeNull();
    }
  });

  test('a hunt made for newer content is refused; it is played with only its own objects', () => {
    const ok = readFriendChallenge(raw([item('a')]), knows)!;
    expect(friendChallengeRefusal(ok)).toBeNull();
    expect(friendChallengeRefusal({ ...ok, contentVersion: FRIEND_CONTENT_VERSION + 1 })).toBe('newer');
    const page = friendPage(pageOf('merlion-park', [object('main')]), ok);
    expect(page.objects).toEqual([expect.objectContaining({ id: 'a', score: FRIEND_OBJECT_SCORE })]);
    expect(page.title).toBe('Thử thách');
    expect(layoutKey(page)).toBe('merlion-park#friend-f1');
    expect(isFriendChallenge({ country: 'SG', page: 1, night: false, seed: 1 })).toBe(false);
  });
});

describe('the name in the game', () => {
  test('a typed name is tidied, and must be 2 to 24 characters', () => {
    expect(cleanDisplayName('  Thám   tử\tLan ')).toBe('Thám tử Lan');
    expect(cleanDisplayName('A')).toBeNull();
    expect(cleanDisplayName('   ')).toBeNull();
    expect(cleanDisplayName('x'.repeat(NAME_MAX + 1))).toBeNull();
    expect(cleanDisplayName('Lan\u0007')).toBe('Lan');
    // Counted in characters, not code units: a name with emoji is not cut short
    expect(cleanDisplayName('🦊'.repeat(NAME_MAX))).toBe('🦊'.repeat(NAME_MAX));
  });

  test("the chosen name comes first, then the provider's (cut to fit), else none", () => {
    expect(displayNameOf({ display_name: 'Lan', full_name: 'Nguyễn Thị Lan' })).toBe('Lan');
    expect(displayNameOf({ full_name: 'Nguyễn Thị Lan' })).toBe('Nguyễn Thị Lan');
    expect(displayNameOf({ name: 'A Very Long Google Account Name Indeed' })).toHaveLength(NAME_MAX);
    expect(displayNameOf({ display_name: ' ', name: 'Lan' })).toBe('Lan');
    expect(displayNameOf({})).toBeNull();
    expect(displayNameOf(null)).toBeNull();
  });
});
