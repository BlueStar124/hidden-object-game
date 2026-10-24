import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  friendChallengeRefusal,
  type Challenge,
  type ChallengeRefusal,
  type FriendChallenge,
} from '../core/challenge';
import type { DailyPuzzle } from '../core/daily';
import type { Country, Page, PageRef, PageTurn, ToolId } from '../core/model';
import { localDay } from '../core/random';
import { COUNTRIES, countryById, FIRST_COUNTRY, pageOfChallenge, pagesOf, placeOf, story } from '../content';
import { sound } from '../platform/sound';
import { ownedTools } from './ownedTools';
import {
  BOOK,
  type Fate,
  pageAt,
  pageFor,
  type Place,
  type PlayMode,
  savedPlace,
  seedFor,
  type Spot,
  visitOf,
} from './navigationLayout';

export type { PlayMode };

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
  /** Opens a challenge code's hunt; or why it cannot (not in these books, page not played, a turn pending) */
  openChallenge: (challenge: Challenge) => ChallengeRefusal | null;
  /** Opens a friend's hunt (downloaded) on a page the player has played; or why it cannot */
  openFriendChallenge: (challenge: FriendChallenge) => ChallengeRefusal | null;
  /** Back from a daily page or a challenge to the page the player was at in the book */
  leaveSpecial: () => void;
  /** A page exactly as turning to it will open it — layout and chance decided ahead (the board prepares neighbours with it) */
  preparedPage: (page: Page) => Page;
}

interface PendingTurn extends Spot, Fate {
  request: PageTurn;
  then?: () => void;
}

export function useNavigation(): Navigation {
  // The book opens where the player left off; a new player starts on the first page
  const [saved] = useState(savedPlace);
  const [place, setPlace] = useState<Place>(
    // (No golden critter on a new player's very first page: it would not mean anything yet)
    () => saved ?? { countryId: FIRST_COUNTRY.id, index: 0, night: false, visit: 0, seed: 0, mode: BOOK, roll: 1, tools: [], day: localDay(new Date()) }
  );
  const [turn, setTurn] = useState<PageTurn | null>(null);
  const pending = useRef<PendingTurn | null>(null);
  useEffect(() => () => { pending.current = null; }, []);
  // A new player gets the case file of the first chapter (how to play); one coming back goes straight on
  const [showPrologue, setShowPrologue] = useState(!saved);
  const [showNightIntro, setShowNightIntro] = useState(false);
  // Where the player is in the book while a daily page or a challenge is played
  const bookSpot = useRef<Spot>(place);
  // The next visit of the pages around, by page id: decided when the board prepares them, kept until
  // one opens, so the page a turn opens is the very one laid out ahead (core/layout.layoutKey)
  const fates = useRef(new Map<string, Fate>());
  const fateOf = useCallback((p: Page): Fate => {
    let fate = fates.current.get(p.id);
    if (!fate) fates.current.set(p.id, (fate = { seed: seedFor(p), roll: Math.random() }));
    return fate;
  }, []);

  const country = countryById(place.countryId);
  const pages = pagesOf(country);
  const ref = pages[place.index];
  const { index, night, seed, mode, roll, tools, day } = place;
  // Laid out once per visit: the board's caches and memoised children see the same page object
  const page = useMemo(
    () => pageFor(country, index, night, seed, mode, roll, tools, day),
    [country, index, night, seed, mode, roll, tools, day]
  );
  const inBook = mode.kind === 'book';
  const isTurning = turn !== null;

  // Opens a page (night: the page's night variant, if it has one)
  const open = useCallback((countryId: string, index: number, night: boolean = false, seed: number = 0, mode: PlayMode = BOOK, roll: number = Math.random()) => {
    pending.current = null;
    let target = countryById(countryId);
    let book = pagesOf(target);
    let valid = Math.max(0, Math.min(index, book.length - 1));
    const targetRef = book[valid];
    if (mode.kind === 'book' && targetRef) {
      const targetPageId = night && targetRef.night ? targetRef.night.id : targetRef.day.id;
      // Locked meanwhile (a cloud sync or an account switch during a turn or a challenge): open the
      // story's current page instead of bailing out, which would leave `turn` set and the book stuck
      const goal = story.isUnlocked(targetPageId) ? null : story.nextTarget();
      const fallback = goal ? placeOf(goal.id) : null;
      if (fallback) {
        target = fallback.ref.country;
        book = pagesOf(target);
        valid = fallback.ref.index;
        night = false;
      }
    }
    const nightOn = night && !!book[valid]?.night;
    fates.current.delete(pageAt(target, valid, nightOn).id); // this visit is decided: the next one is new
    if (mode.kind === 'book') bookSpot.current = { countryId: target.id, index: valid, night: nightOn };
    setPlace((prev) => ({
      countryId: target.id,
      index: valid,
      night: nightOn,
      visit: prev.visit + 1,
      seed,
      mode,
      roll,
      tools: ownedTools(),
      day: localDay(new Date()),
    }));
    setTurn(null);
    setShowNightIntro(nightOn);
  }, []);

  // The board owns the animation clock: a cold destination must not open before it lands.
  const turnTo = useCallback(
    (countryId: string, index: number, night: boolean, direction: 1 | -1, then?: () => void) => {
      if (pending.current) return;
      const target = countryById(countryId);
      const valid = Math.max(0, Math.min(index, pagesOf(target).length - 1));
      const targetRef = pagesOf(target)[valid];
      if (!targetRef) return;
      const targetPageId = night && targetRef.night ? targetRef.night.id : targetRef.day.id;
      if (!story.isUnlocked(targetPageId)) return;
      const p = pageAt(target, valid, night);
      // The leaf turns onto the page as it will be played, laid out already
      const fate = fateOf(p);
      const request = { to: visitOf(p, ownedTools(), localDay(new Date()), fate), direction };
      pending.current = { request, countryId: target.id, index: valid, night, ...fate, then };
      setTurn(request);
      sound.playPageTurn();
    },
    [fateOf]
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
      // The end of this country's book: advance to next country if unlocked
      const cIdx = COUNTRIES.findIndex((c) => c.id === country.id);
      if (cIdx >= 0 && cIdx < COUNTRIES.length - 1) {
        const nextCountry = COUNTRIES[cIdx + 1];
        const nextPages = pagesOf(nextCountry);
        if (nextPages.length > 0 && story.isUnlocked(nextPages[0].day.id)) {
          turnTo(nextCountry.id, 0, false, 1, () => {
            setShowPrologue(true);
          });
        }
      }
      return;
    }
    const nextRef = pages[place.index + 1];
    if (!nextRef || !story.isUnlocked(nextRef.day.id)) return;
    turnTo(country.id, place.index + 1, false, 1, () => {
      if (nextRef.chapter !== ref.chapter) setShowPrologue(true);
    });
  }, [isTurning, place.index, pages, country.id, ref.chapter, turnTo]);

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
      const targetCountry = countryById(countryId);
      const targetPages = pagesOf(targetCountry);
      const targetRef = targetPages[index];
      if (!targetRef) return;
      const targetPageId = night && targetRef.night ? targetRef.night.id : targetRef.day.id;
      if (!story.isUnlocked(targetPageId)) return;
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
    (challenge: Challenge): ChallengeRefusal | null => {
      const at = pageOfChallenge(challenge);
      if (!at) return 'missing';
      if (isTurning) return 'turning';
      openSpecial({ countryId: at.ref.country.id, index: at.ref.index, night: at.night }, challenge.seed, { kind: 'challenge', challenge });
      return null;
    },
    [openSpecial, isTurning]
  );

  const openFriendChallenge = useCallback(
    (challenge: FriendChallenge): ChallengeRefusal | null => {
      const refused = friendChallengeRefusal(challenge);
      if (refused) return refused;
      const at = placeOf(challenge.pageId);
      if (!at) return 'missing';
      if (isTurning) return 'turning';
      openSpecial({ countryId: at.ref.country.id, index: at.ref.index, night: at.night }, 0, { kind: 'challenge', challenge });
      return null;
    },
    [openSpecial, isTurning]
  );

  const leaveSpecial = useCallback(() => {
    if (inBook) return;
    const spot = bookSpot.current;
    open(spot.countryId, spot.index, spot.night, seedFor(pageAt(countryById(spot.countryId), spot.index, spot.night)));
  }, [inBook, open]);

  // How pages open now, read on every render (the game's clock ticks each second): once a mystery
  // gives a tool or the day turns, the neighbours are prepared again as they would open
  const toolsNow = ownedTools().join('+');
  const today = localDay(new Date());
  const preparedPage = useCallback(
    (p: Page) => visitOf(p, toolsNow ? (toolsNow.split('+') as ToolId[]) : [], today, fateOf(p)),
    [toolsNow, today, fateOf]
  );

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
    nextPage: inBook ? (story.nextPageAfter(page.id)?.ref.day ?? null) : null,
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
    openFriendChallenge,
    leaveSpecial,
    preparedPage,
  };
}
