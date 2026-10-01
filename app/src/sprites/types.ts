/**
 * Shape tree of a sprite drawing (48×48 view box), produced by scripts/generate-assets.mjs from
 * the web's ObjectSprite. Colours are CSS colour strings, 'none', or the chameleon tint tokens.
 */
export type ArtColor = string; // css colour | 'none' | '$fill' | '$ink'

/** [fill, stroke] */
export type ArtPaintPair = [ArtColor, ArtColor];

export interface ArtPaint {
  width: number; // stroke width (view-box units)
  cap?: 'round' | 'square';
  join?: 'round' | 'bevel';
  dash?: number[];
  opacity?: number;
  base: ArtPaintPair; // found / normal colours (also what "ink" camouflage filters)
  chameleon?: ArtPaintPair; // repainted with the sampled tint (defaults to base)
  invisible?: ArtPaintPair; // invisible ink seen through the loupe (defaults to base)
  glow: ArtPaintPair | null; // night pages: only glowing parts stay visible
  glowChameleon?: ArtPaintPair; // glow colours of a chameleon sprite, where they differ
}

export type ArtAnimKind = 'blink' | 'wing' | 'tail' | 'wave' | 'glowSpot';

export interface ArtAnim {
  kind: ArtAnimKind;
  origin?: [number, number]; // transform origin in the parent's coordinates
}

export interface SpriteArtNode {
  m?: [number, number, number, number, number, number]; // own SVG transform (a b c d e f)
  anim?: ArtAnim[];
  children?: SpriteArtNode[]; // group
  d?: string; // shape outline as SVG path data
  paint?: ArtPaint;
}
