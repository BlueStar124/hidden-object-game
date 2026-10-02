import { useEffect, useMemo, useRef } from 'react';
import type { SkImage } from '@shopify/react-native-skia';
import type { Page } from '../core/model';
import { useKeepArt, type SceneLibrary } from './useSceneLibrary';

// Decode immediately; give input/landing a short head start before synchronous scene layout.
const PREPARE_MS = 120;

/**
 * Decode upcoming artwork immediately, including the neighbour beyond a pending turn.
 * Once the page on screen has settled — never during a turn — scenes are laid out one at a time, and
 * their artwork and sprite sheets stay on the GPU. Returns those images, for the renderer to keep warm.
 */
export function usePagesAround(library: SceneLibrary, page: Page, preload: Page[], turningTo: Page | null): SkImage[] {
  const busy = turningTo !== null;
  const around = preload;

  const { hasArt, isPrepared, preparedScene, prepare, bump, version, imageOf } = library;
  useEffect(() => {
    if (busy) return;
    const next = around.find((p) => !isPrepared(p) && hasArt(p));
    if (!next) return;
    const t = setTimeout(() => {
      prepare(next);
      bump(); // on to the next one
    }, PREPARE_MS);
    return () => clearTimeout(t);
  }, [around, version, busy, prepare, bump, hasArt, isPrepared]);

  // The artwork of this page, the one it turns to and the neighbours is loaded; only that stays
  const wanted = useMemo(() => [page, ...(turningTo ? [turningTo] : []), ...around], [page, turningTo, around]);
  useKeepArt(library, wanted);

  // Same images, same array: the frame worklet is only rebuilt when they change
  const warmRef = useRef<SkImage[]>([]);
  return useMemo(() => {
    const images = around
      .flatMap((p) => [imageOf(p), preparedScene(p)?.atlas?.image])
      .filter((img, i, all): img is SkImage => !!img && all.indexOf(img) === i);
    const prev = warmRef.current;
    if (images.length === prev.length && images.every((img, i) => img === prev[i])) return prev;
    warmRef.current = images;
    return images;
  }, [around, version, imageOf, preparedScene]); // (`version`: images arrive asynchronously)
}
