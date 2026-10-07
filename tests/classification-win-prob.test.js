import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import { classifyAnalysisEntries, classifyMove, MOVE_CLASSIFICATION } from '../src/lib/classification.js'
import { calculateWinProbability, cpToProbability, moverWinProb } from '../src/lib/evaluation.js'
import { analyzeGame } from '../src/lib/gameAnalysis.js'
import { createStockfishTestEngine } from './helpers/engine.js'

function mirrorSquare(square) {
  return `${square[0]}${9 - Number(square[1])}`
}

function mirrorFen(fen) {
  const [board, side, castling, enPassant, halfmove, fullmove] = fen.split(' ')
  const mirroredBoard = board
    .split('/')
    .reverse()
    .map((rank) => rank.replace(/[prnbqkPRNBQK]/g, (piece) => (
      piece === piece.toLowerCase() ? piece.toUpperCase() : piece.toLowerCase()
    )))
    .join('/')
  const mirroredCastling = castling === '-'
    ? '-'
    : castling.replace(/[KQkq]/g, (right) => ({ K: 'k', Q: 'q', k: 'K', q: 'Q' }[right]))
  const normalizedCastling = mirroredCastling === '-' ? '-' : [...new Set(mirroredCastling.split(''))].join('')
  const mirroredEnPassant = enPassant === '-' ? '-' : mirrorSquare(enPassant)

  return [mirroredBoard, side === 'w' ? 'b' : 'w', normalizedCastling || '-', mirroredEnPassant, halfmove, fullmove].join(' ')
}

function mirrorMove(move) {
  return {
    from: mirrorSquare(move.from),
    to: mirrorSquare(move.to),
    promotion: move.promotion,
  }
}

function buildResponseMap(moves, responses, startingFen) {
  const game = new Chess(startingFen)
  const map = new Map()

  for (const [index, san] of moves.entries()) {
    const fenBefore = game.fen()
    map.set(fenBefore, responses[index].before)
    game.move(san)
    map.set(game.fen(), responses[index].after)
  }

  return map
}

function createAnalyzingEngine(responseMap) {
  return createStockfishTestEngine({
    onAnalyze: ({ fen }) => responseMap.get(fen) ?? { evalCp: null, mate: null },
  })
}

async function analyzeMoves(moves, responseMap, startingFen) {
  const engine = createAnalyzingEngine(responseMap)

  try {
    return await analyzeGame({
      moves,
      session: undefined,
      analyzePosition: (fen) => engine.analyze(fen, 200000, 2),
      analyzePlayedPosition: (fen) => engine.analyze(fen, 200000, 2),
    })
  } finally {
    engine.destroy()
  }
}

describe('win probability classification', () => {
  it('converts mate and cp values into mover probabilities', () => {
    expect(moverWinProb({ mate: 3 })).toBeCloseTo(0.99, 2)
    expect(moverWinProb({ mate: -3 })).toBeCloseTo(0.01, 2)
    expect(moverWinProb({ mate: 0 })).toBeCloseTo(0.99, 2)
    expect(moverWinProb({ evalCp: 0 })).toBeCloseTo(0.5, 5)
    expect(moverWinProb({ evalCp: 500 })).toBeCloseTo(cpToProbability(500), 5)
  })

  it('throws when the drop is not finite', () => {
    expect(() => classifyMove({})).toThrow('dropPct must be a finite number')
    expect(() => classifyMove({ evalDelta: 500 })).toThrow('dropPct must be a finite number')
    expect(() => classifyMove({ dropPct: Number.NaN })).toThrow('dropPct must be a finite number')
  })

  it('reports unknown drop and category when both evaluations are missing', () => {
    const [entry] = classifyAnalysisEntries([
      { bestEval: null, bestMate: null, playedEval: null, playedMate: null, isBookMove: false },
    ])

    expect(entry.dropPct).toBeNull()
    expect(entry.classification).toBe('unclassified')
  })

  it.skip('keeps white/black symmetry on a mirrored move pair analyzed with the shared Stockfish helper', async () => {
    // TODO: analyzeGame starts from the standard initial position only; add a custom-start FEN path before re-enabling.
    const originalMoves = ['e4', 'e5', 'Nf3', 'Nc6']
    const originalEvaluations = [
      { before: { evalCp: 20, mate: null }, after: { evalCp: 18, mate: null } },
      { before: { evalCp: 35, mate: null }, after: { evalCp: 15, mate: null } },
      { before: { evalCp: 30, mate: null }, after: { evalCp: 24, mate: null } },
      { before: { evalCp: 60, mate: null }, after: { evalCp: 10, mate: null } },
    ]

    const originalGame = new Chess()
    const originalMovesPlayed = []
    for (const san of originalMoves) {
      originalMovesPlayed.push(originalGame.move(san))
    }

    const mirroredMoves = originalMovesPlayed.map((move) => mirrorMove(move))
    const mirroredGame = new Chess(mirrorFen(new Chess().fen()))
    const mirroredSan = mirroredMoves.map((move) => mirroredGame.move(move).san)

    const mirroredEvaluations = originalEvaluations
    const originalMap = buildResponseMap(originalMoves, originalEvaluations)
    const mirroredMap = buildResponseMap(mirroredSan, mirroredEvaluations, mirrorFen(new Chess().fen()))

    const originalEntries = await analyzeMoves(originalMoves, originalMap)
    const mirroredEntries = await analyzeMoves(mirroredSan, mirroredMap, mirrorFen(new Chess().fen()))

    expect(originalEntries.map((entry) => entry.classification)).toEqual(mirroredEntries.map((entry) => entry.classification))
    expect(Math.abs(originalEntries[3].dropPct - mirroredEntries[3].dropPct)).toBeLessThanOrEqual(1.5)
    expect(originalEntries[1].bestEval).toBeGreaterThan(0)
  })

  it('keeps the final mating move at zero drop and reports the engine mate on the final position', async () => {
    const moves = ['f3', 'e5', 'g4', 'Qh4#']
    const game = new Chess()
    for (const san of moves) game.move(san)

    const finalFen = game.fen()
    const responseMap = new Map([
      [new Chess().fen(), { evalCp: 0, mate: null }],
      [game.history().length ? finalFen : finalFen, { evalCp: null, mate: 0 }],
    ])

    const engine = createAnalyzingEngine(responseMap)
    try {
      const finalAnalysis = await engine.analyze(finalFen, 200000, 2)
      expect(finalAnalysis).toMatchObject({ evalCp: null, mate: 0 })

      const entries = await analyzeGame({
        moves,
        analyzePosition: (fen) => engine.analyze(fen, 200000, 2),
        analyzePlayedPosition: (fen) => engine.analyze(fen, 200000, 2),
      })
      const lastEntry = entries.at(-1)

      expect(lastEntry.playedMate).toBe(0)
      expect(lastEntry.dropPct).toBe(0)
      expect(lastEntry.classification).not.toBe('mistake')
      expect(lastEntry.classification).not.toBe('blunder')
    } finally {
      engine.destroy()
    }
  }, 60000)

  it('classifies common labels by loss alone; context labels use a separate pass', () => {
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
})
