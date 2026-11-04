import { chromium } from 'playwright'
import { indexedDB } from 'fake-indexeddb'
import { Chess } from 'chess.js'
import { readFileSync, writeFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import { createGameArchive, archiveAnalysisStatus } from '../src/lib/gameArchive.js'

// Compare the same archived navigation on production builds, without engine searches.
const [url, output] = process.argv.slice(2)
assert(url && output, 'Usage: node scripts/measure-analysis-navigation.mjs URL OUTPUT.json')
const entries = JSON.parse(readFileSync(new URL('../agent-output/refinement-quality-priority-v2/priority-game-184316820266-round-2.json', import.meta.url))).entries
const game = new Chess(entries[0].fenBefore)
for (const entry of entries) game.move(entry.playedMove)
const archive = createGameArchive({ indexedDB })
const { record } = await archive.save({ pgn: game.pgn(), analysisEntries: entries })
await archive.close()
assert.equal(archiveAnalysisStatus(record), 'current')
const browser = await chromium.launch({ channel: 'msedge' })
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route('https://explorer.lichess.ovh/**', route => route.fulfill({ json: { white: 0, draws: 0, black: 0, moves: [] } }))
  await page.addInitScript(() => {
    window.navigationAudit = { tasks: [], frames: [], engineWorkers: 0 }
    const NativeWorker = Worker
    window.Worker = class extends NativeWorker {
      constructor(url, options) {
        if (String(url).includes('stockfish-')) { window.navigationAudit.engineWorkers++; throw Error('No engine search in navigation measurement') }
        super(url, options)
      }
    }
    new PerformanceObserver(list => {
      for (const e of list.getEntries()) window.navigationAudit.tasks.push({ t: e.startTime, duration: e.duration })
    }).observe({ type: 'longtask', buffered: true })
    let last
    function frame(t) { if (last) window.navigationAudit.frames.push({ t, gap: t - last }); last = t; requestAnimationFrame(frame) }
    requestAnimationFrame(frame)
  })
  await page.goto(url)
  await page.evaluate(record => new Promise((resolve, reject) => {
    const request = indexedDB.open('chessprofessor-games', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('games', { keyPath: 'id' })
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const db = request.result, tx = db.transaction('games', 'readwrite')
      tx.objectStore('games').put(record)
      tx.oncomplete = () => { db.close(); resolve() }
      tx.onabort = () => reject(tx.error)
    }
  }), record)
  await page.reload()
  for (const selector of ['.tools-menu', '.tools-game', '.game-archive']) {
    const d = page.locator(selector)
    if (await d.count() && !await d.evaluate(e => e.open)) await d.locator(':scope > summary').click()
  }
  await page.getByRole('button', { name: 'Apri', exact: true }).click()
  await page.waitForFunction(() => document.querySelectorAll('.analysis-row-button').length === 66)
  await page.waitForTimeout(1000)
  await page.evaluate(() => { window.navigationAudit.start = performance.now() })
  const clicks = []
  for (let i = 0; i < 8; i++) {
    clicks.push(await page.evaluate(i => {
      const start = performance.now()
      ;[...document.querySelectorAll('button')].find(b => b.textContent === (i % 2 ? 'Avanti' : 'Indietro')).click()
      return performance.now() - start
    }, i))
    await page.waitForTimeout(220)
    assert.equal(await page.locator('.board-stage').getAttribute('data-fen'), i % 2 ? entries.at(-1).fenAfter : entries.at(-1).fenBefore)
  }
  const result = await page.evaluate(() => {
    const a = window.navigationAudit, tasks = a.tasks.filter(e => e.t >= a.start), frames = a.frames.filter(e => e.t >= a.start)
    return { durationMs: performance.now() - a.start, maxLongTaskMs: Math.max(0, ...tasks.map(e => e.duration)), totalLongTaskMs: tasks.reduce((s,e) => s + e.duration, 0), maxRafGapMs: Math.max(0, ...frames.map(e => e.gap)), framesOver25Ms: frames.filter(e => e.gap > 25).length, engineWorkers: a.engineWorkers, tasks }
  })
  assert.equal(result.engineWorkers, 0)
  assert.deepEqual(errors, [])
  const data = { url, viewport: '1280x900', plies: 66, navigationActions: 8, engine: 'blocked; no real searches', mode: 'production; one bounded observation, not a statistical benchmark', ...result, clickHandlerMs: clicks, errors }
  writeFileSync(output, JSON.stringify(data, null, 2) + '\n')
  console.log(JSON.stringify(data))
} finally { await browser.close() }
