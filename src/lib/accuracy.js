import { Chess } from 'chess.js'

// Public rounded formula requested in roadmap 3.2. Deliberately no lila +1 bonus.
// Aggregation: lila AccuracyPercent.scala, revision 2e653ad1e2b9fad31b4a092394019ef8fafdedb8.
export const ACCURACY_SCHEMA_VERSION = 1
const clamp = (value, low, high) => Math.min(high, Math.max(low, value))

export function accuracyWinPercent(cp) {
  if (!Number.isFinite(cp)) return null
  return 100 / (1 + Math.exp(-0.00368208 * clamp(cp, -1000, 1000)))
}

export function moveAccuracy(before, after) {
  if (![before, after].every(value => Number.isFinite(value) && value >= 0 && value <= 100)) return null
  if (after >= before) return 100
  return clamp(103.1668 * Math.exp(-0.04354 * Math.max(0, before - after)) - 3.1669, 0, 100)
}

export function aggregateAccuracy(whiteWinPercents, startColor = 'w') {
  const totalPlies = Math.max(0, whiteWinPercents.length - 1)
  const windowSize = clamp(Math.floor(totalPlies / 10), 2, 8)
  const windowWeight = values => {
    if (!values.every(value => Number.isFinite(value) && value >= 0 && value <= 100)) return null
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length
    return clamp(Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length), 0.5, 12)
  }
  const windows = []
  for (let i = 0; i < Math.min(windowSize, whiteWinPercents.length) - 2; i++) windows.push(whiteWinPercents.slice(0, windowSize))
  for (let i = 0; i + windowSize <= whiteWinPercents.length; i++) windows.push(whiteWinPercents.slice(i, i + windowSize))
  const weights = windows.map(windowWeight)
  const moves = Array.from({ length: totalPlies }, (_, index) => {
    const side = index % 2 === 0 ? startColor : startColor === 'w' ? 'b' : 'w'
    const before = whiteWinPercents[index], after = whiteWinPercents[index + 1]
    const accuracy = side === 'w' ? moveAccuracy(before, after)
      : moveAccuracy(before == null ? null : 100 - before, after == null ? null : 100 - after)
    return { ply: index + 1, side, accuracy, weight: weights[index] ?? null }
  })
  const summarize = side => {
    const ownMoves = moves.filter(move => move.side === side)
    const usable = ownMoves.filter(move => move.accuracy != null && move.weight != null)
    if (!usable.length) return { value: null, used: 0, total: ownMoves.length, weighted: null, harmonic: null }
    const weighted = usable.reduce((sum, move) => sum + move.accuracy * move.weight, 0) / usable.reduce((sum, move) => sum + move.weight, 0)
    // scalalib Maths.harmonicMean protects reciprocals with max(1, accuracy).
    const harmonic = usable.length / usable.reduce((sum, move) => sum + 1 / Math.max(1, move.accuracy), 0)
    return { value: clamp((weighted + harmonic) / 2, 0, 100), used: usable.length, total: ownMoves.length, weighted, harmonic }
  }
  return { schemaVersion: ACCURACY_SCHEMA_VERSION, white: summarize('w'), black: summarize('b'), windowSize, moves }
}

function whiteScore(result, fen) {
  try {
    const game = new Chess(fen)
    const sign = game.turn() === 'w' ? 1 : -1
    if (game.isCheckmate()) return -sign * 1000
    if (game.isStalemate()) return 0
    if (result?.bound || result?.lowerbound || result?.upperbound) return null
    if (Number.isFinite(result?.mate)) return sign * (result.mate > 0 ? 1000 : -1000)
    return Number.isFinite(result?.evalCp) ? sign * result.evalCp : null
  } catch { return null }
}

export function gameAccuracy(entries = [], { totalPlies = entries.length } = {}) {
  // One score per actual FEN: initial root and playedEngine after each move.
  // Do not splice independent root scores or use classification's root-PV scores.
  let previousFen = null
  const scores = []
  const startColor = entries[0]?.fenBefore?.split(' ')[1] === 'b' ? 'b' : 'w'
  for (const [index, entry] of entries.entries()) {
    if (index === 0) scores.push(whiteScore(entry.engine, entry.fenBefore))
    let valid = !previousFen || previousFen === entry.fenBefore
    try {
      const game = new Chess(entry.fenBefore)
      game.move(entry.playedMove ?? entry.san)
      valid &&= game.fen() === entry.fenAfter
    } catch { valid = false }
    if (!valid) scores[index] = null
    scores.push(valid ? whiteScore(entry.playedEngine, entry.fenAfter) : null)
    previousFen = entry.fenAfter
  }
  const result = aggregateAccuracy(scores.map(accuracyWinPercent), startColor)
  return { ...result, analyzedPlies: entries.length, totalPlies, partial: entries.length !== totalPlies || result.white.used !== result.white.total || result.black.used !== result.black.total }
}
