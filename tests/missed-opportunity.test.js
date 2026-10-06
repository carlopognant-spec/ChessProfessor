import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import { classifyMissedOpportunity } from '../src/lib/missedOpportunity.js'
import { analyzeGame, createGameAnalysisSession } from '../src/lib/gameAnalysis.js'
import { createOpeningBook } from '../src/lib/openingBook.js'

function opportunity(side = 'b') {
  const game = new Chess()
  if (side === 'w') game.move('e4')
  const fenBefore = game.fen()
  const previousMove = side === 'b' ? 'f3' : 'f6'
  game.move(previousMove)
  const currentFen = game.fen()
  const pv = side === 'b' ? ['b8c6', 'e2e4'] : ['d2d4', 'e7e5']
  return {
    previous: { fenBefore, fenAfter: currentFen, playedMove: previousMove, classification: 'blunder', bestProbability: 0.5, playedProbability: 0.2 },
    entry: { fenBefore: currentFen, classification: 'blunder', bestProbability: 0.8, playedProbability: 0.5, playedUci: side === 'b' ? 'e7e5' : 'g1f3', engine: { pv } },
  }
}

describe('missed winning opportunity', () => {
  it.each(['w', 'b'])('requires an adjacent opponent error and a legal alternative for %s', side => {
    const { entry, previous } = opportunity(side)
    const result = classifyMissedOpportunity(entry, previous)
    expect(result.classification).toBe('missed')
    expect(result.baseClassification).toBe('blunder')
    expect(result.missedOpportunity.alternative.san).toEqual(side === 'b' ? ['Nc6', 'e4'] : ['d4', 'e5'])
    expect(result.missedOpportunity.beforeProbability).toBe(0.5)
  })

  it('checks inclusive opportunity and non-winning boundaries', () => {
    const { entry, previous } = opportunity()
    const current = { ...entry, bestProbability: 0.75, playedProbability: 0.6 }
    const prior = { ...previous, bestProbability: 0.4, playedProbability: 0.25 }
    expect(classifyMissedOpportunity(current, prior).classification).toBe('missed')
    expect(classifyMissedOpportunity({ ...current, bestProbability: 0.74999 }, prior).classification).toBe('blunder')
    expect(classifyMissedOpportunity({ ...current, playedProbability: 0.60001 }, prior).classification).toBe('blunder')
    expect(classifyMissedOpportunity(current, { ...prior, playedProbability: 0.25001 }).classification).toBe('blunder')
  })

  it('rejects absent context, an old error, retained wins, already-winning positions and missing scores', () => {
    const { entry, previous } = opportunity()
    for (const [current, prior] of [
      [entry, null], [entry, { ...previous, classification: 'good' }],
      [entry, { ...previous, fenAfter: new Chess().fen() }],
      [entry, { ...previous, bestProbability: 0.2 }],
      [entry, { ...previous, playedProbability: 0.4 }],
      [{ ...entry, playedProbability: 0.8 }, previous],
      [{ ...entry, bestProbability: null }, previous],
      [entry, { ...previous, playedProbability: NaN }],
    ]) expect(classifyMissedOpportunity(current, prior).classification).toBe('blunder')
  })

  it('preserves book, missing-score and delivered-mate categories', () => {
    const { entry, previous } = opportunity()
    for (const current of [
      { ...entry, classification: 'book', isBookMove: true },
      { ...entry, classification: 'unclassified' },
      { ...entry, classification: 'best', playedMate: 0 },
    ]) expect(classifyMissedOpportunity(current, previous).classification).toBe(current.classification)
  })

  it('requires a verified PV distinct from the played move', () => {
    const { entry, previous } = opportunity()
    for (const pv of [[], ['a8a1', 'e2e4'], ['b8c6', 'a1a8'], ['e7e5', 'e2e4'], ['b8c6']]) {
      expect(classifyMissedOpportunity({ ...entry, engine: { pv } }, previous).classification).toBe('blunder')
    }
    expect(classifyMissedOpportunity({ ...entry, playedUci: null }, previous).classification).toBe('blunder')
    expect(classifyMissedOpportunity({ ...entry, playedUci: 'e2e4' }, previous).classification).toBe('blunder')
  })

  it('accepts a one-move PV only when it actually gives checkmate', () => {
    const game = new Chess()
    game.move('f3'); game.move('e5')
    const fenBefore = game.fen()
    game.move('g4')
    const previous = { fenBefore, fenAfter: game.fen(), classification: 'blunder', bestProbability: 0.5, playedProbability: 0 }
    const entry = { fenBefore: game.fen(), classification: 'blunder', bestProbability: 1, playedProbability: 0.5, playedUci: 'b8c6', engine: { pv: ['d8h4'] } }
    expect(classifyMissedOpportunity(entry, previous).missedOpportunity.alternative.san).toEqual(['Qh4#'])
    const stale = { ...classifyMissedOpportunity(entry, previous), missedOpportunity: { stale: true } }
    expect(classifyMissedOpportunity(stale, null)).toMatchObject({ classification: 'blunder', missedOpportunity: null })
  })

  it('recalculates contextual labels on cache hits without caching the previous game context', async () => {
    const session = createGameAnalysisSession()
    const game = new Chess()
    const start = game.fen()
    game.move('f3')
    const afterF3 = game.fen()
    const analyzePosition = async fen => fen === start
      ? { evalCp: 0, mate: null, pv: ['e2e4', 'e7e5'] }
      : fen === afterF3 ? { evalCp: 600, mate: null, pv: ['b8c6', 'e2e4'] }
      : { evalCp: 0, mate: null, pv: [] }
    const options = { moves: ['f3', 'e5'], openingBook: createOpeningBook(), session, analyzePosition, analyzePlayedPosition: analyzePosition }
    const first = await analyzeGame(options)
    expect(first[0].classification).toBe('blunder')
    expect(first[1].classification).toBe('missed')
    const repeated = await analyzeGame(options)
    expect(repeated).toEqual(first)
    const raw = session.get(`analysis:${afterF3}:e5`)
    expect(raw.missedOpportunity).toBeUndefined()
    // Same positions/evaluations, but previous move is protected by book.
    const book = createOpeningBook([afterF3])
    const differentContext = await analyzeGame({ ...options, openingBook: book })
    expect(differentContext[0].classification).toBe('book')
    expect(differentContext[1].classification).toBe('blunder')
    expect(differentContext[1].missedOpportunity).toBeNull()
  })
})
