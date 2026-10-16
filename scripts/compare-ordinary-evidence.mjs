// Offline development-only comparison. No engine, network, or holdout inputs.
// A new output directory is required for each run; prior results are immutable.
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { classifyReviewedMove, applyMoveFacts } from '../src/lib/reviewEvaluation.js'
import { classifyAnalysisEntries, evaluationFields } from '../src/lib/classification.js'
import { reclassifySpecialMoves } from '../src/lib/specialClassification.js'
import { ENGINE_CONFIG } from '../src/lib/engineConfig.js'

const output = process.argv[2]
assert.match(output ?? '', /^agent-output\/[a-z0-9-]+$/,
  'Usage: node scripts/compare-ordinary-evidence.mjs agent-output/<new-study-name>')
await mkdir(output) // exclusive: never overwrite a previous study
const sources = new Map(), sha = data => createHash('sha256').update(data).digest('hex')
async function watch(path) {
  const data = await readFile(path)
  sources.set(path, sha(data))
  return data
}
async function watchTree(path) {
  for (const item of await readdir(path, { withFileTypes: true })) {
    const child = `${path}/${item.name}`
    if (item.isDirectory()) await watchTree(child)
    else if (item.isFile()) await watch(child)
  }
}
const labels = { book: 'Libro', forced: 'Forzata', best: 'Migliore', excellent: 'Ottima',
  good: 'Buona', inaccuracy: 'Imprecisione', mistake: 'Errore', blunder: 'Errore grave',
  great: 'Grande', brilliant: 'Geniale', missed: 'Mossa mancata', unclassified: 'Non valutabile' }
const primary = engine => engine?.lines?.find(line => line.multipv === 1) ?? engine
const ordinary = e => !e.isBookMove && !e.moveFacts?.forced && e.playedMate !== 0
const exact = line => line && !line.bound && !line.upperbound && !line.lowerbound
  && !/\b(?:upperbound|lowerbound)\b/.test(line.raw ?? '')
const setBase = (e, classification) => ({ ...e, classification,
  baseClassification: classification, numericalClassification: classification })

// Defined before reading reference categories. No fitted constants, IDs or SANs.
const variants = [
  { id: 'near-best', rationale: 'Allow the existing best-loss band for non-primary moves; keep exact mate semantics.',
    apply(e) {
      return ordinary(e) && e.numericalClassification === 'excellent' && e.bestMate == null
        && e.playedMate == null && e.dropPct <= ENGINE_CONFIG.classification.best
        && e.evaluationEvidence?.status === 'coherent'
        ? setBase(e, 'best') : e
    } },
  { id: 'latest-root-pair', rationale: 'Prefer the latest legal same-depth root pair to the last completed snapshot.',
    apply(e) {
      if (!ordinary(e) || e.evaluationEvidence?.source !== 'completed-snapshot') return e
      const next = classifyReviewedMove({ ...e, engine: { ...e.engine, specialLines: [] } })
      return next.evaluationEvidence?.status === 'coherent' ? next : e
    } },
  { id: 'deeper-child', rationale: 'Use a strictly deeper legal child estimate to check the completed root comparison.',
    apply(e) {
      const child = primary(e.playedEngine)
      if (!ordinary(e) || e.evaluationEvidence?.source !== 'completed-snapshot'
        || !exact(child) || !Number.isInteger(child.depth)
        || child.depth <= e.evaluationEvidence.rootDepth
        || !Number.isFinite(e.bestEval) || !Number.isFinite(child.evalCp) || child.mate != null) return e
      // The normal reviewer validates the child FEN, exact score and legal PV.
      const check = classifyReviewedMove({ ...e, engine: { ...e.engine, specialLines: [], lines: [], pv: [] } })
      if (check.evaluationEvidence?.source !== 'independent-position'
        || !Number.isFinite(check.playedEval)) return e
      const fields = evaluationFields({ evalCp: e.bestEval, mate: null }, child)
      const next = classifyAnalysisEntries([{ ...e, ...fields,
        evaluationSource: 'independent-position', isBookMove: false }])[0]
      return { ...setBase(next, next.classification), evaluationEvidence: {
        ...check.evaluationEvidence, rootDepth: e.evaluationEvidence.rootDepth,
        unclampedDropPct: 100 * (next.bestProbability - next.playedProbability),
        status: next.playedProbability > next.bestProbability ? 'conflicting' : 'independent',
        equivalentBest: null } }
    } },
]
await watchTree('src')
await watch('scripts/compare-ordinary-evidence.mjs')
const frozen = JSON.parse(await watch('agent-output/specials-frozen-candidate-v1.json'))
for (const s of frozen.sources) assert.equal(sha(await watch(s.path)), s.sha256, s.path)
const input = 'agent-output/opportunity-sacrifice-batch-v1/cohorts.json'
const { cases } = JSON.parse(await watch(input)), original = JSON.stringify(cases)
assert.deepEqual([...new Set(cases.map(c => c.cohort))].sort(), ['initial', 'old', 'refined'])
const protocol = { developmentOnly: true, independentValidation: false, newSearches: 0,
  sources: [...sources].map(([path, sha256]) => ({ path, sha256 })),
  hypotheses: variants.map(({ id, rationale }) => ({ id, rationale })),
  acceptance: 'Some exact improvement; zero regressions in each cohort; no loss of correct special labels or increase of false special labels. Full integration checks required before app changes.',
  overlappingProfiles: 'initial and refined contain the same 262 moves, not independent samples.' }
await writeFile(`${output}/protocol.json`, JSON.stringify(protocol, null, 2) + '\n', { flag: 'wx' })
const numeric = cases.map(c => c.entries.map(classifyReviewedMove))
const project = entries => reclassifySpecialMoves(entries).map(applyMoveFacts)
const baseline = numeric.map(project), baselineCounts = ['initial', 'refined', 'old'].map(cohort =>
  cases.reduce((sum, c, k) => sum + (c.cohort === cohort
    ? baseline[k].filter((e, i) => labels[e.classification] === c.expected[i]).length : 0), 0))
assert.deepEqual(baselineCounts, [172, 189, 338])
const results = [], allRows = []
for (const variant of variants) {
  const rows = []
  for (const [k, c] of cases.entries()) {
    const proposed = project(numeric[k].map(variant.apply))
    for (const [i, e] of proposed.entries()) {
      const before = baseline[k][i]
      rows.push({ cohort: c.cohort, game: c.id, ply: e.ply, san: e.playedMove,
        expected: c.expected[i], before: labels[before.classification], after: labels[e.classification],
        numericalBefore: before.numericalClassification, numericalAfter: e.numericalClassification,
        source: before.evaluationEvidence?.source, dropPct: before.dropPct,
        bestEval: before.bestEval, playedEval: before.playedEval, isEngineBest: before.isEngineBest })
    }
  }
  const summaries = ['initial', 'refined', 'old'].map(cohort => {
    const rr = rows.filter(r => r.cohort === cohort), changes = rr.filter(r => r.before !== r.after)
    return { cohort, total: rr.length, before: rr.filter(r => r.before === r.expected).length,
      after: rr.filter(r => r.after === r.expected).length,
      corrected: changes.filter(r => r.after === r.expected).length,
      regressed: changes.filter(r => r.before === r.expected).length,
      other: changes.filter(r => r.before !== r.expected && r.after !== r.expected).length,
      specials: ['Geniale', 'Grande', 'Mossa mancata'].map(category => ({ category,
        beforeTP: rr.filter(r => r.expected === category && r.before === category).length,
        afterTP: rr.filter(r => r.expected === category && r.after === category).length,
        beforeFP: rr.filter(r => r.expected !== category && r.before === category).length,
        afterFP: rr.filter(r => r.expected !== category && r.after === category).length })) }
  })
  const safe = summaries.every(s => !s.regressed && s.specials.every(s => s.afterTP >= s.beforeTP && s.afterFP <= s.beforeFP))
  const result = { id: variant.id, acceptedForIntegration: safe && summaries.some(s => s.corrected > 0),
    summaries, changes: rows.filter(r => r.before !== r.after) }
  results.push(result)
  if (!allRows.length) allRows.push(...rows.map(r => ({ ...r, after: r.before })))
  console.log(JSON.stringify({ variant: variant.id, accepted: result.acceptedForIntegration,
    summaries: summaries.map(({ cohort, before, after, corrected, regressed, other }) =>
      ({ cohort, before, after, corrected, regressed, other })) }))
}
const diagnostic = ['initial', 'refined', 'old'].map(cohort => {
  const rows = allRows.filter(r => r.cohort === cohort), groups = new Map()
  for (const r of rows.filter(r => r.before !== r.expected)) {
    const key = `${r.before} → ${r.expected}`
    groups.set(key, (groups.get(key) ?? 0) + 1)
  }
  return { cohort, confusions: [...groups].map(([pair, count]) => ({ pair, count })).sort((a, b) => b.count - a.count),
    primaryChoiceDisagreements: rows.filter(r => r.before === 'Migliore' && r.isEngineBest
      && r.expected !== 'Migliore').map(r => ({ game: r.game, ply: r.ply, san: r.san, expected: r.expected })) }
})
assert.equal(JSON.stringify(cases), original)
for (const [path, hash] of sources) assert.equal(sha(await readFile(path)), hash, path)
await writeFile(`${output}/results.json`, JSON.stringify({ ...protocol,
  applicationChanged: false, results, diagnostic, baseline: allRows }, null, 2) + '\n', { flag: 'wx' })
