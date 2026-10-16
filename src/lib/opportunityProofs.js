// Reuse legal stored proof without changing numeric scores or starting searches.
import { Chess } from 'chess.js'
import { classifyReviewedMove } from './reviewEvaluation.js'
import { SPECIAL_POLICY as policy } from './specialPolicy.js'
import { calculateWinProbability } from './evaluation.js'
const primary = engine => engine?.lines?.find(l => l.multipv === 1) ?? engine
const exact = l => l && !l.bound && !l.lowerbound && !l.upperbound
  && !/\b(?:upperbound|lowerbound)\b/.test(l.raw ?? '')
const index = l => !exact(l) ? null : Number.isInteger(l.mate) && l.mate !== 0
  ? Number(l.mate > 0) : l.mate == null && Number.isFinite(l.evalCp) ? calculateWinProbability(l.evalCp) : null
function replay(fen, pv) {
  if (!pv?.length || pv.length > 256) throw Error('Missing variation')
  const b = new Chess(fen), san = []
  for (const u of pv) {
    if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(u)) throw Error('Invalid move')
    san.push(b.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }).san)
  }
  return { b, san }
}
export function independentPriorSupports(prior, current) {
  if (prior.evaluationEvidence?.status !== 'independent'
    || prior.playedEngine?.fen !== current.fenBefore || prior.engine?.fen !== prior.fenBefore
    || prior.evaluationEvidence?.snapshotAvailable !== true) return false
  const root = prior.engine.specialLines?.[0], latest = primary(prior.engine), child = primary(prior.playedEngine)
  const a = index(root), b = index(latest), c = index(child)
  if ([a,b,c].some(v => v == null) || root.pv?.[0] !== latest.pv?.[0]
    || Math.abs(a-b) > policy.consistency || Math.abs(c-current.bestProbability) > policy.consistency
    || Math.abs(prior.playedProbability-(1-c)) > policy.consistency) return false
  try {
    const first = replay(prior.fenBefore, [root.pv[0]])
    const probe = classifyReviewedMove({ ...prior, playedUci: root.pv[0], fenAfter: first.b.fen() })
    if (probe.evaluationEvidence?.source !== 'completed-snapshot'
      || probe.evaluationEvidence?.status !== 'coherent') return false
    replay(prior.fenBefore, root.pv); replay(prior.fenBefore, latest.pv)
    replay(prior.fenAfter, child.pv)
    return true
  } catch { return false }
}
export function classifyStoredMatingContinuation(result, input, previous) {
  if (!previous || result.classification === 'missed' || input.isBookMove
    || ['book','unclassified','forced','great','brilliant'].includes(result.classification)
    || input.playedMate === 0 || input.playedMate > 0 || input.isEngineBest !== false
    || previous.fenAfter !== input.fenBefore) return result
  try {
    const current = classifyReviewedMove(input), prior = classifyReviewedMove(previous)
    if (current.isEngineBest !== false || current.playedMate === 0 || current.playedMate > 0
      || current.moveFacts?.forced || prior.evaluationEvidence?.source !== 'completed-snapshot'
      || prior.evaluationEvidence?.status !== 'coherent' || prior.evaluationSource !== 'root-pv') return result
    const root = prior.engine.specialLines?.find(l => l.pv?.[0] === prior.playedUci)
    if (!exact(root) || !Number.isSafeInteger(root.mate) || root.mate >= 0 || root.mate < -128
      || root.mate !== prior.playedMate || root.pv.length !== -2 * root.mate) return result
    const originalSide = new Chess(prior.fenBefore).turn()
    const full = replay(prior.fenBefore, root.pv)
    if (!full.b.isCheckmate() || full.b.turn() !== originalSide) return result
    const first = replay(prior.fenBefore, [root.pv[0]])
    if (first.b.fen() !== current.fenBefore) return result
    const pv = root.pv.slice(1), best = primary(current.engine), child = primary(current.playedEngine)
    const playedRoot = (current.engine.specialLines ?? current.engine.lines ?? []).find(l => l.pv?.[0] === current.playedUci)
    const retainedAtRoot = [...(current.engine.specialLines ?? []), ...(current.engine.lines ?? [])]
      .some(l => l.pv?.[0] === current.playedUci && exact(l) && l.mate > 0)
    const retainedAtChild = current.playedEngine.specialLines?.[0]?.mate < 0
    if (pv[0] === current.playedUci || best?.pv?.[0] !== pv[0] || index(best) == null
      || index(best) < policy.winning || !exact(child) || child.mate != null || !Number.isFinite(child.evalCp)
      || current.playedEngine.fen !== current.fenAfter || current.engine.fen !== current.fenBefore
      || retainedAtRoot || retainedAtChild || playedRoot && !exact(playedRoot)) return result
    replay(current.fenAfter, child.pv); replay(current.fenBefore, best.pv)
    const mating = replay(current.fenBefore, pv)
    if (!mating.b.isCheckmate()) return result
    return { ...result, classification: 'missed', missedOpportunityReason: 'verified-stored-mating-continuation',
      missedOpportunity: { kind: 'forced-mate', mateIn: -root.mate,
        previousPly: prior.ply, previousMove: prior.playedMove,
        bestProbability: current.bestProbability, playedProbability: current.playedProbability,
        alternative: { uci: pv.slice(0,8), san: mating.san.slice(0,8) },
        matingLine: { uci: pv, san: mating.san }, policyVersion: 'stored-mating-continuation-v1' } }
  } catch { return result }
}
