import { Chess } from 'chess.js'
import { ENGINE_CONFIG } from './engineConfig.js'
import { createAnalysisMetadata, analysisMetadataKey } from './analysisMetadata.js'
import { reclassifyReviewedMoves } from './reviewMoves.js'

export const REFINEMENT_POLICY = Object.freeze({ version: 'optional-refinement-v1', nodes: 1000000,
  maxMoves: 12, boundaryMargin: 1, reserve: 5000 })
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
  return engine || playedEngine ? { ...data, engine, playedEngine } : null
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
  if (data?.engine && data?.playedEngine) return null
  if (['independent', 'conflicting', 'unavailable'].includes(entry.evaluationEvidence?.status)) return 'uncertain-evaluation'
  if (entry.specialAssessment?.brilliant?.status === 'candidate' || entry.specialAssessment?.grande?.status === 'candidate') return 'unconfirmed-special'
  if (Number.isFinite(entry.dropPct) && entry.dropPct > 0
    && Object.values(ENGINE_CONFIG.classification).some(n => Math.abs(entry.dropPct - n) <= REFINEMENT_POLICY.boundaryMargin)) return 'near-boundary'
  return null
}
export function buildRefinementPlan(entries = []) {
  validateGame(entries)
  const candidates = entries.filter(refinementReason), selected = candidates.slice(0, REFINEMENT_POLICY.maxMoves)
  const known = positionsKnown(entries), positions = [...new Set(selected.flatMap(e => [e.fenBefore, e.fenAfter]))]
    .filter(fen => !known.has(fen))
  return { version: REFINEMENT_POLICY.version, selectedPlies: selected.map(e => e.ply), candidateCount: candidates.length,
    positions, nodes: REFINEMENT_POLICY.nodes, nominalNodes: positions.length * REFINEMENT_POLICY.nodes,
    actualNodeCap: positions.length * (REFINEMENT_POLICY.nodes + REFINEMENT_POLICY.reserve) }
}
function entriesWithKnown(entries, known, selectedPlies) {
  return entries.map(e => {
    const engine = known.get(e.fenBefore), playedEngine = known.get(e.fenAfter)
    if (!engine && !playedEngine) return e
    return { ...e, refinement: { version: REFINEMENT_POLICY.version, engine: engine ?? null, playedEngine: playedEngine ?? null,
      selected: Boolean(e.refinement?.selected || selectedPlies.includes(e.ply)) } }
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
  const expected = buildRefinementPlan(entries)
  if (JSON.stringify(plan) !== JSON.stringify(expected)) throw Error('Piano di approfondimento non valido')
  if (typeof analyzePosition !== 'function') throw TypeError('Motore di approfondimento mancante')
  abort(signal)
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
    onProgress?.({ current: completed, total: plan.positions.length, moves: plan.selectedPlies.length })
  }
  return { entries: entriesWithKnown(entries, known, plan.selectedPlies), actualNodes, searches: completed,
    selectedPlies: plan.selectedPlies }
}

export function selectRefinementView(entries = [], refined = false) {
  if (!refined || !entries.some(e => refinementFor(e))) return entries
  const projected = entries.map(e => {
    const data = refinementFor(e)
    return data ? { ...e, engine: data.engine ?? e.engine, playedEngine: data.playedEngine ?? e.playedEngine } : e
  })
  return reclassifyReviewedMoves(projected).map((e, i) => ({ ...e,
    refinementComparison: { initialClassification: entries[i].classification, refinedClassification: e.classification,
      initialEval: entries[i].playedEval, refinedEval: e.playedEval,
      initialMate: entries[i].playedMate, refinedMate: e.playedMate,
      changed: entries[i].classification !== e.classification || entries[i].playedEval !== e.playedEval || entries[i].playedMate !== e.playedMate,
      examined: Boolean(refinementFor(entries[i])) } }))
}
