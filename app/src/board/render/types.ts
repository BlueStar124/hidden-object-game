import type { Skia, SkImage, SkPaint, SkPath, SkPicture, SkRect, SkRRect } from '@shopify/react-native-skia';
import type { RoamBehavior, ShyBehavior } from '../../core/model';
import type { BoardPaints, LoupePaints } from '../scene/paints';
import type { Part } from '../scene/spriteParts';

/**
 * What the renderer draws from. A SceneData is a page laid out once on the JS thread
 * (scene/buildScene); a FrameState is everything that moves, gathered every frame on the UI thread.
 * Coordinates: "page units" are pixels of the 1760 × 1240 painting; the camera maps them to the
 * screen with `screen = page * s + t`.
 */

export const CAMO_INK = 0;
export const CAMO_CHAMELEON = 1;
export const CAMO_INVISIBLE = 2;

/** Colours bloom back over this long once something is found (web: 0.6–0.9s transitions). */
export const FOUND_FADE_MS = 900;

export interface SceneSprite {
  id: string;
  x: number; // rest position, page units
  y: number;
  w: number; // sprite box size, page units
  rot: number; // degrees
  flip: number; // 1 | -1
  camo: number; // CAMO_*
  shy: ShyBehavior | null;
  shyDx: number; // hiding direction (fraction of the sprite box)
  shyDy: number;
  jump: boolean;
  roam: RoamBehavior | null;
  bob: boolean;
  blinkDelay: number; // ms ahead in the blink cycle
  page: Part[] | null; // hidden, on the page (null = invisible ink)
  loupe: Part[]; // hidden, through the loupe
  found: Part[];
  glow: Part[] | null; // night pages: glowing eyes above the darkness
  bounds: SkRect; // layer bounds in the sprite's frame
  box: SkRect; // the sprite box in its frame
  water: SkPaint | null; // waterline fade (dst-in)
  occluder: SkPath | null; // painting laid back over the sprite
}

export interface SceneMark {
  id: string;
  x: number; // page units
  y: number;
  roam: RoamBehavior | null;
}

export interface NightScene {
  lamps: {
    x: number;
    y: number;
    hole: number;
    glow: number;
    shader: ReturnType<typeof Skia.Shader.MakeRadialGradient>;
    delay: number;
  }[];
  stars: { x: number; y: number; r: number; delay: number }[];
  moon: SkPath;
}

export interface SceneData {
  image: SkImage;
  imageRect: SkRect;
  pageRect: SkRect;
  pageRRect: SkRRect;
  bookRRect: SkRRect; // the paper inside the artwork's transparent margin
  paperRRect: SkRRect; // the same with the paper's rounded corners (shadows stay on the paper)
  sprites: SceneSprite[];
  marks: SceneMark[];
  night: NightScene | null;
  paints: BoardPaints;
  loupe: LoupePaints;
  lensRRect: SkRRect;
  stampSize: number;
}

export interface FoundInfo {
  t: number; // when it was found (creature clock, ms)
  x: number; // where it stays (page units)
  y: number;
  flip: number;
}

export interface FrameState {
  now: number;
  width: number;
  height: number;
  s: number; // page → screen scale
  tx: number;
  ty: number;
  lx: number; // loupe centre on screen
  ly: number;
  found: Record<string, FoundInfo>;
  radar: string | null;
  fogStart: number;
  nudge: { x: number; y: number; t: number } | null;
  flip: PageFlip | null;
  flipStart: number; // when the leaf started to turn (0: not yet)
  warm: SkImage[]; // artwork of the pages likely to come next, kept on the GPU
}

/** A page turning over. Both pages are recorded flat, in page units, when the turn begins. */
export interface PageFlip {
  from: SkPicture; // the page being left
  to: SkPicture | null; // the page being opened (null while it is still being prepared)
  dir: number; // 1: the right-hand page turns over to the left (forwards), -1: back
  S: SceneData; // frame & paints: the page being opened (the old page until it is ready)
  duration: number; // ms
}

export interface Pose {
  x: number;
  y: number;
  flip: number;
  op: number;
  dx: number;
  dy: number;
  rot: number;
  bs: number;
  br: number;
  blink: number;
  wing: number;
  tail: number;
  wave: number;
  glowFound: number;
  glowNight: number;
  found: boolean;
  age: number;
}
