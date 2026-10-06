import { describe, expect, it } from 'vitest'
import { compareMateDistance, formatAnalysisScore, formatMateComparison } from '../src/lib/mateComparison.js'
import { classifyAnalysisEntries, moveEvaluationFields } from '../src/lib/classification.js'

describe('mate distance comparison', () => {
  it.each([
    [3, 5, 'root-pv', 'winning', 5, 'delayed'],
    [5, 3, 'root-pv', 'winning', 3, 'accelerated'],
    [-6, -3, 'root-pv', 'losing', 3, 'accelerated'],
    [-3, -6, 'root-pv', 'losing', 6, 'delayed'],
    [3, 2, 'independent-position', 'winning', 3, 'unchanged'],
    [3, 3, 'independent-position', 'winning', 4, 'delayed'],
    [5, 2, 'independent-position', 'winning', 3, 'accelerated'],
    [-3, -3, 'independent-position', 'losing', 3, 'unchanged'],
    [-6, -3, 'independent-position', 'losing', 3, 'accelerated'],
  ])('compares %s and %s from %s on the same starting position', (bestMate, playedMate, evaluationSource, outcome, playedMoves, change) => {
    const entry = { bestMate, playedMate, evaluationSource }
    expect(compareMateDistance(entry)).toEqual({ outcome, change, bestMoves: Math.abs(bestMate), playedMoves, source: evaluationSource })
    const [classified] = classifyAnalysisEntries([entry])
    expect(classified.dropPct).toBe(0)
    expect(classified.classification).toBe('best')
  })

  it('normalizes child mate distances identically for either player making the move', () => {
    for (const playedUci of ['e2e4', 'e7e5']) {
      const fields = moveEvaluationFields({ mate: 3, evalCp: null, pv: [] }, { mate: -2, evalCp: null }, playedUci)
      expect(classifyAnalysisEntries([fields])[0].mateComparison).toMatchObject({ outcome: 'winning', bestMoves: 3, playedMoves: 3, change: 'unchanged' })
    }
  })

  it('does not compare missing, invalid, opposite-result or unknown-origin distances', () => {
    for (const [bestMate, playedMate, evaluationSource] of [
      [null, 3, 'root-pv'], [3, null, 'root-pv'], [Infinity, 3, 'root-pv'],
      [3, NaN, 'root-pv'], [3.5, 3, 'root-pv'], [3, -3, 'root-pv'],
      [-3, 3, 'root-pv'], [0, -3, 'root-pv'], [3, 3, undefined],
    ]) expect(compareMateDistance({ bestMate, playedMate, evaluationSource })).toBeNull()
  })

  it('recognizes delivered mate even without preceding scores and explains estimates', () => {
    const [delivered] = classifyAnalysisEntries([{ playedMate: 0 }])
    expect(delivered.classification).toBe('best')
    expect(formatMateComparison(delivered.mateComparison)).toBe('Matto dato.')
    const comparison = compareMateDistance({ bestMate: -6, playedMate: -3, evaluationSource: 'independent-position' })
    expect(formatMateComparison(comparison)).toBe('Matto subito: 6 → 3 mosse (anticipato). Stime da analisi separate.')
    expect(formatMateComparison(null)).toBe('')
  })

  it('shows mate scores distinctly from missing evaluations', () => {
    expect(formatAnalysisScore(null, 3)).toBe('Matto vincente in 3')
    expect(formatAnalysisScore(null, -3)).toBe('Matto subito in 3')
    expect(formatAnalysisScore(null, 0, { delivered: true })).toBe('Matto dato')
    expect(formatAnalysisScore(null, null)).toBe('Eval n/d')
    expect(formatAnalysisScore(32, null)).toBe('Eval 0.32')
  })
})
