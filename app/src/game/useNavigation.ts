import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Challenge } from '../core/challenge';
import { dailyPage, type DailyPuzzle } from '../core/daily';
import { hasSpots, layOutPage } from '../core/layout';
import type { Country, Page, PageRef, PageTurn } from '../core/model';
import { progress } from '../core/progress';
import { SEED_COUNT } from '../core/random';
import { withRareCritter } from '../core/rare';
import { countryById, FIRST_COUNTRY, pageOfChallenge, pagesOf, placeOf } from '../content';
import { sound } from '../platform/sound';

/**
 * Where the player is in the books: which country, which page, day or night — and turning pages.
 * Page numbers are per country: "Trang 3 / 9" is the third page of that country's sketchbook.
 *
 * A page is played in one of three ways (`mode`): in the book; as the daily page, a corner of it with
 * a few objects (core/daily); or as a friend's challenge, laid out as in their code (core/challenge).
 */

/** How the page on screen is being played. */
export type PlayMode =
  | { kind: 'book' }
  | { kind: 'daily'; puzzle: DailyPuzzle }
  | { kind: 'challenge'; challenge: Challenge };

const BOOK: PlayMode = { kind: 'book' };

export interface Navigation {
  country: Country;
  /** The country's book, in reading order */
  pages: PageRef[];
  /** The page slot open now (its day page, and night variant if any) */
  ref: PageRef;
  /** The page being played: the day page, or its night — laid out for this visit (core/layout) */
  page: Page;
  isNight: boolean;
  mode: PlayMode;
  /** The layout of this visit (0: the page as written) */
  seed: number;
  /** Changes every time a page is opened — replays included: the case starts afresh */
  visit: number;
  /** The page turn in progress */
  turn: PageTurn | null;
  /** The board finished this request after its destination was ready. */
  completeTurn: (request: PageTurn) => void;
  /** The next page of the book (clearing this one unlocks it), if any — none outside the book */
  nextPage: Page | null;
  showPrologue: boolean;
  setShowPrologue: (show: boolean) => void;
  showNightIntro: boolean;
  setShowNightIntro: (show: boolean) => void;
  next: () => void;
  prev: () => void;
  /** Turns to a page of the current country (or another one), day or night */
  goTo: (index: number, night?: boolean, countryId?: string) => void;
  /** Opens the same page again, from scratch (a page already solved: its objects may move) */
  replay: () => void;
  /** Opens a day's daily page; false if that page is not in the books */
  openDaily: (puzzle: DailyPuzzle) => boolean;
  /** Opens a friend's challenge; false if its page is not in this version of the books */
  openChallenge: (challenge: Challenge) => boolean;
  /** Back from a daily page or a challenge to the page the player was at in the book */
  leaveSpecial: () => void;
}

interface Spot {
  countryId: string;
  index: number;
  night: boolean;
}

interface Place extends Spot {
  visit: number;
  seed: number;
  mode: PlayMode;
  roll: number; // this visit's chance of a golden critter (core/rare), rolled when it opens
}

function pageAt(country: Country, index: number, night: boolean): Page {
  const ref = pagesOf(country)[index];
  return (night && ref.night) || ref.day;
}

/** The page as a visit plays it (a daily corner has only main objects: no golden critter there). */
function pageFor(country: Country, index: number, night: boolean, seed: number, mode: PlayMode, roll: number): Page {
  const page = pageAt(country, index, night);
  return mode.kind === 'daily' ? dailyPage(page, mode.puzzle) : withRareCritter(layOutPage(page, seed), roll);
}

/** A first visit plays the page as written; once solved, its objects may hide elsewhere. */
function seedFor(page: Page): number {
  const solved = (progress.pageResult(page.id)?.stars ?? 0) > 0;
  return solved && hasSpots(page) ? 1 + Math.floor(Math.random() * (SEED_COUNT - 1)) : 0;
}

interface PendingTurn extends Spot {
  request: PageTurn;
  seed: number;
  roll: number;
  then?: () => void;
}

/** The page the player was last in, if it is still in the books. */
function savedPlace(): Place | null {
  const id = progress.lastPage();
  const saved = id ? placeOf(id) : null;
  return saved
    ? { countryId: saved.ref.country.id, index: saved.ref.index, night: saved.night, visit: 0, seed: 0, mode: BOOK, roll: Math.random() }
    : null;
}

export function useNavigation(): Navigation {
  // The book opens where the player left off; a new player starts on the first page
  const [saved] = useState(savedPlace);
  const [place, setPlace] = useState<Place>(
    // (No golden critter on a new player's very first page: it would not mean anything yet)
    () => saved ?? { countryId: FIRST_COUNTRY.id, index: 0, night: false, visit: 0, seed: 0, mode: BOOK, roll: 1 }
  );
  const [turn, setTurn] = useState<PageTurn | null>(null);
  const pending = useRef<PendingTurn | null>(null);
  useEffect(() => () => { pending.current = null; }, []);
  // A new player gets the case file of the first chapter (how to play); one coming back goes straight on
  const [showPrologue, setShowPrologue] = useState(!saved);
  const [showNightIntro, setShowNightIntro] = useState(false);
  // Where the player is in the book while a daily page or a challenge is played
  const bookSpot = useRef<Spot>(place);

  const country = countryById(place.countryId);
  const pages = pagesOf(country);
  const ref = pages[place.index];
  const { index, night, seed, mode, roll } = place;
  // Laid out once per visit: the board's caches and memoised children see the same page object
  const page = useMemo(() => pageFor(country, index, night, seed, mode, roll), [country, index, night, seed, mode, roll]);
  const inBook = mode.kind === 'book';
  const isTurning = turn !== null;

  // Opens a page (night: the page's night variant, if it has one)
  const open = useCallback((countryId: string, index: number, night: boolean = false, seed: number = 0, mode: PlayMode = BOOK, roll: number = Math.random()) => {
    pending.current = null;
    const target = countryById(countryId);
    const book = pagesOf(target);
    const valid = Math.max(0, Math.min(index, book.length - 1));
    const nightOn = night && !!book[valid].night;
    if (mode.kind === 'book') bookSpot.current = { countryId: target.id, index: valid, night: nightOn };
    setPlace((prev) => ({ countryId: target.id, index: valid, night: nightOn, visit: prev.visit + 1, seed, mode, roll }));
    setTurn(null);
    setShowNightIntro(nightOn);
  }, []);

  // The board owns the animation clock: a cold destination must not open before it lands.
  const turnTo = useCallback(
    (countryId: string, index: number, night: boolean, direction: 1 | -1, then?: () => void) => {
      if (pending.current) return;
      const target = countryById(countryId);
      const valid = Math.max(0, Math.min(index, pagesOf(target).length - 1));
      const page = pageAt(target, valid, night);
      // The leaf turns onto the page as it will be played, laid out already
      const seed = seedFor(page);
      const roll = Math.random();
      const request = { to: withRareCritter(layOutPage(page, seed), roll), direction };
      pending.current = { request, countryId: target.id, index: valid, night, seed, roll, then };
      setTurn(request);
      sound.playPageTurn();
    },
    []
  );

  const completeTurn = useCallback((request: PageTurn) => {
    const target = pending.current;
    if (!target || target.request !== request) return;
    open(target.countryId, target.index, target.night, target.seed, BOOK, target.roll);
    target.then?.();
  }, [open]);

  // A night page continues with the next day page; a new chapter opens with its case file
  const next = useCallback(() => {
    if (isTurning) return;
    if (place.index >= pages.length - 1) {
      // The end of the book
      open(country.id, 0, false, seedFor(pages[0].day));
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
      if (inBook && countryId === country.id && index === place.index && night === place.night) return;
      const forwards =
        countryId !== country.id || index > place.index || (index === place.index && night);
      turnTo(countryId, index, night, forwards ? 1 : -1, () => {
        if (countryId !== country.id) setShowPrologue(true);
      });
    },
    [isTurning, inBook, country.id, place.index, place.night, turnTo]
  );

  // A daily page or a challenge is played again as it is; a page of the book may be laid out anew
  const replay = useCallback(() => {
    const again = inBook ? seedFor(pageAt(country, place.index, place.night)) : place.seed;
    open(country.id, place.index, place.night, again, place.mode);
  }, [open, inBook, country, place.index, place.night, place.seed, place.mode]);

  // A quick hunt beside the book: no case file of the chapter over it
  const openSpecial = useCallback(
    (spot: Spot, seed: number, mode: PlayMode) => {
      if (isTurning) return;
      setShowPrologue(false);
      open(spot.countryId, spot.index, spot.night, seed, mode);
    },
    [isTurning, open]
  );

  const openDaily = useCallback(
    (puzzle: DailyPuzzle) => {
      const at = placeOf(puzzle.pageId);
      if (!at) return false;
      openSpecial({ countryId: at.ref.country.id, index: at.ref.index, night: false }, puzzle.seed, { kind: 'daily', puzzle });
      return true;
    },
    [openSpecial]
  );

  const openChallenge = useCallback(
    (challenge: Challenge) => {
      const at = pageOfChallenge(challenge);
      if (!at) return false;
      openSpecial({ countryId: at.ref.country.id, index: at.ref.index, night: at.night }, challenge.seed, { kind: 'challenge', challenge });
      return true;
    },
    [openSpecial]
  );

  const leaveSpecial = useCallback(() => {
    if (inBook) return;
    const spot = bookSpot.current;
    open(spot.countryId, spot.index, spot.night, seedFor(pageAt(countryById(spot.countryId), spot.index, spot.night)));
  }, [inBook, open]);

  return {
    country,
    pages,
    ref,
    page,
    isNight: place.night,
    mode,
    seed,
    visit: place.visit,
    turn,
    completeTurn,
    nextPage: inBook ? (pages[place.index + 1]?.day ?? null) : null,
    showPrologue,
    setShowPrologue,
    showNightIntro,
    setShowNightIntro,
    next,
    prev,
    goTo,
    replay,
    openDaily,
    openChallenge,
    leaveSpecial,
  };
}
