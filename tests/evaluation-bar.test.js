import { describe, expect, it } from 'vitest'
import { evaluationBarState } from '../src/lib/evaluationBar.js'

describe('evaluation bar orientation, with white-positive scores', () => {
  const fen = '8/8/8/8/8/8/8/8 w - - 0 1'
  it.each([0, 250, -250, 3000, -3000])('rotates colors without changing %i cp', evalCp => {
    const white = evaluationBarState({ evalCp }, fen, 'white')
    const black = evaluationBarState({ evalCp }, fen, 'black')
    expect(white.bottomPercent + black.bottomPercent).toBe(100)
    expect(white.score).toBe((evalCp / 100).toFixed(1))
    expect(black.score).toBe(white.score)
    expect(white.bottomPercent).toBeGreaterThanOrEqual(0)
    expect(white.bottomPercent).toBeLessThanOrEqual(100)
  })
  it.each([3, -3])('keeps the mate sign %i', mate => {
    expect(evaluationBarState({ mate }, fen, 'white').bottomPercent).toBe(mate > 0 ? 100 : 0)
    expect(evaluationBarState({ mate }, fen, 'black').bottomPercent).toBe(mate > 0 ? 0 : 100)
    expect(evaluationBarState({ mate }, fen, 'black').score).toBe(`${mate < 0 ? '-' : ''}M3`)
  })
  it('resolves actual checkmate from the side to move', () => {
    expect(evaluationBarState({ mate: 0 }, fen, 'black').bottomPercent).toBe(100)
    expect(evaluationBarState({ mate: 0 }, fen, 'black').score).toBe('-M0')
    expect(evaluationBarState({ mate: 0 }, fen.replace(' w ', ' b '), 'white').bottomPercent).toBe(100)
    expect(evaluationBarState({ mate: 0 }, fen.replace(' w ', ' b '), 'white').score).toBe('M0')
  })
})
