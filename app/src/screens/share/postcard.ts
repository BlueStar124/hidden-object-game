import { Asset } from 'expo-asset';
import {
  FilterMode,
  ImageFormat,
  MipmapMode,
  PaintStyle,
  Skia,
  type SkCanvas,
  type SkFont,
  type SkImage,
  type SkPaint,
  type SkTypeface,
} from '@shopify/react-native-skia';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display/700Bold';
import { Lora_400Regular_Italic } from '@expo-google-fonts/lora/400Regular_Italic';
import type { Page } from '../../core/model';
import { artOf } from '../../content';
import { loadSceneImage } from '../../platform/sceneImage';
import { colors } from '../../ui/theme';

/**
 * A postcard of a page: a corner of its painting, the country's stamp, the title and a few lines,
 * drawn once on the JS thread when the player asks for it, as a JPEG to share (screens/share/useShare).
 */

export interface PostcardContent {
  page: Page;
  /** The point of the painting to frame (normalized spread coordinates): the secret, a critter… */
  focus?: { x: number; y: number };
  country: string;
  title: string;
  lines: string[];
  stars?: number;
  footer: string;
  /** The country's gold seal is in the passport (core/daily STAMPS_FOR_SEAL): a gilded postcard */
  gilded?: boolean;
}

// The postcard (pixels): the shape link previews and chat apps show whole
const W = 1200;
const H = 630;
const PHOTO = { x: 46, y: 70, w: 700, h: 490 };
const COLUMN_X = 800;
const COLUMN_W = W - COLUMN_X - 50;
// How much of the spread's width the photo shows
const CROP_W = 0.36;
// The paper of the sketchbook template (fractions of the spread): the photo stays on it
const PAPER = { x0: 88 / 1760, x1: 1672 / 1760, y0: 270 / 1240, y1: 969 / 1240 };
const JPEG_QUALITY = 88;

/* ---- Fonts (loaded once) ---- */

let fonts: Promise<{ title: SkTypeface; body: SkTypeface } | null> | null = null;

async function typeface(module: number): Promise<SkTypeface | null> {
  const asset = Asset.fromModule(module);
  await asset.downloadAsync();
  const data = await Skia.Data.fromURI(asset.localUri ?? asset.uri);
  return Skia.Typeface.MakeFreeTypeFaceFromData(data);
}

function loadFonts() {
  fonts ??= Promise.all([typeface(PlayfairDisplay_700Bold), typeface(Lora_400Regular_Italic)])
    .then(([title, body]) => (title && body ? { title, body } : null))
    .catch((e) => {
      console.warn('Postcard fonts could not be loaded', e);
      fonts = null; // try again next time
      return null;
    });
  return fonts;
}

/* ---- Drawing ---- */

const solid = (color: string, style: PaintStyle = PaintStyle.Fill, width = 0): SkPaint => {
  const p = Skia.Paint();
  p.setAntiAlias(true);
  p.setColor(Skia.Color(color));
  p.setStyle(style);
  if (width) p.setStrokeWidth(width);
  return p;
};

/** The width of a line of text (glyph by glyph: `measureText` is not there on the web). */
function textWidth(font: SkFont, text: string): number {
  return font.getGlyphWidths(font.getGlyphIDs(text)).reduce((sum, w) => sum + w, 0);
}

/** Words laid out over lines no wider than `width` (at most `max` lines; the last one ellipsed). */
function wrap(text: string, font: SkFont, width: number, max: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.normalize('NFC').split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (textWidth(font, next) <= width || !line) line = next;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (lines.length > max) {
    lines.length = max;
    lines[max - 1] = `${lines[max - 1].replace(/\s+\S*$/, '')}…`;
  }
  return lines;
}

function starPath(cx: number, cy: number, r: number) {
  const shape = Skia.PathBuilder.Make();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + radius * Math.cos(a);
    const y = cy + radius * Math.sin(a);
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  return shape.close().build();
}

/** The part of the painting (image pixels) the photo shows, around `focus` and on the paper. */
function cropOf(image: SkImage, focus: { x: number; y: number }) {
  const iw = image.width();
  const ih = image.height();
  const w = CROP_W * iw;
  const h = (w * PHOTO.h) / PHOTO.w;
  const x = Math.min(PAPER.x1 * iw - w, Math.max(PAPER.x0 * iw, focus.x * iw - w / 2));
  const y = Math.min(PAPER.y1 * ih - h, Math.max(PAPER.y0 * ih, focus.y * ih - h / 2));
  return Skia.XYWHRect(x, y, w, h);
}

// The stamp: its centre and the widest its label may be (px)
const STAMP = { x: W - 120, y: 110, label: 84 };

function drawStamp(c: SkCanvas, label: string, font: SkFont, ink: SkPaint, gilded: boolean) {
  const cx = STAMP.x;
  const cy = STAMP.y;
  c.save();
  c.rotate(-12, cx, cy);
  if (gilded) c.drawCircle(cx, cy, 62, solid('rgba(250, 204, 21, 0.35)'));
  const color = gilded ? 'rgba(161, 98, 7, 0.9)' : 'rgba(166, 50, 50, 0.75)';
  const ring = solid(color, PaintStyle.Stroke, 4);
  ring.setPathEffect(Skia.PathEffect.MakeDash([10, 6], 0));
  c.drawCircle(cx, cy, 62, ring);
  c.drawCircle(cx, cy, 50, solid(color, PaintStyle.Stroke, 2));
  const text = label.toUpperCase().normalize('NFC');
  // A long country name is set smaller, inside the inner ring
  const width = textWidth(font, text);
  const fit = Math.min(1, STAMP.label / width);
  c.translate(cx, cy);
  c.scale(fit, fit);
  c.drawText(text, -width / 2, 6, ink, font);
  c.restore();
}

/** The postcard as a base64 JPEG (null if it could not be drawn: no share then, never a crash). */
export async function drawPostcard(content: PostcardContent): Promise<string | null> {
  const loaded = await loadFonts();
  if (!loaded) return null;
  const art = await loadSceneImage(artOf(content.page));
  const surface = Skia.Surface.Make(W, H);
  try {
    if (!surface) {
      console.warn('No surface to draw the postcard on');
      return null;
    }
    const c = surface.getCanvas();
    const titleFont = Skia.Font(loaded.title, 42);
    const bodyFont = Skia.Font(loaded.body, 26);
    const smallFont = Skia.Font(loaded.body, 20);
    const stampFont = Skia.Font(loaded.title, 17);
    const ink = solid(colors.ink);
    const soft = solid(colors.inkSoft);
    const red = solid(content.gilded ? '#a16207' : colors.crimson);

    // Paper, with a ruled edge
    c.drawColor(Skia.Color(colors.paperCard));
    c.drawRect(Skia.XYWHRect(16, 16, W - 32, H - 32), solid(content.gilded ? '#d4a017' : colors.hairline, PaintStyle.Stroke, content.gilded ? 6 : 2));

    // The photo: a corner of the painting, slightly askew, on a white mount
    const focus = content.focus ?? { x: 0.5, y: 0.5 };
    c.save();
    c.rotate(-2, PHOTO.x + PHOTO.w / 2, PHOTO.y + PHOTO.h / 2);
    const mount = Skia.XYWHRect(PHOTO.x - 12, PHOTO.y - 12, PHOTO.w + 24, PHOTO.h + 24);
    const shadow = solid('rgba(43, 39, 33, 0.25)');
    shadow.setMaskFilter(Skia.MaskFilter.MakeBlur(0, 10, true));
    c.drawRect(Skia.XYWHRect(mount.x + 4, mount.y + 8, mount.width, mount.height), shadow);
    c.drawRect(mount, solid('#ffffff'));
    c.drawImageRectOptions(
      art.image,
      cropOf(art.image, focus),
      Skia.XYWHRect(PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h),
      FilterMode.Linear,
      MipmapMode.Linear,
      null
    );
    c.restore();

    drawStamp(c, content.country, stampFont, red, !!content.gilded);

    // The column: title, stars, the lines
    let y = 250;
    for (const line of wrap(content.title, titleFont, COLUMN_W, 2)) {
      c.drawText(line, COLUMN_X, y, ink, titleFont);
      y += 50;
    }
    if (content.stars !== undefined) {
      const gold = solid('#eab308');
      const empty = solid('rgba(43, 39, 33, 0.2)');
      for (let i = 0; i < 3; i++) c.drawPath(starPath(COLUMN_X + 22 + i * 52, y - 4, 20), i < content.stars ? gold : empty);
      y += 50;
    }
    for (const text of content.lines) {
      for (const line of wrap(text, bodyFont, COLUMN_W, 2)) {
        c.drawText(line, COLUMN_X, y, soft, bodyFont);
        y += 36;
      }
    }

    // The footer
    c.drawLine(COLUMN_X, H - 92, W - 50, H - 92, solid(colors.goldLight, PaintStyle.Stroke, 2));
    for (const [i, line] of wrap(content.footer, smallFont, COLUMN_W, 2).entries()) {
      c.drawText(line, COLUMN_X, H - 60 + i * 26, soft, smallFont);
    }

    surface.flush();
    const snapshot = surface.makeImageSnapshot();
    try {
      return snapshot.encodeToBase64(ImageFormat.JPEG, JPEG_QUALITY);
    } finally {
      snapshot.dispose();
    }
  } catch (e) {
    console.warn('The postcard could not be drawn', e);
    return null;
  } finally {
    surface?.dispose();
    art.image.dispose();
    art.closeSource?.();
  }
}
