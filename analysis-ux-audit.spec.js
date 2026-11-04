import { test, expect } from '@playwright/test'
import { Chess } from 'chess.js'
import { readFileSync, writeFileSync } from 'node:fs'

const appUrl = 'http://127.0.0.1:4173/ChessProfessor/'
const pgn = '[White "Audit"]\n[Black "Controllo"]\n\n1. Nf3 Nf6 2. d4 d5 *'
const at = (moves, base) => { const game = new Chess(base); for (const san of moves) game.move(san); return game.fen() }
const moves = ['Nf3', 'Nf6', 'd4', 'd5']
const start = new Chess().fen()
const observations = []
const note = (control, finding, details = {}) => observations.push({ control, finding, ...details })

async function tools(page, section) {
  const root = page.locator('.tools-menu')
  if (!await root.evaluate(e => e.open)) await root.locator(':scope > summary').click()
  const target = page.locator(`.tools-${section}`)
  if (!await target.evaluate(e => e.open)) await target.locator(':scope > summary').click()
}
async function importGame(page, text = pgn) {
  await tools(page, 'game')
  await page.getByRole('textbox', { name: 'PGN da importare', exact: true }).fill(text)
  await page.getByRole('button', { name: 'Importa PGN', exact: true }).click()
}
async function fen(page) { return page.locator('.board-stage').getAttribute('data-fen') }
async function archive(page) {
  await tools(page, 'game')
  const area = page.locator('.game-archive')
  if (!await area.evaluate(e => e.open)) await area.locator(':scope > summary').click()
  return area
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.auditExplorerCalls = []; window.auditStockfish = 0
    const NativeWorker = window.Worker
    window.Worker = class extends NativeWorker {
      constructor(url, options) {
        if (String(url).includes('stockfish-')) { window.auditStockfish++; throw Error('Audit must not run Stockfish') }
        super(url, options)
      }
    }
  })
  await page.route('https://explorer.lichess.ovh/**', async route => {
    await page.evaluate(url => window.auditExplorerCalls.push(url), route.request().url())
    await route.fulfill({ json: { white: 1, draws: 1, black: 1, moves: [], opening: { eco: 'A00', name: 'Risposta di audit simulata' } } })
  })
  await page.goto(appUrl)
})
test.afterAll(() => writeFileSync('docs/data/analysis-ux-revision-observations.json', JSON.stringify({
  scope: 'Isolated browser contexts; simulated explorer/clipboard only; no Stockfish searches', observations,
}, null, 2) + '\n'))

test('PGN and navigation change the actual board; preserve full notation and explain reset', async ({ page }) => {
  for (const name of ['Primo', 'Indietro', 'Avanti', 'Ultimo']) await expect(page.getByRole('button', { name, exact: true })).toBeDisabled()
  await importGame(page)
  await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', at(moves))
  await expect(page.locator('.move-navigation-position')).toHaveText('4 / 4')
  await importGame(page, '1. e5 *')
  await expect(page.locator('.pgn-import [role="status"]')).toBeVisible()
  expect(await fen(page)).toBe(at(moves))
  await importGame(page)
  await page.getByRole('button', { name: 'Primo', exact: true }).click()
  expect(await fen(page)).toBe(start)
  expect(await page.locator('.move-button').count()).toBe(4)
  await page.getByRole('button', { name: 'Avanti', exact: true }).click()
  expect(await fen(page)).toBe(at(moves.slice(0, 1)))
  await page.getByRole('button', { name: 'Ultimo', exact: true }).click()
  await page.locator('.move-button').nth(1).click()
  expect(await fen(page)).toBe(at(moves.slice(0, 2)))
  expect(await page.locator('.move-button').count()).toBe(4)
  await expect(page.locator('.move-navigation-position')).toHaveText('2 / 4')
  note('Lista mosse', 'Rewind keeps all notation buttons and the full timeline', { visiblePlies: 4, totalPlies: 4 })
  await page.getByRole('button', { name: 'Ultimo', exact: true }).click()
  const field = page.getByRole('textbox', { name: 'PGN da importare', exact: true })
  await field.focus(); await page.keyboard.press('ArrowLeft')
  expect(await fen(page)).toBe(at(moves))
  await page.getByRole('button', { name: 'Primo', exact: true }).click(); await page.keyboard.press('ArrowRight')
  expect(await fen(page)).toBe(at(moves.slice(0, 1)))
  let dialogs = 0; page.on('dialog', dialog => { dialogs++; dialog.dismiss() })
  await page.getByRole('button', { name: 'Reset partita', exact: true }).click()
  expect(await fen(page)).toBe(start)
  await expect(field).toHaveValue(pgn)
  expect(dialogs).toBe(0)
  await expect(page.locator('.game-notice')).toContainText('Bozza PGN e partite salvate conservate')
  await expect(page.getByRole('button', { name: 'Annulla mossa chat', exact: true })).toBeDisabled()
  note('Reset / Torna indietro', 'Reset explains preservation of PGN draft and archive; chat-only undo is named explicitly')
})

test('editor palette/apply and distinct FEN copies preserve draft and report clipboard rejection', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message))
  await page.evaluate(() => {
    window.auditCopies = []; window.denyCopy = false
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => {
      window.auditCopies.push(text)
      if (window.denyCopy) throw new DOMException('Audit clipboard denied', 'NotAllowedError')
    } } })
  })
  await tools(page, 'editor')
  const field = page.getByRole('textbox', { name: 'FEN', exact: true })
  const custom = '7k/8/8/8/8/8/8/K7 w - - 0 1'
  await field.fill(custom)
  await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', custom)
  await page.getByRole('button', { name: 'Copia FEN corrente', exact: true }).click()
  await expect(field).toHaveValue(custom)
  expect(await page.evaluate(() => window.auditCopies.at(-1))).toBe(start)
  await page.getByRole('button', { name: 'Copia bozza FEN', exact: true }).click()
  expect(await page.evaluate(() => window.auditCopies.at(-1))).toBe(custom)
  note('Copia FEN', 'Current/draft copies are explicit and preserve the editor draft')
  await field.fill(custom)
  await page.getByRole('button', { name: 'Applica posizione', exact: true }).click()
  await page.getByRole('button', { name: 'N', exact: true }).click()
  await page.locator('.board-stage [data-square="d4"]').click()
  await expect(field).toHaveValue('7k/8/8/8/3N4/8/8/K7 w - - 0 1')
  await page.getByRole('button', { name: 'Cancella', exact: true }).click()
  await page.locator('.board-stage [data-square="d4"]').click()
  await expect(field).toHaveValue(custom)
  await page.evaluate(() => { window.denyCopy = true })
  await page.getByRole('button', { name: 'Copia FEN corrente', exact: true }).click()
  await expect(page.locator('.position-editor [role="status"]')).toContainText('Copia non riuscita')
  expect(errors).toEqual([])
  note('Copia FEN', 'Clipboard rejection is handled and reported', { errors })
  await field.fill('8/8/8/8/8/8/8/K7 w - - 0 1')
  await page.getByRole('button', { name: 'Applica posizione', exact: true }).click()
  await expect(page.locator('.position-editor .notice').last()).toBeVisible()
  await page.locator('.tools-editor > summary').click()
  expect(await fen(page)).toBe(custom)
})

test('archive actions persist, export full continuation, reopen and honor delete confirmation', async ({ page }, testInfo) => {
  await importGame(page)
  await page.getByRole('button', { name: 'Primo', exact: true }).click()
  const area = await archive(page)
  await area.getByRole('button', { name: 'Salva partita e analisi', exact: true }).click()
  await expect(area.locator('li')).toHaveCount(1)
  await area.getByRole('button', { name: 'Salva partita e analisi', exact: true }).click()
  await expect(area.locator('li')).toHaveCount(1)
  page.once('dialog', dialog => dialog.accept('Audit partita'))
  await area.getByRole('button', { name: 'Rinomina', exact: true }).click()
  await expect(area.locator('li strong')).toHaveText('Audit partita')
  const downloadReady = page.waitForEvent('download')
  await area.getByRole('button', { name: 'Esporta PGN', exact: true }).click()
  const download = await downloadReady
  const path = testInfo.outputPath('export.pgn'); await download.saveAs(path)
  const exported = new Chess(); exported.loadPgn(readFileSync(path, 'utf8'))
  expect(exported.history()).toEqual(moves)
  await page.getByRole('button', { name: 'Reset partita', exact: true }).click()
  await area.getByRole('button', { name: 'Apri', exact: true }).click()
  expect(await fen(page)).toBe(at(moves))
  page.once('dialog', dialog => dialog.dismiss())
  await area.getByRole('button', { name: 'Elimina', exact: true }).click()
  await expect(area.locator('li')).toHaveCount(1)
  page.once('dialog', dialog => dialog.accept())
  await area.getByRole('button', { name: 'Elimina', exact: true }).click()
  await expect(area.locator('li')).toHaveCount(0)
  await area.getByLabel('Importa file PGN').setInputFiles({ name: 'audit.pgn', mimeType: 'application/x-chess-pgn', buffer: Buffer.from('1. e4 e5 *') })
  await expect(area.locator('li')).toHaveCount(1)
  expect(await fen(page)).toBe(at(['e4', 'e5']))
  note('Archivio', 'Save/dedup/rename/export/open/delete cancel+confirm/file import verified by persisted records and actual PGN/FEN')
})

test('selection hints clear on changed positions and promotion requires an explicit choice', async ({ page }) => {
  await page.locator('.board-stage [data-square="e2"]').click()
  const hint = () => page.locator('.board-stage [data-square="e4"]').evaluate(e => [e,...e.querySelectorAll('*')].map(n => getComputedStyle(n).backgroundImage).join(' '))
  expect(await hint()).toContain('radial-gradient')
  await importGame(page, '1. e4 e5 *')
  expect(await hint()).not.toContain('radial-gradient')
  expect(new Chess(await fen(page)).get('e2')).toBeUndefined()
  note('Selezione scacchiera', 'Legal-move dots clear when the imported position changes')
  await tools(page, 'editor')
  const promotionFen = '7k/P7/8/8/8/8/8/7K w - - 0 1'
  await page.getByRole('textbox', { name: 'FEN', exact: true }).fill(promotionFen)
  await page.getByRole('button', { name: 'Applica posizione', exact: true }).click()
  await page.locator('.tools-editor > summary').click()
  await page.locator('.board-stage [data-square="a7"]').click()
  await page.locator('.board-stage [data-square="a8"]').click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Cavallo', exact: true }).click()
  expect(new Chess(await fen(page)).get('a8')).toMatchObject({ type: 'n', color: 'w' })
  expect(new Set(new Chess(promotionFen).moves({ square: 'a7', verbose: true }).map(m => m.promotion)).size).toBe(4)
  expect(await page.getByRole('combobox', { name: /Promozione/ }).count()).toBe(0)
  note('Promozione', 'Study board supports explicit underpromotion')
})

test('opening context loads only with chat; local requests and responsive layout inventory', async ({ page }, testInfo) => {
  expect(await page.evaluate(() => window.auditExplorerCalls.length)).toBe(0)
  await expect(page.locator('.tools-openings')).toHaveCount(0)
  await tools(page, 'chat')
  await expect.poll(() => page.evaluate(() => window.auditExplorerCalls.length)).toBeGreaterThan(0)
  note('Contesto chat', 'Opening context loads on chat opening; no unused root disclosure or startup request')
  let aiCalls = 0
  await page.route(/api\.groq\.com|generativelanguage\.googleapis\.com/, route => { aiCalls++; return route.abort() })
  await page.locator('.chat-panel select').selectOption('gemini')
  await page.locator('.chat-panel input').fill('Spiega questa posizione')
  await page.getByRole('button', { name: 'Invia', exact: true }).click()
  await expect(page.locator('.chat-messages')).toContainText('non è stata classificata come critica')
  expect(aiCalls).toBe(0)
  expect(await page.locator('.chat-panel select').getAttribute('aria-label')).toBe('Servizio della chat')
  note('Chat locale', 'Send is gated by critical-position classification; provider has an accessible label; no AI call was made')
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await tools(page, 'game')
    const metrics = await page.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight, controls: [...document.querySelectorAll('button')].filter(e => e.getClientRects().length)
        .map(e => ({ text: e.textContent.trim(), disabled: e.disabled, width: e.getBoundingClientRect().width, height: e.getBoundingClientRect().height })) }))
    await page.screenshot({ path: testInfo.outputPath(`audit-${width}.png`), fullPage: true })
    note('Layout', 'Observed dimensions and visible button inventory', { width, metrics })
  }
  expect(await page.evaluate(() => window.auditStockfish)).toBe(0)
})
