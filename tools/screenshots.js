#!/usr/bin/env node
/*
 * Render the README screenshots from tools/preview.html.
 *
 * Usage (from the repository root, after tools/build.py):
 *   npm install --no-save playwright && npx playwright install chromium
 *   node tools/screenshots.js
 *   python tools/make_docs.py
 *
 * The clock is fixed and animations are paused, so the images come out the same every time.
 */
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');

// [file, model, state, width]
const SHOTS = [
  ['online-standard-4x.png', 'standard_4x', 'online', 520],
  ['alerts-mini.png', 'mini', 'alerts', 520],
  ['snow-melt-performance.png', 'performance_gen_3', 'heating', 520],
  ['sleeping-actuated.png', 'standard_actuated', 'sleeping', 520],
  ['phone-v5.png', 'v5', 'quiet', 360],
  ['outages-standard-4x.png', 'standard_4x', 'drops', 520],
  ['offline-now-standard-4x.png', 'standard_4x', 'down_now', 520],
];

(async () => {
  const browser = await chromium.launch();
  for (const [file, model, state, width] of SHOTS) {
    const ctx = await browser.newContext({ viewport: { width: width + 40, height: 700 }, deviceScaleFactor: 2,
                                           timezoneId: 'Australia/Brisbane' });
    const page = await ctx.newPage();
    await page.clock.setFixedTime(new Date('2026-10-05T21:30:00+10:00'));
    await page.goto(`file://${ROOT}/tools/preview.html?model=${model}&state=${state}&width=${width}`);
    await page.waitForTimeout(600);
    await page.evaluate(() => document.getElementById('card').shadowRoot.getAnimations()
      .forEach((a) => { a.pause(); a.currentTime = 2000; }));
    await page.locator('#card').screenshot({ path: path.join(DOCS, file) });
    await ctx.close();
    console.log('docs/' + file);
  }
  await browser.close();
})();
