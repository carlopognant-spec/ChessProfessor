import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { classifyAnalysisEntries, moveEvaluationFields } from '../src/lib/classification.js'
import { classifySpecialMove, reclassifySpecialMoves } from '../src/lib/specialClassification.js'
import { detectMaterialRealization } from '../src/lib/materialRealization.js'

function example(id, ply) {
  const cache = JSON.parse(readFileSync(new URL(`./fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/${id}.json`, import.meta.url)))
  const entries = cache.entries.slice(ply - 3, ply).map(e => classifyAnalysisEntries([{ ...e,
    playedMove: e.san, ...moveEvaluationFields(e.engine, e.playedEngine, e.uci), isBookMove: false }])[0])
  return { own: entries[0], previous: entries[1], entry: entries[2] }
}
const classify = ({ entry, previous, own }) => classifySpecialMove(entry, previous, own)

describe('partial evidence for critical defense', () => {
  it.each([['personal-03', 19], ['personal-06', 13]])('recognizes a real critical defense in %s/%s with honest partial coverage', (id, ply) => {
    const e = example(id, ply), original = JSON.stringify(e)
    const result = classify(e)
    expect(result.classification).toBe('great')
    expect(result.specialAssessment.grande.reason).toBe('critical-defense')
    expect(result.specialAssessment.coverage).toMatchObject({ allLegal: false, analyzed: 2, source: 'legacy-lines' })
    expect(JSON.stringify(e)).toBe(original)
    expect(reclassifySpecialMoves([e.own, e.previous, { ...result, specialAssessment: { version: 'counterfactual-v3' } }]).at(-1).classification).toBe('great')
  })

  it('requires a distinct alternative at the primary depth and rejects an observed favorable alternative', () => {
    const e = example('personal-06', 13)
    e.entry.engine.lines[1].depth--
    expect(classify(e).classification).toBe('best')
    const other = example('personal-06', 13)
    other.entry.engine.lines[2].evalCp = 0
    expect(classify(other).classification).toBe('best')
  })

  it('rejects same-depth duplicate roots and duplicate completed snapshots', () => {
    const e = example('personal-03', 19)
    e.entry.engine.lines[1].depth = e.entry.engine.lines[2].depth
    expect(classify(e).specialAssessment.grande.reason).toBe('duplicate-or-illegal-roots')
    const snapshot = example('personal-03', 19)
    snapshot.entry.engine.specialLines = snapshot.entry.engine.lines
    expect(classify(snapshot).specialAssessment.grande.reason).toBe('duplicate-or-illegal-roots')
  })

  it('validates discarded duplicate variations instead of hiding an illegal line', () => {
    const e = example('personal-03', 19)
    e.entry.engine.lines[1].pv.push('a1a8')
    expect(classify(e).classification).toBe('best')
    expect(classify(e).specialAssessment.grande.reason).toBe('invalid-position-or-variation')
  })

  it.each([['personal-03', 12], ['personal-05', 25], ['game-2-saintamant-staunton-1843', 112]])(
    'keeps a material realization numerical in %s/%s', (id, ply) => {
      const e = example(id, ply)
      expect(detectMaterialRealization(e.entry, e.previous, e.own)?.kind).toBe('immediate-material-recovery')
      expect(classify(e).classification).toBe('best')
    })
})

describe('mate compensation and independent winning-alternative veto', () => {
  it('does not let an unplayed material recovery mask a full mating estimate, while keeping the winning-alternative veto', () => {
    const e = example('game-1-chigorin-steinitz-1892', 61)
    const result = classify(e)
    expect(result.classification).toBe('best')
    expect(result.specialAssessment.brilliant.reason).toBe('winning-alternative-without-new-sacrifice')
    const incomplete = example('game-1-chigorin-steinitz-1892', 61)
    incomplete.entry.playedEngine.lines[0].pv.pop()
    expect(classify(incomplete).specialAssessment.brilliant.reason).toBe('unresolved-immediate-recovery')
  })
})
