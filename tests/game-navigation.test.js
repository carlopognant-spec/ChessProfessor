import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import { captureGameSnapshot, replayGame, restoreGameSnapshot } from '../src/lib/gameNavigation.js'
import { getButtonNavigationTarget } from '../src/lib/analysisPresentation.js'

describe('game navigation and chat snapshots', () => {
  const baseFen = new Chess().fen()

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
