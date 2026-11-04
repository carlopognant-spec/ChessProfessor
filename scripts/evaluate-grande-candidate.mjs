import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Chess } from 'chess.js'
import { createOpeningBook } from '../src/lib/openingBook.js'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'
import { applyMoveFacts } from '../src/lib/reviewEvaluation.js'
import { classifySpecialMove, SPECIAL_POLICY } from '../src/lib/analysisSpecialClassification.js'
import { classifyGrandeCandidate, reclassifyGrandeCandidate, GRANDE_CANDIDATE_VERSION } from '../src/lib/grandeCandidate.js'
import { resolveEvaluationInput } from './grande-frozen-input-path.js'

const root = fileURLToPath(new URL('../', import.meta.url)), options = {}
for (let i = 2; i < process.argv.length; i++) {
  const key = process.argv[i]
  assert.ok(['--output', '--diagnostics'].includes(key) && !(key in options), 'Unknown or duplicate argument')
  const value = process.argv[++i]
  assert.ok(value && !value.startsWith('--'), 'Missing argument value')
  options[key] = value
}
assert.ok(options['--output'] && options['--diagnostics'], 'Use --output <external-results.json> --diagnostics <existing-diagnostic-directory>')
const output = path.resolve(options['--output'])
const relativeOutput = path.relative(root, output)
assert.ok(path.isAbsolute(relativeOutput) || relativeOutput === '..' || relativeOutput.startsWith(`..${path.sep}`), 'Output must be outside the checkout')
const watched = new Map()
const hash = value => createHash('sha256').update(value).digest('hex')
// Hash the flat library directory to cover transitive helpers without maintaining an import manifest.
const sourcePaths = ['scripts/evaluate-grande-candidate.mjs', 'scripts/grande-frozen-input-path.js',
  ...(await readdir(path.join(root, 'src/lib'))).filter(name => name.endsWith('.js')).sort().map(name => `src/lib/${name}`)]
const sourceHashes = await Promise.all(sourcePaths.map(async filename => ({ path: filename,
  sha256: hash(await readFile(path.join(root, filename))) })))
async function read(filename) {
  const absolute = await resolveEvaluationInput(filename, root)
  const bytes = await readFile(absolute)
  watched.set(absolute, hash(bytes))
  return JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, ''))
}
const labels = { Libro: 'book', Forzata: 'forced', Migliore: 'best', Ottima: 'excellent', Buona: 'good', Imprecisione: 'inaccuracy', Errore: 'mistake', 'Errore grave': 'blunder', Grande: 'great', Geniale: 'brilliant', 'Mossa mancata': 'missed', 'Non valutabile': 'unclassified' }
const book = createOpeningBook((await read('src/data/openingPositions.json')).positions)
const games = [], rows = [], seen = new Set()
function reference(category) {
  if (category == null) return null
  assert.ok(Object.hasOwn(labels, category), `Unknown reference category: ${category}`)
  return labels[category]
}
function addGame(id, cohort, entries, annotations, provenance) {
  assert.ok(!seen.has(id), `Overlapping game ID: ${id}`); seen.add(id)
  const refs = new Map()
  for (const annotation of annotations) {
    assert.ok(Number.isInteger(annotation.ply) && annotation.ply > 0 && annotation.ply <= entries.length && !refs.has(annotation.ply), 'Invalid annotation ply')
    assert.equal(annotation.san, entries[annotation.ply - 1].playedMove ?? entries[annotation.ply - 1].san)
    refs.set(annotation.ply, reference(annotation.category))
  }
  const before = JSON.stringify(entries)
  const published = reclassifyReviewedMoves(structuredClone(entries))
  const candidate = reclassifyGrandeCandidate(structuredClone(entries))
  assert.equal(JSON.stringify(entries), before, 'Input evidence mutated')
  assert.equal(candidate.length, published.length)
  const start = rows.length
  for (let i = 0; i < entries.length; i++) {
    assert.equal(candidate[i].candidateAssessment.publishedClassification, published[i].classification, `Published replay diverged: ${id}/${i + 1}`)
    const expected = refs.get(i + 1) ?? null
    rows.push({ gameId: id, cohort, ply: i + 1, san: entries[i].playedMove ?? entries[i].san, expected,
      expectedGrande: expected == null ? null : expected === 'great', excluded: expected === 'forced',
      published: published[i].classification, candidate: candidate[i].classification,
      changed: published[i].classification !== candidate[i].classification,
      input: entries[i], publishedEntry: published[i], candidateEntry: candidate[i] })
  }
  games.push({ id, cohort, provenance, plies: rows.length - start })
}
const oldIds = [...Array.from({ length: 6 }, (_, i) => `personal-0${i + 1}`), 'game-1-chigorin-steinitz-1892', 'game-2-saintamant-staunton-1843']
for (const id of oldIds) {
  const fixture = await read(`tests/fixtures/qa/${id}.json`)
  const cache = await read(`tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/${id}.json`)
  assert.equal(fixture.pgn, cache.pgn)
  assert.equal(cache.packageVersion, '19.0.0'); assert.equal(cache.searchLimit.value, 200000); assert.equal(cache.multiPv, 5)
  const full = new Chess(); full.loadPgn(fixture.pgn)
  const moves = full.history(), board = new Chess(full.getHeaders().FEN)
  assert.equal(moves.length, cache.entries.length)
  let bookActive = true
  const entries = cache.entries.map((entry, index) => {
    assert.equal(entry.ply, index + 1); assert.equal(entry.san, moves[index]); assert.equal(entry.fenBefore, board.fen())
    const move = board.move(entry.san)
    assert.equal(entry.uci, move.from + move.to + (move.promotion ?? '')); assert.equal(entry.fenAfter, board.fen())
    const isBookMove = bookActive && !board.isCheckmate() && book.hasPosition(entry.fenAfter)
    bookActive = isBookMove
    return { ...entry, playedMove: entry.san, playedUci: entry.uci, side: move.color,
      moveNumber: Number(entry.fenBefore.split(' ')[5]), isBookMove }
  })
  addGame(id, 'development-and-studied-historical', entries, fixture.annotations ?? [], { fixtureSource: fixture.source, role: fixture.role, cache: 'Stockfish 19 WASM large-single, 200k nodes, MultiPV 5; archived evidence' })
}
assert.equal(rows.length, 592)
const newIds = ['185262315732', '184316820266', '184316313800', '185230271130', '185230000668']
for (const id of newIds) {
  const report = await read(`agent-output/new-references-200k-v1/game-${id}.json`)
  const ref = await read(`Partite/Confermate/chesscom-${id}/riferimento.json`)
  assert.equal(ref.status, 'user-confirmed'); assert.equal(ref.benchmarkEligible, true)
  assert.ok(ref.annotations.every(a => a.userConfirmed && !a.needsReview))
  assert.equal(report.liveEntries.length, ref.annotations.length)
  addGame(id, 'user-confirmed-already-studied', report.liveEntries, ref.annotations,
    { reference: `Partite/Confermate/chesscom-${id}/riferimento.json`, status: ref.status, notes: ref.notes, cache: 'new-references-200k-v1 archived liveEntries' })
}
assert.equal(rows.length, 854)
const diagnosticRoot = path.resolve(options['--diagnostics'])
const diagnostic = await read(path.join(diagnosticRoot, 'reproduction-results.json'))
const diagnosticLabels = await read(path.join(diagnosticRoot, 'comparison-with-user-report.json'))
for (const row of diagnostic.rows) {
  const label = diagnosticLabels.find(r => r.ply === row.numerical.ply)
  assert.ok(label && ['great', 'not-great'].includes(label.userReportedChessCom))
  const args = [row.numerical, row.previous, row.previousOwn].map(value => structuredClone(value))
  const published = applyMoveFacts(classifySpecialMove(...args))
  const candidate = applyMoveFacts(classifyGrandeCandidate(...args, null, structuredClone(published)))
  assert.equal(candidate.candidateAssessment.publishedClassification, published.classification)
  rows.push({ gameId: 'tripleteaa-diagnostic', cohort: 'targeted-controlled-reproduction', ply: row.numerical.ply,
    san: row.summary.move, expected: label.userReportedChessCom === 'great' ? 'great' : null,
    expectedGrande: label.userReportedChessCom === 'great', excluded: false,
    referenceScope: 'User-reported Grande / non-Grande only; non-Grande is not an exact category',
    published: published.classification, candidate: candidate.classification, changed: published.classification !== candidate.classification,
    input: row.numerical, previous: row.previous, previousOwn: row.previousOwn, publishedEntry: published, candidateEntry: candidate })
}
assert.equal(diagnostic.rows.length, 3)
function metrics(selected, policy) {
  const eligible = selected.filter(r => !r.excluded), labelled = eligible.filter(r => r.expectedGrande != null)
  const tp = labelled.filter(r => r.expectedGrande && r[policy] === 'great').length
  const fp = labelled.filter(r => !r.expectedGrande && r[policy] === 'great').length
  const fn = labelled.filter(r => r.expectedGrande && r[policy] !== 'great').length
  const exact = eligible.filter(r => r.expected != null)
  return { plies: selected.length, excluded: selected.length - eligible.length, labelledGrande: labelled.length,
    unlabelledGrande: eligible.length - labelled.length, tp, fp, fn, precision: tp + fp ? tp / (tp + fp) : null,
    recall: tp + fn ? tp / (tp + fn) : null, exactLabelled: exact.length,
    exactMatches: exact.filter(r => r[policy] === r.expected).length,
    unlabelledGrandeAssignments: eligible.filter(r => r.expectedGrande == null && r[policy] === 'great').length }
}
const cohorts = [...new Set(rows.map(r => r.cohort))].map(cohort => {
  const selected = rows.filter(r => r.cohort === cohort)
  return { cohort, published: metrics(selected, 'published'), candidate: metrics(selected, 'candidate'), changed: selected.filter(r => r.changed).length }
})
const summary = { evaluatorVersion: 'grande-candidate-evaluator-v1', candidateVersion: GRANDE_CANDIDATE_VERSION,
  publishedPolicyVersion: SPECIAL_POLICY.version, sourceHashScope: 'All src/lib JavaScript files, evaluator, and input path guard; hashed before evaluation and rechecked before output.',
  searchesExecuted: 0, independentValidation: false, history: 'Candidate and published use the same published history; diagnostic rows use the same stored numerical context.',
  caveat: 'All cohorts are development, already studied, or targeted diagnostics; no new independent generalization claim.',
  published: metrics(rows, 'published'), candidate: metrics(rows, 'candidate'), changed: rows.filter(r => r.changed).length, cohorts }
for (const [filename, sha256] of watched) assert.equal(hash(await readFile(filename)), sha256, `Input changed: ${filename}`)
for (const source of sourceHashes) assert.equal(hash(await readFile(path.join(root, source.path))), source.sha256, `Source changed: ${source.path}`)
await mkdir(path.dirname(output), { recursive: true })
await writeFile(output, JSON.stringify({ summary, sourceHashes, games, rows, watched: [...watched].map(([filename, sha256]) => ({ path: filename, sha256 })) }, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({ output, summary }, null, 2))
