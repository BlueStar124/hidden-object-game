import { Skia } from '@shopify/react-native-skia';
import type { LoadedScene, ScenePixels } from './sceneImage';

/**
 * Web. CanvasKit would decode the painting in WebAssembly on the main thread (some 40 ms a page, a
 * visible hitch). The browser decodes it off the main thread instead; Skia then draws it as a
 * texture, and the analysis reads its pixels through a 2D canvas.
 */
export async function loadSceneImage(source: number): Promise<LoadedScene> {
  const uri = assetUri(source);
  const response = await fetch(uri);
  if (!response.ok) throw new Error(`Could not load ${uri} (${response.status})`);
  // Straight alpha, as CanvasKit expects from a texture source
  const bitmap = await createImageBitmap(await response.blob(), { premultiplyAlpha: 'none' });
  const image = Skia.Image.MakeImageFromNativeBuffer(bitmap);
  return { image, readPixels: (width) => readPixels(bitmap, width) };
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
