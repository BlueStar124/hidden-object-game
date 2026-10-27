import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appRoot = path.join(root, 'app');
const buildDir = path.join(appRoot, 'dist-screens');
const { chromium } = createRequire(path.join(root, 'package.json'))('playwright');

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.wasm': 'application/wasm',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.ttf': 'font/ttf',
};

async function main() {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path.join(buildDir, url);
    if (!file.startsWith(buildDir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(buildDir, 'index.html');
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  console.log(`Serving dist-screens on http://127.0.0.1:${port}`);

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 750 } });
  
  await page.goto(`http://127.0.0.1:${port}`);
  await page.waitForTimeout(4000);

  const guestBtn = page.getByRole('button', { name: /Chơi không cần đăng nhập|khách/i });
  if (await guestBtn.isVisible().catch(() => false)) {
    console.log('Clicking "Chơi không cần đăng nhập"...');
    await guestBtn.click();
    await page.waitForTimeout(2000);
  }

  const playBtn = page.getByRole('button', { name: /Bắt Đầu Điều Tra|Chơi Tiếp/i });
  if (await playBtn.isVisible().catch(() => false)) {
    console.log('Clicking start button...');
    await playBtn.click();
    await page.waitForTimeout(2000);
  }

  const openBookBtn = page.getByRole('button', { name: /Mở Cuốn Sổ & Bắt Đầu Điều Tra/i });
  if (await openBookBtn.isVisible().catch(() => false)) {
    console.log('Dismissing prologue modal...');
    await openBookBtn.click();
    await page.waitForTimeout(1000);
  }

  // Ensure HUD is rendered
  const widths = [1400, 1180, 1020, 880, 750];
  for (const w of widths) {
    await page.setViewportSize({ width: w, height: 700 });
    await page.waitForTimeout(500);
    const shotPath = path.join(root, 'scratch', `live-hud-${w}.png`);
    await page.screenshot({ path: shotPath });
    console.log(`Saved screenshot: ${shotPath}`);
  }

  await browser.close();
  server.close();
  console.log('Done!');
}

main().catch(console.error);
