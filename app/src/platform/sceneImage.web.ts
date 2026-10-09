import { Skia } from '@shopify/react-native-skia';
import type { LoadedScene, ScenePixels } from './sceneImage';

/**
 * Web. CanvasKit would decode the painting in WebAssembly on the main thread (some 40 ms a page, a
 * visible hitch). The browser decodes it off the main thread instead; Skia then draws it as a
 * image from decoded pixels, also usable on the CPU surface that snapshots a turning leaf.
 */
export async function loadSceneImage(source: number): Promise<LoadedScene> {
  const uri = assetUri(source);
  const response = await fetch(uri);
  if (!response.ok) throw new Error(`Could not load ${uri} (${response.status})`);
  // Straight alpha, as CanvasKit expects from a texture source
  const bitmap = await createImageBitmap(await response.blob(), { premultiplyAlpha: 'none' });
  try {
    // Lazy texture sources cannot be replayed on a CPU surface: a leaf would lose its artwork.
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Could not copy decoded artwork');
    ctx.drawImage(bitmap, 0, 0);
    const image = Skia.Image.MakeImageFromNativeBuffer(canvas);
    return { image, readPixels: (width) => readPixels(bitmap, width), closeSource: () => bitmap.close() };
  } catch (error) {
    bitmap.close();
    throw error;
  }
}

/**
 * Where a bundled image is served, as Skia's useImage finds it on the web: Expo's web bundler
 * turns `require('….webp')` into `{ uri, width, height }`; plain React Native registers a number.
 */
function assetUri(source: unknown): string {
  if (typeof source === 'object' && source !== null && 'uri' in source) return String(source.uri);
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- only needed off Expo's bundler
  const { getAssetByID } = require('react-native/Libraries/Image/AssetRegistry') as {
    getAssetByID: (id: number) => { httpServerLocation: string; name: string; type: string };
  };
  const { httpServerLocation, name, type } = getAssetByID(source as number);
  return `${httpServerLocation}/${name}.${type}`;
}

function readPixels(bitmap: ImageBitmap, width: number): ScenePixels | null {
  const height = Math.round((bitmap.height * width) / bitmap.width);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  // Nearest-neighbour, like the Skia path on the apps
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(bitmap, 0, 0, width, height);
  return { width, height, data: ctx.getImageData(0, 0, width, height).data };
}
