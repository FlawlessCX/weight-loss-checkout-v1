const { chromium } = require('/Users/alexbradbury/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const path = require('path');

const OUT_DIR = `${process.env.HOME}/Desktop/treatment-variants`;
const URL = 'http://localhost:8000';
const SCENARIOS = [
  { key: 'none', label: '1-no-restrictions' },
  { key: 'some', label: '2-some-conditions' },
  { key: 'many', label: '3-more-conditions' },
];

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,  // retina quality
  });
  const page = await context.newPage();

  // Load the app
  await page.goto(URL, { waitUntil: 'networkidle' });

  for (const { key, label } of SCENARIOS) {
    console.log(`Capturing scenario: ${label}`);

    // Set scenario + jump to product page
    await page.evaluate((scenario) => {
      treatmentScenario = scenario;
      const jumpEl = document.querySelector(`[data-jump="product"]`);
      if (jumpEl) jumpEl.click();
    }, key);

    // Wait for render
    await page.waitForTimeout(400);

    // Unlock clipping containers and measure true height
    const fullH = await page.evaluate(() => {
      const device = document.getElementById('device');
      const main   = document.querySelector('main.body');
      const footer = document.querySelector('.footer, footer, .sticky-footer');

      if (device) {
        device.style.overflow  = 'visible';
        device.style.height    = 'auto';
        device.style.maxHeight = 'none';
      }
      if (main) {
        main.style.overflow  = 'visible';
        main.style.height    = 'auto';
        main.style.maxHeight = 'none';
        main.style.position  = 'static';
      }
      if (footer) {
        footer.style.position = 'relative';  // un-stick the footer
      }
      document.documentElement.style.overflow = 'visible';
      document.documentElement.style.height   = 'auto';
      document.body.style.overflow = 'visible';
      document.body.style.height   = 'auto';

      return document.documentElement.scrollHeight;
    });

    console.log(`  Full height: ${fullH}px`);

    // Resize viewport to full content height
    await page.setViewportSize({ width: 390, height: fullH });
    await page.waitForTimeout(200);

    const outPath = path.join(OUT_DIR, `choose-treatment-${label}.png`);
    await page.screenshot({ path: outPath, fullPage: true, type: 'png' });
    console.log(`  Saved: ${outPath}`);
  }

  await browser.close();
  console.log('Done.');
})();
