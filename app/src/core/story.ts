import type { Country, GameProgress, Page, PageRef } from './model';

/**
 * Story progression rules (Pure TS logic):
 *
 * 1. Linear sequence: day pages open strictly in order.
 *    Singapore: 1 -> 9. Clearing page 9 unlocks Thailand page 1.
 *    Thailand: 1 -> 9. Clearing page 9 unlocks Vietnam page 1.
 *    Vietnam: 1 -> 19. Clearing page 19 completes the story journey.
 *
 * 2. Completion condition:
 *    A story day page is completed by winning it at least once in story/book mode (stars >= 1).
 *    Bonus critters, secrets, 3 stars, and mysteries are optional.
 *
 * 3. Night pages:
 *    A night page unlocks as soon as its corresponding day page has been cleared.
 *    Night pages are optional and never block day page progression.
 *
 * 4. Backward compatibility:
 *    Any page previously won, visited, or unlocked in an older save remains unlocked.
 *    All pages prior to the highest legacy page in the story sequence are also unlocked.
 */

export interface StoryProgressState {
  unlockedPageIds: Set<string>;
  unlockedCountryIds: Set<string>;
  unlockedNightIds: Set<string>;
  clearedDayIds: Set<string>;
  nextDayPage: Page | null;
  journeyCompleted: boolean;
}

/**
 * Evaluates the full story progression state from a list of story day page refs and the saved game progress.
 */
export function evaluateStoryProgress(
  allRefs: readonly PageRef[],
  p: GameProgress
): StoryProgressState {
  const unlockedPageIds = new Set<string>();
  const unlockedCountryIds = new Set<string>();
  const unlockedNightIds = new Set<string>();
  const clearedDayIds = new Set<string>();

  const explicitUnlocked = new Set(p.unlockedScenes ?? []);
  const playedPages = new Set(p.playedPages ?? []);
  const lastPageId = p.lastPageId;
  const legacyStoryCleared = new Set(p.storyCleared ?? []);

  // 1. Identify which pages have been cleared or unlocked previously
  let highestLegacyIndex = 0; // The first page is always unlocked
  for (let i = 0; i < allRefs.length; i++) {
    const ref = allRefs[i];
    const dayId = ref.day.id;
    const nightId = ref.night?.id;
    // Only a story-mode win counts: stars are also written by challenge wins, which are open on
    // every page and must not unlock the journey (older saves were moved into storyCleared by readProgress)
    const isCleared = legacyStoryCleared.has(dayId);

    if (isCleared) {
      clearedDayIds.add(dayId);
    }

    if (
      explicitUnlocked.has(dayId) ||
      playedPages.has(dayId) ||
      lastPageId === dayId ||
      (nightId && (explicitUnlocked.has(nightId) || playedPages.has(nightId) || lastPageId === nightId))
    ) {
      highestLegacyIndex = Math.max(highestLegacyIndex, i);
    }
  }

  // 2. The very first story page and its country are always unlocked
  if (allRefs.length > 0) {
    unlockedPageIds.add(allRefs[0].day.id);
    unlockedCountryIds.add(allRefs[0].country.id);
  }

  // 3. Unlock all day pages up to highestLegacyIndex (legacy preservation)
  for (let i = 0; i <= highestLegacyIndex && i < allRefs.length; i++) {
    const ref = allRefs[i];
    unlockedPageIds.add(ref.day.id);
    unlockedCountryIds.add(ref.country.id);
  }

  // 4. Linear unlock: clearing day page i unlocks day page i + 1
  for (let i = 0; i < allRefs.length; i++) {
    const ref = allRefs[i];
    const isCleared = clearedDayIds.has(ref.day.id);
    if (isCleared && i + 1 < allRefs.length) {
      const nextRef = allRefs[i + 1];
      unlockedPageIds.add(nextRef.day.id);
      unlockedCountryIds.add(nextRef.country.id);
    }

    // Night page unlocks when its day page has been cleared, or if it was already unlocked/played
    if (ref.night) {
      if (
        isCleared ||
        explicitUnlocked.has(ref.night.id) ||
        playedPages.has(ref.night.id) ||
        (p.sceneResults[ref.night.id]?.stars ?? 0) > 0
      ) {
        unlockedNightIds.add(ref.night.id);
      }
    }
  }

  // 5. Determine the next day page objective (first unlocked page that is not cleared yet)
  let nextDayPage: Page | null = null;
  for (const ref of allRefs) {
    if (unlockedPageIds.has(ref.day.id) && !clearedDayIds.has(ref.day.id)) {
      nextDayPage = ref.day;
      break;
    }
  }

  const journeyCompleted = allRefs.length > 0 && allRefs.every((r) => clearedDayIds.has(r.day.id));

  return {
    unlockedPageIds,
    unlockedCountryIds,
    unlockedNightIds,
    clearedDayIds,
    nextDayPage,
    journeyCompleted,
  };
}

/**
 * Returns a human-friendly lock reason for a locked page.
 */
export function getPageLockReason(
  pageId: string,
  allRefs: readonly PageRef[],
  state: StoryProgressState
): string {
  const refIndex = allRefs.findIndex((r) => r.day.id === pageId || r.night?.id === pageId);
  if (refIndex === -1) return 'Trang chưa mở khóa';

  const ref = allRefs[refIndex];
  if (ref.night?.id === pageId) {
    return 'Hoàn thành trang ngày để mở khóa trang đêm';
  }

  if (refIndex === 0) return ''; // First page is never locked

  const prevRef = allRefs[refIndex - 1];
  if (prevRef.country.id === ref.country.id) {
    return `Hoàn thành Trang ${prevRef.number} để mở khóa`;
  }
  return `Hoàn thành ${prevRef.country.name} trang ${prevRef.number} để mở ${ref.country.name}`;
}

/**
 * Returns a human-friendly lock reason for a locked country.
 */
export function getCountryLockReason(
  countryId: string,
  countries: readonly Country[],
  allRefs: readonly PageRef[],
  state: StoryProgressState
): string {
  const cIdx = countries.findIndex((c) => c.id === countryId);
  if (cIdx <= 0) return ''; // First country is never locked

  const prevCountry = countries[cIdx - 1];
  const prevPages = allRefs.filter((r) => r.country.id === prevCountry.id);
  return `Hoàn thành ${prevCountry.name} trang ${prevPages.length} để mở ${countries[cIdx].name}`;
}

