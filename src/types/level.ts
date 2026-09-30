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
  // Động vật hoang dã Singapore
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
  // Đồ vật văn hóa & thám tử
  | 'durian'
  | 'fortune-cat'
  | 'red-envelope'
  | 'tiffin'
  | 'satay'
  | 'kite'
  | 'vintage-camera'
  | 'hourglass'
  | 'deerstalker';

/**
 * How an unfound object blends into the watercolor painting.
 * - ink:       muted ink & wash, as if sketched into the page (default)
 * - chameleon: takes on the colors of the painting around it; only a faint outline remains
 * - invisible: invisible ink — shows up only through the loupe
 */
export type CamoStyle = 'ink' | 'chameleon' | 'invisible';

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

export interface HiddenObject {
  id: string;
  name: string;
  clue: string;
  x: number; // Normalized coordinate 0.0 - 1.0 (relative to spread width)
  y: number; // Normalized coordinate 0.0 - 1.0 (relative to spread height)
  radius: number; // Normalized hit radius (e.g. 0.035)
  score: number;
  isSecret?: boolean;
  isBonus?: boolean; // Optional hidden critter, tracked outside the main clue list
  foundText?: string;
  iconName?: string;
  spriteType?: SpriteType;
  scale?: number;
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
}

/** Decorative light painted over a night page (lamps, supertree lights, windows). */
export interface NightLight {
  x: number;
  y: number;
  r: number; // Radius as a fraction of the spread width
  color: string;
}

export interface LevelData {
  id: string;
  sceneIndex: number;
  chapter: number;
  title: string;
  subtitle: string;
  sceneImage: string; // URL / path to watercolor artwork
  timeLimit: number; // Seconds
  storyClue: string;
  objects: HiddenObject[];
  // Night variant of a page: dark overlay, the loupe becomes a flashlight
  isNight?: boolean;
  dayId?: string; // Night pages: id of the day page they belong to
  nightLights?: NightLight[];
}

export interface ChapterData {
  id: string;
  chapterNumber: number;
  title: string;
  subtitle: string;
  prologue: string[];
  scenes: LevelData[];
}
