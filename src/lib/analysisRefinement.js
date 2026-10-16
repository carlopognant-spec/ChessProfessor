import { Chess } from 'chess.js'
import { ENGINE_CONFIG } from './engineConfig.js'
import { createAnalysisMetadata, analysisMetadataKey } from './analysisMetadata.js'
import { reclassifyReviewedMoves } from './reviewMoves.js'
import { classifyReviewedMove } from './reviewEvaluation.js'
import {pendingGrandeRecovery} from './specialClassification.js'
import {GRANDE_PROOF_POLICY,grandeProofFor,validGrandeSearch} from './grandeProofs.js'
import {SACRIFICE_PROOF_SCOPE,buildSacrificeProofPlan,refineSacrificeProofs} from './sacrificeProofs.js'
import {NATIVE_PROOF_POLICY,nativeProofFor} from './nativeEvidence.js'
import {buildNativeProofPlan,refineNativeProofs} from './nativeProofs.js'
import { SACRIFICE_SEARCH_POLICY, pendingSacrificeTargets, sacrificeSearchFor, validSacrificeSearch, preferredSacrificeConfirmation,mergeSacrificeAttempts } from './sacrificeSearches.js'

export const REFINEMENT_POLICY = Object.freeze({ version: 'optional-refinement-v1', nodes: 1000000,
  selectionVersion: 'evidence-priority-v2', maxMoves: 12, boundaryMargin: 1, reserve: 5000 })
const expectedProfile = () => analysisMetadataKey(createAnalysisMetadata({ nodes: REFINEMENT_POLICY.nodes }))
function abort(signal) {
  if (signal?.aborted) { const error = new Error('Approfondimento interrotto'); error.name = 'AbortError'; throw error }
}
function profileMatches(engine, fen) {
  try { return engine?.fen === fen && analysisMetadataKey(engine.analysisMetadata) === expectedProfile() }
  catch { return false }
}
export function refinementFor(entry) {
  const data = entry.refinement
  if (data?.version !== REFINEMENT_POLICY.version) return null
  const engine = profileMatches(data.engine, entry.fenBefore) ? data.engine : null
  const playedEngine = profileMatches(data.playedEngine, entry.fenAfter) ? data.playedEngine : null
  const proof = grandeProofFor(entry), native=nativeProofFor(entry), {grandeProof: _proof,nativeProof:_nativeProof, ...rest} = data
  return engine || playedEngine || proof || native || mergeSacrificeAttempts(data.sacrificeAttempts).length || data.sacrifices?.some(r => {
    const saved = sacrificeSearchFor(entry, r.captureUci)
    return saved?.acceptance || saved?.confirmation
  }) ? { ...rest, engine, playedEngine, ...(proof ? {grandeProof: proof} : {}),...(native?{nativeProof:native}:{}) } : null
}
function positionsKnown(entries) {
  const known = new Map()
  for (const e of entries) {
    const data = refinementFor(e)
    if (data?.engine) known.set(e.fenBefore, data.engine)
    if (data?.playedEngine) known.set(e.fenAfter, data.playedEngine)
  }
  return known
}
function validateGame(entries) {
  const game = new Chess(entries[0]?.fenBefore)
  for (const [i, e] of entries.entries()) {
    if (e.ply !== i + 1 || e.fenBefore !== game.fen()) throw Error('Analisi non coerente con la partita')
    game.move(e.playedMove ?? e.san)
    if (e.fenAfter !== game.fen()) throw Error('Analisi non coerente con la partita')
  }
}
export function refinementReason(entry) {
  if (entry.isBookMove || ['book', 'forced'].includes(entry.classification) || entry.playedMate === 0) return null
  const data = refinementFor(entry)
  if (data?.engine && data?.playedEngine) return pendingSacrificeTargets([entry]).length ? 'unconfirmed-sacrifice' : null
  if (['independent', 'conflicting', 'unavailable'].includes(entry.evaluationEvidence?.status)) return 'uncertain-evaluation'
  if (entry.specialAssessment?.brilliant?.status === 'candidate' || entry.specialAssessment?.grande?.status === 'candidate') return 'unconfirmed-special'
  if (Number.isFinite(entry.dropPct) && entry.dropPct > 0
    && Object.values(ENGINE_CONFIG.classification).some(n => Math.abs(entry.dropPct - n) <= REFINEMENT_POLICY.boundaryMargin)) return 'near-boundary'
  return null
}
// Rank evidence that needs a specific verification before ordinary uncertainty.
// The priority changes search order only; it never promotes a classification.
export function refinementPriority(entry) {
  if (pendingSacrificeTargets([entry]).length) return 0
  if (entry.specialAssessment?.brilliant?.status === 'candidate') return 1
  if (entry.specialAssessment?.grande?.status === 'candidate') return 2
  if (['unavailable', 'conflicting'].includes(entry.evaluationEvidence?.status)) return 3
  if (entry.evaluationEvidence?.status === 'independent') return 4
  return 5
}
// Independently verify the empirical Grande family; no promotion by this selector.
function specialCoverageReason(entry) {
  return entry.classification === 'great' && entry.specialAssessment?.grande?.evidenceKind === 'empirical-family'
    && entry.bestMate == null ? 'empirical-special' : null
}

export function grandeVerificationReason(entry) {
  if (entry.isBookMove || ['book', 'forced'].includes(entry.classification) || entry.playedMate === 0) return null
  const data = refinementFor(entry)
  if (data?.engine && data?.playedEngine) return null
  return specialCoverageReason(entry)
}
export function buildRefinementPlan(entries = [], { grandeOnly = false, sacrificeOnly = false,criticalOnly=false } = {}) {
  validateGame(entries)
  const view = selectRefinementView(entries, true)
  if (sacrificeOnly) return buildSacrificeProofPlan(entries,view,REFINEMENT_POLICY.version)
  if (criticalOnly) return buildNativeProofPlan(entries,view,REFINEMENT_POLICY.version)
  const candidates = grandeOnly ? view.filter(grandeVerificationReason)
    .map(entry => ({ entry, priority: 2 })) : entries.map((e, i) => {
    const data = refinementFor(e)
    return data?.engine && data?.playedEngine ? view[i] : e
  }).filter(refinementReason).map(entry => ({ entry, priority: refinementPriority(entry) }))
    .sort((a, b) => a.priority - b.priority || a.entry.ply - b.entry.ply)
  const selected = candidates.slice(0, REFINEMENT_POLICY.maxMoves).map(candidate => candidate.entry)
  if (grandeOnly && !selected.length) {
    const proofPlan = buildRecoveryProofPlan(entries, view)
    if (proofPlan.selectedPlies.length) return proofPlan
  }
  const known = positionsKnown(entries), positions = [...new Set(selected.flatMap(e => [e.fenBefore, e.fenAfter]))]
    .filter(fen => !known.has(fen))
  const sacrifices = pendingSacrificeTargets(selected).slice(0, SACRIFICE_SEARCH_POLICY.maxOffers)
  const extraSearches = sacrifices.reduce((n, target) => {
    const e = entries.find(e => e.ply === target.ply), saved = sacrificeSearchFor(e, target.captureUci)
    const reusable = [known.get(target.acceptedFen), ...entries.filter(e => e.fenAfter === target.acceptedFen).map(e => e.playedEngine)]
      .some(engine => validSacrificeSearch(engine, target.acceptedFen))
    return n + Number(!saved?.acceptance) + Number(!saved?.confirmation && !reusable)
  }, 0)
  return { version: REFINEMENT_POLICY.version, selectionVersion: grandeOnly ? 'grande-verification-v1' : REFINEMENT_POLICY.selectionVersion,
    ...(grandeOnly ? { scope: 'grande-evidence-v1' } : {}),
    selectedPlies: selected.map(e => e.ply), candidateCount: candidates.length,
    selection: candidates.slice(0, REFINEMENT_POLICY.maxMoves).map(({ entry, priority }) => ({
      ply: entry.ply, reason: grandeOnly ? grandeVerificationReason(entry) : priority === 0 ? 'unconfirmed-sacrifice' : refinementReason(entry), priority })),
    positions, sacrifices, extraSearches, nodes: REFINEMENT_POLICY.nodes,
    nominalNodes: positions.length * REFINEMENT_POLICY.nodes + extraSearches * SACRIFICE_SEARCH_POLICY.nodes,
    actualNodeCap: positions.length * (REFINEMENT_POLICY.nodes + REFINEMENT_POLICY.reserve)
      + extraSearches * (SACRIFICE_SEARCH_POLICY.nodes + SACRIFICE_SEARCH_POLICY.reserve) }
}
function grandeProofPositions(entries) {
  const known = new Map()
  for (const e of entries) {
    const proof = grandeProofFor(e)
    for (const [fen, sources] of [[e.fenBefore,[e.engine,e.refinement?.engine,proof?.root]],
      [e.fenAfter,[e.playedEngine,e.refinement?.playedEngine,proof?.child]]]) {
      for (const source of sources) if (validGrandeSearch(source, fen)) known.set(fen, source)
    }
  }
  return known
}
function buildRecoveryProofPlan(entries, view) {
  const selected = view.filter((e,i) => {
    const proof = grandeProofFor(entries[i])
    return !(proof?.root && proof.child) && pendingGrandeRecovery(e,view[i-1],view[i-2])
  }).slice(0, GRANDE_PROOF_POLICY.maxMoves)
  const known = grandeProofPositions(entries)
  const positions = [...new Set(selected.flatMap(e=>[e.fenBefore,e.fenAfter]))].filter(f=>!known.has(f))
  return {version:REFINEMENT_POLICY.version,selectionVersion:GRANDE_PROOF_POLICY.version,scope:GRANDE_PROOF_POLICY.scope,
    selectedPlies:selected.map(e=>e.ply),candidateCount:selected.length,
    selection:selected.map(e=>({ply:e.ply,reason:'recovery-child-needs-confirmation',priority:2})),
    positions,sacrifices:[],extraSearches:0,nodes:GRANDE_PROOF_POLICY.nodes,
    nominalNodes:positions.length*GRANDE_PROOF_POLICY.nodes,
    actualNodeCap:positions.length*(GRANDE_PROOF_POLICY.nodes+GRANDE_PROOF_POLICY.reserve)}
}
async function refineRecoveryProofs({entries,plan,analyzePosition,signal,onProgress,onEntries}) {
  const known = grandeProofPositions(entries)
  let actualNodes = 0, completed = 0, updated = entries
  const publish = () => {
    updated = entries.map(e=>!plan.selectedPlies.includes(e.ply)?e:{...e,refinement:{...e.refinement,
      version:REFINEMENT_POLICY.version,grandeProof:{version:GRANDE_PROOF_POLICY.version,
        root:known.get(e.fenBefore)??null,child:known.get(e.fenAfter)??null}}})
    onEntries?.(updated)
  }
  abort(signal)
  publish()
  for (const fen of plan.positions) {
    abort(signal)
    if (actualNodes+plan.nodes+GRANDE_PROOF_POLICY.reserve>plan.actualNodeCap) throw Error('Budget di approfondimento esaurito')
    const engine = await analyzePosition(fen,plan.nodes,ENGINE_CONFIG.multiPv)
    abort(signal)
    if (!validGrandeSearch(engine,fen)) throw Error('Verifica della Grande incompatibile')
    actualNodes += engine.actualNodes
    if (actualNodes>plan.actualNodeCap) throw Error('Budget di approfondimento superato')
    known.set(fen,engine); completed++; publish()
    onProgress?.({current:completed,total:plan.positions.length,moves:plan.selectedPlies.length})
  }
  return {entries:updated,actualNodes,searches:completed,selectedPlies:plan.selectedPlies}
}
function entriesWithKnown(entries, known, selectedPlies) {
  return entries.map(e => {
    const engine = known.get(e.fenBefore), playedEngine = known.get(e.fenAfter)
    if (!engine && !playedEngine) return e
    return { ...e, refinement: { ...e.refinement, version: REFINEMENT_POLICY.version, engine: engine ?? null, playedEngine: playedEngine ?? null,
      selected: Boolean(e.refinement?.selected || selectedPlies.includes(e.ply)),
      ...(e.refinement?.sacrifices ? { sacrifices: sacrificesWithKnown(e, known) } : {}) } }
  })
}
function sacrificesWithKnown(entry, known) {
  return (entry.refinement?.sacrifices ?? []).map(row => {
    const saved = sacrificeSearchFor(entry, row.captureUci)
    if (!saved) return row
    const confirmation = preferredSacrificeConfirmation(saved.acceptedFen, known.get(saved.acceptedFen), saved.confirmation)
    return confirmation && confirmation !== row.confirmation ? { ...row, confirmation } : row
  })
}
function validateResult(result, fen) {
  if (!profileMatches(result, fen) || !Number.isSafeInteger(result.actualNodes) || result.actualNodes < 0) throw Error('Risultato approfondito incompatibile')
  const game = new Chess(fen)
  if (game.isGameOver() && !game.moves().length) return
  const lines = result.lines
  if (!Array.isArray(lines) || !lines.length) throw Error('Valutazioni approfondite mancanti')
  for (const line of [...lines, ...(result.specialLines ?? [])]) {
    if (!Number.isInteger(line.depth) || line.depth < 1 || !line.pv?.length || line.bound
      || /\b(?:upperbound|lowerbound)\b/.test(line.raw ?? '')
      || !(Number.isFinite(line.evalCp) || Number.isInteger(line.mate))) throw Error('Valutazione approfondita non valida')
    const replay = new Chess(fen)
    for (const u of line.pv) {
      if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(u)) throw Error('Variante approfondita non valida')
      replay.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] })
    }
  }
  if (result.bestmove && !game.moves({ verbose: true }).some(m => `${m.from}${m.to}${m.promotion ?? ''}` === result.bestmove)) throw Error('Mossa approfondita non valida')
}
export async function refineGameEntries({ entries, plan = buildRefinementPlan(entries), analyzePosition, signal, onProgress, onEntries } = {}) {
  const expected = buildRefinementPlan(entries, { grandeOnly: ['grande-evidence-v1',GRANDE_PROOF_POLICY.scope].includes(plan.scope),
    sacrificeOnly:plan.scope===SACRIFICE_PROOF_SCOPE,criticalOnly:plan.scope===NATIVE_PROOF_POLICY.scope })
  if (JSON.stringify(plan) !== JSON.stringify(expected)) throw Error('Piano di approfondimento non valido')
  if (typeof analyzePosition !== 'function') throw TypeError('Motore di approfondimento mancante')
  abort(signal)
  if (plan.scope===NATIVE_PROOF_POLICY.scope) return refineNativeProofs({entries,plan,analyzePosition,signal,onProgress,onEntries})
  if (plan.scope === SACRIFICE_PROOF_SCOPE) return refineSacrificeProofs({entries,plan,analyzePosition,signal,onProgress,onEntries})
  if (plan.scope === GRANDE_PROOF_POLICY.scope) return refineRecoveryProofs({entries,plan,analyzePosition,signal,onProgress,onEntries})
  const known = positionsKnown(entries)
  let actualNodes = 0, completed = 0
  for (const fen of plan.positions) {
    abort(signal)
    if (actualNodes + plan.nodes + REFINEMENT_POLICY.reserve > plan.actualNodeCap) throw Error('Budget di approfondimento esaurito')
    const position = new Chess(fen)
    const result = position.moves().length ? await analyzePosition(fen, plan.nodes, ENGINE_CONFIG.multiPv)
      : { fen, evalCp: position.isStalemate() ? 0 : null, mate: position.isCheckmate() ? 0 : null,
        lines: [], actualNodes: 0, analysisMetadata: createAnalysisMetadata({ nodes: plan.nodes }), terminal: true }
    abort(signal)
    validateResult(result, fen)
    actualNodes += result.actualNodes
    if (actualNodes > plan.actualNodeCap) throw Error('Budget di approfondimento superato')
    known.set(fen, result)
    completed++
    onEntries?.(entriesWithKnown(entries, known, plan.selectedPlies))
    onProgress?.({ current: completed, total: plan.positions.length + plan.extraSearches, moves: plan.selectedPlies.length })
  }
  let updated = entriesWithKnown(entries, known, plan.selectedPlies)
  const childResults = new Map(known)
  for (const e of entries) if (plan.sacrifices.some(t => t.acceptedFen === e.fenAfter)) {
    const confirmation = preferredSacrificeConfirmation(e.fenAfter, childResults.get(e.fenAfter), e.playedEngine)
    if (confirmation) childResults.set(e.fenAfter, confirmation)
  }
  for (const target of plan.sacrifices) {
    abort(signal)
    const entry = updated.find(e => e.ply === target.ply)
    const saved = sacrificeSearchFor(entry, target.captureUci)
    const reused = childResults.get(target.acceptedFen)
    const row = { version: SACRIFICE_SEARCH_POLICY.version, ...target,
      acceptance: saved?.acceptance ?? null,
      confirmation: preferredSacrificeConfirmation(target.acceptedFen, reused, saved?.confirmation) }
    const publish = () => {
      updated = updated.map(e => e.ply !== target.ply ? e : { ...e, refinement: {
        ...e.refinement, version: REFINEMENT_POLICY.version,
        sacrifices: [...(e.refinement?.sacrifices ?? []).filter(r => r.captureUci !== target.captureUci), { ...row }] } })
      onEntries?.(updated)
    }
    for (const kind of ['acceptance', 'confirmation']) {
      if (row[kind]) continue
      abort(signal)
      const nodes = SACRIFICE_SEARCH_POLICY.nodes
      if (actualNodes + nodes + SACRIFICE_SEARCH_POLICY.reserve > plan.actualNodeCap) throw Error('Budget di approfondimento esaurito')
      const fen = kind === 'acceptance' ? target.fen : target.acceptedFen
      const options = kind === 'acceptance' ? { searchMoves: [target.captureUci] } : {}
      const result = await analyzePosition(fen, nodes, kind === 'acceptance' ? 1 : ENGINE_CONFIG.multiPv, options)
      abort(signal)
      if (!validSacrificeSearch(result, fen, kind === 'acceptance' ? target.captureUci : null)) throw Error('Verifica del sacrificio incompatibile')
      actualNodes += result.actualNodes
      if (result.actualNodes > nodes + SACRIFICE_SEARCH_POLICY.reserve
        || actualNodes > plan.actualNodeCap) throw Error('Budget di approfondimento superato')
      row[kind] = result
      if (kind === 'confirmation') childResults.set(fen, result)
      completed++
      publish()
      onProgress?.({ current: completed, total: plan.positions.length + plan.extraSearches, moves: plan.selectedPlies.length })
    }
    publish()
  }
  onProgress?.({ current: completed, total: completed, moves: plan.selectedPlies.length })
  return { entries: updated, actualNodes, searches: completed,
    selectedPlies: plan.selectedPlies }
}

export function selectRefinementView(entries = [], refined = false) {
  if (!refined || !entries.some(e => refinementFor(e))) return entries
  const known = positionsKnown(entries)
  let projected = entries.map(e => {
    const data = refinementFor(e)
    return data ? { ...e, engine: data.engine ?? e.engine, playedEngine: data.playedEngine ?? e.playedEngine,
      ...(data.grandeProof ? {grandeDecisionProof:data.grandeProof} : {}),
      ...(data.nativeProof ? {nativeDecisionProof:data.nativeProof} : {}),
      sacrificeSearches: sacrificesWithKnown(e, known) } : e
  })
  const comparisonChoices = new Map()
  for (const [i, initial] of entries.entries()) {
    const candidate = projected[i]
    // Usually the newer snapshot is deeper. Validate full PVs only for the
    // rare candidate that would replace a more deeply completed comparison.
    const oldDepth = initial.engine?.specialLines?.[0]?.depth
    const newDepth = candidate.engine?.specialLines?.[0]?.depth
    if (!Number.isInteger(oldDepth) || !Number.isInteger(newDepth) || oldDepth <= newDepth) continue
    const old = classifyReviewedMove(initial), next = classifyReviewedMove(candidate)
    if ([old, next].every(e => e.evaluationEvidence?.source === 'completed-snapshot'
      && e.evaluationEvidence.status === 'coherent')) comparisonChoices.set(initial.fenBefore,
      { engine: initial.engine, keptDepth: oldDepth, proposedDepth: newDepth })
  }
  if (comparisonChoices.size) projected = projected.map(e => ({ ...e,
    engine: comparisonChoices.get(e.fenBefore)?.engine ?? e.engine,
    playedEngine: comparisonChoices.get(e.fenAfter)?.engine ?? e.playedEngine }))
  return reclassifyReviewedMoves(projected).map((e, i) => ({ ...e,
    refinementComparison: { initialClassification: entries[i].classification, refinedClassification: e.classification,
      initialEval: entries[i].playedEval, refinedEval: e.playedEval,
      initialMate: entries[i].playedMate, refinedMate: e.playedMate,
      changed: entries[i].classification !== e.classification || entries[i].playedEval !== e.playedEval || entries[i].playedMate !== e.playedMate,
      examined: Boolean(refinementFor(entries[i])),
      rootComparisonChoice: comparisonChoices.has(e.fenBefore) ? {
        source: 'initial-deeper-snapshot', keptDepth: comparisonChoices.get(e.fenBefore).keptDepth,
        proposedDepth: comparisonChoices.get(e.fenBefore).proposedDepth } : null } }))
}
