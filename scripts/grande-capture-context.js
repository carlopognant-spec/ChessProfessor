import { Chess } from 'chess.js'
import { calculateWinProbability } from '../src/lib/evaluation.js'

const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
function play(game, entry) {
  const uci = entry.uci ?? entry.playedUci
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci ?? '')) throw Error('Invalid UCI')
  const move = game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
  if (game.fen() !== entry.fenAfter) throw Error('FEN mismatch')
  return move
}
function adjacent(previous, current) {
  if (!previous || previous.fenAfter !== current.fenBefore) return null
  try {
    const game = new Chess(previous.fenBefore), move = play(game, previous)
    return move.color !== new Chess(current.fenBefore).turn() ? move : null
  } catch { return null }
}
function rootProbability(entry) {
  const line = entry?.engine?.lines?.find(l => l.multipv === 1)
  if (!line || !Number.isInteger(line.depth) || line.depth < 1 || line.bound || /\b(?:lowerbound|upperbound)\b/.test(line.raw ?? '')) return null
  if (Number.isInteger(line.mate) && line.mate !== 0) return Number(line.mate > 0)
  return line.mate == null && Number.isFinite(line.evalCp) ? calculateWinProbability(line.evalCp) : null
}

export function captureContextFeatures(entry, previous = null, previousOwn = null) {
  const game = new Chess(entry.fenBefore), side = game.turn()
  const material = game.board().flat().filter(Boolean).reduce((sum, p) => sum + (p.color === side ? 1 : -1) * values[p.type], 0)
  const move = play(game, entry)
  const priorMove = adjacent(previous, entry)
  const priorOwnMove = priorMove ? adjacent(previousOwn, previous) : null
  const beforeProbability = priorMove ? rootProbability(previous) : null
  const earlierOwnProbability = priorOwnMove && priorOwnMove.color === side ? rootProbability(previousOwn) : null
  const legalRecapture = game.moves({ verbose: true }).some(reply => {
    if (!reply.captured) return false
    const capturedSquare = reply.flags.includes('e') ? reply.to[0] + reply.from[1] : reply.to
    return capturedSquare === move.to
  })
  return {
    capturesPreviousMovedPiece: !move.captured ? false : priorMove ? priorMove.to === move.to : null,
    opponentCanRecapture: legalRecapture,
    previousOpponentCapture: priorMove ? Boolean(priorMove.captured) : null,
    previousOwnCapture: priorOwnMove && priorOwnMove.color === side ? Boolean(priorOwnMove.captured) : null,
    materialNonPositive: material <= 0,
    nonWinningBeforeOpponent: beforeProbability == null ? null : 1 - beforeProbability <= 0.60,
    alreadyWinningAtPreviousOwnMove: earlierOwnProbability == null ? null : earlierOwnProbability >= 0.75,
  }
}
