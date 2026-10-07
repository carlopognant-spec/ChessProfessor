import { describe, expect, it } from 'vitest'
import {
  buildAnalysisProgress,
  createGameAnalysisSession,
  shouldStopExplorerAtThreshold,
  buildAnalysisSummary,
} from '../src/lib/gameAnalysis.js'

describe('game analysis flow', () => {
  it('stops explorer once the position falls below the configured game threshold', () => {
    expect(shouldStopExplorerAtThreshold({ white: 5, black: 4, draws: 0 }, 15)).toBe(true)
    expect(shouldStopExplorerAtThreshold({ white: 20, black: 10, draws: 3 }, 15)).toBe(false)
    expect(shouldStopExplorerAtThreshold(null, 1)).toBe(true)
  })

  it('computes progress as a percentage of total analyzed moves', () => {
    expect(buildAnalysisProgress({ total: 10, current: 4 })).toBe(40)
    expect(buildAnalysisProgress({ total: 0, current: 0 })).toBe(0)
    expect(buildAnalysisProgress({ total: 10, current: 20 })).toBe(100)
    expect(buildAnalysisProgress({ total: 10, current: -2 })).toBe(0)
  })

  it('evicts the oldest session entry and clears cache plus explorer state', () => {
    const session = createGameAnalysisSession({ maxEntries: 2 })
    session.set('first', { value: 1 })
    session.set('second', { value: 2 })
    session.set('third', { value: 3 })

    expect(session.get('first')).toBeNull()
    expect(session.size()).toBe(2)
    session.stopExplorer()
    expect(session.isExplorerStopped()).toBe(true)
    session.clear()
    expect(session.size()).toBe(0)
    expect(session.isExplorerStopped()).toBe(false)
  })

  it('keeps unknown entries out of category counts without inventing evaluations', () => {
    const summary = buildAnalysisSummary([{ side: 'b', classification: 'mistake' }, {}])
    expect(summary.bySide.black.mistake).toBe(1)
    expect(Object.values(summary.bySide.white).reduce((a, b) => a + b, 0)).toBe(0)
    expect(summary.rows[1].evalCp).toBeUndefined()
  })
})
