import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { classifyReviewedMove, formatEvaluationEvidence } from '../src/lib/reviewEvaluation.js'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'
import { classifySpecialMove } from '../src/lib/specialClassification.js'

function example(side = 'w', mate = null) {
  const game = new Chess()
  if (side === 'b') game.move('e4')
  const fenBefore = game.fen(), move = game.move(side === 'w' ? 'e4' : 'e5')
  const best = side === 'w' ? 'd2d4' : 'c7c5', played = move.from + move.to
  const lines = [best, played].map((uci, i) => ({ multipv: i + 1, depth: 15,
    evalCp: mate == null ? 100 : null, mate, pv: [uci] }))
  const child = { multipv: 1, depth: 15, evalCp: mate == null ? -100 : null,
    mate: mate == null ? null : -mate, pv: [side === 'w' ? 'e7e5' : 'g1f3'] }
  return { ply: side === 'w' ? 1 : 2, playedMove: move.san, fenBefore, fenAfter: game.fen(), playedUci: played,
    engine: { ...lines[0], fen: fenBefore, bestmove: best, lines: structuredClone(lines), specialLines: lines,
      analysisMetadata: { multiPv: 2 } }, playedEngine: { ...child, fen: game.fen(), lines: [child] } }
}

describe('review of equally scored best alternatives', () => {
  it.each(['w', 'b'])('recognizes an exact completed CP tie for %s while preserving the engine first choice', side => {
    const entry = example(side), original = JSON.stringify(entry), result = classifyReviewedMove(entry)
    expect(result.classification).toBe('best')
    expect(result.isEngineBest).toBe(false)
    expect(result.bestUci).toBe(entry.engine.bestmove)
    expect(result.evaluationEvidence.equivalentBest).toMatchObject({ kind: 'equal-cp', evalCp: 100 })
    expect(formatEvaluationEvidence(result)).toContain('pari alla prima scelta')
    expect(JSON.stringify(entry)).toBe(original)
  })

  it.each([3, -3])('recognizes the same signed mate %s in a coherent legacy pair', mate => {
    const entry = example('w', mate); delete entry.engine.specialLines
    const result = classifyReviewedMove(entry)
    expect(result).toMatchObject({ classification: 'best', isEngineBest: false,
      evaluationEvidence: { source: 'legacy-root-pair', equivalentBest: { kind: 'equal-mate', mate } } })
  })

  it.each([
    ['a close CP score', e => { e.engine.specialLines[1].evalCp = 99 }],
    ['a legacy CP tie', e => { delete e.engine.specialLines }],
    ['an incomplete CP snapshot', e => { e.engine.specialLines.pop() }],
    ['a bounded pair', e => { e.engine.specialLines[1].bound = true; e.engine.lines[1].bound = true }],
  ])('does not promote %s', (_, mutate) => {
    const entry = example(); mutate(entry)
    const result = classifyReviewedMove(entry)
    expect(result.classification).toBe('excellent')
    expect(result.evaluationEvidence.equivalentBest).toBeNull()
  })

  it.each([3, -3])('does not equate different mate distances or independent estimates for %s', mate => {
    const unequal = example('w', mate)
    unequal.engine.specialLines[1].mate = mate + 1
    expect(classifyReviewedMove(unequal).classification).toBe('excellent')
    const independent = example('w', mate); delete independent.engine.specialLines
    independent.engine.lines[1].depth--
    expect(classifyReviewedMove(independent)).toMatchObject({ classification: 'excellent',
      evaluationEvidence: { status: 'independent', equivalentBest: null } })
  })

  it('preserves book and recomputes old archives idempotently without mutating them', () => {
    expect(classifyReviewedMove({ ...example(), isBookMove: true })).toMatchObject({
      classification: 'book', numericalClassification: 'best' })
    const entry = { ...example(), classification: 'excellent', baseClassification: 'excellent',
      specialAssessment: { version: 'counterfactual-v10' } }
    const original = JSON.stringify(entry), [result] = reclassifyReviewedMoves([entry])
    expect(result.classification).toBe('best')
    expect(result.specialAssessment.version).toBe('counterfactual-v24')
    expect(reclassifyReviewedMoves([result])).toEqual([result])
    expect(JSON.stringify(entry)).toBe(original)
  })

  it('does not turn a tied alternative into an empirical Grande after an unfinished PV1 change', () => {
    const board = new Chess(); board.move('e4')
    const before = board.fen(); board.move('e5')
    const previous = { ply: 2, playedMove: 'e5', playedUci: 'e7e5', fenBefore: before, fenAfter: board.fen(),
      engine: { lines: [{ multipv: 1, depth: 15, evalCp: 500, pv: ['d7d5'] },
        { multipv: 2, depth: 15, evalCp: -300, pv: ['e7e5'] }] },
      playedEngine: { lines: [{ multipv: 1, depth: 15, evalCp: 300, pv: ['g1f3'] }] } }
    const fenBefore = board.fen(); board.move('Nf3')
    const first = { multipv: 1, depth: 15, evalCp: 500, mate: null, pv: ['g1h3'] }
    const second = { ...first, multipv: 2, pv: ['g1f3'] }
    const entry = classifyReviewedMove({ ply: 3, playedMove: 'Nf3', fenBefore, fenAfter: board.fen(),
      engine: { bestmove: 'g1h3', lines: [{ ...second, multipv: 1 }, { ...first, multipv: 2 }],
        specialLines: [first, second], analysisMetadata: { multiPv: 2 } },
      playedEngine: { lines: [{ multipv: 1, depth: 15, evalCp: -500, pv: ['b8c6'] }] } })
    expect(entry.classification).toBe('best')
    expect(classifySpecialMove(entry, classifyReviewedMove(previous)).classification).toBe('best')
  })
})
