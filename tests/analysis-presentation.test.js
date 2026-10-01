import { describe, expect, it } from 'vitest'
import { buildEngineArrowSegments, buildEngineArrows, buildMoveNavigation, getKeyboardNavigationTarget, resolveEngineForFen } from '../src/lib/analysisPresentation.js'

describe('analysis presentation', () => {
  it('resolves engine data for the current fen from analysis entries', () => {
    const startFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
    const beforeEngine = { evalCp: 30, lines: [{ multipv: 1, pv: ['e7e5'] }] }
    const afterEngine = { evalCp: 10, lines: [{ multipv: 1, pv: ['g8f6'] }] }

    expect(resolveEngineForFen(startFen, [{
      fenBefore: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      fenAfter: startFen,
      engine: beforeEngine,
      playedEngine: afterEngine,
    }])).toEqual(afterEngine)

    expect(resolveEngineForFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', [{
      fenBefore: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      fenAfter: startFen,
      engine: beforeEngine,
    }])).toEqual(beforeEngine)
  })

  it('builds distinct arrows for the best MultiPV lines', () => {
    expect(buildEngineArrows([
      { multipv: 1, pv: ['e2e4', 'e7e5'] },
      { multipv: 2, pv: ['d2d4', 'd7d5'] },
      { multipv: 3, pv: ['c2c4', 'e7e5'] },
      { multipv: 4, pv: ['g1f3', 'g8f6'] },
      { multipv: 5, pv: ['b1c3', 'b8c6'] },
    ])).toEqual([
      { startSquare: 'e2', endSquare: 'e4', color: '#C96B4B' },
      { startSquare: 'd2', endSquare: 'd4', color: '#D8A24A' },
      { startSquare: 'c2', endSquare: 'c4', color: '#6B9E78' },
      { startSquare: 'g1', endSquare: 'f3', color: '#5D8AA8' },
      { startSquare: 'b1', endSquare: 'c3', color: '#9B6B9E' },
    ])
  })

  it('creates one clickable target for every analyzed half-move', () => {
    expect(buildMoveNavigation(['e4', 'e5', 'Nf3'])).toEqual([
      { ply: 1, moveNumber: 1, side: 'w', san: 'e4', moves: ['e4'] },
      { ply: 2, moveNumber: 1, side: 'b', san: 'e5', moves: ['e4', 'e5'] },
      { ply: 3, moveNumber: 2, side: 'w', san: 'Nf3', moves: ['e4', 'e5', 'Nf3'] },
    ])
  })

  it('converts engine arrows into visible board coordinates', () => {
    expect(buildEngineArrowSegments([
      { startSquare: 'e2', endSquare: 'e4', color: '#C96B4B' },
    ])).toEqual([{
      startSquare: 'e2',
      endSquare: 'e4',
      color: '#C96B4B',
      x1: 56.25,
      y1: 81.25,
      x2: 56.25,
      y2: 56.25,
      markerId: 'engine-arrow-0',
    }])
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