import { describe, expect, it, vi } from 'vitest'
import { createAnalysisCache } from '../src/lib/analysisCache.js'
import {
  buildAnalysisProgress,
  createGameAnalysisSession,
  shouldStopExplorerAtThreshold,
  buildAnalysisSummary,
} from '../src/lib/gameAnalysis.js'

describe('game analysis flow', () => {
  it('retains default session results after 60 seconds until clear', () => {
    vi.useFakeTimers()
    try {
      const session = createGameAnalysisSession()
      session.set('position', { evalCp: 12 })
      vi.advanceTimersByTime(120000)
      expect(session.get('position')).toEqual({ evalCp: 12 })
      session.clear()
      expect(session.get('position')).toBeNull()
      expect(session.size()).toBe(0)
    } finally { vi.useRealTimers() }
  })

  it('updates a full session without evicting another key and evicts empty-string keys normally', () => {
    const cache = new Map()
    const session = createGameAnalysisSession({ cache, maxEntries: 2 })
    session.set('', { value: 1 })
    session.set('second', { value: 2 })
    session.set('second', { value: 3 })
    expect(session.get('')).toEqual({ value: 1 })
    expect(session.size()).toBe(2)
    session.set('third', { value: 4 })
    expect(session.get('')).toBeNull()
    expect(cache.has('')).toBe(false)
    expect(session.get('second')).toEqual({ value: 3 })
    expect(cache.size).toBe(2)
  })

  it('uses injected cache changes and expiration directly without a shadow copy', () => {
    vi.useFakeTimers()
    try {
      const cache = createAnalysisCache()
      const session = createGameAnalysisSession({ cache, maxEntries: 2 })
      session.set('first', { value: 1 })
      cache.set('first', { value: 2 })
      expect(session.get('first')).toEqual({ value: 2 })
      vi.advanceTimersByTime(60001)
      expect(session.get('first')).toBeNull()
      expect(session.size()).toBe(0)
      cache.set('imported', { value: 3 })
      expect(session.get('imported')).toEqual({ value: 3 })
      session.stopExplorer()
      session.clear()
      expect(cache.get('imported')).toBeNull()
      expect(session.isExplorerStopped()).toBe(false)
    } finally { vi.useRealTimers() }
  })

  it('enforces the size limit when reading preloaded injected values', () => {
    const cache = new Map([['a', 1], ['b', 2], ['c', 3]])
    const session = createGameAnalysisSession({ cache, maxEntries: 2 })
    expect(session.get('a')).toBe(1)
    expect(session.get('b')).toBe(2)
    expect(session.get('c')).toBe(3)
    expect(session.size()).toBe(2)
    expect(cache.has('a')).toBe(false)
  })

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
