import { test, expect } from '@playwright/test'
import { readFileSync, writeFileSync } from 'node:fs'
import { Chess } from 'chess.js'

const fixture = 'Partite/Confermate/Storiche/game-2-saintamant-staunton-1843/partita.pgn'
const game = new Chess()
game.loadPgn(readFileSync(fixture, 'utf8'))
const moves = game.history().slice(0, 87)
game.reset()
for (const san of moves) game.move(san)
game.setHeader('Event', 'P0 derived 87-ply resource check; not original incident')
game.setHeader('Result', '*')

test('bounded repeated navigation resource lifecycle and real-engine cancellation', async ({ page, context }) => {
  test.setTimeout(90000)
  const errors = [], snapshots = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route('https://explorer.lichess.ovh/**', route => route.fulfill({ json: { white: 0, draws: 0, black: 0, moves: [] } }))
  await page.addInitScript(() => {
    const data = window.p0Resources = { workers: [], commands: [] }
    const NativeWorker = window.Worker
    window.Worker = class extends NativeWorker {
      constructor(url, options) {
        super(url, options)
        this.resourceId = data.workers.length
        data.workers.push({ id: this.resourceId, url: String(url), createdAt: performance.now(), terminatedAt: null })
      }
      postMessage(command, ...rest) {
        if (typeof command === 'string' && (command.startsWith('go ') || command === 'stop')) data.commands.push({ id: this.resourceId, command, at: performance.now() })
        return super.postMessage(command, ...rest)
      }
      terminate() {
        data.workers[this.resourceId].terminatedAt ??= performance.now()
        return super.terminate()
      }
    }
  })
  await page.goto('http://127.0.0.1:4173/ChessProfessor/')
  await page.getByRole('button', { name: 'Importa partita', exact: true }).click()
  await page.getByRole('textbox', { name: 'PGN da importare' }).fill(game.pgn())
  await page.getByRole('button', { name: 'Importa PGN', exact: true }).click()
  const board = page.locator('.board-stage')
  await expect(board).toHaveAttribute('data-fen', game.fen())
  const cdp = await context.newCDPSession(page)
  await cdp.send('HeapProfiler.enable')
  const snapshot = async label => {
    await page.waitForTimeout(300)
    await cdp.send('HeapProfiler.collectGarbage')
    const dom = await cdp.send('Memory.getDOMCounters')
    const heap = await cdp.send('Runtime.getHeapUsage')
    const workers = await page.evaluate(() => ({ created: window.p0Resources.workers.length, terminated: window.p0Resources.workers.filter(w => w.terminatedAt !== null).length }))
    const value = { label, ...dom, usedHeapBytes: heap.usedSize, totalHeapBytes: heap.totalSize, workers: { ...workers, active: workers.created - workers.terminated }, fen: await board.getAttribute('data-fen') }
    snapshots.push(value)
    return value
  }
  const cycle = async (label, expectedFen) => {
    await board.focus()
    for (const key of ['ArrowLeft', 'ArrowRight']) {
      for (let i = 0; i < 12; i++) await page.keyboard.down(key)
      await page.keyboard.up(key)
    }
    await expect(board).toHaveAttribute('data-fen', expectedFen)
    return snapshot(label)
  }
  // Warm navigation first so lazy rendering and listeners are present before measuring retention.
  await cycle('off-warmup', game.fen())
  const off = []
  for (let i = 0; i < 8; i++) off.push(await cycle(`off-${i + 1}`, game.fen()))

  await page.locator('details').evaluateAll(elements => elements.forEach(element => { if (element.textContent.includes('Avvia analisi')) element.open = true }))
  await page.getByRole('button', { name: 'Avvia analisi', exact: true }).click()
  await page.waitForFunction(() => window.p0Resources.commands.some(c => c.command.startsWith('go ')), null, { timeout: 15000 })
  await cycle('real-engine-navigation', game.fen())
  const continuation = game.moves({ verbose: true })[0]
  const continued = new Chess(game.fen())
  continued.move(continuation)
  const explorationStartedAt = await page.evaluate(() => performance.now())
  await page.locator(`[data-square="${continuation.from}"]`).click()
  await page.locator(`[data-square="${continuation.to}"]`).click()
  await expect(board).toHaveAttribute('data-fen', continued.fen())
  await expect(page.getByText(/Continuazione ipotetica: analisi automatica sospesa/)).toBeAttached()
  await page.waitForFunction(start => window.p0Resources.commands.some(c => c.command === 'stop' && c.at >= start), explorationStartedAt)
  const cancelledAt = await page.evaluate(start => window.p0Resources.commands.find(c => c.command === 'stop' && c.at >= start).at, explorationStartedAt)
  const cancelled = await snapshot('cancelled')
  const afterCancel = []
  for (let i = 0; i < 4; i++) afterCancel.push(await cycle(`cancelled-${i + 1}`, continued.fen()))
  const instrumentation = await page.evaluate(() => window.p0Resources)
  const goAfterCancel = instrumentation.commands.filter(c => c.command.startsWith('go ') && c.at > cancelledAt)
  const plateau = values => ({ min: Math.min(...values), max: Math.max(...values), first: values[0], last: values.at(-1) })
  const ranges = Object.fromEntries(['nodes', 'jsEventListeners', 'usedHeapBytes'].map(key => [key, { off: plateau(off.map(s => s[key])), cancelled: plateau(afterCancel.map(s => s[key])) }]))
  const evidence = {
    measuredAt: new Date().toISOString(), environment: 'Dev4173; headless Edge; native real Worker wrapper; CDP forced GC before every snapshot',
    fixture, fixtureKind: 'Derived first 87 plies, Result *; authentic incident PGN unavailable',
    protocol: { offCycles: 8, warmupCycles: 1, activeEngineCycles: 1, cancelledCycles: 4, keydownEventsPerCycle: 24, idleMsBeforeGC: 300 },
    snapshots, ranges, workers: instrumentation.workers, engineCommands: instrumentation.commands, cancelledAt, goAfterCancel, pageErrors: errors,
    limits: [
      'Bounded retention smoke check, not a leak proof, engine benchmark, or reproduction of Wait/Close or displaced king.',
      'Worker active counts mean construction minus explicit terminate calls; worker self-close, process memory, GPU/WASM/native memory and document teardown are not measured.',
      'CDP DOM/listener counters are aggregate and forced-GC JS heap is only the main target; no claim of per-component listener attribution or all-worker heap coverage.',
      'Coarse DOM/listener retention guards permit max(1000 nodes, 20 percent) and max(100 listeners, 20 percent) drift from the first measured cycle. Heap is recorded without a noise-sensitive assertion.',
    ],
  }
  writeFileSync('docs/data/p0-resource-lifecycle.json', JSON.stringify(evidence, null, 2))
  console.log(JSON.stringify({ ranges, workers: instrumentation.workers.length, go: instrumentation.commands.filter(c => c.command.startsWith('go ')).length, goAfterCancel: goAfterCancel.length, pageErrors: errors }))
  expect(errors).toEqual([])
  expect(goAfterCancel).toEqual([])
  expect(off.every(s => s.workers.created === off[0].workers.created && s.workers.active === off[0].workers.active)).toBe(true)
  expect(afterCancel.every(s => s.workers.created === cancelled.workers.created && s.workers.active <= cancelled.workers.active)).toBe(true)
  for (const samples of [off, afterCancel]) {
    for (const [key, allowance] of [['nodes', 1000], ['jsEventListeners', 100]]) {
      expect(Math.max(...samples.map(s => s[key]))).toBeLessThanOrEqual(samples[0][key] + Math.max(allowance, samples[0][key] * 0.2))
    }
  }
})
