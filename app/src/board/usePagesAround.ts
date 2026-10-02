import { useEffect, useMemo, useRef, useState } from 'react';
import type { SkImage } from '@shopify/react-native-skia';
import type { Page } from '../core/model';
import { useKeepArt, type SceneLibrary } from './useSceneLibrary';

// The pages around this one are prepared once it has settled
const SETTLE_MS = 500;
const NO_PAGES: Page[] = [];

/**
 * Keeps turning cheap. Once the page on screen has settled — never during a turn — the pages
 * likely to come next (`preload`: the neighbours) are decoded and laid out one at a time, and
 * their artwork stays on the GPU. Returns those images, for the renderer to keep warm.
 */
export function usePagesAround(library: SceneLibrary, page: Page, preload: Page[], turningTo: Page | null): SkImage[] {
  const busy = turningTo !== null;
  const [around, setAround] = useState<Page[]>(NO_PAGES);
  useEffect(() => {
    if (busy) return;
    const t = setTimeout(() => setAround(preload), SETTLE_MS);
    return () => clearTimeout(t);
  }, [preload, busy]);

  const { hasArt, isPrepared, prepare, bump, version, imageOf } = library;
  useEffect(() => {
    if (busy) return;
    const next = around.find((p) => !isPrepared(p) && hasArt(p));
    if (!next) return;
    const t = setTimeout(() => {
      prepare(next);
      bump(); // on to the next one
    }, 120);
    return () => clearTimeout(t);
  }, [around, version, busy, prepare, bump, hasArt, isPrepared]);

  // The artwork of this page, the one it turns to and the neighbours is loaded; only that stays
  const wanted = useMemo(() => [page, ...(turningTo ? [turningTo] : []), ...around], [page, turningTo, around]);
  useKeepArt(library, wanted);

  // Same images, same array: the frame worklet is only rebuilt when they change
  const warmRef = useRef<SkImage[]>([]);
  return useMemo(() => {
    const images = around.map((p) => imageOf(p)).filter((img): img is SkImage => !!img);
    const prev = warmRef.current;
    if (images.length === prev.length && images.every((img, i) => img === prev[i])) return prev;
    warmRef.current = images;
    return images;
  }, [around, version, imageOf]); // (`version`: images arrive asynchronously)
}
