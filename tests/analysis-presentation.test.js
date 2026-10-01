import { describe, expect, it } from 'vitest'
import { buildEngineArrows, buildMoveNavigation, getKeyboardNavigationTarget } from '../src/lib/analysisPresentation.js'

describe('analysis presentation', () => {
  it('builds distinct arrows for the best MultiPV lines', () => {
    expect(buildEngineArrows([
      { multipv: 1, pv: ['e2e4', 'e7e5'] },
      { multipv: 2, pv: ['d2d4', 'd7d5'] },
      { multipv: 3, pv: ['c2c4', 'e7e5'] },
    ])).toEqual([
      { startSquare: 'e2', endSquare: 'e4', color: '#C96B4B' },
      { startSquare: 'd2', endSquare: 'd4', color: '#D8A24A' },
      { startSquare: 'c2', endSquare: 'c4', color: '#6B9E78' },
    ])
  })

  it('creates one clickable target for every analyzed half-move', () => {
    expect(buildMoveNavigation(['e4', 'e5', 'Nf3'])).toEqual([
      { ply: 1, moveNumber: 1, side: 'w', san: 'e4', moves: ['e4'] },
      { ply: 2, moveNumber: 1, side: 'b', san: 'e5', moves: ['e4', 'e5'] },
      { ply: 3, moveNumber: 2, side: 'w', san: 'Nf3', moves: ['e4', 'e5', 'Nf3'] },
    ])
  })

  it('moves one half-move with keyboard navigation and clamps at both ends', () => {
    const timeline = ['e4', 'e5', 'Nf3']
    expect(getKeyboardNavigationTarget('ArrowLeft', 0, timeline)).toEqual([])
    expect(getKeyboardNavigationTarget('ArrowLeft', 2, timeline)).toEqual(['e4'])
    expect(getKeyboardNavigationTarget('ArrowRight', 1, timeline)).toEqual(['e4', 'e5'])
    expect(getKeyboardNavigationTarget('ArrowRight', 3, timeline)).toEqual(['e4', 'e5', 'Nf3'])
    expect(getKeyboardNavigationTarget('ArrowUp', 1, timeline)).toBeNull()
  })
})