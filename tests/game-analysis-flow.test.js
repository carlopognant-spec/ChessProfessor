import { describe, expect, it } from 'vitest'
import {
  buildAnalysisProgress,
  createGameAnalysisSession,
  shouldStopExplorerAtThreshold,
  summarizeAnalysis,
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

  it('summarizes incomplete entries without inventing evaluations', () => {
    expect(summarizeAnalysis([
      { evalCp: 30, mate: null },
      { evalCp: null, mate: 3 },
      {},
    ])).toEqual({ total: 3, evalSum: 30, mateCount: 1 })
  })
})
