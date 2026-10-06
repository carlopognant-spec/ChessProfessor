import { describe, expect, it } from 'vitest'
import { buildAnalysisSummary } from '../src/lib/gameAnalysis.js'
import { MOVE_CLASSIFICATION } from '../src/lib/classification.js'

describe('analysis summary', () => {
  it('returns every category with separate White and Black counts', () => {
    const summary = buildAnalysisSummary([
      { side: 'w', classification: MOVE_CLASSIFICATION.book },
      { side: 'w', classification: MOVE_CLASSIFICATION.blunder },
      { side: 'b', classification: MOVE_CLASSIFICATION.good },
      { side: 'b', classification: MOVE_CLASSIFICATION.unclassified },
    ])

    expect(summary.categories).toHaveLength(11)
    expect(summary.bySide.black.unclassified).toBe(1)
    expect(summary.bySide.white.book).toBe(1)
    expect(summary.bySide.white.blunder).toBe(1)
    expect(summary.bySide.black.good).toBe(1)
    expect(summary.bySide.black.book).toBe(0)
    expect(summary.categories.find((row) => row.key === 'missed').white).toBe(0)
  })

  it('keeps semimove rows for navigation', () => {
    const rows = buildAnalysisSummary([
      { ply: 1, moveNumber: 1, side: 'w', playedMove: 'e4', classification: 'good' },
    ]).rows

    expect(rows).toEqual([
      expect.objectContaining({ ply: 1, label: '1. e4', classification: 'good' }),
    ])
  })

  it('keeps numeric evaluations on each semimove row', () => {
    const rows = buildAnalysisSummary([
      { ply: 1, moveNumber: 1, side: 'w', playedMove: 'e4', playedEval: 32, bestEval: 48 },
    ]).rows

    expect(rows[0]).toMatchObject({ playedEval: 32, bestEval: 48 })
  })
})
