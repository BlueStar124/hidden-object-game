import {
  PaintStyle,
  Skia,
  StrokeCap,
  StrokeJoin,
  type SkCanvas,
  type SkPath,
  type SkPicture,
  type SkRect,
} from '@shopify/react-native-skia';
import type { SpriteType } from '../../core/model';
import { SPRITE_ART } from '../../generated/spriteArt';
import type { ArtAnimKind, ArtPaint, ArtPaintPair, SpriteArtNode } from './spriteArt';
import type { CamoTint } from './analyze';

/**
 * Turns the generated sprite art into ready-to-draw parts: static runs of shapes are recorded
 * once into SkPictures; animated bits (eyes, wings, tails, the waving paw, firefly lanterns)
 * stay separate so the renderer can move them every frame.
 */

export type PaintVariant = 'base' | 'chameleon' | 'invisible' | 'glow' | 'glowChameleon';

export const ANIM_BLINK = 0;
export const ANIM_WING = 1;
export const ANIM_TAIL = 2;
export const ANIM_WAVE = 3;
export const ANIM_GLOW_SPOT = 4;

const ANIM_CODE: Record<ArtAnimKind, number> = {
  blink: ANIM_BLINK,
  wing: ANIM_WING,
  tail: ANIM_TAIL,
  wave: ANIM_WAVE,
  glowSpot: ANIM_GLOW_SPOT,
};

/** k: 0 = picture, 1 = transformed group, 2 = animated group */
export interface Part {
  k: 0 | 1 | 2;
  pic?: SkPicture;
  m?: number[]; // 3×3 matrix (k = 1)
  anim?: number; // ANIM_* (k = 2)
  ox?: number; // animation origin (view-box units)
  oy?: number;
  bounds?: SkRect; // what an animated group covers (for bounded layers)
  parts?: Part[];
}

const pathCache = new Map<string, SkPath>();
function pathOf(d: string): SkPath {
  let p = pathCache.get(d);
  if (!p) {
    p = Skia.Path.MakeFromSVGString(d) ?? Skia.Path.Make();
    pathCache.set(d, p);
  }
  return p;
}

const hasAnim = (n: SpriteArtNode): boolean => !!n.anim?.length || !!n.children?.some(hasAnim);

function pickPair(paint: ArtPaint, variant: PaintVariant): ArtPaintPair | null {
  switch (variant) {
    case 'chameleon':
      return paint.chameleon ?? paint.base;
    case 'invisible':
      return paint.invisible ?? paint.base;
    case 'glow':
      return paint.glow;
    case 'glowChameleon':
      return paint.glow ? (paint.glowChameleon ?? paint.glow) : null;
    default:
      return paint.base;
  }
}

function resolveColor(c: string, tint?: CamoTint): string {
  if (c === '$fill') return tint?.fill ?? '#efe8da';
  if (c === '$ink') return tint?.ink ?? '#8a7a64';
  return c;
}

const fillPaint = Skia.Paint();
fillPaint.setAntiAlias(true);
fillPaint.setStyle(PaintStyle.Fill);
const strokePaint = Skia.Paint();
strokePaint.setAntiAlias(true);
strokePaint.setStyle(PaintStyle.Stroke);

function drawShape(canvas: SkCanvas, node: SpriteArtNode, variant: PaintVariant, tint?: CamoTint) {
  const paint = node.paint;
  if (!paint || !node.d) return;
  const pair = pickPair(paint, variant);
  if (!pair) return;
  const path = pathOf(node.d);
  const [fill, stroke] = pair;
  const opacity = paint.opacity ?? 1;

  if (fill !== 'none') {
    fillPaint.setColor(Skia.Color(resolveColor(fill, tint)));
    if (opacity < 1) fillPaint.setAlphaf(fillPaint.getAlphaf() * opacity);
    canvas.drawPath(path, fillPaint);
  }
  if (stroke !== 'none' && paint.width > 0) {
    strokePaint.setColor(Skia.Color(resolveColor(stroke, tint)));
    if (opacity < 1) strokePaint.setAlphaf(strokePaint.getAlphaf() * opacity);
    strokePaint.setStrokeWidth(paint.width);
    strokePaint.setStrokeCap(
      paint.cap === 'round' ? StrokeCap.Round : paint.cap === 'square' ? StrokeCap.Square : StrokeCap.Butt
    );
    strokePaint.setStrokeJoin(
      paint.join === 'round' ? StrokeJoin.Round : paint.join === 'bevel' ? StrokeJoin.Bevel : StrokeJoin.Miter
    );
    strokePaint.setPathEffect(paint.dash ? Skia.PathEffect.MakeDash(paint.dash, 0) : null);
    canvas.drawPath(path, strokePaint);
  }
}

const toMatrix3 = (m: number[]) => [m[0], m[2], m[4], m[1], m[3], m[5], 0, 0, 1];

function drawStatic(canvas: SkCanvas, node: SpriteArtNode, variant: PaintVariant, tint?: CamoTint) {
  canvas.save();
  if (node.m) canvas.concat(toMatrix3(node.m));
  if (node.children) node.children.forEach((c) => drawStatic(canvas, c, variant, tint));
  else drawShape(canvas, node, variant, tint);
  canvas.restore();
}

function boundsOf(nodes: SpriteArtNode[]): SkRect {
  let l = Infinity;
  let t = Infinity;
  let r = -Infinity;
  let b = -Infinity;
  const visit = (n: SpriteArtNode) => {
    if (n.children) return n.children.forEach(visit);
    if (!n.d) return;
    const rect = pathOf(n.d).computeTightBounds();
    const pad = (n.paint?.width ?? 0) + 1;
    l = Math.min(l, rect.x - pad);
    t = Math.min(t, rect.y - pad);
    r = Math.max(r, rect.x + rect.width + pad);
    b = Math.max(b, rect.y + rect.height + pad);
  };
  nodes.forEach(visit);
  return Number.isFinite(l) ? Skia.XYWHRect(l, t, r - l, b - t) : Skia.XYWHRect(0, 0, 48, 48);
}

function build(nodes: SpriteArtNode[], variant: PaintVariant, tint?: CamoTint): Part[] {
  const parts: Part[] = [];
  let recorder: ReturnType<typeof Skia.PictureRecorder> | null = null;
  let canvas: SkCanvas | null = null;

  const flush = () => {
    if (recorder) {
      parts.push({ k: 0, pic: recorder.finishRecordingAsPicture() });
      recorder.dispose();
    }
    recorder = null;
    canvas = null;
  };

  for (const node of nodes) {
    if (!hasAnim(node)) {
      if (!canvas) {
        recorder = Skia.PictureRecorder();
        canvas = recorder.beginRecording(Skia.XYWHRect(-48, -48, 144, 144));
      }
      drawStatic(canvas, node, variant, tint);
      continue;
    }
    flush();
    // Contents of this node without its own animation / transform
    const inner = node.children
      ? build(node.children, variant, tint)
      : build([{ ...node, anim: undefined, m: undefined }], variant, tint);
    let wrapped = inner;
    for (const a of [...(node.anim ?? [])].reverse()) {
      wrapped = [
        {
          k: 2,
          anim: ANIM_CODE[a.kind],
          ox: a.origin?.[0] ?? 24,
          oy: a.origin?.[1] ?? 24,
          bounds: boundsOf([node]),
          parts: wrapped,
        },
      ];
    }
    if (node.m) parts.push({ k: 1, m: toMatrix3(node.m), parts: wrapped });
    else parts.push(...wrapped);
  }
  flush();
  return parts;
}

const cache = new Map<string, Part[]>();

/** Drawing parts of a sprite in one paint variant (chameleon variants depend on the tint). */
export function spriteParts(type: SpriteType, variant: PaintVariant, tint?: CamoTint): Part[] {
  const usesTint = variant === 'chameleon' || variant === 'glowChameleon';
  const key = `${type}|${variant}|${usesTint && tint ? `${tint.fill}/${tint.ink}` : ''}`;
  let parts = cache.get(key);
  if (!parts) {
    const art = SPRITE_ART[type];
    parts = art ? build(art, variant, usesTint ? tint : undefined) : [];
    cache.set(key, parts);
  }
  return parts;
}

/** Draws parts as they look at rest: eyes open, nothing waving, glow spots unlit. */
export function drawPartsAtRest(canvas: SkCanvas, parts: Part[]) {
  for (const p of parts) {
    if (p.k === 0) {
      canvas.drawPicture(p.pic as SkPicture);
    } else if (p.k === 1) {
      canvas.save();
      canvas.concat(p.m as number[]);
      drawPartsAtRest(canvas, p.parts as Part[]);
      canvas.restore();
    } else {
      drawPartsAtRest(canvas, p.parts as Part[]);
    }
  }
}

/** Whether any of these animations (ANIM_*) moves something in the parts. */
export function partsAnimate(parts: Part[], anims: number[]): boolean {
  return parts.some((p) => (p.k === 2 && anims.includes(p.anim as number)) || (!!p.parts && partsAnimate(p.parts, anims)));
}

const restBounds = new Map<SpriteType, SkRect>();

/** What a sprite's drawing covers at rest, in its view box (strokes included). */
export function spriteBounds(type: SpriteType): SkRect {
  let rect = restBounds.get(type);
  if (rect) return rect;
  let l = Infinity;
  let t = Infinity;
  let r = -Infinity;
  let b = -Infinity;
  // m: the affine transform down to this node (SVG a b c d e f)
  const visit = (n: SpriteArtNode, m: number[]) => {
    const k = n.m;
    const own = k
      ? [
          m[0] * k[0] + m[2] * k[1],
          m[1] * k[0] + m[3] * k[1],
          m[0] * k[2] + m[2] * k[3],
          m[1] * k[2] + m[3] * k[3],
          m[0] * k[4] + m[2] * k[5] + m[4],
          m[1] * k[4] + m[3] * k[5] + m[5],
        ]
      : m;
    if (n.children) return n.children.forEach((c) => visit(c, own));
    if (!n.d) return;
    const box = pathOf(n.d).computeTightBounds();
    const pad = (n.paint?.width ?? 0) / 2 + 1;
    for (const [x, y] of [
      [box.x - pad, box.y - pad],
      [box.x + box.width + pad, box.y - pad],
      [box.x - pad, box.y + box.height + pad],
      [box.x + box.width + pad, box.y + box.height + pad],
    ]) {
      const sx = own[0] * x + own[2] * y + own[4];
      const sy = own[1] * x + own[3] * y + own[5];
      l = Math.min(l, sx);
      t = Math.min(t, sy);
      r = Math.max(r, sx);
      b = Math.max(b, sy);
    }
  };
  SPRITE_ART[type]?.forEach((n) => visit(n, [1, 0, 0, 1, 0, 0]));
  rect = Number.isFinite(l) ? Skia.XYWHRect(l, t, r - l, b - t) : Skia.XYWHRect(0, 0, 48, 48);
  restBounds.set(type, rect);
  return rect;
}

/** Sprite animation kinds present in a drawing (so the renderer can skip unused curves). */
export function animKinds(type: SpriteType): Set<ArtAnimKind> {
  const kinds = new Set<ArtAnimKind>();
  const visit = (n: SpriteArtNode) => {
    n.anim?.forEach((a) => kinds.add(a.kind));
    n.children?.forEach(visit);
  };
  SPRITE_ART[type]?.forEach(visit);
  return kinds;
}
