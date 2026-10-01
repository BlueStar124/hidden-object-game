/**
 * The artwork lives once, in the web project's public/ folder; Metro bundles it from there.
 * Level files reference scenes by their web URL ("/assets/scenes/….png").
 */
const SCENES: Record<string, number> = {
  '/assets/scenes/marina-bay-sands.png': require('../../../public/assets/scenes/marina-bay-sands.png'),
  '/assets/scenes/gardens-by-the-bay.png': require('../../../public/assets/scenes/gardens-by-the-bay.png'),
  '/assets/scenes/merlion.png': require('../../../public/assets/scenes/merlion.png'),
  '/assets/scenes/buddha-tooth.png': require('../../../public/assets/scenes/buddha-tooth.png'),
  '/assets/scenes/joo-chiat.png': require('../../../public/assets/scenes/joo-chiat.png'),
  '/assets/scenes/lau-pa-sat.png': require('../../../public/assets/scenes/lau-pa-sat.png'),
  '/assets/scenes/marina-bay-skyline.png': require('../../../public/assets/scenes/marina-bay-skyline.png'),
  '/assets/scenes/singapore-river.png': require('../../../public/assets/scenes/singapore-river.png'),
  '/assets/scenes/botanic-gardens.png': require('../../../public/assets/scenes/botanic-gardens.png'),
};

export function sceneSource(sceneImage: string): number {
  const source = SCENES[sceneImage];
  if (source === undefined) throw new Error(`Unknown scene image ${sceneImage} — add it to src/platform/assets.ts`);
  return source;
}

export const UI_ART = {
  wash: require('../../../public/assets/ui/bg-wash.jpg') as number,
  botanyLeft: require('../../../public/assets/ui/botany-left.png') as number,
  botanyRight: require('../../../public/assets/ui/botany-right.png') as number,
};
