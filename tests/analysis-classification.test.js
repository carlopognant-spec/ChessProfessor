import { describe, expect, it } from 'vitest'
import { classifyAnalysisEntries, evaluationFields } from '../src/lib/classification.js'

describe('analysis classification', () => {
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

  it.todo('carries opponent error context into the next move for missed opportunities (Point 3)')
})
