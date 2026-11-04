import { Chess } from 'chess.js'
import { classifyGrandeCandidate } from './grandeCandidate.js'
import { classifySpecialMove, normalizeAnalysisBounds } from './analysisSpecialClassification.js'
import { classifyReviewedMove } from './reviewEvaluation.js'
import { calculateWinProbability } from './evaluation.js'
import { analysisMetadataKey } from './analysisMetadata.js'
import { checkingAttackerCapture, checkingMajorFork } from './tacticalEvidence.js'
import { newQueenEvasionWinningMajor } from './queenEvasion.js'
import { knightPawnEvasionExploitingQueenPin } from './knightPinEvasion.js'
import { detectMaterialRealization } from './materialRealization.js'
import { SPECIAL_POLICY } from './specialPolicy.js'
import { ENGINE_CONFIG } from './engineConfig.js'
import { nativeProofFor } from './nativeEvidence.js'
import { grandeProofFor } from './grandeProofs.js'

export const GRANDE_CANDIDATE_V2_VERSION = 'grande-evidence-candidate-v2'
const play = (b, u) => b.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] })
const uci = m => m.from + m.to + (m.promotion ?? '')
const index = l => l.mate == null ? calculateWinProbability(l.evalCp) : Number(l.mate > 0)
const order = l => l.mate == null ? l.evalCp : l.mate > 0 ? 1e9 - l.mate : -1e9 - l.mate
const exact = l => l && !l.bound && !l.lowerbound && !l.upperbound
  && !/\b(?:lowerbound|upperbound)\b/.test(l.raw ?? '')
  && Number.isSafeInteger(l.depth) && l.depth > 0
  && (l.mate == null ? Number.isFinite(l.evalCp) : Number.isSafeInteger(l.mate) && l.mate !== 0)
function legalLine(fen, line) {
  if (!exact(line) || !line.pv?.length || line.pv.length > 256) return false
  const board = new Chess(fen)
  for (const move of line.pv) play(board, move)
  return true
}

// Kept local so the frozen v1 experiment and its hashes remain reproducible.
function completed(engine, fen) {
  if (!engine || engine.bound || engine.lowerbound || engine.upperbound
    || engine.fen && engine.fen !== fen || engine.analysisMetadata?.searchMoves) return null
  const rows = engine.specialLines, requested = engine.analysisMetadata?.multiPv
  if (!Number.isSafeInteger(requested) || requested < 2 || !rows?.length
    || rows.length !== Math.min(requested, new Chess(fen).moves().length)
    || rows[0].pv?.[0] !== (engine.bestmove ?? engine.lines?.find(l => l.multipv === 1)?.pv?.[0])
    || new Set(rows.map(l => l.pv?.[0])).size !== rows.length) return null
  for (const [i, line] of rows.entries()) {
    if (line.multipv !== i + 1 || line.depth !== rows[0].depth || !legalLine(fen, line)
      || i > 0 && order(line) > order(rows[i - 1])) return null
  }
  return { ...engine, ...rows[0], lines: rows, specialLines: rows }
}

function position(entry) {
  const board = new Chess(entry.fenBefore)
  const move = play(board, entry.playedUci)
  if (board.fen() !== entry.fenAfter) throw Error('Position mismatch')
  return move
}
function legacyEvidence(entry) {
  position(entry)
  for (const [engine, fen] of [[entry.engine, entry.fenBefore], [entry.playedEngine, entry.fenAfter]]) {
    if (!engine || engine.bound || engine.lowerbound || engine.upperbound
      || engine.specialLines != null || engine.analysisMetadata != null || engine.fen && engine.fen !== fen
      || !engine.lines?.length || !engine.lines.every(line => legalLine(fen, line))) return false
  }
  const numeric = classifyReviewedMove(entry)
  return ['coherent', 'independent'].includes(numeric.evaluationEvidence?.status)
}
function queenRetreat(entry) {
  const before = new Chess(entry.fenBefore), after = new Chess(entry.fenAfter), move = position(entry)
  if (move.piece !== 'q' || move.captured || before.isCheck() || after.isCheck()) return false
  const f = before.fen().split(' ')
  f[1] = before.turn() === 'w' ? 'b' : 'w'; f[3] = '-'
  return new Chess(f.join(' ')).moves({ verbose: true }).some(m => m.to === move.from && m.captured === 'q')
}
function proof(entry, previous, own) {
  if (detectMaterialRealization(entry, previous, own)) return null
  return checkingMajorFork(entry) ?? newQueenEvasionWinningMajor(entry, previous, own)
    ?? knightPawnEvasionExploitingQueenPin(entry)
}

// Observation only: legal reply enumeration is not a proof that any reply is forced.
export function queenAttackRelativePinMotif(entry) {
  try {
    const move = position(entry), before = new Chess(entry.fenBefore), after = new Chess(entry.fenAfter)
    if (move.piece !== 'n' || move.captured || move.promotion || after.isCheck()) return null
    for (const queen of before.board().flat().filter(p => p?.color === move.color && p.type === 'q')) {
      for (const [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const pieces = []
        for (let x = queen.square.charCodeAt(0) - 97 + dx, y = Number(queen.square[1]) - 1 + dy;
          x >= 0 && x < 8 && y >= 0 && y < 8; x += dx, y += dy) {
          const at = String.fromCharCode(97 + x) + (y + 1), p = before.get(at)
          if (p) pieces.push({ ...p, square: at })
          if (pieces.length === 3) break
        }
        const [vacated, blocker, target] = pieces
        if (vacated?.square !== move.from || blocker?.color === move.color || !['p', 'n', 'b', 'r'].includes(blocker?.type)
          || target?.type !== 'q' || target.color === move.color
          || !after.attackers(target.square, move.color).includes(move.to)
          || !after.attackers(blocker.square, move.color).includes(queen.square)) continue
        const replies = after.moves({ verbose: true }).map(reply => {
          const board = new Chess(after.fen()); board.move(reply.san)
          const queenCapture = board.moves({ verbose: true }).find(m => m.from === queen.square
            && m.to === target.square && m.captured === 'q')
          return { uci: uci(reply), san: reply.san, blockerMoved: reply.from === blocker.square,
            queenCapture: queenCapture ? uci(queenCapture) : null }
        })
        return { kind: 'knight-queen-attack-with-opened-relative-pin', pinner: queen.square,
          blocker: blocker.square, target: target.square, vacated: move.from, knightTo: move.to,
          replies, scope: 'all-legal-immediate-replies-only', forcedQueenWinEstablished: false, sufficientForGrande: false }
      }
    }
  } catch { return null }
  return null
}

export function classifyGrandeCandidateV2(input, previous = null, previousOwn = null, extraEvidence = null,
  published = classifySpecialMove(input, previous, previousOwn, extraEvidence),
  v1 = classifyGrandeCandidate(input, previous, previousOwn, extraEvidence, published)) {
  const base = { version: GRANDE_CANDIDATE_V2_VERSION, publishedClassification: published.classification,
    v1Classification: v1.classification, inheritance: null }
  const finish = (classification, verdict, reason, details = {}) => ({ ...published, classification,
    candidateAssessment: { ...base, classification, verdict, reason, ...details } })
  if (!['best', 'excellent', 'great'].includes(published.classification) || input.isBookMove
    || input.moveFacts?.forced || input.playedMate === 0) return finish(published.classification, 'not-applicable', 'outside-grande-scope')
  const ordinary = published.classification === 'great'
    ? input.numericalClassification ?? input.baseClassification ?? 'best' : published.classification
  try {
    const [entry, prior, own] = normalizeAnalysisBounds([input, previous, previousOwn])
    position(entry)
    if (published.classification !== 'great' && v1.classification !== 'great' && !queenAttackRelativePinMotif(entry)) {
      return finish(published.classification, 'not-applicable', 'no-grande-candidate')
    }
    let evaluated = entry, evidenceProfile = 'ordinary'
    if (v1.candidateAssessment.provenance?.evidenceProfile === 'validated-supplemental-pair') {
      const packet = nativeProofFor(entry, entry.nativeDecisionProof) ?? grandeProofFor(entry, entry.grandeDecisionProof)
      if (!packet?.root || !packet.child) return finish(ordinary, 'inconclusive', 'invalid-supplemental-proof')
      evaluated = { ...entry, engine: packet.root, playedEngine: packet.child }
      evidenceProfile = 'validated-supplemental-pair'
    }
    const engine = completed(evaluated.engine, entry.fenBefore), child = completed(evaluated.playedEngine, entry.fenAfter)
    if (!engine || !child) {
      if (published.classification === 'great' && legacyEvidence(entry)) {
        return finish('great', 'inconclusive', 'inherited-legacy-without-completed-snapshots', { inheritance: 'historical' })
      }
      return finish(ordinary, 'inconclusive', 'missing-or-invalid-completed-evidence')
    }
    const current = classifyReviewedMove({ ...evaluated, engine, playedEngine: child })
    const provenance = { source: 'completed-snapshot', evidenceProfile, rootDepth: engine.depth, childDepth: child.depth,
      analyzed: engine.lines.length, legal: new Chess(entry.fenBefore).moves().length }
    if (current.evaluationEvidence?.status !== 'coherent'
      || current.evaluationEvidence.source !== 'completed-snapshot'
      || analysisMetadataKey(engine.analysisMetadata) !== analysisMetadataKey(child.analysisMetadata)
      || Math.abs(current.playedProbability - (1 - index(child.lines[0]))) > SPECIAL_POLICY.consistency) {
      return finish(ordinary, 'inconclusive', 'missing-or-conflicting-played-comparison', { provenance })
    }
    const tactic = proof(current, prior, own), motif = queenAttackRelativePinMotif(current)
    if (motif) {
      return finish(ordinary, 'inconclusive', 'relative-pin-motif-not-a-forced-tactic-proof', { provenance, motif })
    }
    if (queenRetreat(current) && !tactic) {
      return finish(ordinary, 'inconclusive', 'queen-evasion-needs-additional-proof', { provenance })
    }
    const capture = checkingAttackerCapture(current, prior)
    if (capture && !tactic) {
      const alternatives = engine.lines.filter(l => l.pv[0] !== entry.playedUci)
      const allLegal = engine.lines.length === provenance.legal
      const maintained = Math.min(current.playedProbability, 1 - index(child.lines[0]))
      if (allLegal && alternatives.length && alternatives.every(l => index(l) >= SPECIAL_POLICY.winning)) {
        return finish(ordinary, 'excluded', 'checking-capture-all-evasions-preserve-winning-index', { provenance, capture })
      }
      if (allLegal && current.isEngineBest === true && maintained > SPECIAL_POLICY.nonWinning
        && alternatives.length && alternatives.every(l => index(l) <= SPECIAL_POLICY.nonWinning)
        && 100 * (index(engine.lines[0]) - Math.max(...alternatives.map(index))) > ENGINE_CONFIG.classification.excellent) {
        return finish('great', 'confirmed', 'critical-checking-capture-complete-evasions', { provenance, capture,
          maintainedIndex: maintained, alternativeIndices: alternatives.map(index),
          evidenceScope: 'engine-outcome-comparison-of-all-legal-evasions-not-forced-win-proof' })
      }
      return finish(ordinary, 'inconclusive', 'checking-capture-needs-additional-proof', { provenance, capture })
    }
    if (v1.candidateAssessment.status === 'supported' && v1.classification === 'great') {
      const verified = classifyGrandeCandidate(entry, prior, own, extraEvidence, published)
      if (verified.classification === 'great' && verified.candidateAssessment.status === 'supported') {
        return finish('great', 'confirmed', verified.candidateAssessment.reason, { provenance, evidence: verified.candidateAssessment })
      }
    }
    if (published.classification !== 'great') return finish(ordinary, 'inconclusive', 'no-additional-tactical-proof', { provenance })
    if (!prior || prior.ply !== entry.ply - 1 || prior.fenAfter !== entry.fenBefore) {
      return finish(ordinary, 'inconclusive', 'missing-opponent-context', { provenance })
    }
    position(prior)
    const priorRoot = completed(prior.engine, prior.fenBefore), priorChild = completed(prior.playedEngine, prior.fenAfter)
    if (!priorRoot || !priorChild || analysisMetadataKey(priorRoot.analysisMetadata) !== analysisMetadataKey(priorChild.analysisMetadata)
      || analysisMetadataKey(priorChild.analysisMetadata) !== analysisMetadataKey(engine.analysisMetadata)
      || JSON.stringify(priorChild.lines) !== JSON.stringify(engine.lines)) {
      return finish(ordinary, 'inconclusive', 'unmatched-opponent-search-context', { provenance })
    }
    const context = classifyReviewedMove({ ...prior, engine: priorRoot, playedEngine: priorChild })
    const checked = classifySpecialMove(current, context, own, extraEvidence)
    if (context.evaluationEvidence?.status === 'independent' && checked.classification === 'great') {
      return finish('great', 'inconclusive', 'inherited-with-validated-independent-opponent-context', {
        inheritance: 'context', provenance: { ...provenance, previousComparison: context.evaluationEvidence,
          previousRootDepth: priorRoot.depth, previousChildDepth: priorChild.depth },
        selectedReason: checked.specialAssessment.grande.reason })
    }
    return finish(ordinary, 'inconclusive', 'additional-proof-not-established', { provenance })
  } catch {
    return finish(ordinary, 'inconclusive', 'invalid-position-or-evidence')
  }
}
