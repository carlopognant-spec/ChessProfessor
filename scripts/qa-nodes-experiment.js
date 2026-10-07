import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { performance } from 'node:perf_hooks'
import { Chess } from 'chess.js'
import { NativeEngine } from './qa/native-engine.js'
import { fixtureMoves, validateCache, compare, labels, summarizeReports } from './qa/compare.js'
import { ENGINE_CONFIG } from '../src/lib/engineConfig.js'
import { createOpeningBook } from '../src/lib/openingBook.js'

// Explicit whitelist: never discover/import Partite, personal-07..10 or the sanity game.
const root = fileURLToPath(new URL('../', import.meta.url))
const base = path.join(root, 'tests/fixtures/qa')
const ids = [...Array.from({ length: 6 }, (_, i) => `personal-0${i + 1}`), 'game-1-chigorin-steinitz-1892', 'game-2-saintamant-staunton-1843']
const budget = 200000, multiPv = 5
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const output = path.join(base, 'analysis-cache-large-200k', stamp)
const json = async filename => JSON.parse(await readFile(filename, 'utf8'))
const digest = buffer => createHash('sha256').update(buffer).digest('hex')
const save = (name, value) => writeFile(path.join(output, name), JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
const ordinal = ['Migliore', 'Ottima', 'Buona', 'Imprecisione', 'Errore', 'Errore grave']
let engine, context = 'preflight', goCount = 0
const protectedFiles = [], games = [], baselineReports = [], candidateReports = [], changes = []
const started = performance.now(), startedAt = new Date().toISOString()

async function protect(filename) {
  protectedFiles.push({ file: path.relative(root, filename).replaceAll('\\', '/'), sha256: digest(await readFile(filename)) })
}
async function protectTree(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name)
    if (entry.isDirectory()) await protectTree(filename)
    else if (entry.isFile()) await protect(filename)
  }
}
function numbers(values) {
  const a = values.filter(Number.isFinite).sort((x, y) => x - y), n = a.length
  return { n, median: n ? (a[Math.floor((n - 1) / 2)] + a[Math.floor(n / 2)]) / 2 : null,
    p90: n ? a[Math.ceil(n * .9) - 1] : null, max: n ? a[n - 1] : null, mean: n ? a.reduce((s, x) => s + x, 0) / n : null }
}
function appReport(fixture, cache, suspects, openingBook) {
  const report = compare(fixture, cache, suspects, { openingBook })
  // Legacy QA retains numeric categories on excluded Book rows. For the app
  // category/change list, restore the unchanged app's protected Book category.
  // Book expectations stay excluded by the existing QA policy.
  report.rows = report.rows.map(row => row.isBookMove ? { ...row, classification: 'book', baseClassification: 'book', actual: labels.book } : row)
  report.exact = report.rows.filter(row => !row.reasons.length && row.actual === row.expected).length
  report.withinOne = report.rows.filter(row => !row.reasons.length && ordinal.includes(row.expected) && ordinal.includes(row.actual)
    && Math.abs(ordinal.indexOf(row.expected) - ordinal.indexOf(row.actual)) <= 1).length
  report.exactPct = report.included ? 100 * report.exact / report.included : null
  report.withinOnePct = report.ordinalIncluded ? 100 * report.withinOne / report.ordinalIncluded : null
  report.matrix = {}
  for (const row of report.rows.filter(row => !row.reasons.length)) {
    report.matrix[row.expected] ??= {}
    report.matrix[row.expected][row.actual] = (report.matrix[row.expected][row.actual] ?? 0) + 1
  }
  return report
}
function validateNodes(cache, fixture) {
  const moves = fixtureMoves(fixture), game = new Chess()
  if (cache.searchLimit?.kind !== 'nodes' || cache.searchLimit.value !== budget || cache.depth !== null || cache.entries.length !== moves.length) throw Error('Cache nodi incompatibile')
  for (const [i, entry] of cache.entries.entries()) {
    if (entry.ply !== i + 1 || entry.san !== moves[i] || entry.fenBefore !== game.fen()) throw Error('Cache posizione incoerente')
    const move = game.move(moves[i])
    if (entry.uci !== move.from + move.to + (move.promotion ?? '') || entry.fenAfter !== game.fen()) throw Error('Cache mossa incoerente')
    for (const [fen, result] of [[entry.fenBefore, entry.engine], [entry.fenAfter, entry.playedEngine]]) {
      if (!result || !Array.isArray(result.lines) || ![result.evalCp, result.mate].every(x => x === null || Number.isFinite(x))) throw Error('Score nodi non valido')
      const position = new Chess(fen)
      if (!Number.isFinite(result.evalCp) && !Number.isFinite(result.mate) && !position.isCheckmate() && !position.isStalemate()) throw Error('Score non terminale assente')
    }
  }
}
async function search(fen) {
  await engine.request(['ucinewgame', 'setoption name Clear Hash', 'isready'], line => line === 'readyok' ? true : undefined)
  goCount++
  const result = await engine.analyzeNodes(fen, budget, multiPv)
  const position = new Chess(fen)
  if (result.evalCp == null && result.mate == null && !position.isCheckmate() && !position.isStalemate()) throw Error('Analisi senza score: ' + fen)
  return result
}
const score = (cp, mate) => mate != null ? `mate ${mate}` : cp ?? 'N/D'
const cell = x => x == null ? 'N/D' : String(x).replaceAll('|', '\\|').replaceAll('\n', ' ')
const metricLine = (name, s) => `| ${name} | ${s.exact}/${s.included} | ${s.exactPct?.toFixed(2)}% | ${s.withinOne}/${s.ordinalIncluded} | ${s.withinOnePct?.toFixed(2)}% |`

try {
  if (process.argv.length !== 2) throw Error('Nessun argomento previsto: output nuovo, budget fisso 200000')
  const suspects = await json(path.join(base, 'suspect-labels.json'))
  const openingBook = createOpeningBook((await json(path.join(root, 'src/data/openingPositions.json'))).positions)
  await protectTree(path.join(base, 'analysis-cache'))
  await protectTree(path.join(base, 'analysis-cache-searchmoves'))
  await protectTree(path.join(root, 'src'))
  await protect(path.join(base, 'suspect-labels.json'))
  for (const id of ids) await protect(path.join(base, id + '.json'))
  const packageInfo = await json(path.join(root, 'node_modules/stockfish/package.json'))
  if (packageInfo.version !== '19.0.0') throw Error('Pacchetto stockfish inatteso: ' + packageInfo.version)
  const enginePath = path.join(root, 'node_modules/stockfish/bin/stockfish-19-single.js')
  const engineFiles = await Promise.all([enginePath, enginePath.replace(/\.js$/, '.wasm')].map(async file => {
    const buffer = await readFile(file)
    if (buffer.length > 100000000) throw Error('File motore oltre 100 MB')
    return { file: path.relative(root, file).replaceAll('\\', '/'), bytes: buffer.length, sha256: digest(buffer) }
  }))
  const inputs = []
  for (const id of ids) {
    const fixture = { ...await json(path.join(base, id + '.json')), id }
    const baseline = await json(path.join(base, 'analysis-cache', id + '.json'))
    validateCache(baseline, fixture, ENGINE_CONFIG)
    inputs.push({ fixture, baseline })
  }
  const totalPlies = inputs.reduce((s, x) => s + x.baseline.entries.length, 0)
  await mkdir(path.dirname(output), { recursive: true })
  await mkdir(output) // Existing runs must never be overwritten.
  await save('run-plan.json', { startedAt, output, ids, totalPlies, expectedGo: 2 * totalPlies, budget, multiPv, threads: 1, hashMb: 16, hashPolicy: 'fresh process per game; ucinewgame + Clear Hash before every search; no position reuse', packageVersion: packageInfo.version, engineFiles, protectedFiles, classification: ENGINE_CONFIG.classification, missedOpportunity: ENGINE_CONFIG.missedOpportunity })
  console.log('OUTPUT ' + output + '\nPLAN ' + totalPlies + ' ply, ' + 2 * totalPlies + ' go')
  for (const { fixture, baseline } of inputs) {
    context = fixture.id + '/init'
    const gameStart = performance.now()
    engine = new NativeEngine(process.execPath, 180000, [path.join(root, 'scripts/qa/wasm-engine.cjs'), enginePath])
    await engine.init()
    if (engine.version !== 'Stockfish 19 WASM') throw Error('Motore inatteso: ' + engine.version)
    await engine.newGame()
    const cache = { schemaVersion: 1, pgn: fixture.pgn, engineVersion: engine.version, engineBuild: 'stockfish-19-single', packageVersion: packageInfo.version,
      depth: null, searchLimit: { kind: 'nodes', value: budget }, multiPv, scorePerspective: 'side-to-move at each FEN', threads: 1, hashMb: 16,
      hashPolicy: 'ucinewgame + Clear Hash before every search', generatedAt: new Date().toISOString(), entries: [] }
    for (const original of baseline.entries) {
      context = fixture.id + '/ply-' + original.ply + '/before'
      const before = await search(original.fenBefore)
      context = fixture.id + '/ply-' + original.ply + '/after'
      const after = await search(original.fenAfter)
      cache.entries.push({ ply: original.ply, san: original.san, uci: original.uci, fenBefore: original.fenBefore, fenAfter: original.fenAfter, engine: before, playedEngine: after })
      if (original.ply % 10 === 0 || original.ply === baseline.entries.length) console.log(fixture.id + ' ' + original.ply + '/' + baseline.entries.length + ' ply; go=' + goCount + '; elapsed=' + ((performance.now() - started) / 1000).toFixed(1) + 's')
    }
    engine.close(); engine = null
    validateNodes(cache, fixture)
    await save(fixture.id + '.json', cache)
    const oldReport = appReport(fixture, baseline, suspects, openingBook), newReport = appReport(fixture, cache, suspects, openingBook)
    baselineReports.push(oldReport); candidateReports.push(newReport)
    for (const [i, row] of newReport.rows.entries()) {
      const previous = oldReport.rows[i]
      if (previous.actual !== row.actual) changes.push({ id: fixture.id, ply: row.ply, san: row.san, expected: row.expected, oldCategory: previous.actual, newCategory: row.actual,
        oldBestCp: previous.bestEval, oldBestMate: previous.bestMate, oldPlayedCp: previous.playedEval, oldPlayedMate: previous.playedMate, oldDropPp: previous.dropPct,
        newBestCp: row.bestEval, newBestMate: row.bestMate, newPlayedCp: row.playedEval, newPlayedMate: row.playedMate, newDropPp: row.dropPct,
        oldSource: previous.evaluationSource, newSource: row.evaluationSource, oldExclusions: previous.reasons, newExclusions: row.reasons })
    }
    const searches = cache.entries.flatMap(e => [e.engine, e.playedEngine])
    games.push({ id: fixture.id, plies: cache.entries.length, go: searches.length, wallSeconds: (performance.now() - gameStart) / 1000,
      searchSeconds: searches.reduce((s, r) => s + r.elapsedMs, 0) / 1000, perSearchSeconds: numbers(searches.map(r => r.elapsedMs / 1000)),
      realDepth: numbers(searches.map(r => r.lines[0]?.depth)), discardedBounds: searches.reduce((s, r) => s + r.bounds.length, 0),
      sources: newReport.rows.reduce((s, r) => { s[r.evaluationSource] = (s[r.evaluationSource] ?? 0) + 1; return s }, {}),
      categoryChanges: changes.filter(c => c.id === fixture.id).length,
      baseline: summarizeReports([oldReport]), candidate: summarizeReports([newReport]) })
  }
  context = 'report/integrity'
  for (const item of protectedFiles) if (digest(await readFile(path.join(root, item.file))) !== item.sha256) throw Error('File protetto modificato: ' + item.file)
  const groups = ['personal', 'historical', 'all'].map(group => {
    const include = r => group === 'all' || r.id.startsWith(group === 'personal' ? 'personal-' : 'game-')
    return { group, baseline: summarizeReports(baselineReports.filter(include)), candidate: summarizeReports(candidateReports.filter(include)) }
  })
  const summary = { completed: true, startedAt, finishedAt: new Date().toISOString(), totalElapsedSeconds: (performance.now() - started) / 1000, goCount, budget, engineVersion: 'Stockfish 19 WASM', engineBuild: 'stockfish-19-single', baselineIntegrityVerified: true, groups, games, categoryChanges: changes.length, changes }
  await save('summary.json', summary)
  await save('classifications.json', { baseline: baselineReports, candidate: candidateReports })
  const columns = Object.keys(changes[0] ?? { id: '', ply: '', san: '' })
  const csv = value => '"' + String(Array.isArray(value) ? value.join(',') : value ?? '').replaceAll('"', '""') + '"'
  await writeFile(path.join(output, 'category-changes.csv'), [columns.map(csv).join(','), ...changes.map(c => columns.map(k => csv(c[k])).join(','))].join('\n') + '\n', { flag: 'wx' })
  const lines = ['# 2.2b — Stockfish 19 large-single, 200.000 nodi', '',
    'Esperimento offline; nessuna adozione di default. MultiPV 5, Threads 1, Hash 16 MB. Processo nuovo per partita; ucinewgame e Clear Hash prima di ogni ricerca. Due ricerche per ply, nessun riuso della posizione successiva. Score grezzi dalla prospettiva side-to-move; score classificati normalizzati a chi muove.', '',
    'Baseline: cache originali Stockfish 16, depth 12. Differiscono motore, budget e storia hash: il confronto non isola una sola causa. Soglie 1/3/5/10/20, modello, Libro, cap e Mossa mancata invariati.', '',
    'QA: esclusioni attuali Libro, Forzata, Grande/Geniale, etichette sospette e score mancanti. Mossa mancata entra in esatta ma non nella scala ordinale. Le righe Libro sono mostrate con la categoria protetta dell’app; il vecchio helper QA le mostra numericamente pur escludendole dalle metriche. Non modificato.', '',
    '| Gruppo/schema | Esatta | % | Entro una classe | % |', '|---|---:|---:|---:|---:|',
    ...groups.flatMap(g => [metricLine(g.group + ' baseline', g.baseline), metricLine(g.group + ' large 200k', g.candidate)]), '',
    '| Partita | Ply | go | Secondi ricerca | Secondi sessione | Mediana s/go | P90 s/go | Cambi categorie |', '|---|---:|---:|---:|---:|---:|---:|---:|',
    ...games.map(g => `| ${g.id} | ${g.plies} | ${g.go} | ${g.searchSeconds.toFixed(3)} | ${g.wallSeconds.toFixed(3)} | ${g.perSearchSeconds.median.toFixed(3)} | ${g.perSearchSeconds.p90.toFixed(3)} | ${g.categoryChanges} |`), '',
    `go totali: ${goCount}; tempo totale: ${summary.totalElapsedSeconds.toFixed(3)} s. Integrità input/cache/src verificata con SHA-256.`, '',
    '## Tutti i ply che cambiano categoria', '',
    '| Partita | ply | SAN | Attesa | Vecchia | Nuova | best vecchio cp/mate | played vecchio cp/mate | perdita vecchia pp | best nuovo cp/mate | played nuovo cp/mate | perdita nuova pp | Esclusioni vecchie/nuove |',
    '|---|---:|---|---|---|---|---:|---:|---:|---:|---:|---:|---|',
    ...changes.map(c => '| ' + [c.id, c.ply, c.san, c.expected, c.oldCategory, c.newCategory, score(c.oldBestCp, c.oldBestMate), score(c.oldPlayedCp, c.oldPlayedMate), c.oldDropPp, score(c.newBestCp, c.newBestMate), score(c.newPlayedCp, c.newPlayedMate), c.newDropPp, c.oldExclusions.join(',') + ' / ' + c.newExclusions.join(',')].map(cell).join(' | ') + ' |'), '',
    'Nuova accuratezza sul telefono, analisi partita completa in browser, download Internet/cache browser: NON ESEGUITI. Stockfish 19 nativo compilato: NON ESEGUITO; il NativeEngine QA trasporta lo stesso WASM single via Node, con go nodes 200000. App e engineConfig.js invariati.', '']
  await writeFile(path.join(output, 'report.md'), lines.join('\n'), { flag: 'wx' })
  console.log(JSON.stringify({ output, goCount, seconds: summary.totalElapsedSeconds, groups, categoryChanges: changes.length }, null, 2))
} catch (error) {
  console.error(`STOP ${context}: ${error.stack}`)
  try { await save('failure.json', { completed: false, context, error: error.stack, goCount, finishedAt: new Date().toISOString() }) } catch {}
  process.exitCode = 1
} finally { engine?.close() }
