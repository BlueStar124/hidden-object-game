import type { HintResult } from './hints';
import { isMainObject, type CaseState, type HiddenObject, type Page } from './model';
import { completionBonus, foundScore, hintPenalty, mistakePenalty } from './scoring';

/**
 * The case file of one page: pure transitions of its CaseState. The game hook (game/useCase)
 * applies them and adds what the player hears and sees — sounds, notices, saving.
 */

// A find within this many seconds of the previous one keeps the combo going
export const COMBO_WINDOW = 6;

export function openCase(page: Page): CaseState {
  return {
    pageId: page.id,
    score: 0,
    foundItems: [],
    foundAt: {},
    secretFound: false,
    isExploring: false,
    mistakes: 0,
    hintsUsed: 0,
    remainingTime: page.timeLimit,
    isPaused: false,
    isCompleted: false,
    isGameOver: false,
    combo: 1,
    comboTimer: 0,
    activeHint: null,
  };
}

/** One second of investigation: the clock runs down and an idle combo wears off. */
export function clockTick(c: CaseState): CaseState {
  const remainingTime = Math.max(0, c.remainingTime - 1);
  const comboTimer = Math.max(0, c.comboTimer - 1);
  return {
    ...c,
    remainingTime,
    combo: comboTimer === 0 && c.combo > 1 ? 1 : c.combo,
    comboTimer,
    isGameOver: remainingTime === 0,
  };
}

export interface FindResult {
  /** What the find changes in the case (the clock keeps running meanwhile: merge, don't replace) */
  changes: Partial<CaseState>;
  earned: number; // points this find was worth
  combo: number; // multiplier it was scored with
  /** Set when this find closed the case (every main object found) */
  solved: { timeBonus: number; stars: number; score: number } | null;
}

/** Something was found during the investigation. */
export function recordFind(
  c: CaseState,
  page: Page,
  object: HiddenObject,
  position: { x: number; y: number } | undefined
): FindResult {
  const { earnedScore, newScore, combo } = foundScore(object.score, c.combo, c.score);
  const foundItems = [...c.foundItems, object.id];
  // Roaming creatures stay where they were caught
  const foundAt = object.roam && position ? { ...c.foundAt, [object.id]: position } : c.foundAt;
  const solved = page.objects.filter(isMainObject).every((o) => foundItems.includes(o.id));
  const bonus = solved ? completionBonus(c.remainingTime, c.mistakes, c.hintsUsed) : null;
  const score = bonus ? newScore + bonus.timeBonus : newScore;

  const changes: Partial<CaseState> = {
    foundItems,
    foundAt,
    score,
    combo: combo + 1,
    comboTimer: COMBO_WINDOW,
    activeHint: null,
  };
  if (object.isSecret) changes.secretFound = true;
  if (solved) changes.isCompleted = true;
  return { changes, earned: earnedScore, combo, solved: bonus ? { ...bonus, score } : null };
}

/** After the case is closed: a critter or the secret still found for the album (no score). */
export function recordExploreFind(c: CaseState, object: HiddenObject, position: { x: number; y: number } | undefined): CaseState {
  return {
    ...c,
    foundItems: [...c.foundItems, object.id],
    foundAt: position ? { ...c.foundAt, [object.id]: position } : c.foundAt,
    secretFound: object.isSecret ? true : c.secretFound,
  };
}

/** A wrong guess: a penalty, and the combo is broken. */
export function recordMiss(c: CaseState): CaseState {
  return { ...c, mistakes: c.mistakes + 1, combo: 1, comboTimer: 0, score: mistakePenalty(c.score) };
}

export function recordHint(c: CaseState, hint: HintResult): CaseState {
  return {
    ...c,
    hintsUsed: c.hintsUsed + 1,
    score: hintPenalty(c.score, hint.level),
    activeHint: {
      level: hint.level,
      objectId: hint.targetObject.id,
      clueText: hint.clueText,
      radarPoint: hint.radarPoint,
    },
  };
}

/** Optional critters & the secret still hiding (what "explore" mode is for). */
export function leftovers(c: CaseState, page: Page): HiddenObject[] {
  return page.objects.filter((o) => (o.isBonus || o.isSecret) && !c.foundItems.includes(o.id));
}
