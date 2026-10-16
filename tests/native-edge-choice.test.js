import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import { edgeChoicePotential, corroboratedEdgeChoice } from '../src/lib/nativeEdgeChoice.js'
import { validGrandeSearch } from '../src/lib/grandeProofs.js'
const json = p => JSON.parse(readFileSync(new URL('../' + p, import.meta.url)))
const { cases } = json('agent-output/special-completion-v1/cohorts.json')
const deep = new Map()
for (const collection of ['special-completion-evidence-v1', 'native-wdl-evidence-v1', 'native-alternative-evidence-v1']) {
  for (const record of json(`agent-output/${collection}/collection.json`).records) {
    const packet = json(record.path)
    if (!deep.has(packet.fen)) deep.set(packet.fen, packet.engine)
  }
}
const protocol = json('agent-output/native-edge-study-v1/protocol.json')
const records = json('agent-output/native-edge-study-v1/collection.json').records
function example(id = 'game-2-saintamant-staunton-1843', ply = 56, cohort = 'old') {
  const c = cases.find(c => c.id === id && c.cohort === cohort)
  const [previousOwn, previous, entry] = structuredClone(c.entries.slice(ply - 3, ply))
  entry.nativeDecisionProof = { version: 'native-winning-proof-v1', root: structuredClone(deep.get(entry.fenBefore)),
    child: structuredClone(deep.get(entry.fenAfter)), alternatives: [], attempts: [] }
  if (id === 'game-2-saintamant-staunton-1843' && ply === 56) entry.nativeDecisionProof.alternatives = records.map(r => {
    const p = json(r.path), t = protocol.schedule.find(t => t.index === r.index)
    return { uci: t.uci, fen: p.fen, engine: p.engine }
  })
  return { entry, previous, previousOwn }
}
const potential = x => edgeChoicePotential(x.entry, x.previous, x.previousOwn)
const prove = x => corroboratedEdgeChoice(x.entry, x.previous, x.previousOwn)
describe('experimental independently corroborated relative advantage', () => {
  it('requires all four independent alternatives and reports relative advantage, not a forced win', () => {
    const x = example(), original = JSON.stringify(x), proof = prove(x)
    expect(proof).toMatchObject({ kind: 'unique-corroborated-native-advantage', boundary: 'symmetric-expected-score-half', proofAgainstEveryDefense: false })
    expect(proof.alternatives).toHaveLength(4)
    expect(proof.played.points.min).toBeGreaterThan(.5)
    expect(proof.confirmed.points.min).toBeGreaterThan(.5)
    for (const a of proof.alternatives) { expect(a.root.points.max).toBeLessThan(.5); expect(a.child.points.max).toBeLessThan(.5) }
    expect(JSON.stringify(x)).toBe(original)
  })
  it.each(['missing', 'duplicate', 'fen', 'uci', 'budget', 'overshoot', 'incomplete', 'bounded', 'illegal-pv'])('rejects %s alternative evidence', kind => {
    const x = example(), a = x.entry.nativeDecisionProof.alternatives, r = a[0]
    if (kind === 'missing') a.pop()
    if (kind === 'duplicate') a[1] = structuredClone(r)
    if (kind === 'fen') r.fen = x.entry.fenBefore
    if (kind === 'uci') r.uci = x.entry.playedUci
    if (kind === 'budget') r.engine.analysisMetadata.budget.value = 200000
    if (kind === 'overshoot') r.engine.actualNodes = 1005001
    if (kind === 'incomplete') r.engine.specialLines = []
    if (kind === 'bounded') r.engine.specialLines[0].lowerbound = true
    if (kind === 'illegal-pv') r.engine.specialLines[0].pv = ['a1a8']
    expect(prove(x)).toBeNull()
  })
  it('rejects an independently favorable alternative even if its root was unfavorable', () => {
    const x = example(), r = x.entry.nativeDecisionProof.alternatives[0]
    r.engine.evalCp = -80; r.engine.lines[0].evalCp = -80; r.engine.specialLines[0].evalCp = -80
    expect(validGrandeSearch(r.engine, r.fen)).toBe(true)
    expect(prove(x)).toBeNull()
  })
  it('rejects a favorable second root choice', () => {
    const x = example(); x.entry.nativeDecisionProof.root.specialLines[1].evalCp = 30
    expect(potential(x)).toBeNull()
  })
  it('does not treat rounded zero expected advantage as strictly favorable', () => {
    const x = example(), p = x.entry.nativeDecisionProof
    p.root.specialLines[0].evalCp = 1; p.child.specialLines[0].evalCp = -1
    expect(potential(x)).toBeNull()
  })
  it.each([['185262315732', 63, 'refined'], ['184316820266', 45, 'refined'], ['personal-03', 29, 'old'], ['personal-04', 31, 'old']])('excludes ordinary material realization %s/%s', (id, ply, cohort) => {
    expect(potential(example(id, ply, cohort))).toBeNull()
  })
  it('orients the same advantage criterion correctly for a white move', () => {
    expect(potential(example('184316820266', 43, 'refined'))).toBeTruthy()
  })
})
