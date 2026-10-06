import { describe, expect, it } from 'vitest'
import { classifyAnalysisEntries, evaluationFields, moveEvaluationFields } from '../src/lib/classification.js'

describe('analysis classification', () => {
  it('compares root variations without inverting scores for either mover', () => {
    const engine = { evalCp: 80, mate: null, lines: [
      { multipv: 1, depth: 12, evalCp: 80, mate: null, pv: ['e2e4'] },
      { multipv: 2, depth: 12, evalCp: 40, mate: null, pv: ['d2d4'] },
    ] }
    const fields = moveEvaluationFields(engine, { evalCp: 500, mate: null }, 'd2d4')
    expect(fields.playedEval).toBe(40)
    expect(fields.evaluationSource).toBe('root-pv')
    expect(fields.isEngineBest).toBe(false)
    expect(classifyAnalysisEntries([fields])[0].classification).toBe('excellent')
    engine.lines[0].pv = ['e7e5']
    engine.lines[1].pv = ['d7d5']
    expect(moveEvaluationFields(engine, { evalCp: 500 }, 'd7d5').playedEval).toBe(40)
  })

  it('does not call a different move best because of independent-search noise', () => {
    const fields = moveEvaluationFields({ evalCp: 20, mate: null, pv: ['e2e4'] }, { evalCp: -40, mate: null }, 'd2d4')
    const [entry] = classifyAnalysisEntries([fields])
    expect(entry.dropPct).toBe(0)
    expect(entry.classification).toBe('excellent')
    expect(entry.evaluationSource).toBe('independent-position')
  })

  it('falls back for a stale root depth and preserves missing scores and checkmate', () => {
    const engine = { evalCp: 20, mate: null, lines: [
      { multipv: 1, depth: 12, evalCp: 20, mate: null, pv: ['a7a8q'] },
      { multipv: 2, depth: 11, evalCp: 10, mate: null, pv: ['a7a8n'] },
    ] }
    expect(moveEvaluationFields(engine, { evalCp: -5, mate: null }, 'a7a8n')).toMatchObject({ playedEval: 5, isEngineBest: false, evaluationSource: 'independent-position' })
    expect(moveEvaluationFields(engine, { evalCp: -5, mate: null }, 'a7a8q')).toMatchObject({ playedEval: 20, isEngineBest: true })
    const missing = moveEvaluationFields({ evalCp: null, mate: null, pv: ['e2e4'] }, { evalCp: null, mate: null }, 'e2e4')
    expect(classifyAnalysisEntries([missing])[0].classification).toBe('unclassified')
    const mate = moveEvaluationFields(engine, { evalCp: null, mate: null }, 'a7a8n', { isCheckmate: true })
    expect(classifyAnalysisEntries([mate])[0].classification).toBe('best')
  })
  it('retains a measurable loss beyond the former centipawn clamp', () => {
    const entries = classifyAnalysisEntries([
      { bestEval: 4000, playedEval: 1000 },
      { bestEval: -1000, playedEval: -4000 },
    ])
    for (const entry of entries) {
      expect(entry.dropPct).toBeGreaterThan(7)
      expect(entry.classification).toBe('inaccuracy')
    }
    expect(entries[0].dropPct).toBeCloseTo(entries[1].dropPct, 12)
  })
  it('adds classification from played and best win-probability drops', () => {
    const [entry] = classifyAnalysisEntries([{ bestEval: 80, playedEval: 40 }])
    expect(entry.classification).toBe('excellent')
    expect(entry.evalDelta).toBe(-40)
    expect(entry.dropPct).toBeGreaterThan(0)
  })

  it('keeps missing evaluations explicitly non-evaluable', () => {
    const [entry] = classifyAnalysisEntries([{ bestEval: null, bestMate: null, playedEval: null, playedMate: null }])
    expect(entry.dropPct).toBeNull()
    expect(entry.classification).toBe('unclassified')
  })
  it('adds classification from played and best evaluations', () => {
    const entries = classifyAnalysisEntries([
      { bestEval: 80, playedEval: 120, isBookMove: false },
      { bestEval: 20, playedEval: 20, isBookMove: true },
    ])

    expect(entries.map((entry) => entry.classification)).toEqual(['best', 'book'])
    expect(entries[0].evalDelta).toBe(40)
    expect(entries[0].dropPct).toBe(0)
  })

  it('keeps per-move loss independent of opponent-error context', () => {
    const entries = classifyAnalysisEntries([
      { bestEval: 500, playedEval: 0, isBookMove: false },
      { bestEval: 100, playedEval: 100, isBookMove: false, missedOpportunity: true },
    ])

    expect(entries[0].classification).toBe('blunder')
    expect(entries[1].classification).toBe('best')
  })

  it('uses probability loss rather than a fixed centipawn delta', () => {
    const [equal, winning] = classifyAnalysisEntries([{ bestEval: 0, playedEval: -100 }, { bestEval: 900, playedEval: 800 }])
    expect(equal.evalDelta).toBe(winning.evalDelta)
    expect(equal.dropPct).toBeCloseTo(6.2176500886)
    expect(equal.classification).toBe('inaccuracy')
    expect(winning.dropPct).toBeLessThan(equal.dropPct)
    expect(winning.classification).toBe('excellent')
  })

  it('distinguishes missing scores from equal scores and preserves book priority', () => {
    const entries = classifyAnalysisEntries([{ bestEval: null, playedEval: 0 }, { bestEval: 0, playedEval: 0 }, { isBookMove: true }])
    expect(entries.map(e => e.classification)).toEqual(['unclassified', 'best', 'book'])
    expect(entries[0].dropPct).toBeNull()
    expect(entries[0].evalDelta).toBeNull()
  })

  it('handles winning, losing, delivered and escaped mates from the mover perspective', () => {
    const entries = classifyAnalysisEntries([
      { bestEval: -66, playedMate: -1 },
      { bestMate: 1, playedMate: 0 },
      { bestMate: 3, playedMate: 5 },
      { bestMate: 3, playedEval: 0 },
      { bestMate: -3, playedMate: -1 },
      { bestMate: -3, playedEval: 0 },
    ])
    expect(entries.map(e => e.classification)).toEqual(['blunder', 'best', 'best', 'blunder', 'best', 'best'])
    expect(entries[1].playedProbability).toBe(1)
    expect(entries[3].dropPct).toBe(50)
    expect(entries.every(e => e.evalDelta === null)).toBe(true)
  })

  it('normalizes raw UCI scores after either player moves, including mate zero', () => {
    expect(evaluationFields({ evalCp: 40, mate: null }, { evalCp: -20, mate: null })).toEqual({ bestEval: 40, bestMate: null, playedEval: 20, playedMate: null })
    const fields = evaluationFields({ evalCp: null, mate: 1 }, { evalCp: null, mate: 0 })
    expect(classifyAnalysisEntries([fields])[0].classification).toBe('best')
    expect(evaluationFields({ evalCp: null, mate: -2 }, { evalCp: null, mate: 1 }).playedMate).toBe(-1)
  })

  // Contextual opponent-error and cache regressions: missed-opportunity.test.js.
})
