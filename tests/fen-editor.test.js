import { describe, expect, it } from 'vitest'
import { parseAndValidateFen, setPieceAtFen } from '../src/lib/positionEditor.js'

describe('FEN position editor', () => {
  it('accepts a valid position and preserves FEN fields', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1'
    expect(parseAndValidateFen(fen)).toEqual({ fen })
  })

  it('rejects missing or duplicate kings and pawns on back ranks', () => {
    expect(() => parseAndValidateFen('8/8/8/8/8/8/4K3/4K3 w - - 0 1')).toThrow(/re|king/i)
    expect(() => parseAndValidateFen('4k3/8/8/8/8/8/8/4P2K w - - 0 1')).toThrow(/pedone|pawn/i)
  })

  it('rejects invalid FEN and a position where the non-moving side is in check', () => {
    expect(() => parseAndValidateFen('not a fen')).toThrow(/FEN/i)
    expect(() => parseAndValidateFen('4k3/8/8/8/8/8/4R3/4K3 w - - 0 1')).toThrow(/al tratto|turn|check/i)
  })

  it('places or removes a piece on a board square', () => {
    const start = '8/8/8/8/8/8/8/4K2k w - - 0 1'
    expect(setPieceAtFen(start, 'e2', 'Q')).toContain('4Q3')
    expect(setPieceAtFen(start, 'e1', null)).toContain('8/7k')
  })
})
