import { Chess } from 'chess.js'

export function replayGame(baseFen, moves = []) {
  const game = new Chess(baseFen)
  for (const san of moves) game.move(san)
  return game
}

export function captureGameSnapshot(game, baseFen, timeline) {
  return {
    baseFen,
    fen: game.fen(),
    moveHistorySan: game.history(),
    navigationHistorySan: [...timeline],
  }
}

export function restoreGameSnapshot(snapshot) {
  // Replaying preserves chess.js history, so a move after undo retains its prefix.
  return replayGame(snapshot.baseFen, snapshot.moveHistorySan)
}
