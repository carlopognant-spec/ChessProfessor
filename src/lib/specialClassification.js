import { Chess } from 'chess.js'
import { calculateWinProbability } from './evaluation.js'
import { classifyMoveOpportunity } from './moveOpportunities.js'
import { detectMaterialRealization } from './materialRealization.js'
import { collectSacrificeEvidence, confirmedCompensation } from './sacrificeEvidence.js'
import { classifyAnalysisEntries, moveEvaluationFields } from './classification.js'

// Fixed local outcome bands, inherited from the earlier experiment. These are
// indices of engine scores, not calibrated human winning probabilities.
export const SPECIAL_POLICY = Object.freeze({ version: 'counterfactual-v6',
  good: 0.45, poor: 0.35, winning: 0.75, nonWinning: 0.60,
  gap: 0.20, consistency: 0.10, sacrificeLoss: 2 })
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
function responseDecision(entry, previous, before, side, baseline) {
  if (!previous || entry.classification !== 'best'
    || !opponentContext(entry, { ...previous, isBookMove: false })) return null
  const move = play(new Chess(entry.fenBefore), entry.playedUci)
  if (move.captured) return null
  const root = primary(entry.engine), child = primary(entry.playedEngine)
  const best = score(root), after = score(child)
  if (root?.pv?.[0] !== entry.playedUci || best == null || after == null
    || Math.abs(best - (1 - after)) > SPECIAL_POLICY.consistency) return null
  if (score(primary(previous.engine)) == null || score(primary(previous.playedEngine)) == null) return null
  const fields = moveEvaluationFields(previous.engine, previous.playedEngine, previous.playedUci)
  const previousPlayedRoot = previous.engine?.lines?.find(line => line.pv?.[0] === previous.playedUci)
  if (fields.evaluationSource === 'root-pv' && score(previousPlayedRoot) == null) return null
  const [numerical] = classifyAnalysisEntries([{ ...previous, ...fields, isBookMove: false }])
  if (!['mistake', 'blunder'].includes(numerical.classification)) return null
  const variation = replay(entry.fenBefore, root.pv, side, baseline)
  replay(entry.fenAfter, child.pv, side, baseline)
  return { status: 'supported', reason: 'best-noncapture-after-opponent-error',
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
function opponentContext(entry, previous) {
  if (!previous || previous.isBookMove || previous.fenAfter !== entry.fenBefore) return null
  try {
    const game = new Chess(previous.fenBefore), side = game.turn()
    play(game, previous.playedUci)
    if (game.fen() !== entry.fenBefore || game.turn() === side) return null
    const prior = score(primary(previous.engine))
    const current = score(primary(entry.engine))
    if (prior == null || current == null) return null
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
        return { status: 'rejected', reason: 'persistent-offer' }
      }
    }
    let matching = acceptedLines.filter(line => line.pv?.[0] === offer.uci)
    let source = 'played-child-search', depth = acceptanceDepth
    if (!matching.length && !entry.playedEngine?.lines?.some(line => line.pv?.[0] === offer.uci)
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
    const recovery = accepted.moves({ verbose: true }).filter(move => move.captured).some(move => {
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
    if (recovery && !verifiedMatingEstimate) { incomplete.push('unresolved-immediate-recovery'); continue }
    const corroboration = continuation.events.length >= 2 && extraEvidence?.allowConfirmation !== false
      ? confirmedCompensation(extraEvidence, offer.uci, accepted.fen(), acceptance, SPECIAL_POLICY) : null
    if (!continuation.mate && !continuation.settled && !corroboration) { incomplete.push('unresolved-tactical-sequence'); continue }
    qualifying.push({ ...offer, continuation: continuation.events.slice(0, 12),
      compensation: 'engine-estimate', afterIndex: 1 - score(acceptance),
      ...(extraEvidence ? { acceptanceSource: source, corroboration } : {}) })
  }
  if (incomplete.length) return { status: 'candidate', reason: incomplete[0], offers: offered }
  if (!qualifying.length) return { status: 'rejected', reason: 'no-qualified-sacrifice' }
  for (const alternative of roots.lines.filter(line => line.uci !== entry.playedUci && line.score >= SPECIAL_POLICY.winning)) {
    const game = new Chess(entry.fenBefore); play(game, alternative.uci)
    const alternativeOffers = offers(entry.fenBefore, game.fen(), side, baseline)
    if (!alternativeOffers.length || qualifying.every(offer => !offer.movedPiece
      && alternativeOffers.some(other => other.square === offer.square && other.type === offer.type))) {
      return { status: 'rejected', reason: 'winning-alternative-without-new-sacrifice' }
    }
  }
  return { status: 'supported', reason: 'compensated-new-offer', offers: qualifying,
    coverage: roots.coverage, defenseScope: 'all-legal-acceptances-and-engine-best-defense' }
}

export function classifySpecialMove(input, previous = null, previousOwn = null, extraEvidence = null) {
  // Recompute this policy's own labels when opening saved analysis.
  const entry = ['counterfactual-v1', 'counterfactual-v2', 'counterfactual-v3', 'counterfactual-v4',
    'counterfactual-v5', 'stable-compensation-v1-candidate', SPECIAL_POLICY.version].includes(input.specialAssessment?.version)
    ? { ...input, classification: input.baseClassification ?? input.classification } : input
  let result = classifyMoveOpportunity(entry, previous)
  const baseClassification = result.baseClassification ?? result.classification
  const assessment = { version: SPECIAL_POLICY.version, numericalClassification: baseClassification,
    events: [], grande: { status: 'rejected', reason: 'not-eligible' },
    brilliant: { status: 'rejected', reason: 'not-eligible' } }
  result = { ...result, specialAssessment: assessment }
  const finish = () => assessment.brilliant.status === 'supported' ? { ...result, classification: 'brilliant' }
    : assessment.grande.status === 'supported' ? { ...result, classification: 'great' } : result
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
    const response = responseDecision(entry, previous, before, side, baseline)
    if (response) {
      assessment.grande = response
      assessment.events.push({ kind: response.reason, status: 'supported' })
    }
    const roots = rootEvidence(entry, before, side, baseline)
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
      const conversion = roots.coherent && maintained >= SPECIAL_POLICY.winning && alternative.score <= SPECIAL_POLICY.nonWinning
        && best.score - alternative.score >= SPECIAL_POLICY.gap
      if (defense || conversion) {
        assessment.grande = { status: 'supported', reason: defense ? 'critical-defense' : 'critical-winning-choice',
          coverage: roots.coverage, bestIndex: best.score, alternativeIndex: alternative.score,
          alternative: { uci: alternative.uci, san: alternative.events.map(e => e.san).slice(0, 8) } }
        const realization = detectMaterialRealization(entry, previous, previousOwn)
        if (realization && context && context.createdGain < SPECIAL_POLICY.gap) {
          assessment.grande = { ...assessment.grande, status: 'candidate', reason: 'decision-novelty-not-established', realization }
          assessment.events.push({ ...realization, status: 'observed' })
        }
      }
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
  for (const [i, entry] of entries.entries()) results.push(classifySpecialMove(entry, results.at(-1), results.at(-2),
    collectSacrificeEvidence(entry, entries[i + 1], SPECIAL_POLICY)))
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
    return `Sacrificio compensato nell'analisi: dopo ${offer.san}, ${offer.continuation.slice(1, 5).map(e => e.san).join(' ')}.${offer.corroboration ? ' Compensazione confermata anche nell’analisi della posizione dopo la presa.' : ''}`
  }
  if (entry.classification === 'great' && assessment?.grande.status === 'supported') {
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
  if (assessment?.brilliant.status === 'supported') return 'Sacrificio compensato secondo il criterio sperimentale.'
  if (assessment?.grande.status === 'supported') return assessment.grande.evidenceKind === 'empirical-family'
    ? 'Risposta migliore senza presa dopo un errore avversario, secondo il modello sperimentale.'
    : 'Possibile mossa decisiva secondo il criterio sperimentale.'
  if (assessment?.grande.reason === 'decision-novelty-not-established') {
    return assessment.grande.realization.kind === 'immediate-material-recovery'
      ? 'Ripresa materiale: una nuova scelta decisiva non è confermata.'
      : 'Incasso di un precedente doppio attacco: una nuova scelta decisiva non è confermata.'
  }
  const defense = assessment?.events.find(event => event.kind === 'missed-defense')
  if (defense) return `Difesa mancata nell'analisi: ${defense.alternative.san.join(' ')}.`
  return ''
}
