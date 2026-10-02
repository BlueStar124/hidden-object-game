import { Skia } from '@shopify/react-native-skia';
import type { ScenePixels } from '../game/sceneAnalysis';
import { sceneSource } from './assets';
import type { LoadedScene } from './sceneImage';

/**
 * Web. CanvasKit would decode the PNG in WebAssembly on the main thread (some 40 ms a page, a
 * visible hitch). The browser decodes it off the main thread instead; Skia then draws it as a
 * texture, and the analysis reads its pixels through a 2D canvas.
 */
export async function loadSceneImage(src: string): Promise<LoadedScene> {
  const response = await fetch(assetUri(sceneSource(src)));
  if (!response.ok) throw new Error(`Could not load ${src} (${response.status})`);
  // Straight alpha, as CanvasKit expects from a texture source
  const bitmap = await createImageBitmap(await response.blob(), { premultiplyAlpha: 'none' });
  const image = Skia.Image.MakeImageFromNativeBuffer(bitmap);
  return { image, readPixels: (width) => readPixels(bitmap, width) };
}

/**
 * Where a bundled image is served, as Skia's useImage finds it on the web: Expo's web bundler
 * turns `require('….png')` into `{ uri, width, height }`; plain React Native registers a number.
 */
function assetUri(source: unknown): string {
  if (typeof source === 'object' && source !== null && 'uri' in source) return String(source.uri);
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
