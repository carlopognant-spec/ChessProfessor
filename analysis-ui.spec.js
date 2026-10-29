import { test, expect } from '@playwright/test'
import { Chess } from 'chess.js'
import { createAnalysisMetadata } from './src/lib/analysisMetadata.js'

const appUrl = 'http://127.0.0.1:4173/ChessProfessor/'
const uci = move => move.from + move.to + (move.promotion ?? '')
async function tools(page) {
  for (const selector of ['.tools-menu', '.tools-game']) {
    const details = page.locator(selector)
    if (!await details.evaluate(element => element.open)) await details.locator(':scope > summary').click()
  }
}
async function importGame(page, pgn) {
  await tools(page)
  await page.getByRole('textbox', { name: 'PGN da importare', exact: true }).fill(pgn)
  await page.getByRole('button', { name: 'Importa PGN', exact: true }).click()
}
test.beforeEach(async ({ page }) => {
  await page.route('https://explorer.lichess.ovh/**', route => route.fulfill({ json: { white: 0, draws: 0, black: 0, moves: [] } }))
  await page.addInitScript(() => {
    window.startedWorkers = 0
    window.Worker = class { constructor() { window.startedWorkers++; throw Error('Unexpected engine search') } }
  })
})

test('orientation uses a unique configured PGN identity, preserves manual choice and never changes the game', async ({ page }) => {
  await page.goto(appUrl)
  await expect(page.locator('.board-stage')).toHaveAttribute('data-orientation', 'white')
  await page.getByText('Riconosci il mio colore', { exact: true }).click()
  await page.getByRole('textbox', { name: 'Nome giocatore nei PGN', exact: true }).fill('BUMCestinait0')
  const pgn = '[White "Other"]\n[Black "BUMCestinait0"]\n\n1. Nf3 Nf6 2. Ng1 Ng8 *'
  await importGame(page, pgn)
  const board = page.locator('.board-stage'), fen = await board.getAttribute('data-fen')
  await expect(board).toHaveAttribute('data-orientation', 'black')
  const notation = await page.locator('.move-list').innerText()
  await page.getByRole('button', { name: 'Ruota scacchiera', exact: true }).click()
  await expect(board).toHaveAttribute('data-orientation', 'white')
  await expect(board).toHaveAttribute('data-fen', fen)
  await expect(page.locator('.move-list')).toHaveText(notation, { useInnerText: true })
  await page.reload()
  await expect(board).toHaveAttribute('data-orientation', 'white')
  await importGame(page, pgn)
  await expect(board).toHaveAttribute('data-orientation', 'white')
  const choice = page.getByRole('combobox', { name: 'Orientamento scacchiera', exact: true })
  await choice.selectOption('auto')
  await expect(board).toHaveAttribute('data-orientation', 'black')
  await importGame(page, '[White "BUMCestinait0"]\n[Black "Other"]\n\n1. e4 *')
  await expect(board).toHaveAttribute('data-orientation', 'white')
  await importGame(page, '[White "BUMCestinait0"]\n[Black "BUMCestinait0"]\n\n1. d4 *')
  await expect(board).toHaveAttribute('data-orientation', 'white')
  expect(await page.evaluate(() => window.startedWorkers)).toBe(0)
})

test('rotation remains usable when local storage is denied', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Denied', 'SecurityError') } }))
  await page.goto(appUrl)
  const before = await page.locator('.board-stage').getAttribute('data-fen')
  await page.getByRole('button', { name: 'Ruota scacchiera', exact: true }).click()
  await expect(page.locator('.board-stage')).toHaveAttribute('data-orientation', 'black')
  await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', before)
  await expect(page.getByRole('status')).toContainText(['Il browser non permette di salvare la preferenza.'])
})

function archivedExample() {
  const game = new Chess(), metadata = createAnalysisMetadata(), entries = [], history = []
  const engine = (fen, best) => {
    const board = new Chess(fen), legal = board.moves({ verbose: true }).map(uci)
    const roots = [...new Set([best, ...legal])].slice(0, metadata.multiPv)
    const lines = roots.map((move, i) => ({ multipv: i + 1, depth: 12, evalCp: i ? -1000 : 1000, mate: null, pv: [move] }))
    return { ...lines[0], fen, bestmove: best, lines, specialLines: lines, analysisMetadata: metadata }
  }
  for (const [i, san] of ['Nf3', 'Nf6', 'd4', 'd5'].entries()) {
    const fenBefore = game.fen(), legal = game.moves({ verbose: true }).map(uci)
    const played = uci(game.move(san)), best = ['g1f3', 'g8f6', 'b1c3', 'e7e5'][i]
    const root = engine(fenBefore, best)
    if (!root.lines.some(line => line.pv[0] === played)) root.lines[root.lines.length - 1].pv = [played]
    entries.push({ ply: i + 1, side: fenBefore.split(' ')[1], playedMove: san, playedUci: played,
      moveHistorySan: [...history], fenBefore, fenAfter: game.fen(), classification: 'good', isBookMove: false,
      analysisMetadata: metadata, engine: root, playedEngine: engine(game.fen(), new Chess(game.fen()).moves({ verbose: true }).map(uci)[0]) })
    history.push(san)
    expect(legal).toContain(best)
  }
  return { pgn: game.pgn(), entries }
}

for (const width of [1280, 390]) test(`best-move confirmation and knight arrows stay position-bound when rotated at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 })
  const errors = []; page.on('pageerror', error => errors.push(error.message))
  await page.goto(appUrl)
  await page.evaluate(async ({ pgn, entries }) => {
    const { createGameArchive } = await import('/ChessProfessor/src/lib/gameArchive.js')
    const archive = createGameArchive(); await archive.save({ pgn, analysisEntries: entries }); await archive.close()
  }, archivedExample())
  await page.reload(); await tools(page)
  await page.locator('.game-archive > summary').click()
  await page.getByRole('button', { name: 'Apri', exact: true }).click()
  await expect(page.locator('.analysis-row-button')).toHaveCount(4)
  await page.getByRole('button', { name: 'Primo', exact: true }).click()
  for (let i = 0; i < 2; i++) {
    await page.getByRole('button', { name: 'Avanti', exact: true }).click()
    await expect(page.getByText('La mossa giocata era la migliore di Stockfish.', { exact: true })).toBeVisible()
    await expect(page.locator('.engine-arrow')).toHaveCount(0)
  }
  await page.getByRole('button', { name: 'Avanti', exact: true }).click()
  const board = page.locator('.board-stage'), before = await board.getAttribute('data-fen')
  const summary = await page.locator('.summary-table').innerText()
  const arrow = page.locator('.engine-arrow[data-kind="knight"]')
  await expect(arrow).toHaveAttribute('data-from', 'b1')
  await expect(arrow).toHaveAttribute('data-to', 'c3')
  for (const orientation of ['white', 'black']) {
    await page.getByRole('combobox', { name: 'Orientamento scacchiera', exact: true }).selectOption(orientation)
    await expect(board).toHaveAttribute('data-orientation', orientation)
    const svg = await page.locator('.engine-arrow-overlay').boundingBox()
    const target = await board.locator('[data-square="c3"]').boundingBox()
    const tip = (await arrow.locator('path').last().getAttribute('d')).match(/^M([\d.]+),([\d.]+)/)
    expect(svg.x + Number(tip[1]) * svg.width / 100).toBeCloseTo(target.x + target.width / 2, 0)
    expect(svg.y + Number(tip[2]) * svg.height / 100).toBeCloseTo(target.y + target.height / 2, 0)
    await expect(arrow).toHaveAttribute('fill', '#81B64C')
    await expect(board).toHaveAttribute('data-fen', before)
    await expect(page.locator('.summary-table')).toHaveText(summary, { useInnerText: true })
    await board.scrollIntoViewIfNeeded()
    const nativeArrow = board.locator('path[marker-end]')
    if (!await nativeArrow.count()) {
      const from = await board.locator('[data-square="b1"]').boundingBox()
      const to = await board.locator('[data-square="c3"]').boundingBox()
      await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
      await page.mouse.down({ button: 'right' })
      await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 6 })
      await page.mouse.up({ button: 'right' })
    }
    await expect(nativeArrow.first()).toBeVisible()
    for (const path of await nativeArrow.all()) expect((await path.getAttribute('d')).match(/L/g)).toHaveLength(2)
  }
  await page.screenshot({ path: test.info().outputPath(`knight-ui-${width}.png`), fullPage: true })
  await page.getByRole('button', { name: 'Avanti', exact: true }).click()
  await expect(page.locator('.engine-arrow[data-kind="knight"]')).toHaveCount(0)
  await expect(page.locator('.engine-arrow')).toHaveAttribute('data-from', 'e7')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(await page.evaluate(() => window.startedWorkers)).toBe(0)
  expect(errors).toEqual([])
  await page.screenshot({ path: test.info().outputPath(`analysis-ui-${width}.png`), fullPage: true })
})
