import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { collectSacrificeEvidence, assessImmediateRecoveries } from '../src/lib/sacrificeEvidence.js'
import { classifySpecialMove, SPECIAL_POLICY } from '../src/lib/specialClassification.js'
import { classifyReviewedMove } from '../src/lib/reviewEvaluation.js'

const archive = JSON.parse(readFileSync(new URL('../agent-output/new-references-200k-v1/game-184316820266.json', import.meta.url)))
const forced = JSON.parse(readFileSync(new URL('../agent-output/targeted-special-evidence-v1/search-0.json', import.meta.url)))
function fixture() {
  const entries = structuredClone(archive.entries)
  const e = entries[40], next = entries[41]
  const evidence = { ...collectSacrificeEvidence(e, next, SPECIAL_POLICY), source: 'forced-acceptance-search-200k',
    acceptanceLines: structuredClone(forced.engine.specialLines) }
  return { entries, e, evidence }
}
const classify = f => classifySpecialMove(classifyReviewedMove(f.e), f.entries[39], f.entries[38], f.evidence)

describe('engine evidence for apparently available material recoveries', () => {
  it('recognizes the sacrifice with separately verified acceptance and unfavorable recovery choices', () => {
    const f = fixture(), before = JSON.stringify(f)
    const result = classify(f)
    expect(result.classification).toBe('brilliant')
    expect(result.specialAssessment.brilliant.offers[0].recoveryAssessment.choices).toEqual([
      expect.objectContaining({ uci: 'e5d6', scope: 'below-complete-top-k' }),
      expect.objectContaining({ uci: 'd1d2', scope: 'scored-root' }),
    ])
    expect(JSON.stringify(f)).toBe(before)
    expect(classifySpecialMove(classifyReviewedMove(f.e), f.entries[39], f.entries[38]).classification).toBe('best')
  })

  it.each(['incomplete', 'mixed-depth', 'duplicate', 'bound', 'lowerbound', 'upperbound', 'illegal-pv', 'wrong-fen', 'wrong-bestmove', 'conflicting-snapshot', 'favorable-recovery', 'favorable-cutoff'])(
    'keeps the guard for %s evidence', kind => {
      const f = fixture(), engine = f.evidence.recoverySearches[0].engine, lines = engine.specialLines
      if (kind === 'incomplete') lines.pop()
      if (kind === 'mixed-depth') lines[1].depth++
      if (kind === 'duplicate') lines[2].pv = [...lines[1].pv]
      if (kind === 'bound') lines[1].bound = true
      if (kind === 'lowerbound') lines[1].lowerbound = true
      if (kind === 'upperbound') lines[1].upperbound = true
      if (kind === 'illegal-pv') lines[1].pv.push('a1a8')
      if (kind === 'wrong-fen') engine.fen = f.e.fenBefore
      if (kind === 'wrong-bestmove') engine.bestmove = 'd1d2'
      if (kind === 'conflicting-snapshot') engine.lines[0].evalCp = -600
      if (kind === 'favorable-recovery') lines[1].evalCp = 0
      if (kind === 'favorable-cutoff') for (const l of lines.slice(1)) l.evalCp = 0
      expect(assessImmediateRecoveries(f.evidence, 'f8f7', f.entries[41].fenAfter, ['e5d6', 'd1d2'])).toBeNull()
      expect(classify(f).specialAssessment.brilliant.reason).toBe('unresolved-immediate-recovery')
    })

  it('requires corroboration and never fills a missing acceptance from a confirmation', () => {
    const f = fixture(); f.evidence.confirmations = []
    expect(classify(f).specialAssessment.brilliant.reason).toBe('unresolved-immediate-recovery')
    const other = fixture(); other.evidence.acceptanceLines = []
    expect(classify(other).specialAssessment.brilliant.reason).toBe('missing-acceptance-analysis')
  })

  it('rechecks a previously promoted v6 archive without retaining an unsupported label', () => {
    const f = fixture()
    const result = classifySpecialMove({ ...f.e, classification: 'brilliant', baseClassification: 'best',
      specialAssessment: { version: 'counterfactual-v6' } }, f.entries[39], f.entries[38])
    expect(result.classification).toBe('best')
    expect(result.specialAssessment.version).toBe('counterfactual-v24')
    expect(result.specialAssessment.brilliant.reason).toBe('missing-acceptance-analysis')
  })
})
