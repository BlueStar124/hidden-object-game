/**
 * The game's vocabulary. Content is organised as
 *
 *   Country → Chapter → Page (a painted spread of the sketchbook) → HiddenObject
 *
 * A page may have a night variant: the same painting, dark, searched with a flashlight.
 * Everything here is plain data; the rules live next door (detection, scoring, hints, caseFile)
 * and the content itself in `src/content`.
 */

/* ------------------------------------------------------------------------- */
/*                               Hidden objects                              */
/* ------------------------------------------------------------------------- */

/** Every drawing the game can hide (drawn in tools/sprites/ObjectSprite.tsx). */
export type SpriteType =
  | 'cat'
  | 'dog'
  | 'owl'
  | 'dove'
  | 'butterfly'
  | 'squirrel'
  | 'turtle'
  | 'key'
  | 'compass'
  | 'letter'
  | 'pocket-watch'
  | 'quill'
  | 'teacup'
  | 'coin-pouch'
  | 'spyglass'
  | 'vase'
  | 'scroll'
  | 'magnifying-glass'
  | 'seal'
  // Sinh vật & đồ vật ẩn nấp
  | 'gecko'
  | 'chameleon'
  | 'frog'
  | 'snail'
  | 'ladybug'
  | 'mouse'
  | 'koi'
  | 'crab'
  | 'otter'
  | 'kingfisher'
  | 'bat'
  | 'monkey'
  | 'moth'
  | 'dragonfly'
  | 'spider'
  | 'paper-crane'
  | 'paper-boat'
  // Động vật hoang dã Đông Nam Á
  | 'heron'
  | 'hornbill'
  | 'pangolin'
  | 'monitor-lizard'
  | 'jellyfish'
  | 'seahorse'
  | 'mantis'
  | 'firefly'
  | 'civet'
  | 'sunbird'
  | 'slow-loris'
  | 'colugo'
  | 'stick-insect'
  | 'saola'
  | 'water-buffalo'
  // Đồ vật văn hóa & thám tử
  | 'durian'
  | 'fortune-cat'
  | 'red-envelope'
  | 'tiffin'
  | 'satay'
  | 'kite'
  | 'vintage-camera'
  | 'hourglass'
  | 'deerstalker'
  | 'conical-hat'
  | 'lantern'
  | 'cyclo'
  // Sinh vật Thái Lan
  | 'betta'
  | 'crocodile'
  | 'mudskipper'
  | 'giant-catfish'
  | 'river-prawn'
  | 'stingray'
  | 'goldfish'
  | 'flying-snake'
  | 'flying-lizard'
  | 'scorpion'
  | 'elephant'
  | 'gibbon'
  | 'sun-bear'
  | 'porcupine'
  | 'siamese-cat'
  | 'duck'
  | 'rooster'
  | 'peacock'
  | 'myna'
  | 'swallow'
  | 'rhino-beetle'
  | 'cicada'
  | 'bee'
  | 'lantern-bug'
  | 'parakeet'
  // Đồ vật Thái Lan
  | 'temple-bell'
  | 'naga-head'
  | 'khon-mask'
  | 'spirit-house'
  | 'lotus-bud'
  | 'longtail-boat'
  | 'royal-barge'
  | 'krathong'
  | 'sky-lantern'
  | 'clay-lamp'
  | 'jasmine-garland'
  | 'paper-umbrella'
  | 'long-drum'
  | 'tuk-tuk'
  | 'boxing-gloves'
  | 'mango-sticky-rice'
  | 'coconut'
  | 'thai-tea'
  | 'mangosteen'
  | 'noodle-bowl'
  | 'mortar-pestle'
  | 'abacus'
  | 'palm-leaf-book'
  | 'kratip'
  | 'treasure-map';

/**
 * How an unfound object blends into the watercolour painting.
 * - ink:       muted ink & wash, as if sketched into the page (default)
 * - chameleon: takes on the colours of the painting around it; only a faint outline remains
 * - invisible: invisible ink — shows up only through the loupe
 */
export type CamoStyle = 'ink' | 'chameleon' | 'invisible';

/** The detective's tools, handed over by chapter mysteries (Mystery.reward, core/tools). */
export type ToolId = 'uv-lens'; // ultraviolet lens: invisible-ink messages left by earlier keepers

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
}

/** Objects that must be found to close the case: not the secret, the critters or the mystery clues. */
export const isMainObject = (o: HiddenObject) => !o.isSecret && !o.isBonus && !o.isClue;

/** An optional critter of the page (not the invisible-ink messages a tool reveals, core/tools). */
export const isCritter = (o: HiddenObject) => !!o.isBonus && !o.requires;

/** Optional finds (secret, critters, mystery clues): still there to find once the case is closed. */
export const isOptionalObject = (o: HiddenObject) => !isMainObject(o);

/** Sprite width as a fraction of the spread width, before the per-object `scale`. */
export const SPRITE_BASE_WIDTH = 0.044;

/* ------------------------------------------------------------------------- */
/*                                   Content                                 */
/* ------------------------------------------------------------------------- */

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
  level: 1 | 2 | 3;
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
}

/* ------------------------------------------------------------------------- */
/*                               Saved progress                              */
/* ------------------------------------------------------------------------- */

export interface PageResult {
  sceneId: string;
  stars: number;
  highScore: number;
  bestTime: number;
  completedAt: string;
  creaturesFound?: string[]; // Optional hidden critters ever spotted on this page
}

/**
 * What is stored on the device (key `detective_sketchbook_progress_v1`). The field names are
 * those of the first web version, so old saves keep working: `sceneResults` is keyed by page id.
 */
export interface GameProgress {
  schemaVersion: number; // See core/progress: older saves are brought up to date when read
  unlockedScenes: string[]; // Pages unlocked by clearing the previous one (kept for old saves)
  sceneResults: Record<string, PageResult>;
  totalScore: number; // Sum of every page's best score
  // Every object ever spotted, per page id — feeds the "Sổ Tay Sinh Vật" album
  discovered: Record<string, string[]>;
  // The page the player was last in (day or night): "Chơi tiếp" on the home screen opens it
  lastPageId?: string;
  settings?: GameSettings;
  solvedMysteries?: string[]; // Chapter ids whose mystery was solved on the deduction board
  stamps?: Record<string, DailyStamp>; // Daily pages done, by the player's local day ('2026-10-12')
  cover?: CoverSticker[]; // The player's own inside cover
  rareFound?: string[]; // Kinds (SpriteType) of golden critters caught at least once
}

/** A daily page done: a stamp in the detective's passport. */
export interface DailyStamp {
  pageId: string;
  countryId: string;
  time: number; // Seconds the hunt took (the best of the day)
}

/** A sticker on the inside cover, at a place the player chose. */
export interface CoverSticker {
  type: SpriteType;
  x: number; // Centre, 0–1 of the cover's width
  y: number; // Centre, 0–1 of the cover's height
  rotation: number; // Degrees
  scale: number; // 1 = the default sticker size
}

/** The player's preferences, saved with the progress (the first web version already wrote them here). */
export interface GameSettings {
  soundEnabled: boolean; // false: the player muted the game
  wash?: boolean; // false: no watercolour wash over the pages (on unless turned off)
}
