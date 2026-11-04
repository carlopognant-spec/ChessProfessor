import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { Chess } from 'chess.js'

const entries = JSON.parse(readFileSync('agent-output/refinement-quality-priority-v2/priority-game-184316820266-round-2.json')).entries
const game = new Chess(entries[0].fenBefore)
for (const entry of entries) game.move(entry.playedMove)

async function openAnalyzedArchive(page) {
  await page.route('https://explorer.lichess.ovh/**', route => route.fulfill({ json: { white: 0, draws: 0, black: 0, moves: [] } }))
  await page.addInitScript(() => {
    window.workspaceEngineWorkers = 0
    const NativeWorker = Worker
    window.Worker = class extends NativeWorker {
      constructor(url, options) {
        if (String(url).includes('stockfish-')) { window.workspaceEngineWorkers++; throw Error('Unexpected engine search') }
        super(url, options)
      }
    }
  })
  await page.goto('http://127.0.0.1:4173/ChessProfessor/')
  await page.evaluate(async ({ entries, pgn }) => {
    const { createGameArchive } = await import('/ChessProfessor/src/lib/gameArchive.js')
    const archive = createGameArchive()
    await archive.save({ analysisEntries: entries, pgn })
    await archive.close()
  }, { entries, pgn: game.pgn() })
  await page.reload()
  for (const selector of ['.tools-menu', '.tools-game']) await page.locator(`${selector} > summary`).click()
  const archive = page.locator('.game-archive')
  await archive.locator(':scope > summary').click()
  await archive.getByRole('button', { name: 'Apri', exact: true }).click()
  await expect(page.locator('.analysis-row-button')).toHaveCount(66)
}

for (const width of [1280, 390]) test(`contextual review keeps the board reachable and full notation at ${width}px`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width, height: 900 })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await openAnalyzedArchive(page)
  await expect(page.locator('.move-list')).toHaveCount(1)
  await expect(page.locator('.move-button.analysis-row-button')).toHaveCount(66)
  await expect(page.getByRole('columnheader', { name: 'Bianco', exact: true })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Nero', exact: true })).toBeVisible()
  await expect(page.locator('.engine-workspace')).not.toHaveAttribute('open', '')
  const target = entries[24]
  await page.locator('.analysis-row-button').nth(24).click()
  await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', target.fenAfter)
  for (const overlay of await page.locator('.engine-arrow-overlay').all()) {
    await expect(overlay).toHaveAttribute('data-fen', target.fenAfter)
  }
  const played = new Chess(target.fenBefore).move(target.playedMove)
  await expect(page.locator('.move-classification-overlay')).toHaveAttribute('data-move-square', played.to)
  const bar = page.locator('.board-evaluation .engine-bar')
  await expect(bar).toBeVisible()
  await expect(bar).toHaveAttribute('role', 'img')
  await expect(bar).toHaveAttribute('aria-label', /^Valutazione della posizione:/)
  const barBox = await bar.boundingBox(), boardBox = await page.locator('.board-stage').boundingBox()
  expect(barBox.height).toBeCloseTo(boardBox.height, 0)
  expect(barBox.y).toBeCloseTo(boardBox.y, 0)
  expect(barBox.x + barBox.width).toBeLessThanOrEqual(boardBox.x)
  await expect(page.locator('.move-button')).toHaveCount(66)
  await expect(page.locator('.selected-move .move-explanation')).toBeVisible()
  await expect(page.locator('.classification-details')).toHaveCount(0)
  await expect(page.locator('.traceability')).not.toHaveAttribute('open', '')
  expect(await page.locator('.selected-move').evaluate(element =>
    !!(element.compareDocumentPosition(document.querySelector('.move-list')) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true)
  await expect(page.getByRole('button', { name: 'Prima della mossa', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Dopo la mossa', exact: true })).toHaveCount(0)
  if (width === 390) {
    await page.getByRole('button', { name: 'Vai alla spiegazione', exact: true }).click()
    await expect(page.locator('.selected-move')).toBeFocused()
    await expect(page.locator('.selected-move h3')).toBeInViewport()
    await page.getByRole('button', { name: 'Vai alla scacchiera', exact: true }).click()
    await expect(page.locator('.board-column')).toBeFocused()
  } else {
    await page.locator('.selected-move').scrollIntoViewIfNeeded()
    await expect(page.locator('.board-stage')).toBeInViewport({ ratio: 1 })
    await expect(page.locator('.move-navigation')).toBeInViewport({ ratio: 1 })
  }
  await page.getByRole('button', { name: 'Primo', exact: true }).click()
  await expect(page.locator('.selected-move')).toContainText('Posizione iniziale')
  await expect(page.locator('.selected-move .move-explanation')).toHaveCount(0)
  await expect(page.locator('.move-button')).toHaveCount(66)
  await page.locator('.move-button').nth(24).click()
  await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', target.fenAfter)
  await expect(page.locator('.selected-move h3')).toContainText(target.playedMove)
  await expect(page.locator('.move-button').nth(24)).toHaveAttribute('aria-current', 'step')
  const active = page.locator('.move-button[aria-current="step"]')
  await expect(active).toBeInViewport({ ratio: 1 })
  const activeBox = await active.boundingBox(), headerBox = await page.locator('.notation-table thead th').first().boundingBox()
  expect(activeBox.y).toBeGreaterThanOrEqual(headerBox.y + headerBox.height - 1)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.screenshot({ path: testInfo.outputPath(`workspace-${width}.png`), fullPage: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
  expect(await page.evaluate(() => window.workspaceEngineWorkers)).toBe(0)
  expect(errors).toEqual([])
})

test('held ArrowLeft navigation keeps the latest cached position and restores its coach after idle', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await openAnalyzedArchive(page)
  await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', entries.at(-1).fenAfter)
  await page.locator('.traceability > summary').click()
  await expect(page.locator('.classification-details')).toHaveCount(1)
  for (let index = 0; index < 40; index++) {
    await page.keyboard.down('ArrowLeft')
    await page.waitForTimeout(30)
    if (index === 20) {
      // Read one committed frame: separate driver round-trips may straddle the idle timer.
      const busy = await page.evaluate(() => ({
        coach: document.querySelectorAll('.selected-move .move-explanation').length,
        trace: document.querySelectorAll('.traceability').length,
        overlays: document.querySelectorAll('.engine-arrow-overlay, .move-classification-overlay').length,
      }))
      expect(busy).toEqual({ coach: 0, trace: 0, overlays: 0 })
    }
  }
  await page.keyboard.up('ArrowLeft')
  const target = entries[25]
  await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', target.fenAfter)
  await expect(page.locator('.move-navigation-position')).toHaveText('26 / 66')
  await expect(page.locator('.selected-move .move-explanation')).toBeVisible()
  await expect(page.locator('.selected-move h3')).toContainText(target.playedMove)
  await expect(page.locator('.classification-details')).toHaveCount(0)
  const misplaced = await page.evaluate(() => {
    const board = document.querySelector('.board-stage'), bounds = board.getBoundingClientRect()
    return [...document.querySelectorAll('.engine-arrow-overlay, .move-classification-overlay')].filter(svg => {
      const rect = svg.getBoundingClientRect()
      return !board.contains(svg) || (svg.dataset.fen && svg.dataset.fen !== board.dataset.fen)
        || rect.left < bounds.left - 1 || rect.right > bounds.right + 1 || rect.top < bounds.top - 1 || rect.bottom > bounds.bottom + 1
    }).length
  })
  expect(misplaced).toBe(0)
  await page.locator('.traceability > summary').click()
  await expect(page.locator('.classification-details')).toHaveCount(1)
  expect(await page.evaluate(() => window.workspaceEngineWorkers)).toBe(0)
  expect(errors).toEqual([])
})

test('single notation table preserves black-to-move turn numbers and the full continuation', async ({ page }) => {
  const fen = '7k/8/8/8/8/8/8/K7 b - - 0 40'
  await page.route('https://explorer.lichess.ovh/**', route => route.fulfill({ json: { white: 0, draws: 0, black: 0, moves: [] } }))
  await page.goto('http://127.0.0.1:4173/ChessProfessor/')
  await page.getByRole('button', { name: 'Importa partita', exact: true }).click()
  await page.getByRole('textbox', { name: 'PGN da importare', exact: true }).fill(`[SetUp "1"]\n[FEN "${fen}"]\n\n40... Kh7 41. Kb2 *`)
  await page.getByRole('button', { name: 'Importa PGN', exact: true }).click()
  await expect(page.locator('.notation-table')).toHaveCount(1)
  await expect(page.locator('tr[data-turn="40"] .move-button')).toContainText('Kh7')
  await expect(page.locator('tr[data-turn="41"] .move-button')).toContainText('Kb2')
  await expect(page.locator('.move-button')).toHaveCount(2)
  await expect(page.locator('.analysis-row-button')).toHaveCount(0)
  await page.getByRole('button', { name: 'Primo', exact: true }).click()
  await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', fen)
  await page.locator('.move-button').first().click()
  const expected = new Chess(fen); expected.move('Kh7')
  await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', expected.fen())
  await expect(page.locator('.move-button').first()).toHaveAttribute('aria-current', 'step')
  await expect(page.locator('.move-button')).toHaveCount(2)
})

test('promotion dialog owns arrow keys until it closes', async ({ page }) => {
  const fen = '7k/P7/8/8/8/8/8/7K w - - 0 1'
  await page.route('https://explorer.lichess.ovh/**', route => route.fulfill({ json: { white: 0, draws: 0, black: 0, moves: [] } }))
  await page.goto('http://127.0.0.1:4173/ChessProfessor/')
  await page.getByRole('button', { name: 'Importa partita', exact: true }).click()
  await page.getByRole('textbox', { name: 'PGN da importare', exact: true }).fill(`[SetUp "1"]\n[FEN "${fen}"]\n\n1. a8=Q+ *`)
  await page.getByRole('button', { name: 'Importa PGN', exact: true }).click()
  await page.getByRole('button', { name: 'Primo', exact: true }).click()
  await page.locator('[data-square="a7"]').click()
  await page.locator('[data-square="a8"]').click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', fen)
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('.board-stage')).not.toHaveAttribute('data-fen', fen)
  await expect(page.locator('.move-button')).toHaveCount(1)
})
