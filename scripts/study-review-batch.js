// Compare predeclared families together. No engine imports and no app writes.
import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { classifyReviewedMove, applyMoveFacts } from '../src/lib/reviewEvaluation.js'
import { reclassifySpecialMoves } from '../src/lib/specialClassification.js'
import { ENGINE_CONFIG } from '../src/lib/engineConfig.js'

const area = 'agent-output/review-batch-v1', watched = new Map()
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
async function input(path) { const bytes = await readFile(path); watched.set(path, sha(bytes)); return JSON.parse(bytes) }
const audit = await input(`${area}/diagnosis.json`)
// The audit captured the exact starting application, references and caches.
for (const s of audit.sources) assert.equal(sha(await readFile(s.path)), s.sha256, s.path)
for (const path of ['scripts/study-review-batch.js', `${area}/hypotheses.md`]) watched.set(path, sha(await readFile(path)))
const { cases } = await input(`${area}/cohorts.json`)
const reviewSource = await readFile('src/lib/reviewEvaluation.js', 'utf8')
const opportunitySource = await readFile('src/lib/moveOpportunities.js', 'utf8')
const specialSource = await readFile('src/lib/specialClassification.js', 'utf8')
const missedSource = await readFile('src/lib/missedOpportunity.js', 'utf8')
function moduleUrl(source, file) {
  const absolute = source.replace("from 'chess.js'", `from '${import.meta.resolve('chess.js')}'`)
    .replace(/from '(\.\/[^']+)'/g, (_, relative) => `from '${new URL(relative, new URL(file, import.meta.url)).href}'`)
  return 'data:text/javascript;base64,' + Buffer.from(absolute).toString('base64')
}
const beforeGuard = 'if (beforeProbability > policy.nonWinningProbability)'
assert.equal(missedSource.split(beforeGuard).length, 2)
const alteredMissed = missedSource.replace(beforeGuard, 'if (beforeProbability >= policy.winningProbability)')
const missedUrl = moduleUrl(alteredMissed, '../src/lib/missedOpportunity.js')
const opportunityUrl = moduleUrl(opportunitySource.replace("from './missedOpportunity.js'", `from '${missedUrl}'`), '../src/lib/moveOpportunities.js')
const alternateSpecial = await import(moduleUrl(specialSource.replace("from './moveOpportunities.js'", `from '${opportunityUrl}'`), '../src/lib/specialClassification.js'))

const label = { book: 'Libro', forced: 'Forzata', best: 'Migliore', excellent: 'Ottima', good: 'Buona',
  inaccuracy: 'Imprecisione', mistake: 'Errore', blunder: 'Errore grave', great: 'Grande', brilliant: 'Geniale', missed: 'Mossa mancata', unclassified: 'Non valutabile' }
const numerical = new Map()
for (const c of cases) numerical.set(c, c.entries.map(classifyReviewedMove))
const exactCp = e => e.evaluationEvidence?.source === 'completed-snapshot'
  && e.evaluationEvidence.status === 'coherent' && Number.isFinite(e.bestEval)
  && e.bestMate == null && e.playedMate == null && e.bestEval === e.playedEval
const exactMate = e => e.evaluationEvidence?.status === 'coherent'
  && Number.isSafeInteger(e.bestMate) && e.bestMate !== 0 && e.bestMate === e.playedMate
const wide = e => e.evaluationEvidence?.source === 'completed-snapshot' && e.evaluationEvidence.status === 'coherent'
  && e.bestMate == null && e.playedMate == null && e.dropPct <= ENGINE_CONFIG.classification.best
function ties(entry, rules) {
  if (entry.numericalClassification !== 'excellent' || entry.isEngineBest !== false
    || !rules.some(rule => rule(entry))) return entry
  const classification = entry.isBookMove ? 'book' : 'best'
  return { ...entry, classification, baseClassification: classification, numericalClassification: 'best' }
}
function depthChoices(c) {
  const choices = new Map()
  if (c.cohort !== 'new-refined') return choices
  const initial = cases.find(other => other.id === c.id && other.cohort === 'new-initial')
  for (const [i, old] of numerical.get(initial).entries()) {
    const deep = numerical.get(c)[i]
    if (old.evaluationEvidence?.source === 'completed-snapshot' && old.evaluationEvidence.status === 'coherent'
      && deep.evaluationEvidence?.source === 'completed-snapshot' && deep.evaluationEvidence.status === 'coherent'
      && old.evaluationEvidence.rootDepth > deep.evaluationEvidence.rootDepth) choices.set(old.fenBefore, initial.entries[i].engine)
  }
  return choices
}
const variants = [
  { id: 'exact-cp', rules: [exactCp] }, { id: 'exact-mate', rules: [exactMate] },
  { id: 'depth-guard', rules: [], depth: true }, { id: 'intermediate-opportunity', rules: [], opportunity: true },
  { id: 'wide-best-band', rules: [wide] },
]
async function compare(variant) {
  const rows = [], choices = []
  for (const c of cases) {
    const selected = variant.depth ? depthChoices(c) : new Map()
    let base = numerical.get(c)
    if (selected.size) {
      choices.push(...[...selected].map(([fen, engine]) => ({ game: c.id, fen, depth: engine.specialLines[0].depth })))
      base = base.map(e => selected.has(e.fenBefore) || selected.has(e.fenAfter)
        ? classifyReviewedMove({ ...e, engine: selected.get(e.fenBefore) ?? e.engine,
          playedEngine: selected.get(e.fenAfter) ?? e.playedEngine }) : e)
    }
    base = base.map(e => ties(e, variant.rules))
    const result = (variant.opportunity ? alternateSpecial.reclassifySpecialMoves(base) : reclassifySpecialMoves(base)).map(applyMoveFacts)
    for (const [i, entry] of result.entries()) rows.push({ cohort: c.cohort, game: c.id, ply: entry.ply, san: entry.playedMove,
      expected: c.expected[i], before: label[c.entries[i].classification], after: label[entry.classification] })
    console.log(JSON.stringify({ variant: variant.id, compared: c.id, cohort: c.cohort }))
  }
  const summaries = ['new-initial', 'new-refined', 'old'].map(cohort => {
    const r = rows.filter(r => r.cohort === cohort), changes = r.filter(r => r.before !== r.after)
    return { cohort, total: r.length, before: r.filter(r => r.before === r.expected).length,
      after: r.filter(r => r.after === r.expected).length,
      corrected: changes.filter(r => r.before !== r.expected && r.after === r.expected).length,
      regressed: changes.filter(r => r.before === r.expected && r.after !== r.expected).length,
      otherChanges: changes.filter(r => r.before !== r.expected && r.after !== r.expected).length,
      specialCorrectBefore: r.filter(r => ['Grande', 'Geniale'].includes(r.expected) && r.before === r.expected).length,
      specialCorrectAfter: r.filter(r => ['Grande', 'Geniale'].includes(r.expected) && r.after === r.expected).length }
  })
  assert.deepEqual(summaries.map(s => s.before), [172, 182, 329])
  const accepted = summaries.some(s => s.corrected > 0)
    && summaries.every(s => s.regressed === 0 && s.specialCorrectAfter >= s.specialCorrectBefore)
  const report = { id: variant.id, accepted, summaries, changes: rows.filter(r => r.before !== r.after), choices }
  await writeFile(`${area}/variant-${variant.id}.json`, JSON.stringify(report, null, 2), { flag: 'wx' })
  return report
}
const original = JSON.stringify(cases), reports = []
for (const variant of variants) reports.push(await compare(variant))
const accepted = variants.filter((_, i) => reports[i].accepted)
const combined = await compare({ id: 'combined', rules: accepted.flatMap(v => v.rules),
  depth: accepted.some(v => v.depth), opportunity: accepted.some(v => v.opportunity) })
assert.equal(JSON.stringify(cases), original)
for (const [path, expected] of watched) assert.equal(sha(await readFile(path)), expected, path)
for (const s of audit.sources) assert.equal(sha(await readFile(s.path)), s.sha256, s.path)
await writeFile(`${area}/study.json`, JSON.stringify({ newSearches: 0, applicationChanged: false,
  independentValidation: false, acceptedVariants: accepted.map(v => v.id), combined,
  variants: reports, sources: [...watched].map(([path, sha256]) => ({ path, sha256 })),
  sourceHashes: { review: sha(Buffer.from(reviewSource)), special: sha(Buffer.from(specialSource)) } }, null, 2), { flag: 'wx' })
console.log(JSON.stringify({ accepted: accepted.map(v => v.id), combined }, null, 2))
