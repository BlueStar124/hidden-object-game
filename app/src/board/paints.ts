import { BlendMode, BlurStyle, PaintStyle, PathOp, Skia, TileMode, type SkPaint } from '@shopify/react-native-skia';
import { LOUPE_ZOOM, PX } from './constants';

/**
 * Paints & shaders for the sketchbook, transcribed from the web CSS. Created once on the JS
 * thread; the renderer worklet only sets their alpha before each use.
 */

const color = (c: string) => Skia.Color(c);

function paint(setup?: (p: SkPaint) => void): SkPaint {
  const p = Skia.Paint();
  p.setAntiAlias(true);
  setup?.(p);
  return p;
}

const blurred = (c: string, sigma: number) =>
  paint((p) => {
    p.setColor(color(c));
    p.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, sigma, true));
  });

const radial = (colors: string[], stops: number[]) =>
  Skia.Shader.MakeRadialGradient({ x: 0, y: 0 }, 1, colors.map(color), stops, TileMode.Clamp);

/* ---------------- CSS filter maths (Filter Effects spec colour matrices) ---------------- */

type M20 = number[];

const saturate = (s: number): M20 => [
  0.213 + 0.787 * s,
  0.715 - 0.715 * s,
  0.072 - 0.072 * s,
  0,
  0,
  0.213 - 0.213 * s,
  0.715 + 0.285 * s,
  0.072 - 0.072 * s,
  0,
  0,
  0.213 - 0.213 * s,
  0.715 - 0.715 * s,
  0.072 + 0.928 * s,
  0,
  0,
  0,
  0,
  0,
  1,
  0,
];

const sepia = (a: number): M20 => {
  const k = 1 - a;
  return [
    0.393 + 0.607 * k,
    0.769 - 0.769 * k,
    0.189 - 0.189 * k,
    0,
    0,
    0.349 - 0.349 * k,
    0.686 + 0.314 * k,
    0.168 - 0.168 * k,
    0,
    0,
    0.272 - 0.272 * k,
    0.534 - 0.534 * k,
    0.131 + 0.869 * k,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
  ];
};

const contrast = (c: number): M20 => {
  const t = 0.5 - 0.5 * c;
  return [c, 0, 0, 0, t, 0, c, 0, 0, t, 0, 0, c, 0, t, 0, 0, 0, 1, 0];
};

const brightness = (b: number): M20 => [b, 0, 0, 0, 0, 0, b, 0, 0, 0, 0, 0, b, 0, 0, 0, 0, 0, 1, 0];

/** a ∘ b: apply b, then a */
function compose(a: M20, b: M20): M20 {
  const out: M20 = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 5; c++) {
      let v = c === 4 ? a[r * 5 + 4] : 0;
      for (let k = 0; k < 4; k++) v += a[r * 5 + k] * b[k * 5 + c];
      out.push(v);
    }
  }
  return out;
}

/** `filter: saturate(0.35) sepia(0.4) contrast(0.92) brightness(1.04)` — the "ink" camouflage. */
const INK_FILTER = [sepia(0.4), contrast(0.92), brightness(1.04)].reduce((acc, m) => compose(m, acc), saturate(0.35));

/* ------------------------------------ Board ------------------------------------ */

export function createBoardPaints() {
  const dropShadow = (dy: number, blur: number, c: string, input: ReturnType<typeof Skia.ImageFilter.MakeBlur> | null = null) =>
    Skia.ImageFilter.MakeDropShadow(0, dy, blur / 2, blur / 2, color(c), input);

  return {
    image: paint(),

    // Unfound sprite layers (alpha set per draw)
    ink: paint((p) => {
      p.setBlendMode(BlendMode.Multiply);
      p.setColorFilter(Skia.ColorFilter.MakeMatrix(INK_FILTER));
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
    plain: paint(),
    // Found sprites: `drop-shadow(0 2px 3px rgba(44, 36, 27, 0.32))`
    foundPage: paint((p) => p.setImageFilter(dropShadow(2 * PX, 3 * PX, 'rgba(44, 36, 27, 0.32)'))),
    foundLoupe: paint((p) =>
      p.setImageFilter(dropShadow((2 * PX) / LOUPE_ZOOM, (3 * PX) / LOUPE_ZOOM, 'rgba(44, 36, 27, 0.32)'))
    ),
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

/* ------------------------------------ Loupe ------------------------------------ */

/** Paints of the brass loupe for a lens of diameter `d` (screen px), centred on (0, 0). */
export function createLoupePaints(d: number) {
  const r = d / 2;
  const lensR = r - 0.0375 * d;
  const grad = (from: [number, number], to: [number, number], colors: string[], stops: number[]) =>
    Skia.Shader.MakeLinearGradient({ x: from[0], y: from[1] }, { x: to[0], y: to[1] }, colors.map(color), stops, TileMode.Clamp);

  // conic-gradient(from 180deg …): CSS 0° points up, Skia's sweep starts at 3 o'clock
  const sweepColors = ['#8c6226', '#e5c378', '#b3833b', '#fff1c4', '#8c6226', '#e5c378', '#b3833b', '#fff1c4', '#8c6226'];
  const bezel = Skia.Shader.MakeSweepGradient(
    0,
    0,
    sweepColors.map(color),
    [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1],
    TileMode.Clamp,
    Skia.Matrix().rotate(Math.PI / 2)
  );

  const gripW = 0.1 * d;
  const gripH = 0.58 * d;
  const ferruleW = 1.28 * gripW;
  const ferruleH = 0.14 * gripH;

  return {
    d,
    r,
    lensR,
    gripW,
    gripH,
    ferruleW,
    ferruleH,
    bezel: paint((p) => p.setShader(bezel)),
    bezelShadowNear: blurred('rgba(0, 0, 0, 0.35)', 16),
    bezelShadowFar: blurred('rgba(0, 0, 0, 0.25)', 24),
    bezelHighlight: paint((p) => {
      p.setStyle(PaintStyle.Stroke);
      p.setStrokeWidth(1.5);
      p.setShader(
        grad(
          [0, -r],
          [0, r],
          ['rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0)', 'rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.6)'],
          [0, 0.35, 0.65, 1]
        )
      );
    }),
    nightGlow: blurred('rgba(255, 214, 140, 0.45)', 14),
    nudgeGlow: blurred('rgba(179, 131, 59, 0.8)', 12),
    grip: paint((p) =>
      p.setShader(grad([-gripW / 2, 0], [gripW / 2, 0], ['#3d2716', '#6d4a2d', '#8c603a', '#3d2716'], [0, 0.4, 0.65, 1]))
    ),
    gripShadow: blurred('rgba(0, 0, 0, 0.4)', 12),
    ferrule: paint((p) =>
      p.setShader(grad([-ferruleW / 2, 0], [ferruleW / 2, 0], ['#b3833b', '#e5c378', '#8c6226'], [0, 0.5, 1]))
    ),
    ferruleShadow: blurred('rgba(0, 0, 0, 0.3)', 2),
    lensBg: paint((p) => p.setColor(color('#ded7c8'))),
    // radial-gradient(circle at 32% 28%, …) with mix-blend-mode: overlay
    specular: paint((p) => {
      const cx = -lensR + 0.64 * lensR;
      const cy = -lensR + 0.56 * lensR;
      const reach = Math.hypot(lensR - cx, lensR - cy);
      p.setShader(
        Skia.Shader.MakeRadialGradient(
          { x: cx, y: cy },
          reach,
          ['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0)'].map(color),
          [0, 0.3, 0.65],
          TileMode.Clamp
        )
      );
      p.setBlendMode(BlendMode.Overlay);
    }),
    crosshair: paint((p) => p.setColor(color('rgba(154, 106, 62, 0.25)'))),
    // Night: warm flashlight falloff (farthest-corner circle of the lens box)
    vignette: paint((p) =>
      p.setShader(
        Skia.Shader.MakeRadialGradient(
          { x: 0, y: 0 },
          lensR * Math.SQRT2,
          ['rgba(255, 226, 160, 0.14)', 'rgba(255, 226, 160, 0.05)', 'rgba(10, 16, 38, 0.45)'].map(color),
          [0, 0.45, 1],
          TileMode.Clamp
        )
      )
    ),
    // Fogged loupe: blur + desaturate the magnified page, then mist over it
    fogLayer: paint((p) => {
      p.setImageFilter(Skia.ImageFilter.MakeBlur(2.5, 2.5, TileMode.Clamp, null));
      p.setColorFilter(Skia.ColorFilter.MakeMatrix(saturate(0.6)));
    }),
    fogBase: paint((p) => p.setColor(color('rgba(236, 240, 244, 0.55)'))),
    fogPuffA: paint((p) => {
      const cx = -lensR + 0.7 * lensR;
      const cy = -lensR + 0.8 * lensR;
      p.setShader(
        Skia.Shader.MakeRadialGradient(
          { x: cx, y: cy },
          Math.hypot(lensR - cx, lensR - cy),
          ['rgba(255, 255, 255, 0.75)', 'rgba(255, 255, 255, 0)'].map(color),
          [0, 0.45],
          TileMode.Clamp
        )
      );
    }),
    fogPuffB: paint((p) => {
      const cx = -lensR + 1.4 * lensR;
      const cy = -lensR + 1.3 * lensR;
      p.setShader(
        Skia.Shader.MakeRadialGradient(
          { x: cx, y: cy },
          Math.hypot(-lensR - cx, -lensR - cy),
          ['rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0)'].map(color),
          [0, 0.5],
          TileMode.Clamp
        )
      );
    }),
    fogAlpha: paint(),
  };
}

export type LoupePaints = ReturnType<typeof createLoupePaints>;
