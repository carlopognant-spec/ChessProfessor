import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { buildEngineArrowSegments, resolveMoveReview } from '../src/lib/analysisPresentation.js'

function entry(san, best, side = 'w', playedScore = 0) {
  const game = new Chess(); if (side === 'b') game.move('e4')
  const fenBefore = game.fen(), move = game.move(san), played = move.from + move.to + (move.promotion ?? '')
  const lines = [{ multipv: 1, depth: 12, evalCp: 100, mate: null, pv: [best] }]
  if (played !== best) lines.push({ multipv: 2, depth: 12, evalCp: playedScore, mate: null, pv: [played] })
  return { ply: 1, fenBefore, fenAfter: game.fen(), playedMove: san, moveHistorySan: [], classification: 'good',
    engine: { fen: fenBefore, lines, specialLines: lines, analysisMetadata: { multiPv: lines.length }, bestmove: best }, playedEngine: { fen: game.fen(), evalCp: -900 } }
}
const review = value => resolveMoveReview(value.fenAfter, [value.playedMove], [value])

describe('played move advice', () => {
  it.each([['Nf3', 'g1f3', 'w'], ['e5', 'e7e5', 'b']])('confirms %s against the root, never against the child score', (san, best, side) => {
    expect(review(entry(san, best, side))).toMatchObject({ playedBest: true, bestMove: null })
  })
  it.each([['e4', 'd2d4', 'w'], ['e5', 'c7c5', 'b']])('keeps a genuinely better alternative for %s from one root perspective', (san, best, side) => {
    expect(review(entry(san, best, side))).toMatchObject({ playedBest: false, bestMove: best, better: true })
  })
  it('does not invent superiority for equivalent or independent evaluations', () => {
    expect(review(entry('e4', 'd2d4', 'w', 100))).toMatchObject({ equivalentBest: true, bestMove: null })
    const independent = entry('e4', 'd2d4'); independent.engine.lines.pop(); independent.engine.specialLines = []
    expect(review(independent)).toMatchObject({ bestMove: 'd2d4', better: false })
  })
  it('rejects stale positions, illegal PVs, bound scores and incomplete last-iteration conflicts', () => {
    for (const mutate of [e => { e.engine.fen = e.fenAfter }, e => { e.playedEngine.fen = e.fenBefore },
      e => { e.playedUci = 'e2e4' },
      e => { e.engine.lines[0].lowerbound = true }, e => { e.engine.bestmove = 'd2d4' },
      e => { e.engine.lines[0].pv = ['g1g8'] }]) {
      const e = entry('Nf3', 'g1f3'); mutate(e)
      expect(review(e)).toMatchObject({ playedBest: false, bestMove: null })
    }
  })
  it('never recommends the same unscored legacy move or confuses promotion choices', () => {
    const legacy = entry('Nf3', 'g1f3')
    delete legacy.engine.lines[0].evalCp
    expect(review(legacy)).toMatchObject({ bestMove: null, playedBest: false, referencePlayed: true })
    const game = new Chess('7k/P7/8/8/8/8/8/K7 w - - 0 1'), fenBefore = game.fen()
    game.move('a8=N')
    const promotion = { ply: 1, fenBefore, fenAfter: game.fen(), playedMove: 'a8=N', moveHistorySan: [], classification: 'good',
      engine: { fen: fenBefore, bestmove: 'a7a8q', lines: [{ multipv: 1, evalCp: 900, pv: ['a7a8q'] }] }, playedEngine: { fen: game.fen() } }
    expect(review(promotion)).toMatchObject({ bestMove: 'a7a8q', playedBest: false })
  })
})

describe('piece-aware arrow geometry', () => {
  it('draws all eight knight directions as perpendicular legs in both orientations', () => {
    const fen = '7k/8/8/8/3N4/8/8/K7 w - - 0 1'
    for (const to of ['b3', 'b5', 'c2', 'c6', 'e2', 'e6', 'f3', 'f5']) {
      const arrow = { startSquare: 'd4', endSquare: to, color: '#81B64C' }
      const [white] = buildEngineArrowSegments([arrow], fen)
      const [black] = buildEngineArrowSegments([arrow], fen, 'black')
      expect(white.bend).toBeTruthy()
      const first = [white.bend.x - white.x1, white.bend.y - white.y1]
      const last = [white.x2 - white.bend.x, white.y2 - white.bend.y]
      expect(first[0] * last[0] + first[1] * last[1]).toBeCloseTo(0)
      expect(black).toMatchObject({ x1: 100 - white.x1, y1: 100 - white.y1, x2: 100 - white.x2, y2: 100 - white.y2,
        bend: { x: 100 - white.bend.x, y: 100 - white.bend.y }, color: arrow.color })
    }
  })
  it('keeps non-knight arrows straight, even when the displacement resembles a knight', () => {
    const [arrow] = buildEngineArrowSegments([{ startSquare: 'd4', endSquare: 'e6' }], '7k/8/8/8/3Q4/8/8/K7 w - - 0 1')
    expect(arrow.bend).toBeUndefined()
  })
})
