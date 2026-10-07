import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import { captureGameSnapshot, replayGame, restoreGameSnapshot } from '../src/lib/gameNavigation.js'
import { getButtonNavigationTarget, buildMoveNavigation, resolveAnalysisEntryForPosition } from '../src/lib/analysisPresentation.js'

describe('game navigation and chat snapshots', () => {
  const baseFen = new Chess().fen()

  it('uses the displayed ply for chat and rejects another continuation or the initial position', () => {
    const moves = ['e4', 'e5']
    const first = { ply: 1, fenAfter: replayGame(baseFen, ['e4']).fen(), playedMove: 'e4', moveHistorySan: [], classification: 'mistake' }
    const last = { ply: 2, fenAfter: replayGame(baseFen, moves).fen(), playedMove: 'e5', moveHistorySan: ['e4'] }
    expect(resolveAnalysisEntryForPosition(first.fenAfter, ['e4'], [first, last])).toBe(first)
    expect(resolveAnalysisEntryForPosition(baseFen, [], [first, last])).toBeNull()
    expect(resolveAnalysisEntryForPosition(last.fenAfter, ['d4', 'e5'], [first, last])).toBeNull()
  })

  it('labels a custom black start using its original move counter', () => {
    const base = replayGame(baseFen, ['d4']).fen().replace(/ 1$/, ' 17')
    expect(buildMoveNavigation(['d5', 'c4', 'e6'], base).map(({ side, moveNumber }) => ({ side, moveNumber }))).toEqual([
      { side: 'b', moveNumber: 17 }, { side: 'w', moveNumber: 18 }, { side: 'b', moveNumber: 18 },
    ])
  })

  it('replays a prefix and replaces the continuation when a different move is played', () => {
    const timeline = ['e4', 'e5', 'Nf3', 'Nc6']
    const game = replayGame(baseFen, getButtonNavigationTarget('previous', 4, timeline))
    game.move('d6')
    expect(game.history()).toEqual(['e4', 'e5', 'Nf3', 'd6'])
    expect(game.history()).not.toContain('Nc6')
    expect(replayGame(baseFen, getButtonNavigationTarget('first', 4, timeline)).fen()).toBe(baseFen)
    expect(replayGame(baseFen, getButtonNavigationTarget('last', 0, timeline)).history()).toEqual(timeline)
  })

  it('restores the full pre-chat continuation and history for a move after undo', () => {
    const timeline = ['e4', 'e5', 'Nf3', 'Nc6']
    const game = replayGame(baseFen, timeline.slice(0, 2))
    const snapshot = captureGameSnapshot(game, baseFen, timeline)
    game.move('Bc4')
    timeline.push('Bb5')
    const restored = restoreGameSnapshot(snapshot)
    expect(restored.fen()).toBe(snapshot.fen)
    expect(restored.history()).toEqual(['e4', 'e5'])
    expect(snapshot.navigationHistorySan).toEqual(['e4', 'e5', 'Nf3', 'Nc6'])
    restored.move('d4')
    expect(restored.history()).toEqual(['e4', 'e5', 'd4'])
  })

  it('keeps a custom starting FEN, including its black turn and move counters', () => {
    const base = replayGame(baseFen, ['d4']).fen()
    const game = replayGame(base, ['d5', 'c4'])
    const snapshot = captureGameSnapshot(game, base, game.history())
    expect(replayGame(base, []).fen()).toBe(base)
    expect(restoreGameSnapshot(snapshot).fen()).toBe(game.fen())
    expect(restoreGameSnapshot(snapshot).history()).toEqual(['d5', 'c4'])
  })
})
