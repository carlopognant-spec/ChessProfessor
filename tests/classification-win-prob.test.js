import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import { classifyMove, MOVE_CLASSIFICATION } from '../src/lib/classification.js'
import { classifyAnalysisEntries } from '../src/lib/classification.js'
import { calculateWinProbability, cpToProbability, moverWinProb } from '../src/lib/evaluation.js'

function buildRealEntries(moves, evaluations, startingFen = undefined) {
  const game = new Chess(startingFen)

  return moves.map((san, index) => {
    const fenBefore = game.fen()
    const position = evaluations[index]
    game.move(san)

    return {
      side: fenBefore.includes(' w ') ? 'w' : 'b',
      bestEval: position.bestEval,
      bestMate: position.bestMate ?? null,
      playedEval: position.playedEval,
      playedMate: position.playedMate ?? null,
      isBookMove: false,
      ply: index + 1,
      fenBefore,
      playedMove: san,
    }
  })
}

describe('win probability classification', () => {
  it('converts mate and cp values into mover probabilities', () => {
    expect(moverWinProb({ mate: 3 })).toBeCloseTo(0.99, 2)
    expect(moverWinProb({ mate: -3 })).toBeCloseTo(0.01, 2)
    expect(moverWinProb({ mate: 0 })).toBeCloseTo(0.99, 2)
    expect(moverWinProb({ evalCp: 0 })).toBeCloseTo(0.5, 5)
    expect(moverWinProb({ evalCp: 500 })).toBeCloseTo(cpToProbability(500), 5)
  })

  it('measures the loss in win probability from the mover perspective and never produces negative drops', () => {
    const bestP = moverWinProb({ mate: 3 })
    const playedP = moverWinProb({ mate: 5 })
    const dropPct = Math.max(0, (bestP - playedP) * 100)

    expect(bestP).toBeCloseTo(0.99, 2)
    expect(playedP).toBeCloseTo(0.99, 2)
    expect(dropPct).toBe(0)

    const cpPlayed500 = moverWinProb({ evalCp: 500 })
    const cpDrop500 = Math.max(0, (bestP - cpPlayed500) * 100)
    expect(cpDrop500).toBeCloseTo(21.27, 1)

    const cpPlayed100 = moverWinProb({ evalCp: 100 })
    const cpDrop100 = Math.max(0, (bestP - cpPlayed100) * 100)
    expect(cpDrop100).toBeCloseTo(42.8, 1)
  })

  it('keeps white/black symmetry on real positions through mover perspective', () => {
    const startWhite = calculateWinProbability(0, 'white')
    const startBlack = calculateWinProbability(0, 'black')
    expect(startWhite).toBeCloseTo(0.5, 5)
    expect(startBlack).toBeCloseTo(0.5, 5)
    expect(moverWinProb({ evalCp: 100 })).toBeGreaterThan(moverWinProb({ evalCp: -100 }))

    const originalMoves = ['e4', 'e5', 'Nf3', 'Nc6']
    const mirroredMoves = ['e5', 'e4', 'Nf6', 'Nc3']
    const evaluations = [
      { bestEval: 40, playedEval: 20 },
      { bestEval: 35, playedEval: 25 },
      { bestEval: 30, playedEval: 10 },
      { bestEval: 20, playedEval: 0 },
    ]

    const original = classifyAnalysisEntries(buildRealEntries(originalMoves, evaluations))
    const mirrored = classifyAnalysisEntries(buildRealEntries(mirroredMoves, evaluations, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1'))

    expect(original.map((entry) => entry.classification)).toEqual(mirrored.map((entry) => entry.classification))
    expect(original.map((entry) => entry.dropPct)).toEqual(mirrored.map((entry) => entry.dropPct))
  })

  it('classifies by the maximum drop threshold and keeps brilliant/great/missed disabled', () => {
    const thresholds = {
      best: 1,
      excellent: 3,
      good: 6,
      inaccuracy: 10,
      mistake: 20,
      blunder: 100,
    }

    expect(classifyMove({ dropPct: 0.5, thresholds })).toBe(MOVE_CLASSIFICATION.best)
    expect(classifyMove({ dropPct: 3, thresholds })).toBe(MOVE_CLASSIFICATION.excellent)
    expect(classifyMove({ dropPct: 6, thresholds })).toBe(MOVE_CLASSIFICATION.good)
    expect(classifyMove({ dropPct: 10, thresholds })).toBe(MOVE_CLASSIFICATION.inaccuracy)
    expect(classifyMove({ dropPct: 20, thresholds })).toBe(MOVE_CLASSIFICATION.mistake)
    expect(classifyMove({ dropPct: 25, thresholds })).toBe(MOVE_CLASSIFICATION.blunder)
    expect(classifyMove({ dropPct: 0.5, thresholds, isBookMove: true })).toBe(MOVE_CLASSIFICATION.book)
  })

  it('throws when the drop is not finite', () => {
    expect(() => classifyMove({})).toThrow('dropPct must be a finite number')
    expect(() => classifyMove({ evalDelta: 500 })).toThrow('dropPct must be a finite number')
    expect(() => classifyMove({ dropPct: Number.NaN })).toThrow('dropPct must be a finite number')
  })

  it('treats missing evaluations as zero drop instead of inventing a probability', () => {
    expect(moverWinProb({ evalCp: null, mate: null })).toBeNull()
  })
})
