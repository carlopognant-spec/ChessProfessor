import { Chess } from 'chess.js'

export function replayGame(baseFen, moves = []) {
  const game = new Chess(baseFen)
  for (const san of moves) game.move(san)
  return game
}

export function positionTimeline(game) {
  const history = game.history({ verbose: true })
  return { moves: history.map(move => move.san),
    fens: history.length ? [history[0].before, ...history.map(move => move.after)] : [game.fen()] }
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
