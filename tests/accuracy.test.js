import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import { accuracyWinPercent, moveAccuracy, aggregateAccuracy, gameAccuracy } from '../src/lib/accuracy.js'
import { classifyAnalysisEntries } from '../src/lib/classification.js'

function entriesFor(moves, cps, baseFen) {
  const game = new Chess(baseFen)
  return moves.map((playedMove, index) => {
    const fenBefore = game.fen(), side = game.turn()
    game.move(playedMove)
    const fenAfter = game.fen()
    return { ply: index + 1, playedMove, fenBefore, fenAfter,
      engine: { evalCp: (side === 'w' ? 1 : -1) * cps[index], mate: null },
      playedEngine: { evalCp: (game.turn() === 'w' ? 1 : -1) * cps[index + 1], mate: null } }
  })
}

describe('independent public accuracy calculation', () => {
  it('keeps the requested coefficients, score ceiling, perfect improvements and missing data explicit', () => {
    expect(accuracyWinPercent(0)).toBe(50)
    expect(accuracyWinPercent(100)).toBeCloseTo(59.102589719161294, 10)
    expect(accuracyWinPercent(-100)).toBeCloseTo(100 - accuracyWinPercent(100), 12)
    expect(accuracyWinPercent(10000)).toBe(accuracyWinPercent(1000))
    expect(accuracyWinPercent(null)).toBeNull()
    expect(accuracyWinPercent(Infinity)).toBeNull()
    expect(moveAccuracy(50, 60)).toBe(100)
    expect(moveAccuracy(50, 50)).toBe(100)
    expect(moveAccuracy(100, 0)).toBe(0)
    expect(moveAccuracy(null, 50)).toBeNull()
    expect(moveAccuracy(101, 50)).toBeNull()
  })

  it('matches a separately calculated Python golden vector for population volatility and both means', () => {
    const wins = Array.from({ length: 31 }, (_, i) => 50 + 15 * Math.sin(i * 0.7) + i * 0.2)
    const result = aggregateAccuracy(wins)
    expect(result.windowSize).toBe(3)
    expect(result.moves[0].weight).toBeCloseTo(result.moves[1].weight, 12)
    expect(result.moves[0].weight).toBeCloseTo(6.289812300358841, 10)
    expect(result.moves[2].weight).toBeCloseTo(2.224440211042704, 10)
    expect(result.white.value).toBeCloseTo(87.50083637942194, 10)
    expect(result.black.value).toBeCloseTo(84.64375536075997, 10)
  })

  it('uses the source harmonic reciprocal floor for zero accuracy and weight bounds for constant/extreme scores', () => {
    const result = aggregateAccuracy([100, 0])
    expect(result.white).toMatchObject({ weighted: 0, harmonic: 1, value: 0.5, used: 1, total: 1 })
    expect(result.moves[0].weight).toBe(12)
    expect(aggregateAccuracy([50, 50]).moves[0].weight).toBe(0.5)
    expect(result.black.value).toBeNull()
    expect(aggregateAccuracy(Array(101).fill(50)).windowSize).toBe(8)
  })

  it('does not compress missing scores across ply boundaries or invent missing-window weights', () => {
    const result = aggregateAccuracy([50, null, 50, 45])
    expect(result.moves.map(move => move.accuracy)).toEqual([null, null, moveAccuracy(50, 45)])
    expect(result.white.used).toBe(1)
    expect(result.black.value).toBeNull()
    expect(aggregateAccuracy([]).white.value).toBeNull()
  })

  it('takes one actual position trajectory, from playedEngine, and preserves black-start/custom FEN perspectives', () => {
    const entries = entriesFor(['e4', 'e5'], [20, -40, 80])
    entries[1].engine.evalCp = -999 // Independent root search must not replace the preceding actual score.
    const result = gameAccuracy(entries)
    expect(result.moves[0].accuracy).toBeCloseTo(moveAccuracy(accuracyWinPercent(20), accuracyWinPercent(-40)), 12)
    expect(result.moves[1].accuracy).toBeCloseTo(moveAccuracy(100 - accuracyWinPercent(-40), 100 - accuracyWinPercent(80)), 12)
    expect(result.partial).toBe(false)
    const start = new Chess(); start.move('e4')
    const black = gameAccuracy(entriesFor(['c5'], [20, 40], start.fen()))
    expect(black.moves[0].side).toBe('b')
    expect(black.white.value).toBeNull()
    expect(black.black.value).not.toBeNull()
  })

  it('handles mate signs, actual mate given, stalemate, bounds and partial/mismatched chains', () => {
    const entries = entriesFor(['f3', 'e5', 'g4', 'Qh4#'], [0, 0, 0, -500, 0])
    entries[3].playedEngine = {} // Checkmate is exact from the board.
    entries[2].playedEngine = { mate: 1, evalCp: null } // Black to move, winning.
    expect(gameAccuracy(entries).moves[3].accuracy).toBe(100)
    const stale = structuredClone(entries)
    stale[1].fenBefore = new Chess().fen()
    expect(gameAccuracy(stale).partial).toBe(true)
    expect(gameAccuracy(entries.slice(0, 1), { totalPlies: 4 }).partial).toBe(true)
    const bound = entriesFor(['e4'], [20, 30]); bound[0].playedEngine.lowerbound = true
    expect(gameAccuracy(bound).white.value).toBeNull()
    const game = new Chess('7k/5Q2/6K1/8/8/8/8/8 w - - 0 1')
    const draw = entriesFor(['Qe6'], [0, 300], game.fen())
    expect(new Chess(draw[0].fenAfter).isStalemate()).toBe(true)
    expect(gameAccuracy(draw).moves[0].accuracy).toBe(100)
    const lostMate = entriesFor(['e4'], [0, 0]); lostMate[0].playedEngine = { mate: -2, evalCp: null }
    expect(gameAccuracy(lostMate).moves[0].accuracy).toBe(100) // Opponent after the move is losing.
  })

  it('never mutates entries or the classification probability model', () => {
    const entries = entriesFor(['e4'], [20, 0])
    const before = structuredClone(entries)
    const category = classifyAnalysisEntries([{ bestEval: 100, playedEval: 50, isEngineBest: false }])
    gameAccuracy(entries)
    expect(entries).toEqual(before)
    expect(classifyAnalysisEntries([{ bestEval: 100, playedEval: 50, isEngineBest: false }])).toEqual(category)
  })
})
