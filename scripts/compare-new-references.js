import { readFile, writeFile, mkdir, access, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { performance } from 'node:perf_hooks'
import os from 'node:os'
import assert from 'node:assert/strict'
import { Chess } from 'chess.js'
import { capturedNodeSearch } from './qa/captured-node-search.js'
import { createMultiPvEvidence } from '../src/lib/multiPvEvidence.js'
import { createAnalysisMetadata } from '../src/lib/analysisMetadata.js'
import { ENGINE_CONFIG } from '../src/lib/engineConfig.js'
import { analyzeGame } from '../src/lib/gameAnalysis.js'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'
import { createOpeningBook } from '../src/lib/openingBook.js'

const area = 'agent-output/new-references-200k-v1'
const ids = ['185262315732', '184316820266', '184316313800', '185230271130', '185230000668']
const read = async p => JSON.parse(await readFile(p, 'utf8'))
const sha = b => createHash('sha256').update(b).digest('hex')
const save = (name, data) => writeFile(`${area}/${name}`, JSON.stringify(data, null, 2) + '\n', { flag: 'wx' })
const mode = process.argv[2]
if (!['--prepare', '--run', '--replay'].includes(mode)) throw Error('Use --prepare, --run (one time), or --replay (offline)')
const games = []
for (const id of ids) {
  const folder = `Partite/Confermate/chesscom-${id}`
  const referencePath = `${folder}/riferimento.json`, pgnPath = `${folder}/partita.pgn`
  const reference = await read(referencePath), pgn = await readFile(pgnPath, 'utf8')
  assert.equal(reference.status, 'user-confirmed'); assert.equal(reference.benchmarkEligible, true)
  assert.ok(reference.annotations.every(a => a.userConfirmed && !a.needsReview))
  const game = new Chess(); game.loadPgn(pgn)
  const history = game.history(), replay = new Chess(), positions = [replay.fen()]
  assert.equal(history.length, reference.annotations.length)
  for (const [i, san] of history.entries()) {
    assert.equal(reference.annotations[i].ply, i + 1); assert.equal(reference.annotations[i].san, san)
    replay.move(san); positions.push(replay.fen())
  }
  games.push({ id, folder, referencePath, pgnPath, pgn, headers: game.header(), moves: history, positions, reference })
}
assert.equal(games.reduce((n, g) => n + g.moves.length, 0), 262)
assert.equal(ENGINE_CONFIG.nodes, 200000); assert.equal(ENGINE_CONFIG.multiPv, 5)
assert.equal(ENGINE_CONFIG.threads, 1); assert.equal(ENGINE_CONFIG.hashMb, 16)
const nodes = 200000, reserve = 5000
const fens = [...new Set(games.flatMap(g => g.positions))]
const schedule = fens.filter(fen => new Chess(fen).moves().length).map((fen, index) => ({ index, fen, nodes, multiPv: 5 }))
const lock = await read('agent-output/specials-frozen-candidate-v1.json')
async function verify(sources) {
  for (const s of sources) {
    // Preserve the exact collection script after a replay-only JSON fix.
    const path = mode === '--replay' && s.path === 'scripts/compare-new-references.js'
      ? `${area}/collector-script-at-run.js` : s.path
    assert.equal(sha(await readFile(path)), s.sha256, s.path)
  }
}
await verify(lock.sources)
const paths = ['scripts/compare-new-references.js', 'scripts/qa/captured-node-search.js',
  'scripts/qa/native-engine.js', 'scripts/qa/wasm-engine.cjs', `${area}/protocol.md`,
  'node_modules/stockfish/package.json', 'node_modules/stockfish/bin/stockfish-19-single.js',
  'node_modules/stockfish/bin/stockfish-19-single.wasm', ...lock.sources.map(s => s.path),
  ...games.flatMap(g => [g.referencePath, g.pgnPath])]
async function watchTree(folder) {
  for (const e of await readdir(folder, { withFileTypes: true })) {
    const p = `${folder}/${e.name}`
    if (e.isDirectory()) await watchTree(p)
    else if (e.isFile()) paths.push(p)
  }
}
await watchTree('src')
const sources = await Promise.all([...new Set(paths)].map(async path => ({ path, sha256: sha(await readFile(path)) })))
const actualNodeCap = schedule.length * (nodes + reserve)
if (mode === '--prepare') {
  await mkdir(area, { recursive: true })
  await save('manifest.json', { date: '2026-10-14', games: games.map(g => ({ id: g.id, headers: g.headers, plies: g.moves.length,
    referencePath: g.referencePath, pgnPath: g.pgnPath })), totalPlies: 262, uniqueFens: fens.length,
    terminalFens: fens.length - schedule.length, searches: schedule.length, nodes, multiPv: 5,
    nominalNodes: schedule.length * nodes, reservePerSearch: reserve, actualNodeCap, schedule, sources,
    frozenSources: lock.sources.length, environment: { cpu: os.cpus()[0]?.model, platform: os.platform(),
      arch: os.arch(), node: process.version, runner: 'Node WASM; not browser or phone' } })
  console.log(JSON.stringify({ prepared: true, games: 5, plies: 262, uniqueFens: fens.length, searches: schedule.length, actualNodeCap }))
  process.exit(0)
}
const manifest = await read(`${area}/manifest.json`)
if (mode === '--replay') {
  const collectedScript = manifest.sources.find(s => s.path === 'scripts/compare-new-references.js')
  assert.equal(sha(await readFile(`${area}/collector-script-at-run.js`)), collectedScript.sha256)
  sources.find(s => s.path === collectedScript.path).sha256 = collectedScript.sha256
}
assert.deepEqual(schedule, manifest.schedule); assert.deepEqual(sources, manifest.sources)
assert.equal(actualNodeCap, manifest.actualNodeCap)
await verify(manifest.sources)
const records = new Map(), timings = []
let actualNodes = 0, searches = 0, startupMs = 0, engine
function validatePacket(packet, task) {
  assert.equal(packet.fen, task.fen); assert.equal(packet.nodes, nodes); assert.equal(packet.multiPv, 5)
  assert.ok(packet.actualNodes > 0 && packet.actualNodes <= nodes + reserve)
  const position = new Chess(task.fen)
  assert.ok(position.moves({ verbose: true }).some(m => m.from + m.to + (m.promotion ?? '') === packet.bestmove))
  assert.ok(packet.engine.lines.length)
  for (const line of [...packet.engine.lines, ...packet.engine.specialLines]) {
    assert.ok(Number.isFinite(line.evalCp) || Number.isInteger(line.mate))
    assert.ok(line.pv.length)
    const replay = new Chess(task.fen)
    for (const u of line.pv) replay.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] })
  }
}
if (mode === '--run') {
  try { await access(`${area}/started.json`); throw Error('Already started: --run must not be repeated') }
  catch (e) { if (e.code !== 'ENOENT') throw e }
  await save('started.json', { startedAt: new Date().toISOString(), searches: schedule.length, actualNodeCap })
  try {
    assert.equal((await read('node_modules/stockfish/package.json')).version, '19.0.0')
    const { NativeEngine } = await import('./qa/native-engine.js')
    engine = new NativeEngine(process.execPath, 120000, [fileURLToPath(new URL('./qa/wasm-engine.cjs', import.meta.url)),
      fileURLToPath(new URL('../node_modules/stockfish/bin/stockfish-19-single.js', import.meta.url))])
    const start = performance.now(); await engine.init(); startupMs = performance.now() - start
    assert.equal(engine.version, 'Stockfish 19 WASM')
    for (const task of schedule) {
      assert.ok(actualNodes + nodes + reserve <= actualNodeCap)
      const start = performance.now(), packet = await capturedNodeSearch(engine, task.fen, nodes, 5)
      const elapsedMs = performance.now() - start
      validatePacket(packet, task)
      const filename = `search-${String(task.index).padStart(3, '0')}.json`
      const engineTimeMs = Math.max(0, ...packet.rawLines.map(l => Number(l.match(/\btime (\d+)/)?.[1] ?? 0)))
      await save(filename, { ...packet, index: task.index, elapsedMs, engineTimeMs })
      actualNodes += packet.actualNodes; searches++
      assert.ok(actualNodes <= actualNodeCap)
      records.set(task.fen, packet.engine)
      timings.push({ index: task.index, fen: task.fen, file: filename, elapsedMs, engineTimeMs, actualNodes: packet.actualNodes })
      if (searches % 10 === 0 || searches === schedule.length) console.log(JSON.stringify({ searches, total: schedule.length,
        actualNodes, searchSeconds: timings.reduce((n, t) => n + t.elapsedMs, 0) / 1000 }))
    }
    await save('timings.json', timings)
    await save('collection.json', { searches, actualNodes, startupMs, complete: true })
  } catch (e) {
    await save('failure.json', { complete: false, searches, actualNodes, message: e.message }); throw e
  } finally { engine?.close() }
} else {
  const collected = await read(`${area}/collection.json`), storedTimings = await read(`${area}/timings.json`)
  assert.equal(collected.complete, true); startupMs = collected.startupMs
  assert.equal(storedTimings.length, schedule.length)
  for (const task of schedule) {
    const t = storedTimings[task.index], p = await read(`${area}/${t.file}`)
    validatePacket(p, task)
    const evidence = createMultiPvEvidence(Math.min(5, new Chess(task.fen).moves().length)), latest = new Map()
    let telemetry = 0, bestmove
    for (const raw of p.rawLines) {
      evidence.accept(raw); telemetry = Math.max(telemetry, Number(raw.match(/\bnodes (\d+)/)?.[1] ?? 0))
      const score = raw.match(/\bscore (cp|mate) (-?\d+)/)
      if (raw.startsWith('info ') && score && !/\b(?:upperbound|lowerbound)\b/.test(raw)) {
        const multipv = Number(raw.match(/\bmultipv (\d+)/)?.[1] ?? 1)
        latest.set(multipv, { multipv, depth: Number(raw.match(/\bdepth (\d+)/)?.[1] ?? 0),
          evalCp: score[1] === 'cp' ? Number(score[2]) : null, mate: score[1] === 'mate' ? Number(score[2]) : null,
          pv: raw.match(/\bpv (.+)/)?.[1].trim().split(/\s+/) ?? [], raw })
      }
      if (raw.startsWith('bestmove ')) bestmove = raw.split(/\s+/)[1]
    }
    assert.equal(bestmove, p.bestmove); assert.equal(telemetry, p.actualNodes)
    assert.deepEqual([...latest.values()].sort((a, b) => a.multipv - b.multipv), p.engine.lines)
    assert.deepEqual(evidence.finish(bestmove), p.engine.specialLines)
    assert.equal(t.actualNodes, p.actualNodes); assert.equal(t.elapsedMs, p.elapsedMs)
    assert.equal(t.engineTimeMs, Math.max(0, ...p.rawLines.map(l => Number(l.match(/\btime (\d+)/)?.[1] ?? 0))))
    records.set(task.fen, p.engine); timings.push(t); actualNodes += p.actualNodes; searches++
  }
  assert.equal(actualNodes, collected.actualNodes); assert.equal(searches, collected.searches)
}
assert.equal(searches, manifest.searches); assert.ok(actualNodes <= actualNodeCap)
const book = createOpeningBook((await read('src/data/openingPositions.json')).positions)
const getEvidence = async fen => {
  if (records.has(fen)) return records.get(fen)
  const position = new Chess(fen); assert.equal(position.moves().length, 0)
  return { fen, evalCp: position.isCheckmate() ? null : 0, mate: position.isCheckmate() ? 0 : null,
    actualNodes: 0, lines: [], specialLines: [], terminal: true,
    analysisMetadata: createAnalysisMetadata({ nodes, actualEngineId: 'Stockfish 19 WASM' }) }
}
const labels = { book: 'Libro', forced: 'Forzata', best: 'Migliore', excellent: 'Ottima', good: 'Buona',
  inaccuracy: 'Imprecisione', mistake: 'Errore', blunder: 'Errore grave', great: 'Grande', brilliant: 'Geniale',
  missed: 'Mossa mancata', unclassified: 'Non valutabile' }
const ordinal = ['Migliore', 'Ottima', 'Buona', 'Imprecisione', 'Errore', 'Errore grave']
const outputs = []
for (const g of games) {
  const liveEntries = await analyzeGame({ moves: g.moves, openingBook: book,
    analyzePosition: getEvidence, analyzePlayedPosition: getEvidence })
  const entries = reclassifyReviewedMoves(liveEntries)
  const rows = entries.map((e, i) => ({ game: g.id, ply: e.ply, side: e.side, san: g.moves[i],
    expected: g.reference.annotations[i].category, actual: labels[e.classification],
    exact: g.reference.annotations[i].category === labels[e.classification], fenBefore: e.fenBefore, fenAfter: e.fenAfter,
    bestUci: e.bestUci, bestEval: e.bestEval, playedEval: e.playedEval, bestMate: e.bestMate, playedMate: e.playedMate,
    dropPct: e.dropPct, numericalClassification: labels[e.numericalClassification],
    evidence: e.evaluationEvidence, specialAssessment: e.specialAssessment,
    bestPv: e.comparisonPv ?? e.engine.pv, playedPv: e.playedEngine.pv, forced: e.moveFacts?.forced }))
  assert.ok(rows.every(r => r.actual))
  const report = { id: g.id, headers: g.headers, total: rows.length, exact: rows.filter(r => r.exact).length, rows, liveEntries, entries }
  if (mode === '--run') await save(`game-${g.id}.json`, report)
  else {
    const stored = await read(`${area}/game-${g.id}.json`)
    // JSON omits undefined fields (the terminal position has no played PV).
    assert.deepEqual(JSON.parse(JSON.stringify(report)), stored, `Offline classification replay: ${g.id}`)
  }
  outputs.push(report)
  console.log(JSON.stringify({ classified: g.id, exact: report.exact, total: report.total }))
}
const rows = outputs.flatMap(g => g.rows), ordinary = rows.filter(r => ordinal.includes(r.expected))
const withinOne = ordinary.filter(r => ordinal.includes(r.actual) && Math.abs(ordinal.indexOf(r.expected) - ordinal.indexOf(r.actual)) <= 1).length
const categories = Object.values(labels).map(label => {
  const expected = rows.filter(r => r.expected === label).length, predicted = rows.filter(r => r.actual === label).length
  const correct = rows.filter(r => r.expected === label && r.actual === label).length
  return { label, expected, predicted, correct, recall: expected ? correct / expected : null, precision: predicted ? correct / predicted : null }
})
const matrix = {}
for (const r of rows) { matrix[r.expected] ??= {}; matrix[r.expected][r.actual] = (matrix[r.expected][r.actual] ?? 0) + 1 }
const nonBook = rows.filter(r => r.expected !== 'Libro')
const result = { complete: true, newSearches: mode === '--run' ? searches : 0, searches, actualNodes, actualNodeCap,
  startupMs, searchMs: timings.reduce((n, t) => n + t.elapsedMs, 0), total: rows.length, exact: rows.filter(r => r.exact).length,
  nonBook: { total: nonBook.length, exact: nonBook.filter(r => r.exact).length },
  ordinary: { total: ordinary.length, withinOne }, categories, matrix,
  games: outputs.map(g => ({ id: g.id, headers: g.headers, total: g.total, exact: g.exact })),
  discrepancies: rows.filter(r => !r.exact), frozenSourcesVerified: lock.sources.length, applicationChanged: false }
await verify(manifest.sources); await verify(lock.sources)
if (mode === '--replay') {
  const stored = await read(`${area}/results.json`)
  assert.deepEqual(JSON.parse(JSON.stringify({ ...result, newSearches: searches })), stored)
  await writeFile(`${area}/offline-check.json`, JSON.stringify({ complete: true, newSearches: 0,
    replayedSearches: searches, replayedPlies: rows.length, actualNodes, frozenSourcesVerified: lock.sources.length,
    verifierSha256: sha(await readFile('scripts/compare-new-references.js')),
    collectionScriptSha256: sha(await readFile(`${area}/collector-script-at-run.js`)),
    serializationFix: 'Normalize absent terminal playedPv through JSON; no searches or classification changes.' }, null, 2) + '\n')
  console.log(JSON.stringify({ offlineReplay: 'passed', newSearches: 0, exact: result.exact, total: result.total }))
  process.exit(0)
}
await save('results.json', result)
const pct = v => v == null ? 'N/D' : (100 * v).toFixed(1) + '%'
const report = ['# Confronto delle cinque nuove partite', '',
  'Riferimenti confermati da Carlo prima delle ricerche. Stockfish 19 large-single WASM, 200k nodi, MultiPV 5, Threads 1, Hash 16 MB pulita per FEN.',
  'Percorso applicativo analyzeGame + reclassifyReviewedMoves; libro locale, nessun Explorer/LLM. Etichette esterne usate solo per il confronto.', '',
  `Concordanza esatta: **${result.exact}/${rows.length} (${pct(result.exact / rows.length)})**, includendo Libro e Forzata.`,
  `Senza Libro atteso: ${result.nonBook.exact}/${result.nonBook.total} (${pct(result.nonBook.exact / result.nonBook.total)}).`,
  `Sei categorie ordinarie entro una classe: ${withinOne}/${ordinary.length} (${pct(withinOne / ordinary.length)}); categorie speciali non sono ordinate.`, '',
  '| Partita | Bianco | Nero | Corrette | Concordanza |', '|---|---|---|---:|---:|',
  ...result.games.map(g => `| ${g.id} | ${g.headers.White} | ${g.headers.Black} | ${g.exact}/${g.total} | ${pct(g.exact / g.total)} |`), '',
  '| Categoria | Attese | Prodotte | Corrette | Richiamo | Precisione |', '|---|---:|---:|---:|---:|---:|',
  ...categories.map(c => `| ${c.label} | ${c.expected} | ${c.predicted} | ${c.correct} | ${pct(c.recall)} | ${pct(c.precision)} |`), '',
  'Richiamo: quota delle attese riconosciuta. Precisione: quota delle prodotte corrispondente al riferimento. Denominatori zero: N/D.', '',
  '## Discrepanze', '', '| Partita | Ply | Mossa | Attesa | App | Perdita | Evidenza |', '|---|---:|---|---|---|---:|---|',
  ...result.discrepancies.map(r => `| ${r.game} | ${r.ply} | ${r.san} | ${r.expected} | ${r.actual} | ${r.dropPct?.toFixed(3) ?? 'N/D'} | ${r.evidence?.status ?? 'N/D'} |`), '',
  'FEN, score, PV, valutazioni speciali e matrice completa: results.json. Dati per partita e raw conservati separatamente.', '',
  '## Costo e limiti', '',
  `${searches} ricerche, ${actualNodes} nodi effettivi sotto il limite ${actualNodeCap}; nessun retry.`,
  `Tempi richieste Node WASM sul PC: ${(result.searchMs / 1000).toFixed(2)} s; avvio motore separato ${(startupMs / 1000).toFixed(2)} s. Non misure del browser o telefono.`,
  'Campione di cinque partite personali a rating basso, etichette trascritte e confermate: non rappresentativo di tutti gli utenti o di tutte le categorie rare.',
  'Forzata comprende tre fatti legali verificati localmente; il PGN della prima partita e ricostruito dalle SAN, gli altri quattro sono originali.',
  'Impostazioni interne Game Review non note. Nessuna taratura, soglia o budget applicativo modificato. Risultato storico 329/592 separato.',
  `Hash degli input e delle sorgenti, incluse ${lock.sources.length} sorgenti congelate, verificati prima/dopo.`,
  'Il controllo --replay ricostruisce raw, snapshot e classificazioni senza avviare il motore. NON ripetere --run.', '']
await writeFile(`${area}/report.md`, report.join('\n'), { flag: 'wx' })
console.log(JSON.stringify({ exact: result.exact, total: result.total, categories, actualNodes, searches }, null, 2))
