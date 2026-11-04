import { test, expect } from '@playwright/test'
import { Chess } from 'chess.js'

test('touch input, promotion and real browser clipboard preserve the editor draft', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 900 }, isMobile: true, hasTouch: true,
    permissions: ['clipboard-read', 'clipboard-write'] })
  const page = await context.newPage()
  await page.route('https://explorer.lichess.ovh/**', route => route.fulfill({ json: { white: 0, draws: 0, black: 0, moves: [] } }))
  try {
    await page.goto('http://127.0.0.1:4173/ChessProfessor/')
    await page.locator('[data-square="e2"]').tap()
    await page.locator('[data-square="e4"]').tap()
    const game = new Chess(); game.move('e4')
    await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', game.fen())
    await expect(page.locator('.move-button')).toHaveCount(1)
    await page.locator('.tools-menu > summary').tap()
    await page.locator('.tools-editor > summary').tap()
    const field = page.getByRole('textbox', { name: 'FEN', exact: true })
    const draft = '7k/P7/8/8/8/8/8/7K w - - 0 1'
    await field.fill(draft)
    // Keep prior clipboard contents in the page only; never return or log them.
    await page.evaluate(async () => { window.previousClipboard = await navigator.clipboard.readText() })
    try {
      await page.getByRole('button', { name: 'Copia FEN corrente', exact: true }).tap()
      expect(await page.evaluate(async expected => await navigator.clipboard.readText() === expected, game.fen())).toBe(true)
      await expect(field).toHaveValue(draft)
      await page.getByRole('button', { name: 'Copia bozza FEN', exact: true }).tap()
      expect(await page.evaluate(async expected => await navigator.clipboard.readText() === expected, draft)).toBe(true)
      await expect(field).toHaveValue(draft)
    } finally {
      await page.evaluate(async () => { await navigator.clipboard.writeText(window.previousClipboard); delete window.previousClipboard })
    }
    await page.getByRole('button', { name: 'Applica posizione', exact: true }).tap()
    await page.locator('.tools-editor > summary').tap()
    await page.locator('[data-square="a7"]').tap()
    await page.locator('[data-square="a8"]').tap()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: 'Cavallo', exact: true }).tap()
    await expect(page.getByRole('dialog')).not.toBeVisible()
    expect(new Chess(await page.locator('.board-stage').getAttribute('data-fen')).get('a8').type).toBe('n')
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390)
  } finally { await context.close() }
})
