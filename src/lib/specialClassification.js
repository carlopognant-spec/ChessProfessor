import {corroboratedEdgeChoice,edgeChoicePotential} from './nativeEdgeChoice.js'
import {newQueenEvasionWinningMajor} from './queenEvasion.js'
import {knightPawnEvasionExploitingQueenPin} from './knightPinEvasion.js'
import {newBishopRookSkewer,proveBishopSkewerGain,verifyBishopSkewerGain} from './bishopSkewer.js'
import {restoredMateRoute} from './restoredMateRoute.js'
import {nativeWinningChoice,nativeWinningPotential} from './nativeWinningChoice.js'
import {nativeProofFor,nativeAlternativeFen} from './nativeEvidence.js'
import {newRookKingFileAccess,verifiedRookAttackParticipation} from './rookAccess.js'
import {newDiscoveredChecks} from './discoveredCheck.js'
import {newMatingThreat} from './matingThreat.js'
import {grandeProofFor,validGrandeSearch} from './grandeProofs.js'
import {classifyReviewedMove} from './reviewEvaluation.js'
import {deferredForcingResponse} from './deferredResponse.js'
import {checkingAttackerCapture,checkingMajorFork} from './tacticalEvidence.js'
import { Chess } from 'chess.js'
import { calculateWinProbability } from './evaluation.js'
import { classifyMoveOpportunity } from './moveOpportunities.js'
import { detectMaterialRealization } from './materialRealization.js'
import { collectSacrificeEvidence, confirmedCompensation, assessImmediateRecoveries, preExistingAlternativeOffer } from './sacrificeEvidence.js'
import { classifyAnalysisEntries, moveEvaluationFields } from './classification.js'
import { ENGINE_CONFIG } from './engineConfig.js'
import { REVIEW_POLICY_VERSION } from './reviewEvaluation.js'
import { assessForcingResponse } from './responseEvidence.js'
import { retainEstablishedWinningBlunder } from './opportunityEpisodes.js'

import { SPECIAL_POLICY } from './specialPolicy.js'
export { SPECIAL_POLICY } from './specialPolicy.js'
const value = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
const uciOf = move => `${move.from}${move.to}${move.promotion ?? ''}`
const material = (game, side) => game.board().flat().filter(Boolean)
  .reduce((sum, piece) => sum + (piece.color === side ? 1 : -1) * value[piece.type], 0)
const primary = engine => engine?.lines?.find(line => line.multipv === 1) ?? engine
function play(game, uci) {
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci ?? '')) throw Error('Invalid UCI')
  return game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
}
function score(line) {
  if (!line || !Number.isInteger(line.depth) || line.depth < 1 || line.bound
    || /\b(?:upperbound|lowerbound)\b/.test(line.raw ?? '')) return null
  if (Number.isInteger(line.mate) && line.mate !== 0) return Number(line.mate > 0)
  return line.mate == null && Number.isFinite(line.evalCp) ? calculateWinProbability(line.evalCp) : null
}
function replay(fen, pv, side, baseline) {
  if (!Array.isArray(pv) || !pv.length || pv.length > 256) throw Error('Missing or excessive PV')
  const game = new Chess(fen), events = []
  for (const uci of pv) {
    const move = play(game, uci)
    events.push({ uci, san: move.san, captured: move.captured ?? null,
      materialDelta: material(game, side) - baseline })
  }
  return { events, mate: game.isCheckmate(), settled: !game.isCheck()
    && events.length >= 2 && events.slice(-2).every(event => !event.captured)
    && !events.slice(-2).some(event => /[qrbn]$/.test(event.uci)) }
}
function rootEvidence(entry, before, side, baseline) {
  const snapshot = entry.engine?.specialLines != null
  const rawLines = [...(entry.engine?.specialLines ?? entry.engine?.lines ?? [])].sort((a, b) => a.multipv - b.multipv)
  const legal = before.moves({ verbose: true }).map(uciOf)
  if (rawLines.length < 2) return { status: 'insufficient', reason: 'missing-alternatives' }
  const requested = entry.engine?.analysisMetadata?.multiPv
  if (requested && rawLines.length < Math.min(requested, legal.length)) return { status: 'insufficient', reason: 'incomplete-multipv' }
  if (rawLines.some(line => !legal.includes(line.pv?.[0]))) {
    return { status: 'insufficient', reason: 'duplicate-or-illegal-roots' }
  }
  if (rawLines.some((line, index) => line.multipv !== index + 1 || score(line) == null)) {
    return { status: 'insufficient', reason: 'incomparable-root-scores' }
  }
  const groups = new Map()
  for (const line of rawLines) {
    replay(entry.fenBefore, line.pv, side, baseline)
    const group = groups.get(line.pv[0]) ?? []
    group.push(line); groups.set(line.pv[0], group)
  }
  const depth = rawLines[0].depth, discarded = []
  const lines = []
  for (const group of groups.values()) {
    if (group.length > 1 && (snapshot || new Set(group.map(line => line.depth)).size !== group.length)) {
      return { status: 'insufficient', reason: 'duplicate-or-illegal-roots' }
    }
    const selected = group.find(line => line.depth === depth)
      ?? [...group].sort((a, b) => b.depth - a.depth)[0]
    lines.push(selected)
    discarded.push(...group.filter(line => line !== selected).map(line => ({ uci: line.pv[0], depth: line.depth })))
  }
  lines.sort((a, b) => a.multipv - b.multipv)
  if (lines[0] !== rawLines[0] || lines.length < 2) return { status: 'insufficient', reason: 'missing-alternatives' }
  if (snapshot && lines.some(line => line.depth !== depth)) return { status: 'insufficient', reason: 'incomparable-root-scores' }
  const scores = lines.map(score)
  if (scores.some((s, index) => lines.slice(0, index).some((earlier, prior) =>
    earlier.depth === lines[index].depth && s > scores[prior]))) {
    return { status: 'insufficient', reason: 'inconsistent-root-order' }
  }
  const parsed = lines.map(line => ({ uci: line.pv[0], score: score(line), depth: line.depth,
    ...replay(entry.fenBefore, line.pv, side, baseline) }))
  const compared = lines.filter(line => line.depth === depth).length
  return { status: 'available', lines: parsed, raw: lines, coherent: !discarded.length && compared === lines.length,
    coverage: { analyzed: compared, available: lines.length, legal: legal.length,
      allLegal: compared === legal.length,
      scope: compared === legal.length ? 'all-legal-moves' : 'analyzed-alternatives',
      source: snapshot ? 'completed-snapshot' : 'legacy-lines', discarded } }
}

// This fixed empirical family predates the counterfactual model. It does not
// claim uniqueness among alternatives and must be presented as experimental.
function equivalentResponseAlternative(entry, roots) {
  const requested = entry.engine?.analysisMetadata?.multiPv
  if (roots.status !== 'available' || !roots.coherent || roots.coverage.source !== 'completed-snapshot'
    || !Number.isSafeInteger(requested) || requested < 2 || entry.engine.analysisMetadata.searchMoves
    || roots.raw.length !== Math.min(requested, roots.coverage.legal)
    || roots.raw.some(line => line.bound || line.lowerbound || line.upperbound)
    || roots.lines[0].uci !== entry.playedUci || roots.raw[0].mate != null
    || primary(entry.engine)?.mate != null || primary(entry.engine)?.pv?.[0] !== entry.playedUci
    || score(primary(entry.engine)) == null
    || Math.abs(score(primary(entry.engine)) - roots.lines[0].score) > SPECIAL_POLICY.consistency) return null
  const alternative = roots.lines.slice(1).find((line, index) => roots.raw[index + 1].mate == null
    && 100 * (roots.lines[0].score - line.score) <= ENGINE_CONFIG.classification.excellent)
  return alternative ? { uci: alternative.uci, lossPct: 100 * (roots.lines[0].score - alternative.score),
    depth: alternative.depth, san: alternative.events.map(e => e.san).slice(0, 8) } : null
}
function responseDecision(entry, previous, before, side, baseline, roots) {
  if (!previous || entry.classification !== 'best' || entry.isEngineBest === false
    || !opponentContext(entry, { ...previous, isBookMove: false })) return null
  const move = play(new Chess(entry.fenBefore), entry.playedUci)
  const checkingCapture = move.captured ? checkingAttackerCapture(entry, previous) : null
  if (move.captured && !checkingCapture) return null
  const root = primary(entry.engine), child = primary(entry.playedEngine)
  const best = score(root), after = score(child)
  if (root?.pv?.[0] !== entry.playedUci || best == null || after == null
    || Math.abs(best - (1 - after)) > SPECIAL_POLICY.consistency) return null
  if (score(primary(previous.engine)) == null || score(primary(previous.playedEngine)) == null) return null
  const fields = moveEvaluationFields(previous.engine, previous.playedEngine, previous.playedUci)
  const previousPlayedRoot = previous.engine?.lines?.find(line => line.pv?.[0] === previous.playedUci)
  if (fields.evaluationSource === 'root-pv' && score(previousPlayedRoot) == null) return null
  const [numerical] = classifyAnalysisEntries([{ ...previous, ...fields, isBookMove: false }])
  const matingThreat = !move.captured && numerical.classification === 'inaccuracy' ? newMatingThreat(entry) : null
  const discovery = !move.captured && ['inaccuracy', 'mistake', 'blunder'].includes(numerical.classification) ? newDiscoveredChecks(entry) : null
  if ((matingThreat || discovery) && Math.min(best, 1 - after) < SPECIAL_POLICY.good) return null
  if (!matingThreat && !discovery && !(checkingCapture ? ['inaccuracy', 'mistake', 'blunder'] : ['mistake', 'blunder']).includes(numerical.classification)) return null
  const variation = replay(entry.fenBefore, root.pv, side, baseline)
  replay(entry.fenAfter, child.pv, side, baseline)
  if (checkingCapture) {
    if (Math.min(best, 1 - after) < SPECIAL_POLICY.good) return null
    return { status: 'supported', reason: 'active-checking-attacker-capture', evidenceKind: 'tactical-family',
      modelVersion: 'checking-attacker-recovery-v1', tactic: checkingCapture,
      previousPly: previous.ply, previousMove: previous.playedMove,
      previousNumericalClassification: numerical.classification,
      bestIndex: best, afterIndex: 1 - after,
      coverage: { analyzed: 1, legal: before.moves().length, allLegal: false, scope: 'best-move-and-legal-check-evasion' } }
  }
  const forcing = assessForcingResponse(entry, roots)
  if (forcing.applicable && forcing.kind === 'no-forcing-event' && !discovery) return {
    status: 'rejected', reason: 'no-forcing-response-established', forcing }
  const deferred = deferredForcingResponse(entry, roots, forcing)
  if (deferred) return { status: 'rejected', reason: 'forcing-response-can-be-delayed', deferred }
  const equivalent = equivalentResponseAlternative(entry, roots)
  if (equivalent) return { status: 'rejected', reason: 'near-equivalent-response-alternative',
    previousPly: previous.ply, previousMove: previous.playedMove,
    previousNumericalClassification: numerical.classification, coverage: roots.coverage, alternative: equivalent }
  if (discovery) return { status: 'supported', reason: 'new-discovered-check-after-opponent-error',
    evidenceKind: 'tactical-family', modelVersion: 'discovered-check-preparation-v1', tactic: discovery,
    previousPly: previous.ply, previousMove: previous.playedMove, previousNumericalClassification: numerical.classification,
    bestIndex: best, afterIndex: 1 - after,
    coverage: { analyzed: 1, legal: before.moves().length, allLegal: false, scope: 'best-move-and-new-discovered-checks' } }
  if (matingThreat) return { status: 'supported', reason: 'new-mating-threat-after-inaccuracy',
    evidenceKind: 'tactical-family', modelVersion: 'new-mating-threat-response-v1', tactic: matingThreat,
    previousPly: previous.ply, previousMove: previous.playedMove, previousNumericalClassification: numerical.classification,
    bestIndex: best, afterIndex: 1 - after,
    coverage: { analyzed: 1, legal: before.moves().length, allLegal: false, scope: 'best-move-and-new-mating-threat' } }
  return { status: 'supported', reason: 'best-noncapture-after-opponent-error',
    ...(forcing.applicable ? { forcing } : {}),
    modelVersion: 'grande-prudent-candidate-v1', evidenceKind: 'empirical-family',
    previousPly: previous.ply, previousMove: previous.playedMove,
    previousNumericalClassification: numerical.classification,
    bestIndex: best, afterIndex: 1 - after,
    coverage: { analyzed: 1, legal: before.moves().length, allLegal: false, scope: 'best-move-and-opponent-error' },
    continuation: variation.events.slice(0, 8).map(event => event.san) }
}
function equilibriumRecovery(entry, previous, previousOwn, roots, maintained) {
  const context = opponentContext(entry, previous && { ...previous, isBookMove: false })
  if (!context || !roots.coherent || maintained < SPECIAL_POLICY.good || maintained > SPECIAL_POLICY.nonWinning
    || context.before > SPECIAL_POLICY.poor || context.createdGain < SPECIAL_POLICY.gap
    || roots.lines[0].uci !== entry.playedUci
    || roots.lines.some(line => line.uci !== entry.playedUci && line.score >= SPECIAL_POLICY.good)
    || detectMaterialRealization(entry, previous, previousOwn)) return null
  const afterOpponent = score(primary(previous.playedEngine))
  if (afterOpponent == null || Math.abs(afterOpponent - context.available) > SPECIAL_POLICY.consistency) return null
  const fields = moveEvaluationFields(previous.engine, previous.playedEngine, previous.playedUci)
  const selected = previous.engine?.lines?.find(line => line.pv?.[0] === previous.playedUci)
  if (fields.evaluationSource === 'root-pv' && score(selected) == null) return null
  const [prior] = classifyAnalysisEntries([{ ...previous, ...fields, isBookMove: false }])
  if (!['mistake', 'blunder'].includes(prior.classification)) return null
  const side = new Chess(previous.fenBefore).turn()
  replay(previous.fenBefore, primary(previous.engine).pv, side, 0)
  replay(previous.fenAfter, primary(previous.playedEngine).pv, side, 0)
  const alternative = roots.lines.filter(line => line.uci !== entry.playedUci).sort((a, b) => b.score - a.score)[0]
  return { status: 'supported', reason: 'equilibrium-recovery', coverage: roots.coverage,
    context, previousNumericalClassification: prior.classification, maintainedIndex: maintained,
    alternative: { uci: alternative.uci, san: alternative.events.map(event => event.san).slice(0, 8) } }
}

// A request selector only: the root estimate is not a substitute for child proof.
export function pendingGrandeRecovery(entry, previous, previousOwn) {
  if (entry.classification !== 'best' || entry.isBookMove || entry.moveFacts?.forced
    || entry.playedMate === 0 || entry.isEngineBest !== true) return false
  try {
    const board = new Chess(entry.fenBefore), side = board.turn()
    const roots = rootEvidence(entry, board, side, material(board, side))
    if (roots.status !== 'available' || !roots.coherent || roots.coverage.source !== 'completed-snapshot'
      || roots.lines[0].uci !== entry.playedUci) return false
    const child = score(primary(entry.playedEngine)), latest = score(primary(entry.engine))
    if (latest == null || primary(entry.engine).pv?.[0] !== entry.playedUci
      || Math.abs(latest - roots.lines[0].score) > SPECIAL_POLICY.consistency
      || child != null && 1 - child >= SPECIAL_POLICY.good) return false
    return Boolean(equilibriumRecovery(entry, previous, previousOwn, roots, roots.lines[0].score))
  } catch { return false }
}

function applyGrandeDecisionProof(result, entry, previous, previousOwn) {
  if (result.classification !== 'best' || result.isBookMove || result.moveFacts?.forced) return result
  const proof = grandeProofFor(entry, entry.grandeDecisionProof)
  if (!proof?.root || !proof.child || !previous) return result
  // Temporary comparisons belong to the proof. All fields shown in the ordinary
  // profile, and the neighboring entries, remain attached to their own searches.
  const current = classifyReviewedMove({ ...entry, engine: proof.root, playedEngine: proof.child })
  if (current.classification !== 'best' || current.isEngineBest !== true
    || current.evaluationEvidence?.source !== 'completed-snapshot'
    || current.evaluationEvidence.status !== 'coherent') return result
  const prior = classifyReviewedMove({ ...previous, playedEngine: proof.root })
  const checked = classifySpecialMove(current, prior, previousOwn)
  if (checked.classification !== 'great' || checked.specialAssessment?.grande.status !== 'supported') return result
  const grande = { ...checked.specialAssessment.grande, decisionProof: {
    version: proof.version, nodes: proof.root.analysisMetadata.budget.value,
    source: 'supplemental-special-verification', numericalProfileUnchanged: true } }
  return { ...result, classification: 'great', specialAssessment: { ...result.specialAssessment,
    grande, coverage: checked.specialAssessment.coverage,
    events: [...result.specialAssessment.events, { kind: 'supplemental-grande-proof', status: 'supported' }] } }
}
function opponentContext(entry, previous) {
  if (!previous || previous.isBookMove || previous.fenAfter !== entry.fenBefore) return null
  try {
    const game = new Chess(previous.fenBefore), side = game.turn()
    play(game, previous.playedUci)
    if (game.fen() !== entry.fenBefore || game.turn() === side) return null
    // The review pipeline has already selected a valid completed comparison.
    // Reusing it avoids changing the apparent gain with a later partial PV.
    const prior = previous.evaluationEvidence?.version === REVIEW_POLICY_VERSION
      ? previous.bestProbability : score(primary(previous.engine))
    const current = entry.evaluationEvidence?.version === REVIEW_POLICY_VERSION
      ? entry.bestProbability : score(primary(entry.engine))
    if (![prior, current].every(v => Number.isFinite(v) && v >= 0 && v <= 1)) return null
    return { previousPly: previous.ply ?? null, previousMove: previous.playedMove ?? null,
      before: 1 - prior, available: current, createdGain: current - (1 - prior) }
  } catch { return null }
}
function offers(fenBefore, fenAfter, side, baseline) {
  const before = new Chess(fenBefore), game = new Chess(fenAfter)
  return game.moves({ verbose: true }).filter(move => ['n', 'b', 'r', 'q'].includes(move.captured)).flatMap(move => {
    const accepted = new Chess(fenAfter); play(accepted, uciOf(move))
    const delta = material(accepted, side) - baseline
    if (delta > -SPECIAL_POLICY.sacrificeLoss) return []
    const piece = game.get(move.to)
    const movedPiece = before.get(move.to)?.color !== piece.color || before.get(move.to)?.type !== piece.type
    return [{ uci: uciOf(move), san: move.san, square: move.to, type: piece.type, delta, movedPiece }]
  })
}
function brilliantEvidence(entry, roots, side, baseline, previousOwn, previous, extraEvidence = null) {
  const offered = offers(entry.fenBefore, entry.fenAfter, side, baseline)
  const rookAccess = roots.raw.every(l=>l.mate==null) && primary(entry.engine)?.mate==null && primary(entry.playedEngine)?.mate==null
    ? newRookKingFileAccess(entry) : null
  if (!offered.length) return { status: 'rejected', reason: 'no-material-offer' }
  const acceptedLines = entry.playedEngine?.specialLines ?? entry.playedEngine?.lines ?? []
  const acceptanceDepth = acceptedLines.find(line => line.multipv === 1)?.depth
  const qualifying = [], incomplete = []
  for (const offer of offered) {
    // Track the played piece by identity, rather than merely its destination.
    const moved = play(new Chess(entry.fenBefore), entry.playedUci)
    offer.movedPiece = offer.square === moved.to
    if (!offer.movedPiece) {
      if (!previousOwn || !previous || previousOwn.fenAfter !== previous.fenBefore
        || previous.fenAfter !== entry.fenBefore || previousOwn.ply !== entry.ply - 2
        || previous.ply !== entry.ply - 1) { incomplete.push('missing-offer-history'); continue }
      const earlier = new Chess(previousOwn.fenAfter), piece = earlier.get(offer.square)
      if (earlier.turn() === side) { incomplete.push('invalid-offer-history'); continue }
      if (piece?.type === offer.type && piece.color === side && earlier.moves({ verbose: true })
        .some(move => move.to === offer.square && move.captured === offer.type)) {
        if (!rookAccess) return { status: 'rejected', reason: 'persistent-offer' }
        offer.persistent = true
      }
    }
    let matching = acceptedLines.filter(line => line.pv?.[0] === offer.uci)
    let source = 'played-child-search', depth = acceptanceDepth
    const scoped = extraEvidence?.fen === entry.fenAfter
      ? extraEvidence.acceptanceSearches?.find(r => r.captureUci === offer.uci) : null
    if (scoped) {
      matching = [scoped.line]; depth = scoped.line.depth; source = scoped.source
    } else if (!matching.length && !entry.playedEngine?.lines?.some(line => line.pv?.[0] === offer.uci)
      && extraEvidence?.fen === entry.fenAfter) {
      matching = extraEvidence.acceptanceLines.filter(line => line.pv?.[0] === offer.uci)
      depth = extraEvidence.acceptanceLines[0]?.depth; source = extraEvidence.source
    }
    if (matching.length !== 1 || score(matching[0]) == null
      || matching[0].depth !== depth) { incomplete.push('missing-acceptance-analysis'); continue }
    const acceptance = matching[0]
    if (1 - score(acceptance) < SPECIAL_POLICY.good) return { status: 'rejected', reason: 'uncompensated-acceptance' }
    const continuation = replay(entry.fenAfter, acceptance.pv, side, baseline)
    const accepted = new Chess(entry.fenAfter); play(accepted, offer.uci)
    const recoveries = accepted.moves({ verbose: true }).filter(move => move.captured).filter(move => {
      const recovered = new Chess(accepted.fen()); play(recovered, uciOf(move))
      return material(recovered, side) >= baseline
    })
    if (continuation.events[1]?.captured && continuation.events[1].materialDelta >= 0) {
      return { status: 'rejected', reason: 'ordinary-exchange' }
    }
    // A material recovery outside the chosen PV does not invalidate a scored,
    // complete mating continuation that keeps the sacrifice on its next move.
    const verifiedMatingEstimate = acceptance.mate < 0 && continuation.mate
      && continuation.events.length === 2 * Math.abs(acceptance.mate)
    const corroboration = continuation.events.length >= 2 && extraEvidence?.allowConfirmation !== false
      ? confirmedCompensation(extraEvidence, offer.uci, accepted.fen(), acceptance, SPECIAL_POLICY) : null
    const rookActivation = offer.persistent && rookAccess ? verifiedRookAttackParticipation(entry,rookAccess,acceptance.pv) : null
    if (offer.persistent && !rookActivation) return { status: 'rejected', reason: 'persistent-offer' }
    if (rookActivation && !corroboration) { incomplete.push('unresolved-tactical-sequence'); continue }
    const recoveryAssessment = recoveries.length && corroboration
      ? assessImmediateRecoveries(extraEvidence, offer.uci, accepted.fen(), recoveries.map(uciOf), SPECIAL_POLICY) : null
    if (recoveries.length && !verifiedMatingEstimate && !recoveryAssessment) {
      incomplete.push('unresolved-immediate-recovery'); continue
    }
    if (!continuation.mate && !continuation.settled && !corroboration) { incomplete.push('unresolved-tactical-sequence'); continue }
    qualifying.push({ ...offer, continuation: continuation.events.slice(0, 12),
      compensation: 'engine-estimate', afterIndex: 1 - score(acceptance),
      ...(rookActivation ? {rookActivation} : {}),
      ...(offer.movedPiece && verifiedMatingEstimate && new Chess(entry.fenAfter).isCheck()
        && new Chess(entry.fenAfter).moves({ verbose: true }).length === 1
        && uciOf(new Chess(entry.fenAfter).moves({ verbose: true })[0]) === offer.uci
        ? { forcedMatingAcceptance: { acceptanceUci: offer.uci, legalReplies: 1,
          mateDistance: acceptance.mate, pv: [...acceptance.pv],
          proofScope: 'forced-first-response-and-verified-mating-pv', proofAgainstEveryDefense: false } } : {}),
      ...(extraEvidence ? { acceptanceSource: source, corroboration } : {}),
      ...(recoveryAssessment ? { recoveryAssessment } : {}) })
  }
  if (incomplete.length) return { status: 'candidate', reason: incomplete[0], offers: offered }
  if (!qualifying.length) return { status: 'rejected', reason: 'no-qualified-sacrifice' }
  for (const alternative of roots.lines.filter(line => line.uci !== entry.playedUci && line.score >= SPECIAL_POLICY.winning)) {
    const game = new Chess(entry.fenBefore); play(game, alternative.uci)
    const alternativeOffers = offers(entry.fenBefore, game.fen(), side, baseline)
    if (!alternativeOffers.length || alternativeOffers.every(other => preExistingAlternativeOffer(entry, other))
      || qualifying.every(offer => !offer.movedPiece
      && alternativeOffers.some(other => other.square === offer.square && other.type === offer.type))) {
      if (!qualifying.some(offer => offer.forcedMatingAcceptance || offer.rookActivation)) {
        return { status: 'rejected', reason: 'winning-alternative-without-new-sacrifice' }
      }
    }
  }
  return { status: 'supported', reason: qualifying.some(o=>o.rookActivation) ? 'compensated-rook-activation' : 'compensated-new-offer', offers: qualifying,
    coverage: roots.coverage, defenseScope: 'all-legal-acceptances-and-engine-best-defense' }
}

export function classifySpecialMove(input, previous = null, previousOwn = null, extraEvidence = null) {
  // Recompute this policy's own labels when opening saved analysis.
  const entry = ['counterfactual-v1', 'counterfactual-v2', 'counterfactual-v3', 'counterfactual-v4',
    'counterfactual-v5', 'counterfactual-v6', 'counterfactual-v7', 'counterfactual-v8', 'counterfactual-v9', 'counterfactual-v10', 'counterfactual-v11', 'counterfactual-v12', 'counterfactual-v13', 'counterfactual-v14', 'counterfactual-v15', 'counterfactual-v16', 'counterfactual-v17', 'counterfactual-v18', 'counterfactual-v19', 'counterfactual-v20', 'counterfactual-v21', 'counterfactual-v22', 'counterfactual-v23', 'stable-compensation-v1-candidate', SPECIAL_POLICY.version].includes(input.specialAssessment?.version)
    ? { ...input, classification: input.baseClassification ?? input.classification } : input
  let result = classifyMoveOpportunity(entry, previous)
  result = retainEstablishedWinningBlunder(result, entry, previous, previousOwn)
  const baseClassification = result.baseClassification ?? result.classification
  const assessment = { version: SPECIAL_POLICY.version, numericalClassification: baseClassification,
    events: [], grande: { status: 'rejected', reason: 'not-eligible' },
    brilliant: { status: 'rejected', reason: 'not-eligible' } }
  result = { ...result, specialAssessment: assessment }
  const finish = () => assessment.brilliant.status === 'supported' ? { ...result, classification: 'brilliant' }
    : assessment.grande.status === 'supported' ? { ...result, classification: 'great' } : result
  if (result.opportunityAssessment?.status === 'retain-numerical') {
    assessment.events.push({ kind: 'restored-own-winning-chance', status: 'observed' })
    return result
  }
  if (result.classification === 'missed') {
    assessment.events.push({ kind: result.missedOpportunity?.kind ?? 'winning-opportunity', status: 'supported' })
    return result
  }
  if (['book', 'unclassified', 'great', 'brilliant'].includes(result.classification) || result.isBookMove || result.playedMate === 0) return result
  try {
    const before = new Chess(entry.fenBefore), side = before.turn(), baseline = material(before, side)
    if (before.moves().length < 2) {
      assessment.grande = assessment.brilliant = { status: 'protected', reason: 'forced-or-terminal' }
      return result
    }
    const after = new Chess(entry.fenBefore); play(after, entry.playedUci)
    if (after.fen() !== entry.fenAfter) throw Error('FEN mismatch')
    if (after.isGameOver()) return result
    const roots = rootEvidence(entry, before, side, baseline)
    const responseAssessment = responseDecision(entry, previous, before, side, baseline, roots)
    const response = responseAssessment?.status === 'supported' ? responseAssessment : null
    if (responseAssessment) {
      assessment.grande = responseAssessment
      assessment.events.push({ kind: responseAssessment.reason, status: responseAssessment.status })
    }
    if (roots.status !== 'available') {
      assessment.brilliant = { status: 'insufficient', reason: roots.reason }
      assessment.grande = response ?? assessment.brilliant
      return finish()
    }
    const child = score(primary(entry.playedEngine))
    const played = roots.lines.find(line => line.uci === entry.playedUci)
    const context = opponentContext(entry, previous)
    assessment.context = context
    assessment.coverage = roots.coverage
    const best = roots.lines[0]
    const alternative = roots.lines.filter(line => line.uci !== best.uci && line.depth === best.depth)
      .sort((a, b) => b.score - a.score)[0]
    const latest = primary(entry.engine)
    if (latest?.pv?.[0] !== best.uci || score(latest) == null
      || Math.abs(score(latest) - best.score) > SPECIAL_POLICY.consistency) {
      assessment.brilliant = { status: 'insufficient', reason: 'snapshot-disagreement' }
      assessment.grande = response ?? assessment.brilliant
      return finish()
    }
    // Detect a newly created winning opportunity without requiring the opponent's
    // numerical category to cross a separate mistake threshold.
    if (context && context.before <= SPECIAL_POLICY.nonWinning
      && context.available >= SPECIAL_POLICY.winning && context.createdGain >= SPECIAL_POLICY.gap
      && child != null && (!played || Math.abs(played.score - (1 - child)) <= SPECIAL_POLICY.consistency)
      && 1 - child <= SPECIAL_POLICY.nonWinning && best.uci !== entry.playedUci) {
      const line = best.events.slice(0, 8)
      if (line.length >= 2 || best.mate) {
        assessment.events.push({ kind: 'winning-opportunity', status: 'supported' })
        return { ...result, classification: 'missed', missedOpportunityReason: 'counterfactual-winning-opportunity',
          missedOpportunity: { kind: 'winning-opportunity', previousPly: context.previousPly,
            previousMove: context.previousMove, beforeProbability: context.before,
            offeredProbability: context.available, bestProbability: best.score,
            playedProbability: 1 - child, alternative: { uci: line.map(e => e.uci), san: line.map(e => e.san) },
            policyVersion: SPECIAL_POLICY.version } }
      }
    }
    if (child != null && best.uci !== entry.playedUci && best.score >= SPECIAL_POLICY.good
      && 1 - child <= SPECIAL_POLICY.poor && best.score - (1 - child) >= SPECIAL_POLICY.gap
      && (!played || Math.abs(played.score - (1 - child)) <= SPECIAL_POLICY.consistency)) {
      assessment.events.push({ kind: 'missed-defense', status: 'supported', coverage: roots.coverage,
        alternative: { san: best.events.map(event => event.san).slice(0, 8) } })
    }
    if (!played || child == null || Math.abs(played.score - (1 - child)) > SPECIAL_POLICY.consistency) {
      assessment.brilliant = { status: 'insufficient', reason: 'missing-or-conflicting-played-score' }
      assessment.grande = response ?? assessment.brilliant
      return finish()
    }
    const maintained = Math.min(played.score, 1 - child)
    const checkingFork = baseClassification === 'best' && best.uci === entry.playedUci && maintained >= SPECIAL_POLICY.good
      && !detectMaterialRealization(entry, previous, previousOwn) ? checkingMajorFork(entry) : null
    if (checkingFork) assessment.grande = { status: 'supported', reason: 'verified-checking-major-fork',
      evidenceKind: 'tactical-family', modelVersion: 'checking-major-fork-v1', tactic: checkingFork,
      bestIndex: best.score, maintainedIndex: maintained, coverage: roots.coverage }
    if (['best', 'excellent'].includes(baseClassification) && maintained >= SPECIAL_POLICY.good) {
      assessment.brilliant = brilliantEvidence(entry, roots, side, baseline, previousOwn, previous, extraEvidence)
    }
    const recovery = baseClassification === 'best'
      ? equilibriumRecovery(entry, previous, previousOwn, roots, maintained) : null
    if (recovery) assessment.grande = recovery
    if (!roots.coherent && !response && baseClassification === 'best') {
      assessment.grande = { status: 'insufficient', reason: 'incomplete-common-depth-snapshot' }
    }
    if (alternative && baseClassification === 'best' && best.uci === entry.playedUci && maintained >= SPECIAL_POLICY.good) {
      const defense = alternative.score <= SPECIAL_POLICY.poor && best.score - alternative.score >= SPECIAL_POLICY.gap
        && roots.lines.every(line => line.uci === best.uci || line.score <= SPECIAL_POLICY.poor)
        && (roots.coherent || maintained <= SPECIAL_POLICY.nonWinning)
      const nativeChoice = nativeWinningChoice(entry,roots)
      const conversion = roots.coherent && maintained >= SPECIAL_POLICY.winning && alternative.score <= SPECIAL_POLICY.nonWinning
        && best.score - alternative.score >= SPECIAL_POLICY.gap || Boolean(nativeChoice)
      if (defense || conversion) {
        assessment.grande = { status: 'supported', reason: defense ? 'critical-defense' : nativeChoice ? 'critical-native-winning-choice' : 'critical-winning-choice',
          ...(nativeChoice&&!defense ? {nativeOutcome:nativeChoice} : {}),
          coverage: roots.coverage, bestIndex: best.score, alternativeIndex: alternative.score,
          alternative: { uci: alternative.uci, san: alternative.events.map(e => e.san).slice(0, 8) } }
        const realization = detectMaterialRealization(entry, previous, previousOwn)
        const restored = restoredMateRoute(entry,previous,previousOwn)
        if(restored){
          assessment.grande={...assessment.grande,status:'rejected',reason:'ordinary-mate-blocker-capture',restoration:restored}
          assessment.events.push({...restored,status:'observed'})
        } else if (realization?.kind === 'immediate-material-recovery' && !before.isCheck()) {
          assessment.grande = { ...assessment.grande, status: 'rejected', reason: 'ordinary-material-recovery', realization }
          assessment.events.push({ ...realization, status: 'observed' })
        } else if (realization && context && context.createdGain < SPECIAL_POLICY.gap) {
          assessment.grande = { ...assessment.grande, status: 'candidate', reason: 'decision-novelty-not-established', realization }
          assessment.events.push({ ...realization, status: 'observed' })
        }
      }
    }
    if(baseClassification==='best'&&roots.coherent&&best.uci===entry.playedUci&&maintained>=SPECIAL_POLICY.good
      &&entry.nativeDecisionProof
      &&validGrandeSearch(entry.engine,entry.fenBefore)&&validGrandeSearch(entry.playedEngine,entry.fenAfter)
      &&!detectMaterialRealization(entry,previous,previousOwn)&&!restoredMateRoute(entry,previous,previousOwn)){
      let tactic=newQueenEvasionWinningMajor(entry,previous,previousOwn)??knightPawnEvasionExploitingQueenPin(entry)
      if(!tactic&&newBishopRookSkewer(entry)){
        const searched=proveBishopSkewerGain(entry,{maxOwnMoves:2,maxNodes:100000})
        if(searched.status==='proved'&&verifyBishopSkewerGain(entry,searched))tactic={kind:'verified-bishop-rook-skewer',...searched}
      }
      if(tactic)assessment.grande={status:'supported',reason:'verified-major-piece-tactic',evidenceKind:'tactical-family',modelVersion:'legal-major-tactics-v1',tactic,bestIndex:best.score,maintainedIndex:maintained,coverage:roots.coverage}
    }
    if(assessment.grande.status!=='supported'&&baseClassification==='best'&&roots.coherent&&best.uci===entry.playedUci&&entry.nativeDecisionProof){
      const edge=corroboratedEdgeChoice(entry,previous,previousOwn)
      if(edge)assessment.grande={status:'supported',reason:'critical-native-advantage-choice',evidenceKind:'native-expected-score',nativeEdge:edge,coverage:roots.coverage}
    }
    if (assessment.grande.status === 'supported' && !response) assessment.events.push({ kind: assessment.grande.reason, status: 'supported' })
    if (assessment.brilliant.status === 'supported') assessment.events.push({ kind: 'compensated-sacrifice', status: 'supported' })
    return finish()
  } catch {
    assessment.grande = assessment.brilliant = { status: 'insufficient', reason: 'invalid-position-or-variation' }
    return result
  }
}

export function reclassifySpecialMoves(entries = []) {
  const results = []
  for (const [i, entry] of entries.entries()) {
    const result = classifySpecialMove(entry, results.at(-1), results.at(-2),
      collectSacrificeEvidence(entry, entries[i + 1], SPECIAL_POLICY))
    results.push(applyNativeDecisionProof(applyGrandeDecisionProof(result, entry, results.at(-1), results.at(-2)), entry, results.at(-1), results.at(-2)))
  }
  return results
}

// Only the previous move gains new evidence when its opponent is analyzed.
// Updating that move avoids re-running the entire game on each streamed entry.
export function refreshPreviousSacrifice(entries) {
  const i = entries.length - 2, entry = entries[i]
  if (!entry || entry.specialAssessment?.brilliant.status !== 'candidate') return entries
  const evidence = collectSacrificeEvidence(entry, entries[i + 1], SPECIAL_POLICY)
  if (!evidence) return entries
  const refreshed = classifySpecialMove(entry, entries[i - 1], entries[i - 2], evidence)
  return entries.map((row, index) => index === i ? refreshed : row)
}

export function displaySpecialMoves(entries, enabled = false) {
  return enabled ? entries : entries.map(entry => entry.specialAssessment?.version === SPECIAL_POLICY.version
    && ['great', 'brilliant'].includes(entry.classification)
    ? { ...entry, classification: entry.baseClassification } : entry)
}

export function formatSpecialAssessment(entry) {
  const assessment = entry.specialAssessment
  if (entry.classification === 'brilliant' && assessment?.brilliant.status === 'supported') {
    const offer = assessment.brilliant.offers[0]
    if (offer.rookActivation) return `Attiva la torre verso il re lasciando un altro pezzo in presa. La variante dopo ${offer.san} usa il nuovo accesso e conferma la compensazione; le riprese materiali immediate sono verificate separatamente.`
    if (offer.forcedMatingAcceptance) return `Sacrificio con scacco: ${offer.san} e l'unica risposta legale. Il motore indica matto e la variante e verificata fino alla posizione finale.`
    return `Sacrificio compensato nell'analisi: dopo ${offer.san}, ${offer.continuation.slice(1, 5).map(e => e.san).join(' ')}.${offer.corroboration ? ' Compensazione confermata anche nell’analisi della posizione dopo la presa.' : ''}`
  }
  if (entry.classification === 'great' && assessment?.grande.status === 'supported') {
    if (assessment.grande.reason === 'critical-native-advantage-choice') return 'Nel confronto verificato solo questa scelta conserva un vantaggio relativo nel modello del motore. Le alternative analizzate sono confermate separatamente; non implica una vittoria forzata.'
    if (assessment.grande.reason === 'verified-major-piece-tactic') {
      const kind = assessment.grande.tactic.kind
      if (kind === 'queen-evasion-with-unique-major-gain') return 'Sottrae la donna a una minaccia e realizza un guadagno di materiale con una cattura unica tra quelle verificate. Il guadagno resiste alle risposte immediate analizzate.'
      if (kind === 'unique-knight-pawn-evasion-exploiting-relative-queen-pin') return 'Salva il cavallo da un pedone sfruttando un’inchiodatura alla donna. Se il cavallo viene catturato subito, la presa della donna resta vantaggiosa; il guadagno non è obbligato se l’avversario sceglie un’altra difesa.'
      return 'Crea un’infilata sulle torri. Una verifica legale fino a due proprie mosse dimostra un guadagno materiale o matto contro tutte le risposte considerate entro questo orizzonte.'
    }
    if(assessment.grande.reason==='critical-native-winning-choice'){
      return `Nel confronto verificato il motore stima una vittoria con questa mossa e un esito diverso con le alternative analizzate. I punteggi ordinari restano invariati.`
    }
    if (assessment.grande.decisionProof) {
      return `Grande confermata con una verifica separata a ${assessment.grande.decisionProof.nodes.toLocaleString('it-IT')} nodi. Il profilo numerico mostrato conserva le proprie ricerche.`
    }
    if (assessment.grande.reason === 'new-discovered-check-after-opponent-error') {
      return `Prepara nuovi scacchi di scoperta, come ${assessment.grande.tactic.checks[0].san}, dopo ${assessment.grande.previousMove}. La verifica riguarda le opzioni di attacco se la preparazione resta senza risposta.`
    }
    if (assessment.grande.reason === 'new-mating-threat-after-inaccuracy') {
      return `Crea la minaccia ${assessment.grande.tactic.moves.map(m => m.san).join(' / ')} dopo ${assessment.grande.previousMove}. Il motore conferma la scelta migliore; la minaccia non implica matto contro ogni difesa.`
    }
    if (assessment.grande.reason === 'active-checking-attacker-capture') {
      return `Risponde a ${assessment.grande.previousMove} catturando il pezzo che ha dato scacco e mantiene una posizione favorevole nell'analisi.`
    }
    if (assessment.grande.reason === 'verified-checking-major-fork') {
      const target = assessment.grande.tactic.type === 'q' ? 'donna' : 'torre'
      return `Forchetta al re e alla ${target}: la cattura resta disponibile dopo ogni risposta legale immediata allo scacco.`
    }
    if (assessment.grande.reason === 'equilibrium-recovery') {
      return `Recupera una posizione circa equilibrata dopo ${assessment.grande.context.previousMove ?? 'l’errore avversario'} rispetto alle alternative analizzate. Alternativa: ${assessment.grande.alternative.san.join(' ')}.`
    }
    if (assessment.grande.evidenceKind === 'empirical-family') {
      return `Risposta migliore senza presa dopo l'errore avversario ${assessment.grande.previousMove ?? ''}, secondo il modello sperimentale.`
    }
    const scope = assessment.coverage.allLegal ? 'le altre mosse legali' : 'le alternative analizzate'
    return assessment.grande.reason === 'critical-defense'
      ? `Difesa decisiva rispetto a ${scope}. Alternativa: ${assessment.grande.alternative.san.join(' ')}.`
      : `Scelta decisiva per mantenere il vantaggio rispetto a ${scope}. Alternativa: ${assessment.grande.alternative.san.join(' ')}.`
  }
  if (assessment?.brilliant.status === 'candidate') return 'Possibile sacrificio: le analisi disponibili non bastano per confermarlo.'
  if(assessment?.grande.reason==='ordinary-mate-blocker-capture')return `Ripristina una minaccia di matto gia disponibile, catturando il pezzo appena interposto. La valutazione numerica resta valida.`
  if (assessment?.brilliant.status === 'supported') return 'Sacrificio compensato secondo il criterio sperimentale.'
  if (assessment?.grande.status === 'supported') return assessment.grande.evidenceKind === 'empirical-family'
    ? 'Risposta migliore senza presa dopo un errore avversario, secondo il modello sperimentale.'
    : 'Possibile mossa decisiva secondo il criterio sperimentale.'
  if (assessment?.grande.reason === 'near-equivalent-response-alternative') {
    return `Alternativa di qualità simile nell'analisi: ${assessment.grande.alternative.san[0]}.`
  }
  if (assessment?.grande.reason === 'forcing-response-can-be-delayed') {
    const line = assessment.grande.deferred.continuation
    return `Il motore mantiene una posizione favorevole anche con ${line[0]}, rinviando ${line.at(-1)}.`
  }
  if (['decision-novelty-not-established', 'ordinary-material-recovery'].includes(assessment?.grande.reason)) {
    if (assessment.grande.realization.kind === 'discovered-attack-realization') {
      return 'Incasso di un precedente attacco scoperto: una nuova scelta decisiva non è confermata.'
    }
    return assessment.grande.realization.kind === 'immediate-material-recovery'
      ? 'Ripresa materiale: una nuova scelta decisiva non è confermata.'
      : 'Incasso di un precedente doppio attacco: una nuova scelta decisiva non è confermata.'
  }
  const defense = assessment?.events.find(event => event.kind === 'missed-defense')
  if (defense) return `Difesa mancata nell'analisi: ${defense.alternative.san.join(' ')}.`
  return ''
}

function applyNativeDecisionProof(result,entry,previous,previousOwn){
 if(!entry.nativeDecisionProof)return result
 if(result.classification!=='best'||result.isBookMove||result.moveFacts?.forced||!previous)return result
 const proof=nativeProofFor(entry,entry.nativeDecisionProof)
 if(!proof?.root||!proof.child)return result
 const current=classifyReviewedMove({...entry,engine:proof.root,playedEngine:proof.child})
 if(current.classification!=='best'||current.isEngineBest!==true||current.evaluationEvidence?.source!=='completed-snapshot'||current.evaluationEvidence.status!=='coherent')return result
 const prior=classifyReviewedMove({...previous,playedEngine:proof.root})
 const checked=classifySpecialMove(current,prior,previousOwn)
 if(checked.classification!=='great'||checked.specialAssessment.grande.status!=='supported'||!(checked.specialAssessment.grande.nativeOutcome||checked.specialAssessment.grande.reason==='verified-major-piece-tactic'||checked.specialAssessment.grande.nativeEdge))return result
 return {...result,classification:'great',specialAssessment:{...result.specialAssessment,grande:{...checked.specialAssessment.grande,decisionProof:{version:proof.version,nodes:1000000,numericalProfileUnchanged:true,source:checked.specialAssessment.grande.nativeOutcome?'supplemental-native-outcome-verification':'supplemental-decisive-move-verification'}}}}
}
// Select missing independent alternatives only after the pair itself supports
// the outcome hypothesis. This selector cannot promote a classification.
export function pendingNativeAlternatives(entry,previous,previousOwn,data){
 try{
  const proof=nativeProofFor(entry,data)
  if(!proof?.root||!proof.child||!previous)return null
  const current=classifyReviewedMove({...entry,engine:proof.root,playedEngine:proof.child,nativeDecisionProof:proof})
  if(current.classification!=='best'||current.isEngineBest!==true||current.evaluationEvidence?.source!=='completed-snapshot'||current.evaluationEvidence.status!=='coherent')return null
  const before=new Chess(entry.fenBefore),side=before.turn(),roots=rootEvidence(current,before,side,material(before,side))
  const prior=classifyReviewedMove({...previous,playedEngine:proof.root})
  if((!nativeWinningPotential(current,roots)&&!edgeChoicePotential(current,prior,previousOwn))||restoredMateRoute(entry,previous,previousOwn))return null
  const realization=detectMaterialRealization(current,prior,previousOwn),context=opponentContext(current,prior)
  if(realization?.kind==='immediate-material-recovery'&&!before.isCheck()||realization&&context&&context.createdGain<SPECIAL_POLICY.gap)return null
  return roots.raw.slice(1).map(l=>({uci:l.pv[0],fen:nativeAlternativeFen(entry,l.pv[0])}))
 }catch{return null}
}
