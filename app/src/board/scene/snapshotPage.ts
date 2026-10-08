import { FilterMode, MipmapMode, Skia, type SkImage, type SkPicture, type SkPictureRecorder, type SkSurface } from '@shopify/react-native-skia';
import { LOUPE_ZOOM, PAGE_H, PAGE_W } from '../constants';
import { recordPage, type FrameState, type SceneData } from '../render';

// Bound the two temporary leaf textures, even when a high-DPR screen is fully zoomed in.
const MAX_SIDE = 2048; // pixels
// One scratch GPU surface for the session, rather than a new WebGL context for every turn.
let surface: SkSurface | null = null;

/** Flattens a leaf once on JS so each bent strip replays one image, not the entire scene. */
export function snapshotPage(scene: SceneData, frame: FrameState): SkPicture {
  const page = recordPage(scene, frame);
  const density = Math.min(MAX_SIDE / PAGE_W, Math.max(0.5, frame.s * scene.pixelRatio * LOUPE_ZOOM));
  const width = Math.ceil(PAGE_W * density);
  const height = Math.ceil(PAGE_H * density);
  let recorder: SkPictureRecorder | null = null;
  let image: SkImage | null = null;
  let texture: SkImage | null = null;
  let flattened = false;
  try {
    surface ??= Skia.Surface.MakeOffscreen(MAX_SIDE, Math.ceil(MAX_SIDE * PAGE_H / PAGE_W));
    if (!surface) return page;
    const canvas = surface.getCanvas();
    canvas.clear(Skia.Color('transparent'));
    canvas.save();
    try {
      canvas.scale(density, density);
      canvas.drawPicture(page);
    } finally {
      canvas.restore();
    }
    surface.flush();
    texture = surface.makeImageSnapshot(Skia.XYWHRect(0, 0, width, height));
    // The Canvas has its own GPU context on web; transfer decoded pixels, not a foreign texture.
    image = texture.makeNonTextureImage();
    if (!image) return page;
    recorder = Skia.PictureRecorder();
    const leaf = recorder.beginRecording(scene.pageRect);
    leaf.drawImageRectOptions(image, Skia.XYWHRect(0, 0, width, height), scene.pageRect,
      FilterMode.Linear, MipmapMode.None, scene.paints.image);
    // The recorded picture retains the native image; the temporary wrappers can be released.
    const leafPicture = recorder.finishRecordingAsPicture();
    flattened = true;
    return leafPicture;
  } catch {
    // A missing GPU/readback keeps the original leaf drawable; this is only an optimization.
    return page;
  } finally {
    image?.dispose();
    if (texture !== image) texture?.dispose();
    recorder?.dispose();
    if (flattened) page.dispose();
  }
}
