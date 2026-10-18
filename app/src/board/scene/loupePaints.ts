import { BlendMode, PaintStyle, Skia, TileMode } from '@shopify/react-native-skia';
import { blurred, color, paint, PRISM_COLOURS, saturate } from './paintFilters';
import { makeLoupeBody, type LoupeBody } from './loupeBody';

/**
 * Paints of the brass loupe for a lens of diameter `d` (screen px), centred on (0, 0), and its body
 * drawn once at `pixelRatio` (scene/loupeBody).
 */
export function createLoupePaints(d: number, pixelRatio: number) {
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

  const paints = {
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
    prismRect: Skia.XYWHRect(-1.5, -1, 3, 2), // the band, in units of its half-width (long enough to cross the lens)
    // The prism's rainbow band across the lens, in unit coordinates (scaled to the band): a light
    // wash of colour over the magnified page, soft at its edges
    prismBand: paint((p) => {
      const stripes = PRISM_COLOURS.map((c) => c.replace('1)', '0.24)'));
      const clear = (c: string) => c.replace('1)', '0)');
      p.setShader(
        grad([0, -1], [0, 1], [clear(PRISM_COLOURS[0]), ...stripes, clear(PRISM_COLOURS[5])], [0, 0.1, 0.28, 0.44, 0.56, 0.72, 0.9, 1])
      );
    }),
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
    // Grip, bezel and their shadows as one image (null: drawn from these paints)
    body: null as LoupeBody | null,
    bodyPaint: paint(),
  };
  paints.body = makeLoupeBody(paints, pixelRatio);
  return paints;
}

export type LoupePaints = ReturnType<typeof createLoupePaints>;

