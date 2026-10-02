import { Image } from 'react-native';
import { AlphaType, ColorType, Skia, type SkImage } from '@shopify/react-native-skia';

/** Pixels of a painting, scaled down: unpremultiplied RGBA, row by row. */
export interface ScenePixels {
  width: number;
  height: number;
  data: Uint8Array | Uint8ClampedArray;
}

/** A painting, decoded and ready to draw, with a way to read its pixels for the analysis. */
export interface LoadedScene {
  image: SkImage;
  /** The pixels scaled down to `width` (unpremultiplied RGBA) */
  readPixels: (width: number) => ScenePixels | null;
}

/**
 * iOS & Android. Skia decodes images lazily, on their first draw — that would be on the UI thread,
 * in the middle of a page turn. They are decoded here, on the JS thread, as soon as they arrive.
 */
export async function loadSceneImage(source: number): Promise<LoadedScene> {
  const uri = Image.resolveAssetSource(source).uri;
  const lazy = Skia.Image.MakeImageFromEncoded(await Skia.Data.fromURI(uri));
  if (!lazy) throw new Error(`Could not decode ${uri}`);
  let image = lazy;
  try {
    image = lazy.makeNonTextureImage() ?? lazy;
  } catch {
    // No GPU context on this thread: it decodes on its first draw instead
  }
  return { image, readPixels: (width) => readPixels(image, width) };
}

function readPixels(image: SkImage, width: number): ScenePixels | null {
  const height = Math.round((image.height() * width) / image.width());
  const surface = Skia.Surface.Make(width, height);
  if (!surface) return null;
  surface
    .getCanvas()
    .drawImageRect(image, Skia.XYWHRect(0, 0, image.width(), image.height()), Skia.XYWHRect(0, 0, width, height), Skia.Paint());
  surface.flush();
  const data = surface.makeImageSnapshot().readPixels(0, 0, {
    width,
    height,
    colorType: ColorType.RGBA_8888,
    alphaType: AlphaType.Unpremul,
  });
  return data instanceof Uint8Array ? { width, height, data } : null;
}
