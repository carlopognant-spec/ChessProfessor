import { chromium, expect } from '@playwright/test'
import { Chess } from 'chess.js'
import { writeFileSync } from 'node:fs'

const browser = await chromium.launch({ channel: 'msedge' })
const evidence = { viewports: {}, checks: [] }
try {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const pgn = '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 *'
  const game = new Chess(); game.loadPgn(pgn)
  const prefix = count => { const board = new Chess(); for (const san of game.history().slice(0, count)) board.move(san); return board.fen() }
  const board = page.locator('.board-stage')
  const navigation = page.locator('.review-column .move-navigation')
  const button = name => navigation.getByRole('button', { name, exact: true })
  for (const [width, height] of [[1920, 1080], [1497, 871], [1280, 900], [390, 844]]) {
    await page.setViewportSize({ width, height })
    await page.goto('http://127.0.0.1:5173/ChessProfessor/')
    await page.evaluate(() => localStorage.setItem('chessprofessor-main-board-size', '1500'))
    await page.reload()
    await page.getByRole('button', { name: 'Importa partita', exact: true }).click()
    await page.getByRole('textbox', { name: 'PGN da importare', exact: true }).fill(pgn)
    await page.getByRole('button', { name: 'Importa PGN', exact: true }).click()
    await page.evaluate(() => window.scrollTo(0, 0))
    await expect(board).toHaveAttribute('data-fen', game.fen())
    await page.waitForTimeout(200)
    await expect(page.locator('.move-navigation')).toHaveCount(1)
    await expect(page.locator('.review-column .move-list + .move-navigation')).toHaveCount(1)
    await expect(page.getByRole('slider', { name: 'Dimensione scacchiera' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /^(Auto|Dimensione automatica)$/ })).toHaveCount(0)
    await expect(page.locator('.board-size-controls')).toHaveCount(0)
    const measurement = await page.evaluate(() => {
      const rect = e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom } }
      const squares = [...document.querySelectorAll('.board-stage [data-square]')].map(rect)
      const x = Math.min(...squares.map(r => r.x)), y = Math.min(...squares.map(r => r.y))
      const right = Math.max(...squares.map(r => r.right)), bottom = Math.max(...squares.map(r => r.bottom))
      return { grid: { x, y, width: right - x, height: bottom - y, right, bottom }, squares,
        bar: rect(document.querySelector('.board-evaluation')), navigation: rect(document.querySelector('.move-navigation')),
        notation: rect(document.querySelector('.move-list')), explanation: rect(document.querySelector('.selected-move')),
        review: rect(document.querySelector('.review-column')), overflow: document.documentElement.scrollWidth > innerWidth }
    })
    evidence.viewports[`${width}x${height}`] = measurement
    expect(measurement.squares).toHaveLength(64)
    expect(Math.abs(measurement.grid.width - measurement.grid.height)).toBeLessThan(1)
    expect(measurement.squares.every(s => Math.abs(s.width * 8 - measurement.grid.width) < 1 && Math.abs(s.height - s.width) < 1)).toBe(true)
    expect(measurement.overflow).toBe(false)
    expect(Math.abs(measurement.bar.height - measurement.grid.height)).toBeLessThan(1)
    expect(Math.abs(measurement.bar.y - measurement.grid.y)).toBeLessThan(1)
    expect(measurement.bar.right).toBeLessThanOrEqual(measurement.grid.x)
    expect(measurement.grid.right).toBeLessThanOrEqual(width)
    expect(measurement.grid.bottom).toBeLessThanOrEqual(height)
    const pieces = await board.locator('[data-piece] > svg').evaluateAll(elements => elements.map(element => {
      const piece = element.getBoundingClientRect(), square = element.closest('[data-square]').getBoundingClientRect()
      return piece.width <= square.width + 1 && piece.height <= square.height + 1
        && piece.x >= square.x - 1 && piece.y >= square.y - 1 && piece.right <= square.right + 1 && piece.bottom <= square.bottom + 1
    }))
    expect(pieces.every(Boolean)).toBe(true)
    expect(measurement.explanation.bottom).toBeLessThanOrEqual(measurement.notation.y)
    expect(measurement.notation.bottom).toBeLessThanOrEqual(measurement.navigation.y)
    if (width > 760) {
      expect(measurement.grid.width).toBe(779)
      expect(measurement.review.width).toBeGreaterThanOrEqual(320)
      expect(measurement.navigation.bottom).toBeLessThanOrEqual(height)
      expect(measurement.grid.right).toBeLessThanOrEqual(measurement.review.x)
    }
    await page.screenshot({ path: `docs/data/analysis-layout-final-${width}.png` })
    await button('Primo').click(); await expect(board).toHaveAttribute('data-fen', prefix(0))
    await button('Avanti').click(); await expect(board).toHaveAttribute('data-fen', prefix(1))
    await button('Ultimo').click(); await expect(board).toHaveAttribute('data-fen', game.fen())
    await button('Indietro').click(); await expect(board).toHaveAttribute('data-fen', prefix(5))
    await expect(navigation.locator('.move-navigation-position')).toHaveText('5 / 6')
    await board.focus(); await page.keyboard.press('ArrowLeft'); await expect(board).toHaveAttribute('data-fen', prefix(4))
    await page.keyboard.press('ArrowRight'); await expect(board).toHaveAttribute('data-fen', prefix(5))
    await page.locator('.move-button[data-ply="2"]').click()
    await expect(board).toHaveAttribute('data-fen', prefix(2))
    await page.locator('.board-stage [data-square="f1"]').click()
    await page.locator('.board-stage [data-square="c4"]').click()
    await expect(page.locator('.exploration-notice')).toBeVisible()
    await expect(navigation.locator('.move-navigation-position')).toHaveText('3 / 3')
    await button('Primo').click(); await expect(board).toHaveAttribute('data-fen', prefix(0))
    await button('Ultimo').click()
    const variation = new Chess(); variation.move('e4'); variation.move('e5'); variation.move('Bc4')
    await expect(board).toHaveAttribute('data-fen', variation.fen())
    await page.getByRole('button', { name: 'Torna alla partita', exact: true }).click()
    await expect(board).toHaveAttribute('data-fen', game.fen())
    await expect(page.locator('.move-button')).toHaveCount(6)
    await expect(navigation.locator('.move-navigation-position')).toHaveText('6 / 6')
    await page.locator('.board-settings > summary').click()
    await page.getByRole('button', { name: 'Ruota scacchiera', exact: true }).click()
    await expect(board).toHaveAttribute('data-orientation', 'black')
    await expect(page.locator('.engine-bar')).toHaveAttribute('data-orientation', 'black')
    await page.getByRole('button', { name: 'Ruota scacchiera', exact: true }).click()
    await page.locator('.board-settings > summary').click()
    if (width === 390) {
      await navigation.scrollIntoViewIfNeeded()
      for (const name of ['Primo', 'Indietro', 'Avanti', 'Ultimo']) {
        const bounds = await button(name).boundingBox()
        expect(bounds.width).toBeGreaterThanOrEqual(44)
        expect(bounds.height).toBeGreaterThanOrEqual(44)
        await expect(button(name)).toBeInViewport({ ratio: 1 })
      }
    }
    console.log(`${width}x${height}: grid ${measurement.grid.width.toFixed(2)}; square ${measurement.squares[0].width.toFixed(2)}; mouse/keyboard/mainline/variation OK`)
  }
  await page.setViewportSize({ width: 1000, height: 600 })
  await page.reload()
  await expect.poll(async () => (await board.boundingBox()).width).toBeLessThanOrEqual(510)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(errors).toEqual([])
  evidence.checks = ['64 real squares', 'no size controls', 'legacy preference ignored', 'evaluation alignment and rotation',
    'navigation below notation, no duplicates', 'mouse and keyboard navigation', 'mainline and variation restoration',
    '44px mobile navigation buttons', 'smaller desktop viewport', 'no page errors or horizontal overflow']
  writeFileSync('docs/data/analysis-layout-final.json', JSON.stringify(evidence, null, 2) + '\n')
} finally { await browser.close() }
