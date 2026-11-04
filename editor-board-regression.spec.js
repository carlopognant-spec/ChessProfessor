import { test, expect } from '@playwright/test'
import { Chess } from 'chess.js'

const appUrl = 'http://127.0.0.1:4173/ChessProfessor/'
const promotionFen = '7k/P7/8/8/8/8/8/7K w - - 0 1'
const promotions = { q: 'Donna', r: 'Torre', b: 'Alfiere', n: 'Cavallo' }

async function openSection(page, selector) {
  for (const name of ['.tools-menu', selector]) {
    const details = page.locator(name)
    if (await details.count() && !await details.evaluate(element => element.open)) {
      await details.locator(':scope > summary').click()
    }
  }
}

async function loadPosition(page, fen = promotionFen) {
  await openSection(page, '.tools-editor')
  await page.getByRole('textbox', { name: 'FEN', exact: true }).fill(fen)
  await page.getByRole('button', { name: 'Applica posizione', exact: true }).click()
  await page.locator('.tools-editor > summary').click()
  await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', fen)
}

async function importGame(page, pgn) {
  await openSection(page, '.tools-game')
  await page.getByRole('textbox', { name: 'PGN da importare', exact: true }).fill(pgn)
  await page.getByRole('button', { name: 'Importa PGN', exact: true }).click()
}

async function hints(page, square = 'e4') {
  return page.locator(`.board-stage [data-square="${square}"]`).evaluate(element =>
    [element, ...element.querySelectorAll('*')].some(node => getComputedStyle(node).backgroundImage.includes('radial-gradient')))
}

async function dragPawn(page) {
  const from = page.locator('.board-stage [data-square="a7"] [data-piece="wP"]')
  const to = page.locator('.board-stage [data-square="a8"]')
  await from.scrollIntoViewIfNeeded()
  const source = await from.boundingBox(), target = await to.boundingBox()
  await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2)
  await page.mouse.down()
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 12 })
  await page.mouse.up()
  // dnd-kit suppresses document clicks for 50 ms after drop, including clicks on the new dialog.
  await page.waitForTimeout(60)
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const NativeWorker = window.Worker
    window.Worker = class extends NativeWorker {
      constructor(url, options) {
        if (String(url).includes('stockfish-')) throw Error('Unexpected Stockfish search in editor regression')
        super(url, options)
      }
    }
  })
  await page.route('https://explorer.lichess.ovh/**', route => route.fulfill({ json: { white: 0, draws: 0, black: 0, moves: [] } }))
  await page.goto(appUrl)
})

test('copy current FEN and draft independently, preserve input and report clipboard failures', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message))
  await page.evaluate(() => {
    window.copiedFens = []
    window.rejectCopy = false
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async value => {
        if (window.rejectCopy) throw new DOMException('Permission denied', 'NotAllowedError')
        window.copiedFens.push(value)
      },
    } })
  })
  await openSection(page, '.tools-editor')
  const field = page.getByRole('textbox', { name: 'FEN', exact: true })
  await field.fill(promotionFen)
  await page.getByRole('button', { name: 'Copia FEN corrente', exact: true }).click()
  await expect(field).toHaveValue(promotionFen)
  await expect(page.locator('.position-editor [role="status"]')).toHaveText('FEN corrente copiata negli appunti.')
  expect(await page.evaluate(() => window.copiedFens.at(-1))).toBe(new Chess().fen())
  await page.getByRole('button', { name: 'Copia bozza FEN', exact: true }).click()
  expect(await page.evaluate(() => window.copiedFens.at(-1))).toBe(promotionFen)
  await expect(page.locator('.position-editor [role="status"]')).toHaveText('Bozza FEN copiata negli appunti.')
  await page.evaluate(() => { window.rejectCopy = true })
  await page.getByRole('button', { name: 'Copia bozza FEN', exact: true }).click()
  await expect(page.locator('.position-editor [role="status"]')).toContainText('Copia non riuscita: Permission denied')
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined }))
  await page.getByRole('button', { name: 'Copia FEN corrente', exact: true }).click()
  await expect(page.locator('.position-editor [role="status"]')).toContainText('non disponibile')
  await expect(field).toHaveValue(promotionFen)
  expect(errors).toEqual([])
})

test('import, repeated same-FEN import, reset and navigation clear legal-move hints', async ({ page }) => {
  await page.locator('.board-stage [data-square="e2"]').click()
  expect(await hints(page)).toBe(true)
  const pgn = '1. Nf3 Nf6 2. Ng1 Ng8 *'
  await importGame(page, pgn)
  expect(await hints(page)).toBe(false)
  const fen = await page.locator('.board-stage').getAttribute('data-fen')
  await page.locator('.board-stage [data-square="e2"]').click()
  expect(await hints(page)).toBe(true)
  await importGame(page, pgn)
  await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', fen)
  expect(await hints(page)).toBe(false)
  await page.locator('.board-stage [data-square="e2"]').click()
  await page.getByRole('button', { name: 'Indietro', exact: true }).click()
  expect(await hints(page)).toBe(false)
  await page.getByRole('button', { name: 'Reset partita', exact: true }).click()
  await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', new Chess().fen())
  await page.locator('.board-stage [data-square="e2"]').click()
  expect(await hints(page)).toBe(true)
  await page.getByRole('button', { name: 'Reset partita', exact: true }).click()
  expect(await hints(page)).toBe(false)
})

test('click promotion offers all legal pieces, commits only the choice and supports Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 })
  for (const [piece, name] of Object.entries(promotions)) {
    await loadPosition(page)
    await page.locator('.board-stage [data-square="a7"]').click()
    await page.locator('.board-stage [data-square="a8"]').click()
    const dialog = page.getByRole('dialog', { name: 'Scegli la promozione' })
    await expect(dialog).toBeVisible()
    await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', promotionFen)
    for (const choice of Object.values(promotions)) await expect(dialog.getByRole('button', { name: choice, exact: true })).toBeVisible()
    await dialog.getByRole('button', { name, exact: true }).click()
    await expect(dialog).not.toBeVisible()
    expect(new Chess(await page.locator('.board-stage').getAttribute('data-fen')).get('a8')).toMatchObject({ type: piece, color: 'w' })
  }
  await loadPosition(page)
  await page.locator('.board-stage [data-square="a7"]').click()
  await page.locator('.board-stage [data-square="a8"]').click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', promotionFen)
  await expect(page.locator('.board-stage')).toBeFocused()
})

test('drag promotion supports every underpromotion and cancel leaves the pawn in place', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  for (const [piece, name] of Object.entries(promotions)) {
    await loadPosition(page)
    await dragPawn(page)
    const dialog = page.getByRole('dialog', { name: 'Scegli la promozione' })
    await expect(dialog).toBeVisible()
    await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', promotionFen)
    await dialog.getByRole('button', { name, exact: true }).click()
    await expect(dialog).not.toBeVisible()
    expect(new Chess(await page.locator('.board-stage').getAttribute('data-fen')).get('a8')).toMatchObject({ type: piece, color: 'w' })
  }
  await loadPosition(page)
  await dragPawn(page)
  await page.getByRole('button', { name: 'Annulla promozione', exact: true }).click()
  await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', promotionFen)
  await expect(page.locator('.board-stage [data-square="a7"] [data-piece="wP"]')).toBeVisible()
})
