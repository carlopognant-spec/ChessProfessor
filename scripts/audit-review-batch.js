// One read-only cohort load for all review categories and subsequent hypotheses.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'
import { selectRefinementView } from '../src/lib/analysisRefinement.js'
import { analyzeGame } from '../src/lib/gameAnalysis.js'
import { createOpeningBook } from '../src/lib/openingBook.js'

const area = 'agent-output/review-batch-v1', watched = new Map()
const sha = b => createHash('sha256').update(b).digest('hex')
async function input(path) { const bytes = await readFile(path); watched.set(path, sha(bytes)); return JSON.parse(bytes) }
const lock = await input('agent-output/specials-frozen-candidate-v1.json')
for (const s of lock.sources) { assert.equal(sha(await readFile(s.path)), s.sha256, s.path); watched.set(s.path, s.sha256) }
for (const path of ['scripts/audit-review-batch.js', `${area}/protocol.md`, 'src/lib/reviewEvaluation.js',
  'src/lib/reviewMoves.js', 'src/lib/specialClassification.js', 'src/lib/materialRealization.js',
  'src/lib/analysisRefinement.js', 'src/lib/sacrificeSearches.js', 'src/lib/sacrificeEvidence.js',
  'src/lib/gameAnalysis.js', 'src/lib/moveOpportunities.js']) watched.set(path, sha(await readFile(path)))
const label = { book: 'Libro', forced: 'Forzata', best: 'Migliore', excellent: 'Ottima', good: 'Buona',
  inaccuracy: 'Imprecisione', mistake: 'Errore', blunder: 'Errore grave', great: 'Grande', brilliant: 'Geniale',
  missed: 'Mossa mancata', unclassified: 'Non valutabile' }
const measured = await input('agent-output/new-refinement-measurement-v1/results.json'), cases = []
for (const g of measured.perGame) {
  const initial = await input(`agent-output/new-references-200k-v1/game-${g.id}.json`)
  const refined = await input(`agent-output/new-refinement-measurement-v1/game-${g.id}-round-2.json`)
  const ref = await input(`Partite/Confermate/chesscom-${g.id}/riferimento.json`)
  cases.push({ cohort: 'new-initial', id: g.id, entries: reclassifyReviewedMoves(initial.liveEntries), expected: ref.annotations.map(a => a.category) })
  cases.push({ cohort: 'new-refined', id: g.id, entries: selectRefinementView(refined.entries, true),
    initialEntries: initial.liveEntries, expected: ref.annotations.map(a => a.category) })
  console.log(JSON.stringify({ loaded: g.id }))
}
const book = createOpeningBook((await input('src/data/openingPositions.json')).positions)
for (const id of [...Array.from({ length: 6 }, (_, i) => `personal-0${i + 1}`), 'game-1-chigorin-steinitz-1892', 'game-2-saintamant-staunton-1843']) {
  const ref = await input(`tests/fixtures/qa/${id}.json`)
  const cache = await input(`tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/${id}.json`)
  let before = 0, after = 0
  const entries = await analyzeGame({ moves: cache.entries.map(e => e.san), baseFen: cache.entries[0].fenBefore, openingBook: book,
    analyzePosition: async fen => { const e = cache.entries[before++]; assert.equal(e.fenBefore, fen); return e.engine },
    analyzePlayedPosition: async fen => { const e = cache.entries[after++]; assert.equal(e.fenAfter, fen); return e.playedEngine } })
  cases.push({ cohort: 'old', id, entries, expected: ref.annotations.map(a => a.category) })
  console.log(JSON.stringify({ loaded: id }))
}
const rows = []
for (const c of cases) for (const [i, e] of c.entries.entries()) {
  const initial = cases.find(v => v.id === c.id && v.cohort === 'new-initial')?.entries[i]
  const playedRoot = (e.engine?.specialLines ?? e.engine?.lines ?? []).find(l => l.pv?.[0] === e.playedUci)
  const bestRoot = (e.engine?.specialLines ?? e.engine?.lines ?? []).find(l => l.multipv === 1)
  rows.push({ cohort: c.cohort, game: c.id, ply: e.ply, san: e.playedMove, expected: c.expected[i], actual: label[e.classification],
    base: label[e.baseClassification], numerical: label[e.numericalClassification], dropPct: e.dropPct,
    bestCp: e.bestEval, playedCp: e.playedEval, bestMate: e.bestMate, playedMate: e.playedMate,
    status: e.evaluationEvidence?.status, source: e.evaluationEvidence?.source,
    depth: e.evaluationEvidence?.rootDepth, initialDepth: initial?.evaluationEvidence?.rootDepth,
    shallower: Boolean(initial && e.evaluationEvidence?.rootDepth < initial.evaluationEvidence?.rootDepth),
    mateChange: e.mateComparison?.change, selectedBest: e.isEngineBest, forced: e.moveFacts?.forced,
    sameScoreAlternative: Boolean(e.isEngineBest === false && e.evaluationEvidence?.status === 'coherent'
      && playedRoot?.depth === bestRoot?.depth && playedRoot?.evalCp === bestRoot?.evalCp
      && playedRoot?.mate === bestRoot?.mate),
    initial: initial ? label[initial.classification] : null,
    regressed: c.cohort === 'new-refined' && label[initial?.classification] === c.expected[i] && label[e.classification] !== c.expected[i],
    greatReason: e.specialAssessment?.grande.reason, brilliantReason: e.specialAssessment?.brilliant.reason,
    opportunity: e.missedOpportunity?.kind })
}
const summaries = ['new-initial', 'new-refined', 'old'].map(cohort => {
  const all = rows.filter(r => r.cohort === cohort), errors = all.filter(r => r.expected !== r.actual)
  const matrix = {}, causes = {}
  for (const r of errors) { const key = `${r.expected} -> ${r.actual}`; matrix[key] = (matrix[key] ?? 0) + 1 }
  for (const [name, predicate] of [
    ['coherent', r => r.status === 'coherent'], ['independent', r => ['independent', 'conflicting'].includes(r.status)],
    ['special', r => ['Grande', 'Geniale', 'Mossa mancata'].includes(r.expected) || ['Grande', 'Geniale', 'Mossa mancata'].includes(r.actual)],
    ['mate', r => r.bestMate != null || r.playedMate != null], ['forced', r => r.forced],
    ['same-score-alternative', r => r.sameScoreAlternative], ['shallower', r => r.shallower],
  ]) causes[name] = { total: all.filter(predicate).length, wrong: errors.filter(predicate).length }
  return { cohort, total: all.length, exact: all.length - errors.length,
    matrix: Object.fromEntries(Object.entries(matrix).sort((a,b) => b[1]-a[1])), causes }
})
assert.deepEqual(summaries.map(s => s.exact), [172, 182, 329])
for (const [path, expected] of watched) assert.equal(sha(await readFile(path)), expected, path)
await mkdir(area, { recursive: true })
await writeFile(`${area}/cohorts.json`, JSON.stringify({ cases }, null, 2), { flag: 'wx' })
await writeFile(`${area}/diagnosis.json`, JSON.stringify({ newSearches: 0, independentValidation: false, summaries, rows,
  sources: [...watched].map(([path, sha256]) => ({ path, sha256 })) }, null, 2), { flag: 'wx' })
console.log(JSON.stringify({ summaries }, null, 2))
