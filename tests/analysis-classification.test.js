import { describe, expect, it } from 'vitest'
import { classifyAnalysisEntries } from '../src/lib/classification.js'

describe('analysis classification', () => {
  it('adds classification from played and best evaluations', () => {
    const entries = classifyAnalysisEntries([
      { bestEval: 80, playedEval: 120, isBookMove: false },
      { bestEval: 20, playedEval: 20, isBookMove: true },
    ])

    expect(entries.map((entry) => entry.classification)).toEqual(['good', 'book'])
    expect(entries[0].evalDelta).toBe(40)
  })

  it('carries opponent error context into the next move', () => {
    const entries = classifyAnalysisEntries([
      { bestEval: 500, playedEval: 0, isBookMove: false },
      { bestEval: 100, playedEval: 100, isBookMove: false, missedOpportunity: true },
    ])

    expect(entries[0].classification).toBe('blunder')
    expect(entries[1].classification).toBe('missed')
  })
})
