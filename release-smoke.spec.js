import { test, expect } from '@playwright/test'
import { Chess } from 'chess.js'

const appUrl = process.env.CHESSPROFESSOR_RELEASE_URL || 'http://127.0.0.1:4175/ChessProfessor/'
async function tools(page, section) {
  const menu = page.locator('.tools-menu')
  if (!await menu.evaluate(element => element.open)) await menu.locator(':scope > summary').click()
  const target = menu.locator('details').filter({ has: page.locator('summary', { hasText: section }) }).first()
  if (!await target.evaluate(element => element.open)) await target.locator(':scope > summary').click()
}

test('production clearly disables AI chat without contacting providers', async ({ page }) => {
  let calls = 0
  await page.route(/api\.groq\.com|generativelanguage\.googleapis\.com/, route => { calls++; return route.abort() })
  await page.goto(appUrl)
  await tools(page, 'Chatbot')
  await expect(page.locator('.chat-panel')).toContainText('temporaneamente disabilitata online')
  await expect(page.locator('.chat-panel')).toContainText('deterministiche')
  await expect(page.locator('.chat-panel input')).toHaveCount(0)
  expect(calls).toBe(0)
})

test('production analyzes, explains, archives and practices a real Stockfish mistake', async ({ page, context }) => {
  const board = new Chess('7k/8/5KQ1/8/8/8/8/8 w - - 0 1')
  board.move('Qh7+')
  const originalFen = board.fen()
  await page.goto(appUrl)
  await tools(page, 'Partita e analisi')
  await page.getByPlaceholder('Incolla un PGN', { exact: false }).fill(board.pgn())
  await page.getByRole('button', { name: 'Importa PGN', exact: true }).click()
  await page.getByRole('button', { name: 'Avvia analisi', exact: true }).click()
  await expect(page.locator('.analysis-row-button')).toHaveCount(1)
  const details = page.locator('.classification-details').first()
  await details.locator(':scope > summary').click()
  await details.getByText('Spiegazione scacchistica', { exact: true }).click()
  await expect(details.getByRole('region', { name: 'Spiegazione scacchistica' })).toContainText('Qg7#')
  await page.getByRole('button', { name: 'Riprova posizione 1', exact: true }).click()
  const practice = page.locator('.review-practice')
  await expect(practice).toHaveAttribute('data-practice-status', 'ready')
  await expect(practice.getByRole('region', { name: 'Spiegazione scacchistica' })).toHaveCount(0)
  await practice.locator('#practice-san').fill('Qg7#')
  await practice.getByRole('button', { name: 'Verifica mossa', exact: true }).click()
  await expect(practice).toHaveAttribute('data-practice-status', 'correct')
  await expect(practice.getByRole('region', { name: 'Spiegazione scacchistica' })).toContainText('Qh7+')
  await practice.getByRole('button', { name: 'Chiudi pratica', exact: true }).click()
  await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', originalFen)
  await page.locator('.game-archive > summary').click()
  await page.getByRole('button', { name: 'Salva partita e analisi', exact: true }).click()
  await expect(page.locator('.game-archive').getByRole('button', { name: 'Apri', exact: true })).toHaveCount(1)
  await page.reload()
  await tools(page, 'Partita e analisi')
  await page.locator('.game-archive > summary').click()
  await context.setOffline(true)
  await page.locator('.game-archive').getByRole('button', { name: 'Apri', exact: true }).click()
  await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', originalFen)
  await expect(page.locator('.analysis-row-button')).toHaveCount(1)
  await context.setOffline(false)
})
