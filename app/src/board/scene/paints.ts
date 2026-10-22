import { BlendMode, BlurStyle, PaintStyle, PathOp, Skia, TileMode } from '@shopify/react-native-skia';
import { LOUPE_ZOOM, PX } from '../constants';
import { blurred, color, GOLD_FILTER, INK_FILTER, paint, PRISM_COLOURS, radial } from './paintFilters';
import { createLoupePaints, type LoupePaints } from './loupePaints';

export { createLoupePaints, type LoupePaints };

/**
 * Paints & shaders for the sketchbook, transcribed from the original web CSS. Created once on the JS
 * thread; the renderer worklet only sets their alpha before each use.
 */

/* ------------------------------------ Board ------------------------------------ */

export function createBoardPaints() {
  const inkFilter = Skia.ColorFilter.MakeMatrix(INK_FILTER);
  // Opaque, white-backed cells multiply all RGBA components. Fade RGB towards white,
  // leaving alpha at one, rather than making the painting itself transparent.
  const modulatePaints = (opacity: number) => Array.from({ length: 129 }, (_, i) => {
    const a = opacity * i / 128;
    return paint((p) => {
      p.setBlendMode(BlendMode.Modulate);
      p.setColorFilter(Skia.ColorFilter.MakeMatrix([
        a, 0, 0, 0, 1 - a,
        0, a, 0, 0, 1 - a,
        0, 0, a, 0, 1 - a,
        0, 0, 0, 0, 1,
      ]));
    });
  });
  const dropShadow = (dy: number, blur: number, c: string, input: ReturnType<typeof Skia.ImageFilter.MakeBlur> | null = null) =>
    Skia.ImageFilter.MakeDropShadow(0, dy, blur / 2, blur / 2, color(c), input);

  return {
    image: paint(),
    inkFilter,
    inkModulate: modulatePaints(0.8),
    chameleonModulate: modulatePaints(0.95),

    // Unfound sprite layers (alpha set per draw)
    ink: paint((p) => {
      p.setBlendMode(BlendMode.Multiply);
      p.setColorFilter(inkFilter);
    }),
    chameleon: paint((p) => p.setBlendMode(BlendMode.Multiply)),
    // Invisible ink only ever shows through the loupe: CSS px there are not magnified
    invisible: paint((p) =>
      p.setImageFilter(
        dropShadow(
          0,
          (7 * PX) / LOUPE_ZOOM,
          'rgba(56, 189, 248, 0.55)',
          dropShadow(0, (2 * PX) / LOUPE_ZOOM, 'rgba(56, 189, 248, 0.95)')
        )
      )
    ),
    // The prism's drawings in light, through the loupe: their glow runs through the rainbow (one
    // paint per colour, picked by time — never a new filter per frame)
    prism: PRISM_COLOURS.map((c) =>
      paint((p) => p.setImageFilter(dropShadow(0, (7 * PX) / LOUPE_ZOOM, c.replace('1)', '0.6)'), dropShadow(0, (2 * PX) / LOUPE_ZOOM, c))))
    ),
    // The twin lens' tiny drawings, through the loupe: in their colours, lifted by a thin warm halo
    tiny: paint((p) => p.setImageFilter(dropShadow(0, (3 * PX) / LOUPE_ZOOM, 'rgba(180, 120, 40, 0.75)'))),
    plain: paint(),
    sheet: paint(), // a sprite's cell of the sprite sheet, inside its layer
    // Found sprites: `drop-shadow(0 2px 3px rgba(44, 36, 27, 0.32))`
    foundPage: paint((p) => p.setImageFilter(dropShadow(2 * PX, 3 * PX, 'rgba(44, 36, 27, 0.32)'))),
    foundLoupe: paint((p) =>
      p.setImageFilter(dropShadow((2 * PX) / LOUPE_ZOOM, (3 * PX) / LOUPE_ZOOM, 'rgba(44, 36, 27, 0.32)'))
    ),
    // A golden critter, found: gold, with a warm glow instead of the shadow
    foundGoldPage: paint((p) => {
      p.setColorFilter(Skia.ColorFilter.MakeMatrix(GOLD_FILTER));
      p.setImageFilter(dropShadow(0, 8 * PX, 'rgba(250, 204, 21, 0.85)'));
    }),
    foundGoldLoupe: paint((p) => {
      p.setColorFilter(Skia.ColorFilter.MakeMatrix(GOLD_FILTER));
      p.setImageFilter(dropShadow(0, (8 * PX) / LOUPE_ZOOM, 'rgba(250, 204, 21, 0.85)'));
    }),
    // …and still hidden: two glints twinkle on it, for sharp eyes (unit radius)
    goldGlint: paint((p) => {
      p.setShader(radial(['rgba(255, 246, 200, 1)', 'rgba(250, 204, 21, 0.7)', 'rgba(250, 204, 21, 0)'], [0, 0.35, 1]));
      p.setBlendMode(BlendMode.Screen);
    }),
    glowSpot: paint(),
    // Watercolour bloom behind a newly found sprite (unit radius = gradient radius)
    bloom: paint((p) =>
      p.setShader(radial(['rgba(250, 204, 21, 0.5)', 'rgba(250, 204, 21, 0.18)', 'rgba(250, 204, 21, 0)'], [0, 0.38, 0.66]))
    ),

    // The book on the desk
    bookShadow: blurred('rgba(43, 39, 33, 0.15)', 10 * PX),
    bookShadowNight: blurred('rgba(8, 12, 30, 0.45)', 14 * PX),
    castAmbient: paint((p) => {
      p.setShader(radial(['rgba(58, 44, 26, 0.36)', 'rgba(58, 44, 26, 0.18)', 'rgba(58, 44, 26, 0)'], [0, 0.42, 0.75]));
      p.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, 14 * PX, true));
    }),
    castContact: paint((p) => {
      p.setShader(radial(['rgba(44, 32, 14, 0.42)', 'rgba(44, 32, 14, 0.16)', 'rgba(44, 32, 14, 0)'], [0, 0.5, 0.78]));
      p.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, 6 * PX, true));
    }),

    // Night
    dark: paint((p) => p.setColor(color('rgba(11, 16, 38, 0.88)'))),
    lampHole: paint((p) => {
      // mask luminance #5c5c5c → #a8a8a8 → #fff, punched out of the darkness
      p.setShader(radial(['rgba(0, 0, 0, 0.64)', 'rgba(0, 0, 0, 0.34)', 'rgba(0, 0, 0, 0)'], [0, 0.5, 1]));
      p.setBlendMode(BlendMode.DstOut);
    }),
    beamHole: paint((p) => {
      p.setShader(radial(['rgba(0, 0, 0, 1)', 'rgba(0, 0, 0, 1)', 'rgba(0, 0, 0, 0)'], [0, 0.62, 1]));
      p.setBlendMode(BlendMode.DstOut);
    }),
    moon: paint((p) => p.setColor(color('#f4ecd0'))),
    moonGlow: blurred('rgba(244, 236, 208, 0.6)', 4 * PX),
    star: paint((p) => p.setColor(color('#f8fbff'))),
    starGlow: blurred('rgba(210, 225, 255, 0.9)', 2 * PX),
    lamp: paint((p) => p.setBlendMode(BlendMode.Screen)),

    // Hint radar (screen px)
    radarRing: paint((p) => {
      p.setStyle(PaintStyle.Stroke);
      p.setStrokeWidth(2);
      p.setColor(color('#b3833b'));
    }),
    radarDot: paint((p) => p.setColor(color('#b3833b'))),
    radarGlow: blurred('rgba(179, 131, 59, 0.9)', 4),

    // Found stamps (screen px)
    stampGlow: blurred('rgba(45, 122, 79, 0.08)', 4),
    stampFill: paint((p) => p.setShader(radial(['rgba(45, 122, 79, 0.04)', 'rgba(45, 122, 79, 0)'], [0, 0.7]))),
    stampRing: paint((p) => {
      p.setStyle(PaintStyle.Stroke);
      p.setStrokeWidth(2);
      p.setColor(color('rgba(45, 122, 79, 0.55)'));
      p.setPathEffect(Skia.PathEffect.MakeDash([6, 4], 0));
    }),

    // Page turn: shade on the turning leaf, and the shadow it casts (unit-wide, fading out
    // along x — scaled and mirrored to the shadow's width)
    flipShade: paint((p) => p.setColor(color('rgb(38, 30, 18)'))),
    flipRamp: paint((p) =>
      p.setShader(
        Skia.Shader.MakeLinearGradient(
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          ['rgba(38, 30, 18, 1)', 'rgba(38, 30, 18, 0)'].map(color),
          [0, 1],
          TileMode.Clamp
        )
      )
    ),
    flipCast: paint((p) =>
      p.setShader(
        Skia.Shader.MakeLinearGradient(
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          ['rgba(38, 30, 18, 1)', 'rgba(38, 30, 18, 0.45)', 'rgba(38, 30, 18, 0)'].map(color),
          [0, 0.3, 1],
          TileMode.Clamp
        )
      )
    ),

    // The watercolour wash over a page whose case is open, and the soft patches finds wash clear
    // (unit radius, punched out of the wash layer)
    wash: paint((p) => p.setColor(color('rgb(240, 235, 224)'))),
    washHole: paint((p) => {
      p.setShader(radial(['rgba(0, 0, 0, 1)', 'rgba(0, 0, 0, 0.9)', 'rgba(0, 0, 0, 0)'], [0, 0.55, 1]));
      p.setBlendMode(BlendMode.DstOut);
    }),

    // A thing that moved since the day: the way it went, and a ring where it was (moonlit, over the night)
    dayTrail: paint((p) => {
      p.setStyle(PaintStyle.Stroke);
      p.setStrokeWidth(3 * PX);
      p.setColor(color('rgb(244, 214, 140)'));
      p.setPathEffect(Skia.PathEffect.MakeDash([10 * PX, 7 * PX], 0));
    }),
    dayRing: paint((p) => {
      p.setStyle(PaintStyle.Stroke);
      p.setStrokeWidth(2 * PX);
      p.setColor(color('rgb(244, 214, 140)'));
      p.setPathEffect(Skia.PathEffect.MakeDash([6 * PX, 5 * PX], 0));
    }),

    // Daily page: the spread outside the corner in play, washed over with paper, and the corner's edge
    focusVeil: paint((p) => p.setColor(color('rgba(236, 231, 220, 0.82)'))),
    focusEdge: paint((p) => {
      p.setStyle(PaintStyle.Stroke);
      p.setStrokeWidth(3 * PX);
      p.setColor(color('rgba(154, 106, 62, 0.6)'));
      p.setPathEffect(Skia.PathEffect.MakeDash([14 * PX, 8 * PX], 0));
    }),

    // Keeps the next pages' artwork on the GPU (one pixel, all but transparent)
    warm: paint((p) => p.setAlphaf(1 / 255)),
  };
}

export type BoardPaints = ReturnType<typeof createBoardPaints>;

/** Radial glow of a night lamp (`radial-gradient(circle, color 0%, transparent 70%)`, screen blend). */
export function lampShader(c: string) {
  const rgba = Skia.Color(c);
  const clear = Float32Array.of(rgba[0], rgba[1], rgba[2], 0);
  return Skia.Shader.MakeRadialGradient({ x: 0, y: 0 }, 1, [rgba, clear], [0, 0.7], TileMode.Clamp);
}

/** Crescent moon: `box-shadow: inset -7px -3px 0 0 #f4ecd0` on a circle, rotated −20°. */
export function moonPath(cx: number, cy: number, r: number) {
  // Turning a disc about its own centre changes nothing: only the cut-out's offset rotates
  const a = (-20 * Math.PI) / 180;
  const ox = -7 * PX;
  const oy = -3 * PX;
  const disc = Skia.PathBuilder.Make().addCircle(cx, cy, r).build();
  const cut = Skia.PathBuilder.Make()
    .addCircle(cx + ox * Math.cos(a) - oy * Math.sin(a), cy + ox * Math.sin(a) + oy * Math.cos(a), r)
    .build();
  return Skia.Path.MakeFromOp(disc, cut, PathOp.Difference) ?? disc;
}
