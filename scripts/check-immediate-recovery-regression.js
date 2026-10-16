// Offline regression only. Preserve previous reports and frozen references.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'
import { analyzeGame } from '../src/lib/gameAnalysis.js'
import { createOpeningBook } from '../src/lib/openingBook.js'
import { classifyReviewedMove } from '../src/lib/reviewEvaluation.js'
import { classifySpecialMove, SPECIAL_POLICY } from '../src/lib/specialClassification.js'
import { collectSacrificeEvidence } from '../src/lib/sacrificeEvidence.js'

const area = process.argv[2] ?? 'agent-output/immediate-recovery-v7-regression-v1', watched = new Map()
const sha = b => createHash('sha256').update(b).digest('hex')
async function input(path) { const b = await readFile(path); watched.set(path, sha(b)); return JSON.parse(b) }
const lock = await input('agent-output/specials-frozen-candidate-v1.json')
for (const s of lock.sources) { assert.equal(sha(await readFile(s.path)), s.sha256); watched.set(s.path, s.sha256) }
for (const p of ['src/lib/specialClassification.js', 'src/lib/sacrificeEvidence.js', 'src/lib/reviewMoves.js',
  'src/lib/reviewEvaluation.js', 'src/lib/gameAnalysis.js', 'scripts/check-immediate-recovery-regression.js']) watched.set(p, sha(await readFile(p)))
const baseline = await input('agent-output/new-references-200k-v1/results.json')
const cases = []
for (const g of baseline.games) {
  const stored = await input(`agent-output/new-references-200k-v1/game-${g.id}.json`)
  cases.push({ cohort: 'new', id: g.id, entries: stored.liveEntries, expected: stored.rows.map(r => r.expected), before: stored.rows.map(r => r.actual) })
}
const book = createOpeningBook((await input('src/data/openingPositions.json')).positions)
const oldDiagnosis = await input('agent-output/special-diagnosis-v1/results.json')
for (const id of [...Array.from({ length: 6 }, (_, i) => `personal-0${i + 1}`), 'game-1-chigorin-steinitz-1892', 'game-2-saintamant-staunton-1843']) {
  const fixture = await input(`tests/fixtures/qa/${id}.json`)
  const cache = await input(`tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/${id}.json`)
  let before = 0, after = 0
  const entries = await analyzeGame({ openingBook: book, moves: cache.entries.map(e => e.san),
    analyzePosition: async fen => { const e = cache.entries[before++]; assert.equal(e.fenBefore, fen); return e.engine },
    analyzePlayedPosition: async fen => { const e = cache.entries[after++]; assert.equal(e.fenAfter, fen); return e.playedEngine } })
  // The v6 audit records every row. Read that frozen baseline, not rewritten results.
  const prior = await input('agent-output/special-classification-2026-10-09T16-44-31-672Z/results.json')
  cases.push({ cohort: 'old', id, entries, expected: fixture.annotations.map(a => a.category),
    before: prior.rows.filter(r => r.id === id).map(r => r.after) })
}
const labels = { book: 'Libro', forced: 'Forzata', best: 'Migliore', excellent: 'Ottima', good: 'Buona', inaccuracy: 'Imprecisione',
  mistake: 'Errore', blunder: 'Errore grave', great: 'Grande', brilliant: 'Geniale', missed: 'Mossa mancata', unclassified: 'Non valutabile' }
const rows = []
for (const c of cases) {
  assert.equal(c.entries.length, c.before.length)
  const entries = reclassifyReviewedMoves(c.entries)
  for (const [i, e] of entries.entries()) rows.push({ cohort: c.cohort, game: c.id, ply: i + 1, san: e.playedMove,
    expected: c.expected[i], before: c.cohort === 'old' ? labels[c.before[i]] : c.before[i], after: labels[e.classification] })
  console.log(JSON.stringify({ compared: c.id, cohort: c.cohort }))
}
const summaries = ['new', 'old'].map(cohort => {
  const r = rows.filter(r => r.cohort === cohort)
  return { cohort, total: r.length, before: r.filter(r => r.before === r.expected).length,
    after: r.filter(r => r.after === r.expected).length, changes: r.filter(r => r.after !== r.before),
    corrected: r.filter(r => r.before !== r.expected && r.after === r.expected).length,
    regressed: r.filter(r => r.before === r.expected && r.after !== r.expected).length }
})
assert.equal(summaries[0].before, 167); assert.equal(summaries[1].before, oldDiagnosis.summary.find(s => s.cohort === 'old').currentExact)
const g = await input('agent-output/new-references-200k-v1/game-184316820266.json')
const forced = await input('agent-output/targeted-special-evidence-v1/search-0.json')
const evidence = { ...collectSacrificeEvidence(g.entries[40], g.entries[41], SPECIAL_POLICY), source: 'forced-acceptance-search-200k', acceptanceLines: forced.engine.specialLines }
const target = classifySpecialMove(classifyReviewedMove(g.entries[40]), g.entries[39], g.entries[38], evidence)
assert.equal(target.classification, 'brilliant')
for (const [path, expected] of watched) assert.equal(sha(await readFile(path)), expected, path)
await mkdir(area, { recursive: true })
await writeFile(`${area}/results.json`, JSON.stringify({ version: SPECIAL_POLICY.version, newSearches: 0, summaries,
  targetedExample: { game: '184316820266', ply: 41, classification: target.classification,
    assessment: target.specialAssessment.brilliant, scope: 'additional-targeted-acceptance; not baseline profile' },
  sources: [...watched].map(([path, sha256]) => ({ path, sha256 })) }, null, 2) + '\n')
await writeFile(`${area}/report.md`, ['# Regressione del controllo recuperi v7', '',
  '| Campione | Mosse | Prima | Dopo | Recuperi | Regressioni |', '|---|---:|---:|---:|---:|---:|',
  ...summaries.map(s => `| ${s.cohort} | ${s.total} | ${s.before} | ${s.after} | ${s.corrected} | ${s.regressed} |`), '',
  'Qxe5 con evidenza mirata di ...Rxf7 diventa Geniale. Il profilo iniziale senza quella evidenza resta separato.',
  'Nessuna nuova ricerca e nessuna taratura di soglie. Riferimenti e report precedenti invariati.', '',
  ...summaries.flatMap(s => s.changes.map(r => `- ${r.cohort}/${r.game}/${r.ply} ${r.san}: ${r.before} -> ${r.after}; attesa ${r.expected}.`)), ''].join('\n'))
console.log(JSON.stringify({ summaries, targeted: target.classification, newSearches: 0 }, null, 2))
