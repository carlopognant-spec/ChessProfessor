import { test, expect } from '@playwright/test'
import { Chess } from 'chess.js'
import { ENGINE_CONFIG } from './src/lib/engineConfig.js'
import { createAnalysisMetadata } from './src/lib/analysisMetadata.js'
import { readFileSync } from 'node:fs'
import { classifyAnalysisEntries, moveEvaluationFields } from './src/lib/classification.js'

const appUrl = 'http://127.0.0.1:4173/ChessProfessor/'

async function openTools(page, section) {
  const menu = page.locator('.tools-menu')
  if (!await menu.evaluate(element => element.open)) await menu.locator(':scope > summary').click()
  const panel = menu.locator('.tools-section').filter({ has: page.locator('summary').filter({ hasText: new RegExp(`^${section}$`) }) })
  if (!await panel.evaluate(element => element.open)) await panel.locator(':scope > summary').click()
}

for (const width of [360, 1280]) {
  test(`minimal home at ${width}px preserves chat, PGN and editor drafts without horizontal scrolling`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.addInitScript(() => { window.Worker = class { constructor() { throw new Error('Unexpected engine download') } } })
    await page.goto(appUrl)
    const menu = page.locator('.tools-menu')
    const editor = page.locator('.tools-editor')
    const board = page.locator('.board-stage')
    await expect(menu).not.toHaveAttribute('open', '')
    await expect(page.locator('.position-editor')).not.toBeVisible()
    await expect(page.locator('.pgn-import')).not.toBeVisible()
    await expect(page.locator('.chat-panel')).not.toBeVisible()
    await expect(page.locator('.tools-openings > div')).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Reset partita' })).not.toBeVisible()
    const assertFits = async () => {
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      const box = await board.boundingBox()
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(width)
    }
    await assertFits()
    await openTools(page, 'Partita e analisi')
    const pgnInput = page.getByPlaceholder('Incolla un PGN', { exact: false })
    await pgnInput.fill('1. e4 e5 *')
    await page.getByRole('button', { name: 'Importa PGN', exact: true }).click()
    const game = new Chess(); game.move('e4'); game.move('e5')
    await expect(board).toHaveAttribute('data-fen', game.fen())
    await openTools(page, 'Chatbot')
    const chatInput = page.getByPlaceholder('Scrivi una domanda', { exact: false })
    await chatInput.fill('Qual è il piano?')
    await page.getByRole('button', { name: 'Invia', exact: true }).click()
    await expect(page.locator('.chat-message.user')).toHaveText('Qual è il piano?')
    await chatInput.fill('Bozza conservata')
    await openTools(page, 'Aperture')
    await openTools(page, 'Editor scacchiera')
    await page.getByTitle('Seleziona Q', { exact: true }).click()
    await page.locator('[data-square="a3"]').click()
    const draft = await page.getByRole('textbox', { name: 'FEN', exact: true }).inputValue()
    expect(draft).not.toBe(game.fen())
    await assertFits()
    await editor.locator(':scope > summary').click()
    await expect(board).toHaveAttribute('data-fen', game.fen())
    await openTools(page, 'Editor scacchiera')
    await expect(page.getByRole('textbox', { name: 'FEN', exact: true })).toHaveValue(draft)
    await menu.locator(':scope > summary').click()
    await expect(board).toHaveAttribute('data-fen', game.fen())
    // A hidden editor must never intercept normal play, even with a piece selected.
    await page.locator('[data-square="g1"]').click()
    await page.locator('[data-square="f3"]').click()
    game.move('Nf3')
    await expect(board).toHaveAttribute('data-fen', game.fen())
    await openTools(page, 'Chatbot')
    await expect(chatInput).toHaveValue('Bozza conservata')
    await expect(page.locator('.chat-message.user')).toHaveText('Qual è il piano?')
    await expect(pgnInput).toHaveValue('1. e4 e5 *')
    await openTools(page, 'Editor scacchiera')
    // The real move synchronizes the editor draft with the new game position.
    await expect(page.getByRole('textbox', { name: 'FEN', exact: true })).toHaveValue(game.fen())
    for (const button of await page.locator('.move-navigation button').all()) {
      const box = await button.boundingBox()
      expect(box.height).toBeGreaterThanOrEqual(44)
      expect(box.width).toBeGreaterThanOrEqual(44)
    }
    for (const summary of await page.locator('.tools-menu summary').all()) {
      const box = await summary.boundingBox()
      if (box) expect(box.height).toBeGreaterThanOrEqual(44)
    }
    await assertFits()
    expect(errors).toEqual([])
  })
}

test('local archive preserves the full PGN across navigation and reload, imports, exports, renames and deletes', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => { window.Worker = class { constructor() { throw new Error('Unexpected engine download') } } })
  await page.goto(appUrl)
  await openTools(page, 'Partita e analisi')
  const pgn = '[White "Carlo"]\n[Black "Amico"]\n[Date "2026.10.07"]\n[Result "*"]\n\n1. e4 {Commento} e5 2. Nf3 Nc6 *'
  await page.getByPlaceholder('Incolla un PGN', { exact: false }).fill(pgn)
  await page.getByRole('button', { name: 'Importa PGN', exact: true }).click()
  await page.getByRole('button', { name: 'Primo', exact: true }).click()
  await page.locator('.game-archive summary').click()
  const archive = page.locator('.game-archive')
  await archive.getByRole('button', { name: 'Salva partita e analisi' }).click()
  await expect(archive.locator('li')).toHaveCount(1)
  await archive.getByRole('button', { name: 'Salva partita e analisi' }).click()
  await expect(archive.getByRole('status')).toContainText('senza duplicati')
  await expect(archive.locator('li')).toHaveCount(1)
  page.once('dialog', dialog => dialog.accept('Test archivio'))
  await archive.getByRole('button', { name: 'Rinomina', exact: true }).click()
  await expect(archive.locator('li strong')).toHaveText('Test archivio')
  const downloadPromise = page.waitForEvent('download')
  await archive.getByRole('button', { name: 'Esporta PGN' }).click()
  const download = await downloadPromise
  const stream = await download.createReadStream()
  const chunks = []
  for await (const chunk of stream) chunks.push(chunk)
  const exported = Buffer.concat(chunks).toString('utf8')
  const exportedGame = new Chess(); exportedGame.loadPgn(exported)
  expect(exportedGame.history()).toEqual(['e4', 'e5', 'Nf3', 'Nc6'])
  expect(exported).toContain('{Commento}')
  expect(exportedGame.getHeaders().White).toBe('Carlo')
  await page.reload()
  await openTools(page, 'Partita e analisi')
  await page.locator('.game-archive summary').click()
  await expect(archive.locator('li strong')).toHaveText('Test archivio')
  await archive.getByRole('button', { name: 'Apri', exact: true }).click()
  await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', exportedGame.fen())
  page.once('dialog', dialog => dialog.dismiss())
  await archive.getByRole('button', { name: 'Elimina', exact: true }).click()
  await expect(archive.locator('li')).toHaveCount(1)
  page.once('dialog', dialog => dialog.accept())
  await archive.getByRole('button', { name: 'Elimina', exact: true }).click()
  await expect(archive.locator('li')).toHaveCount(0)
  await archive.locator('input[type=file]').setInputFiles({ name: 'partita.pgn', mimeType: 'application/x-chess-pgn', buffer: Buffer.from(pgn) })
  await expect(archive.locator('li')).toHaveCount(1)
  await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', exportedGame.fen())
  const custom = new Chess(exportedGame.fen()); custom.move('Bb5')
  await archive.locator('input[type=file]').setInputFiles({ name: 'fen.pgn', mimeType: 'application/x-chess-pgn', buffer: Buffer.from(custom.pgn()) })
  await expect(archive.locator('li')).toHaveCount(2)
  await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', custom.fen())
  await page.getByRole('button', { name: 'Primo', exact: true }).click()
  await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', exportedGame.fen())
  expect(errors).toEqual([])
})

test('saved analysis opens offline without a worker and obsolete analysis is preserved but hidden', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 844 })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => {
    window.workerCount = 0
    window.Worker = class {
      constructor() { window.workerCount++ }
      postMessage(command) {
        if (command === 'uci') queueMicrotask(() => this.onmessage?.({ data: 'uciok' }))
        if (command === 'isready') queueMicrotask(() => this.onmessage?.({ data: 'readyok' }))
        if (command.startsWith('position fen ')) this.fen = command.slice(13)
        if (command.startsWith('go ')) queueMicrotask(() => {
          const move = this.fen.split(' ')[1] === 'b' ? 'b8c6' : 'g1f3'
          this.onmessage?.({ data: `info depth 12 multipv 1 score cp 25 pv ${move}` })
          this.onmessage?.({ data: `bestmove ${move}` })
        })
      }
      terminate() {}
    }
  })
  await page.goto(appUrl)
  await openTools(page, 'Partita e analisi')
  await page.getByPlaceholder('Incolla un PGN', { exact: false }).fill('1. e4 e5 *')
  await page.getByRole('button', { name: 'Importa PGN', exact: true }).click()
  await page.getByRole('button', { name: 'Avvia analisi', exact: true }).click()
  await expect(page.locator('.analysis-row-button')).toHaveCount(2)
  await expect(page.locator('.engine-eval-label')).toContainText('Valutazione:')
  const precision = page.locator('.accuracy-summary')
  await expect(precision).toContainText('Precisione 0–100')
  await expect(precision).toContainText('Bianco:')
  await expect(precision).toContainText('Nero:')
  await expect(precision).not.toContainText('Non disponibile')
  const savedPrecision = await precision.textContent()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.locator('.game-archive summary').click()
  const archive = page.locator('.game-archive')
  await archive.getByRole('button', { name: 'Salva partita e analisi' }).click()
  await expect(archive.locator('li')).toContainText('Analisi salvata: 2 mosse.')
  await page.reload()
  await openTools(page, 'Partita e analisi')
  expect(await page.evaluate(() => window.workerCount)).toBe(0)
  await page.locator('.game-archive summary').click()
  await page.context().setOffline(true)
  await archive.getByRole('button', { name: 'Apri', exact: true }).click()
  await expect(page.locator('.analysis-row-button')).toHaveCount(2)
  await expect(page.locator('.engine-eval-label')).toContainText('Analisi salvata.')
  await expect(precision).toHaveText(savedPrecision)
  await expect(page.locator('.engine-eval-label')).toContainText('Valutazione:')
  await assertLegalArrows(page)
  await page.getByRole('button', { name: 'Primo', exact: true }).click()
  await assertLegalArrows(page)
  await expect(page.locator('.analysis-row-button')).toHaveCount(2)
  await page.getByRole('button', { name: 'Ultimo', exact: true }).click()
  await assertLegalArrows(page)
  expect(await page.evaluate(() => window.workerCount)).toBe(0)
  await page.context().setOffline(false)
  await page.evaluate(async () => {
    const db = await new Promise(resolve => { const request = indexedDB.open('chessprofessor-games', 1); request.onsuccess = () => resolve(request.result) })
    await new Promise((resolve, reject) => {
      const tx = db.transaction('games', 'readwrite')
      tx.oncomplete = resolve; tx.onabort = reject
      const store = tx.objectStore('games'), request = store.getAll()
      request.onsuccess = () => { const record = request.result[0]; record.analysisMetadata.budget.value = 800000; store.put(record) }
    })
    db.close()
  })
  await page.reload()
  await openTools(page, 'Partita e analisi')
  await page.locator('.game-archive summary').click()
  await expect(archive.locator('li')).toContainText('Analisi obsoleta')
  await archive.getByRole('button', { name: 'Apri', exact: true }).click()
  await expect(page.locator('.analysis-row-button')).toHaveCount(0)
  await expect(archive.getByRole('status')).toContainText('obsoleta conservata')
  expect(await page.evaluate(() => window.workerCount)).toBe(0)
  expect(errors).toEqual([])
})

test('unavailable IndexedDB leaves the game playable and shows an archive error', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'indexedDB', { get() { throw new DOMException('Denied', 'SecurityError') } }))
  await page.goto(appUrl)
  await openTools(page, 'Partita e analisi')
  await page.locator('.game-archive summary').click()
  await expect(page.locator('.game-archive [role=status]')).toContainText('Archivio locale non disponibile')
  await page.locator('[data-square="e2"]').click()
  await page.locator('[data-square="e4"]').click()
  const game = new Chess(); game.move('e4')
  await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', game.fen())
})

test('mobile navigation uses only buttons in imported and freely played games', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => {
    window.Worker = class {
      postMessage(command) {
        if (command === 'uci') queueMicrotask(() => this.onmessage?.({ data: 'uciok' }))
        if (command === 'isready') queueMicrotask(() => this.onmessage?.({ data: 'readyok' }))
        if (command.startsWith('go ')) queueMicrotask(() => this.onmessage?.({ data: 'bestmove (none)' }))
      }
      terminate() {}
    }
  })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(appUrl)
  await openTools(page, 'Partita e analisi')
  const navigation = page.getByRole('navigation', { name: 'Navigazione mosse' })
  const button = name => navigation.getByRole('button', { name, exact: true })
  const board = page.locator('.board-stage')
  const game = new Chess()
  await expect(button('Primo')).toBeDisabled()
  await expect(button('Ultimo')).toBeDisabled()
  await page.getByPlaceholder('Incolla un PGN', { exact: false }).fill('1. e4 e5 2. Nf3 Nc6 *')
  await page.getByRole('button', { name: 'Importa PGN', exact: true }).click()
  for (const move of ['e4', 'e5', 'Nf3', 'Nc6']) game.move(move)
  await expect(board).toHaveAttribute('data-fen', game.fen())
  await expect(button('Avanti')).toBeDisabled()
  for (const label of ['Primo', 'Indietro', 'Avanti', 'Ultimo']) {
    const box = await button(label).boundingBox()
    expect(box.width).toBeGreaterThanOrEqual(44)
    expect(box.height).toBeGreaterThanOrEqual(44)
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(390)
  }
  await button('Indietro').click()
  game.undo()
  await expect(board).toHaveAttribute('data-fen', game.fen())
  await button('Primo').click()
  await expect(board).toHaveAttribute('data-fen', new Chess().fen())
  await expect(button('Indietro')).toBeDisabled()
  await button('Avanti').click()
  const first = new Chess(); first.move('e4')
  await expect(board).toHaveAttribute('data-fen', first.fen())
  await button('Ultimo').click()
  game.move('Nc6')
  await expect(board).toHaveAttribute('data-fen', game.fen())

  // A legal move after going back replaces the old future.
  await button('Indietro').click()
  await page.locator('[data-square="d7"]').click()
  await page.locator('[data-square="d6"]').click()
  game.undo(); game.move('d6')
  await expect(board).toHaveAttribute('data-fen', game.fen())
  await button('Primo').click()
  await button('Ultimo').click()
  await expect(board).toHaveAttribute('data-fen', game.fen())

  await page.getByRole('button', { name: 'Reset partita', exact: true }).click()
  await page.locator('[data-square="d2"]').click()
  await page.locator('[data-square="d4"]').click()
  const free = new Chess(); free.move('d4')
  await expect(board).toHaveAttribute('data-fen', free.fen())
  await button('Primo').click()
  await expect(board).toHaveAttribute('data-fen', new Chess().fen())
  await button('Ultimo').click()
  await expect(board).toHaveAttribute('data-fen', free.fen())
  // The free board can start from an edited FEN, not only the initial setup.
  await openTools(page, 'Editor scacchiera')
  await page.getByRole('textbox', { name: 'FEN', exact: true }).fill(free.fen())
  await page.getByRole('button', { name: 'Applica posizione', exact: true }).click()
  await page.locator('[data-square="d7"]').click()
  await page.locator('[data-square="d5"]').click()
  const custom = new Chess(free.fen()); custom.move('d5')
  await expect(board).toHaveAttribute('data-fen', custom.fen())
  await button('Primo').click()
  await expect(board).toHaveAttribute('data-fen', free.fen())
  await button('Ultimo').click()
  await expect(board).toHaveAttribute('data-fen', custom.fen())
  expect(errors).toEqual([])
})

test('navigation preserves chat undo snapshots and restores the original continuation', async ({ page }) => {
  // Replace only the chat UI in this browser test; exercise the real GameProvider
  // and UndoButton without credentials or calls to an LLM service.
  await page.route('**/src/components/ChatPanel.jsx*', async route => {
    const response = await route.fetch()
    const source = await response.text()
    const reactUrl = source.match(/from "([^"]+\/react\.js[^\"]*)"/)?.[1]
    const contextUrl = source.match(/from "([^"]+\/GameContext\.jsx[^\"]*)"/)?.[1]
    if (!reactUrl || !contextUrl) throw new Error('Chat test harness import paths absent')
    await route.fulfill({ contentType: 'application/javascript', body: `
      import React from ${JSON.stringify(reactUrl)};
      const { createElement } = React;
      import { useGame } from ${JSON.stringify(contextUrl)};
      export default function ChatHarness() {
        const game = useGame();
        return createElement('div', null,
          createElement('button', { onClick: () => game.applyMoveFromChat('Bc4') }, 'Chat Bc4'),
          createElement('button', { onClick: () => game.applyMoveFromChat('Bc5') }, 'Chat Bc5'));
      }
    ` })
  })
  await page.addInitScript(() => {
    window.Worker = class {
      postMessage(command) {
        if (command === 'uci') queueMicrotask(() => this.onmessage?.({ data: 'uciok' }))
        if (command === 'isready') queueMicrotask(() => this.onmessage?.({ data: 'readyok' }))
        if (command.startsWith('go ')) queueMicrotask(() => this.onmessage?.({ data: 'bestmove (none)' }))
      }
      terminate() {}
    }
  })
  await page.goto(appUrl)
  await openTools(page, 'Partita e analisi')
  await page.getByPlaceholder('Incolla un PGN', { exact: false }).fill('1. e4 e5 2. Nf3 Nc6 *')
  await page.getByRole('button', { name: 'Importa PGN', exact: true }).click()
  const nav = page.getByRole('navigation', { name: 'Navigazione mosse' })
  const board = page.locator('.board-stage')
  const undo = page.getByRole('button', { name: 'Torna indietro', exact: false })
  await openTools(page, 'Chatbot')
  await nav.getByRole('button', { name: 'Indietro', exact: true }).click()
  await nav.getByRole('button', { name: 'Indietro', exact: true }).click()
  await page.getByRole('button', { name: 'Chat Bc4', exact: true }).click()
  await page.getByRole('button', { name: 'Chat Bc5', exact: true }).click()
  await nav.getByRole('button', { name: 'Primo', exact: true }).click()
  await expect(undo).toBeEnabled()
  await undo.click()
  const chat = new Chess(); for (const san of ['e4', 'e5', 'Bc4']) chat.move(san)
  await expect(board).toHaveAttribute('data-fen', chat.fen())
  await undo.click()
  chat.undo()
  await expect(board).toHaveAttribute('data-fen', chat.fen())
  await expect(undo).toBeDisabled()
  await nav.getByRole('button', { name: 'Ultimo', exact: true }).click()
  const original = new Chess(); for (const san of ['e4', 'e5', 'Nf3', 'Nc6']) original.move(san)
  await expect(board).toHaveAttribute('data-fen', original.fen())
  // Undo has restored actual chess.js history, not just the FEN.
  await nav.getByRole('button', { name: 'Indietro', exact: true }).click()
  await nav.getByRole('button', { name: 'Indietro', exact: true }).click()
  await page.getByRole('button', { name: 'Chat Bc4', exact: true }).click()
  await page.locator('[data-square="g8"]').click()
  await page.locator('[data-square="f6"]').click()
  const manual = new Chess(); for (const san of ['e4', 'e5', 'Bc4', 'Nf6']) manual.move(san)
  await expect(board).toHaveAttribute('data-fen', manual.fen())
  await expect(undo).toBeDisabled()
  await nav.getByRole('button', { name: 'Primo', exact: true }).click()
  await nav.getByRole('button', { name: 'Ultimo', exact: true }).click()
  await expect(board).toHaveAttribute('data-fen', manual.fen())
})

for (const failure of ['worker error', 'unacknowledged stop']) {
  test(`lazy start and explicit engine restart preserve the game after ${failure} under StrictMode`, async ({ page }) => {
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.addInitScript(() => {
      window.testWorkers = []
      window.holdEngineSearch = false
      window.unhandledEngineRejections = []
      window.addEventListener('unhandledrejection', event => {
        window.unhandledEngineRejections.push(String(event.reason))
      })
      window.Worker = class {
        constructor() {
          this.messages = []
          this.terminated = false
          window.testWorkers.push(this)
        }
        postMessage(command) {
          this.messages.push(command)
          if (command === 'uci') queueMicrotask(() => this.onmessage?.({ data: 'uciok' }))
          if (command === 'isready') queueMicrotask(() => this.onmessage?.({ data: 'readyok' }))
          if (command.startsWith('position fen ')) this.fen = command.slice(13)
          if (command.startsWith('go nodes') && !window.holdEngineSearch) {
            const move = this.fen.split(' ')[1] === 'b' ? 'b8c6' : 'b1c3'
            queueMicrotask(() => {
              this.onmessage?.({ data: `info depth 12 multipv 1 score cp 20 pv ${move}` })
              this.onmessage?.({ data: `bestmove ${move}` })
            })
          }
          // Deliberately do not acknowledge stop while held.
        }
        terminate() { this.terminated = true }
      }
    })
    await page.goto(appUrl)
    await openTools(page, 'Partita e analisi')
    expect(await page.evaluate(() => window.testWorkers.length)).toBe(0)
    await page.getByRole('button', { name: 'Avvia analisi', exact: true }).click()
    await expect(page.locator('.engine-eval-label')).toContainText('Valutazione:')
    expect(await page.evaluate(() => window.testWorkers.length)).toBe(1)
    expect(await page.evaluate(() => window.testWorkers[0].terminated)).toBe(false)
    await expect(page.getByRole('button', { name: 'Riavvia motore', exact: true })).toHaveCount(0)

    await page.evaluate(() => { window.holdEngineSearch = true })
    const importPgn = async pgn => {
      await page.getByPlaceholder('Incolla un PGN', { exact: false }).fill(pgn)
      await page.getByRole('button', { name: 'Importa PGN', exact: true }).click()
    }
    const priorSearches = await page.evaluate(() => window.testWorkers[0].messages.filter(message => message.startsWith('go ')).length)
    await importPgn('1. e4 e5 *')
    await expect.poll(() => page.evaluate(() => window.testWorkers[0].messages.filter(message => message.startsWith('go ')).length)).toBeGreaterThan(priorSearches)
    // A replacement game queues work behind the active search.
    await importPgn('1. e4 e5 2. d4 d5 *')
    await expect.poll(() => page.evaluate(() => window.testWorkers[0].messages.includes('stop'))).toBe(true)
    if (failure === 'worker error') {
      await page.evaluate(() => window.testWorkers[0].onerror(new Error('synthetic worker failure')))
    }
    const restart = page.getByRole('button', { name: 'Riavvia motore', exact: true })
    await expect(restart).toBeVisible()
    await expect(page.locator('.engine-eval-label')).toContainText('Il motore è fermo')
    await expect(page.locator('.engine-eval-label')).toContainText(failure === 'worker error' ? 'worker' : 'ricerca interrotta')
    const game = new Chess()
    for (const move of ['e4', 'e5', 'd4', 'd5']) game.move(move)
    await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', game.fen())
    await expect(page.locator('.engine-arrow-overlay .engine-arrow')).toHaveCount(0)
    expect(await page.evaluate(() => window.testWorkers.length)).toBe(1)

    // Navigation must not clear the failure or silently reuse the dead engine.
    await page.getByPlaceholder('Incolla un PGN', { exact: false }).blur()
    await page.keyboard.press('ArrowLeft')
    await expect(restart).toBeVisible()
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', game.fen())

    await page.evaluate(() => { window.holdEngineSearch = false })
    await restart.click()
    await expect(page.locator('.engine-eval-label')).toContainText('Valutazione:')
    await expect(restart).toHaveCount(0)
    await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', game.fen())
    await expect(page.locator('.analysis-row-button')).toHaveCount(4)
    await assertLegalArrows(page)
    expect(await page.evaluate(() => window.testWorkers.length)).toBe(2)
    expect(await page.evaluate(() => window.testWorkers[0].terminated)).toBe(true)
    expect(await page.evaluate(() => window.testWorkers[1].messages.filter(message => message.startsWith('go ')))).toContain('go nodes 200000')
    expect(await page.evaluate(() => window.testWorkers[1].messages.filter(message => message.startsWith('setoption ')))).toContain('setoption name MultiPV value 5')
    expect(await page.evaluate(() => window.unhandledEngineRejections)).toEqual([])
    expect(errors).toEqual([])
  })
}

async function assertLegalArrows(page) {
  // Read position and arrows in one browser task: navigation can render between awaits.
  const { fen, engineFen, evalFen, moves } = await page.locator('.board-stage').evaluate(board => {
    return { fen: board.dataset.fen, engineFen: board.querySelector('.engine-arrow-overlay')?.dataset.fen, evalFen: board.parentElement.querySelector('.engine-eval-label')?.dataset.fen, moves: [...board.querySelectorAll('.engine-arrow-overlay .engine-arrow')].map(arrow => arrow.dataset.from + arrow.dataset.to) }
  })
  const legal = new Chess(engineFen ?? fen).moves({ verbose: true }).map(move => move.from + move.to)
  expect(moves.length).toBeLessThanOrEqual(1)
  for (const move of moves) expect(legal, JSON.stringify({ fen, engineFen, evalFen, moves })).toContain(move)
}

test.beforeEach(async ({ page }) => {
  await page.route('https://explorer.lichess.ovh/**', route => route.fulfill({ json: { white: 0, draws: 0, black: 0, moves: [] } }))
})

test('partial MultiPV duplicate roots never leave old arrows after a position change', async ({ page }) => {
  const keyWarnings = []
  page.on('console', message => { if (/same key|Encountered two children/.test(message.text())) keyWarnings.push(message.text()) })
  await page.addInitScript(() => {
    window.Worker = class {
      postMessage(command) {
        if (command === 'uci') queueMicrotask(() => this.onmessage?.({ data: 'uciok' }))
        if (command === 'isready') queueMicrotask(() => this.onmessage?.({ data: 'readyok' }))
        if (command.startsWith('position fen ')) this.fen = command.slice(13)
        if (command.startsWith('go nodes')) {
          const moves = this.fen.split(' ')[1] === 'b' ? ['g8f6', 'g8f6', 'e7e5', 'd7d5', 'b8c6'] : ['g1f3', 'g1f3', 'e2e4', 'd2d4', 'b1c3']
          queueMicrotask(() => {
            for (const [i, move] of moves.entries()) this.onmessage?.({ data: `info depth ${i === 0 ? 13 : 12} multipv ${i + 1} score cp ${20 - i} pv ${move}` })
            this.onmessage?.({ data: `bestmove ${moves[0]}` })
          })
        }
      }
      terminate() {}
    }
  })
  await page.goto(appUrl)
  await openTools(page, 'Partita e analisi')
  await page.getByRole('button', { name: 'Avvia analisi', exact: true }).click()
  const initial = new Chess().fen(), game = new Chess()
  game.move('e4')
  await expect(page.locator('.engine-eval-label')).toHaveAttribute('data-fen', initial)
  await expect(page.locator('.engine-arrow-overlay .engine-arrow')).toHaveCount(1)
  await expect(page.locator('.engine-arrow-overlay')).toBeVisible()
  const arrowPaint = await page.locator('.engine-arrow-overlay .engine-arrow').evaluateAll(lines => lines.map(line => {
    const style = getComputedStyle(line)
    return {
      opacity: parseFloat(style.fillOpacity),
      fill: style.fill,
    }
  }))
  expect(arrowPaint.every(arrow => arrow.opacity > 0 && arrow.fill !== 'none')).toBe(true)
  await assertLegalArrows(page)
  await page.locator('[data-square="e2"]').click()
  await page.locator('[data-square="e4"]').click()
  for (const target of [game.fen(), initial, game.fen(), initial]) {
    await expect(page.locator('.engine-eval-label')).toHaveAttribute('data-fen', target)
    await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', target)
    await expect(page.locator('.engine-arrow-overlay .engine-arrow')).toHaveCount(0)
    await assertLegalArrows(page)
    await page.keyboard.press(target === initial ? 'ArrowRight' : 'ArrowLeft')
  }
  expect(keyWarnings).toEqual([])
})

test('completed analysis navigation stays fast without new engine searches', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const heldExplorerRequests = []
  await page.route('https://explorer.lichess.ovh/**', route => { heldExplorerRequests.push(route) })
  await page.addInitScript(() => {
    window.engineSearchCount = 0
    window.Worker = class {
      postMessage(command) {
        if (command === 'uci') queueMicrotask(() => this.onmessage?.({ data: 'uciok' }))
        if (command === 'isready') queueMicrotask(() => this.onmessage?.({ data: 'readyok' }))
        if (command.startsWith('position fen ')) this.fen = command.slice(13)
        if (command.startsWith('go nodes')) {
          window.engineSearchCount++
          const moves = this.fen.split(' ')[1] === 'b'
            ? ['e7e5', 'd7d5', 'b8c6', 'h7h6', 'a7a6']
            : ['e2e4', 'd2d4', 'b1c3', 'h2h3', 'a2a3']
          setTimeout(() => {
            for (const [i, move] of moves.entries()) this.onmessage?.({ data: `info depth 12 multipv ${i + 1} score cp ${20 - i} pv ${move}` })
            this.onmessage?.({ data: `bestmove ${moves[0]}` })
          }, 5)
        }
      }
      terminate() {}
    }
  })
  const game = new Chess()
  const positions = [game.fen()]
  for (let i = 0; i < 168; i++) {
    game.move(['Nf3', 'Nf6', 'Ng1', 'Ng8'][i % 4])
    positions.push(game.fen())
  }
  await page.goto(appUrl)
  await openTools(page, 'Partita e analisi')
  await page.getByPlaceholder('Incolla un PGN', { exact: false }).fill(game.pgn())
  await page.getByRole('button', { name: 'Importa PGN', exact: true }).click()
  await page.getByRole('button', { name: 'Avvia analisi', exact: true }).click()
  await expect(page.locator('.analysis-row-button').first()).toBeVisible()
  expect(await page.locator('.analysis-row-button').count()).toBeLessThan(168)
  await expect(page.locator('.engine-arrow-overlay .engine-arrow')).toHaveCount(0)
  await expect(page.locator('.move-classification-overlay')).toHaveCount(0)
  await page.getByRole('button', { name: 'Primo', exact: true }).click()
  await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', positions[0])
  await expect(page.locator('.engine-eval-label')).toHaveAttribute('data-fen', positions[0])
  await expect(page.locator('.engine-eval-label')).toContainText('Valutazione:')
  await expect(page.locator('.analysis-row-button')).toHaveCount(168)
  await page.getByRole('button', { name: 'Ultimo', exact: true }).click()
  const searches = await page.evaluate(() => window.engineSearchCount)
  expect(searches).toBe(169)
  const summaryBefore = await page.locator('.summary-table').innerText()
  const navigationTimings = []
  for (const [button, ply] of [['Indietro', 167], ['Primo', 0], ['Avanti', 1], ['Ultimo', 168]]) {
    const started = Date.now()
    await page.getByRole('button', { name: button, exact: true }).click()
    await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', positions[ply])
    await expect(page.locator('.engine-eval-label')).toHaveAttribute('data-fen', positions[ply])
    await expect(page.locator('.engine-arrow-overlay .engine-arrow')).toHaveCount(ply <= 1 ? 0 : 1)
    if (ply > 1) await expect(page.locator('.engine-arrow-overlay')).toHaveAttribute('data-fen', positions[ply - 1])
    await expect(page.locator('.move-classification-overlay')).toHaveCount(ply === 0 ? 0 : 1)
    if (ply > 0) {
      const move = new Chess(positions[ply - 1]).move(['Nf3', 'Nf6', 'Ng1', 'Ng8'][(ply - 1) % 4])
      await expect(page.locator('.move-classification-overlay')).toHaveAttribute('data-move-square', move.to)
      if (ply === 1) await expect(page.locator('.move-classification-overlay')).toHaveAttribute('data-classification', 'book')
      if (ply === 1) await expect(page.locator('.move-classification-overlay [data-icon]')).toHaveAttribute('data-icon', 'book')
    }
    const elapsed = Date.now() - started
    navigationTimings.push({ button, elapsedMs: elapsed })
    expect(elapsed).toBeLessThan(1000)
    await expect(page.locator('.analysis-row-button')).toHaveCount(168)
    await assertLegalArrows(page)
  }
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowLeft')
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight')
  await expect(page.locator('.engine-eval-label')).toHaveAttribute('data-fen', positions[168])
  expect(await page.locator('.summary-table').innerText()).toBe(summaryBefore)
  expect(await page.evaluate(() => window.engineSearchCount)).toBe(searches)
  expect(errors).toEqual([])
  // Analysis and navigation finish even while every Explorer response is withheld.
  expect(heldExplorerRequests.length).toBeGreaterThan(0)
  expect(new Set(heldExplorerRequests.map(route => route.request().url())).size).toBe(heldExplorerRequests.length)
  await Promise.all(heldExplorerRequests.map(route => route.fulfill({ json: { white: 0, draws: 0, black: 0, moves: [] } })))
  console.log('Mocked navigation timings:', JSON.stringify(navigationTimings))
  await page.waitForTimeout(150) // Let the 120 ms piece animation finish for visual review.
  await page.locator('.board-stage').screenshot({ path: 'agent-output/cleanup-review-2026-10-08/move-review-desktop.png' })
  await page.setViewportSize({ width: 360, height: 844 })
  await page.locator('.board-stage').screenshot({ path: 'agent-output/cleanup-review-2026-10-08/move-review-mobile.png' })
  await page.getByRole('button', { name: 'Reset partita', exact: true }).click()
  await expect(page.locator('.analysis-row-button')).toHaveCount(0)
  await expect(page.locator('.move-classification-overlay')).toHaveCount(0)
  await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', positions[0])
  await expect(page.locator('.engine-eval-label')).toHaveAttribute('data-fen', positions[0])
})

test('classification reference colors and symbols render without an engine', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => { window.Worker = class { constructor() { throw new Error('Unexpected engine search') } } })
  await page.setViewportSize({ width: 1050, height: 1300 })
  await page.goto(appUrl)
  const game = new Chess(), before = game.fen()
  game.move('e4')
  await page.evaluate(async ({ before, after }) => {
    const { default: React } = await import('/ChessProfessor/node_modules/.vite/deps/react.js')
    const { default: ReactDOM } = await import('/ChessProfessor/node_modules/.vite/deps/react-dom_client.js')
    const { default: Board } = await import('/ChessProfessor/src/components/Board.jsx')
    const { GameProvider, useGame } = await import('/ChessProfessor/src/context/GameContext.jsx')
    const { MOVE_APPEARANCE } = await import('/ChessProfessor/src/lib/moveReviewPresentation.js')
    function Preview({ classification }) {
      const { applyMove } = useGame()
      React.useEffect(() => { applyMove('e4') }, [applyMove])
      const entry = { ply: 1, side: 'w', playedMove: 'e4', moveHistorySan: [], fenBefore: before, fenAfter: after,
        classification, isBookMove: classification === 'book', engine: { lines: [{ multipv: 1, pv: ['d2d4'] }] }, playedEngine: {} }
      return React.createElement(Board, { id: `reference-${classification}`, analysisEntries: [entry] })
    }
    document.querySelector('main').style.display = 'none'
    const host = document.createElement('div')
    host.id = 'classification-reference'
    Object.assign(host.style, { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', padding: '16px' })
    document.body.appendChild(host)
    ReactDOM.createRoot(host).render(React.createElement(React.Fragment, null, ...Object.entries(MOVE_APPEARANCE).map(([classification, style]) =>
      React.createElement('section', { key: classification, 'data-preview-category': classification },
        React.createElement('h3', null, style.label),
        React.createElement(GameProvider, null, React.createElement(Preview, { classification }))))))
  }, { before, after: game.fen() })
  await expect.poll(async () => ({ count: await page.locator('#classification-reference .move-classification-overlay').count(), errors }), { timeout: 5000 }).toEqual({ count: 11, errors: [] })
  const excellent = page.locator('[data-preview-category="excellent"]')
  await expect(excellent.locator('[data-icon]')).toHaveAttribute('data-icon', 'thumb')
  await expect(page.locator('[data-preview-category="good"] [data-icon]')).toHaveAttribute('data-icon', 'check')
  await expect(page.locator('[data-preview-category="book"] .engine-arrow')).toHaveCount(0)
  expect(await page.locator('[data-preview-category="book"] [data-square="e4"] > div').evaluate(square => getComputedStyle(square).backgroundColor)).toBe('rgb(226, 202, 170)')
  await page.waitForTimeout(150)
  await page.locator('#classification-reference').screenshot({ path: 'agent-output/cleanup-review-2026-10-08/classification-reference.png' })
})

test('real Stockfish 19 refreshes a best-move arrow and hides it in book positions', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => {
    const NativeWorker = window.Worker
    window.engineSearchCount = 0
    window.engineInstances = []
    window.Worker = class extends NativeWorker {
      constructor(...args) { super(...args); window.engineInstances.push(this) }
      postMessage(command) {
        if (typeof command === 'string' && command.startsWith('go ')) window.engineSearchCount++
        super.postMessage(command)
      }
    }
  })
  const assetRequests = []
  page.on('request', request => { if ([ENGINE_CONFIG.engine.workerFile, ENGINE_CONFIG.engine.wasmFile].some(name => request.url().endsWith(name))) assetRequests.push(request.url()) })
  const wasm = page.waitForResponse(response => response.url().includes(ENGINE_CONFIG.engine.wasmFile) && response.status() === 200)
  await page.goto(appUrl)
  await openTools(page, 'Partita e analisi')
  expect(await page.evaluate(() => window.engineSearchCount)).toBe(0)
  expect(await page.evaluate(() => window.engineInstances.length)).toBe(0)
  expect(assetRequests).toEqual([])
  await expect(page.getByText('La prima analisi scarica circa 100 MB.', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Avvia analisi', exact: true }).click()
  await wasm
  await expect(page.locator('.engine-eval-label')).toContainText('Valutazione:')
  await expect(page.locator('.engine-arrow-overlay .engine-arrow')).toHaveCount(1)
  await assertLegalArrows(page)
  // Cache persistence is tested with the real worker, including an offline restart.
  const cacheName = 'chessprofessor-engine-' + ENGINE_CONFIG.engine.workerFile.replace(/\.js$/, '')
  const assetNames = [ENGINE_CONFIG.engine.workerFile, ENGINE_CONFIG.engine.wasmFile]
  await expect.poll(() => page.evaluate(async ({ cacheName, assetNames }) => {
    if (!await caches.has(cacheName)) return false
    const cache = await caches.open(cacheName)
    return (await Promise.all(assetNames.map(name => cache.match(new URL(name, location.href).href)))).every(Boolean)
  }, { cacheName, assetNames })).toBe(true)
  await page.reload()
  await openTools(page, 'Partita e analisi')
  expect(await page.evaluate(() => window.engineInstances.length)).toBe(0)
  await expect(page.getByText('La prima analisi scarica circa 100 MB.', { exact: false })).toHaveCount(0)
  await page.getByRole('button', { name: 'Avvia analisi', exact: true }).click()
  await expect(page.locator('.engine-eval-label')).toContainText('Valutazione:')
  await page.context().setOffline(true)
  try {
    await page.evaluate(() => window.engineInstances.at(-1).onerror(new Error('test restart from cache')))
    await page.getByRole('button', { name: 'Riavvia motore', exact: true }).click()
    await expect(page.locator('.engine-eval-label')).toContainText('Valutazione:')
    await assertLegalArrows(page)
  } finally { await page.context().setOffline(false) }
  await page.locator('[data-square="e2"]').click()
  await page.locator('[data-square="e4"]').click()
  await expect(page.locator('.engine-eval-label')).toContainText('Valutazione:')
  await assertLegalArrows(page)
  await page.getByPlaceholder('Incolla un PGN', { exact: false }).fill('1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 *')
  await page.getByRole('button', { name: 'Importa PGN', exact: true }).click()
  await expect(page.locator('.engine-eval-label')).toContainText('Valutazione:')
  await expect(page.locator('.engine-arrow-overlay .engine-arrow')).toHaveCount(0)
  await assertLegalArrows(page)
  await expect(page.locator('.analysis-row-button')).toHaveCount(8)
  const savedSummary = await page.locator('.analysis-rows').textContent()
  const searchesBeforeClosing = await page.evaluate(() => window.engineSearchCount)
  await page.locator('.tools-menu > summary').click()
  await expect(page.locator('.analysis-summary')).not.toBeVisible()
  await expect(page.locator('.engine-arrow-overlay .engine-arrow')).toHaveCount(0)
  await assertLegalArrows(page)
  await openTools(page, 'Partita e analisi')
  expect(await page.locator('.analysis-rows').textContent()).toBe(savedSummary)
  expect(await page.evaluate(() => window.engineSearchCount)).toBe(searchesBeforeClosing)
  await page.getByPlaceholder('Incolla un PGN', { exact: false }).blur()
  await page.keyboard.press('ArrowLeft')
  await expect(page.locator('.engine-eval-label')).toContainText('Valutazione:')
  await expect(page.locator('.engine-arrow-overlay .engine-arrow')).toHaveCount(0)
  await assertLegalArrows(page)
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('.engine-eval-label')).toContainText('Valutazione:')
  await assertLegalArrows(page)
  await page.getByRole('button', { name: 'Reset partita', exact: true }).click()
  await expect(page.locator('.engine-eval-label')).toContainText('Valutazione:')
  await expect(page.locator('.engine-arrow-overlay .engine-arrow')).toHaveCount(1)
  await assertLegalArrows(page)
  const beforeRapidImport = await page.evaluate(() => window.engineSearchCount)
  await page.getByPlaceholder('Incolla un PGN', { exact: false }).fill('1. d4 d5 2. c4 e6 3. Nc3 Nf6 *')
  await page.getByRole('button', { name: 'Importa PGN', exact: true }).click()
  await expect.poll(() => page.evaluate(() => window.engineSearchCount)).toBeGreaterThan(beforeRapidImport)
  await page.getByPlaceholder('Incolla un PGN', { exact: false }).fill('1. c4 *')
  await page.getByRole('button', { name: 'Importa PGN', exact: true }).click()
  await expect(page.locator('.engine-eval-label')).toContainText('Valutazione:')
  await expect(page.locator('.engine-arrow-overlay .engine-arrow')).toHaveCount(0)
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
        if (command.startsWith('go nodes')) {
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
  await openTools(page, 'Partita e analisi')
  await page.getByRole('button', { name: 'Avvia analisi', exact: true }).click()
  await expect(page.locator('.engine-arrow-overlay .engine-arrow')).toHaveCount(1)
  await page.getByPlaceholder('Incolla un PGN', { exact: false }).fill('1. e4 *')
  await page.getByRole('button', { name: 'Importa PGN', exact: true }).click()
  await expect(page.locator('.engine-arrow-overlay .engine-arrow')).toHaveCount(0, { timeout: 500 })
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
        if (command.startsWith('go nodes')) {
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
  await openTools(page, 'Partita e analisi')
  await page.getByRole('button', { name: 'Avvia analisi', exact: true }).click()
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
  await openTools(page, 'Partita e analisi')
  await page.getByPlaceholder('Incolla un PGN', { exact: false }).fill('1. f3 e5 2. g4 Qh4# 0-1')
  await page.getByRole('button', { name: 'Importa PGN', exact: true }).click()
  await page.getByRole('button', { name: 'Avvia analisi', exact: true }).click()
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
        if (command.startsWith('go nodes')) {
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
  await openTools(page, 'Partita e analisi')
  await page.getByPlaceholder('Incolla un PGN', { exact: false }).fill('1. e4 e5 2. a3 a6 3. f3 d6 *')
  await page.getByRole('button', { name: 'Importa PGN', exact: true }).click()
  await page.getByRole('button', { name: 'Avvia analisi', exact: true }).click()
  const missedMove = page.locator('.analysis-row-button').filter({ hasText: '3... d6' })
  await expect(missedMove).toContainText('Mossa mancata')
  await expect(missedMove).toContainText("Dopo f3, l'occasione era Nc6 d4.")
})

test('missed mate labels refresh in saved analysis offline without another engine search', async ({ page }) => {
  const game = new Chess()
  for (const san of ['f3', 'e5', 'g4']) game.move(san)
  const before = game.fen()
  await page.addInitScript(({ before }) => {
    window.workerCount = 0
    window.Worker = class {
      constructor() { window.workerCount++ }
      postMessage(command) {
        if (command === 'uci') queueMicrotask(() => this.onmessage?.({ data: 'uciok' }))
        if (command === 'isready') queueMicrotask(() => this.onmessage?.({ data: 'readyok' }))
        if (command.startsWith('position fen ')) this.fen = command.slice(13)
        if (command.startsWith('go nodes')) queueMicrotask(() => {
          const score = this.fen === before ? 'mate 1' : 'cp -1200'
          const pv = this.fen === before ? 'd8h4' : 'e2e4'
          this.onmessage?.({ data: `info depth 12 multipv 1 score ${score} pv ${pv}` })
          this.onmessage?.({ data: `bestmove ${pv}` })
        })
      }
      terminate() {}
    }
  }, { before })
  await page.goto(appUrl)
  await openTools(page, 'Partita e analisi')
  await page.getByPlaceholder('Incolla un PGN', { exact: false }).fill(`[SetUp "1"]\n[FEN "${before}"]\n\n2... Nc6 *`)
  await page.getByRole('button', { name: 'Importa PGN', exact: true }).click()
  await page.getByRole('button', { name: 'Avvia analisi', exact: true }).click()
  await expect(page.locator('.analysis-row-button')).toContainText('Mossa mancata')
  await expect(page.locator('.analysis-row-button')).toContainText('Matto in 1 non mantenuto')
  await page.locator('.game-archive summary').click()
  await page.locator('.game-archive').getByRole('button', { name: 'Salva partita e analisi' }).click()
  await expect(page.locator('.game-archive li')).toContainText('Analisi salvata: 1 mosse.')
  // Emulate a record saved by the old classifier, preserving all raw evidence.
  await page.evaluate(async () => {
    const db = await new Promise(resolve => {
      const request = indexedDB.open('chessprofessor-games', 1)
      request.onsuccess = () => resolve(request.result)
    })
    await new Promise((resolve, reject) => {
      const tx = db.transaction('games', 'readwrite'), store = tx.objectStore('games')
      tx.oncomplete = resolve; tx.onabort = reject
      const request = store.getAll()
      request.onsuccess = () => {
        const record = request.result[0], entry = record.analysisEntries[0]
        entry.classification = entry.baseClassification
        entry.missedOpportunity = null
        store.put(record)
      }
    })
    db.close()
  })
  await page.reload()
  await page.context().setOffline(true)
  await openTools(page, 'Partita e analisi')
  await page.locator('.game-archive summary').click()
  await page.locator('.game-archive').getByRole('button', { name: 'Apri', exact: true }).click()
  await expect(page.locator('.analysis-row-button')).toContainText('Mossa mancata')
  await expect(page.locator('.analysis-row-button')).toContainText('Matto in 1 non mantenuto')
  expect(await page.evaluate(() => window.workerCount)).toBe(0)
})

for (const category of ['Grande', 'Geniale']) {
  test(`experimental ${category} shows evidence offline and toggles without engine searches`, async ({ page }) => {
    const initial = 'rnbq1rk1/ppp2ppp/3bpn2/3p4/3P4/2NBPN2/PPP2PPP/R1BQ1RK1 w - - 0 1'
    const sacrifice = category === 'Geniale', metadata = createAnalysisMetadata()
    const sequence = (fen, sans) => {
      const game = new Chess(fen)
      return sans.map(san => { const move = game.move(san); return `${move.from}${move.to}${move.promotion ?? ''}` })
    }
    const sans = sacrifice
      ? ['Bxh7+', 'Kxh7', 'Ng5+', 'Kg8', 'Qh5', 'Re8', 'Qxf7+', 'Kh8', 'Qxe8+', 'Nxe8', 'Nf7+', 'Kg8', 'Ng5', 'Nf6']
      : ['e4', 'dxe4', 'Nxe4']
    const pv = sequence(initial, sans), game = new Chess(initial), move = game.move(sans[0])
    const line = (multipv, evalCp, pv) => ({ multipv, evalCp, mate: null, depth: 15, pv })
    const best = sacrifice ? 100 : 0
    const roots = [line(1, best, pv), ...new Chess(initial).moves({ verbose: true })
      .filter(other => `${other.from}${other.to}` !== pv[0]).slice(0, 4)
      .map((other, index) => line(index + 2, sacrifice ? 50 : -400, [`${other.from}${other.to}`]))]
    const children = [line(1, -best, pv.slice(1))]
    if (sacrifice) children.push(line(2, -best, sequence(game.fen(), ['Nxh7', 'Kh1', 'Kh8'])))
    const entry = { ply: 1, moveNumber: 1, side: 'w', playedMove: move.san, playedUci: pv[0],
      moveHistorySan: [], fenBefore: initial, fenAfter: game.fen(), classification: 'best',
      bestEval: best, playedEval: best, bestMate: null, playedMate: null, isEngineBest: true,
      bestProbability: 1 / (1 + Math.exp(-best / 400)), playedProbability: 1 / (1 + Math.exp(-best / 400)),
      analysisMetadata: metadata, engine: { ...roots[0], lines: roots, analysisMetadata: metadata },
      playedEngine: { ...children[0], lines: children, analysisMetadata: metadata } }
    const pgn = `[SetUp "1"]\n[FEN "${initial}"]\n\n1. ${move.san} *`
    await page.addInitScript(() => {
      window.workerCount = 0
      window.Worker = class { constructor() { window.workerCount++; throw Error('Unexpected engine search') } }
    })
    await page.goto(appUrl)
    await page.evaluate(async ({ pgn, entry }) => {
      const { createGameArchive } = await import('/ChessProfessor/src/lib/gameArchive.js')
      const archive = createGameArchive()
      await archive.save({ pgn, title: 'Prova categorie', analysisEntries: [entry] })
      await archive.close()
    }, { pgn, entry })
    await page.reload()
    await page.context().setOffline(true)
    await openTools(page, 'Partita e analisi')
    await page.locator('.game-archive summary').click()
    await page.locator('.game-archive').getByRole('button', { name: 'Apri', exact: true }).click()
    const row = page.locator('.analysis-row-button')
    const toggle = page.getByRole('checkbox', { name: 'Mostra Grande e Geniale sperimentali' })
    await expect(toggle).toBeChecked()
    await expect(row).toContainText(category)
    await expect(row).toContainText(sacrifice ? 'Sacrificio compensato' : 'Difesa decisiva')
    await toggle.uncheck()
    await expect(row).toContainText('Migliore')
    await toggle.check()
    await expect(row).toContainText(category)
    expect(await page.evaluate(() => window.workerCount)).toBe(0)
  })
}

for (const { id, ply, san, category } of [
  { id: 'personal-06', ply: 11, san: 'Nxe5', category: 'Geniale' },
  { id: 'personal-06', ply: 13, san: 'd4', category: 'Grande' },
  { id: 'personal-03', ply: 19, san: 'Nxd6+', category: 'Grande' },
  { id: 'personal-02', ply: 21, san: 'Bxf7', category: 'Grande' },
]) {
test(`real archived ${san} is reclassified ${category} by default offline from mixed-depth evidence`, async ({ page }) => {
  const cache = JSON.parse(readFileSync(new URL(`./tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/${id}.json`, import.meta.url)))
  const metadata = createAnalysisMetadata(), game = new Chess(cache.entries[0].fenBefore)
  const entries = cache.entries.slice(0, ply).map(e => {
    game.move(e.san)
    return classifyAnalysisEntries([{ ...e, playedMove: e.san, side: e.fenBefore.split(' ')[1],
      moveNumber: Math.ceil(e.ply / 2), isBookMove: false, analysisMetadata: metadata,
      ...moveEvaluationFields(e.engine, e.playedEngine, e.uci),
      engine: { ...e.engine, analysisMetadata: metadata },
      playedEngine: { ...e.playedEngine, analysisMetadata: metadata } }])[0]
  })
  expect(entries[ply - 1].classification).toBe('best')
  await page.addInitScript(() => {
    window.workerCount = 0
    window.Worker = class { constructor() { window.workerCount++; throw Error('Unexpected engine search') } }
  })
  await page.goto(appUrl)
  await page.evaluate(async ({ pgn, entries }) => {
    const { createGameArchive } = await import('/ChessProfessor/src/lib/gameArchive.js')
    const archive = createGameArchive()
    await archive.save({ pgn, title: 'Sacrificio reale', analysisEntries: entries })
    await archive.close()
  }, { pgn: game.pgn(), entries })
  await page.reload()
  await page.context().setOffline(true)
  await openTools(page, 'Partita e analisi')
  await page.locator('.game-archive summary').click()
  await page.locator('.game-archive').getByRole('button', { name: 'Apri', exact: true }).click()
  const row = page.locator('.analysis-row-button').filter({ hasText: `${Math.ceil(ply / 2)}. ${san}` })
  await expect(row).toContainText(category)
  await expect(row).toContainText(category === 'Geniale' ? 'Sacrificio compensato'
    : san === 'Bxf7' ? 'Recupera una posizione circa equilibrata' : 'Difesa decisiva')
  const toggle = page.getByRole('checkbox', { name: 'Mostra Grande e Geniale sperimentali' })
  await toggle.uncheck()
  await expect(row).toContainText('Migliore')
  await toggle.check()
  await expect(row).toContainText(category)
  expect(await page.evaluate(() => window.workerCount)).toBe(0)
})
}

test('corroborated Bxf4 sacrifice refreshes a v5 archive offline without an engine', async ({ page }) => {
  const source = JSON.parse(readFileSync(new URL('./agent-output/external-specials-probe-2026-10-09T14-03-37-245Z/results.json', import.meta.url)))
  const fixture = JSON.parse(readFileSync(new URL('./agent-output/external-specials-v1/fixture.json', import.meta.url)))
  const metadata = createAnalysisMetadata()
  // Present a current-profile archive to exercise migration; raw scores and PVs
  // remain the collected evidence, and the source fixture is never modified.
  const entries = source.entries.map(e => ({ ...e, analysisMetadata: metadata,
    engine: { ...e.engine, analysisMetadata: metadata },
    playedEngine: { ...e.playedEngine, analysisMetadata: metadata } }))
  expect(entries[14].classification).toBe('best')
  await page.addInitScript(() => {
    window.workerCount = 0
    window.Worker = class { constructor() { window.workerCount++; throw Error('Unexpected engine search') } }
  })
  await page.goto(appUrl)
  await page.evaluate(async ({ pgn, entries }) => {
    const { createGameArchive } = await import('/ChessProfessor/src/lib/gameArchive.js')
    const archive = createGameArchive()
    await archive.save({ pgn, title: 'Compensazione corroborata', analysisEntries: entries })
    await archive.close()
  }, { pgn: fixture.pgn, entries })
  await page.reload()
  await page.context().setOffline(true)
  await openTools(page, 'Partita e analisi')
  await page.locator('.game-archive summary').click()
  await page.locator('.game-archive').getByRole('button', { name: 'Apri', exact: true }).click()
  const row = page.locator('.analysis-row-button').filter({ hasText: '8. Bxf4' })
  await expect(row).toContainText('Geniale')
  await expect(row).toContainText('Compensazione confermata anche')
  const toggle = page.getByRole('checkbox', { name: 'Mostra Grande e Geniale sperimentali' })
  await toggle.uncheck(); await expect(row).toContainText('Migliore')
  await toggle.check(); await expect(row).toContainText('Geniale')
  expect(await page.evaluate(() => window.workerCount)).toBe(0)
})

for (const mode of ['forced', 'book-snapshot', 'conflicting']) {
  test(`review reliability ${mode} migrates an archive offline without searches`, async ({ page }) => {
    const metadata = createAnalysisMetadata()
    const initial = mode === 'forced'
      ? 'r4k2/p4Q1p/R7/1p6/1P2b1P1/P1B4P/2P5/3R2K1 b - - 0 26' : new Chess().fen()
    const game = new Chess(initial), san = mode === 'forced' ? 'Kxf7' : 'e4'
    const move = game.move(san), fenAfter = game.fen()
    const roots = (mode === 'forced' ? ['f8f7'] : ['d2d4', 'c2c4', 'g1f3', 'b1c3', 'e2e4'])
      .map((uci, i) => ({ multipv: i + 1, depth: 10, evalCp: mode === 'forced' ? -925 : 100 - i * 50,
        mate: null, pv: [uci] }))
    const latest = roots.map((line, i) => ({ ...line, depth: i === 0 ? 11 : 10,
      evalCp: mode === 'forced' ? -925 : i === 0 ? 500 : line.evalCp }))
    const reply = game.moves({ verbose: true })[0]
    const child = { multipv: 1, depth: 12, evalCp: mode === 'forced' ? 925 : mode === 'conflicting' ? -900 : 100,
      mate: null, pv: [`${reply.from}${reply.to}${reply.promotion ?? ''}`] }
    const entry = { ply: 1, side: initial.split(' ')[1], moveNumber: Number(initial.split(' ')[5]),
      fenBefore: initial, fenAfter, playedMove: move.san, moveHistorySan: [],
      classification: mode === 'book-snapshot' ? 'book' : 'best', isBookMove: mode === 'book-snapshot',
      analysisMetadata: metadata,
      engine: { ...latest[0], fen: initial, lines: latest, specialLines: mode === 'conflicting' ? [] : roots, analysisMetadata: metadata },
      playedEngine: { ...child, fen: fenAfter, lines: [child], analysisMetadata: metadata } }
    await page.addInitScript(() => {
      window.workerCount = 0
      window.Worker = class { constructor() { window.workerCount++; throw Error('Unexpected engine search') } }
    })
    await page.goto(appUrl)
    await page.evaluate(async ({ pgn, entry }) => {
      const { createGameArchive } = await import('/ChessProfessor/src/lib/gameArchive.js')
      const archive = createGameArchive()
      await archive.save({ pgn, title: 'Affidabilità confronto', analysisEntries: [entry] })
      await archive.close()
    }, { pgn: game.pgn(), entry })
    await page.reload()
    await page.context().setOffline(true)
    await openTools(page, 'Partita e analisi')
    await page.locator('.game-archive summary').click()
    await page.locator('.game-archive').getByRole('button', { name: 'Apri', exact: true }).click()
    const row = page.locator('.analysis-row-button')
    if (mode === 'forced') {
      await expect(row).toContainText('Forzata')
      await expect(row).toContainText('Unica mossa legale')
      await page.getByRole('checkbox', { name: 'Mostra Grande e Geniale sperimentali' }).uncheck()
      await expect(row).toContainText('Forzata')
    } else if (mode === 'book-snapshot') {
      await expect(row).toContainText('Libro · Valutazione: Errore')
      await expect(row).toContainText('Migliore: Eval 1.00')
      await expect(row).not.toContainText('analisi separate')
    } else {
      await expect(row).toContainText('Valutazioni discordanti: classificazione provvisoria.')
    }
    expect(await page.evaluate(() => window.workerCount)).toBe(0)
  })
}
