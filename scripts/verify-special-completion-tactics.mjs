import {readFile, writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {reclassifyReviewedMoves} from '../src/lib/reviewMoves.js'
import {formatSpecialAssessment} from '../src/lib/specialClassification.js'

const area = 'agent-output/special-completion-v1'
const parse = async p => JSON.parse(await readFile(p, 'utf8'))
const sha = b => createHash('sha256').update(b).digest('hex')
const baseline = await parse(`${area}/ledger.json`)
const study = await parse(`${area}/deferred-tactics-and-deferred.json`)
assert(study.accepted)
const allowed = new Set(['src/lib/specialClassification.js', 'src/lib/specialPolicy.js'])
for (const source of baseline.sources) {
  if (!allowed.has(source.path)) assert.equal(sha(await readFile(source.path)), source.sha256, source.path)
}
const sourcePaths = [...allowed, 'src/lib/tacticalEvidence.js', 'src/lib/deferredResponse.js', 'scripts/verify-special-completion-tactics.mjs']
const sources = await Promise.all(sourcePaths.map(async path => ({path, sha256: sha(await readFile(path))})))
const {cases} = await parse(`${area}/cohorts.json`)
const original = JSON.stringify(cases)
const expectedChanges = new Map(study.changes.map(r => [`${r.cohort}:${r.game}:${r.ply}`, r]))
const before = new Map(baseline.rows.map(r => [`${r.cohort}:${r.game}:${r.ply}`, r]))
const labels = {book:'Libro', forced:'Forzata', best:'Migliore', excellent:'Ottima', good:'Buona', inaccuracy:'Imprecisione', mistake:'Errore', blunder:'Errore grave', great:'Grande', brilliant:'Geniale', missed:'Mossa mancata', unclassified:'Non valutabile'}
const numeric = ['bestEval', 'bestMate', 'playedEval', 'playedMate', 'bestProbability', 'playedProbability', 'dropPct']
const rows = []
for (const c of cases) {
  const result = reclassifyReviewedMoves(c.entries)
  for (const [i, e] of result.entries()) {
    const key = `${c.cohort}:${c.id}:${e.ply}`, prior = before.get(key)
    assert.equal(labels[e.classification], expectedChanges.get(key)?.after ?? prior.actual, key)
    // JSON archives normalize -0 to 0; both represent the same evaluation.
    for (const field of numeric) assert(e[field] === c.entries[i][field], `${key}:${field}`)
    assert.equal(e.specialAssessment.version, 'counterfactual-v16')
    if (expectedChanges.has(key)) {
      const description = formatSpecialAssessment(e)
      assert(description && !JSON.stringify(description).includes('undefined'), key)
    }
    rows.push({...prior, before:prior.actual, actual:labels[e.classification], grande:e.specialAssessment.grande, brilliant:e.specialAssessment.brilliant})
  }
  // This verifies persisted complete games, including existing acceptance evidence.
  assert.deepEqual(reclassifyReviewedMoves(result), result, `idempotence:${c.cohort}:${c.id}`)
  console.log(JSON.stringify({verified:c.id, cohort:c.cohort}))
}
assert.equal(JSON.stringify(cases), original)
assert.equal(rows.length, 1116)
const summaries = ['initial', 'refined', 'old'].map(cohort => {
  const rr = rows.filter(r => r.cohort === cohort)
  return {cohort, before:rr.filter(r => r.before === r.expected).length, after:rr.filter(r => r.actual === r.expected).length,
    corrected:rr.filter(r => r.before !== r.expected && r.actual === r.expected).length,
    regressed:rr.filter(r => r.before === r.expected && r.actual !== r.expected).length}
})
assert(summaries.every(r => r.regressed === 0))
const primary = rows.filter(r => r.cohort !== 'initial')
const specials = ['Grande', 'Geniale'].map(category => ({category, expected:primary.filter(r => r.expected === category).length,
  correct:primary.filter(r => r.expected === category && r.actual === category).length,
  false:primary.filter(r => r.expected !== category && r.actual === category).length}))
const unresolved = primary.filter(r => ['Grande','Geniale'].includes(r.expected) && r.actual !== r.expected || ['Grande','Geniale'].includes(r.actual) && r.actual !== r.expected)
assert.deepEqual(specials.map(r => [r.correct,r.expected,r.false]), [[21,34,0],[2,4,0]])
assert.equal(unresolved.length, 15)
for (const source of sources) assert.equal(sha(await readFile(source.path)), source.sha256, source.path)
const result = {passed:true, version:'counterfactual-v16', developmentOnly:true, independentValidation:false,
  distinctMoves:854, observations:1116, newSearches:0, inputsUnchanged:true, numericFieldsUnchanged:numeric,
  summaries, specials, unresolved, changes:rows.filter(r => r.before !== r.actual), rows, sources}
await writeFile(`${area}/verification-v16.json`, JSON.stringify(result,null,2)+'\n', {flag:'wx'})
console.log(JSON.stringify({passed:true,summaries,specials,unresolved:unresolved.length}))
