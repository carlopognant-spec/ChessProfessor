import { test, expect } from '@playwright/test';

test('Stockfish local engine renders eval and arrows after 1.e4', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(`console:error: ${msg.text()}`);
    }
  });

  const wasmResponsePromise = page.waitForResponse((response) =>
    response.url().includes('stockfish-19-lite-single.wasm') && response.status() === 200,
  );

  await page.goto('http://localhost:4173/ChessProfessor/', { waitUntil: 'networkidle' });
  await wasmResponsePromise;

  await page.locator('[data-square="e2"]').click();
  await page.locator('[data-square="e4"]').click();

  await expect(page.locator('.engine-eval-label')).toContainText('Valutazione:');
  await expect(page.locator('.engine-arrow-overlay')).toHaveCount(1);
  await expect(page.locator('.engine-arrow-overlay line')).toHaveCount(1);
  expect(errors).toEqual([]);
});
