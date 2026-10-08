import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PixelRatio } from 'react-native';
import type { SkImage, SkPicture } from '@shopify/react-native-skia';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import type { Page } from '../core/model';
import { artIdOf, artOf } from '../content';
import { loadSceneImage, type LoadedScene } from '../platform/sceneImage';
import type { SceneData } from './render';
import { analyzeScene, SAMPLE_WIDTH, type SceneAnalysis } from './scene/analyze';
import { buildScene } from './scene/buildScene';
import { disposeScene } from './scene/disposeScene';
import type { LoupePaints } from './scene/paints';

/**
 * The pages the board can draw, ready on the JS thread: artwork decoded (platform/sceneImage),
 * analysed (chameleon tints, the paper frame) and laid out for the renderer (scene/buildScene).
 */

// Decoded artwork of the pages around the current one (by art id): turning back, or into a page's
// night — the same painting — is instant, and the pages next door are decoded ahead of time
const images = new Map<string, LoadedScene>();
const loading = new Set<string>();
const MAX_IMAGES = 5;
const retiredArt = new Set<LoadedScene>();

// What a painting tells about a page (chameleon tints, where the paper is): read once per page
const analyses = new Map<string, SceneAnalysis>();
function analysisOf(page: Page, art: LoadedScene): SceneAnalysis {
  let analysis = analyses.get(page.id);
  if (!analysis) {
    analysis = analyzeScene(art.readPixels(SAMPLE_WIDTH), page.objects);
    analyses.set(page.id, analysis);
  }
  return analysis;
}

export interface SceneLibrary {
  /** The page on screen, ready to draw (null while its artwork decodes) */
  scene: SceneData | null;
  /** What to draw: this page, or the previous one while this one decodes */
  shown: SceneData | null;
  /** Lays a page out if its artwork is there (cached) */
  prepare: (page: Page) => SceneData | null;
  isPrepared: (page: Page) => boolean;
  /** The page laid out, if it already is */
  preparedScene: (page: Page) => SceneData | undefined;
  hasArt: (page: Page) => boolean;
  /** Changes whenever artwork arrives or a page is prepared in the background */
  version: number;
  bump: () => void;
  /** Loads the artwork of these pages; beyond a few, the rest is let go */
  keepArt: (pages: Page[]) => void;
  imageOf: (page: Page) => SkImage | undefined;
  /** Called after the frame mapper was updated, keeping anything it still draws alive. */
  releaseUnused: (live: SceneData[], warm: SkImage[], pictures: SkPicture[]) => void;
  retirePictures: (pictures: SkPicture[]) => void;
}

/**
 * `density`: device pixels per page unit to draw sprite sheets at (scene/spriteAtlas.atlasDensity).
 */
export function useSceneLibrary(page: Page, loupe: LoupePaints, compact: boolean, density: number): SceneLibrary {
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((n) => n + 1), []);
  const retiredScenes = useRef(new Set<SceneData>()).current;
  const retiredPictures = useRef(new Set<SkPicture>()).current;
  const retirePictures = useCallback((pictures: SkPicture[]) => {
    for (const picture of pictures) retiredPictures.add(picture);
  }, [retiredPictures]);

  // Pages laid out for this loupe size, layout and sprite sharpness
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const scenes = useMemo(() => new Map<string, SceneData>(), [loupe, compact, density]);
  useEffect(() => () => {
    for (const cached of scenes.values()) retiredScenes.add(cached);
    scenes.clear();
  }, [scenes, retiredScenes]);
  const prepare = useCallback(
    (p: Page): SceneData | null => {
      const cached = scenes.get(p.id);
      if (cached) return cached;
      const art = images.get(artIdOf(p));
      if (!art) return null;
      const { tints, book } = analysisOf(p, art);
      const prepared = buildScene({ page: p, image: art.image, tints, book, loupe, compact, density, pixelRatio: PixelRatio.get() });
      scenes.set(p.id, prepared);
      return prepared;
    },
    [scenes, loupe, compact, density]
  );

  // (`version`: try again once the artwork has arrived)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const scene = useMemo(() => prepare(page), [prepare, page, version]);
  const lastScene = useRef<SceneData | null>(null);
  if (scene) lastScene.current = scene;
  const shown = scene ?? lastScene.current;

  const keepArt = useCallback(
    (pages: Page[]) => {
      const wanted = [...new Set(pages.map(artIdOf))];
      for (const p of pages) {
        const id = artIdOf(p);
        if (images.has(id) || loading.has(id)) continue;
        loading.add(id);
        loadSceneImage(artOf(p))
          .then((art) => {
            images.set(id, art);
            bump();
          })
          .catch((e) => console.warn(e))
          .finally(() => loading.delete(id));
      }
      for (const id of [...images.keys()]) {
        if (images.size <= MAX_IMAGES) break;
        if (!wanted.includes(id)) {
          retiredArt.add(images.get(id)!);
          images.delete(id);
        }
      }
      const alive = new Set([...images.values()].map((art) => art.image));
      for (const [id, prepared] of scenes) {
        if (alive.has(prepared.image)) continue;
        retiredScenes.add(prepared);
        scenes.delete(id);
      }
    },
    [scenes, bump, retiredScenes]
  );

  const releaseUnused = useCallback((live: SceneData[], warm: SkImage[], pictures: SkPicture[]) => {
    const held = new Set(warm);
    for (const s of [...scenes.values(), ...live]) {
      held.add(s.image);
      if (s.atlas) held.add(s.atlas.image);
    }
    const oldScenes = [...retiredScenes].filter((s) => !live.includes(s) && (!s.atlas || !held.has(s.atlas.image)));
    const oldArt = [...retiredArt].filter((art) => !held.has(art.image));
    const oldPictures = [...retiredPictures].filter((picture) => !pictures.includes(picture));
    for (const s of oldScenes) retiredScenes.delete(s);
    for (const art of oldArt) retiredArt.delete(art);
    for (const picture of oldPictures) retiredPictures.delete(picture);
    if (!oldScenes.length && !oldArt.length && !oldPictures.length) return;
    const oldImages = oldArt.map((art) => art.image);
    const closeSources = () => {
      for (const art of oldArt) art.closeSource?.();
    };
    // FIFO with Reanimated's mapper update: the next frame cannot read retired wrappers.
    scheduleOnUI(() => {
      'worklet';
      for (let i = 0; i < oldScenes.length; i++) disposeScene(oldScenes[i]);
      for (let i = 0; i < oldImages.length; i++) oldImages[i].dispose();
      for (let i = 0; i < oldPictures.length; i++) oldPictures[i].dispose();
      if (oldImages.length) scheduleOnRN(closeSources);
    });
  }, [scenes, retiredScenes, retiredPictures]);

  return {
    scene,
    shown,
    prepare,
    isPrepared: useCallback((p: Page) => scenes.has(p.id), [scenes]),
    preparedScene: useCallback((p: Page) => scenes.get(p.id), [scenes]),
    hasArt: useCallback((p: Page) => images.has(artIdOf(p)), []),
    version,
    bump,
    keepArt,
    imageOf: useCallback((p: Page) => images.get(artIdOf(p))?.image, []),
    releaseUnused,
    retirePictures,
  };
}

/** Loads the artwork of `pages` whenever that list (or the library's content) changes. */
export function useKeepArt(library: SceneLibrary, pages: Page[]) {
  const { keepArt, version } = library;
  const key = pages.map((p) => p.id).join('|');
  const latest = useRef(pages);
  latest.current = pages;
  useEffect(() => {
    keepArt(latest.current);
  }, [keepArt, key, version]);
}
