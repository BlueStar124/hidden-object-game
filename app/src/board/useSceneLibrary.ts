import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SkImage } from '@shopify/react-native-skia';
import type { Page } from '../core/model';
import { artIdOf, artOf } from '../content';
import { loadSceneImage, type LoadedScene } from '../platform/sceneImage';
import type { SceneData } from './render';
import { analyzeScene, SAMPLE_WIDTH, type SceneAnalysis } from './scene/analyze';
import { buildScene } from './scene/buildScene';
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
  hasArt: (page: Page) => boolean;
  /** Changes whenever artwork arrives or a page is prepared in the background */
  version: number;
  bump: () => void;
  /** Loads the artwork of these pages; beyond a few, the rest is let go */
  keepArt: (pages: Page[]) => void;
  imageOf: (page: Page) => SkImage | undefined;
}

export function useSceneLibrary(page: Page, loupe: LoupePaints, compact: boolean): SceneLibrary {
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((n) => n + 1), []);

  // Pages laid out for this loupe size and layout
  const scenes = useMemo(() => new Map<string, SceneData>(), [loupe, compact]);
  const prepare = useCallback(
    (p: Page): SceneData | null => {
      const cached = scenes.get(p.id);
      if (cached) return cached;
      const art = images.get(artIdOf(p));
      if (!art) return null;
      const { tints, book } = analysisOf(p, art);
      const prepared = buildScene({ page: p, image: art.image, tints, book, loupe, compact });
      scenes.set(p.id, prepared);
      return prepared;
    },
    [scenes, loupe, compact]
  );

  // (`version`: try again once the artwork has arrived)
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
        if (!wanted.includes(id)) images.delete(id);
      }
      const alive = new Set([...images.values()].map((art) => art.image));
      for (const [id, prepared] of scenes) if (!alive.has(prepared.image)) scenes.delete(id);
    },
    [scenes, bump]
  );

  return {
    scene,
    shown,
    prepare,
    isPrepared: useCallback((p: Page) => scenes.has(p.id), [scenes]),
    hasArt: useCallback((p: Page) => images.has(artIdOf(p)), []),
    version,
    bump,
    keepArt,
    imageOf: useCallback((p: Page) => images.get(artIdOf(p))?.image, []),
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
