/**
 * The sketchbook renderer: one SkPicture per frame, drawn on the UI thread (worklets).
 *
 *   frame.ts     the whole frame, in order: desk shadows, the spread, marks, the loupe
 *   book.ts      the painting with its camouflaged sprites, occluders and night
 *   sprites.ts   where each hidden object is this frame, and drawing it
 *   marks.ts     hint radar and the stamps on what was found
 *   pageTurn.ts  a leaf turning over (and recording a page flat for it)
 *   loupe.ts     the brass loupe / flashlight and what it magnifies
 */
export { renderFrame } from './frame';
export { recordPage } from './pageTurn';
export type { FoundInfo, FrameState, PageFlip, SceneData, SceneMark, SceneSprite, NightScene } from './types';
export { CAMO_CHAMELEON, CAMO_INK, CAMO_INVISIBLE } from './types';
