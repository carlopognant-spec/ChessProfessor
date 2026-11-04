import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { Chess } from 'chess.js'

const url = 'http://127.0.0.1:4173/ChessProfessor/'
const entries = JSON.parse(readFileSync('agent-output/refinement-quality-priority-v2/priority-game-184316820266-round-2.json')).entries
test.use({ hasTouch: true })
for (const width of [1920, 1280, 390]) test(`bar, contextual teaching and layout ${width}`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width, height: width === 1920 ? 1080 : width === 1280 ? 900 : 844 })
  await page.goto(url)
  const game = new Chess(entries[0].fenBefore)
  for (const e of entries) game.move(e.playedMove)
  await page.evaluate(async ({ entries, pgn }) => {
    const { createGameArchive } = await import('/ChessProfessor/src/lib/gameArchive.js')
    const archive = createGameArchive(); await archive.save({ analysisEntries: entries, pgn }); await archive.close()
  }, { entries, pgn: game.pgn() })
  await page.reload()
  for (const selector of ['.tools-menu', '.tools-game', '.game-archive']) {
    await page.locator(`${selector} > summary`).click()
  }
  await page.locator('.game-archive').getByRole('button', { name: 'Apri', exact: true }).click()
  await page.locator('.move-button').nth(24).click()
  const bar = page.locator('.engine-bar'), board = page.locator('.board-stage')
  await expect(bar).toHaveAttribute('data-orientation', 'white')
  const score = await bar.locator('.engine-bar-score').innerText()
  const height = await bar.locator('.engine-bar-fill').evaluate(e => parseFloat(e.style.height))
  await page.locator('.board-settings > summary').click()
  await page.getByRole('button', { name: 'Ruota scacchiera' }).tap()
  await expect(bar).toHaveAttribute('data-orientation', 'black')
  await expect(board).toHaveAttribute('data-orientation', 'black')
  expect(await bar.locator('.engine-bar-fill').evaluate(e => parseFloat(e.style.height))).toBeCloseTo(100 - height)
  await expect(bar.locator('.engine-bar-score')).toHaveText(score)
  expect(await bar.evaluate(e => getComputedStyle(e).backgroundColor)).toBe('rgb(238, 238, 238)')
  const b = await board.boundingBox(), v = await bar.boundingBox()
  expect(v.height).toBeCloseTo(b.height, 0)
  expect(v.x + v.width).toBeLessThanOrEqual(b.x)
  if (width === 1280) expect(b.width).toBeGreaterThan(570)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await expect(page.locator('.board-column .engine-arrow-status')).toHaveCount(0)
  await expect(page.locator('.selected-move')).not.toContainText(/causa tattica non|mossa è legale|illustrativa ma/)
  await page.screenshot({ path: testInfo.outputPath(`analysis-${width}.png`), fullPage: true })
  await page.locator('.engine-workspace > summary').click()
  await expect(page.locator('.engine-eval-label')).not.toContainText(/MultiPV|Valutazione:/)
})

test('original Web Audio tones, persistent toggle, capture and rapid input suppression', async ({ page }) => {
  await page.addInitScript(() => {
    window.tones = []
    const Native = window.AudioContext
    window.AudioContext = class extends Native {
      createOscillator() {
        const voice = super.createOscillator(), start = voice.start.bind(voice)
        voice.start = (...args) => { window.tones.push({ type: voice.type, at: performance.now() }); start(...args) }
        return voice
      }
    }
  })
  await page.goto(url)
  await page.locator('.board-settings > summary').click()
  const toggle = page.getByRole('button', { name: 'Suoni:', exact: false })
  await toggle.tap(); await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  const move = async (from, to) => {
    await page.locator(`[data-square="${from}"]`).tap(); await page.locator(`[data-square="${to}"]`).tap()
    await page.waitForTimeout(200)
  }
  await move('e2', 'e4'); await move('d7', 'd5'); await move('e4', 'd5')
  expect(await page.evaluate(() => window.tones.map(t => t.type))).toEqual(['sine', 'sine', 'triangle'])
  const count = await page.evaluate(() => window.tones.length)
  await page.locator('.board-stage').focus()
  for (let i = 0; i < 12; i++) await page.keyboard.down(i < 6 ? 'ArrowLeft' : 'ArrowRight')
  await page.keyboard.up('ArrowLeft'); await page.keyboard.up('ArrowRight')
  await page.waitForTimeout(400)
  expect(await page.evaluate(() => window.tones.length)).toBeLessThanOrEqual(count + 1)
  await toggle.tap(); const muted = await page.evaluate(() => window.tones.length)
  await page.getByRole('button', { name: 'Indietro', exact: true }).tap()
  await page.waitForTimeout(250)
  expect(await page.evaluate(() => window.tones.length)).toBe(muted)
  await toggle.tap(); await page.reload()
  await page.locator('.board-settings > summary').click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Prova audio' }).tap()
  await expect.poll(() => page.evaluate(() => window.tones.length)).toBe(1)
})
