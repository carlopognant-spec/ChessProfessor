import { test, expect } from '@playwright/test'
import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Chess } from 'chess.js'

const summaries = []
const phase = process.env.P0_PHASE || 'before'
for (const scenario of (process.env.P0_REAL ? ['derived87'] : ['resignation55', 'derived87'])) {
const fixture = scenario === 'resignation55' ? 'Partite/Confermate/personal-04/partita.pgn' : 'Partite/Confermate/Storiche/game-2-saintamant-staunton-1843/partita.pgn'
const game = new Chess(); game.loadPgn(readFileSync(fixture, 'utf8'))
if (scenario === 'derived87') { const moves = game.history().slice(0,87); game.reset(); for (const san of moves) game.move(san); game.setHeader('Event','P0 derived 87-ply prefix; not original result'); game.setHeader('Result','*') }
const pgn = game.pgn()
const history = game.history(), endFen = game.fen(), continuation = game.moves({ verbose: true })[0]
test.setTimeout(90000)
for (const mode of (process.env.P0_REAL ? ['real'] : ['off', 'sentinel'])) test(`long game ${scenario} ${mode}`, async ({ page, context }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message))
  await page.route('https://explorer.lichess.ovh/**', r => r.fulfill({ json: { white: 0, draws: 0, black: 0, moves: [] } }))
  await page.addInitScript(mode => {
    const a = window.p0 = { frames: [], tasks: [], commits: [], workers: [], actions: [], settled: [] }
    let last = performance.now()
    function frame(t) { if (a.measuring) a.frames.push({ t, gap: t - last }); last = t; requestAnimationFrame(frame) }
    requestAnimationFrame(frame)
    new PerformanceObserver(list => { if (a.measuring) for (const e of list.getEntries()) a.tasks.push({ t: e.startTime, duration: e.duration }) }).observe({ type: 'longtask', buffered: true })
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { supportsFiber: true, renderers: new Map(), inject(r) { this.renderers.set(1, r); return 1 }, onCommitFiberRoot() { if (a.measuring) a.commits.push(performance.now()) }, onCommitFiberUnmount() {} }
    document.addEventListener('keydown', e => { if (a.measuring) a.actions.push({ t: performance.now(), key: e.key, repeat: e.repeat, trusted: e.isTrusted }) }, true)
    const Native = Worker
    window.Worker = class extends Native {
      constructor(url, options) {
        const sf = String(url).includes('stockfish-')
        if (sf && mode === 'sentinel') super(URL.createObjectURL(new Blob([`onmessage=e=>{if(e.data==='uci'){postMessage('id name P0 sentinel (no search)');postMessage('uciok')}if(e.data==='isready')postMessage('readyok');if(e.data==='stop')postMessage('bestmove (none)')}`], { type: 'text/javascript' })), options)
        else super(url, options)
        this.sf = sf
        if (sf) this.addEventListener('message', e => { if (String(e.data).startsWith('bestmove') || /nodes \d+/.test(String(e.data))) a.workers.push({ t: performance.now(), response: String(e.data) }) })
      }
      postMessage(m, ...rest) { if (this.sf) a.workers.push({ t: performance.now(), m }); return super.postMessage(m, ...rest) }
    }
  }, mode)
  await page.goto('http://127.0.0.1:4173/ChessProfessor/')
  await page.getByRole('button', { name: 'Importa partita', exact: true }).click()
  await page.getByRole('textbox', { name: 'PGN da importare' }).fill(pgn)
  await page.getByRole('button', { name: 'Importa PGN', exact: true }).click()
  await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', endFen)
  if (mode !== 'off') {
    await page.locator('details').evaluateAll(es => es.forEach(e => { if(e.textContent.includes('Avvia analisi')) e.open = true }));
    await page.getByRole('button', { name: 'Avvia analisi', exact: true }).click()
    await page.waitForFunction(() => window.p0.workers.some(x => String(x.m).startsWith('go ')), null, { timeout: 15000 })
  }
  const cdp = await context.newCDPSession(page)
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.start')
  await page.locator('.board-stage').focus()
  await page.evaluate(() => { window.p0.measuring = true; window.p0.start = performance.now() })
  for (let i = 0; i < 40; i++) { await page.keyboard.down('ArrowLeft'); await page.waitForTimeout(30) }
  await page.keyboard.up('ArrowLeft'); await page.waitForTimeout(350)
  const expected = new Chess(); for (const san of history.slice(0, history.length - 40)) expected.move(san)
  const afterKeyboard = await page.locator('.board-stage').getAttribute('data-fen')
  const settled = async label => {
    await page.waitForTimeout(250)
    return page.evaluate(label => {
      const b = document.querySelector('.board-stage').getBoundingClientRect()
      const pieces = [...document.querySelectorAll('[data-piece]')].filter(e => e.getBoundingClientRect().width > 0)
      const outside = pieces.map(e => { const r = (e.querySelector('svg') || e).getBoundingClientRect(); return { piece: e.dataset.piece, x: r.x, y: r.y, w: r.width, h: r.height } }).filter(r => r.x < b.x - 2 || r.y < b.y - 2 || r.x + r.w > b.right + 2 || r.y + r.h > b.bottom + 2)
      return { label, pieces: pieces.length, outside, fen: document.querySelector('.board-stage').dataset.fen }
    }, label)
  }
  const positions = [await settled('keyboard')]
  for (let i = 0; i < 8; i++) { await page.getByRole('button', { name: 'Avanti', exact: true }).click(); await page.waitForTimeout(30) }
  positions.push(await settled('mouse'))
  const back = page.getByRole('button', { name: 'Indietro', exact: true }); await back.hover(); await page.mouse.down(); await page.waitForTimeout(800); await page.mouse.up()
  positions.push(await settled('mouse-hold'))
  await page.locator('.board-settings > summary').click()
  await page.getByRole('button', { name: 'Ruota scacchiera', exact: true }).click()
  await page.evaluate(() => window.scrollTo(0, 250)); positions.push(await settled('rotated-scrolled'))
  await page.locator(`.move-button[data-ply="${history.length}"]`).click(); await page.waitForTimeout(250)
  const goBeforeContinuation = await page.evaluate(() => window.p0.workers.filter(x => String(x.m).startsWith('go ')).length)
  await page.locator(`[data-square="${continuation.from}"]`).click(); await page.locator(`[data-square="${continuation.to}"]`).click()
  game.move({ from: continuation.from, to: continuation.to, promotion: continuation.promotion }); const continuationFen = game.fen(); game.undo()
  const continuedFen = await page.locator('.board-stage').getAttribute('data-fen')
  await expect(page.getByText(/Continuazione ipotetica: analisi automatica sospesa/)).toBeAttached()
  if (mode !== 'off') await page.waitForFunction(() => window.p0.workers.some(x => x.m === 'stop'), null, { timeout: 5000 })
  // Count after the exploration commit and automatic cancel, excluding original-game work before the move commits.
  const postContinuation = await page.evaluate(() => ({ t: performance.now(), go: window.p0.workers.filter(x => String(x.m).startsWith('go ')).length }))
  positions.push(await settled('legal-continuation'))
  const data = await page.evaluate(() => { window.p0.measuring = false; window.p0.end = performance.now(); return window.p0 })
  const profile = (await cdp.send('Profiler.stop')).profile
  const weights = new Map(); for (let i = 0; i < (profile.samples || []).length; i++) weights.set(profile.samples[i], (weights.get(profile.samples[i]) || 0) + (profile.timeDeltas[i] || 0))
  const nodes = new Map(profile.nodes.map(n => [n.id, n]))
  const inclusive = id => (weights.get(id) || 0) + (nodes.get(id).children || []).reduce((s, id) => s + inclusive(id), 0)
  const top = profile.nodes.filter(n => /\/src\/|chess\.js|react-chessboard/.test(n.callFrame.url)).map(n => ({ name: n.callFrame.functionName, url: n.callFrame.url, line: n.callFrame.lineNumber + 1, selfMs: (weights.get(n.id) || 0) / 1000, inclusiveMs: inclusive(n.id) / 1000 })).sort((a, b) => b.inclusiveMs - a.inclusiveMs).slice(0, 30)
  const summary = { scenario, mode, keyboardObserved: data.actions, goBeforeContinuation, postContinuation, fixture, plies: history.length, result: game.getHeaders().Result, termination: game.getHeaders().Termination, gameOver: game.isGameOver(), keyboardEvents: 40, keyboardExpectedFen: expected.fen(), afterKeyboard, continuation, continuedFen, continuationFen, positions, durationMs: data.end - data.start, commits: data.commits.length, longTasks: data.tasks, maxRafGapMs: Math.max(0, ...data.frames.map(f => f.gap)), workerGo: data.workers.filter(x => String(x.m).startsWith('go ')).length, top, errors }
  const raw = join(tmpdir(), `p0-long-game-${phase}-${scenario}-${mode}.json`); writeFileSync(raw, JSON.stringify({ summary, data, profile }, null, 2)); summary.rawProfile = raw
  summaries.push(summary)
  console.log(JSON.stringify(summary))
  if (positions.some(p => p.outside.length)) await page.screenshot({ path: join(tmpdir(), `p0-long-game-${phase}-${mode}.png`), fullPage: true })
  expect(data.workers.filter(x => String(x.m).startsWith('go ')).length).toBe(postContinuation.go)
  expect(errors).toEqual([]); expect(afterKeyboard).toBe(expected.fen()); expect(continuedFen).toBe(continuationFen)
  expect(positions.every(p => p.pieces > 0 && p.outside.length === 0)).toBe(true)
})
}
test.afterAll(() => writeFileSync(`docs/data/p0-long-game-${phase}${process.env.P0_REAL ? '-real' : ''}.json`, JSON.stringify({ phase, environment: 'Dev4173; headless Edge; CDP sampling + React hook overhead; sentinel holds UCI go without real CPU search; optional real mode uses unchanged application budget. Mouse hold is observed native behavior, no invented repeat.', limitation: 'No authentic 87-ply resignation found in local small PGNs; 55-ply genuine resignation and derived 87-ply prefix of local 132-ply historical game used separately.', summaries }, null, 2)))
