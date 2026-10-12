import { readFile, writeFile, mkdir, access } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { performance } from 'node:perf_hooks'
import os from 'node:os'
import { Chess } from 'chess.js'
import { NativeEngine } from './qa/native-engine.js'
import { capturedNodeSearch } from './qa/captured-node-search.js'
import { createOpeningBook } from '../src/lib/openingBook.js'
import { createAnalysisMetadata } from '../src/lib/analysisMetadata.js'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'
import { buildRefinementPlan, refineGameEntries, selectRefinementView } from '../src/lib/analysisRefinement.js'

const area = 'agent-output/node-budget-public-v1', sha = b => createHash('sha256').update(b).digest('hex')
const source = await readFile(`${area}/source.pgn`, 'utf8')
const games = source.split(/(?=\[Event )/).filter(s => s.trim()).slice(0, 2).map((pgn, index) => {
  const game = new Chess(); game.loadPgn(pgn)
  const replay = new Chess(), history = []
  const moves = game.history().map((san, i) => {
    const fenBefore = replay.fen(), move = replay.move(san)
    const entry = { ply: i + 1, san, playedMove: san, uci: `${move.from}${move.to}${move.promotion ?? ''}`,
      playedUci: `${move.from}${move.to}${move.promotion ?? ''}`, side: move.color,
      fenBefore, fenAfter: replay.fen(), moveHistorySan: [...history] }
    history.push(san); return entry
  })
  return { id: `public-wcc2024-${index + 1}`, headers: game.header(), pgn, moves }
})
if (games.length !== 2 || games.some(g => !g.moves.length)) throw Error('Invalid public games')
const fens = [...new Set(games.flatMap(g => [g.moves[0].fenBefore, ...g.moves.map(m => m.fenAfter)]))]
const schedule = fens.flatMap((fen, index) => new Chess(fen).moves().length
  ? (index % 2 ? [1000000, 200000] : [200000, 1000000]).map(nodes => ({ fen, nodes, position: index })) : [])
const paths = [ `${area}/source.pgn`, `${area}/provenance.json`, `${area}/protocol.md`,
  'scripts/benchmark-public-node-budgets.js', 'scripts/qa/captured-node-search.js', 'scripts/qa/native-engine.js',
  'scripts/qa/wasm-engine.cjs', 'src/lib/reviewEvaluation.js', 'src/lib/reviewMoves.js',
  'src/lib/specialClassification.js', 'src/lib/sacrificeEvidence.js', 'src/lib/materialRealization.js',
  'src/lib/multiPvEvidence.js', 'src/lib/moveOpportunities.js', 'src/lib/analysisRefinement.js',
  'src/lib/analysisMetadata.js', 'node_modules/stockfish/package.json',
  'node_modules/stockfish/bin/stockfish-19-single.js', 'node_modules/stockfish/bin/stockfish-19-single.wasm' ]
const lock = JSON.parse(await readFile('agent-output/specials-frozen-candidate-v1.json', 'utf8'))
for (const s of lock.sources) {
  if (sha(await readFile(s.path)) !== s.sha256) throw Error(`Frozen input changed: ${s.path}`)
  paths.push(s.path)
}
const watched = await Promise.all([...new Set(paths)].map(async path => ({ path, sha256: sha(await readFile(path)) })))
const save = (name, data) => writeFile(`${area}/${name}`, JSON.stringify(data, null, 2) + '\n', { flag: 'wx' })
async function verify(sources) { for (const s of sources) if (sha(await readFile(s.path)) !== s.sha256) throw Error(`Source changed: ${s.path}`) }
const nominalNodes = schedule.reduce((s, t) => s + t.nodes, 0), actualNodeCap = nominalNodes + schedule.length * 5000
const summaryGames = games.map(g => ({ id: g.id, headers: g.headers, plies: g.moves.length }))
if (process.argv[2] === '--prepare') {
  await mkdir(area, { recursive: true })
  await save('manifest.json', { date: '2026-10-12', games: summaryGames, positions: fens.length, searches: schedule.length,
    schedule, nominalNodes, actualNodeCap, sources: watched, classificationReference: null,
    timingEnvironment: { platform: os.platform(), arch: os.arch(), cpu: os.cpus()[0]?.model, node: process.version,
      runner: 'Node WASM single-thread; not browser or phone', hashMb: 16, multiPv: 5 } })
  console.log(JSON.stringify({ prepared: true, games: summaryGames, positions: fens.length, searches: schedule.length, nominalNodes, actualNodeCap }))
  process.exit(0)
}
if (process.argv[2] !== '--run') throw Error('Use --prepare or --run')
const manifest = JSON.parse(await readFile(`${area}/manifest.json`, 'utf8'))
if (JSON.stringify(manifest.schedule) !== JSON.stringify(schedule) || manifest.nominalNodes !== nominalNodes
  || manifest.actualNodeCap !== actualNodeCap || JSON.stringify(manifest.sources) !== JSON.stringify(watched)) throw Error('Manifest mismatch')
await verify(manifest.sources)
try { await access(`${area}/started.json`); throw Error('Already started: no rerun') } catch (e) { if (e.code !== 'ENOENT') throw e }
await save('started.json', { startedAt: new Date().toISOString() })
let engine, actualNodes = 0, searches = 0
const records = new Map(), timings = []
const key = (fen, nodes) => `${nodes}:${fen}`
try {
  if (JSON.parse(await readFile('node_modules/stockfish/package.json', 'utf8')).version !== '19.0.0') throw Error('Engine package mismatch')
  engine = new NativeEngine(process.execPath, 120000, [fileURLToPath(new URL('./qa/wasm-engine.cjs', import.meta.url)),
    fileURLToPath(new URL('../node_modules/stockfish/bin/stockfish-19-single.js', import.meta.url))])
  const startup = performance.now(); await engine.init(); const startupMs = performance.now() - startup
  if (engine.version !== 'Stockfish 19 WASM') throw Error('Engine identity mismatch')
  for (const task of schedule) {
    if (actualNodes + task.nodes + 5000 > manifest.actualNodeCap) throw Error('Research cap exhausted')
    const started = performance.now(), record = await capturedNodeSearch(engine, task.fen, task.nodes, 5)
    const elapsedMs = performance.now() - started
    const engineTimeMs = Math.max(0, ...record.rawLines.map(line => Number(line.match(/\btime (\d+)/)?.[1] ?? 0)))
    const name = `search-${String(searches).padStart(3, '0')}.json`
    await save(name, { ...task, ...record, elapsedMs, engineTimeMs })
    actualNodes += record.actualNodes; searches++
    if (!record.actualNodes || record.actualNodes > task.nodes + 5000 || actualNodes > actualNodeCap) throw Error('Invalid node telemetry')
    if (!record.engine.lines.length || !new Chess(task.fen).moves({ verbose: true }).some(m => `${m.from}${m.to}${m.promotion ?? ''}` === record.bestmove)) throw Error('Invalid bestmove')
    for (const line of [...record.engine.lines, ...(record.engine.specialLines ?? [])]) {
      const replay = new Chess(task.fen)
      if (!(Number.isFinite(line.evalCp) || Number.isInteger(line.mate)) || !line.pv.length) throw Error('Invalid score/PV')
      for (const u of line.pv) replay.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] })
    }
    records.set(key(task.fen, task.nodes), record.engine)
    timings.push({ position: task.position, nodes: task.nodes, actualNodes: record.actualNodes, elapsedMs, engineTimeMs, file: name })
    if (searches % 10 === 0 || searches === schedule.length) console.log(JSON.stringify({ searches, total: schedule.length, actualNodes }))
  }
  const book = createOpeningBook(JSON.parse(await readFile('src/data/openingPositions.json', 'utf8')).positions)
  function evidence(fen, nodes) {
    const found = records.get(key(fen, nodes)); if (found) return found
    const game = new Chess(fen); if (game.moves().length) throw Error('Missing FEN')
    return { fen, evalCp: game.isStalemate() ? 0 : null, mate: game.isCheckmate() ? 0 : null,
      actualNodes: 0, lines: [], analysisMetadata: createAnalysisMetadata({ nodes }), terminal: true }
  }
  const all = []
  for (const g of games) {
    function entries(nodes) {
      let active = true
      return reclassifyReviewedMoves(g.moves.map(m => {
        const isBookMove = active && book.hasPosition(m.fenAfter); if (!isBookMove) active = false
        return { ...m, isBookMove, analysisMetadata: createAnalysisMetadata({ nodes }),
          engine: evidence(m.fenBefore, nodes), playedEngine: evidence(m.fenAfter, nodes) }
      }))
    }
    const initial = entries(200000), full = entries(1000000), plan = buildRefinementPlan(initial)
    const preserved = JSON.stringify(initial)
    const refinement = await refineGameEntries({ entries: initial, plan, analyzePosition: async (fen, nodes) =>
      ({ ...evidence(fen, nodes), actualNodes: 0 }) })
    if (JSON.stringify(initial) !== preserved) throw Error('Initial mutated')
    const selective = selectRefinementView(refinement.entries, true)
    const rows = initial.map((e, i) => ({ ply: e.ply, san: e.san, initial: e.classification, full: full[i].classification,
      selective: selective[i].classification, selected: plan.selectedPlies.includes(e.ply),
      initialEvidence: e.evaluationEvidence, fullEvidence: full[i].evaluationEvidence,
      initialDrop: e.dropPct, fullDrop: full[i].dropPct, initialBestUci: e.bestUci, fullBestUci: full[i].bestUci,
      initialEval: e.playedEval, fullEval: full[i].playedEval, initialMate: e.playedMate, fullMate: full[i].playedMate }))
    const changed = rows.filter(r => r.initial !== r.full)
    all.push({ game: g.id, headers: g.headers, plies: rows.length, plan, rows, initialEntries: initial,
      fullEntries: full, selectiveCanonical: refinement.entries,
      summary: { labelChanges: changed.length, bestMoveChanges: rows.filter(r => r.initialBestUci !== r.fullBestUci).length,
        fullChangesMatchedBySelective: changed.filter(r => r.selective === r.full).length,
        selectiveChanges: rows.filter(r => r.selective !== r.initial).length,
        selectiveDiffersFromFull: rows.filter(r => r.selective !== r.full).length,
        coherentInitial: rows.filter(r => r.initialEvidence?.status === 'coherent').length,
        coherentFull: rows.filter(r => r.fullEvidence?.status === 'coherent').length,
        precisionAgainstIndependentLabels: null } })
  }
  await verify(manifest.sources)
  const stats = numbers => {
    const sorted = [...numbers].sort((a, b) => a - b), at = p => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))]
    return { count: sorted.length, total: numbers.reduce((a, b) => a + b, 0), median: at(.5), p90: at(.9) }
  }
  const timingSummary = [200000, 1000000].map(nodes => ({ nodes, wallMs: stats(timings.filter(t => t.nodes === nodes).map(t => t.elapsedMs)),
    uciMs: stats(timings.filter(t => t.nodes === nodes).map(t => t.engineTimeMs)) }))
  const pairedRatios = fens.filter(f => records.has(key(f, 200000))).map(fen => {
    const position = fens.indexOf(fen), pair = timings.filter(t => t.position === position)
    return pair.find(t => t.nodes === 1000000).elapsedMs / pair.find(t => t.nodes === 200000).elapsedMs
  })
  const result = { manifest: `${area}/manifest.json`, games: all, timingSummary, pairedRatio: stats(pairedRatios), startupMs,
    actualNodes, searches, frozenInputsVerified: lock.sources.length, applicationChanged: false,
    classificationPrecisionMeasured: false, phoneMeasured: false, browserMeasured: false }
  await save('results.json', result)
  await save('timings.json', timings)
  console.log(JSON.stringify({ timingSummary, pairedRatio: result.pairedRatio, startupMs, actualNodes, searches,
    games: all.map(g => ({ id: g.game, plies: g.plies, ...g.summary })) }, null, 2))
} catch (e) {
  await save('failure.json', { message: e.message, actualNodes, searches }); throw e
} finally { engine?.close() }
