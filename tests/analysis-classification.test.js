import { describe, expect, it } from 'vitest'
import { classifyAnalysisEntries } from '../src/lib/classification.js'

describe('analysis classification', () => {
  it('adds classification from played and best win-probability drops', () => {
    const entries = classifyAnalysisEntries([
      { bestEval: 80, playedEval: 40, isBookMove: false },
      { bestEval: 20, playedEval: 20, isBookMove: true },
    ])

    expect(entries.map((entry) => entry.classification)).toEqual(['excellent', 'book'])
    expect(entries[0].evalDelta).toBe(-40)
    expect(entries[0].dropPct).toBeGreaterThan(0)
  })

  it('keeps dropPct at zero when both evaluations are missing', () => {
    const [entry] = classifyAnalysisEntries([
      { bestEval: null, bestMate: null, playedEval: null, playedMate: null, isBookMove: false },
    ])

    expect(entry.dropPct).toBe(0)
    expect(entry.classification).toBe('best')
  })

  it.todo('carries opponent error context into the next move for missed opportunities (Point 3)')
})
