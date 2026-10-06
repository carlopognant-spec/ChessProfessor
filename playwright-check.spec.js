import { test, expect } from '@playwright/test'
import { Chess } from 'chess.js'

const appUrl = 'http://127.0.0.1:4173/ChessProfessor/'

async function assertLegalArrows(page) {
  const fen = await page.locator('.board-stage').getAttribute('data-fen')
  const moves = await page.locator('.engine-arrow-overlay line').evaluateAll(lines => {
    const square = (x, y) => String.fromCharCode(97 + Math.round((Number(x) - 6.25) / 12.5)) + (8 - Math.round((Number(y) - 6.25) / 12.5))
    return lines.map(line => square(line.getAttribute('x1'), line.getAttribute('y1')) + square(line.getAttribute('x2'), line.getAttribute('y2')))
  })
  const legal = new Chess(fen).moves({ verbose: true }).map(move => move.from + move.to)
  expect(moves.length).toBeGreaterThan(0)
  for (const move of moves) expect(legal).toContain(move)
}

test.beforeEach(async ({ page }) => {
  await page.route('https://explorer.lichess.ovh/**', route => route.fulfill({ json: { white: 0, draws: 0, black: 0, moves: [] } }))
})

test('real Stockfish 19 refreshes five legal arrows after PGN import and navigation', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => {
    const NativeWorker = window.Worker
    window.engineSearchCount = 0
    window.Worker = class extends NativeWorker {
      postMessage(command) {
        if (typeof command === 'string' && command.startsWith('go ')) window.engineSearchCount++
        super.postMessage(command)
      }
    }
  })
  const wasm = page.waitForResponse(response => response.url().includes('stockfish-19-lite-single.wasm') && response.status() === 200)
  await page.goto(appUrl)
  await wasm
  await expect(page.locator('.engine-eval-label')).toContainText('Valutazione:')
  await expect(page.locator('.engine-arrow-overlay line')).toHaveCount(5)
  await assertLegalArrows(page)
  await page.locator('[data-square="e2"]').click()
  await page.locator('[data-square="e4"]').click()
  await expect(page.locator('.engine-eval-label')).toContainText('Valutazione:')
  await assertLegalArrows(page)
  await page.getByPlaceholder('Incolla un PGN', { exact: false }).fill('1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 *')
  await page.getByRole('button', { name: 'Importa PGN', exact: true }).click()
  await expect(page.locator('.engine-eval-label')).toContainText('Valutazione:')
  await expect(page.locator('.engine-arrow-overlay line')).toHaveCount(5)
  await assertLegalArrows(page)
  await page.getByPlaceholder('Incolla un PGN', { exact: false }).blur()
  await page.keyboard.press('ArrowLeft')
  await expect(page.locator('.engine-eval-label')).toContainText('Valutazione:')
  await expect(page.locator('.engine-arrow-overlay line')).toHaveCount(5)
  await assertLegalArrows(page)
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('.engine-eval-label')).toContainText('Valutazione:')
  await assertLegalArrows(page)
  await page.getByRole('button', { name: 'Reset partita', exact: true }).click()
  await expect(page.locator('.engine-eval-label')).toContainText('Valutazione:')
  await expect(page.locator('.engine-arrow-overlay line')).toHaveCount(5)
  await assertLegalArrows(page)
  const beforeRapidImport = await page.evaluate(() => window.engineSearchCount)
  await page.getByPlaceholder('Incolla un PGN', { exact: false }).fill('1. d4 d5 2. c4 e6 3. Nc3 Nf6 *')
  await page.getByRole('button', { name: 'Importa PGN', exact: true }).click()
  await expect.poll(() => page.evaluate(() => window.engineSearchCount)).toBeGreaterThan(beforeRapidImport)
  await page.getByPlaceholder('Incolla un PGN', { exact: false }).fill('1. c4 *')
  await page.getByRole('button', { name: 'Importa PGN', exact: true }).click()
  await expect(page.locator('.engine-eval-label')).toContainText('Valutazione:')
  await expect(page.locator('.engine-arrow-overlay line')).toHaveCount(5)
  await assertLegalArrows(page)
  expect(errors).toEqual([])
})

test('clears previous arrows while a newly imported position is waiting for analysis', async ({ page }) => {
  await page.addInitScript(() => {
    window.Worker = class {
      postMessage(command) {
        if (command === 'uci') queueMicrotask(() => this.onmessage?.({ data: 'uciok' }))
        if (command === 'isready') queueMicrotask(() => this.onmessage?.({ data: 'readyok' }))
        if (command.startsWith('position fen ')) this.fen = command.slice(13)
        if (command.startsWith('go depth')) {
          const black = this.fen.split(' ')[1] === 'b'
          setTimeout(() => {
            this.onmessage?.({ data: `info depth 12 multipv 1 score cp 20 pv ${black ? 'e7e5' : 'e2e4'}` })
            this.onmessage?.({ data: `bestmove ${black ? 'e7e5' : 'e2e4'}` })
          }, 1200)
        }
      }
      terminate() {}
    }
  })
  await page.goto(appUrl)
  await expect(page.locator('.engine-arrow-overlay line')).toHaveCount(1)
  await page.getByPlaceholder('Incolla un PGN', { exact: false }).fill('1. e4 *')
  await page.getByRole('button', { name: 'Importa PGN', exact: true }).click()
  await expect(page.locator('.engine-arrow-overlay line')).toHaveCount(0, { timeout: 500 })
  await expect(page.locator('.engine-eval-label')).toContainText('Valutazione:')
  await assertLegalArrows(page)
})

test('rapid imports and reset stop the old search before another go command', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => {
    window.engineCommands = []
    window.Worker = class {
      postMessage(command) {
        window.engineCommands.push(command)
        if (command === 'uci') queueMicrotask(() => this.onmessage?.({ data: 'uciok' }))
        if (command === 'isready') queueMicrotask(() => this.onmessage?.({ data: 'readyok' }))
        if (command.startsWith('position fen ')) {
          if (this.active) throw new Error('position changed during a search')
          this.fen = command.slice(13)
        }
        if (command.startsWith('go depth')) {
          if (this.active) throw new Error('overlapping go commands')
          const move = this.fen.split(' ')[1] === 'b' ? 'g8f6' : 'b1c3'
          this.active = { move, timer: setTimeout(() => this.finish(), 800) }
        }
        if (command === 'stop' && this.active) {
          clearTimeout(this.active.timer)
          // Send one more old score before the stop acknowledgement.
          this.onmessage?.({ data: 'info depth 11 score cp 999 pv a2a4' })
          this.active.timer = setTimeout(() => this.finish(), 150)
        }
      }
      finish() {
        const move = this.active.move
        this.active = null
        this.onmessage?.({ data: `info depth 12 score cp 20 pv ${move}` })
        this.onmessage?.({ data: `bestmove ${move}` })
      }
      terminate() { if (this.active) clearTimeout(this.active.timer) }
    }
  })
  await page.goto(appUrl)
  await expect(page.locator('.engine-eval-label')).toContainText('Valutazione:')
  const importPgn = async pgn => {
    await page.getByPlaceholder('Incolla un PGN', { exact: false }).fill(pgn)
    await page.getByRole('button', { name: 'Importa PGN', exact: true }).click()
  }
  const searchCount = () => page.evaluate(() => window.engineCommands.filter(command => command.startsWith('go ')).length)
  const initialCount = await searchCount()
  await importPgn('1. e4 e5 2. Nf3 Nc6 *')
  await expect.poll(searchCount).toBeGreaterThan(initialCount)
  await importPgn('1. d4 *')
  await expect(page.locator('.engine-eval-label')).toContainText('Valutazione:')
  expect(await page.locator('.board-stage').getAttribute('data-fen')).toBe(new Chess('rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq - 0 1').fen())
  await assertLegalArrows(page)
  const beforeReset = await searchCount()
  await importPgn('1. e4 e5 *')
  await expect.poll(searchCount).toBeGreaterThan(beforeReset)
  await page.getByRole('button', { name: 'Reset partita', exact: true }).click()
  await expect(page.locator('.engine-eval-label')).toContainText('Valutazione:')
  await assertLegalArrows(page)
  expect(await page.evaluate(() => window.engineCommands.filter(command => command === 'stop').length)).toBeGreaterThanOrEqual(2)
  expect(errors).toEqual([])
})

test('real mating game shows mate given instead of a missing evaluation', async ({ page }) => {
  await page.goto(appUrl)
  await page.getByPlaceholder('Incolla un PGN', { exact: false }).fill('1. f3 e5 2. g4 Qh4# 0-1')
  await page.getByRole('button', { name: 'Importa PGN', exact: true }).click()
  const finalMove = page.locator('.analysis-row-button').filter({ hasText: 'Qh4#' })
  await expect(finalMove).toContainText('Migliore')
  await expect(finalMove).toContainText('Matto dato')
  await expect(finalMove).not.toContainText('Eval n/d')
  await expect(page.locator('.engine-eval-label')).toContainText('Scacco matto')
})

test('missed opportunity renders the verified alternative and previous opponent move', async ({ page }) => {
  const game = new Chess()
  for (const san of ['e4', 'e5', 'a3', 'a6', 'f3']) game.move(san)
  const afterF3 = game.fen()
  await page.addInitScript(({ afterF3 }) => {
    window.Worker = class {
      postMessage(command) {
        if (command === 'uci') queueMicrotask(() => this.onmessage?.({ data: 'uciok' }))
        if (command === 'isready') queueMicrotask(() => this.onmessage?.({ data: 'readyok' }))
        if (command.startsWith('position fen ')) this.fen = command.slice(13)
        if (command.startsWith('go depth')) {
          const score = this.fen === afterF3 ? 600 : 0
          const pv = this.fen.split(' ')[1] === 'b' ? 'b8c6 d2d4' : 'b1c3 g8f6'
          queueMicrotask(() => {
            this.onmessage?.({ data: `info depth 12 multipv 1 score cp ${score} pv ${pv}` })
            this.onmessage?.({ data: `bestmove ${pv.split(' ')[0]}` })
          })
        }
      }
      terminate() {}
    }
  }, { afterF3 })
  await page.goto(appUrl)
  await page.getByPlaceholder('Incolla un PGN', { exact: false }).fill('1. e4 e5 2. a3 a6 3. f3 d6 *')
  await page.getByRole('button', { name: 'Importa PGN', exact: true }).click()
  const missedMove = page.locator('.analysis-row-button').filter({ hasText: '3... d6' })
  await expect(missedMove).toContainText('Mossa mancata')
  await expect(missedMove).toContainText("Dopo f3, l'occasione era Nc6 d4.")
})
