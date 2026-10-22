import { BlurStyle, Skia, TileMode, type SkPaint } from '@shopify/react-native-skia';

export const color = (c: string) => Skia.Color(c);

export function paint(setup?: (p: SkPaint) => void): SkPaint {
  const p = Skia.Paint();
  p.setAntiAlias(true);
  setup?.(p);
  return p;
}

export const blurred = (c: string, sigma: number) =>
  paint((p) => {
    p.setColor(color(c));
    p.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, sigma, true));
  });

export const radial = (colors: string[], stops: number[]) =>
  Skia.Shader.MakeRadialGradient({ x: 0, y: 0 }, 1, colors.map(color), stops, TileMode.Clamp);

/* ---------------- CSS filter maths (Filter Effects spec colour matrices) ---------------- */

export type M20 = number[];

export const saturate = (s: number): M20 => [
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

export const sepia = (a: number): M20 => {
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

export const contrast = (c: number): M20 => {
  const t = 0.5 - 0.5 * c;
  return [c, 0, 0, 0, t, 0, c, 0, 0, t, 0, 0, c, 0, t, 0, 0, 0, 1, 0];
};

export const brightness = (b: number): M20 => [b, 0, 0, 0, 0, 0, b, 0, 0, 0, 0, 0, b, 0, 0, 0, 0, 0, 1, 0];

/** a ∘ b: apply b, then a */
export function compose(a: M20, b: M20): M20 {
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

/** A golden critter, found: its drawing turned to old gold (`sepia(1) saturate(2.6) brightness(1.12)`). */
export const GOLD_FILTER = [saturate(2.6), brightness(1.12)].reduce((acc, m) => compose(m, acc), sepia(1));

/** `filter: saturate(0.35) sepia(0.4) contrast(0.92) brightness(1.04)` — the "ink" camouflage. */
export const INK_FILTER = [sepia(0.4), contrast(0.92), brightness(1.04)].reduce((acc, m) => compose(m, acc), saturate(0.35));

/** The rainbow the prism casts, in order (the band's stripes and its drawings' glow). */
export const PRISM_COLOURS = [
  'rgba(239, 68, 68, 1)',
  'rgba(249, 115, 22, 1)',
  'rgba(234, 179, 8, 1)',
  'rgba(34, 197, 94, 1)',
  'rgba(59, 130, 246, 1)',
  'rgba(139, 92, 246, 1)',
];

