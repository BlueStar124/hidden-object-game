/**
 * The game's vocabulary. Content is organised as
 *
 *   Country → Chapter → Page (a painted spread of the sketchbook) → HiddenObject
 *
 * A page may have a night variant: the same painting, dark, searched with a flashlight.
 * Everything here is plain data; the rules live next door (detection, scoring, hints, caseFile)
 * and the content itself in `src/content`.
 */

import type { SpriteType } from './spriteTypes';
import type { Page } from './storyModel';

export * from './spriteTypes';
export * from './storyModel';
export * from './progressModel';

/* ------------------------------------------------------------------------- */
/*                               Hidden objects                              */
/* ------------------------------------------------------------------------- */

/**
 * How an unfound object blends into the watercolour painting.
 * - ink:       muted ink & wash, as if sketched into the page (default)
 * - chameleon: takes on the colours of the painting around it; only a faint outline remains
 * - invisible: invisible ink — shows up only through the loupe
 */
export type CamoStyle = 'ink' | 'chameleon' | 'invisible';

/**
 * The detective's tools, handed over by chapter mysteries (Mystery.reward, core/tools). Each shows
 * its own objects (`requires`) in the loupe only, in its own way (board/render/book.ts):
 * - 'uv-lens': invisible-ink messages left by earlier keepers, glowing blue
 * - 'prism': drawings in light, only inside the rainbow band the prism casts across the lens
 * - 'twin-lens': tiny drawings, seen only once the page is zoomed in (TINY_ZOOM_FROM)
 */
export type ToolId = 'uv-lens' | 'prism' | 'twin-lens';

/** A shy creature hides most of the time and only peeks out for a moment every cycle. */
export interface ShyBehavior {
  period: number; // Seconds for one hide → peek → hide cycle
  offset?: number; // Seconds to shift the cycle so shy creatures don't move in sync
  from?: 'below' | 'left' | 'right' | 'above' | 'jump'; // Where it hides ('jump' = leaps out in an arc)
}

/** A roaming creature keeps moving along a path; it must be caught where it is right now. */
export interface RoamBehavior {
  path: [number, number][]; // Normalized spread coordinates, at least 2 points
  period: number; // Seconds for one full trip (there and back, or once around a loop)
  offset?: number; // Seconds to shift the trip so roamers don't move in sync
  loop?: boolean; // true: closed loop back to the first point; false (default): ping-pong
  facing?: 'left' | 'right'; // Direction the sprite is drawn facing; it turns to face its travel
  bob?: boolean; // Gentle up-and-down flutter while moving (flying creatures)
}

/**
 * Another place an object may be hidden on a replay (core/layout). Clues say WHERE an object is,
 * so each spot brings its own; everything else not given here stays as on the object.
 */
export interface ObjectSpot {
  x: number; // Normalized spread coordinates, as HiddenObject.x / y
  y: number;
  clue: string;
  radius?: number;
  scale?: number;
  rotation?: number;
  flip?: boolean;
  occluder?: [number, number][]; // Painting laid back over the sprite at this spot (none otherwise)
}

export interface HiddenObject {
  id: string;
  name: string;
  clue: string;
  x: number; // Normalized coordinate 0.0 - 1.0 (relative to spread width)
  y: number; // Normalized coordinate 0.0 - 1.0 (relative to spread height)
  radius: number; // Normalized hit radius (e.g. 0.035)
  score: number;
  isSecret?: boolean; // The page's secret artefact: optional, worth a lot
  isBonus?: boolean; // Optional hidden critter, tracked outside the main clue list
  foundText?: string;
  spriteType?: SpriteType; // 'seal' (or none): the artist's stamp, painted in the artwork itself
  scale?: number; // 1 = SPRITE_BASE_WIDTH of the spread width
  rotation?: number;
  flip?: boolean; // Mirror the sprite horizontally
  camo?: CamoStyle;
  // Polygon (normalized spread coordinates) of painting drawn back over the sprite,
  // so the object looks like it is tucked behind a pillar, trunk, railing...
  occluder?: [number, number][];
  shy?: ShyBehavior;
  roam?: RoamBehavior;
  // For creatures in water: fraction of the sprite height (0-1) where the surface is;
  // everything below fades into the painting.
  waterline?: number;
  // Night pages: eyes (and firefly lights) glow in the dark unless this is false
  glow?: boolean;
  // Other hiding places, one of which a replay may pick (the object's own x/y stays one of them).
  // Not for roaming or shy creatures: their paths and hiding directions belong to the painting
  spots?: ObjectSpot[];
  // A fragment of the chapter's mystery (Chapter.mystery): optional, like a bonus critter
  isClue?: boolean;
  // Shown on the clue card instead of the name and clue until found ("Thứ gì kêu tích tắc…?")
  riddle?: string;
  // Sequence hunt: catchable only once every object of a lower order on the page is found (1, 2, 3…)
  order?: number;
  // Set for one visit by core/rare, never in the JSON: this critter is a rare golden one
  rare?: boolean;
  // Only there for a player who has this tool (core/tools); always optional (isBonus)
  requires?: ToolId;
  // Night page, day-and-night hunt (core/dayNight): the id of the same thing on the day page, which has
  // moved since night fell. Its card tells where it was by day. Main objects only; never roaming, shy or
  // with other spots (the way it went is drawn to where the JSON puts it)
  dayTwin?: string;
  // Set by core/dayNight for a visit, never in the JSON: where the dayTwin was on the day page
  dayAt?: { x: number; y: number; clue: string };
}

/** Objects that must be found to close the case: not the secret, the critters or the mystery clues. */
export const isMainObject = (o: HiddenObject) => !o.isSecret && !o.isBonus && !o.isClue;

/** An optional critter of the page (not the invisible-ink messages a tool reveals, core/tools). */
export const isCritter = (o: HiddenObject) => !!o.isBonus && !o.requires;

/** Optional finds (secret, critters, mystery clues): still there to find once the case is closed. */
export const isOptionalObject = (o: HiddenObject) => !isMainObject(o);

/** Sprite width as a fraction of the spread width, before the per-object `scale`. */
export const SPRITE_BASE_WIDTH = 0.058;

/* ------------------------------------------------------------------------- */
/*                                Turning pages                              */
/* ------------------------------------------------------------------------- */

/** How long a page takes to turn: the new page is opened once the leaf has come down. */
export const PAGE_TURN_MS = 900;

/** A page turn in progress: where it goes, and which way the leaf turns. */
export interface PageTurn {
  to: Page;
  /** 1: forwards (the right-hand page turns over to the left), -1: backwards */
  direction: 1 | -1;
}

/* ------------------------------------------------------------------------- */
/*                              A case in progress                           */
/* ------------------------------------------------------------------------- */

export interface ActiveHint {
  level: 1 | 2; // 1: the card's name and clue shown · 2: the loupe tugs and a radar pulses on it
  objectId: string;
  clueText?: string;
  radarPoint?: { x: number; y: number };
}

/** The investigation of one page: what has been found, the clock, score and penalties. */
export interface CaseState {
  pageId: string;
  score: number;
  foundItems: string[]; // List of object IDs found
  foundAt: Record<string, { x: number; y: number }>; // Where roaming creatures were caught
  secretFound: boolean;
  isExploring: boolean; // Case closed, still hunting the remaining critters for the album
  mistakes: number;
  hintsUsed: number;
  remainingTime: number;
  isPaused: boolean;
  isCompleted: boolean;
  isGameOver: boolean;
  combo: number;
  comboTimer: number; // seconds left before combo resets
  activeHint: ActiveHint | null;
  revealedTextIds: string[]; // Objects whose card shows its name and clue (a hint taken, or found)
  freeHintUsed?: boolean; // The first tier-1 hint of each page is free
}
