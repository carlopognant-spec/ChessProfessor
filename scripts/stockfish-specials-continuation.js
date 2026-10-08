import { Chess } from 'chess.js'

const uciPattern = /^[a-h][1-8][a-h][1-8][qrbn]?$/
const eligibleReasons = new Set(['only-good-estimate', 'only-winning-estimate'])
export const CONTINUATION_POLICY = Object.freeze({ version: 'stockfish-specials-continuation-v1', windowPlies: 8 })

function matchingPrefix(history, start, end) {
  const initial = history[start].numerical
  const pv = initial.engine?.lines?.find(line => line.multipv === 1)?.pv
  if (!Array.isArray(pv) || pv.length < end - start + 1) return null
  try {
    const game = new Chess(initial.fenBefore), color = game.turn(), prefix = []
    for (let index = start; index <= end; index++) {
      const entry = history[index].numerical, offset = index - start
      if (entry.fenBefore !== game.fen() || entry.playedUci !== pv[offset] || !uciPattern.test(entry.playedUci ?? '')) return null
      if (index === end && game.turn() !== color) return null
      const move = game.move({ from: entry.playedUci.slice(0, 2), to: entry.playedUci.slice(2, 4), promotion: entry.playedUci[4] })
      if (game.fen() !== entry.fenAfter) return null
      if (index > start && index < end && move.color !== color && ['mistake', 'blunder'].includes(entry.classification)) return null
      prefix.push(move.san)
    }
    return prefix
  } catch { return null }
}

// History ends at the current move. It contains original v1 candidates, not filtered results.
export function filterPredictedContinuation(history = []) {
  const current = history.at(-1)?.candidate
  if (!current) throw new TypeError('Current v1 candidate required')
  const result = { ...current, continuationPolicy: CONTINUATION_POLICY.version, continuation: null }
  if (current.special !== 'great' || !eligibleReasons.has(current.specialReason)) return result
  const end = history.length - 1
  for (let start = end - 2; start >= Math.max(0, end - CONTINUATION_POLICY.windowPlies); start -= 2) {
    const earlier = history[start].candidate
    if (!['great', 'brilliant'].includes(earlier?.special)) continue
    if (earlier.fenBefore !== history[start].numerical.fenBefore || earlier.playedUci !== history[start].numerical.playedUci) continue
    if (current.fenBefore !== history[end].numerical.fenBefore || current.playedUci !== history[end].numerical.playedUci) continue
    const prefix = matchingPrefix(history, start, end)
    if (!prefix) continue
    return { ...result, classification: current.baseClassification, special: null, specialStatus: 'rejected',
      specialReason: 'predicted-continuation', continuation: { previousPly: history[start].numerical.ply,
        previousMove: history[start].numerical.san, previousSpecial: earlier.special, prefix, distancePlies: end - start,
        chesscomReasonProven: false } }
  }
  return result
}
