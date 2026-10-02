import type { Country, Page, PageRef } from '../core/model';
import { singapore } from './countries/singapore';

/**
 * The catalogue of sketchbooks. Adding a country = adding its folder under countries/ and
 * listing it here (see "Thêm một quốc gia" in the README); everything else is derived.
 */
export const COUNTRIES: Country[] = [singapore];

/** The sketchbook a new player opens first. */
export const FIRST_COUNTRY = COUNTRIES[0];

/* ------------------------------ Derived views ------------------------------ */

const pagesByCountry = new Map<string, PageRef[]>();
const refByPageId = new Map<string, PageRef>();

for (const country of COUNTRIES) {
  const refs: PageRef[] = [];
  country.chapters.forEach((chapter, c) => {
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
