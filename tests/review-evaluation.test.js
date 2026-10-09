import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { classifyReviewedMove, applyMoveFacts, formatEvaluationEvidence } from '../src/lib/reviewEvaluation.js'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'
import { buildAnalysisSummary, analyzeGame } from '../src/lib/gameAnalysis.js'
import { resolveMoveReview } from '../src/lib/analysisPresentation.js'

function example() {
  const game = new Chess(), fenBefore = game.fen()
  game.move('e4')
  const line = (multipv, depth, evalCp, pv) => ({ multipv, depth, evalCp, mate: null, pv })
  const latest = [line(1, 11, 500, ['d2d4', 'd7d5']), line(2, 10, -100, ['e2e4', 'e7e5'])]
  const completed = [line(1, 10, 100, ['d2d4', 'd7d5']), line(2, 10, -100, ['e2e4', 'e7e5'])]
  const child = line(1, 12, 100, ['e7e5', 'g1f3'])
  return { fenBefore, fenAfter: game.fen(), playedMove: 'e4', ply: 1, side: 'w',
    engine: { ...latest[0], fen: fenBefore, lines: latest, specialLines: completed, analysisMetadata: { multiPv: 2 } },
    playedEngine: { ...child, fen: game.fen(), lines: [child] } }
}

describe('coherent review evaluation', () => {
  it('compares both scores at the completed depth instead of mixing the latest best score', () => {
    const entry = example(), original = JSON.stringify(entry)
    const result = classifyReviewedMove(entry)
    expect(result).toMatchObject({ bestEval: 100, playedEval: -100, classification: 'mistake',
      evaluationSource: 'root-pv', evaluationEvidence: { source: 'completed-snapshot', status: 'coherent', rootDepth: 10, playedDepth: 10 } })
    expect(JSON.stringify(entry)).toBe(original)
  })

  it('uses the returned bestmove to align the snapshot, arrow and explanation despite an unfinished newer PV1', () => {
    const entry = example()
    entry.engine.bestmove = 'd2d4'
    entry.engine.lines[0].pv = ['g1f3', 'g8f6']
    entry.engine.pv = ['g1f3', 'g8f6']
    const result = { ...classifyReviewedMove(entry), moveHistorySan: [] }
    expect(result).toMatchObject({ bestUci: 'd2d4', comparisonPv: ['d2d4', 'd7d5'],
      evaluationEvidence: { source: 'completed-snapshot' } })
    expect(resolveMoveReview(entry.fenAfter, ['e4'], [result]).bestMove).toBe('d2d4')
  })

  it.each([
    ['incomplete', e => e.engine.specialLines.pop()],
    ['mixed depth', e => e.engine.specialLines[1].depth++],
    ['duplicate', e => { e.engine.specialLines[1].pv = [...e.engine.specialLines[0].pv] }],
    ['bound', e => { e.engine.specialLines[1].raw = 'info score cp -100 upperbound' }],
    ['illegal continuation', e => e.engine.specialLines[1].pv.push('a1a8')],
    ['rank order', e => { e.engine.specialLines[1].evalCp = 200 }],
    ['different first choice', e => { e.engine.specialLines[0].pv = ['g1f3', 'g8f6'] }],
  ])('rejects a %s snapshot and identifies the fallback', (_name, mutate) => {
    const entry = example(); mutate(entry)
    expect(classifyReviewedMove(entry)).toMatchObject({ bestEval: 500, playedEval: -100,
      evaluationEvidence: { snapshotUsed: false, status: 'independent' } })
  })

  it('rejects ambiguous same-depth legacy roots rather than selecting the first duplicate', () => {
    const entry = example(); delete entry.engine.specialLines
    entry.engine.lines[1].depth = 11
    entry.engine.lines.push({ ...entry.engine.lines[1], evalCp: 400 })
    expect(classifyReviewedMove(entry)).toMatchObject({ playedEval: -100,
      evaluationEvidence: { status: 'independent', source: 'independent-position' } })
  })

  it('uses an exact legacy pair at the same depth', () => {
    const entry = example(); delete entry.engine.specialLines
    entry.engine.lines[1].depth = 11
    expect(classifyReviewedMove(entry).evaluationEvidence).toMatchObject({ status: 'coherent', source: 'legacy-root-pair' })
  })

  it('normalizes a black move without changing the comparison sign', () => {
    const game = new Chess(); game.move('e4')
    const fenBefore = game.fen(); game.move('e5')
    const root = [{ multipv: 1, depth: 10, evalCp: 100, mate: null, pv: ['c7c5', 'g1f3'] },
      { multipv: 2, depth: 10, evalCp: -100, mate: null, pv: ['e7e5', 'g1f3'] }]
    const entry = { fenBefore, fenAfter: game.fen(), playedMove: 'e5', engine: { ...root[0], lines: root },
      playedEngine: { evalCp: 100, mate: null, pv: ['g1f3'] } }
    expect(classifyReviewedMove(entry).dropPct).toBeCloseTo(classifyReviewedMove(example()).dropPct)
  })

  it('marks a negative independent loss as conflicting, without claiming a better-than-best move', () => {
    const entry = example(); entry.engine.specialLines = []
    entry.playedEngine.evalCp = -900; entry.playedEngine.lines[0].evalCp = -900
    const result = classifyReviewedMove(entry)
    expect(result).toMatchObject({ classification: 'excellent', dropPct: 0, evaluationEvidence: { status: 'conflicting' } })
    expect(result.evaluationEvidence.unclampedDropPct).toBeLessThan(0)
    expect(formatEvaluationEvidence(result)).toContain('provvisoria')
  })

  it('preserves zero loss for the selected best move even when the child estimate differs', () => {
    const entry = example(), game = new Chess(entry.fenBefore); game.move('d4')
    entry.playedMove = 'd4'; entry.fenAfter = game.fen()
    entry.playedEngine.fen = entry.fenAfter
    entry.playedEngine.lines[0].pv = ['d7d5']; entry.playedEngine.pv = ['d7d5']
    expect(classifyReviewedMove(entry)).toMatchObject({ classification: 'best', dropPct: 0, playedEval: 100 })
  })

  it('does not use bounded or wrong-position child scores when no root pair is available', () => {
    for (const mutate of [e => { e.playedEngine.lines[0].bound = true }, e => { e.playedEngine.fen = e.fenBefore }]) {
      const entry = example(); entry.engine.specialLines = []; mutate(entry)
      expect(classifyReviewedMove(entry)).toMatchObject({ classification: 'unclassified', dropPct: null,
        evaluationEvidence: { status: 'unavailable' } })
    }
  })

  it('recognizes delivered mate even when the engine has no scores or PV', () => {
    const game = new Chess(); for (const san of ['f3', 'e5', 'g4']) game.move(san)
    const fenBefore = game.fen(); game.move('Qh4#')
    expect(classifyReviewedMove({ fenBefore, fenAfter: game.fen(), playedMove: 'Qh4#',
      engine: {}, playedEngine: {} })).toMatchObject({ classification: 'best', playedMate: 0, dropPct: 0,
      evaluationEvidence: { status: 'terminal' } })
  })

  it('keeps book presence and numerical quality as separate facts', () => {
    expect(classifyReviewedMove({ ...example(), isBookMove: true })).toMatchObject({
      classification: 'book', numericalClassification: 'mistake', moveFacts: { book: true, forced: false } })
  })

  it('migrates old archives identically to live analysis, without extra searches', async () => {
    const fenBefore = 'r4k2/p4Q1p/R7/1p6/1P2b1P1/P1B4P/2P5/3R2K1 b - - 0 26'
    const game = new Chess(fenBefore); game.move('Kxf7')
    const entry = { fenBefore, fenAfter: game.fen(), playedMove: 'Kxf7', side: 'b', ply: 1,
      classification: 'best', engine: { evalCp: -925, mate: null }, playedEngine: { evalCp: 925, mate: null } }
    const original = JSON.stringify(entry)
    const migrated = reclassifyReviewedMoves([entry])
    expect(migrated[0]).toMatchObject({ classification: 'forced', numericalClassification: 'best', moveFacts: { forced: true, legalMoves: 1 } })
    expect(reclassifyReviewedMoves(migrated)).toEqual(migrated)
    expect(JSON.stringify(entry)).toBe(original)
    let calls = 0
    const live = await analyzeGame({ baseFen: fenBefore, moves: ['Kxf7'], openingBook: { hasPosition: () => false },
      analyzePosition: async () => { calls++; return entry.engine },
      analyzePlayedPosition: async () => { calls++; return entry.playedEngine } })
    expect(calls).toBe(2)
    expect(live[0].classification).toBe('forced')
    expect(live[0].evaluationEvidence).toEqual(migrated[0].evaluationEvidence)
    expect(buildAnalysisSummary(live).bySide.black.forced).toBe(1)
    expect(applyMoveFacts(classifyReviewedMove(example())).classification).not.toBe('forced')
  })
})
