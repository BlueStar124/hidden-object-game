#!/usr/bin/env node
/**
 * Screen-size tests of the web app: the home screen, the game screen and every dialog — with its longest content,
 * from the gallery in app/test/screens — on the screens players have: phones held sideways and
 * upright (what is left once the browser's bars are drawn), tablets, computers.
 *
 * A screen fails when something is cut off or outside the window, when a dialog that should fit
 * has to be scrolled, when it is shrunk too small to read, or when the page itself scrolls.
 * Screenshots of every case go to scratch/screens/ for a look by eye.
 *
 * Run from app/:  npm run test:screens   (needs `npm install` at the repo root for Playwright, and
 * once: npx playwright install chromium).  --no-build reuses app/dist-screens.
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const toolsRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolsRoot, '..');
const appRoot = path.join(repoRoot, 'app');
const buildDir = path.join(appRoot, 'dist-screens');
const shotsDir = path.join(repoRoot, 'scratch', 'screens');
const { chromium } = createRequire(path.join(repoRoot, 'package.json'))('playwright');

/** Visible area in CSS pixels. Phones: the screen minus the browser's bars, held each way. */
const VIEWPORTS = [
  { name: 'iphone-se-landscape', width: 667, height: 320, mobile: true },
  { name: 'iphone-14-landscape', width: 844, height: 327, mobile: true }, // the reported case
  { name: 'iphone-14-pro-max-landscape', width: 932, height: 370, mobile: true },
  { name: 'android-landscape', width: 915, height: 340, mobile: true },
  { name: 'small-android-landscape', width: 640, height: 300, mobile: true },
  { name: 'iphone-se-portrait', width: 375, height: 553, mobile: true },
  { name: 'iphone-14-portrait', width: 390, height: 664, mobile: true },
  { name: 'android-portrait', width: 412, height: 780, mobile: true },
  { name: 'small-android-portrait', width: 360, height: 600, mobile: true },
  { name: 'ipad-portrait', width: 768, height: 954, mobile: true },
  { name: 'ipad-landscape', width: 1024, height: 698, mobile: true },
  { name: 'laptop', width: 1280, height: 720 },
  { name: 'desktop', width: 1440, height: 900 },
];

/** Gallery dialogs (app/test/screens/Gallery.tsx). Lists scroll; everything else must fit. */
const DIALOGS = ['victory', 'victory-perfect', 'timeup', 'pause', 'prologue', 'night-intro', 'rotate', 'index', 'album'];
const SCROLLING = new Set(['index', 'album']);

// A dialog may shrink to fit, down to this: below it, its smallest text gets hard to read
const MIN_SCALE = 0.75;

/* --------------------------------- Build & serve -------------------------------- */

if (!process.argv.includes('--no-build')) {
  console.log('Building the web app with the dialog gallery…');
  const result = spawnSync('npx', ['expo', 'export', '--platform', 'web', '--output-dir', 'dist-screens'], {
    cwd: appRoot,
    env: { ...process.env, SKETCHBOOK_SCREEN_TESTS: '1' },
    stdio: ['ignore', 'ignore', 'inherit'],
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.wasm': 'application/wasm',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.ttf': 'font/ttf',
};
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.join(buildDir, url);
  if (!file.startsWith(buildDir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(buildDir, 'index.html');
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;

/* ------------------------------------ Checks ------------------------------------ */

/** What is wrong with the page and the dialog on it (runs in the browser). */
function inspectPage({ scrolls, minScale }) {
  const problems = [];
  const W = innerWidth;
  const H = innerHeight;
  const doc = document.scrollingElement;
  if (doc.scrollHeight > H + 1 || doc.scrollWidth > W + 1) problems.push(`the page scrolls (${doc.scrollWidth}×${doc.scrollHeight})`);

  const outside = (r) => r.top < -0.5 || r.left < -0.5 || r.bottom > H + 0.5 || r.right > W + 0.5;
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.opacity !== '0';
  };
  const describe = (el) => (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40);
  // In a list that scrolls (the clue cards, the page index…), items may be scrolled out of view:
  // the list itself must be on screen
  const scroller = (el) => {
    for (let p = el.parentElement; p; p = p.parentElement) {
      const s = getComputedStyle(p);
      const x = /(auto|scroll)/.test(s.overflowX) && p.scrollWidth > p.clientWidth + 1;
      const y = /(auto|scroll)/.test(s.overflowY) && p.scrollHeight > p.clientHeight + 1;
      if (x || y) return p;
    }
    return null;
  };
  const onScreen = (el) => scroller(el) ?? el;

  const dialogs = [...document.querySelectorAll('[data-testid="dialog"]')];
  const dialog = dialogs[dialogs.length - 1];
  let scale = null;
  if (dialog) {
    const card = dialog.getBoundingClientRect();
    scale = card.height / dialog.offsetHeight;
    if (outside(card)) problems.push(`the dialog does not fit the window (${Math.round(card.width)}×${Math.round(card.height)} at ${Math.round(card.left)},${Math.round(card.top)})`);
    if (scale < minScale - 0.005) problems.push(`the dialog is shrunk to ${scale.toFixed(2)}× (minimum ${minScale})`);
    if (!scrolls) {
      for (const el of dialog.querySelectorAll('*')) {
        const s = getComputedStyle(el);
        if (/(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 1) {
          problems.push(`the dialog has to be scrolled (${el.scrollHeight - el.clientHeight}px hidden)`);
          break;
        }
      }
    }
    // Its buttons, within the card
    for (const el of dialog.querySelectorAll('[role="button"]')) {
      if (!visible(el)) continue;
      const r = onScreen(el).getBoundingClientRect();
      if (outside(r) || r.top < card.top - 0.5 || r.bottom > card.bottom + 0.5) problems.push(`button "${describe(el)}" is cut off`);
    }
  } else {
    // The game: every control on screen
    const seen = new Set();
    for (const el of document.querySelectorAll('[role="button"]')) {
      const target = onScreen(el);
      if (seen.has(target) || !visible(el)) continue;
      seen.add(target);
      if (outside(target.getBoundingClientRect())) problems.push(`"${describe(target)}" is outside the window`);
    }
  }
  return { problems, scale };
}

const settle = (page, ms = 1100) => page.waitForTimeout(ms); // entering animations

async function check(page, viewport, name, options) {
  const { problems, scale } = await page.evaluate(inspectPage, { minScale: MIN_SCALE, scrolls: false, ...options });
  const dir = path.join(shotsDir, viewport.name);
  fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, `${name}.png`) });
  return { viewport: viewport.name, name, problems, scale };
}

/* ------------------------------------- Run -------------------------------------- */

fs.rmSync(shotsDir, { recursive: true, force: true });
const browser = await chromium.launch();
const results = [];
try {
  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      isMobile: !!viewport.mobile,
      hasTouch: !!viewport.mobile,
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));

    // The game itself: rotate prompt (upright phones), home screen (a new player: "Bắt Đầu Điều
    // Tra"), case file, then the sketchbook
    await page.goto(origin, { waitUntil: 'load' });
    await page.getByText(/^Bắt Đầu Điều Tra$|Vẫn chơi màn hình dọc/).first().waitFor({ timeout: 60000 });
    await settle(page);
    const keepPortrait = page.getByText('Vẫn chơi màn hình dọc');
    if (await keepPortrait.count()) {
      results.push(await check(page, viewport, 'game-rotate'));
      await keepPortrait.first().click();
      await settle(page);
    }
    results.push(await check(page, viewport, 'game-home'));
    await page.getByText('Bắt Đầu Điều Tra', { exact: true }).click();
    await page.getByText('Mở Cuốn Sổ').first().waitFor({ timeout: 10000 });
    await settle(page);
    results.push(await check(page, viewport, 'game-prologue'));
    await page.getByText('Mở Cuốn Sổ').first().click();
    await settle(page, 1500);
    results.push(await check(page, viewport, 'game'));

    // Every dialog of the gallery
    for (const name of DIALOGS) {
      await page.evaluate((hash) => (location.hash = hash), name);
      await page.locator('[data-testid="dialog"]').first().waitFor({ timeout: 10000 });
      await settle(page);
      results.push(await check(page, viewport, name, { scrolls: SCROLLING.has(name) }));
    }
    if (errors.length) results.push({ viewport: viewport.name, name: 'errors', problems: errors, scale: null });
    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}

/* ------------------------------------ Report ------------------------------------ */

const failed = results.filter((r) => r.problems.length);
for (const viewport of VIEWPORTS) {
  const rows = results.filter((r) => r.viewport === viewport.name);
  const line = rows.map((r) => `${r.problems.length ? '✗' : '✓'} ${r.name}${r.scale && r.scale < 0.995 ? ` (${r.scale.toFixed(2)}×)` : ''}`);
  console.log(`\n${viewport.name} ${viewport.width}×${viewport.height}\n  ${line.join('  ')}`);
  for (const r of rows) for (const p of r.problems) console.log(`    ${r.name}: ${p}`);
}
console.log(`\n${results.length - failed.length}/${results.length} screens fit. Screenshots: ${path.relative(repoRoot, shotsDir)}/`);
process.exit(failed.length ? 1 : 0);
