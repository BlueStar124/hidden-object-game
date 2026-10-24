import type { SpriteType } from './spriteTypes';
import type { HiddenObject, ToolId } from './model';

/** Decorative light painted over a night page (lamps, supertree lights, windows). */
export interface NightLight {
  x: number;
  y: number;
  r: number; // Radius as a fraction of the spread width
  color: string;
}

/** One painted spread of the sketchbook and everything hidden in it (a JSON file in content/). */
export interface Page {
  id: string; // Unique across every country: progress is saved under it
  title: string;
  subtitle: string;
  art: string; // Key of the painting in the country's art table
  timeLimit: number; // Seconds
  storyClue: string; // Recap shown in the pause menu (and the intro of a night page)
  objects: HiddenObject[];
  // Night variant of a page: dark overlay, the loupe becomes a flashlight
  isNight?: boolean;
  nightLights?: NightLight[];
  // Set by core/layout and core/daily on a visit laid out unlike the JSON (other spots, a daily
  // crop): the page keeps its id (progress is saved by it) and the board's caches tell layouts apart
  layout?: string;
  // Daily page: the part of the spread in play, normalized (the camera frames it, the rest is veiled)
  focus?: SpreadRect;
}

/** A rectangle of the spread, in normalized coordinates (0–1 of the whole 1760 × 1240 painting). */
export interface SpreadRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * A travelling creature (core/migrants): each day it is on one of its spots, a page of any country.
 * Its id is saved with every find: once published, permanent.
 */
export interface Migrant {
  id: string;
  name: string; // on its clue card
  spriteType: SpriteType;
  greeting: string; // its found text, wherever it is met
  story: string; // told once it has been met at every one of its places
  spots: MigrantSpot[]; // one per page at most
}

export interface MigrantSpot {
  pageId: string; // a day page
  x: number; // normalized spread coordinates, as HiddenObject.x / y
  y: number;
  clue: string;
  radius?: number;
  scale?: number;
  flip?: boolean;
}

/** A page in the book: the day spread, and its night variant when it has one. */
export interface PageSlot {
  day: Page;
  night?: Page;
}

export interface Chapter {
  id: string;
  title: string;
  subtitle: string;
  prologue: string[]; // Paragraphs of the case file opened at the start of the chapter
  pages: PageSlot[];
  // Solved on the deduction board once every clue fragment (HiddenObject.isClue) of the chapter is found
  mystery?: Mystery;
}

/** The question a chapter's clue fragments answer (core/mystery). */
export interface Mystery {
  question: string;
  options: MysteryOption[]; // Exactly one is correct
  epilogue: string[]; // Paragraphs revealed once solved
  reward?: ToolId; // The tool solving it hands over
  finale?: boolean; // The last mystery of the story: solving it opens the keeper's certificate
}

export interface MysteryOption {
  text: string;
  correct?: boolean;
  nudge?: string; // Shown when this wrong answer is picked: points back at the clues, never punishes
}

/**
 * A country is a sketchbook of its own: its chapters, its paintings and its story.
 * The paintings follow one template — see "Thêm một quốc gia" in the README.
 */
export interface Country {
  id: string;
  name: string; // "Singapore"
  code?: string; // Two capital letters for challenge codes ("SG3-…"), unique across countries; once published, permanent
  chapters: Chapter[];
  /** Painting of each `Page.art` key: a bundled image (`require('….webp')`) */
  art: Record<string, number>;
}

/**
 * Where a page sits in its country's book (built by content/index.ts). `number` is the page
 * number shown to the player ("Trang 3 / 9"), `index` its position in `pagesOf(country)`.
 */
export interface PageRef {
  country: Country;
  chapter: Chapter;
  chapterNumber: number; // 1-based within the country
  index: number;
  number: number;
  day: Page;
  night?: Page;
}

