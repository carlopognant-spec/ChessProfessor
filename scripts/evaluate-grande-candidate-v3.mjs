import assert from 'node:assert/strict'
import { readFile, writeFile, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { classifyGrandeCandidateV3 } from '../src/lib/grandeCandidateV3.js'
import { formatSpecialAssessment } from '../src/lib/analysisSpecialClassification.js'
import { SPECIAL_POLICY } from '../src/lib/specialPolicy.js'

const root = fileURLToPath(new URL('../', import.meta.url)), options = {}
for (let i = 2; i < process.argv.length; i++) {
  const key = process.argv[i], value = process.argv[++i]
  assert.ok(['--input', '--output'].includes(key) && !(key in options) && value && !value.startsWith('--'))
  options[key] = value
}
assert.ok(options['--input'] && options['--output'], 'Use --input <frozen-v2.json> --output <external-v3.json>')
const output = path.resolve(options['--output']), relative = path.relative(root, output)
assert.ok(relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative), 'Output must be external')
const watched = new Map(), hash = data => createHash('sha256').update(data).digest('hex')
async function bytes(filename) {
  const filenameAbsolute = path.resolve(root, filename), data = await readFile(filenameAbsolute)
  const sha256 = hash(data)
  if (watched.has(filenameAbsolute)) assert.equal(watched.get(filenameAbsolute), sha256)
  watched.set(filenameAbsolute, sha256)
  return data
}
const json = async filename => JSON.parse((await bytes(filename)).toString('utf8').replace(/^\uFEFF/, ''))
const fixed = await json(options['--input'])
assert.equal(fixed.summary.searchesExecuted, 0)
assert.equal(fixed.rows.filter(r => !r.control).length, 857)
const receiptPath = fixed.watched.find(r => r.path.endsWith('candidate-v1-source-receipt.json')).path
const receipt = await json(receiptPath)
assert.equal(receipt.protected.length, 10)
for (const record of receipt.protected) assert.equal(hash(await bytes(record.path)), record.expected, record.path)
// Frozen candidate versions remain byte-identical. Other source changes are the reviewable v3 proposal.
for (const filename of ['src/lib/grandeCandidate.js', 'src/lib/grandeCandidateV2.js']) {
  const record = fixed.sourceHashes.find(r => r.path === filename)
  assert.equal(hash(await bytes(filename)), record.sha256, filename)
}
for (const record of fixed.watched.filter(r => !r.path.startsWith(root) || !/[/\\]src[/\\]|[/\\]scripts[/\\]/.test(r.path))) {
  assert.equal(hash(await bytes(record.path)), record.sha256, record.path)
}
for (const filename of (await readdir(path.join(root, 'src/lib'))).filter(n => n.endsWith('.js')).sort()) await bytes(`src/lib/${filename}`)
await bytes('scripts/evaluate-grande-candidate-v3.mjs')

// User-selected diagnostic cases only. These attachments are not claimed to exist in live app inputs.
const supplementalSelection = [['personal-01', 45], ['personal-05', 27], ['personal-06', 31],
  ['game-1-chigorin-steinitz-1892', 25], ['game-1-chigorin-steinitz-1892', 39],
  ['game-2-saintamant-staunton-1843', 56], ['game-2-saintamant-staunton-1843', 80], ['game-2-saintamant-staunton-1843', 82]]
const packets = new Map()
for (const folder of ['native-wdl-evidence-v1', 'special-completion-evidence-v1']) {
  for (const record of (await json(`agent-output/${folder}/collection.json`)).records) {
    const data = await bytes(record.path)
    assert.equal(hash(data), record.sha256, record.path)
    const packet = JSON.parse(data)
    if (!packets.has(packet.fen)) packets.set(packet.fen, { engine: packet.engine, path: record.path })
  }
}
const rows = [], history = new Map()
for (const row of fixed.rows) {
  const group = history.get(row.gameId) ?? [], diagnostic = row.cohort === 'targeted-controlled-reproduction'
  const previous = diagnostic ? row.previous : group.at(-1) ?? null
  const own = diagnostic ? row.previousOwn : group.at(-2) ?? null
  const before = JSON.stringify([row.input, previous, own, row.publishedEntry])
  const candidate = classifyGrandeCandidateV3(row.input, previous, own, null, row.publishedEntry)
  assert.equal(candidate.classification, candidate.candidateAssessment.classification)
  assert.equal(candidate.classification, candidate.classificationDecision.classification)
  if (candidate.candidateAssessment.verdict !== 'not-applicable') {
    assert.equal(candidate.specialAssessment.grande.status === 'supported', candidate.classification === 'great')
    assert.equal(candidate.classification === 'great', Boolean(formatSpecialAssessment(candidate)))
  }
  if (!['best', 'excellent', 'great'].includes(row.published)) assert.equal(candidate.classification, row.published)
  if (candidate.candidateAssessment.inheritance) assert.equal(candidate.candidateAssessment.verdict, 'inconclusive')
  for (const key of ['bestEval', 'playedEval', 'bestProbability', 'playedProbability', 'dropPct', 'engine', 'playedEngine']) {
    assert.deepEqual(candidate[key], row.publishedEntry[key], `Numerical profile changed: ${row.gameId}/${row.ply}/${key}`)
  }
  let recoveredEntry = null, attachment = null
  if (supplementalSelection.some(([id, ply]) => id === row.gameId && ply === row.ply)) {
    const rootPacket = packets.get(row.input.fenBefore), childPacket = packets.get(row.input.fenAfter)
    assert.ok(rootPacket && childPacket, `Missing archived packet: ${row.gameId}/${row.ply}`)
    attachment = { source: 'fixture-only-recovered-pair', root: rootPacket.path, child: childPacket.path,
      availableInOrdinaryInput: Boolean(row.input.nativeDecisionProof || row.input.grandeDecisionProof
        || row.input.refinement?.nativeProof || row.input.refinement?.grandeProof) }
    const enriched = { ...row.input, refinement: { ...row.input.refinement, nativeProof: {
      version: 'native-winning-proof-v1', root: rootPacket.engine, child: childPacket.engine, alternatives: [] } } }
    recoveredEntry = classifyGrandeCandidateV3(enriched, previous, own, null, row.publishedEntry)
  }
  assert.equal(JSON.stringify([row.input, previous, own, row.publishedEntry]), before, 'Source evidence mutated')
  rows.push({ gameId: row.gameId, cohort: row.cohort, ply: row.ply, san: row.san, control: row.control,
    expected: row.expected, expectedGrande: row.expectedGrande, excluded: row.excluded,
    published: row.published, v1: row.v1, v2: row.v2, v3: candidate.classification,
    v3Recovered: recoveredEntry?.classification ?? candidate.classification,
    candidateEntry: candidate, recoveredEntry, attachment })
  group.push(row.publishedEntry); history.set(row.gameId, group)
}
function metrics(selected, policy) {
  const included = selected.filter(r => !r.excluded), labelled = included.filter(r => r.expectedGrande != null)
  const tp = labelled.filter(r => r.expectedGrande && r[policy] === 'great').length
  const fp = labelled.filter(r => !r.expectedGrande && r[policy] === 'great').length
  const fn = labelled.filter(r => r.expectedGrande && r[policy] !== 'great').length
  return { rows: selected.length, excluded: selected.length - included.length, labelled: labelled.length,
    tp, fp, fn, exactMatches: included.filter(r => r.expected != null && r[policy] === r.expected).length,
    unlabelled: included.filter(r => r.expectedGrande == null).length,
    unlabelledAssignments: included.filter(r => r.expectedGrande == null && r[policy] === 'great').length }
}
const counts = (selected, key) => selected.reduce((result, row) => {
  const value = key(row); result[value] = (result[value] ?? 0) + 1; return result
}, {})
function summarize(selected) {
  const assessment = row => row.candidateEntry.candidateAssessment
  return { metrics: Object.fromEntries(['published', 'v1', 'v2', 'v3', 'v3Recovered'].map(p => [p, metrics(selected, p)])),
    verdicts: counts(selected, r => assessment(r).verdict), inheritance: counts(selected, r => assessment(r).inheritance ?? 'none'),
    confirmed: selected.filter(r => r.v3 === 'great' && assessment(r).verdict === 'confirmed').length,
    inheritedGrande: selected.filter(r => r.v3 === 'great' && assessment(r).inheritance).length,
    confirmedWithRecovered: selected.filter(r => (r.recoveredEntry ?? r.candidateEntry).candidateAssessment.verdict === 'confirmed').length,
    inconclusiveWithoutGrande: selected.filter(r => r.v3 !== 'great' && assessment(r).verdict === 'inconclusive').length,
    changedFromPublished: selected.filter(r => r.v3 !== r.published).length,
    changedFromV2: selected.filter(r => r.v3 !== r.v2).length,
    unlabelledChanges: selected.filter(r => r.expectedGrande == null && r.v3 !== r.published)
      .map(r => ({ gameId: r.gameId, ply: r.ply, san: r.san, published: r.published, v2: r.v2, v3: r.v3 })) }
}
// Controls are pre-existing v2 rows, not a new benchmark or second replay.
const fixedRows = rows.filter(r => !r.control), controls = rows.filter(r => r.control)
for (const [id, ply] of [['game-1-chigorin-steinitz-1892', 28], ['game-2-saintamant-staunton-1843', 76],
  ['185230271130', 16], ['tripleteaa-diagnostic', 26], ['tripleteaa-diagnostic', 36], ['tripleteaa-diagnostic', 50]]) {
  assert.notEqual(rows.find(r => r.gameId === id && r.ply === ply).v3, 'great')
}
const be4 = controls.find(r => r.gameId === 'public-wcc2024-1' && r.ply === 74)
const comparison = be4.candidateEntry.candidateAssessment.evidence.find(e => e.kind === 'comparative')
const summary = { candidateVersion: 'grande-evidence-candidate-v3', searchesExecuted: 0, replayPasses: 1,
  independentValidation: false, fixtureAttachmentsAreLiveEvidence: false,
  fixed: summarize(fixedRows), controls: summarize(controls),
  recoveredCases: rows.filter(r => r.attachment).map(r => ({ gameId: r.gameId, ply: r.ply, san: r.san,
    ordinary: r.v3, recovered: r.v3Recovered, verdict: r.recoveredEntry.candidateAssessment.verdict,
    evidenceKind: r.recoveredEntry.candidateAssessment.evidenceKind, attachment: r.attachment })),
  be4: { gameId: be4.gameId, ply: be4.ply, classification: be4.v3,
    maintainedIndex: comparison.maintainedIndex, winningThreshold: SPECIAL_POLICY.winning,
    margin: comparison.maintainedIndex - SPECIAL_POLICY.winning,
    caveat: 'Near the unchanged winning threshold; no tactical certificate. No promotion or threshold tuning.' } }
for (const [filename, sha256] of watched) assert.equal(hash(await readFile(filename)), sha256, filename)
await writeFile(output, JSON.stringify({ summary, rows, watched: [...watched].map(([filename, sha256]) => ({ path: filename, sha256 })) }, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({ output, summary }, null, 2))
