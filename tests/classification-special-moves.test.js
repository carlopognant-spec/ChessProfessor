import { Chess } from 'chess.js'
import { expect, it } from 'vitest'
import { playUci } from '../src/lib/analysisHistory.js'
import { validatedAnalysis } from '../src/lib/gameArchive.js'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'
import { replayNumericalDecision } from '../src/lib/classificationDecision.js'
import { buildPracticeCandidates } from '../src/lib/reviewPractice.js'

const castles = 'r3k2r/8/8/8/8/8/8/R3K2R'
const cases = [
  ...['e1g1', 'e1c1'].map(uci => [`${castles} w KQkq - 0 1`, uci]),
  ...['e8g8', 'e8c8'].map(uci => [`${castles} b KQkq - 0 1`, uci]),
  ['7k/8/8/3pP3/8/8/8/K7 w - d6 0 2', 'e5d6'],
  ['7k/8/8/8/3Pp3/8/8/K7 b - d3 0 2', 'e4d3'],
  ...['q', 'r', 'b', 'n'].flatMap(piece => [
    ['7k/P7/8/8/8/8/8/7K w - - 0 1', `a7a8${piece}`],
    ['7k/8/8/8/8/8/p7/7K b - - 0 1', `a2a1${piece}`],
  ]),
]

// Legal moves are real; equal synthetic scores isolate replay and data transport, not engine accuracy.
it.each(cases)('preserves special move %s / %s through review, archive and practice selection', async (fen, uci) => {
  const board = new Chess(fen), fenBefore = board.fen(), side = board.turn()
  const move = playUci(board, uci), fenAfter = board.fen()
  const root = { multipv: 1, depth: 12, evalCp: 0, mate: null, pv: [uci] }
  const history = { initialFen: fenBefore, moves: [] }
  const entry = { ply: 1, fenBefore, fenAfter, playedMove: move.san, playedUci: uci,
    classification: 'blunder', engine: { ...root, fen: fenBefore, lines: [root], history },
    playedEngine: { fen: fenAfter, evalCp: 0, mate: null, history: { ...history, moves: [uci] } } }
  const original = structuredClone(entry)
  const [reviewed] = reclassifyReviewedMoves([entry])
  expect(reviewed).toMatchObject({ playedUci: uci, classification: 'best', numericalClassification: 'best' })
  expect(replayNumericalDecision(reviewed.classificationDecision)).toEqual({ status: 'reproduced', classification: 'best' })
  expect(validatedAnalysis(board.pgn(), [reviewed])).toEqual([reviewed])
  // An old error is only a candidate: exercise grading still requires fresh engine evidence.
  const [candidate] = await buildPracticeCandidates({ pgn: board.pgn(), entries: [entry], side })
  expect(candidate).toMatchObject({ originalUci: uci, originalSan: move.san, fen: fenBefore, history })
  expect(entry).toEqual(original)
})
