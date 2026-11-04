import { Chess } from 'chess.js'
import { classifySpecialMove, normalizeAnalysisBounds } from './analysisSpecialClassification.js'
import { classifyReviewedMove } from './reviewEvaluation.js'
import { reclassifyReviewedMoves } from './reviewMoves.js'
import { checkingMajorFork } from './tacticalEvidence.js'
import { newQueenEvasionWinningMajor } from './queenEvasion.js'
import { knightPawnEvasionExploitingQueenPin } from './knightPinEvasion.js'
import { detectMaterialRealization } from './materialRealization.js'
import { calculateWinProbability } from './evaluation.js'
import { ENGINE_CONFIG } from './engineConfig.js'
import { SPECIAL_POLICY } from './specialPolicy.js'
import { grandeProofFor } from './grandeProofs.js'
import { nativeProofFor } from './nativeEvidence.js'

// Offline candidate only: no application, archive or refinement caller selects it.
export const GRANDE_CANDIDATE_VERSION = 'grande-evidence-candidate-v1'
const play = (board, uci) => board.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
const index = line => line.mate != null ? Number(line.mate > 0) : calculateWinProbability(line.evalCp)

function completed(engine, fen) {
  if (!engine || engine.fen && engine.fen !== fen || engine.analysisMetadata?.searchMoves) return null
  const lines = engine.specialLines, requested = engine.analysisMetadata?.multiPv
  const board = new Chess(fen), legal = board.moves().length
  if (!Number.isSafeInteger(requested) || requested < 2 || !lines?.length
    || lines.length !== Math.min(requested, legal) || lines[0].pv?.[0] !== engine.bestmove) return null
  const roots = new Set(), depth = lines[0].depth
  for (const [i, line] of lines.entries()) {
    if (line.multipv !== i + 1 || !Number.isSafeInteger(depth) || depth < 1 || line.depth !== depth
      || line.bound || line.lowerbound || line.upperbound || /\b(?:lowerbound|upperbound)\b/.test(line.raw ?? '')
      || !(line.mate == null ? Number.isFinite(line.evalCp) : Number.isSafeInteger(line.mate) && line.mate !== 0)
      || !line.pv?.length || line.pv.length > 256 || roots.has(line.pv[0])
      || i > 0 && index(line) > index(lines[i - 1])) return null
    const replay = new Chess(fen)
    for (const move of line.pv) play(replay, move)
    roots.add(line.pv[0])
  }
  return { ...engine, ...lines[0], lines, specialLines: lines }
}

function selected(entry) {
  if (!entry) return null
  const engine = completed(entry.engine, entry.fenBefore)
  const playedEngine = completed(entry.playedEngine, entry.fenAfter)
  if (!engine || !playedEngine) return null
  const result = classifyReviewedMove({ ...entry, engine, playedEngine })
  return result.evaluationEvidence?.source === 'completed-snapshot'
    && result.evaluationEvidence.status === 'coherent' ? result : null
}

// Missing score evidence must not erase legal move history used by novelty guards.
const historyOnly = entry => entry && ({ ...entry, engine: null, playedEngine: null,
  evaluationEvidence: null, bestProbability: null, playedProbability: null })

function tacticalProof(entry, previous, previousOwn) {
  if (detectMaterialRealization(entry, previous, previousOwn)) return null
  return checkingMajorFork(entry) ?? newQueenEvasionWinningMajor(entry, previous, previousOwn)
    ?? knightPawnEvasionExploitingQueenPin(entry)
}

function attackedQueenRetreat(entry) {
  const before = new Chess(entry.fenBefore), after = new Chess(entry.fenBefore)
  const move = play(after, entry.playedUci)
  if (move.piece !== 'q' || move.captured || before.isCheck() || after.isCheck()) return false
  const fields = before.fen().split(' ')
  fields[1] = before.turn() === 'w' ? 'b' : 'w'; fields[3] = '-'
  return new Chess(fields.join(' ')).moves({ verbose: true }).some(m => m.to === move.from && m.captured === 'q')
}

export function classifyGrandeCandidate(input, previous = null, previousOwn = null, extraEvidence = null,
  published = classifySpecialMove(input, previous, previousOwn, extraEvidence)) {
  const assessment = { version: GRANDE_CANDIDATE_VERSION, publishedPolicy: SPECIAL_POLICY.version,
    publishedClassification: published.classification, status: 'unchanged', reason: 'outside-grande-scope' }
  const finish = (classification, status, reason, details = {}) => ({ ...published, classification,
    candidateAssessment: { ...assessment, status, reason, ...details, classification } })
  // Other special categories, terminal facts and missed opportunities retain their published semantics.
  if (!['best', 'excellent', 'great'].includes(published.classification) || input.isBookMove
    || input.moveFacts?.forced || input.playedMate === 0) return finish(published.classification, 'unchanged', assessment.reason)
  const ordinary = published.classification === 'great'
    ? input.numericalClassification ?? input.baseClassification ?? 'best' : published.classification
  try {
    const [entry, prior, own] = normalizeAnalysisBounds([input, previous, previousOwn])
    let evaluated = entry, predecessor = prior, evidenceProfile = 'ordinary'
    if (published.specialAssessment?.grande?.decisionProof) {
      const proof = nativeProofFor(entry, entry.nativeDecisionProof) ?? grandeProofFor(entry, entry.grandeDecisionProof)
      if (!proof?.root || !proof.child) return finish(ordinary, 'insufficient', 'invalid-supplemental-proof')
      evaluated = { ...entry, engine: proof.root, playedEngine: proof.child }
      predecessor = prior && { ...prior, playedEngine: proof.root }
      evidenceProfile = 'validated-supplemental-pair'
    }
    const current = selected(evaluated), priorSelected = selected(predecessor), ownSelected = selected(own)
    if (!current) return finish(ordinary, 'insufficient', 'completed-comparison-required')
    const provenance = { source: 'completed-snapshot', evidenceProfile, rootDepth: current.engine.depth,
      childDepth: current.playedEngine.depth, analyzed: current.engine.lines.length,
      legal: new Chess(entry.fenBefore).moves().length,
      previousComparison: priorSelected ? 'completed-snapshot' : 'unavailable-or-independent' }
    const checked = classifySpecialMove(current, priorSelected ?? historyOnly(prior), ownSelected ?? historyOnly(own), extraEvidence)
    const proof = tacticalProof(current, prior, own)
    const maintained = Math.min(current.playedProbability, 1 - index(current.playedEngine.lines[0]))
    const consistent = Math.abs(current.playedProbability - (1 - index(current.playedEngine.lines[0]))) <= SPECIAL_POLICY.consistency
    if (!consistent) return finish(ordinary, 'insufficient', 'conflicting-child-score', { provenance })
    // Rank is not a tactical proof. Reuse the existing quality band and a legal certificate instead.
    if (current.classification === 'excellent' && current.isEngineBest === false
      && current.dropPct <= ENGINE_CONFIG.classification.excellent && maintained >= SPECIAL_POLICY.good && proof) {
      return finish('great', 'supported', 'near-optimal-verified-tactic', { provenance, proof })
    }
    if (published.classification !== 'great') return finish(published.classification, 'unchanged', 'no-additional-tactical-proof', { provenance })
    const reason = checked.specialAssessment?.grande?.reason
    if (checked.classification !== 'great') return finish(ordinary, 'insufficient', 'not-supported-by-selected-evidence', { provenance, selectedReason: reason })
    if (reason === 'active-checking-attacker-capture' && !proof) {
      return finish(ordinary, 'candidate', 'checking-capture-needs-additional-proof', { provenance, selectedReason: reason })
    }
    if (attackedQueenRetreat(current) && !proof) {
      return finish(ordinary, 'candidate', 'queen-evasion-needs-additional-proof', { provenance, selectedReason: reason })
    }
    return finish('great', 'supported', reason, { provenance, ...(proof ? { proof } : {}) })
  } catch {
    return finish(ordinary, 'insufficient', 'invalid-candidate-evidence')
  }
}

// Fixed published context isolates the policy effect; no candidate label feeds a later decision.
export function reclassifyGrandeCandidate(entries = []) {
  const published = reclassifyReviewedMoves(entries)
  return published.map((entry, i) => classifyGrandeCandidate(entry, published[i - 1], published[i - 2], null, entry))
}
