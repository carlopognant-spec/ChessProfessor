import { test, expect } from '@playwright/test'
import { Chess } from 'chess.js'
import { createAnalysisMetadata } from './src/lib/analysisMetadata.js'

const appUrl = 'http://127.0.0.1:4173/ChessProfessor/'
const uci = m => m.from + m.to + (m.promotion ?? '')

async function openPractice(page, { pgn = '1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 *', allErrors = false, mode = 'normal', current = false, refined = false, legacyNonError = false } = {}) {
  const source = new Chess(); source.loadPgn(pgn)
  const game = new Chess(source.getHeaders().FEN), packets = {}, entries = []
  for (const [i, san] of source.history().entries()) {
    const fenBefore = game.fen(), legal = game.moves({ verbose: true }).map(uci)
    const original = uci(game.move(san))
    const best = legal.includes('a7a8q') ? 'a7a8q' : legal.includes('f1b5') ? 'f1b5' : legal.find(m => m !== original)
    packets[fenBefore] = { legal, original, best, reply: best === 'f1b5' ? 'a7a6' : null }
    entries.push({ ply: i + 1, playedMove: san, side: fenBefore.split(' ')[1], fenBefore, fenAfter: game.fen(),
      classification: allErrors || i === 4 ? 'blunder' : 'good',
      engine: { evalCp: 9999 }, playedEngine: { evalCp: -9999 } })
  }
  const finalLegal = game.moves({ verbose: true }).map(uci)
  packets[game.fen()] = { legal: finalLegal, original: null, best: finalLegal[0] }
  if (current) for (const entry of entries) {
    const analysisMetadata = createAnalysisMetadata()
    entry.analysisMetadata = analysisMetadata
    entry.engine = { evalCp: refined ? 0 : 300, analysisMetadata }
    entry.playedEngine = { evalCp: refined ? 0 : 300, analysisMetadata }
  }
  if (refined) entries[4].refinement = { version: 'optional-refinement-v1',
    engine: { fen: entries[4].fenBefore, evalCp: 300, analysisMetadata: createAnalysisMetadata({ nodes: 1000000 }) },
    playedEngine: { fen: entries[4].fenAfter, evalCp: 300, analysisMetadata: createAnalysisMetadata({ nodes: 1000000 }) } }
  if (legacyNonError) {
    entries[4].classification = 'good'
    entries[4].engine = { evalCp: 300 }
    entries[4].playedEngine = { evalCp: 300 }
  }
  await page.addInitScript(({ packets, mode }) => {
    window.practiceCommands = []; window.practiceWorkers = 0; window.practiceMode = mode
    window.Worker = class {
      constructor() { window.practiceWorkers++; this.multiPv = 2 }
      postMessage(command) {
        window.practiceCommands.push(command)
        if (command === 'uci') queueMicrotask(() => this.onmessage?.({ data: 'uciok' }))
        if (command === 'isready') queueMicrotask(() => this.onmessage?.({ data: 'readyok' }))
        if (command.startsWith('setoption name MultiPV')) this.multiPv = Number(command.split(' ').at(-1))
        if (command.startsWith('position fen ')) this.fen = window.decodePositionCommand(command)
        if (command.startsWith('go ')) {
          const data = packets[this.fen]
          if (window.practiceMode === 'failure') {
            window.practiceMode = 'normal'
            queueMicrotask(() => this.onerror?.({})); return
          }
          if (!data) throw Error(`Unmapped simulated position: ${this.fen}`)
          const restricted = command.match(/ searchmoves (.+)/)?.[1].split(' ')
          const score = move => move === data.original ? (window.practiceMode === 'no-error' ? 299 : -300)
            : move === 'b2b3' ? -400 : move === data.best ? 300 : 295
          const moves = (restricted ?? [data.best, data.original, ...data.legal.filter(m => ![data.best, data.original].includes(m))])
            .sort((a, b) => score(b) - score(a)).slice(0, this.multiPv)
          this.lastBest = moves[0]
          const lines = moves.map((move, i) => `info depth 12 multipv ${i + 1} score cp ${score(move)} nodes 200000 pv ${move}${move === data.best && data.reply ? ' ' + data.reply : ''}`)
          if (window.practiceMode === 'incomplete' || window.incompleteNext) { lines.pop(); window.incompleteNext = false }
          const delay = window.practiceMode === 'slow' || window.delayNext ? 500 : 2
          window.delayNext = false
          this.timer = setTimeout(() => {
            for (const line of lines) this.onmessage?.({ data: line })
            this.onmessage?.({ data: `bestmove ${moves[0]}` })
          }, delay)
        }
        if (command === 'stop') {
          clearTimeout(this.timer)
          setTimeout(() => {
            this.onmessage?.({ data: 'info depth 99 score cp 999 nodes 999999 pv a1a8' })
            this.onmessage?.({ data: `bestmove ${this.lastBest ?? 'e2e4'}` })
          }, 30)
        }
      }
      terminate() { clearTimeout(this.timer) }
    }
  }, { packets, mode })
  await page.goto(appUrl)
  await page.evaluate(async ({ pgn, entries }) => {
    const { createGameArchive } = await import('/ChessProfessor/src/lib/gameArchive.js')
    const archive = createGameArchive()
    await archive.save({ pgn, analysisEntries: entries, title: 'Esercizi da vecchia analisi' }); await archive.close()
  }, { pgn: source.pgn(), entries })
  await page.reload()
  await page.evaluate(async () => {
    const { decodePositionCommand } = await import('/ChessProfessor/src/lib/analysisHistory.js')
    window.decodePositionCommand = decodePositionCommand
  })
  await page.locator('.tools-menu > summary').click()
  await page.locator('.tools-game > summary').click()
  await page.locator('.game-archive > summary').click()
  await page.getByRole('button', { name: 'Apri', exact: true }).click()
  await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', source.fen())
  if (refined) {
    await page.getByRole('checkbox', { name: 'Mostra analisi approfondita', exact: true }).check()
    await page.getByRole('button', { name: 'Riprova posizione 5', exact: true }).click()
  } else await page.getByRole('button', { name: 'Ripassa i miei errori', exact: true }).click()
  const panel = page.locator('.review-practice')
  await expect(panel).toBeVisible()
  return { panel, originalFen: source.fen(), originalPgn: source.pgn() }
}

async function ready(panel) { await expect(panel).toHaveAttribute('data-practice-status', 'ready') }
async function play(panel, san) {
  await panel.getByLabel('Mossa SAN', { exact: true }).fill(san)
  await panel.getByRole('button', { name: 'Verifica mossa', exact: true }).click()
}

test('legacy errors are freshly verified, played on the board, and never change the original game', async ({ page }) => {
  const { panel, originalFen, originalPgn } = await openPractice(page)
  await ready(panel)
  await expect(panel.getByRole('region', { name: 'Scacchiera della pratica', exact: true })).toHaveClass('practice-board')
  await panel.getByRole('combobox', { name: 'Orientamento scacchiera', exact: true }).selectOption('black')
  await expect(panel).not.toContainText('In partita hai giocato')
  await expect(page.locator('.engine-eval-label')).toBeHidden()
  await expect(panel.locator('.practice-explanation')).toHaveCount(0)
  expect(await page.evaluate(() => window.practiceWorkers)).toBe(1)
  expect(await page.evaluate(() => window.practiceCommands.filter(c => c.startsWith('position '))))
    .toEqual(Array(2).fill(`position fen ${new Chess().fen()} moves e2e4 e7e5 g1f3 b8c6`))
  await panel.locator('[data-square="f1"]').click()
  await panel.locator('[data-square="b5"]').click()
  await expect(panel).toHaveAttribute('data-practice-status', 'correct')
  await expect(panel).toContainText('In partita hai giocato Bc4')
  await panel.getByRole('button', { name: 'Mostra risposta avversaria' }).click()
  await expect(panel.locator('.practice-board')).not.toHaveAttribute('data-fen', originalFen)
  await panel.getByRole('button', { name: 'Chiudi pratica' }).click()
  await expect(page.locator('.board-stage')).toBeVisible()
  await expect(page.locator('.board-stage')).toHaveAttribute('data-fen', originalFen)
  const saved = await page.evaluate(async () => {
    const { createGameArchive } = await import('/ChessProfessor/src/lib/gameArchive.js')
    const archive = createGameArchive(); const result = (await archive.list())[0]; await archive.close(); return result
  })
  expect(saved.pgn).toBe(originalPgn)
  expect(saved.analysisEntries[4].engine.evalCp).toBe(9999)
})

test('alternative outside the root choices is checked by Stockfish and progress survives reload', async ({ page }) => {
  const { panel } = await openPractice(page)
  await ready(panel)
  await play(panel, 'a3')
  await expect(panel).toHaveAttribute('data-practice-status', 'correct')
  expect(await page.evaluate(() => window.practiceCommands.filter(c => c.includes('searchmoves'))))
    .toEqual(['go nodes 200000 searchmoves f1b5 f1c4', 'go nodes 200000 searchmoves f1b5 a2a3'])
  await expect(panel).toContainText('1 risolte senza aiuti')
  await page.reload()
  await page.evaluate(async () => {
    window.decodePositionCommand = (await import('/ChessProfessor/src/lib/analysisHistory.js')).decodePositionCommand
  })
  await page.locator('.tools-menu > summary').click(); await page.locator('.tools-game > summary').click()
  await page.locator('.game-archive > summary').click(); await page.getByRole('button', { name: 'Apri', exact: true }).click()
  await page.getByRole('button', { name: 'Ripassa i miei errori', exact: true }).click()
  await ready(page.locator('.review-practice'))
  await expect(page.locator('.practice-progress')).toContainText('1 risolte senza aiuti')
})

test('hints are progressive, solution viewing is separate from unaided success', async ({ page }) => {
  const { panel } = await openPractice(page)
  await ready(panel)
  await panel.getByRole('button', { name: 'Suggerimento 1', exact: true }).click()
  await expect(panel.locator('.practice-hint')).toContainText('Confronta scacchi')
  await expect(panel).not.toContainText('La mossa suggerita è Bb5')
  await panel.getByRole('button', { name: 'Suggerimento 2', exact: true }).click()
  await expect(panel.locator('.practice-hint')).toContainText('f1')
  await panel.getByRole('button', { name: 'Mostra soluzione', exact: true }).click()
  await expect(panel.locator('.practice-hint')).toContainText('Bb5')
  await expect(panel.locator('.practice-progress')).toContainText('0 risolte senza aiuti')
  await expect(panel.locator('.practice-progress')).toContainText('Soluzioni mostrate: 1')
})

test('an incomplete alternative comparison never counts as a mistake and can be retried', async ({ page }) => {
  const { panel } = await openPractice(page)
  await ready(panel)
  await page.evaluate(() => { window.incompleteNext = true })
  await play(panel, 'a3')
  await expect(panel).toHaveAttribute('data-practice-status', 'inconclusive')
  await expect(panel.locator('.practice-progress')).toContainText('0 tentativi')
  await expect(panel.locator('.practice-progress')).toContainText('0 errori')
  await panel.getByRole('button', { name: 'Riprova verifica' }).click()
  await ready(panel); await play(panel, 'a3')
  await expect(panel).toHaveAttribute('data-practice-status', 'correct')
})

test('interruption drains old messages and does not contaminate the next request', async ({ page }) => {
  const { panel } = await openPractice(page)
  await ready(panel)
  await page.evaluate(() => { window.delayNext = true })
  await play(panel, 'a3')
  await panel.getByRole('button', { name: 'Interrompi verifica' }).click()
  await expect(panel).toHaveAttribute('data-practice-status', 'inconclusive')
  await panel.getByRole('button', { name: 'Riprova verifica' }).click()
  await ready(panel); await play(panel, 'b3')
  await expect(panel).toHaveAttribute('data-practice-status', 'incorrect')
  await expect(panel.locator('.practice-progress')).toContainText('1 errori')
  expect(await page.evaluate(() => window.practiceCommands.filter(c => c === 'stop').length)).toBeGreaterThan(0)
})

test('worker failure has no penalty and restarts only at the user request', async ({ page }) => {
  const { panel } = await openPractice(page)
  await ready(panel)
  await page.evaluate(() => { window.practiceMode = 'failure' })
  await play(panel, 'a3')
  await expect(panel.getByRole('button', { name: 'Riavvia motore', exact: true })).toBeVisible()
  await panel.getByRole('button', { name: 'Riavvia motore', exact: true }).click()
  await expect(panel.getByRole('button', { name: 'Riprova verifica' })).toBeEnabled()
  await panel.getByRole('button', { name: 'Riprova verifica' }).click()
  await ready(panel); await play(panel, 'a3')
  await expect(panel).toHaveAttribute('data-practice-status', 'correct')
  await expect(panel.locator('.practice-progress')).toContainText('0 errori')
  expect(await page.evaluate(() => window.practiceWorkers)).toBe(2)
})

test('a session contains five positions at most and can be completed by skipping', async ({ page }) => {
  const { panel } = await openPractice(page, { pgn: '1. Nf3 Nf6 2. Ng1 Ng8 3. Nf3 Nf6 4. Ng1 Ng8 5. Nf3 Nf6 6. Ng1 Ng8 *', allErrors: true })
  for (let i = 1; i <= 5; i++) {
    await ready(panel)
    await expect(panel.getByRole('heading')).toContainText(`${i}/5`)
    await panel.getByRole('button', { name: 'Salta posizione', exact: true }).click()
  }
  await expect(panel.getByRole('heading')).toHaveText('Sessione di pratica completata')
  await expect(panel.getByRole('listitem')).toHaveCount(5)
})

test('storage failure permits practice and reports that progress is not saved', async ({ page }) => {
  const { panel } = await openPractice(page)
  await ready(panel)
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('full', 'QuotaExceededError') } })
  await play(panel, 'Bb5')
  await expect(panel).toHaveAttribute('data-practice-status', 'correct')
  await expect(panel.getByRole('alert')).toContainText('salvati')
})

test('a formerly current archive can be analyzed again after leaving practice', async ({ page }) => {
  const { panel } = await openPractice(page, { current: true })
  await ready(panel)
  await panel.getByRole('button', { name: 'Chiudi pratica' }).click()
  const previous = await page.evaluate(() => window.practiceCommands.filter(c => c.startsWith('go ')).length)
  await page.getByRole('button', { name: 'Riprendi analisi', exact: true }).click()
  await expect.poll(() => page.evaluate(() => window.practiceCommands.filter(c => c.startsWith('go ')).length)).toBeGreaterThan(previous)
})

test('the single-position action uses errors from the displayed refined analysis', async ({ page }) => {
  const { panel } = await openPractice(page, { current: true, refined: true })
  await ready(panel)
  await expect(panel.getByRole('heading')).toContainText('1/1')
  await play(panel, 'Bb5')
  await expect(panel).toHaveAttribute('data-practice-status', 'correct')
})

test('an old false error is excluded after fresh verification without a penalty', async ({ page }) => {
  const { panel } = await openPractice(page, { mode: 'no-error' })
  await expect(panel).toHaveAttribute('data-practice-status', 'not-applicable')
  await expect(panel).toContainText('non conferma un errore utile')
  await expect(panel.locator('.practice-progress')).toContainText('0 errori')
})

test('knight solution hints remain L-shaped after rotating a mobile practice board without changing progress', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const { panel } = await openPractice(page, { allErrors: true,
    pgn: '[SetUp "1"]\n[FEN "7k/8/7p/8/3N4/8/7P/K7 w - - 0 1"]\n\n1. Ka2 Kh7 *' })
  await ready(panel)
  await panel.getByRole('button', { name: 'Mostra soluzione', exact: true }).click()
  const board = panel.locator('.practice-board'), fen = await board.getAttribute('data-fen')
  const arrow = board.locator('path[marker-end]')
  await expect(arrow).toHaveCount(1)
  expect((await arrow.getAttribute('d')).match(/L/g)).toHaveLength(2)
  const color = await arrow.getAttribute('stroke')
  const progress = await panel.locator('.practice-progress').innerText()
  const searches = await page.evaluate(() => window.practiceCommands.filter(command => command.startsWith('go ')).length)
  await panel.getByRole('button', { name: 'Ruota scacchiera', exact: true }).click()
  await expect(board).toHaveAttribute('data-orientation', 'black')
  await expect(board).toHaveAttribute('data-fen', fen)
  expect((await arrow.getAttribute('d')).match(/L/g)).toHaveLength(2)
  await expect(arrow).toHaveAttribute('stroke', color)
  await expect(panel.locator('.practice-progress')).toHaveText(progress, { useInnerText: true })
  expect(await page.evaluate(() => window.practiceCommands.filter(command => command.startsWith('go ')).length)).toBe(searches)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('underpromotion can be selected when making a move on the practice board', async ({ page }) => {
  const { panel } = await openPractice(page, { allErrors: true,
    pgn: '[SetUp "1"]\n[FEN "7k/P7/8/8/8/8/8/K7 w - - 0 40"]\n\n40. Ka2 Kh7 *' })
  await ready(panel)
  await page.setViewportSize({ width: 390, height: 844 })
  await panel.getByLabel('Promozione per clic e trascinamento').selectOption('n')
  await panel.locator('[data-square="a7"]').click(); await panel.locator('[data-square="a8"]').click()
  await expect(panel).toHaveAttribute('data-practice-status', 'correct')
  await expect(panel.locator('.practice-board')).toHaveAttribute('data-fen', /^N6k\//)
  await expect(panel.locator('[data-square="a8"] [data-piece="wN"]')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: test.info().outputPath('practice-mobile.png'), fullPage: true })
})

test('stale non-error labels are reconsidered as candidates but require fresh engine evidence', async ({ page }) => {
  const { panel } = await openPractice(page, { legacyNonError: true })
  await ready(panel)
  await expect(panel.getByRole('heading')).toContainText('1/1')
  expect(await page.evaluate(() => window.practiceCommands.filter(c => c.startsWith('go ')).length)).toBeGreaterThan(0)
  await play(panel, 'Bb5')
  await expect(panel).toHaveAttribute('data-practice-status', 'correct')
  const original = await page.evaluate(async () => {
    const { createGameArchive } = await import('/ChessProfessor/src/lib/gameArchive.js')
    const archive = createGameArchive(); const record = (await archive.list())[0]; await archive.close()
    return record.analysisEntries[4].classification
  })
  expect(original).toBe('good')
})

test('classification criteria are explained and saved without inventing original legacy criteria', async ({ page }) => {
  const { panel } = await openPractice(page, { current: true })
  await ready(panel)
  await panel.getByRole('button', { name: 'Chiudi pratica' }).click()
  const details = page.locator('.classification-details').first()
  await details.locator(':scope > summary').click()
  await expect(details).toContainText('indice locale')
  await expect(details).toContainText('classification-policy-v1')
  await expect(details).toContainText('criteri originali non erano registrati')
  await expect(details).toContainText('si riproduce')
  await details.getByText('Dati e criteri per la riproduzione', { exact: true }).click()
  await expect(details.locator('pre')).toContainText('cp-logistic-v1')
  await page.getByRole('button', { name: 'Salva partita e analisi', exact: true }).click()
  const saved = await page.evaluate(async () => {
    const { createGameArchive } = await import('/ChessProfessor/src/lib/gameArchive.js')
    const archive = createGameArchive(); const record = (await archive.list())[0]; await archive.close()
    return record.analysisEntries[0]
  })
  expect(saved.classificationDecision.policy.thresholds.mistake).toBe(20)
  expect(saved.classificationOrigin).toMatchObject({ schemaVersion: 0, classification: 'good', policy: null })
})

test('fresh chess explanations appear only after practice reveals the answer and reuse its searches', async ({ page }) => {
  const { panel } = await openPractice(page)
  await ready(panel)
  await expect(panel.getByRole('region', { name: 'Spiegazione scacchistica' })).toHaveCount(0)
  const searches = await page.evaluate(() => window.practiceCommands.filter(c => c.startsWith('go ')).length)
  await panel.getByRole('button', { name: 'Mostra soluzione', exact: true }).click()
  const explanation = panel.getByRole('region', { name: 'Spiegazione scacchistica' })
  await expect(explanation).toBeVisible()
  await expect(explanation).toContainText('Minaccia o opportunità')
  await expect(explanation).toContainText('Bb5')
  await expect(explanation).toContainText('Come può rispondere')
  expect(await page.evaluate(() => window.practiceCommands.filter(c => c.startsWith('go ')).length)).toBe(searches)
})

test('archived analysis exposes limits of missing chess evidence without starting new searches', async ({ page }) => {
  const { panel } = await openPractice(page, { current: true })
  await ready(panel)
  await panel.getByRole('button', { name: 'Chiudi pratica' }).click()
  const searches = await page.evaluate(() => window.practiceCommands.filter(c => c.startsWith('go ')).length)
  const details = page.locator('.classification-details').first()
  await details.locator(':scope > summary').click()
  await details.getByText('Spiegazione scacchistica', { exact: true }).click()
  const explanation = details.getByRole('region', { name: 'Spiegazione scacchistica' })
  await expect(explanation).toContainText('La causa tattica non è dimostrabile dai dati disponibili.')
  await expect(explanation).toContainText('Perché considerare l’alternativa')
  expect(await page.evaluate(() => window.practiceCommands.filter(c => c.startsWith('go ')).length)).toBe(searches)
})
