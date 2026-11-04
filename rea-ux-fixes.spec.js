import { test, expect } from '@playwright/test'
import { allowRefinementWorker, refinementWorkerSource } from './tests/helpers/browser-refinement-worker.js'

const url = 'http://127.0.0.1:4173/ChessProfessor/'
async function importGame(page, pgn) {
  await page.goto(url)
  await page.getByRole('button', { name: 'Importa partita', exact: true }).click()
  await page.getByRole('textbox', { name: 'PGN da importare', exact: true }).fill(pgn)
  await page.getByRole('button', { name: 'Importa PGN', exact: true }).click()
}

test('REA keyboard drag owns arrows until cancel or drop, then ordinary navigation resumes', async ({ page }) => {
  await importGame(page, '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 *')
  await page.locator('.move-button[data-ply="2"]').click()
  const board = page.locator('.board-stage'), counter = page.locator('.move-navigation-position')
  const piece = board.locator('[data-square="g1"] [role="button"]')
  const fen = await board.getAttribute('data-fen')
  await piece.focus(); await page.keyboard.press('Space')
  await expect(board).toHaveAttribute('data-dragging', 'true')
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowLeft')
  await expect(counter).toHaveText('2 / 6')
  await expect(board).toHaveAttribute('data-fen', fen)
  await page.keyboard.press('Escape')
  await expect(board).not.toHaveAttribute('data-dragging')
  await piece.focus(); await page.keyboard.press('Space'); await page.keyboard.press('Space')
  await expect(board).not.toHaveAttribute('data-dragging')
  await board.focus(); await page.keyboard.press('ArrowRight')
  await expect(counter).toHaveText('3 / 6')
  await page.keyboard.press('ArrowLeft')
  await expect(counter).toHaveText('2 / 6')
})

test('REA exact g4 case uses the real book and engine and is offered for practice', async ({ page }) => {
  await page.addInitScript(allowRefinementWorker, refinementWorkerSource)
  await importGame(page, '1. f3 e5 2. g4 Qh4# 0-1')
  await page.locator('.engine-workspace > summary').click()
  await page.getByRole('button', { name: 'Avvia analisi', exact: true }).click()
  await expect(page.locator('.move-button[data-ply="4"]')).toHaveAttribute('data-classification', 'best', { timeout: 60000 })
  await expect(page.locator('.engine-controls')).toHaveAttribute('aria-busy', 'false')
  const g4 = page.locator('.move-button[data-ply="3"]')
  await expect(g4).toHaveAttribute('data-classification', 'blunder')
  await g4.click()
  await expect(page.locator('.selected-move h3')).toHaveText('2. g4 · Errore grave')
  await page.getByRole('button', { name: 'Ripassa i miei errori', exact: true }).click()
  const practice = page.locator('.review-practice')
  await expect(practice).toBeVisible()
  await expect(practice).toHaveAttribute('data-practice-status', 'ready', { timeout: 60000 })
  await expect(practice).toContainText('Mossa 2, giocano i Bianchi')
  await page.screenshot({ path: 'docs/data/rea-fixes-g4-practice.png', fullPage: true })
})
