import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'

describe('test infrastructure', () => {
  it('loads chess.js and validates a known legal opening sequence', () => {
    const game = new Chess()

    game.move('e4')
    game.move('e5')
    game.move('Nf3')

    expect(game.history()).toEqual(['e4', 'e5', 'Nf3'])
    expect(game.turn()).toBe('b')
  })
})