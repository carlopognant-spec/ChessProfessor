import { describe, expect, it } from 'vitest'
import {
  buildAnalysisProgress,
  shouldStopExplorerAtThreshold,
} from '../src/lib/gameAnalysis.js'

describe('game analysis flow', () => {
  it('stops explorer once the position falls below the configured game threshold', () => {
    expect(shouldStopExplorerAtThreshold({ white: 5, black: 4, draws: 0 }, 15)).toBe(true)
    expect(shouldStopExplorerAtThreshold({ white: 20, black: 10, draws: 3 }, 15)).toBe(false)
  })

  it('computes progress as a percentage of total analyzed moves', () => {
    expect(buildAnalysisProgress({ total: 10, current: 4 })).toBe(40)
    expect(buildAnalysisProgress({ total: 0, current: 0 })).toBe(0)
  })
})
