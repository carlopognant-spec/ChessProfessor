import { describe, expect, it } from 'vitest'
import { buildEngineArrows, buildMoveNavigation } from '../src/lib/analysisPresentation.js'

describe('analysis presentation', () => {
  it('builds distinct arrows for the best MultiPV lines', () => {
    expect(buildEngineArrows([
      { multipv: 1, pv: ['e2e4', 'e7e5'] },
      { multipv: 2, pv: ['d2d4', 'd7d5'] },
      { multipv: 3, pv: ['c2c4', 'e7e5'] },
    ])).toEqual([
      ['e2', 'e4', '#C96B4B'],
      ['d2', 'd4', '#D8A24A'],
      ['c2', 'c4', '#6B9E78'],
    ])
  })

  it('creates one clickable target for every analyzed half-move', () => {
    expect(buildMoveNavigation(['e4', 'e5', 'Nf3'])).toEqual([
      { ply: 1, moveNumber: 1, side: 'w', san: 'e4', moves: ['e4'] },
      { ply: 2, moveNumber: 1, side: 'b', san: 'e5', moves: ['e4', 'e5'] },
      { ply: 3, moveNumber: 2, side: 'w', san: 'Nf3', moves: ['e4', 'e5', 'Nf3'] },
    ])
  })
})