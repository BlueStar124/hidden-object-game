import type { SceneData } from '../render/types';

/** Releases page-owned resources once no live frame refers to this scene. */
export function disposeScene(scene: SceneData) {
  'worklet';
  scene.atlas?.image.dispose();
  for (let i = 0; i < scene.sprites.length; i++) {
    scene.sprites[i].water?.dispose();
    scene.sprites[i].occluder?.dispose();
  }
  if (scene.night) {
    scene.night.moon.dispose();
    for (let i = 0; i < scene.night.lamps.length; i++) scene.night.lamps[i].shader.dispose();
  }
  // Artwork, sprite parts and board/loupe paints have separate, shared owners.
}
