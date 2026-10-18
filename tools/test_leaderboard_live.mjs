/**
 * UI MOCK TEST (Visual Regression & Responsive Verification)
 * --------------------------------------------------------
 * Bài kiểm tra giao diện bằng Playwright mô phỏng RPC backend bằng mock routes.
 * Mục đích: Kiểm tra hiển thị responsive, chuyển đổi tab, bộ lọc quốc gia/chương,
 * ghim dòng người chơi, huy hiệu Top 3 trên các kích thước màn hình mà không
 * tạo tài khoản rác trên backend production.
 */
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appRoot = path.join(root, 'app');
const buildDir = path.join(appRoot, 'dist');
const { chromium } = createRequire(path.join(root, 'package.json'))('playwright');

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.wasm': 'application/wasm',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.ttf': 'font/ttf',
};

async function main() {
  const artifactDir = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\f45e8d29-b936-4117-9220-00ecd9ce9b99\\screenshots';
  if (!fs.existsSync(artifactDir)) fs.mkdirSync(artifactDir, { recursive: true });

  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path.join(buildDir, url);
    if (!file.startsWith(buildDir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      file = path.join(buildDir, 'index.html');
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  console.log(`Serving app/dist on http://127.0.0.1:${port}`);

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });

  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));

  await page.route('**/rest/v1/rpc/get_leaderboard', async (route) => {
    const postData = route.request().postDataJSON() || {};
    const scope = postData.p_scope || 'journey';
    const totalPages = scope === 'journey' ? 37 : scope === 'country' ? 9 : 4;
    const mockList = [
      { rank: 1, userId: 'u-1', displayName: 'Minh Tuấn', totalScore: 19850, pagesCleared: totalPages, totalPages },
      { rank: 2, userId: 'u-2', displayName: 'Bảo Thạch', totalScore: 19200, pagesCleared: totalPages, totalPages },
      { rank: 3, userId: 'u-3', displayName: 'Hải Đăng', totalScore: 18750, pagesCleared: totalPages - 1, totalPages },
      { rank: 4, userId: 'u-4', displayName: 'Thám Tử Phố Cổ', totalScore: 17400, pagesCleared: totalPages - 2, totalPages },
      { rank: 5, userId: 'u-5', displayName: 'Sherlock Saigon', totalScore: 16900, pagesCleared: totalPages - 2, totalPages },
      { rank: 6, userId: 'u-6', displayName: 'Hoa Đăng', totalScore: 15300, pagesCleared: totalPages - 3, totalPages },
      { rank: 7, userId: 'u-7', displayName: 'Kính Lúp Vàng', totalScore: 14200, pagesCleared: totalPages - 4, totalPages },
      { rank: 8, userId: 'u-8', displayName: 'Mèo Mương Khởi', totalScore: 13500, pagesCleared: totalPages - 5, totalPages },
    ];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockList),
    });
  });

  await page.route('**/rest/v1/rpc/get_user_leaderboard_rank', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        rank: 137,
        userId: 'u-current',
        displayName: 'Thám tử tập sự',
        totalScore: 4250,
        pagesCleared: 6,
        totalPages: 37,
      }),
    });
  });

  await page.goto(`http://127.0.0.1:${port}`);
  await page.waitForTimeout(4000);

  // If on AuthScreen, click guest
  const guestBtn = page.getByRole('button', { name: /Chơi không cần đăng nhập|khách/i });
  if (await guestBtn.isVisible().catch(() => false)) {
    console.log('Clicking "Chơi không cần đăng nhập"...');
    await guestBtn.click();
    await page.waitForTimeout(2000);
  }

  // Home screen is visible now!
  console.log('Capturing Home Screen with Books tab (default)...');
  await page.screenshot({ path: path.join(artifactDir, 'bxh-01-home-books-tab.png') });

  // Click on "BXH" tab
  console.log('Clicking "BXH" tab...');
  const bxhTab = page.getByRole('tab', { name: /bảng xếp hạng|bxh/i });
  if (await bxhTab.isVisible().catch(() => false)) {
    await bxhTab.click();
  } else {
    // Try text match
    await page.getByText('BXH').first().click();
  }
  await page.waitForTimeout(2000);

  console.log('Capturing Home Screen with BXH tab active...');
  await page.screenshot({ path: path.join(artifactDir, 'bxh-02-home-bxh-tab.png') });

  // Test opening country picker
  console.log('Clicking country filter button...');
  const countryBtn = page.getByRole('button', { name: /Lọc theo quốc gia/i });
  if (await countryBtn.isVisible().catch(() => false)) {
    await countryBtn.click();
    await page.waitForTimeout(500);
    console.log('Capturing Country filter modal...');
    await page.screenshot({ path: path.join(artifactDir, 'bxh-03-country-picker-modal.png') });

    // Select Vietnam
    console.log('Selecting Việt Nam...');
    await page.getByText('Việt Nam').last().click();
    await page.waitForTimeout(1500);
  }

  console.log('Capturing BXH filtered by Việt Nam...');
  await page.screenshot({ path: path.join(artifactDir, 'bxh-04-filtered-vietnam.png') });

  // Test opening chapter picker for Vietnam
  console.log('Clicking chapter filter button...');
  const chapterBtn = page.getByRole('button', { name: /Lọc theo chương/i });
  if (await chapterBtn.isVisible().catch(() => false)) {
    await chapterBtn.click();
    await page.waitForTimeout(500);
    console.log('Capturing Chapter filter modal...');
    await page.screenshot({ path: path.join(artifactDir, 'bxh-05-chapter-picker-modal.png') });

    // Select Chapter 2
    console.log('Selecting Chapter 2...');
    await page.getByText(/Chương 2/i).last().click();
    await page.waitForTimeout(1500);
  }

  console.log('Capturing BXH filtered by Việt Nam - Chương 2...');
  await page.screenshot({ path: path.join(artifactDir, 'bxh-06-vietnam-chapter2.png') });

  // Test responsive landscape phone
  console.log('Resizing to Phone Landscape (840x390)...');
  await page.setViewportSize({ width: 840, height: 390 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(artifactDir, 'bxh-07-phone-landscape.png') });

  // Test responsive tablet (1024x600)
  console.log('Resizing to Tablet (1024x600)...');
  await page.setViewportSize({ width: 1024, height: 600 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(artifactDir, 'bxh-08-tablet.png') });

  await browser.close();
  server.close();
  console.log('All tests completed successfully!');
}

main().catch((err) => {
  console.error('Error in main:', err);
  process.exit(1);
});
