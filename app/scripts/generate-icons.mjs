#!/usr/bin/env node
/**
 * Renders the app icons (iOS, Android adaptive, splash, favicon, PWA) from one HTML composition:
 * the brass loupe of the game with the calico cat peeking through the lens.
 * Run from app/:  npm run generate:icons   (uses Playwright from the web project's devDependencies)
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(appRoot, '..');
const { chromium } = createRequire(path.join(repoRoot, 'package.json'))('playwright');

// The cat drawing is taken from the generated art (same as the game)
const art = fs.readFileSync(path.join(appRoot, 'src/sprites/art.generated.ts'), 'utf8');
const svgTable = JSON.parse(
  art.slice(art.indexOf('SPRITE_SVG') + art.slice(art.indexOf('SPRITE_SVG')).indexOf('= ') + 2, art.lastIndexOf(';'))
);
const cat = svgTable.cat;

/**
 * @param {object} o
 * @param {boolean} o.background paper wash behind the loupe
 * @param {number} o.scale loupe size relative to the canvas
 * @param {boolean} o.mono white silhouette (Android themed icon)
 */
const page = ({ background, scale, mono }) => `<!doctype html><html><head><style>
  html, body { margin: 0; width: 1024px; height: 1024px; overflow: hidden; background: transparent; }
  .canvas { position: relative; width: 1024px; height: 1024px;
    ${
      background
        ? `background:
      radial-gradient(circle at 30% 25%, rgba(255,255,255,0.65), rgba(255,255,255,0) 45%),
      radial-gradient(circle at 75% 80%, rgba(154,106,62,0.18), rgba(154,106,62,0) 50%),
      radial-gradient(circle at 20% 85%, rgba(45,122,79,0.12), rgba(45,122,79,0) 40%),
      #ece7dc;`
        : ''
    } }
  .loupe { position: absolute; width: ${1024 * scale}px; height: ${1024 * scale}px;
    left: ${512 - 1024 * scale * 0.56}px; top: ${512 - 1024 * scale * 0.56}px; }
  .grip { position: absolute; width: 10%; height: 58%; left: 82%; top: 82%; transform-origin: 50% 0;
    transform: translateX(-50%) rotate(-45deg); border-radius: 999px;
    background: ${mono ? '#fff' : 'linear-gradient(90deg, #3d2716 0%, #6d4a2d 40%, #8c603a 65%, #3d2716 100%)'};
    ${mono ? '' : 'box-shadow: 10px 24px 48px rgba(0,0,0,0.35);'} }
  .grip::after { content: ''; position: absolute; top: 0; left: -14%; width: 128%; height: 14%; border-radius: 999px 999px 35% 35%;
    background: ${mono ? '#fff' : 'linear-gradient(90deg, #b3833b 0%, #e5c378 50%, #8c6226 100%)'}; }
  .bezel { position: absolute; inset: 0; border-radius: 50%; padding: 4.5%; box-sizing: border-box;
    background: ${
      mono
        ? '#fff'
        : `conic-gradient(from 180deg, #8c6226, #e5c378 45deg, #b3833b 90deg, #fff1c4 135deg, #8c6226 180deg,
      #e5c378 225deg, #b3833b 270deg, #fff1c4 315deg, #8c6226 360deg)`
    };
    ${mono ? '' : 'box-shadow: 0 24px 64px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.6), inset 0 -4px 8px rgba(0,0,0,0.5);'} }
  .lens { width: 100%; height: 100%; border-radius: 50%; overflow: hidden; position: relative;
    background: ${mono ? 'transparent' : 'radial-gradient(circle at 50% 60%, #f6efe0 0%, #e9dfca 70%, #d8ccb2 100%)'}; }
  ${mono ? '.lens { -webkit-mask: radial-gradient(circle, transparent 0 69%, #000 69.5%); background: #fff; }' : ''}
  .cat { position: absolute; width: 92%; height: 92%; left: 6%; top: 14%; ${mono ? 'display: none;' : ''} }
  .shine { position: absolute; inset: 0; border-radius: 50%;
    background: radial-gradient(circle at 32% 28%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 30%, rgba(255,255,255,0) 60%); ${mono ? 'display:none;' : ''} }
</style></head><body><div class="canvas"><div class="loupe">
  <div class="grip"></div>
  <div class="bezel"><div class="lens"><div class="cat">${cat}</div><div class="shine"></div></div></div>
</div></div></body></html>`;

const OUT = [
  // [file, size, options]
  ['assets/icon.png', 1024, { background: true, scale: 0.62 }],
  ['assets/android-icon-foreground.png', 1024, { background: false, scale: 0.46 }],
  ['assets/android-icon-monochrome.png', 1024, { background: false, scale: 0.46, mono: true }],
  ['assets/splash-icon.png', 1024, { background: false, scale: 0.6 }],
  ['assets/favicon.png', 64, { background: true, scale: 0.7 }],
  ['public/logo192.png', 192, { background: true, scale: 0.62 }],
  ['public/logo512.png', 512, { background: true, scale: 0.62 }],
  ['public/apple-touch-icon.png', 180, { background: true, scale: 0.62 }],
];

const browser = await chromium.launch();
try {
  const tab = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
  for (const [file, size, opts] of OUT) {
    await tab.setContent(page(opts));
    const buffer = await tab.screenshot({ omitBackground: !opts.background, clip: { x: 0, y: 0, width: 1024, height: 1024 } });
    let png = buffer;
    if (size !== 1024) {
      // Downscale in the browser for a clean result
      const data = `data:image/png;base64,${buffer.toString('base64')}`;
      await tab.setContent(
        `<html><body style="margin:0;background:transparent"><img src="${data}" style="width:${size}px;height:${size}px"></body></html>`
      );
      await tab.setViewportSize({ width: size, height: size });
      png = await tab.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
      await tab.setViewportSize({ width: 1024, height: 1024 });
    }
    fs.mkdirSync(path.dirname(path.join(appRoot, file)), { recursive: true });
    fs.writeFileSync(path.join(appRoot, file), png);
    console.log(`  ${file} (${size}px)`);
  }
  // Android adaptive icon background: plain paper
  await tab.setContent('<html><body style="margin:0;width:1024px;height:1024px;background:#ece7dc"></body></html>');
  fs.writeFileSync(
    path.join(appRoot, 'assets/android-icon-background.png'),
    await tab.screenshot({ clip: { x: 0, y: 0, width: 1024, height: 1024 } })
  );
  console.log('  assets/android-icon-background.png (1024px)');
} finally {
  await browser.close();
}
