import { Chess } from 'chess.js'
import { classifyReviewedMove } from './reviewEvaluation.js'
import { calculateWinProbability } from './evaluation.js'
import { SPECIAL_POLICY } from './specialPolicy.js'
import { independentPriorSupports } from './opportunityProofs.js'

const primary = engine => engine?.lines?.find(line => line.multipv === 1) ?? engine
function play(game, uci) {
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci ?? '')) throw Error('Invalid UCI')
  return game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
}
function confirmedChildProbability(entry) {
  const line = primary(entry.playedEngine)
  if (!line || line.bound || line.lowerbound || line.upperbound
    || /\b(?:lowerbound|upperbound)\b/.test(line.raw ?? '')
    || entry.playedEngine.fen && entry.playedEngine.fen !== entry.fenAfter || !line.pv?.length) return null
  try {
    const game = new Chess(entry.fenAfter)
    for (const uci of line.pv) play(game, uci)
    if (Number.isSafeInteger(line.mate) && line.mate !== 0) return Number(line.mate < 0)
    return line.mate == null && Number.isFinite(line.evalCp) ? 1 - calculateWinProbability(line.evalCp) : null
  } catch { return null }
}
function verifiedAlternative(entry) {
  const pv = entry.engine?.specialLines?.[0]?.pv
  if (!pv?.length || pv.length > 256 || pv[0] === entry.playedUci) return null
  try {
    const game = new Chess(entry.fenBefore), san = pv.map(uci => play(game, uci).san)
    if (pv.length < 2 && !game.isCheckmate()) return null
    return { uci: pv.slice(0, 8), san: san.slice(0, 8) }
  } catch { return null }
}

// Extend only the intermediate-advantage case rejected by the original policy.
// A complete current comparison is required. A separately evaluated prior move
// also needs a stable complete root and agreement with the current position.
export function classifyCoherentWinningOpportunity(result, entry, previous) {
  if (result.missedOpportunityReason !== 'already-advantaged' || result.classification === 'missed'
    || entry.isBookMove || ['book', 'unclassified', 'great', 'brilliant', 'forced'].includes(result.classification)
    || entry.playedMate === 0 || entry.playedMate > 0 || !previous || previous.fenAfter !== entry.fenBefore) return result
  try {
    const board = new Chess(previous.fenBefore), side = board.turn()
    play(board, previous.playedUci ?? previous.uci)
    if (board.fen() !== entry.fenBefore || board.turn() === side) return result
    play(board, entry.playedUci ?? entry.uci)
    if (board.fen() !== entry.fenAfter) return result
    const current = classifyReviewedMove(entry), prior = classifyReviewedMove(previous)
    const coherentPrior = prior.evaluationEvidence?.status === 'coherent'
      && prior.evaluationEvidence.source === 'completed-snapshot'
    if (current.moveFacts?.forced || prior.isBookMove || !['mistake', 'blunder'].includes(prior.numericalClassification)
      || current.evaluationEvidence?.status !== 'coherent'
      || current.evaluationEvidence.source !== 'completed-snapshot'
      || !(coherentPrior || independentPriorSupports(prior, current))) return result
    const values = [prior.bestProbability, prior.playedProbability, current.bestProbability, current.playedProbability]
    if (!values.every(v => Number.isFinite(v) && v >= 0 && v <= 1)) return result
    const before = 1 - prior.bestProbability, offered = 1 - prior.playedProbability
    const available = current.bestProbability, played = current.playedProbability, p = SPECIAL_POLICY
    const child = confirmedChildProbability(current)
    if (child == null || Math.abs(played - child) > p.consistency
      || !(before > p.nonWinning && before < p.winning && offered >= p.winning && available >= p.winning
        && played <= p.nonWinning && child <= p.nonWinning)) return result
    const alternative = verifiedAlternative(current)
    if (!alternative) return result
    return { ...result, classification: 'missed', missedOpportunityReason: 'verified-intermediate-winning-opportunity',
      missedOpportunity: { kind: 'winning-opportunity', previousPly: previous.ply ?? null,
        previousMove: previous.playedMove ?? previous.san ?? null, beforeProbability: before,
        offeredProbability: offered, bestProbability: available, playedProbability: played,
        childProbability: child, alternative, policyVersion: coherentPrior ? 'opportunity-evidence-v2' : 'opportunity-evidence-v3',
        evidence: { source: 'completed-snapshot', rootDepth: current.evaluationEvidence.rootDepth,
          previousSource: prior.evaluationEvidence.source, previousDepth: prior.evaluationEvidence.rootDepth } } }
  } catch { return result }
}
