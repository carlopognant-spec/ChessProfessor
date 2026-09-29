import { describe, expect, it } from 'vitest'
import { getPositionFacts } from '../src/lib/positionFacts.js'

describe('verified position facts', () => {
  it('reports pawn structure, king safety, and development facts', () => {
    const facts = getPositionFacts('r3k2r/ppp2ppp/2n5/8/3PP3/2N5/PPP2PPP/R3K2R w KQkq - 0 1')

    expect(facts.pawns.white.count).toBe(8)
    expect(facts.pawns.black.count).toBe(6)
    expect(facts.kings.white.square).toBe('e1')
    expect(facts.kings.black.square).toBe('e8')
    expect(facts.development.white.minorPiecesDeveloped).toBe(1)
    expect(facts.development.black.minorPiecesDeveloped).toBe(1)
    expect(facts.kingSafety.sideToMoveInCheck).toBe(false)
  })
})
