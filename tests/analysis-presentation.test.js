import { describe, expect, it } from 'vitest'
import { buildEngineArrowSegments, buildEngineArrows, buildMoveNavigation, getButtonNavigationTarget, getKeyboardNavigationTarget, resolveEngineForFen } from '../src/lib/analysisPresentation.js'

describe('analysis presentation', () => {
  it('rejects stale live data and never uses a pre-move engine for a post-move FEN', () => {
    const live = { fen: 'before', lines: [{ pv: ['e2e4'] }] }
    expect(resolveEngineForFen('after', [], live)).toBeNull()
    expect(resolveEngineForFen('before', [], live)).toBe(live)
    expect(resolveEngineForFen('after', [{ fenBefore: 'before', fenAfter: 'after', engine: live }], live)).toBeNull()
  })
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

  it('builds distinct arrows for the best MultiPV lines with a blue primary move and fading secondary lines', () => {
    const arrows = buildEngineArrows([
      { multipv: 1, evalCp: 180, pv: ['e2e4', 'e7e5'] },
      { multipv: 2, evalCp: 120, pv: ['d2d4', 'd7d5'] },
      { multipv: 3, evalCp: 70, pv: ['c2c4', 'e7e5'] },
      { multipv: 4, evalCp: 25, pv: ['g1f3', 'g8f6'] },
      { multipv: 5, evalCp: 10, pv: ['b1c3', 'b8c6'] },
    ])

    expect(arrows[0]).toMatchObject({
      startSquare: 'e2',
      endSquare: 'e4',
      color: '#5A8CFF',
      opacity: expect.any(Number),
      strokeWidth: expect.any(Number),
    })
    expect(arrows[0].color).toBe('#5A8CFF')
    expect(arrows[0].strokeWidth).toBeGreaterThan(arrows[1].strokeWidth)
    expect(arrows[1].strokeWidth).toBeGreaterThan(arrows[2].strokeWidth)
    expect(arrows[2].strokeWidth).toBeGreaterThan(arrows[3].strokeWidth)
    expect(arrows[3].strokeWidth).toBeGreaterThan(arrows[4].strokeWidth)
    expect(arrows[0].opacity).toBeGreaterThan(arrows[1].opacity)
    expect(arrows[1].opacity).toBeGreaterThan(arrows[2].opacity)
    expect(arrows[2].opacity).toBeGreaterThan(arrows[3].opacity)
    expect(arrows[3].opacity).toBeGreaterThan(arrows[4].opacity)
    expect(arrows[4].strokeWidth).toBeLessThan(2)
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

  it('navigates to both ends and uses the same one-ply targets as the keyboard', () => {
    const timeline = ['e4', 'e5', 'Nf3']
    expect(getButtonNavigationTarget('first', 2, timeline)).toEqual([])
    expect(getButtonNavigationTarget('last', 0, timeline)).toEqual(timeline)
    expect(getButtonNavigationTarget('previous', 2, timeline)).toEqual(getKeyboardNavigationTarget('ArrowLeft', 2, timeline))
    expect(getButtonNavigationTarget('next', 1, timeline)).toEqual(getKeyboardNavigationTarget('ArrowRight', 1, timeline))
    expect(getButtonNavigationTarget('previous', 0, timeline)).toEqual([])
    expect(getButtonNavigationTarget('next', 3, timeline)).toEqual(timeline)
    expect(getButtonNavigationTarget('last', 0, [])).toEqual([])
  })
})
