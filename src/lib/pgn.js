import { Chess } from 'chess.js'

export function parsePgnMoves(pgn = '') {
  if (typeof pgn !== 'string' || !pgn.trim()) return []

  try {
    const game = new Chess()
    game.loadPgn(pgn)
    return game.history()
  } catch {
    return []
  }
}
