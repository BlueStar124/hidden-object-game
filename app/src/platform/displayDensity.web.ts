/**
 * How finely the board is drawn in a browser. Skia's web canvas (CanvasKit, WebAssembly) is sized at
 * `devicePixelRatio`: on a phone (3×) that is ~3 million pixels painted each frame, more than a phone's
 * GPU keeps up with. The watercolour pages look the same at a lower density, and the HTML around the
 * board (text, buttons) is not affected — only the canvas.
 */

// Phones: a finger for a pointer and a short side of a phone's size (CSS px)
const PHONE =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(pointer: coarse)').matches &&
  Math.min(window.screen.width, window.screen.height) < 600;

/** Device pixels per CSS pixel the board is drawn at, at most (phones: 4× fewer pixels than at 3×). */
const MAX_DENSITY = PHONE ? 1.5 : 2;

/**
 * Caps devicePixelRatio for the page's scripts — Skia reads it once as it loads, react-native-web's
 * PixelRatio on each call. Done as this module is imported, which index.web.ts does before Skia.
 */
function capDisplayDensity(): void {
  try {
    if (typeof window === 'undefined' || window.devicePixelRatio <= MAX_DENSITY) return;
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, get: () => MAX_DENSITY });
  } catch {
    // The page keeps its own density: sharper, slower
  }
}

capDisplayDensity();

/** Phones: frames with nothing but creatures moving are drawn every other frame (30 per second). */
export const IDLE_FRAME_STRIDE = PHONE ? 2 : 1;
