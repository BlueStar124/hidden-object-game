import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = createRequire(path.join(root, 'package.json'))('playwright');

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 750 } });
  console.log('Navigating to http://localhost:8081 ...');
  await page.goto('http://localhost:8081');
  await page.waitForTimeout(6000);
  
  // Take screenshot of whatever is on screen to see what screen we're on
  await page.screenshot({ path: path.join(root, 'scratch', 'initial-screen.png') });
  console.log('Saved initial-screen.png');

  // Look for guest button or play button
  const guestBtn = page.getByRole('button', { name: /khách/i });
  if (await guestBtn.isVisible().catch(() => false)) {
    console.log('Clicking guest button...');
    await guestBtn.click();
    await page.waitForTimeout(2000);
  }

  const playBtn = page.getByRole('button', { name: /Chơi Tiếp|Bắt đầu|Chơi/i }).first();
  if (await playBtn.isVisible().catch(() => false)) {
    console.log('Clicking play button...');
    await playBtn.click();
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: path.join(root, 'scratch', 'after-click.png') });
  await browser.close();
}

main().catch(console.error);
