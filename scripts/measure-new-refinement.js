import { readFile, writeFile, mkdir, access, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { performance } from 'node:perf_hooks'
import assert from 'node:assert/strict'
import { Chess } from 'chess.js'
import { capturedNodeSearch } from './qa/captured-node-search.js'
import { createMultiPvEvidence } from '../src/lib/multiPvEvidence.js'
import { createAnalysisMetadata, analysisMetadataKey } from '../src/lib/analysisMetadata.js'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'
import { buildRefinementPlan, refineGameEntries, selectRefinementView, REFINEMENT_POLICY } from '../src/lib/analysisRefinement.js'
import { SACRIFICE_SEARCH_POLICY } from '../src/lib/sacrificeSearches.js'

const area = 'agent-output/new-refinement-measurement-v1'
const mode = process.argv[2]
assert.ok(['--prepare', '--run', '--replay'].includes(mode), 'Use --prepare, --run once, --replay offline')
const ids = ['185262315732', '184316820266', '184316313800', '185230271130', '185230000668']
const maxRounds = 2
const maxRequests = ids.length * maxRounds
const maxSearches = maxRequests * (2 * REFINEMENT_POLICY.maxMoves + 2 * SACRIFICE_SEARCH_POLICY.maxOffers)
const capPerRequest = 2 * REFINEMENT_POLICY.maxMoves * (REFINEMENT_POLICY.nodes + REFINEMENT_POLICY.reserve)
  + 2 * SACRIFICE_SEARCH_POLICY.maxOffers * (SACRIFICE_SEARCH_POLICY.nodes + SACRIFICE_SEARCH_POLICY.reserve)
const actualNodeCap = maxRequests * capPerRequest
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const json = v => JSON.parse(JSON.stringify(v))
const watched = new Map()
async function input(path) { const bytes = await readFile(path); watched.set(path, sha(bytes)); return JSON.parse(bytes) }
const save = (name, data) => writeFile(`${area}/${name}`, JSON.stringify(json(data), null, 2) + '\n', { flag: 'wx' })
async function verify() { for (const [path, expected] of watched) assert.equal(sha(await readFile(path)), expected, path) }
const lock = await input('agent-output/specials-frozen-candidate-v1.json')
for (const s of lock.sources) { assert.equal(sha(await readFile(s.path)), s.sha256, s.path); watched.set(s.path, s.sha256) }
async function watchTree(folder) {
  for (const e of await readdir(folder, { withFileTypes: true })) {
    const path = `${folder}/${e.name}`
    if (e.isDirectory()) await watchTree(path)
    else if (e.isFile()) watched.set(path, sha(await readFile(path)))
  }
}
await watchTree('src/lib')
for (const path of ['scripts/measure-new-refinement.js', 'scripts/qa/captured-node-search.js',
  'scripts/qa/native-engine.js', 'scripts/qa/wasm-engine.cjs', `${area}/protocol.md`,
  'node_modules/stockfish/package.json', 'node_modules/stockfish/bin/stockfish-19-single.js',
  'node_modules/stockfish/bin/stockfish-19-single.wasm']) watched.set(path, sha(await readFile(path)))
const label = { book: 'Libro', forced: 'Forzata', best: 'Migliore', excellent: 'Ottima', good: 'Buona',
  inaccuracy: 'Imprecisione', mistake: 'Errore', blunder: 'Errore grave', great: 'Grande', brilliant: 'Geniale',
  missed: 'Mossa mancata', unclassified: 'Non valutabile' }
const games = []
for (const id of ids) {
  const data = await input(`agent-output/new-references-200k-v1/game-${id}.json`)
  const referencePath = `Partite/Confermate/chesscom-${id}/riferimento.json`
  const reference = await input(referencePath)
  assert.equal(reference.status, 'user-confirmed')
  assert.ok(reference.annotations.every(a => a.userConfirmed && !a.needsReview))
  const pgnPath = `Partite/Confermate/chesscom-${id}/partita.pgn`, pgn = await readFile(pgnPath)
  watched.set(pgnPath, sha(pgn))
  const chess = new Chess(); chess.loadPgn(pgn.toString())
  assert.deepEqual(chess.history(), reference.annotations.map(a => a.san))
  const entries = reclassifyReviewedMoves(data.liveEntries)
  assert.equal(entries.length, reference.annotations.length)
  assert.ok(entries.every((e, i) => e.playyedMove === undefined && e.playedMove === reference.annotations[i].san))
  const firstPlan = buildRefinementPlan(entries)
  games.push({ id, headers: data.headers, reference, initial: entries, entries, firstPlan, rounds: [] })
}
const pool = new Map(), uses = []
const key = (fen, nodes, multiPv, searchMoves) => `${fen}|${analysisMetadataKey({
  ...createAnalysisMetadata({ nodes, multiPv }), ...(searchMoves ? { searchMoves } : {}) })}`

function verifyPacket(packet) {
  const { fen, nodes, multiPv, rawLines, engine, bestmove, actualNodes } = packet
  assert.equal(engine.fen, fen); assert.equal(engine.bestmove, bestmove)
  assert.equal(engine.actualNodes, actualNodes)
  assert.ok(Number.isSafeInteger(actualNodes) && actualNodes > 0 && actualNodes <= nodes + 5000)
  const roots = packet.searchMoves
  assert.equal(analysisMetadataKey(engine.analysisMetadata), analysisMetadataKey({
    ...createAnalysisMetadata({ nodes, multiPv }), ...(roots ? { searchMoves: roots } : {}) }))
  const chess = new Chess(fen), legal = chess.moves({ verbose: true }).map(m => `${m.from}${m.to}${m.promotion ?? ''}`)
  assert.ok(legal.includes(bestmove))
  if (roots) { assert.equal(roots.length, 1); assert.equal(bestmove, roots[0]) }
  const evidence = createMultiPvEvidence(Math.min(multiPv, roots?.length ?? legal.length)), latest = new Map()
  let telemetryNodes = 0, finalMove
  for (const raw of rawLines) {
    evidence.accept(raw)
    telemetryNodes = Math.max(telemetryNodes, Number(raw.match(/\bnodes (\d+)/)?.[1] ?? 0))
    const score = raw.match(/\bscore (cp|mate) (-?\d+)/)
    if (raw.startsWith('info ') && score && !/\b(?:upperbound|lowerbound)\b/.test(raw)) {
      const multipv = Number(raw.match(/\bmultipv (\d+)/)?.[1] ?? 1)
      latest.set(multipv, { multipv, depth: Number(raw.match(/\bdepth (\d+)/)?.[1] ?? 0),
        evalCp: score[1] === 'cp' ? Number(score[2]) : null, mate: score[1] === 'mate' ? Number(score[2]) : null,
        pv: raw.match(/\bpv (.+)/)?.[1].trim().split(/\s+/) ?? [], raw })
    }
    if (raw.startsWith('bestmove ')) finalMove = raw.split(/\s+/)[1]
  }
  assert.equal(finalMove, bestmove); assert.equal(telemetryNodes, actualNodes)
  assert.deepEqual(engine.specialLines, evidence.finish(bestmove))
  assert.deepEqual(engine.lines, [...latest.values()].sort((a, b) => a.multipv - b.multipv))
  for (const line of [...engine.lines, ...engine.specialLines]) {
    if (roots) assert.ok(roots.includes(line.pv[0]))
    const replay = new Chess(fen)
    for (const u of line.pv) replay.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] })
  }
}
// The earlier protocol records the restriction explicitly. Add only that proven scope.
for (let i = 0; i < 7; i++) {
  const path = `agent-output/targeted-special-evidence-v1/search-${i}.json`, prior = await input(path)
  const searchMoves = prior.scope === 'forced-root-move' ? [prior.uci] : undefined
  const packet = { ...prior, ...(searchMoves ? { searchMoves,
    engine: { ...prior.engine, analysisMetadata: { ...prior.engine.analysisMetadata, searchMoves } } } : {}) }
  verifyPacket(packet)
  pool.set(key(packet.fen, packet.nodes, packet.multiPv, packet.searchMoves), { packet, path, reuse: 'prior-study' })
}
const sources = [...watched].map(([path, sha256]) => ({ path, sha256 }))
if (mode === '--prepare') {
  await mkdir(area, { recursive: true })
  await save('manifest.json', { date: '2026-10-14', maxRounds, maxRequests, maxSearches, capPerRequest, actualNodeCap,
    cohort: 'five previously studied user-confirmed games; not independent validation',
    engine: 'Stockfish19 large-single WASM; Threads1 Hash16 clear-per-search',
    games: games.map(g => ({ id: g.id, plies: g.initial.length, firstPlan: g.firstPlan })), sources })
  console.log(JSON.stringify({ prepared: true, maxRounds, maxRequests, maxSearches, actualNodeCap,
    firstPassCap: games.reduce((n, g) => n + g.firstPlan.actualNodeCap, 0) })); process.exit(0)
}
const manifest = await input(`${area}/manifest.json`)
assert.deepEqual(manifest.sources, sources)
assert.deepEqual(manifest.games.map(g => g.firstPlan), games.map(g => g.firstPlan))
assert.equal(manifest.actualNodeCap, actualNodeCap)
await verify()
let native, actualNodes = 0, searches = 0, searchMs = 0, cursor = 0
const started = performance.now(), packets = [], jobs = []
const frozenInitial = games.map(g => JSON.stringify(g.initial))
let collection
if (mode === '--run') {
  try { await access(`${area}/started.json`); throw Error('Already started: do not rerun') }
  catch (e) { if (e.code !== 'ENOENT') throw e }
  await save('started.json', { startedAt: new Date().toISOString(), actualNodeCap, maxSearches, maxRequests })
} else {
  collection = await input(`${area}/collection.json`)
  assert.equal(collection.complete, true)
  for (const record of collection.packets) {
    const packet = await input(`${area}/${record.file}`); assert.equal(sha(await readFile(`${area}/${record.file}`)), record.sha256)
    verifyPacket(packet); packets.push({ packet, path: `${area}/${record.file}`, reuse: 'new-search' })
  }
}

async function analyzePosition(fen, nodes, multiPv, options = {}) {
  const searchMoves = options.searchMoves, cacheKey = key(fen, nodes, multiPv, searchMoves)
  const cached = pool.get(cacheKey)
  if (cached) { uses.push({ fen, nodes, multiPv, searchMoves, path: cached.path, reuse: cached.reuse }); return cached.packet.engine }
  assert.ok(searches < maxSearches && actualNodes + nodes + 5000 <= actualNodeCap, 'Study budget exhausted')
  let record
  if (mode === '--run') {
    if (!native) {
      const { NativeEngine } = await import('./qa/native-engine.js')
      native = new NativeEngine(process.execPath, 120000, [fileURLToPath(new URL('./qa/wasm-engine.cjs', import.meta.url)),
        fileURLToPath(new URL('../node_modules/stockfish/bin/stockfish-19-single.js', import.meta.url))])
      await native.init(); assert.equal(native.version, 'Stockfish 19 WASM')
    }
    const transport = searchMoves ? { version: native.version, request: (commands, handler) =>
      native.request(commands.map(c => c.startsWith('go nodes ') ? `${c} searchmoves ${searchMoves.join(' ')}` : c), handler) } : native
    const began = performance.now(), captured = await capturedNodeSearch(transport, fen, nodes, multiPv)
    const packet = { ...captured, elapsedMs: performance.now() - began,
      ...(searchMoves ? { searchMoves, engine: { ...captured.engine,
        analysisMetadata: { ...captured.engine.analysisMetadata, searchMoves } } } : {}) }
    verifyPacket(packet)
    const file = `search-${String(searches).padStart(3, '0')}.json`
    await save(file, packet)
    record = { packet, path: `${area}/${file}`, reuse: 'new-search' }
    packets.push(record)
  } else {
    record = packets[cursor++]; assert.ok(record, 'Missing captured search')
    assert.equal(key(record.packet.fen, record.packet.nodes, record.packet.multiPv, record.packet.searchMoves), cacheKey)
  }
  searches++; actualNodes += record.packet.actualNodes; searchMs += record.packet.elapsedMs
  assert.ok(actualNodes <= actualNodeCap)
  pool.set(cacheKey, record)
  uses.push({ fen, nodes, multiPv, searchMoves, path: record.path, reuse: record.reuse })
  console.log(JSON.stringify({ searches, actualNodes, maxNodes: actualNodeCap, scope: searchMoves ? 'acceptance' : 'position' }))
  return record.packet.engine
}

try {
  for (let round = 1; round <= maxRounds; round++) for (const game of games) {
    if (game.failed) continue
    const plan = buildRefinementPlan(game.entries)
    if (!plan.selectedPlies.length) continue
    const job = { game: game.id, round, plan, beforeSearches: searches, beforeActualNodes: actualNodes }
    jobs.push(job)
    const before = JSON.stringify(game.entries)
    console.log(JSON.stringify({ game: game.id, round, selected: plan.selectedPlies, positions: plan.positions.length, extraSearches: plan.extraSearches }))
    let partial = game.entries
    try {
      const result = await refineGameEntries({ entries: game.entries, plan, analyzePosition,
        onEntries: entries => { partial = entries } })
      assert.equal(JSON.stringify(game.entries), before)
      game.entries = result.entries
      job.status = 'complete'; job.applicationNodes = result.actualNodes; job.applicationSearches = result.searches
    } catch (error) {
      // Record failures without retrying the engine or silently changing its policy.
      game.entries = partial; game.failed = true; job.status = 'partial'; job.error = error.message
    }
    const view = selectRefinementView(game.entries, true)
    job.newSearches = searches - job.beforeSearches; job.newActualNodes = actualNodes - job.beforeActualNodes
    game.rounds.push({ round, entries: game.entries, view, job: json(job) })
    if (mode === '--run') await save(`game-${game.id}-round-${round}.json`, { id: game.id, round,
      entries: game.entries, view, job })
    console.log(JSON.stringify({ game: game.id, round, status: job.status, newSearches: job.newSearches,
      correct: view.filter((e, i) => label[e.classification] === game.reference.annotations[i].category).length }))
  }
} finally { native?.close() }
for (const [i, g] of games.entries()) assert.equal(JSON.stringify(g.initial), frozenInitial[i])
assert.ok(jobs.length <= maxRequests && searches <= maxSearches && actualNodes <= actualNodeCap)
if (mode === '--replay') { assert.equal(cursor, packets.length); assert.equal(actualNodes, collection.actualNodes); assert.deepEqual(jobs, collection.jobs) }
await verify()
if (mode === '--run') await save('collection.json', { complete: true, actualNodes, searches, searchMs, jobs,
  totalElapsedMs: performance.now() - started,
  packets: await Promise.all(packets.map(async r => ({ file: r.path.slice(area.length + 1), sha256: sha(await readFile(r.path)) }))) })

const rows = games.flatMap(g => g.initial.map((e, i) => {
  const first = g.rounds.find(r => r.round === 1)?.view[i] ?? e
  const final = g.rounds.at(-1)?.view[i] ?? e
  return { game: g.id, ply: e.ply, move: `${Math.ceil(e.ply / 2)}${e.side === 'b' ? '...' : '.'}`, san: e.playedMove,
    expected: g.reference.annotations[i].category, initial: label[e.classification], first: label[first.classification], final: label[final.classification],
    examined: Boolean(final.refinementComparison?.examined), selectedRounds: g.rounds.filter(r => r.job.plan.selectedPlies.includes(e.ply)).map(r => r.round),
    fenBefore: e.fenBefore, fenAfter: e.fenAfter,
    initialDrop: e.dropPct, finalDrop: final.dropPct, evidence: final.evaluationEvidence, special: final.specialAssessment,
    analysisLink: `https://lichess.org/analysis/standard/${e.fenBefore.replaceAll(' ', '_')}` }
}))
const categories = Object.values(label)
function summary(records, stage) {
  const exact = records.filter(r => r[stage] === r.expected).length
  return { total: records.length, exact, percent: 100 * exact / records.length,
    corrected: records.filter(r => r.initial !== r.expected && r[stage] === r.expected).length,
    regressed: records.filter(r => r.initial === r.expected && r[stage] !== r.expected).length,
    changed: records.filter(r => r.initial !== r[stage]).length,
    wrongToWrong: records.filter(r => r.initial !== r[stage] && r.initial !== r.expected && r[stage] !== r.expected).length,
    nonBook: { total: records.filter(r => r.expected !== 'Libro').length,
      exact: records.filter(r => r.expected !== 'Libro' && r[stage] === r.expected).length },
    categories: categories.map(category => ({ category, expected: records.filter(r => r.expected === category).length,
      predicted: records.filter(r => r[stage] === category).length,
      correct: records.filter(r => r.expected === category && r[stage] === category).length,
      falsePositives: records.filter(r => r.expected !== category && r[stage] === category).length })) }
}
const totals = Object.fromEntries(['initial', 'first', 'final'].map(stage => [stage, summary(rows, stage)]))
assert.equal(totals.initial.exact, 167); assert.equal(rows.length, 262)
const perGame = games.map(g => ({ id: g.id, white: g.headers.White, black: g.headers.Black,
  rounds: g.rounds.length, failed: Boolean(g.failed), remainingCandidates: buildRefinementPlan(g.entries).candidateCount,
  ...Object.fromEntries(['initial', 'first', 'final'].map(stage => [stage, summary(rows.filter(r => r.game === g.id), stage)])) }))
const result = { complete: true, maxRounds, actualNodeCap, actualNodes, searches, searchMs,
  cacheUses: uses.filter(r => r.reuse !== 'new-search').length, priorStudyUses: uses.filter(r => r.reuse === 'prior-study').length,
  applicationCalls: uses.length, independentValidation: false, failedJobs: jobs.filter(j => j.status !== 'complete'),
  totals, perGame, jobs, uses, rows, sources: [...watched].map(([path, sha256]) => ({ path, sha256 })) }
if (mode === '--run') {
  await save('results.json', result)
  const changed = rows.filter(r => r.initial !== r.final), remaining = rows.filter(r => r.final !== r.expected)
  const report = ['# Approfondimento: confronto con le etichette confermate', '',
    'Cinque partite già studiate, 262 semimosse. Un primo clic e al massimo un secondo clic per partita; nessuna modifica delle regole.',
    'Riferimenti usati solo per misurare i risultati. Questo campione non è una validazione indipendente.', '',
    '| Passaggio | Corrispondenze | Percentuale | Correzioni | Regressioni | Cambi tra etichette errate |',
    '|---|---:|---:|---:|---:|---:|', ...['initial', 'first', 'final'].map(stage => {
      const s = totals[stage]; return `| ${stage} | ${s.exact}/${s.total} | ${s.percent.toFixed(1)}% | ${s.corrected} | ${s.regressed} | ${s.wrongToWrong} |`
    }), '', '| Partita | Iniziale | Primo clic | Fino a due clic | Candidati rimasti |', '|---|---:|---:|---:|---:|',
    ...perGame.map(g => `| ${g.id}: ${g.white}–${g.black} | ${g.initial.exact}/${g.initial.total} | ${g.first.exact} | ${g.final.exact} | ${g.remainingCandidates} |`), '',
    `Nuove ricerche: ${searches}; nodi effettivi: ${actualNodes}/${actualNodeCap}; tempo motore Node WASM: ${(searchMs / 1000).toFixed(1)} s.`,
    'Il tempo non misura browser o telefono. Riuso di ricerche con stesso FEN e profilo, incluse le sette ricerche mirate già raccolte.',
    `Richieste parziali: ${result.failedJobs.length}. Le parti completate sono incluse e non vengono rilanciate automaticamente.`, '',
    '## Cambi di etichetta', '', '| Partita | Mossa | Confermata | Iniziale | Approfondita | Esito |', '|---|---|---|---|---|---|',
    ...changed.map(r => `| ${r.game} | [${r.move} ${r.san}](${r.analysisLink}) | ${r.expected} | ${r.initial} | ${r.final} | ${r.final === r.expected ? 'correzione' : r.initial === r.expected ? 'regressione' : 'ancora errata'} |`), '',
    '## Discrepanze rimaste', '', '| Partita | Posizione prima della mossa | Confermata | Approfondita | Esaminata |', '|---|---|---|---|---|',
    ...remaining.map(r => `| ${r.game} | [${r.move} ${r.san}](${r.analysisLink}) | ${r.expected} | ${r.final} | ${r.examined ? 'sì' : 'no'} |`), '',
    'Tutti i FEN prima/dopo, le prove e le selezioni sono in results.json. Snapshot ricostruiti dai raw UCI, PV legali e hash verificati; baseline conservata.', '']
  await writeFile(`${area}/report.md`, report.join('\n'), { flag: 'wx' })
} else {
  const recorded = await input(`${area}/results.json`)
  assert.deepEqual(recorded.totals, totals); assert.deepEqual(recorded.rows, rows); assert.deepEqual(recorded.perGame, perGame)
  await save('offline-check.json', { passed: true, newSearches: 0, verifiedSearches: searches,
    actualNodes, frozenSources: lock.sources.length, totals })
}
console.log(JSON.stringify({ complete: true, mode, searches, actualNodes, totals, failedJobs: result.failedJobs }, null, 2))
