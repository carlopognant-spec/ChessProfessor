import { Chess } from 'chess.js'
import { classifyGrandeCandidateV2, queenAttackRelativePinMotif } from './grandeCandidateV2.js'
import { classifySpecialMove, normalizeAnalysisBounds } from './analysisSpecialClassification.js'
import { classifyReviewedMove } from './reviewEvaluation.js'
import { annotateClassification } from './classificationDecision.js'
import { reclassifyReviewedMoves } from './reviewMoves.js'
import { calculateWinProbability } from './evaluation.js'
import { analysisMetadataKey } from './analysisMetadata.js'
import { checkingMajorFork } from './tacticalEvidence.js'
import { newQueenEvasionWinningMajor } from './queenEvasion.js'
import { knightPawnEvasionExploitingQueenPin } from './knightPinEvasion.js'
import { newBishopRookSkewer, proveBishopSkewerGain, verifyBishopSkewerGain } from './bishopSkewer.js'
import { detectMaterialRealization } from './materialRealization.js'
import { SPECIAL_POLICY } from './specialPolicy.js'
import { ENGINE_CONFIG } from './engineConfig.js'
import { nativeProofFor } from './nativeEvidence.js'
import { grandeProofFor } from './grandeProofs.js'

// Final Grande stage for live analysis and archive reconstruction; published context stays separate.
export const GRANDE_CANDIDATE_V3_VERSION = 'grande-evidence-candidate-v3'
const play = (b, u) => b.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] })
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

function tacticalProof(entry, previous, own) {
  if (detectMaterialRealization(entry, previous, own)) return null
  const immediate = checkingMajorFork(entry) ?? newQueenEvasionWinningMajor(entry, previous, own)
    ?? knightPawnEvasionExploitingQueenPin(entry)
  if (immediate) return immediate
  if (!newBishopRookSkewer(entry)) return null
  const certificate = proveBishopSkewerGain(entry)
  return certificate.status === 'proved' && verifyBishopSkewerGain(entry, certificate)
    ? { kind: 'verified-bishop-rook-skewer', ...certificate } : null
}

export function classifyGrandeCandidateV3(input, previous = null, previousOwn = null, extraEvidence = null,
  published = classifySpecialMove(input, previous, previousOwn, extraEvidence)) {
  const evidence = [], base = { version: GRANDE_CANDIDATE_V3_VERSION,
    publishedClassification: published.classification,
    publishedEvidenceKind: published.specialAssessment?.grande?.evidenceKind ?? null,
    inheritance: null, evidence }
  const finish = (classification, verdict, reason, details = {}) => {
    const candidateAssessment = { ...base, classification, verdict, reason, ...details }
    const specialAssessment = published.specialAssessment && { ...published.specialAssessment,
      grande: { status: classification === 'great' ? 'supported' : verdict === 'excluded' ? 'rejected' : 'insufficient',
        reason, evidenceKind: candidateAssessment.evidenceKind ?? 'insufficient',
        ...(candidateAssessment.proof ? { tactic: candidateAssessment.proof } : {}) },
      events: (published.specialAssessment.events ?? []).filter(event => event.status !== 'supported') }
    const result = annotateClassification({ ...published, classification, candidateAssessment,
      ...(specialAssessment ? { specialAssessment } : {}) }, published)
    return result
  }
  // Book, forced moves, mate, missed opportunities and other categories retain published semantics.
  if (!['best', 'excellent', 'great'].includes(published.classification) || input.isBookMove
    || input.moveFacts?.forced || input.playedMate === 0) {
    return annotateClassification({ ...published, candidateAssessment: { ...base,
      classification: published.classification, verdict: 'not-applicable', reason: 'outside-grande-scope' } }, published)
  }
  const ordinary = published.classification === 'great'
    ? input.numericalClassification ?? input.baseClassification ?? 'best' : published.classification
  try {
    const [entry, prior, own] = normalizeAnalysisBounds([input, previous, previousOwn])
    position(entry)
    const motif = queenAttackRelativePinMotif(entry)
    // Validate each available packet independently; an invalid packet cannot hide a valid ordinary pair.
    const pairs = [{ source: 'ordinary', root: entry.engine, child: entry.playedEngine }]
    for (const [source, raw, validate] of [
      ['native-decision', entry.nativeDecisionProof, nativeProofFor],
      ['grande-decision', entry.grandeDecisionProof, grandeProofFor],
      ['archive-native', entry.refinement?.nativeProof, nativeProofFor],
      ['archive-grande', entry.refinement?.grandeProof, grandeProofFor],
    ]) {
      if (!raw) continue
      const packet = validate(entry, raw)
      if (packet?.root && packet.child) pairs.push({ source, ...packet })
      else evidence.push({ source, kind: 'insufficient', reason: 'invalid-or-incomplete-supplemental-pair' })
    }
    let confirmed = null
    for (const pair of pairs) {
      try {
        const engine = completed(pair.root, entry.fenBefore), child = completed(pair.child, entry.fenAfter)
        if (!engine || !child) {
          evidence.push({ source: pair.source, kind: 'insufficient', reason: 'missing-or-invalid-completed-evidence' })
          continue
        }
        const current = classifyReviewedMove({ ...entry, engine, playedEngine: child })
        if (current.evaluationEvidence?.status !== 'coherent'
          || current.evaluationEvidence.source !== 'completed-snapshot'
          || analysisMetadataKey(engine.analysisMetadata) !== analysisMetadataKey(child.analysisMetadata)
          || Math.abs(current.playedProbability - (1 - index(child.lines[0]))) > SPECIAL_POLICY.consistency) {
          evidence.push({ source: pair.source, kind: 'insufficient', reason: 'missing-or-conflicting-played-comparison' })
          continue
        }
        const proof = tacticalProof(current, prior, own)
        const maintained = Math.min(current.playedProbability, 1 - index(child.lines[0]))
        const quality = ['best', 'excellent'].includes(current.classification)
          && current.dropPct <= ENGINE_CONFIG.classification.excellent && maintained >= SPECIAL_POLICY.good
        const record = { source: pair.source, kind: proof && quality ? 'tactical-confirmed' : 'comparative',
          rootDepth: engine.depth, childDepth: child.depth, analyzed: engine.lines.length,
          legal: new Chess(entry.fenBefore).moves().length, maintainedIndex: maintained,
          dropPct: current.dropPct, quality, ...(proof ? { proof } : {}) }
        evidence.push(record)
        if (proof && quality && !confirmed) confirmed = record
      } catch {
        evidence.push({ source: pair.source, kind: 'insufficient', reason: 'invalid-position-or-evidence' })
      }
    }
    if (motif) evidence.push({ source: 'legal-position', kind: 'observed', motif })
    // All evidence is collected before choosing a verdict; observations never veto certificates.
    if (confirmed) return finish('great', 'confirmed', 'verified-tactical-certificate', {
      evidenceKind: 'tactical-confirmed', proof: confirmed.proof, provenance: confirmed, motif })
    const v2 = classifyGrandeCandidateV2(entry, prior, own, extraEvidence, published)
    if (v2.classification === 'great' && published.classification === 'great') {
      return finish('great', 'inconclusive', v2.candidateAssessment.reason, {
        inheritance: v2.candidateAssessment.inheritance ?? 'comparative',
        evidenceKind: evidence.some(e => e.kind === 'comparative') ? 'comparative' : 'insufficient', motif })
    }
    return finish(ordinary, v2.candidateAssessment.verdict === 'excluded' ? 'excluded' : 'inconclusive',
      motif ? 'relative-pin-motif-not-a-forced-tactic-proof' : evidence.some(e => e.kind === 'comparative')
        ? 'comparison-without-tactical-certificate' : 'missing-or-invalid-completed-evidence', {
        evidenceKind: motif ? 'observed' : evidence.some(e => e.kind === 'comparative') ? 'comparative' : 'insufficient', motif })
  } catch {
    return finish(ordinary, 'inconclusive', 'invalid-position-or-evidence', { evidenceKind: 'insufficient' })
  }
}

// Identical published history for each decision; candidate labels never feed subsequent decisions.
export function reclassifyGrandeCandidateV3(entries = []) {
  const published = reclassifyReviewedMoves(entries)
  return published.map((entry, i) => classifyGrandeCandidateV3(entry, published[i - 1], published[i - 2], null, entry))
}
