import { useCallback, useState } from 'react';
import { PAGE_TURN_MS, type Country, type Page, type PageRef, type PageTurn } from '../core/model';
import { countryById, FIRST_COUNTRY, pagesOf } from '../content';
import { sound } from '../platform/sound';

/**
 * Where the player is in the books: which country, which page, day or night — and turning pages.
 * Page numbers are per country: "Trang 3 / 9" is the third page of that country's sketchbook.
 */
export interface Navigation {
  country: Country;
  /** The country's book, in reading order */
  pages: PageRef[];
  /** The page slot open now (its day page, and night variant if any) */
  ref: PageRef;
  /** The page being played: the day page, or its night */
  page: Page;
  isNight: boolean;
  /** Changes every time a page is opened — replays included: the case starts afresh */
  visit: number;
  /** The page turn in progress */
  turn: PageTurn | null;
  /** The next page of the book (clearing this one unlocks it), if any */
  nextPage: Page | null;
  showPrologue: boolean;
  setShowPrologue: (show: boolean) => void;
  showNightIntro: boolean;
  setShowNightIntro: (show: boolean) => void;
  next: () => void;
  prev: () => void;
  /** Turns to a page of the current country (or another one), day or night */
  goTo: (index: number, night?: boolean, countryId?: string) => void;
  /** Opens the same page again, from scratch */
  replay: () => void;
}

interface Place {
  countryId: string;
  index: number;
  night: boolean;
  visit: number;
}

function pageAt(country: Country, index: number, night: boolean): Page {
  const ref = pagesOf(country)[index];
  return (night && ref.night) || ref.day;
}

export function useNavigation(): Navigation {
  const [place, setPlace] = useState<Place>({ countryId: FIRST_COUNTRY.id, index: 0, night: false, visit: 0 });
  const [turn, setTurn] = useState<PageTurn | null>(null);
  const [showPrologue, setShowPrologue] = useState(true);
  const [showNightIntro, setShowNightIntro] = useState(false);

  const country = countryById(place.countryId);
  const pages = pagesOf(country);
  const ref = pages[place.index];
  const page = pageAt(country, place.index, place.night);
  const isTurning = turn !== null;

  // Opens a page (night: the page's night variant, if it has one)
  const open = useCallback((countryId: string, index: number, night: boolean = false) => {
    const target = countryById(countryId);
    const book = pagesOf(target);
    const valid = Math.max(0, Math.min(index, book.length - 1));
    const nightOn = night && !!book[valid].night;
    setPlace((prev) => ({ countryId: target.id, index: valid, night: nightOn, visit: prev.visit + 1 }));
    setTurn(null);
    setShowNightIntro(nightOn);
  }, []);

  // Starts turning the page; the target opens once the leaf has come down
  const turnTo = useCallback(
    (countryId: string, index: number, night: boolean, direction: 1 | -1, then?: () => void) => {
      setTurn({ to: pageAt(countryById(countryId), index, night), direction });
      sound.playPageTurn();
      setTimeout(() => {
        open(countryId, index, night);
        then?.();
      }, PAGE_TURN_MS);
    },
    [open]
  );

  // A night page continues with the next day page; a new chapter opens with its case file
  const next = useCallback(() => {
    if (isTurning) return;
    if (place.index >= pages.length - 1) {
      // The end of the book
      open(country.id, 0);
      return;
    }
    const nextRef = pages[place.index + 1];
    turnTo(country.id, place.index + 1, false, 1, () => {
      if (nextRef.chapter !== ref.chapter) setShowPrologue(true);
    });
  }, [isTurning, place.index, pages, country.id, ref.chapter, open, turnTo]);

  // Back from a night page is its own day page
  const prev = useCallback(() => {
    if (isTurning) return;
    if (place.index <= 0 && !place.night) return;
    turnTo(country.id, place.night ? place.index : place.index - 1, false, -1);
  }, [isTurning, place.index, place.night, country.id, turnTo]);

  // A page's night comes after its day
  const goTo = useCallback(
    (index: number, night: boolean = false, countryId: string = country.id) => {
      if (isTurning) return;
      if (countryId === country.id && index === place.index && night === place.night) return;
      const forwards =
        countryId !== country.id || index > place.index || (index === place.index && night);
      turnTo(countryId, index, night, forwards ? 1 : -1, () => {
        if (countryId !== country.id) setShowPrologue(true);
      });
    },
    [isTurning, country.id, place.index, place.night, turnTo]
  );

  const replay = useCallback(() => open(country.id, place.index, place.night), [open, country.id, place.index, place.night]);

  return {
    country,
    pages,
    ref,
    page,
    isNight: place.night,
    visit: place.visit,
    turn,
    nextPage: pages[place.index + 1]?.day ?? null,
    showPrologue,
    setShowPrologue,
    showNightIntro,
    setShowNightIntro,
    next,
    prev,
    goTo,
    replay,
  };
}
