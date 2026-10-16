// Offline study on development references only. No engine or holdout data imports.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'
import { selectRefinementView, buildRefinementPlan } from '../src/lib/analysisRefinement.js'

const area = 'agent-output/refinement-quality-priority-v2'
const watched = new Map(), sha = b => createHash('sha256').update(b).digest('hex')
async function input(path) { const bytes = await readFile(path); watched.set(path, sha(bytes)); return JSON.parse(bytes) }
async function save(name, value) { await writeFile(`${area}/${name}`, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' }) }
const labels = { book: 'Libro', forced: 'Forzata', best: 'Migliore', excellent: 'Ottima', good: 'Buona', inaccuracy: 'Imprecisione',
  mistake: 'Errore', blunder: 'Errore grave', great: 'Grande', brilliant: 'Geniale', missed: 'Mossa mancata', unclassified: 'Non valutabile' }
const frozen = await input('agent-output/specials-frozen-candidate-v1.json')
for (const s of frozen.sources) { assert.equal(sha(await readFile(s.path)), s.sha256); watched.set(s.path, s.sha256) }
const source = await readFile('src/lib/analysisRefinement.js', 'utf8')
for (const path of ['src/lib/analysisRefinement.js', 'src/lib/reviewEvaluation.js', 'src/lib/sacrificeSearches.js',
  'src/lib/reviewMoves.js', 'src/lib/specialClassification.js', 'src/lib/materialRealization.js',
  'scripts/study-refinement-quality-v2.mjs', `${area}/protocol.md`]) watched.set(path, sha(await readFile(path)))
await mkdir(area, { recursive: true })
await writeFile(`${area}/analysisRefinement-before.js`, source, { flag: 'wx' })
const cohorts = await input('agent-output/review-batch-v1/cohorts.json'), cases = []
for (const c of cohorts.cases) {
  if (c.cohort === 'new-refined') {
    const archived = await input(`agent-output/new-refinement-measurement-v1/game-${c.id}-round-2.json`)
    cases.push({ ...c, raw: archived.entries, before: selectRefinementView(archived.entries, true) })
  } else cases.push({ ...c, raw: reclassifyReviewedMoves(c.entries), before: reclassifyReviewedMoves(c.entries) })
}
const guard = `if (!Number.isInteger(oldDepth) || !Number.isInteger(newDepth) || oldDepth <= newDepth) continue`
const condition = `if ([old, next].every(e => e.evaluationEvidence?.source === 'completed-snapshot'
      && e.evaluationEvidence.status === 'coherent')) comparisonChoices.set(initial.fenBefore,`
assert.equal(source.split(guard).length, 2); assert.equal(source.split(condition).length, 2)
function variantSource(quality, equal) {
  let text = source
  if (quality) {
    text = text.replace(guard, `if (candidate.engine === initial.engine) continue`)
      .replace(condition, `if (old.evaluationEvidence?.source === 'completed-snapshot' && old.evaluationEvidence.status === 'coherent'
      && (!(next.evaluationEvidence?.source === 'completed-snapshot' && next.evaluationEvidence.status === 'coherent')
        || oldDepth ${equal ? '>=' : '>'} newDepth)) comparisonChoices.set(initial.fenBefore,`)
  } else if (equal) text = text.replace(guard, guard.replace('oldDepth <= newDepth', 'oldDepth < newDepth'))
  return text
}
async function moduleOf(text) {
  const absolute = text.replace("from 'chess.js'", `from '${import.meta.resolve('chess.js')}'`)
    .replace(/from '(\.\/[^']+)'/g, (_, path) => `from '${new URL(path, new URL('../src/lib/analysisRefinement.js', import.meta.url)).href}'`)
  return import('data:text/javascript;base64,' + Buffer.from(absolute).toString('base64'))
}
const summaries = (rows) => ['new-initial', 'new-refined', 'old'].map(cohort => {
  const rr = rows.filter(r => r.cohort === cohort), changes = rr.filter(r => r.before !== r.after)
  return { cohort, total: rr.length, before: rr.filter(r => r.before === r.expected).length,
    after: rr.filter(r => r.after === r.expected).length,
    corrected: changes.filter(r => r.after === r.expected).length,
    regressed: changes.filter(r => r.before === r.expected).length,
    other: changes.filter(r => r.before !== r.expected && r.after !== r.expected).length,
    specialCorrectBefore: rr.filter(r => ['Grande', 'Geniale', 'Mossa mancata'].includes(r.expected) && r.before === r.expected).length,
    specialCorrectAfter: rr.filter(r => ['Grande', 'Geniale', 'Mossa mancata'].includes(r.expected) && r.after === r.expected).length }
})
const reports = []
for (const v of [{ id: 'quality', quality: true, equal: false }, { id: 'equal-depth', quality: false, equal: true }]) {
  const candidateSource = variantSource(v.quality, v.equal), module = await moduleOf(candidateSource), rows = []
  for (const c of cases) {
    const preserved = JSON.stringify(c.raw), after = c.cohort === 'new-refined' ? module.selectRefinementView(c.raw, true) : c.before
    assert.equal(JSON.stringify(c.raw), preserved)
    for (const [i, e] of after.entries()) rows.push({ cohort: c.cohort, game: c.id, ply: e.ply, san: e.playedMove,
      expected: c.expected[i], before: labels[c.before[i].classification], after: labels[e.classification],
      beforeEvidence: c.before[i].evaluationEvidence, afterEvidence: e.evaluationEvidence,
      choice: e.refinementComparison?.rootComparisonChoice })
    console.log(JSON.stringify({ variant: v.id, compared: c.id, cohort: c.cohort }))
  }
  const summary = summaries(rows); assert.deepEqual(summary.map(s => s.before), [172, 184, 338])
  const accepted = summary.some(s => s.corrected > 0) && summary.every(s => s.regressed === 0 && s.specialCorrectAfter >= s.specialCorrectBefore)
  reports.push({ ...v, accepted, summary, changes: rows.filter(r => r.before !== r.after) })
  await save(`variant-${v.id}.json`, reports.at(-1))
  await writeFile(`${area}/variant-${v.id}.js`, candidateSource, { flag: 'wx' })
}
const accepted = reports.filter(r => r.accepted)
const module = await moduleOf(variantSource(accepted.some(r => r.quality), accepted.some(r => r.equal)))
const combinedRows = [], diagnosis = []
for (const c of cases) {
  const after = c.cohort === 'new-refined' ? module.selectRefinementView(c.raw, true) : c.before
  for (const [i, e] of after.entries()) {
    combinedRows.push({ cohort: c.cohort, game: c.id, ply: e.ply, san: e.playedMove,
      expected: c.expected[i], before: labels[c.before[i].classification], after: labels[e.classification] })
    if (c.cohort === 'new-refined') {
      const initial = cases.find(v => v.id === c.id && v.cohort === 'new-initial').before[i]
      if (labels[initial.classification] === c.expected[i] && labels[c.before[i].classification] !== c.expected[i]) diagnosis.push({
        game: c.id, ply: e.ply, san: e.playedMove, expected: c.expected[i], initial: labels[initial.classification],
        deep: labels[c.before[i].classification], proposed: labels[e.classification],
        initialEvidence: initial.evaluationEvidence, deepEvidence: c.before[i].evaluationEvidence,
        initialDepth: initial.engine?.specialLines?.[0]?.depth, deepDepth: c.before[i].engine?.specialLines?.[0]?.depth })
    }
  }
}
const combinedSummary = summaries(combinedRows)
assert.ok(combinedSummary.every(s => s.regressed === 0))
const priorityModule = await moduleOf(source.replace(`}).filter(refinementReason), selected = candidates.slice(0, REFINEMENT_POLICY.maxMoves)`,
  `}).filter(refinementReason).sort((a, b) => rank(a) - rank(b) || a.ply - b.ply), selected = candidates.slice(0, REFINEMENT_POLICY.maxMoves)`)
  .replace('export function buildRefinementPlan(entries = []) {', `function rank(e) {
  if (pendingSacrificeTargets([e]).length) return 0
  if (e.specialAssessment?.brilliant?.status === 'candidate') return 1
  if (e.specialAssessment?.grande?.status === 'candidate') return 2
  if (['unavailable', 'conflicting'].includes(e.evaluationEvidence?.status)) return 3
  if (e.evaluationEvidence?.status === 'independent') return 4
  return 5
}
export function buildRefinementPlan(entries = []) {`))
const ranking = []
for (const c of cases.filter(c => c.cohort === 'new-initial')) {
  const before = buildRefinementPlan(c.raw), after = priorityModule.buildRefinementPlan(c.raw)
  ranking.push({ id: c.id, before, after, pendingBefore: before.sacrifices.length, pendingAfter: after.sacrifices.length })
}
for (const [path, hash] of watched) assert.equal(sha(await readFile(path)), hash, path)
await save('study.json', { newSearches: 0, independentValidation: false, applicationChanged: false,
  accepted: accepted.map(r => r.id), variants: reports, combined: { summary: combinedSummary,
    changes: combinedRows.filter(r => r.before !== r.after) }, regressions: diagnosis, ranking,
  sources: [...watched].map(([path, sha256]) => ({ path, sha256 })) })
console.log(JSON.stringify({ accepted: accepted.map(r => r.id), combinedSummary,
  regressions: diagnosis.length, ranking: ranking.map(r => ({ id: r.id, before: r.before.selectedPlies, after: r.after.selectedPlies,
    pendingBefore: r.pendingBefore, pendingAfter: r.pendingAfter })) }, null, 2))
