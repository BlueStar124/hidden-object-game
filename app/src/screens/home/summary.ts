import type { Country, Page, SpriteType } from '../../core/model';
import { progress } from '../../core/progress';
import { allPages, pagesOf, story } from '../../content';

/** How far the player is in one country's sketchbook. */
export interface BookSummary {
  country: Country;
  cover: Page; // its first page, for the thumbnail
  pages: number; // day pages
  cleared: number; // day pages solved at least once
  stars: number; // won on every page, nights included
  maxStars: number;
  /** The page to go on with: the first one not cleared yet (the first page once all are) */
  next: { index: number; number: number; title: string };
  started: boolean;
  unlocked: boolean;
  lockReason?: string;
}

const starsOf = (page: Page | undefined) => (page ? (progress.pageResult(page.id)?.stars ?? 0) : 0);

export function bookSummary(country: Country): BookSummary {
  const refs = pagesOf(country);
  const cleared = refs.filter((ref) => starsOf(ref.day) > 0).length;
  const nextRef = refs.find((ref) => starsOf(ref.day) === 0) ?? refs[0];
  const unlocked = story.isCountryUnlocked(country.id);
  const lockReason = unlocked ? undefined : story.countryLockReason(country.id);
  let stars = 0;
  let pageCount = 0;
  for (const ref of refs) {
    for (const page of [ref.day, ref.night]) {
      if (!page) continue;
      pageCount++;
      stars += starsOf(page);
    }
  }
  return {
    country,
    cover: refs[0].day,
    pages: refs.length,
    cleared,
    stars,
    maxStars: pageCount * 3,
    next: { index: nextRef.index, number: nextRef.number, title: nextRef.day.title },
    started: refs.some((ref) => [ref.day, ref.night].some((p) => p && progress.discovered(p.id).length > 0)),
    unlocked,
    lockReason,
  };
}

/** Every kind of creature and object hidden in the books, and those spotted at least once. */
export function spottedKinds(): { all: Set<SpriteType>; found: Set<SpriteType> } {
  const all = new Set<SpriteType>();
  const found = new Set<SpriteType>();
  for (const page of allPages()) {
    const seen = new Set(progress.discovered(page.id));
    for (const obj of page.objects) {
      if (!obj.spriteType || obj.spriteType === 'seal') continue;
      all.add(obj.spriteType);
      if (seen.has(obj.id)) found.add(obj.spriteType);
    }
  }
  return { all, found };
}

/** Kinds of creatures and objects spotted at least once, out of every kind hidden in the books. */
export function albumProgress(): { found: number; total: number } {
  const { all, found } = spottedKinds();
  return { found: found.size, total: all.size };
}
