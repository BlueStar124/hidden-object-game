import {
  friendPage,
  isFriendChallenge,
  type Challenge,
  type FriendChallenge,
} from '../core/challenge';
import { dailyPage, type DailyPuzzle } from '../core/daily';
import { withDayTwins } from '../core/dayNight';
import { hasSpots, layOutPage } from '../core/layout';
import { withVisitors } from '../core/migrants';
import type { Country, Page, ToolId } from '../core/model';
import { progress } from '../core/progress';
import { localDay, SEED_COUNT } from '../core/random';
import { withRareCritter } from '../core/rare';
import { withTools } from '../core/tools';
import { pagesOf, placeOf, story } from '../content';
import { MIGRANTS } from '../content/migrants';
import { ownedTools } from './ownedTools';

/** How the page on screen is being played. */
export type PlayMode =
  | { kind: 'book' }
  | { kind: 'daily'; puzzle: DailyPuzzle }
  | { kind: 'challenge'; challenge: Challenge | FriendChallenge };

export const BOOK: PlayMode = { kind: 'book' };

export interface Spot {
  countryId: string;
  index: number;
  night: boolean;
}

export interface Place extends Spot {
  visit: number;
  seed: number;
  mode: PlayMode;
  roll: number; // this visit's chance of a golden critter (core/rare), rolled when it opens
  tools: ToolId[]; // the tools the player had when it opened (core/tools)
  day: string; // the day it opened: which travelling creatures visit (core/migrants)
}

/** What a visit to a page will be, decided before it opens: its layout and its chance. */
export interface Fate {
  seed: number;
  roll: number;
}

export function pageAt(country: Country, index: number, night: boolean): Page {
  const ref = pagesOf(country)[index];
  return (night && ref.night) || ref.day;
}

/** The day page of a page (itself for a day page). */
export const dayOf = (page: Page) => placeOf(page.id)?.ref.day ?? page;

/**
 * A page as it opens on a day, before this visit's layout and chance: where its moved things were by
 * day (night pages), tools, travelling visitors.
 */
export const openingPage = (page: Page, tools: readonly ToolId[], day: string) =>
  withVisitors(withTools(withDayTwins(page, dayOf(page)), tools), day, MIGRANTS);

/** A page of the book as a visit plays it: laid out for its seed, maybe with a golden critter. */
export const visitOf = (page: Page, tools: readonly ToolId[], day: string, fate: Fate) =>
  withRareCritter(layOutPage(openingPage(page, tools, day), fate.seed), fate.roll);

/** The page as a visit plays it (a daily corner has only main objects: no visitor, no golden critter). */
export function pageFor(
  country: Country,
  index: number,
  night: boolean,
  seed: number,
  mode: PlayMode,
  roll: number,
  tools: ToolId[],
  day: string
): Page {
  const page = pageAt(country, index, night);
  if (mode.kind === 'daily') return dailyPage(withTools(page, tools), mode.puzzle);
  const visit = visitOf(page, tools, day, { seed, roll });
  return mode.kind === 'challenge' && isFriendChallenge(mode.challenge) ? friendPage(visit, mode.challenge) : visit;
}

/** A first visit plays the page as written; once solved, its objects may hide elsewhere. */
export function seedFor(page: Page): number {
  const solved = (progress.pageResult(page.id)?.stars ?? 0) > 0;
  return solved && hasSpots(page) ? 1 + Math.floor(Math.random() * (SEED_COUNT - 1)) : 0;
}

/** The page the player was last in, if it is still in the books and unlocked. */
export function savedPlace(): Place | null {
  const id = progress.lastPage();
  if (!id) return null;
  const saved = placeOf(id);
  if (saved && story.isUnlocked(id)) {
    return {
      countryId: saved.ref.country.id,
      index: saved.ref.index,
      night: saved.night,
      visit: 0,
      seed: 0,
      mode: BOOK,
      roll: Math.random(),
      tools: ownedTools(),
      day: localDay(new Date()),
    };
  }
  const target = story.nextTarget();
  const targetPlace = target ? placeOf(target.id) : null;
  if (targetPlace) {
    return {
      countryId: targetPlace.ref.country.id,
      index: targetPlace.ref.index,
      night: targetPlace.night,
      visit: 0,
      seed: 0,
      mode: BOOK,
      roll: Math.random(),
      tools: ownedTools(),
      day: localDay(new Date()),
    };
  }
  return null;
}
