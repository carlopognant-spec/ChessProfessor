import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'
import { classifyGrandeCandidate } from '../src/lib/grandeCandidate.js'
import { classifyGrandeCandidateV2 } from '../src/lib/grandeCandidateV2.js'
import { resolveEvaluationInput } from './grande-frozen-input-path.js'

const root = fileURLToPath(new URL('../', import.meta.url)), options = {}
for (let i = 2; i < process.argv.length; i++) {
  const key = process.argv[i]
  assert.ok(['--input', '--receipt', '--output'].includes(key) && !(key in options), 'Unknown or duplicate argument')
  const value = process.argv[++i]
  assert.ok(value && !value.startsWith('--'), 'Missing argument value'); options[key] = value
}
assert.ok(options['--input'] && options['--receipt'] && options['--output'], 'Use --input <fixed-v1-results.json> --receipt <v1-source-receipt.json> --output <external-v2-results.json>')
const output = path.resolve(options['--output']), relative = path.relative(root, output)
assert.ok(path.isAbsolute(relative) || relative === '..' || relative.startsWith(`..${path.sep}`), 'Output must be external')
const watched = new Map(), hash = bytes => createHash('sha256').update(bytes).digest('hex')
async function bytes(filename) {
  const absolute = await resolveEvaluationInput(filename, root), data = await readFile(absolute)
  const sha256 = hash(data)
  if (watched.has(absolute)) assert.equal(watched.get(absolute), sha256, `Input changed: ${absolute}`)
  watched.set(absolute, sha256)
  return data
}
const json = async filename => JSON.parse((await bytes(filename)).toString('utf8').replace(/^\uFEFF/, ''))
const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
const receipt = await json(options['--receipt'])
assert.equal(receipt.kind, 'post-validation-source-receipt')
assert.equal(receipt.sourceCommit, sourceCommit, 'Source commit differs from v1 receipt')
const candidateV1 = receipt.source.find(s => s.path === 'src/lib/grandeCandidate.js')
assert.ok(candidateV1)
for (const source of [...receipt.source, ...receipt.protected]) {
  const actual = hash(await bytes(source.path))
  assert.equal(actual, source.sha256 ?? source.expected, `Receipt mismatch: ${source.path}`)
  if (source.expected) assert.equal(source.actual, source.expected, 'Receipt records modified protected input')
}
const sourcePaths = ['scripts/evaluate-grande-candidate-v2.mjs', 'scripts/grande-frozen-input-path.js',
  ...(await readdir(path.join(root, 'src/lib'))).filter(name => name.endsWith('.js')).sort().map(name => `src/lib/${name}`)]
const sourceHashes = await Promise.all(sourcePaths.map(async filename => ({ path: filename, sha256: hash(await bytes(filename)) })))
const fixed = await json(options['--input'])
assert.equal(fixed.rows.length, 857); assert.equal(fixed.summary.searchesExecuted, 0)
for (const input of fixed.watched) assert.equal(hash(await bytes(input.path)), input.sha256, `Original v1 input changed: ${input.path}`)

// Selected before the v2 freeze; these are compatibility controls, not a new independently labelled benchmark.
const controlSelection = [
  { id: 'game-3-fools-mate', fixture: 'tests/fixtures/qa/game-3-fools-mate.json', cache: 'tests/fixtures/qa/analysis-cache/game-3-fools-mate.json', plies: 4, role: 'sanity-labels; Stockfish16-depth evidence; terminal/category compatibility' },
  { id: 'public-wcc2024-1', cache: 'agent-output/node-budget-public-v1/results.json', plies: 84, role: 'unlabelled public200k compatibility; already studied budget corpus' },
  { id: 'public-wcc2024-2', cache: 'agent-output/node-budget-public-v1/results.json', plies: 46, role: 'unlabelled public200k compatibility; already studied budget corpus' },
]
const rows = [], groupHistory = new Map()
function evaluate(row, previous, previousOwn, control = false) {
  const candidate = classifyGrandeCandidateV2(structuredClone(row.input), structuredClone(previous), structuredClone(previousOwn), null,
    structuredClone(row.publishedEntry), structuredClone(row.candidateEntry))
  const assessment = candidate.candidateAssessment
  assert.equal(assessment.version, 'grande-evidence-candidate-v2')
  assert.ok(['confirmed', 'excluded', 'inconclusive', 'not-applicable'].includes(assessment.verdict))
  assert.ok([null, 'historical', 'context'].includes(assessment.inheritance))
  assert.equal(assessment.publishedClassification, row.published)
  assert.equal(assessment.v1Classification, row.candidate)
  assert.equal(assessment.classification, candidate.classification)
  if (assessment.inheritance) assert.equal(assessment.verdict, 'inconclusive', 'Inherited labels cannot be newly confirmed')
  rows.push({ ...row, control, v1: row.candidate, v2: candidate.classification,
    confirmedGrande: assessment.verdict === 'confirmed' && assessment.inheritance === null && candidate.classification === 'great',
    v2Entry: candidate })
}
for (const row of fixed.rows) {
  const history = groupHistory.get(row.gameId) ?? []
  const diagnostic = row.cohort === 'targeted-controlled-reproduction'
  if (!diagnostic) assert.equal(row.ply, history.length + 1, 'Noncontiguous fixed game')
  evaluate(row, diagnostic ? row.previous : history.at(-1) ?? null, diagnostic ? row.previousOwn : history.at(-2) ?? null)
  history.push(row.publishedEntry); groupHistory.set(row.gameId, history)
}

const sanity = await json(controlSelection[0].fixture), sanityCache = await json(controlSelection[0].cache)
assert.equal(sanity.pgn, sanityCache.pgn)
const labels = { Errore: 'mistake', Migliore: 'best', 'Errore grave': 'blunder' }
const publicCache = await json(controlSelection[1].cache)
for (const selection of controlSelection) {
  const isSanity = selection.id === 'game-3-fools-mate'
  const entries = isSanity ? sanityCache.entries.map(e => ({ ...e, playedMove: e.san, playedUci: e.uci, isBookMove: false }))
    : publicCache.games.find(g => g.game === selection.id).initialEntries
  assert.equal(entries.length, selection.plies)
  const published = reclassifyReviewedMoves(structuredClone(entries))
  for (let i = 0; i < entries.length; i++) {
    const previous = published[i - 1] ?? null, previousOwn = published[i - 2] ?? null
    const v1 = classifyGrandeCandidate(structuredClone(entries[i]), structuredClone(previous), structuredClone(previousOwn), null, structuredClone(published[i]))
    const annotation = isSanity ? sanity.annotations.find(a => a.ply === i + 1) : null
    if (annotation) assert.equal(annotation.san, entries[i].san)
    const expected = annotation ? labels[annotation.category] : null
    if (annotation) assert.ok(expected, 'Unknown sanity label')
    evaluate({ gameId: selection.id, cohort: isSanity ? 'preselected-sanity-control' : 'preselected-unlabelled-public-control',
      ply: i + 1, san: entries[i].playedMove ?? entries[i].san, expected, expectedGrande: expected == null ? null : expected === 'great',
      excluded: false, published: published[i].classification, candidate: v1.classification, input: entries[i], publishedEntry: published[i], candidateEntry: v1 }, previous, previousOwn, true)
  }
}
assert.equal(rows.length, 991)
function metrics(selected, policy, confirmedOnly = false) {
  const included = selected.filter(r => !r.excluded), labelled = included.filter(r => r.expectedGrande != null)
  const predicts = r => confirmedOnly ? r.confirmedGrande : r[policy] === 'great'
  const tp = labelled.filter(r => r.expectedGrande && predicts(r)).length
  const fp = labelled.filter(r => !r.expectedGrande && predicts(r)).length
  const fn = labelled.filter(r => r.expectedGrande && !predicts(r)).length
  return { plies: selected.length, excluded: selected.length - included.length, labelled: labelled.length,
    unlabelled: included.length - labelled.length, tp, fp, fn, precision: tp + fp ? tp / (tp + fp) : null,
    recall: tp + fn ? tp / (tp + fn) : null, unlabelledAssignments: included.filter(r => r.expectedGrande == null && predicts(r)).length }
}
function counts(selected, key) {
  return selected.reduce((result, row) => { const value = key(row); result[value] = (result[value] ?? 0) + 1; return result }, {})
}
function summarize(selected) {
  return { published: metrics(selected, 'published'), v1: metrics(selected, 'v1'), v2EffectiveIncludingInherited: metrics(selected, 'v2'),
    v2NewConfirmedOnly: metrics(selected, 'v2', true), verdicts: counts(selected, r => r.v2Entry.candidateAssessment.verdict),
    inheritance: counts(selected, r => r.v2Entry.candidateAssessment.inheritance ?? 'none'),
    intersections: counts(selected, r => [r.v2Entry.candidateAssessment.verdict, r.v2Entry.candidateAssessment.inheritance ?? 'none', r.expectedGrande === null ? 'unlabelled' : r.expectedGrande ? 'reference-positive' : 'reference-negative', r.published, r.v1, r.v2].join('/')),
    changedFromPublished: selected.filter(r => r.published !== r.v2).length, changedFromV1: selected.filter(r => r.v1 !== r.v2).length }
}
const fixedRows = rows.filter(r => !r.control), controls = rows.filter(r => r.control)
const fiveCases = fixedRows.filter(r => [['184316820266', 28], ['184316820266', 34], ['184316820266', 64], ['185230271130', 25], ['185230000668', 7]].some(([id, ply]) => r.gameId === id && r.ply === ply))
assert.equal(fiveCases.length, 5)
const summary = { evaluatorVersion: 'grande-candidate-evaluator-v2', candidateVersion: 'grande-evidence-candidate-v2',
  sourceCommit, candidateV1Sha256: candidateV1.sha256, fixedV1ResultsSha256: watched.get(await resolveEvaluationInput(options['--input'], root)),
  searchesExecuted: 0, fixedRowsReused: fixedRows.length, controlRows: controls.length, independentValidation: false,
  provenanceCaveat: receipt.scope, history: 'Same published context for all policies; fixed v1 labels reused without replay; controls evaluated only after candidate freeze.',
  inheritanceCaveat: 'Historical/context labels are operational outcomes only; excluded from new-confirmed counts. Missing labels never become reference negatives.',
  fixed: summarize(fixedRows), controls: summarize(controls),
  cohorts: [...new Set(rows.map(r => r.cohort))].map(cohort => ({ cohort, ...summarize(rows.filter(r => r.cohort === cohort)) })),
  fiveCases: fiveCases.map(r => ({ gameId: r.gameId, ply: r.ply, san: r.san, expected: r.expected, published: r.published, v1: r.v1, v2: r.v2, assessment: r.v2Entry.candidateAssessment })) }
for (const [filename, sha256] of watched) assert.equal(hash(await readFile(filename)), sha256, `Input/source changed: ${filename}`)
await mkdir(path.dirname(output), { recursive: true })
await writeFile(output, JSON.stringify({ summary, controlSelection, sourceHashes, rows,
  watched: [...watched].map(([filename, sha256]) => ({ path: filename, sha256 })) }, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({ output, summary }, null, 2))
