// Compare exported web builds with the same browser, viewport and GPU.
// node tools/benchmark-render.cjs http://127.0.0.1:8093 [results.json]
// WIDTH=844 HEIGHT=390 DPR=2 changes the viewport, not the physical GPU.
const { chromium } = require('playwright');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: process.platform === 'win32'
      ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] : [],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: +(process.env.WIDTH || 1280), height: +(process.env.HEIGHT || 720) },
      deviceScaleFactor: +(process.env.DPR || 1),
    });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      window.__renderBench = { calls: {}, frames: [] };
      const names = ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced',
        'bindFramebuffer', 'texSubImage2D', 'copyTexSubImage2D', 'useProgram', 'bufferSubData', 'clear'];
      for (const proto of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
        for (const name of names) {
          const original = proto[name];
          if (typeof original !== 'function') continue;
          proto[name] = function (...args) {
            const calls = window.__renderBench.calls;
            calls[name] = (calls[name] || 0) + 1;
            return original.apply(this, args);
          };
        }
      }
      const tick = time => {
        window.__renderBench.frames.push(time);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    const url = process.argv[2] || 'http://127.0.0.1:8093';
    await page.goto(url, { waitUntil: 'load', timeout: 120000 });
    const start = page.getByLabel('Mở Cuốn Sổ & Bắt Đầu Điều Tra');
    const homeStart = page.getByLabel('Bắt Đầu Điều Tra', { exact: true });
    await homeStart.waitFor({ timeout: 120000 });
    const portrait = page.getByLabel('Vẫn chơi màn hình dọc');
    if (await portrait.count()) await portrait.click();
    await page.waitForTimeout(3000);
    await homeStart.click();
    await start.click();
    await page.locator('canvas').first().waitFor();
    await page.waitForTimeout(4000);
    const gpu = await page.evaluate(() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      const ext = gl?.getExtension('WEBGL_debug_renderer_info');
      return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unknown';
    });
    const measure = async (name, action) => {
      await page.evaluate(() => { window.__renderBench = { calls: {}, frames: [] }; });
      await action();
      const { calls, frames } = await page.evaluate(() => window.__renderBench);
      if (frames.length < 2) throw new Error('No animation frames recorded');
      const intervals = frames.slice(1).map((t, i) => t - frames[i]).sort((a, b) => a - b);
      const round = value => +value.toFixed(2);
      return {
        name, frames: frames.length,
        fps: round(1000 * (frames.length - 1) / (frames.at(-1) - frames[0])),
        p95Ms: round(intervals[Math.floor(intervals.length * 0.95)]),
        callsPerFrame: Object.fromEntries(Object.entries(calls).map(([key, value]) => [key, round(value / frames.length)])),
      };
    };
    const results = [await measure('idle', () => page.waitForTimeout(2000))];
    const box = await page.locator('canvas').first().boundingBox();
    // The loupe initially lies here; grabbing the board's centre can pan the page instead.
    const x = box.x + box.width * 0.6;
    const y = box.y + box.height * 0.58;
    results.push(await measure('drag-loupe', async () => {
      await page.mouse.move(x, y);
      await page.mouse.down();
      for (let i = 1; i <= 80; i++) {
        const angle = i * Math.PI / 20;
        await page.mouse.move(x + Math.min(200, box.width * 0.2) * Math.sin(angle),
          y + Math.min(100, box.height * 0.2) * (Math.cos(angle) - 1));
        await page.waitForTimeout(25);
      }
      await page.mouse.up();
    }));
    const report = { url, viewport: page.viewportSize(), dpr: +(process.env.DPR || 1), gpu, results, errors };
    console.log(JSON.stringify(report, null, 2));
    if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify(report, null, 2) + '\n');
    if (errors.length) process.exitCode = 1;
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
