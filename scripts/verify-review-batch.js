// Verify the integrated app against every predeclared row without searches.
import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'
import { selectRefinementView } from '../src/lib/analysisRefinement.js'

const area = 'agent-output/review-batch-v1', watched = new Map()
const sha = b => createHash('sha256').update(b).digest('hex')
async function input(path) { const bytes = await readFile(path); watched.set(path, sha(bytes)); return JSON.parse(bytes) }
const audit = await input(`${area}/diagnosis.json`), study = await input(`${area}/study.json`)
assert.equal(study.combined.accepted, true)
const changed = new Set(['src/lib/reviewEvaluation.js', 'src/lib/specialClassification.js', 'src/lib/analysisRefinement.js'])
for (const s of audit.sources) {
  const bytes = await readFile(s.path)
  if (!changed.has(s.path)) assert.equal(sha(bytes), s.sha256, s.path)
  watched.set(s.path, sha(bytes))
}
const lock = await input('agent-output/specials-frozen-candidate-v1.json')
for (const s of lock.sources) assert.equal(sha(await readFile(s.path)), s.sha256, s.path)
for (const path of ['scripts/verify-review-batch.js', `${area}/integration.md`, 'src/components/AnalysisSummary.jsx']) watched.set(path, sha(await readFile(path)))
const { cases } = await input(`${area}/cohorts.json`), rows = []
const label = { book: 'Libro', forced: 'Forzata', best: 'Migliore', excellent: 'Ottima', good: 'Buona',
  inaccuracy: 'Imprecisione', mistake: 'Errore', blunder: 'Errore grave', great: 'Grande', brilliant: 'Geniale', missed: 'Mossa mancata', unclassified: 'Non valutabile' }
for (const c of cases) {
  const original = JSON.stringify(c.entries)
  const raw = c.cohort === 'new-refined' ? await input(`agent-output/new-refinement-measurement-v1/game-${c.id}-round-2.json`) : null
  const result = raw ? selectRefinementView(raw.entries, true) : reclassifyReviewedMoves(c.entries)
  for (const [i, e] of result.entries()) {
    const proposal = study.combined.changes.find(r => r.cohort === c.cohort && r.game === c.id && r.ply === e.ply)
    const before = label[c.entries[i].classification], after = label[e.classification]
    assert.equal(after, proposal?.after ?? before, `${c.cohort}/${c.id}/${e.ply}`)
    rows.push({ cohort: c.cohort, game: c.id, ply: e.ply, san: e.playedMove, expected: c.expected[i], before, after })
  }
  assert.equal(JSON.stringify(c.entries), original)
  console.log(JSON.stringify({ verified: c.id, cohort: c.cohort }))
}
const summaries = ['new-initial', 'new-refined', 'old'].map(cohort => {
  const r = rows.filter(r => r.cohort === cohort)
  return { cohort, total: r.length, exact: r.filter(r => r.after === r.expected).length,
    corrected: r.filter(r => r.before !== r.expected && r.after === r.expected).length,
    regressed: r.filter(r => r.before === r.expected && r.after !== r.expected).length }
})
assert.deepEqual(summaries.map(s => s.exact), [172, 184, 338])
assert.deepEqual(summaries.map(s => s.regressed), [0, 0, 0])
for (const [path, expected] of watched) assert.equal(sha(await readFile(path)), expected, path)
await writeFile(`${area}/verification.json`, JSON.stringify({ newSearches: 0, frozenSources: lock.sources.length, summaries, rows,
  sources: [...watched].map(([path, sha256]) => ({ path, sha256 })) }, null, 2), { flag: 'wx' })
console.log(JSON.stringify({ summaries, newSearches: 0 }, null, 2))
