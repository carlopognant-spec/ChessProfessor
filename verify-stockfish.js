const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];

  page.on('pageerror', (error) => errors.push('pageerror: ' + error.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push('console:error: ' + msg.text());
  });

  await page.goto('http://localhost:4174/ChessProfessor/', { waitUntil: 'networkidle' });
  const wasm = await page.waitForResponse((response) =>
    response.url().includes('stockfish-19-lite-single.wasm') && response.status() === 200,
  );

  await page.locator('[data-square="e2"]').click();
  await page.locator('[data-square="e4"]').click();
  await page.locator('.engine-eval-label').waitFor({ state: 'visible' });

  const text = await page.locator('.engine-eval-label').innerText();
  const arrows = await page.locator('.engine-arrow-overlay line').count();

  const result = {
    text,
    arrows,
    wasmStatus: wasm.status(),
    errors,
    hasEval: text.includes('Valutazione:'),
    hasOverlay: arrows > 0,
  };

  const fs = require('fs');
  fs.writeFileSync('verify-stockfish-output.json', JSON.stringify(result, null, 2));
  await browser.close();
})().catch((error) => {
  const fs = require('fs');
  fs.writeFileSync('verify-stockfish-output.json', JSON.stringify({ error: error.message }, null, 2));
  process.exit(1);
});
