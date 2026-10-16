// Experimental: a unique side of the symmetric expected-score boundary.
// This is an advantage comparison, not a claim of a forced or likely win.
import { Chess } from 'chess.js'
import { validGrandeSearch } from '../../src/lib/grandeProofs.js'
import { nativeWdlInterval } from '../../src/lib/nativeWdl.js'
import { calculateWinProbability } from '../../src/lib/evaluation.js'
import { SPECIAL_POLICY } from '../../src/lib/specialPolicy.js'
import { classifyReviewedMove } from '../../src/lib/reviewEvaluation.js'
import { detectMaterialRealization } from '../../src/lib/materialRealization.js'
import { restoredMateRoute } from '../../src/lib/restoredMateRoute.js'
import { legalForcingConsequence } from '../../src/lib/responseEvidence.js'
import { nativeProofFor } from '../../src/lib/nativeEvidence.js'

export function edgeChoicePotential(entry, previous, previousOwn) {
  try {
    const proof = nativeProofFor(entry, entry.nativeDecisionProof)
    if (!proof?.root || !proof.child || entry.isBookMove || entry.moveFacts?.forced) return null
    const root = proof.root, child = proof.child, lines = root.specialLines
    if (lines.length !== 5 || root.bestmove !== entry.playedUci || lines[0].pv[0] !== entry.playedUci
      || root.analysisMetadata.engine.version !== '19' || child.analysisMetadata.engine.version !== '19') return null
    const board = new Chess(entry.fenBefore), u = entry.playedUci
    board.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] })
    if (board.fen() !== entry.fenAfter) return null
    const current = classifyReviewedMove({ ...entry, engine: root, playedEngine: child })
    if (current.classification !== 'best' || current.evaluationEvidence?.status !== 'coherent'
      || current.evaluationEvidence.source !== 'completed-snapshot') return null
    if (detectMaterialRealization(entry, previous, previousOwn) || restoredMateRoute(entry, previous, previousOwn)) return null
    const forcing = legalForcingConsequence(entry)
    if (!forcing.applicable || !['check', 'mate-threat', 'new-material-threat'].includes(forcing.kind)) return null
    const primary = child.specialLines[0]
    if ([...lines, primary].some(l => l.mate != null)) return null
    if (Math.abs(calculateWinProbability(lines[0].evalCp) - (1 - calculateWinProbability(primary.evalCp))) > SPECIAL_POLICY.consistency) return null
    const played = nativeWdlInterval(entry.fenBefore, lines[0].evalCp)
    const confirmed = nativeWdlInterval(entry.fenAfter, -primary.evalCp)
    const alternatives = lines.slice(1).map(l => nativeWdlInterval(entry.fenBefore, l.evalCp))
    if (!played || !confirmed || alternatives.some(a => !a)) return null
    if (Math.min(played.bounds.points.min, confirmed.bounds.points.min) <= 0.5
      || alternatives.some(a => a.bounds.points.max >= 0.5)) return null
    return { played, confirmed, alternatives, forcing, root, child }
  } catch { return null }
}

export function corroboratedEdgeChoice(entry, previous, previousOwn) {
  const potential = edgeChoicePotential(entry, previous, previousOwn)
  if (!potential) return null
  const proof = nativeProofFor(entry, entry.nativeDecisionProof), alternatives = []
  if (proof.alternatives.length !== 4) return null
  for (const [i, line] of potential.root.specialLines.slice(1).entries()) {
    const record = proof.alternatives.find(r => r.uci === line.pv[0])
    if (!record || !validGrandeSearch(record.engine, record.fen)) return null
    const primary = record.engine.specialLines[0]
    if (primary.mate != null || Math.abs(calculateWinProbability(line.evalCp) - (1 - calculateWinProbability(primary.evalCp))) > SPECIAL_POLICY.consistency) return null
    const checked = nativeWdlInterval(record.fen, -primary.evalCp)
    if (!checked || checked.bounds.points.max >= 0.5) return null
    alternatives.push({ uci: record.uci, root: potential.alternatives[i].bounds, child: checked.bounds })
  }
  return { kind: 'unique-corroborated-native-advantage', version: 'native-edge-v1', forcing: potential.forcing,
    played: potential.played.bounds, confirmed: potential.confirmed.bounds, alternatives,
    boundary: 'symmetric-expected-score-half', inferredFromRoundedCp: true,
    proofScope: 'completed-top-five-with-independent-children', proofAgainstEveryDefense: false }
}
