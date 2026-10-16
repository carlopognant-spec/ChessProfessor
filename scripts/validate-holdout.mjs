// Fixed independent holdout measurement. Never changes application or references.
import { readFile, writeFile, mkdir, readdir, access } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { performance } from 'node:perf_hooks'
import os from 'node:os'
import assert from 'node:assert/strict'
import { Chess } from 'chess.js'
import { capturedNodeSearch } from './qa/captured-node-search.js'
import { NativeEngine } from './qa/native-engine.js'
import { createMultiPvEvidence } from '../src/lib/multiPvEvidence.js'
import { createAnalysisMetadata, analysisMetadataKey } from '../src/lib/analysisMetadata.js'
import { ENGINE_CONFIG } from '../src/lib/engineConfig.js'
import { analyzeGame } from '../src/lib/gameAnalysis.js'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'
import { createOpeningBook } from '../src/lib/openingBook.js'
import { buildRefinementPlan, refineGameEntries, selectRefinementView, REFINEMENT_POLICY } from '../src/lib/analysisRefinement.js'
import { SACRIFICE_SEARCH_POLICY } from '../src/lib/sacrificeSearches.js'

const area = 'agent-output/holdout-validation-v1', mode = process.argv[2]
assert.ok(['--prepare', '--run', '--replay'].includes(mode), 'Use --prepare, --run once, or --replay offline')
const ids = ['185215805284', '185214643360', '185120945476', '184965734932', '184965243670']
const maxRounds = 2, reserve = 5000, maxRequests = ids.length * maxRounds
const maxDeepSearches = maxRequests * (2 * REFINEMENT_POLICY.maxMoves + 2 * SACRIFICE_SEARCH_POLICY.maxOffers)
const deepNodeCap = maxRequests * (2 * REFINEMENT_POLICY.maxMoves * (REFINEMENT_POLICY.nodes + REFINEMENT_POLICY.reserve)
  + 2 * SACRIFICE_SEARCH_POLICY.maxOffers * (SACRIFICE_SEARCH_POLICY.nodes + SACRIFICE_SEARCH_POLICY.reserve))
const labels = { book: 'Libro', forced: 'Forzata', best: 'Migliore', excellent: 'Ottima', good: 'Buona',
  inaccuracy: 'Imprecisione', mistake: 'Errore', blunder: 'Errore grave', great: 'Grande', brilliant: 'Geniale',
  missed: 'Mossa mancata', unclassified: 'Non valutabile' }
const ordinal = ['Migliore', 'Ottima', 'Buona', 'Imprecisione', 'Errore', 'Errore grave']
const json = value => JSON.parse(JSON.stringify(value)), sha = bytes => createHash('sha256').update(bytes).digest('hex')
const watched = new Map()
const read = async path => JSON.parse(await readFile(path, 'utf8'))
async function watch(path) { const bytes = await readFile(path); watched.set(path, sha(bytes)); return bytes }
async function input(path) { return JSON.parse(await watch(path)) }
async function watchTree(folder) {
  for (const e of (await readdir(folder, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = `${folder}/${e.name}`
    if (e.isDirectory()) await watchTree(path)
    else if (e.isFile()) await watch(path)
  }
}
async function verifySources() {
  for (const [path, hash] of watched) assert.equal(sha(await readFile(path)), hash, `Changed input: ${path}`)
}
async function save(name, value) { await writeFile(`${area}/${name}`, JSON.stringify(json(value), null, 2) + '\n', { flag: 'wx' }) }
const key = (fen, nodes, multiPv, searchMoves) => `${fen}|${analysisMetadataKey({
  ...createAnalysisMetadata({ nodes, multiPv }), ...(searchMoves ? { searchMoves } : {}) })}`

assert.equal(ENGINE_CONFIG.nodes, 200000); assert.equal(ENGINE_CONFIG.multiPv, 5)
assert.equal(ENGINE_CONFIG.threads, 1); assert.equal(ENGINE_CONFIG.hashMb, 16)
assert.equal(ENGINE_CONFIG.hashPolicy, 'clear-per-search')
assert.equal(REFINEMENT_POLICY.nodes, 1000000); assert.equal(REFINEMENT_POLICY.maxMoves, 12)
assert.equal(deepNodeCap, 257600000); assert.equal(maxDeepSearches, 320)
const frozen = await input('agent-output/specials-frozen-candidate-v1.json')
for (const s of frozen.sources) assert.equal(sha(await watch(s.path)), s.sha256, s.path)
await watchTree('src')
for (const path of ['scripts/validate-holdout.mjs', 'scripts/qa/captured-node-search.js', 'scripts/qa/native-engine.js',
  'scripts/qa/wasm-engine.cjs', `${area}/protocol.md`, 'package.json', 'package-lock.json',
  'node_modules/chess.js/package.json', 'node_modules/chess.js/dist/esm/chess.js',
  'node_modules/stockfish/package.json', 'node_modules/stockfish/bin/stockfish-19-single.js',
  'node_modules/stockfish/bin/stockfish-19-single.wasm']) await watch(path)
assert.equal((await read('node_modules/stockfish/package.json')).version, '19.0.0')
const games = []
for (const id of ids) {
  const folder = `Partite/Validazione/Confermate/chesscom-${id}`
  const reference = await input(`${folder}/riferimento.json`), pgnBytes = await watch(`${folder}/partita.pgn`)
  await watch(`${folder}/correzioni-utente-2026-10-15.json`)
  assert.equal(reference.gameId, id); assert.equal(reference.status, 'user-confirmed')
  assert.equal(reference.benchmarkEligible, true); assert.equal(reference.role, 'reserved-holdout-validation')
  assert.equal(reference.developmentUseAllowed, false); assert.equal(reference.usedForDevelopment, false)
  assert.equal(reference.engineAnalysisPerformed, false); assert.equal(reference.evaluationPerformed, false)
  assert.ok(reference.annotations.every(a => a.userConfirmed && !a.needsReview))
  assert.equal(sha(pgnBytes), reference.pgnSha256)
  for (const s of reference.applicationAtCollection.sources) assert.equal(sha(await readFile(s.path)), s.sha256)
  const game = new Chess(); game.loadPgn(pgnBytes.toString('utf8'))
  const headers = game.getHeaders(), moves = game.history(), replay = new Chess(headers.FEN), positions = [replay.fen()]
  assert.deepEqual(moves, reference.annotations.map(a => a.san))
  for (const [i, san] of moves.entries()) {
    const a = reference.annotations[i]; assert.equal(a.ply, i + 1); assert.equal(replay.fen(), a.fenBefore)
    replay.move(san); assert.equal(replay.fen(), a.fenAfter); positions.push(replay.fen())
  }
  if (headers.CurrentPosition) assert.equal(replay.fen(), headers.CurrentPosition)
  games.push({ id, headers, moves, baseFen: headers.FEN, positions, reference, rounds: [], failed: false })
}
assert.equal(games.reduce((n, g) => n + g.moves.length, 0), 617)
const fens = [...new Set(games.flatMap(g => g.positions))]
const schedule = fens.filter(fen => new Chess(fen).moves().length).map((fen, index) => ({ index, fen, nodes: ENGINE_CONFIG.nodes, multiPv: 5 }))
const normalNodeCap = schedule.length * (ENGINE_CONFIG.nodes + reserve)
const sources = [...watched].map(([path, sha256]) => ({ path, sha256 }))
const specification = { schemaVersion: 1, date: '2026-10-15', independentValidation: true,
  policy: { review: 'review-reliability-v2', special: 'counterfactual-v11' },
  totalPlies: 617, games: games.map(g => ({ id: g.id, white: g.headers.White, black: g.headers.Black, plies: g.moves.length })),
  engine: createAnalysisMetadata(), maxRounds, maxRequests, maxDeepSearches, deepNodeCap,
  normalNodeCap, maxTotalNodeCap: normalNodeCap + deepNodeCap, schedule, sources }
if (mode === '--prepare') {
  await mkdir(area, { recursive: true })
  await save('manifest.json', { ...specification, environment: { node: process.version, cpu: os.cpus()[0]?.model,
    platform: os.platform(), arch: os.arch(), runner: 'Node WASM; not browser or phone' } })
  console.log(JSON.stringify({ prepared: true, plies: 617, normalSearches: schedule.length, normalNodeCap, deepNodeCap,
    maxDeepSearches, frozenApplicationFiles: sources.filter(s => s.path.startsWith('src/')).length })); process.exit(0)
}
const manifest = await read(`${area}/manifest.json`)
const { environment: ignoredEnvironment, ...recordedSpecification } = manifest
assert.deepEqual(recordedSpecification, specification)
await verifySources()

// Validate engine records independently of application classifications, including raw reconstruction.
function verifyPacket(packet) {
  const { fen, nodes, multiPv, searchMoves, engine, rawLines, bestmove, actualNodes } = packet
  assert.ok(Number.isSafeInteger(actualNodes) && actualNodes > 0 && actualNodes <= nodes + reserve)
  assert.equal(engine.fen, fen); assert.equal(engine.bestmove, bestmove); assert.equal(engine.actualNodes, actualNodes)
  assert.equal(engine.analysisMetadata.engine.actualEngineId, 'Stockfish 19 WASM')
  assert.equal(key(fen, nodes, multiPv, searchMoves), `${fen}|${analysisMetadataKey(engine.analysisMetadata)}`)
  const board = new Chess(fen), legal = board.moves({ verbose: true }).map(m => m.from + m.to + (m.promotion ?? ''))
  assert.ok(legal.includes(bestmove)); if (searchMoves) { assert.equal(searchMoves.length, 1); assert.equal(bestmove, searchMoves[0]) }
  const snapshot = createMultiPvEvidence(Math.min(multiPv, searchMoves?.length ?? legal.length)), latest = new Map()
  let rawNodes = 0, rawBest
  for (const raw of rawLines) {
    snapshot.accept(raw); rawNodes = Math.max(rawNodes, Number(raw.match(/\bnodes (\d+)/)?.[1] ?? 0))
    const score = raw.match(/\bscore (cp|mate) (-?\d+)/)
    if (raw.startsWith('info ') && score && !/\b(?:upperbound|lowerbound)\b/.test(raw)) {
      const multipv = Number(raw.match(/\bmultipv (\d+)/)?.[1] ?? 1)
      latest.set(multipv, { multipv, depth: Number(raw.match(/\bdepth (\d+)/)?.[1] ?? 0),
        evalCp: score[1] === 'cp' ? Number(score[2]) : null, mate: score[1] === 'mate' ? Number(score[2]) : null,
        pv: raw.match(/\bpv (.+)/)?.[1].trim().split(/\s+/) ?? [], raw })
    }
    if (raw.startsWith('bestmove ')) rawBest = raw.split(/\s+/)[1]
  }
  assert.equal(rawNodes, actualNodes); assert.equal(rawBest, bestmove)
  assert.deepEqual([...latest.values()].sort((a, b) => a.multipv - b.multipv), engine.lines)
  assert.deepEqual(snapshot.finish(bestmove), engine.specialLines)
  assert.ok(engine.lines.length)
  for (const line of [...engine.lines, ...engine.specialLines]) {
    assert.ok(Number.isFinite(line.evalCp) || Number.isInteger(line.mate)); assert.ok(line.pv.length)
    if (searchMoves) assert.ok(searchMoves.includes(line.pv[0]))
    const replay = new Chess(fen)
    for (const u of line.pv) { assert.match(u, /^[a-h][1-8][a-h][1-8][qrbn]?$/); replay.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }) }
  }
}
const pool = new Map(), records = [], uses = [], jobs = []
let native, replayCollection, replayCursor = 0, stage = 'normal', searchMs = 0
const stats = { normal: { searches: 0, actualNodes: 0 }, refinement: { searches: 0, actualNodes: 0 } }
if (mode === '--run') {
  try { await access(`${area}/started.json`); throw Error('Already started; no repeated engine run') }
  catch (e) { if (e.code !== 'ENOENT') throw e }
  await save('started.json', { startedAt: new Date().toISOString(), normalNodeCap, deepNodeCap, maxRequests, maxDeepSearches })
} else {
  replayCollection = await read(`${area}/collection.json`); assert.equal(replayCollection.complete, true)
}
function terminal(fen, nodes, multiPv) {
  const board = new Chess(fen); assert.equal(board.moves().length, 0)
  return { fen, evalCp: board.isCheckmate() ? null : 0, mate: board.isCheckmate() ? 0 : null,
    actualNodes: 0, lines: [], specialLines: [], terminal: true,
    analysisMetadata: createAnalysisMetadata({ nodes, multiPv, actualEngineId: 'Stockfish 19 WASM' }) }
}
async function search(fen, nodes, multiPv, options = {}) {
  const { searchMoves } = options, cacheKey = key(fen, nodes, multiPv, searchMoves)
  if (!new Chess(fen).moves().length) return terminal(fen, nodes, multiPv)
  const cached = pool.get(cacheKey)
  if (cached) { uses.push({ stage, fen, nodes, multiPv, ...(searchMoves ? { searchMoves } : {}), file: cached.file, cached: true }); return cached.packet.engine }
  const budget = stage === 'normal' ? normalNodeCap : deepNodeCap
  assert.ok(stats[stage].actualNodes + nodes + reserve <= budget, 'Predeclared budget exhausted')
  assert.ok(stats[stage].searches < (stage === 'normal' ? schedule.length : maxDeepSearches))
  let packet, file
  if (mode === '--run') {
    if (!native) {
      native = new NativeEngine(process.execPath, 120000, [fileURLToPath(new URL('./qa/wasm-engine.cjs', import.meta.url)),
        fileURLToPath(new URL('../node_modules/stockfish/bin/stockfish-19-single.js', import.meta.url))])
      await native.init(); assert.equal(native.version, 'Stockfish 19 WASM')
    }
    const transport = searchMoves ? { version: native.version, request: (commands, handler) => native.request(
      commands.map(c => c.startsWith('go nodes ') ? `${c} searchmoves ${searchMoves.join(' ')}` : c), handler) } : native
    const began = performance.now(), captured = await capturedNodeSearch(transport, fen, nodes, multiPv)
    packet = { ...captured, stage, elapsedMs: performance.now() - began,
      ...(searchMoves ? { searchMoves, engine: { ...captured.engine,
        analysisMetadata: { ...captured.engine.analysisMetadata, searchMoves } } } : {}) }
    verifyPacket(packet)
    file = `search-${String(records.length).padStart(4, '0')}.json`; await save(file, packet)
  } else {
    const expected = replayCollection.packets[replayCursor++]; assert.ok(expected, 'Missing captured search')
    file = expected.file; const bytes = await readFile(`${area}/${file}`); assert.equal(sha(bytes), expected.sha256)
    packet = JSON.parse(bytes); verifyPacket(packet); assert.equal(packet.stage, stage)
    assert.equal(key(packet.fen, packet.nodes, packet.multiPv, packet.searchMoves), cacheKey)
  }
  const record = { file, packet }; pool.set(cacheKey, record); records.push(record)
  stats[stage].searches++; stats[stage].actualNodes += packet.actualNodes; searchMs += packet.elapsedMs
  uses.push({ stage, fen, nodes, multiPv, ...(searchMoves ? { searchMoves } : {}), file, cached: false })
  if (mode === '--run' && (records.length % 10 === 0 || searchMoves)) console.log(JSON.stringify({ stage, searches: stats[stage].searches,
    normalTotal: schedule.length, actualNodes: stats[stage].actualNodes, engineSeconds: Math.round(searchMs / 1000) }))
  return packet.engine
}
async function output(name, value) {
  if (mode === '--run') await save(name, value)
  else assert.deepEqual(await read(`${area}/${name}`), json(value), `Offline replay mismatch: ${name}`)
}
const began = performance.now()
try {
  for (const task of schedule) await search(task.fen, task.nodes, task.multiPv)
  assert.equal(stats.normal.searches, schedule.length)
  const openingBook = createOpeningBook((await read('src/data/openingPositions.json')).positions)
  const getNormal = async fen => {
    if (!new Chess(fen).moves().length) return terminal(fen, ENGINE_CONFIG.nodes, ENGINE_CONFIG.multiPv)
    const record = pool.get(key(fen, ENGINE_CONFIG.nodes, ENGINE_CONFIG.multiPv)); assert.ok(record, 'Unscheduled baseline position')
    return record.packet.engine
  }
  for (const g of games) {
    const liveEntries = await analyzeGame({ moves: g.moves, baseFen: g.baseFen, openingBook,
      analyzePosition: getNormal, analyzePlayedPosition: getNormal })
    g.initial = reclassifyReviewedMoves(liveEntries); g.entries = g.initial
    assert.equal(g.initial.length, g.moves.length)
    g.initialSnapshot = JSON.stringify(g.initial)
    await output(`game-${g.id}-normal.json`, { id: g.id, headers: g.headers, liveEntries, entries: g.initial })
    console.log(JSON.stringify({ classified: g.id, stage: 'normal', plies: g.initial.length }))
  }
  await output('normal-complete.json', { stats: stats.normal, games: games.map(g => ({ id: g.id, plies: g.initial.length })) })
  stage = 'refinement'
  for (let round = 1; round <= maxRounds; round++) for (const g of games) {
    if (g.failed) continue
    const plan = buildRefinementPlan(g.entries)
    if (!plan.selectedPlies.length) continue
    const beforeEntries = JSON.stringify(g.entries), beforeSearches = stats.refinement.searches, beforeNodes = stats.refinement.actualNodes
    const job = { game: g.id, round, plan, status: 'running' }; jobs.push(job)
    if (mode === '--run') console.log(JSON.stringify({ refining: g.id, round, selectedPlies: plan.selectedPlies,
      positions: plan.positions.length, extraSearches: plan.extraSearches }))
    let partial = g.entries
    try {
      const result = await refineGameEntries({ entries: g.entries, plan, analyzePosition: search,
        onEntries: entries => { partial = entries } })
      assert.equal(JSON.stringify(g.entries), beforeEntries)
      g.entries = result.entries; job.status = 'complete'; job.applicationNodes = result.actualNodes; job.applicationSearches = result.searches
    } catch (e) {
      if (mode === '--replay') throw e
      g.entries = partial; g.failed = true; job.status = 'partial'; job.error = e.message
    }
    job.newSearches = stats.refinement.searches - beforeSearches; job.newActualNodes = stats.refinement.actualNodes - beforeNodes
    const view = selectRefinementView(g.entries, true)
    g.rounds.push({ round, entries: g.entries, view, job: json(job) })
    await output(`game-${g.id}-round-${round}.json`, { id: g.id, round, entries: g.entries, view, job })
    console.log(JSON.stringify({ refined: g.id, round, status: job.status, newSearches: job.newSearches }))
  }
} catch (e) {
  if (mode === '--run') await save('failure.json', { complete: false, stage, stats, message: e.message })
  throw e
} finally { native?.close() }
assert.ok(jobs.length <= maxRequests); assert.ok(stats.refinement.searches <= maxDeepSearches)
for (const g of games) assert.equal(JSON.stringify(g.initial), g.initialSnapshot)
await verifySources()
const collection = { complete: true, stats, searchMs, jobs, uses,
  packets: await Promise.all(records.map(async r => ({ file: r.file, sha256: sha(await readFile(`${area}/${r.file}`)) }))) }
await output('collection.json', collection)
if (mode === '--replay') assert.equal(replayCursor, replayCollection.packets.length)
const rows = games.flatMap(g => g.initial.map((entry, i) => {
  const first = g.rounds.find(r => r.round === 1)?.view[i] ?? entry, final = g.rounds.at(-1)?.view[i] ?? entry
  assert.equal(entry.playedMove, g.reference.annotations[i].san)
  const describe = e => ({ classification: labels[e.classification], numerical: labels[e.numericalClassification],
    dropPct: e.dropPct, bestUci: e.bestUci, bestEval: e.bestEval, playedEval: e.playedEval, bestMate: e.bestMate,
    playedMate: e.playedMate, evidence: e.evaluationEvidence, special: e.specialAssessment,
    comparison: e.refinementComparison, bestPv: e.comparisonPv ?? e.engine?.pv, playedPv: e.playedEngine?.pv })
  return { game: g.id, ply: entry.ply, move: `${Math.ceil(entry.ply / 2)}${entry.side === 'b' ? '...' : '.'}`,
    san: entry.playedMove, side: entry.side, expected: g.reference.annotations[i].category,
    initial: labels[entry.classification], first: labels[first.classification], final: labels[final.classification],
    initialDetails: describe(entry), firstDetails: describe(first), finalDetails: describe(final),
    selectedRounds: g.rounds.filter(r => r.job.plan.selectedPlies.includes(entry.ply)).map(r => r.round),
    examined: Boolean(final.refinementComparison?.examined), fenBefore: entry.fenBefore, fenAfter: entry.fenAfter,
    analysisLink: `https://lichess.org/analysis/standard/${entry.fenBefore.replaceAll(' ', '_')}` }
}))
assert.equal(rows.length, 617); assert.ok(rows.every(r => r.initial && r.first && r.final))
function summary(records, phase) {
  const correct = records.filter(r => r[phase] === r.expected), nonBook = records.filter(r => r.expected !== 'Libro')
  const ordinary = records.filter(r => ordinal.includes(r.expected)), matrix = {}
  for (const r of records) { matrix[r.expected] ??= {}; matrix[r.expected][r[phase]] = (matrix[r.expected][r[phase]] ?? 0) + 1 }
  return { total: records.length, exact: correct.length, percent: 100 * correct.length / records.length,
    corrected: records.filter(r => r.initial !== r.expected && r[phase] === r.expected).length,
    regressed: records.filter(r => r.initial === r.expected && r[phase] !== r.expected).length,
    wrongToWrong: records.filter(r => r.initial !== r[phase] && r.initial !== r.expected && r[phase] !== r.expected).length,
    changed: records.filter(r => r.initial !== r[phase]).length,
    nonBook: { total: nonBook.length, exact: nonBook.filter(r => r[phase] === r.expected).length },
    ordinary: { total: ordinary.length, withinOne: ordinary.filter(r => ordinal.includes(r[phase]) && Math.abs(ordinal.indexOf(r.expected) - ordinal.indexOf(r[phase])) <= 1).length },
    categories: Object.values(labels).map(category => {
      const expected = records.filter(r => r.expected === category).length, predicted = records.filter(r => r[phase] === category).length
      const tp = records.filter(r => r.expected === category && r[phase] === category).length
      return { category, expected, predicted, truePositives: tp, falsePositives: predicted - tp, falseNegatives: expected - tp,
        precision: predicted ? tp / predicted : null, recall: expected ? tp / expected : null }
    }), matrix }
}
const totals = Object.fromEntries(['initial', 'first', 'final'].map(s => [s, summary(rows, s)]))
const perGame = games.map(g => ({ id: g.id, white: g.headers.White, black: g.headers.Black, rounds: g.rounds.length,
  failed: g.failed, remainingCandidates: buildRefinementPlan(g.entries).candidateCount,
  ...Object.fromEntries(['initial', 'first', 'final'].map(s => [s, summary(rows.filter(r => r.game === g.id), s)])) }))
const result = { complete: true, independentValidation: true, maxRounds, normalNodeCap, deepNodeCap, stats, searchMs,
  applicationChanged: false, referenceChanged: false, frozenSourcesVerified: frozen.sources.length,
  failedJobs: jobs.filter(j => j.status !== 'complete'), totals, perGame, rows }
await output('results.json', result)
const pct = n => n === null ? 'N/D' : `${(100 * n).toFixed(1)}%`
if (mode === '--run') {
  const report = ['# Validazione indipendente: cinque partite confermate', '',
    '617 semimosse ricontrollate da Carlo prima delle ricerche. Versione corrente mantenuta ferma; nessuna taratura su questo campione.',
    'Profilo iniziale 200k, MultiPV 5, Stockfish 19 large-single WASM. Approfondimento selettivo applicativo: al massimo due clic per partita.', '',
    '| Passaggio | Concordanza esatta | Percentuale | Correzioni rispetto iniziale | Regressioni | Cambi ancora errati |',
    '|---|---:|---:|---:|---:|---:|', ...['initial', 'first', 'final'].map(s => {
      const t = totals[s]; return `| ${s} | ${t.exact}/${t.total} | ${pct(t.exact / t.total)} | ${t.corrected} | ${t.regressed} | ${t.wrongToWrong} |`
    }), '', '| Partita | Iniziale | Primo clic | Fino a due clic | Candidati rimasti |', '|---|---:|---:|---:|---:|',
    ...perGame.map(g => `| ${g.white}–${g.black} (${g.id}) | ${g.initial.exact}/${g.initial.total} | ${g.first.exact}/${g.first.total} | ${g.final.exact}/${g.final.total} | ${g.remainingCandidates} |`), '',
    `Richieste parziali: ${result.failedJobs.length}. Tutti i risultati parziali conservati, nessun retry.`, '',
    ...['initial', 'final'].flatMap(s => { const t = totals[s]; return [
      `## Categorie: ${s}`, '',
      `Escluso Libro atteso: ${t.nonBook.exact}/${t.nonBook.total} (${pct(t.nonBook.exact / t.nonBook.total)}).`,
      `Sei categorie ordinarie entro una classe: ${t.ordinary.withinOne}/${t.ordinary.total} (${pct(t.ordinary.withinOne / t.ordinary.total)}).`, '',
      '| Categoria | Attese | Prodotte | Corrette | Falsi positivi | Non riconosciute | Precisione | Richiamo |',
      '|---|---:|---:|---:|---:|---:|---:|---:|', ...t.categories.map(c => `| ${c.category} | ${c.expected} | ${c.predicted} | ${c.truePositives} | ${c.falsePositives} | ${c.falseNegatives} | ${pct(c.precision)} | ${pct(c.recall)} |`), ''] }),
    '## Cambi prodotti dall’approfondimento', '', '| Partita | Posizione prima della mossa | Confermata | Iniziale | Finale | Esito |', '|---|---|---|---|---|---|',
    ...rows.filter(r => r.initial !== r.final).map(r => `| ${r.game} | [${r.move} ${r.san}](${r.analysisLink}) | ${r.expected} | ${r.initial} | ${r.final} | ${r.final === r.expected ? 'correzione' : r.initial === r.expected ? 'regressione' : 'ancora errata'} |`), '',
    '## Discrepanze finali', '', '| Partita | Posizione prima della mossa | Confermata | Iniziale | Finale | Esaminata |', '|---|---|---|---|---|---|',
    ...rows.filter(r => r.final !== r.expected).map(r => `| ${r.game} | [${r.move} ${r.san}](${r.analysisLink}) | ${r.expected} | ${r.initial} | ${r.final} | ${r.examined ? 'sì' : 'no'} |`), '',
    '## Costo, integrità e limiti', '',
    `Normale: ${stats.normal.searches} ricerche, ${stats.normal.actualNodes}/${normalNodeCap} nodi; approfondimento: ${stats.refinement.searches} ricerche, ${stats.refinement.actualNodes}/${deepNodeCap} nodi.`,
    `Tempo richieste Node WASM: ${(searchMs / 1000).toFixed(1)} secondi. Non è una misura del browser o di un telefono.`,
    `Hash input/sorgenti, incluse ${frozen.sources.length} sorgenti storiche congelate, verificati prima e dopo. Raw UCI, scope, PV e tutte le 617 righe conservati.`,
    'I riferimenti non entrano nei classificatori né nella scelta delle mosse da approfondire. Nessun riuso di cache precedenti.',
    'Campione personale a basso rating: concordanza su queste cinque partite, non precisione generale. Riferimenti esterni trascritti e confermati; Forzata verificata localmente come unica mossa legale.',
    'L’approfondimento riguarda una selezione dell’app; i candidati residui sono dichiarati. Non è un confronto a 1M su tutte le mosse.',
    'Precisione = corrette/prodotte; richiamo = corrette/attese. Nessun denominatore: N/D.',
    'Controllo riproducibile offline: node scripts/validate-holdout.mjs --replay. Non ripetere --run.', '']
  await writeFile(`${area}/report.md`, report.join('\n'), { flag: 'wx' })
} else {
  await save('offline-check.json', { passed: true, newSearches: 0, verifiedSearches: records.length, verifiedPlies: rows.length,
    stats, totals: Object.fromEntries(Object.entries(totals).map(([s, t]) => [s, { exact: t.exact, total: t.total }])),
    sourcesVerified: sources.length, frozenSourcesVerified: frozen.sources.length })
}
await verifySources()
console.log(JSON.stringify({ complete: true, mode, elapsedSeconds: (performance.now() - began) / 1000, stats,
  totals: Object.fromEntries(Object.entries(totals).map(([s, t]) => [s, { exact: t.exact, total: t.total, corrected: t.corrected, regressed: t.regressed }])),
  failedJobs: result.failedJobs.length }, null, 2))
