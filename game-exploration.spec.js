import { test, expect } from '@playwright/test'
import { Chess } from 'chess.js'
import { readFileSync } from 'node:fs'

async function importGame(page, pgn) {
  await page.getByRole('button', { name: 'Importa partita', exact: true }).click()
  await page.getByRole('textbox', { name: 'PGN da importare', exact: true }).fill(pgn)
  await page.getByRole('button', { name: 'Importa PGN', exact: true }).click()
}
test.beforeEach(async ({ page }) => {
  await page.route('https://explorer.lichess.ovh/**', route => route.fulfill({ json: { white: 0, draws: 0, black: 0, moves: [] } }))
  await page.addInitScript(() => {
    window.explorationCommands = []
    window.Worker = class {
      postMessage(command) {
        window.explorationCommands.push(command)
        if (command === 'uci') queueMicrotask(() => this.onmessage?.({ data: 'uciok' }))
        if (command === 'isready') queueMicrotask(() => this.onmessage?.({ data: 'readyok' }))
        if (command === 'stop') queueMicrotask(() => this.onmessage?.({ data: 'bestmove (none)' }))
      }
      terminate() {}
    }
  })
  await page.goto('http://127.0.0.1:4173/ChessProfessor/')
})

test('resignation exploration cancels automatic analysis, preserves original archive and can return', async ({ page }) => {
  const original = new Chess()
  original.loadPgn(readFileSync('Partite/Confermate/personal-04/partita.pgn', 'utf8'))
  expect(original.isGameOver()).toBe(false)
  const originalPgn = original.pgn(), originalFen = original.fen(), count = original.history().length
  await importGame(page, originalPgn)
  await page.locator('.engine-workspace > summary').click()
  await page.getByRole('button', { name: 'Avvia analisi', exact: true }).click()
  await expect.poll(() => page.evaluate(() => window.explorationCommands.filter(c => c.startsWith('go ')).length)).toBe(1)
  const move = original.moves({ verbose: true })[0]
  original.move(move)
  await page.locator(`[data-square="${move.from}"]`).click()
  await page.locator(`[data-square="${move.to}"]`).click()
  await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', original.fen())
  await expect(page.locator('.exploration-notice')).toContainText('PGN, risultato e analisi originali restano invariati')
  await expect(page.getByRole('button', { name: 'Ripassa i miei errori', exact: true })).toBeDisabled()
  await expect.poll(() => page.evaluate(() => window.explorationCommands.includes('stop'))).toBe(true)
  await page.waitForTimeout(250)
  expect(await page.evaluate(() => window.explorationCommands.filter(c => c.startsWith('go ')).length)).toBe(1)
  await expect(page.locator('.move-classification-overlay')).toHaveCount(0)
  for (const selector of ['.tools-menu', '.tools-game']) await page.locator(`${selector} > summary`).click()
  const archive = page.locator('.game-archive')
  await archive.locator(':scope > summary').click()
  await archive.getByRole('button', { name: 'Salva partita e analisi', exact: true }).click()
  await expect(archive.locator('li')).toHaveCount(1)
  const saved = await page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('chessprofessor-games', 1)
    request.onsuccess = () => {
      const db = request.result, tx = db.transaction('games'), get = tx.objectStore('games').getAll()
      get.onsuccess = () => { resolve(get.result[0].pgn); db.close() }
      get.onerror = () => reject(get.error)
    }
  }))
  expect(saved).toBe(originalPgn)
  await page.getByRole('button', { name: 'Torna alla partita', exact: true }).click()
  await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', originalFen)
  await expect(page.locator('.move-button')).toHaveCount(count)
  await expect(page.locator('.exploration-notice')).toHaveCount(0)
  expect(await page.evaluate(() => window.explorationCommands.filter(c => c.startsWith('go ')).length)).toBe(1)
})

for (const [name, initialFen, lastMove, from, to] of [
  ['checkmate', '7k/5Q2/6K1/8/8/8/8/8 w - - 0 1', 'Qg7#', 'h8', 'g8'],
  ['stalemate', '7k/8/5QK1/8/8/8/8/8 w - - 0 1', 'Qf7', 'h8', 'g8'],
  ['insufficient material', '7k/8/8/8/8/8/r7/1K6 w - - 0 1', 'Kxa2', 'h8', 'g8'],
  ['fifty-move draw', '7k/8/8/8/8/8/R7/K7 w - - 99 51', 'Ra3', 'h8', 'g8'],
]) test(`cannot extend a game ended by ${name}`, async ({ page }) => {
  const game = new Chess(initialFen)
  expect(game.isGameOver()).toBe(false)
  game.move(lastMove)
  const fen = game.fen()
  expect(game.isGameOver()).toBe(true)
  expect({ checkmate: game.isCheckmate(), stalemate: game.isStalemate(),
    'insufficient material': game.isInsufficientMaterial(), 'fifty-move draw': game.isDrawByFiftyMoves() }[name]).toBe(true)
  await importGame(page, game.pgn())
  await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', fen)
  await page.locator(`[data-square="${from}"]`).click()
  await page.locator(`[data-square="${to}"]`).click()
  await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', fen)
  await expect(page.locator('.exploration-notice')).toHaveCount(0)
})

test('threefold repetition is preserved by navigation and blocks further moves', async ({ page }) => {
  const pgn = '1. Nf3 Nf6 2. Ng1 Ng8 3. Nf3 Nf6 4. Ng1 Ng8 *'
  const game = new Chess(); game.loadPgn(pgn)
  expect(game.isThreefoldRepetition()).toBe(true)
  await importGame(page, pgn)
  await page.getByRole('button', { name: 'Primo', exact: true }).click()
  await page.getByRole('button', { name: 'Ultimo', exact: true }).click()
  await page.locator('[data-square="e2"]').click()
  await page.locator('[data-square="e4"]').click()
  await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', game.fen())
})
