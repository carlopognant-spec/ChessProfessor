import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { performance } from 'node:perf_hooks'
import { Chess } from 'chess.js'
import { NativeEngine } from './qa/native-engine.js'
import { completeMultiPv } from './stockfish-complete-multipv.js'
import { classifySimpleSpecial } from './stockfish-specials-simple.js'
import { classifyAnalysisEntries, moveEvaluationFields } from '../src/lib/classification.js'
import { classifyMissedOpportunity } from '../src/lib/missedOpportunity.js'
import { createOpeningBook } from '../src/lib/openingBook.js'

const root = new URL('../', import.meta.url), watched = [], models = []
const ids = [...Array.from({ length: 6 }, (_, i) => `personal-0${i + 1}`), 'game-1-chigorin-steinitz-1892', 'game-2-saintamant-staunton-1843']
const base = 'tests/fixtures/qa/', folder = base + 'analysis-cache-large-200k/2026-10-07T09-51-26-999Z/'
const labels = { book: 'Libro', brilliant: 'Geniale', great: 'Grande', best: 'Migliore', excellent: 'Ottima', good: 'Buona', inaccuracy: 'Imprecisione', mistake: 'Errore', blunder: 'Errore grave', missed: 'Mossa mancata', unclassified: 'Non valutabile' }
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
async function input(path) {
  const bytes = await readFile(new URL(path, root)); watched.push({ path, sha256: hash(bytes) }); return JSON.parse(bytes)
}
const original = await input('agent-output/stockfish-specials-simple-2026-10-07T19-25-40-871Z/results.json')
const pkg = await input('node_modules/stockfish/package.json')
if (pkg.version !== '19.0.0') throw Error('Wrong installed engine')
const book = createOpeningBook((await input('src/data/openingPositions.json')).positions)
for (const id of ids) {
  const fixture = await input(base + id + '.json'), cache = await input(folder + id + '.json')
  if (fixture.pgn !== cache.pgn || cache.packageVersion !== '19.0.0' || cache.searchLimit?.value !== 200000
    || cache.multiPv !== 5 || cache.threads !== 1 || cache.hashMb !== 16 || cache.hashPolicy !== 'ucinewgame + Clear Hash before every search'
    || cache.scorePerspective !== 'side-to-move at each FEN') throw Error('Incompatible source cache')
  const full = new Chess(); full.loadPgn(fixture.pgn)
  const moves = full.history(), game = new Chess()
  if (moves.length !== cache.entries.length) throw Error('Incomplete source')
  let previous = null, bookActive = true
  for (const [index, entry] of cache.entries.entries()) {
    if (entry.fenBefore !== game.fen() || entry.san !== moves[index] || entry.ply !== index + 1) throw Error('Bad chain')
    const move = game.move(entry.san), playedUci = `${move.from}${move.to}${move.promotion ?? ''}`
    if (playedUci !== entry.uci || game.fen() !== entry.fenAfter) throw Error('Bad move')
    const isBookMove = bookActive && !game.isCheckmate() && book.hasPosition(entry.fenAfter)
    if (!isBookMove) bookActive = false
    const numerical = classifyAnalysisEntries([{ ...entry, isBookMove,
      ...moveEvaluationFields(entry.engine, entry.playedEngine, playedUci, { isCheckmate: game.isCheckmate() }) }])[0]
    const common = classifyMissedOpportunity(numerical, previous), candidate = classifySimpleSpecial(common, previous)
    models.push({ id, entry, numerical, common, previous, candidate })
    previous = numerical
  }
}
// Baseline annotations enter only after all original classifier outputs exist.
if (models.length !== original.rows.length) throw Error('Baseline length mismatch')
for (const [index, model] of models.entries()) {
  const old = original.rows[index]
  if (model.id !== old.gameId || model.entry.ply !== old.ply || labels[model.candidate.classification] !== old.predicted) throw Error('V1 baseline not reproduced')
}
const unresolved = models.filter(m => ['different-root-depths', 'invalid-or-duplicate-roots'].includes(m.candidate.specialReason))
const selected = []
for (let round = 0; round < 2; round++) for (const id of ids) {
  const item = unresolved.filter(m => m.id === id)[round]
  if (item) selected.push(item)
}
const budget = 200000, cap = 4000000, outcomes = []
const directory = new URL(`agent-output/stockfish-specials-complete-multipv-${new Date().toISOString().replace(/[:.]/g, '-')}/`, root)
await mkdir(directory)
const save = (name, value) => writeFile(new URL(name, directory), JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
await save('schedule.json', { policy: 'complete-multipv-v1', budget, cap, nominalMaximum: budget * selected.length,
  ordering: 'two round-robin rounds across fixed whitelist; unresolved moves in ply order; no reference labels',
  selected: selected.map(m => ({ id: m.id, ply: m.entry.ply, san: m.entry.san, fen: m.entry.fenBefore, reason: m.candidate.specialReason })) })

function classified(model, engineResult) {
  const e = { ...model.entry, engine: engineResult, isBookMove: model.numerical.isBookMove }
  const numerical = classifyAnalysisEntries([{ ...e, ...moveEvaluationFields(engineResult, e.playedEngine, e.uci) }])[0]
  return classifySimpleSpecial(classifyMissedOpportunity(numerical, model.previous), model.previous)
}
let engine, actualNodes = 0, nominalNodes = 0, failure = null
const started = performance.now()
try {
  engine = new NativeEngine(process.execPath, 120000, [fileURLToPath(new URL('scripts/qa/wasm-engine.cjs', root)), fileURLToPath(new URL('node_modules/stockfish/bin/stockfish-19-single.js', root))])
  await engine.init()
  if (!/^Stockfish 19\b/.test(engine.version)) throw Error('Unexpected UCI identity')
  for (const model of selected) {
    if (actualNodes + budget + 2000 > cap || nominalNodes + budget > 3200000) break
    const count = Math.min(5, new Chess(model.entry.fenBefore).moves().length)
    if (count !== 5) throw Error('Selected position lacks five legal roots')
    await engine.request(['ucinewgame', 'setoption name Clear Hash', 'setoption name MultiPV value 5', 'isready'], raw => raw === 'readyok' ? true : undefined)
    const rawLines = [], searchStarted = performance.now()
    nominalNodes += budget
    await engine.request([`position fen ${model.entry.fenBefore}`, `go nodes ${budget}`], raw => { rawLines.push(raw); if (raw.startsWith('bestmove ')) return true })
    const parsed = completeMultiPv(rawLines, count)
    actualNodes += parsed.actualNodes
    await save(`search-${String(outcomes.length + 1).padStart(2, '0')}.json`, { id: model.id, ply: model.entry.ply, fen: model.entry.fenBefore,
      engineVersion: engine.version, packageVersion: pkg.version, build: 'large-single', budget, multiPv: count, threads: 1, hashMb: 16,
      hashPolicy: 'clear-per-search', elapsedMs: performance.now() - searchStarted, rawLines, parsed })
    if (!parsed.actualNodes || !parsed.bestmove) throw Error('Missing search telemetry')
    for (const line of parsed.lines) {
      const game = new Chess(model.entry.fenBefore)
      for (const uci of line.pv) game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
    }
    const snapshotEngine = { ...parsed.lines[0], lines: parsed.lines, actualNodes: parsed.actualNodes }
    const latestEngine = { ...parsed.latestLines[0], lines: parsed.latestLines, actualNodes: parsed.actualNodes }
    const latestResult = classified(model, latestEngine)
    const snapshotResult = parsed.bestmoveMatchesSnapshot ? classified(model, snapshotEngine)
      : { ...model.candidate, specialStatus: 'insufficient', specialReason: parsed.lines.length ? 'snapshot-bestmove-disagreement' : 'no-complete-snapshot' }
    const originalRow = original.rows.find(r => r.gameId === model.id && r.ply === model.entry.ply)
    outcomes.push({ id: model.id, group: originalRow.group, ply: model.entry.ply, san: model.entry.san, expected: originalRow.expected,
      original: originalRow.predicted, originalReason: originalRow.reason, latest: labels[latestResult.classification], latestReason: latestResult.specialReason,
      snapshot: labels[snapshotResult.classification], snapshotReason: snapshotResult.specialReason, snapshotStatus: snapshotResult.specialStatus,
      depth: parsed.completedDepth, nodesAtSnapshot: parsed.nodesAtSnapshot, actualNodes: parsed.actualNodes,
      snapshotFraction: parsed.nodesAtSnapshot == null ? null : parsed.nodesAtSnapshot / parsed.actualNodes,
      bestmoveMatchesSnapshot: parsed.bestmoveMatchesSnapshot, latestDepths: parsed.latestLines.map(l => l.depth),
      latestHasDuplicates: new Set(parsed.latestLines.map(l => l.pv[0])).size !== parsed.latestLines.length,
      snapshotEvidence: snapshotResult.specialEvidence })
    console.log(JSON.stringify({ completed: outcomes.length, id: model.id, ply: model.entry.ply, snapshotReason: snapshotResult.specialReason, actualNodes }))
    if (actualNodes > cap) break
  }
} catch (error) { failure = error.stack } finally { engine?.close() }
let hashesUnchanged = true
for (const source of watched) if (hash(await readFile(new URL(source.path, root))) !== source.sha256) hashesUnchanged = false
function metrics(rows, field) {
  return { moves: rows.length, matches: rows.filter(r => r[field] === r.expected).length,
    categories: ['Grande', 'Geniale'].map(category => {
      const assigned = rows.filter(r => r[field] === category), positives = rows.filter(r => r.expected === category)
      const tp = assigned.filter(r => r.expected === category).length
      return { category, assigned: assigned.length, expected: positives.length, tp, fp: assigned.length - tp, fn: positives.length - tp }
    }) }
}
const whole = original.rows.filter(r => !r.excluded).map(r => {
  const replacement = outcomes.find(o => o.id === r.gameId && o.ply === r.ply)
  return { expected: r.expected, original: r.predicted, snapshot: replacement?.snapshot ?? r.predicted }
})
const summary = { searches: outcomes.length, selected: selected.length, budget, cap, nominalNodes, actualNodes,
  capExceeded: actualNodes > cap, elapsedMs: performance.now() - started, sourceHashesUnchanged: hashesUnchanged, failure,
  completeSnapshots: outcomes.filter(o => o.depth != null).length,
  bestmoveDisagreements: outcomes.filter(o => !o.bestmoveMatchesSnapshot).length,
  recoveredComparisons: outcomes.filter(o => o.snapshotStatus !== 'insufficient').length,
  newLatestMixedDepth: outcomes.filter(o => new Set(o.latestDepths).size > 1).length,
  newLatestDuplicates: outcomes.filter(o => o.latestHasDuplicates).length,
  selectedMetrics: ['original', 'latest', 'snapshot'].map(version => ({ version, ...metrics(outcomes, version) })),
  groupMetrics: ['development', 'historical'].flatMap(group => ['original', 'snapshot'].map(version => ({ group, version, ...metrics(outcomes.filter(o => o.group === group), version) }))),
  wholePartiallyReplaced: ['original', 'snapshot'].map(version => ({ version, ...metrics(whole, version) })),
  appIntegration: false, independentValidation: false }
await save('results.json', { summary, outcomes, watched })
const report = ['# Raccolta MultiPV completa — prova limitata', '', ...Object.entries(summary).filter(([k]) => !['groupMetrics', 'selectedMetrics', 'wholePartiallyReplaced'].includes(k)).map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`), '',
  '## Tutte le posizioni selezionate', '', '| Partita | Ply | SAN | Atteso | Prima | Ultime righe | Blocco completo | Motivo | Depth | Nodi al blocco/finali |', '|---|---:|---|---|---|---|---|---|---:|---|',
  ...outcomes.map(o => `| ${o.id} | ${o.ply} | ${o.san} | ${o.expected} | ${o.original} | ${o.latest} | ${o.snapshot} | ${o.snapshotReason} | ${o.depth} | ${o.nodesAtSnapshot}/${o.actualNodes} |`), '',
  '## Metriche sui soli selezionati', '', ...summary.selectedMetrics.map(m => `- ${m.version}: ${JSON.stringify(m)}`), '',
  '## Totale con sostituzione parziale', '', ...summary.wholePartiallyReplaced.map(m => `- ${m.version}: ${JSON.stringify(m)}`), '',
  'Il confronto ultime righe/blocco usa la stessa ricerca reale. Il confronto con la baseline include anche l’effetto della nuova ricerca. Resto del campione non ricalcolato. Nessuna modifica alle soglie, app o QA. .env/7–10 non letti. Suite app/build/browser NON ESEGUITI. Nessun commit/push.', ''].join('\n')
await writeFile(new URL('report.md', directory), report, { flag: 'wx' })
console.log(JSON.stringify({ output: fileURLToPath(directory), summary }, null, 2))
if (failure || !hashesUnchanged || summary.capExceeded) process.exitCode = 1
