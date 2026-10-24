import type { Challenge } from '../core/challenge';
import type { Chapter, Country, GameProgress, Page, PageRef } from '../core/model';
import { progress } from '../core/progress';
import {
  evaluateStoryProgress,
  getCountryLockReason,
  getPageLockReason,
  type StoryProgressState,
} from '../core/story';
import { singapore } from './countries/singapore';
import { thailand } from './countries/thailand';
import { vietnam } from './countries/vietnam';

/**
 * The catalogue of sketchbooks. Adding a country = adding its folder under countries/ and
 * listing it here (see "Thêm một quốc gia" in the README); everything else is derived.
 */
export const COUNTRIES: Country[] = [singapore, thailand, vietnam];

/** The sketchbook a new player opens first. */
export const FIRST_COUNTRY = COUNTRIES[0];

/* ------------------------------ Derived views ------------------------------ */

const pagesByCountry = new Map<string, PageRef[]>();
const refByPageId = new Map<string, PageRef>();
const chapterIds = new Set<string>();

for (const country of COUNTRIES) {
  const refs: PageRef[] = [];
  country.chapters.forEach((chapter, c) => {
    // Solved mysteries are saved by chapter id, whichever country the chapter is in
    if (chapterIds.has(chapter.id)) throw new Error(`Duplicate chapter id "${chapter.id}": solved mysteries are saved by chapter id`);
    chapterIds.add(chapter.id);
    for (const slot of chapter.pages) {
      const ref: PageRef = {
        country,
        chapter,
        chapterNumber: c + 1,
        index: refs.length,
        number: refs.length + 1,
        day: slot.day,
        night: slot.night,
      };
      refs.push(ref);
      for (const page of [slot.day, slot.night]) {
        if (!page) continue;
        if (refByPageId.has(page.id)) throw new Error(`Duplicate page id "${page.id}": progress is saved by page id`);
        if (!(page.art in country.art)) throw new Error(`Page "${page.id}" uses art "${page.art}", missing from ${country.id}'s art`);
        refByPageId.set(page.id, ref);
      }
    }
  });
  pagesByCountry.set(country.id, refs);
}

/** The two letters of a country in challenge codes. */
export const codeOf = (country: Country) => country.code ?? country.id.slice(0, 2).toUpperCase();

{
  const codes = COUNTRIES.map(codeOf);
  const twice = codes.find((code, i) => codes.indexOf(code) !== i);
  if (twice) throw new Error(`Two countries share the code "${twice}": challenge codes would be ambiguous`);
}

export function countryById(id: string): Country {
  return COUNTRIES.find((c) => c.id === id) ?? FIRST_COUNTRY;
}

/** Every page of a country's book, in reading order (day pages; nights hang off them). */
export function pagesOf(country: Country): PageRef[] {
  return pagesByCountry.get(country.id) ?? [];
}

/** The book position of a page (day or night). */
export function pageRefOf(page: Page): PageRef | undefined {
  return refByPageId.get(page.id);
}

/** Where a page id sits in the books, and whether it is a night variant (null: no such page). */
export function placeOf(pageId: string): { ref: PageRef; night: boolean } | null {
  const ref = refByPageId.get(pageId);
  return ref ? { ref, night: ref.night?.id === pageId } : null;
}

function refOf(page: Page): PageRef {
  const ref = refByPageId.get(page.id);
  if (!ref) throw new Error(`Unknown page "${page.id}"`);
  return ref;
}

/** The painting of a page, as a bundled image (`require`d) for <Image> or the Skia loader. */
export function artOf(page: Page): number {
  return refOf(page).country.art[page.art];
}

/** A name for a painting that is unique across countries (a page and its night share one). */
export function artIdOf(page: Page): string {
  return `${refOf(page).country.id}/${page.art}`;
}

/** The challenge of a hunt on a page (day or night) laid out with a seed, done in `time` seconds. */
export function challengeOf(page: Page, seed: number, time?: number): Challenge {
  const { ref, night } = placeOf(page.id) ?? { ref: refOf(page), night: false };
  return { country: codeOf(ref.country), page: ref.number, night, seed, ...(time ? { time } : {}) };
}

/** The page a challenge is played on (null: no such page in this version of the books). */
export function pageOfChallenge(c: Challenge): { ref: PageRef; night: boolean } | null {
  const country = COUNTRIES.find((k) => codeOf(k) === c.country);
  const ref = country ? pagesOf(country)[c.page - 1] : undefined;
  if (!ref || (c.night && !ref.night)) return null;
  return { ref, night: c.night };
}

/** Every chapter of every country, in reading order. */
export const allChapters = (): Chapter[] => COUNTRIES.flatMap((c) => c.chapters);

/** Every page there is — day and night, all countries (the album lists their creatures). */
export function allPages(): Page[] {
  const days: Page[] = [];
  const nights: Page[] = [];
  for (const country of COUNTRIES) {
    for (const ref of pagesOf(country)) {
      days.push(ref.day);
      if (ref.night) nights.push(ref.night);
    }
  }
  return [...days, ...nights];
}

/** All day page slots in linear reading order across all countries. */
export function allStoryRefs(): PageRef[] {
  return STORY_REFS;
}

// The catalogue never changes at run time, so the reading order is built once
const STORY_REFS: PageRef[] = COUNTRIES.flatMap((c) => pagesOf(c));
// Page id (day or night) → its slot in STORY_REFS
const STORY_INDEX = new Map<string, number>();
STORY_REFS.forEach((r, i) => {
  STORY_INDEX.set(r.day.id, i);
  if (r.night) STORY_INDEX.set(r.night.id, i);
});
// Progress snapshots are immutable (every save replaces the object), so one evaluation per
// snapshot serves the clock tick and every index card instead of re-walking the journey each call
const STORY_STATES = new WeakMap<GameProgress, StoryProgressState>();

/**
 * Story progression queries pre-bound to the catalogue of sketchbooks.
 */
export const story = {
  /** Full evaluation of the linear story journey. */
  state(p?: GameProgress): StoryProgressState {
    const current =
      p ??
      (typeof progress?.get === 'function'
        ? progress.get()
        : {
            schemaVersion: 3,
            unlockedScenes: [],
            sceneResults: {},
            totalScore: 0,
            discovered: {},
          });
    let state = STORY_STATES.get(current);
    if (!state) {
      state = evaluateStoryProgress(STORY_REFS, current);
      STORY_STATES.set(current, state);
    }
    return state;
  },

  /** Whether a page (day or night) is currently unlocked in story mode. */
  isUnlocked(pageId: string, p?: GameProgress): boolean {
    const s = this.state(p);
    return s.unlockedPageIds.has(pageId) || s.unlockedNightIds.has(pageId);
  },

  /** Whether a country's sketchbook is currently unlocked. */
  isCountryUnlocked(countryId: string, p?: GameProgress): boolean {
    return this.state(p).unlockedCountryIds.has(countryId);
  },

  /** Human-friendly lock reason if locked, or empty string if unlocked. */
  lockReason(pageId: string, p?: GameProgress): string {
    const s = this.state(p);
    if (s.unlockedPageIds.has(pageId) || s.unlockedNightIds.has(pageId)) return '';
    return getPageLockReason(pageId, STORY_REFS, s);
  },

  /** Human-friendly country lock reason if locked, or empty string if unlocked. */
  countryLockReason(countryId: string, p?: GameProgress): string {
    const s = this.state(p);
    if (s.unlockedCountryIds.has(countryId)) return '';
    return getCountryLockReason(countryId, COUNTRIES, STORY_REFS, s);
  },

  /** Next day page to play in the story, or null if entire journey completed. */
  nextTarget(p?: GameProgress): Page | null {
    return this.state(p).nextDayPage;
  },

  /** Whether the full story journey across all countries is complete. */
  isJourneyCompleted(p?: GameProgress): boolean {
    return this.state(p).journeyCompleted;
  },

  /** The next page in the story sequence after `pageId` (day or night), or null if end of journey. */
  nextPageAfter(pageId: string): { ref: PageRef; night: boolean } | null {
    const idx = STORY_INDEX.get(pageId);
    if (idx === undefined || idx + 1 >= STORY_REFS.length) return null;
    return { ref: STORY_REFS[idx + 1], night: false };
  },
};

