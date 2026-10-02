// Exported web build: traverse the book forwards and back without pausing between turns.
// node tools/benchmark-page-turn.cjs http://127.0.0.1:8093 scratch/turn-before.json
// THROTTLE=4 simulates a slower CPU; WIDTH, HEIGHT and DPR configure the viewport.
const { chromium } = require('playwright');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({ headless: true, args: process.platform === 'win32'
    ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] : [] });
  try {
    const page = await browser.newPage({ viewport: { width: +(process.env.WIDTH || 1280), height: +(process.env.HEIGHT || 720) },
      deviceScaleFactor: +(process.env.DPR || 1) });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => {
      window.__turnBench = { frames: [], long: [], calls: {}, recordings: 0 };
      const tick = t => { window.__turnBench.frames.push(t); requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
      new PerformanceObserver(list => {
        for (const e of list.getEntries()) window.__turnBench.long.push({ start: e.startTime, ms: e.duration });
      }).observe({ type: 'longtask', buffered: true });
      for (const proto of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
        for (const name of ['drawElements', 'drawArrays', 'copyTexSubImage2D', 'bindFramebuffer', 'useProgram']) {
          const original = proto[name];
          proto[name] = function (...args) {
            const calls = window.__turnBench.calls;
            calls[name] = (calls[name] || 0) + 1;
            return original.apply(this, args);
          };
        }
      }
    });
    await page.goto(process.argv[2] || 'http://127.0.0.1:8093', { waitUntil: 'load', timeout: 120000 });
    const start = page.getByLabel('Mở Cuốn Sổ & Bắt Đầu Điều Tra');
    await start.waitFor({ timeout: 120000 });
    const portrait = page.getByLabel('Vẫn chơi màn hình dọc');
    if (await portrait.count()) await portrait.click();
    await page.waitForTimeout(3000);
    await start.click();
    await page.locator('canvas').first().waitFor();
    await page.waitForTimeout(2000);
    await page.evaluate(() => {
      const proto = window.CanvasKit.PictureRecorder.prototype;
      const original = proto.beginRecording;
      proto.beginRecording = function (bounds) {
        if (bounds?.[2] === innerWidth) window.__turnBench.recordings++;
        return original.apply(this, arguments);
      };
    });
    const cdp = await page.context().newCDPSession(page);
    if (process.env.THROTTLE) await cdp.send('Emulation.setCPUThrottlingRate', { rate: +process.env.THROTTLE });
    if (process.env.PROFILE) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.start'); }
    const results = [];
    for (const dir of [1, -1]) {
      for (let i = 0; i < 8; i++) {
        const previousLabel = await page.getByLabel('Mục lục các trang ký họa').innerText();
        await page.evaluate(() => { window.__turnBench = { frames: [], long: [], calls: {}, recordings: 0 }; });
        await page.getByLabel(dir > 0 ? 'Lật sang trang sau' : 'Lật về trang trước').click();
        await page.waitForTimeout(950);
        await page.waitForFunction(previous => {
          const picker = document.querySelector('[aria-label="Mục lục các trang ký họa"]');
          return picker && picker.innerText !== previous;
        }, previousLabel);
        const intro = page.getByLabel('Mở Cuốn Sổ & Bắt Đầu Điều Tra');
        if (await intro.count()) await intro.click();
        const data = await page.evaluate(() => ({ ...window.__turnBench,
          label: document.body.innerText.match(/Trang \d+ \/ \d+/)?.[0] }));
        const expected = `Trang ${dir > 0 ? i + 2 : 8 - i} / 9`;
        if (data.label !== expected) throw new Error(`Expected ${expected}, got ${data.label}`);
        const gaps = data.frames.slice(1).map((t, n) => t - data.frames[n]);
        const sorted = [...gaps].sort((a, b) => a - b);
        const round = n => +n.toFixed(2);
        results.push({ dir, label: data.label, frames: gaps.length, p95Ms: round(sorted[Math.floor(sorted.length * .95)] || 0),
          maxMs: round(Math.max(0, ...gaps)), over25: gaps.filter(n => n > 25).length,
          longTasks: data.long.length, longMs: round(data.long.reduce((sum, e) => sum + e.ms, 0)), recordings: data.recordings,
          callsPerFrame: Object.fromEntries(Object.entries(data.calls).map(([k, v]) => [k, round(v / data.frames.length)])) });
      }
    }
    if (process.env.PROFILE) { const { profile } = await cdp.send('Profiler.stop');
      fs.writeFileSync(process.argv[3] + '.cpuprofile', JSON.stringify(profile)); }
    const report = { viewport: page.viewportSize(), dpr: +(process.env.DPR || 1), throttle: +(process.env.THROTTLE || 1), results, errors };
    console.log(JSON.stringify(report, null, 2));
    if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify(report, null, 2) + '\n');
    if (errors.length) process.exitCode = 1;
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
