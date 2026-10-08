import { Chess } from 'chess.js'
import { calculateWinProbability } from '../src/lib/evaluation.js'

export const SIMPLE_SPECIALS_POLICY = Object.freeze({
  version: 'stockfish-specials-simple-v1',
  good: 0.45, poor: 0.35, winning: 0.75, nonWinning: 0.60,
  gap: 0.20, consistency: 0.10, sacrificeLoss: 2, horizon: 8,
})
const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
const uciPattern = /^[a-h][1-8][a-h][1-8][qrbn]?$/
const asUci = move => `${move.from}${move.to}${move.promotion ?? ''}`
const material = (game, side) => game.board().flat().filter(Boolean)
  .reduce((sum, p) => sum + (p.color === side ? 1 : -1) * values[p.type], 0)

function play(game, uci) {
  if (!uciPattern.test(uci ?? '')) throw new Error('Invalid UCI')
  return game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
}
function score(line) {
  if (!line || !Number.isInteger(line.depth) || line.depth < 1 || line.bound
    || /\b(?:lowerbound|upperbound)\b/.test(line.raw ?? '')) return null
  if (Number.isInteger(line.mate) && line.mate !== 0) return Number(line.mate > 0)
  return line.mate == null && Number.isFinite(line.evalCp) ? calculateWinProbability(line.evalCp) : null
}
function replay(fen, pv, side, initialMaterial) {
  if (!Array.isArray(pv) || !pv.length) throw new Error('Missing PV')
  const game = new Chess(fen), moves = [], deltas = []
  for (const uci of pv) {
    moves.push(play(game, uci))
    deltas.push(material(game, side) - initialMaterial)
  }
  return { moves, deltas, endsInMate: game.isCheckmate() }
}

// Offline experiment only. No expected labels, engine calls, or app integration.
export function classifySimpleSpecial(entry, previous = null) {
  const policy = SIMPLE_SPECIALS_POLICY
  const baseClassification = entry.classification
  const result = { ...entry, baseClassification, special: null, specialPolicy: policy.version }
  const finish = (reason, status = 'rejected', evidence = {}) => ({ ...result, specialStatus: status, specialReason: reason, specialEvidence: evidence })
  if (entry.isBookMove || baseClassification !== 'best') return finish('protected-or-not-best')
  let game, move, initialMaterial, side
  try {
    game = new Chess(entry.fenBefore)
    side = game.turn()
    initialMaterial = material(game, side)
    if (game.moves().length < 2) return finish('forced-or-terminal')
    move = play(game, entry.playedUci)
    if (game.fen() !== entry.fenAfter) return finish('fen-mismatch', 'insufficient')
    if (game.isGameOver()) return finish('terminal-after')
  } catch { return finish('invalid-move-or-fen', 'insufficient') }

  const lines = entry.engine?.lines ?? []
  const first = lines.find(l => l.multipv === 1), second = lines.find(l => l.multipv === 2)
  const child = entry.playedEngine?.lines?.find(l => l.multipv === 1)
  if (first?.pv?.[0] !== entry.playedUci) return finish('not-root-best')
  const best = score(first), alternative = score(second), childScore = score(child)
  if (best == null || alternative == null || childScore == null) return finish('missing-or-bound-score', 'insufficient')
  if (first.depth !== second.depth) return finish('different-root-depths', 'insufficient')
  const rootMoves = lines.map(l => l.pv?.[0])
  if (new Set(rootMoves).size !== rootMoves.length || rootMoves.some(u => !uciPattern.test(u ?? ''))) return finish('invalid-or-duplicate-roots', 'insufficient')
  if (alternative > best) return finish('inconsistent-root-order', 'insufficient')
  const after = 1 - childScore
  const evidence = { best, after, alternative, gap: best - alternative, depth: first.depth,
    shownAlternatives: lines.length - 1, legalAlternatives: new Chess(entry.fenBefore).moves().length - 1,
    rootChildDisagreement: Math.abs(best - after), fullAlternativeProof: false }
  if (evidence.rootChildDisagreement > policy.consistency) return finish('unstable-root-child', 'insufficient', evidence)
  let rootPv, childPv
  try {
    rootPv = replay(entry.fenBefore, first.pv, side, initialMaterial)
    replay(entry.fenBefore, second.pv, side, initialMaterial)
    childPv = replay(entry.fenAfter, child.pv, side, initialMaterial)
    // Validate the other displayed alternatives too, without assigning labels from SAN.
    for (const line of lines.slice()) if (line !== first && line !== second) replay(entry.fenBefore, line.pv, side, initialMaterial)
  } catch { return finish('illegal-or-missing-pv', 'insufficient', evidence) }

  const minimumPlayed = Math.min(best, after)
  const response = childPv.moves[0]
  const acceptsPiece = response && ['n', 'b', 'r', 'q'].includes(response.captured)
  const sameReply = rootPv.moves[1] && asUci(rootPv.moves[1]) === asUci(response)
  const immediateRecovery = Boolean(childPv.moves[1]?.captured && childPv.deltas[1] >= 0)
  const sufficientHorizon = childPv.moves.length >= policy.horizon || childPv.endsInMate
  // Conservative veto even if a lower-ranked root was reported at an older depth.
  const otherAlreadyWinning = lines.filter(l => l !== first).some(l => score(l) >= policy.winning && score(l) != null)
  if (minimumPlayed >= policy.good && !otherAlreadyWinning && acceptsPiece && sameReply
    && childPv.deltas[0] <= -policy.sacrificeLoss && !immediateRecovery && sufficientHorizon) {
    return { ...result, classification: 'brilliant', special: 'brilliant', specialStatus: 'candidate', specialReason: 'accepted-sacrifice',
      specialEvidence: { ...evidence, offeredMove: move.san, acceptance: response.san,
        materialDeltas: childPv.deltas.slice(0, policy.horizon), continuation: childPv.moves.slice(0, policy.horizon).map(m => m.san),
        horizon: Math.min(policy.horizon, childPv.moves.length), compensationIsEngineEstimate: true } }
  }

  let reason = null
  if (minimumPlayed >= policy.good && alternative <= policy.poor && evidence.gap >= policy.gap) reason = 'only-good-estimate'
  else if (minimumPlayed >= policy.winning && alternative <= policy.nonWinning && evidence.gap >= policy.gap) reason = 'only-winning-estimate'
  else if (previous && previous.fenAfter === entry.fenBefore
    && ['mistake', 'blunder'].includes(previous.classification)
    && !previous.isBookMove) {
    try {
      const beforeGame = new Chess(previous.fenBefore)
      const previousMove = play(beforeGame, previous.playedUci)
      if (previousMove.color !== side && beforeGame.fen() === entry.fenBefore) {
        const priorBest = score(previous.engine?.lines?.find(l => l.multipv === 1))
        const beforeOpportunity = priorBest == null ? null : 1 - priorBest
        const offered = Number.isFinite(previous.playedProbability) ? 1 - previous.playedProbability : null
        evidence.beforeOpportunity = beforeOpportunity
        evidence.offered = offered
        if (beforeOpportunity != null && offered != null && beforeOpportunity <= policy.nonWinning
          && offered >= policy.winning && minimumPlayed >= policy.winning) reason = 'opponent-error-opportunity'
      }
    } catch { return finish('invalid-previous-context', 'insufficient', evidence) }
  }
  if (reason) return { ...result, classification: 'great', special: 'great', specialStatus: 'candidate', specialReason: reason, specialEvidence: evidence }
  return finish(acceptsPiece && !sufficientHorizon ? 'short-sacrifice-pv' : 'no-special-condition', acceptsPiece && !sufficientHorizon ? 'insufficient' : 'rejected', evidence)
}
