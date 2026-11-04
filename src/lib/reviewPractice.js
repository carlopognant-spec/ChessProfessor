import { Chess } from 'chess.js'
import { describePgn } from './gameArchive.js'
import { ENGINE_CONFIG } from './engineConfig.js'
import { analysisMetadataKey, createAnalysisMetadata } from './analysisMetadata.js'
import { appendHistory, historyKey, normalizeHistory, playUci, uciOf } from './analysisHistory.js'
import { calculateWinProbability, CLASSIFICATION_SCORE_MODEL } from './evaluation.js'
import { classifyMove } from './classification.js'
import { REVIEW_POLICY_VERSION } from './reviewEvaluation.js'
import { reclassifyAnalysisMoves } from './reviewMoves.js'

export const PRACTICE_POLICY_VERSION = 'review-practice-v1'
export const PRACTICE_MULTI_PV = 2
const legacyCriteria = { scoreModel: { id: 'cp-logistic-v1', cpScale: 400, calibrated: false },
  thresholds: { best: 1, excellent: 3, good: 5, inaccuracy: 10, mistake: 20 },
  opportunity: { winningProbability: 0.75, nonWinningProbability: 0.60 } }
const errors = new Set(['mistake', 'blunder', 'missed'])
const priority = { blunder: 0, missed: 1, mistake: 2 }
const abort = signal => { if (signal?.aborted) throw new DOMException('Verifica interrotta', 'AbortError') }
const probability = line => Number.isInteger(line.mate) ? Number(line.mate > 0) : calculateWinProbability(line.evalCp)
async function digest(text) {
  const bytes = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(bytes), n => n.toString(16).padStart(2, '0')).join('')
}

export function prepareLegacyPracticeEntries(entries = []) {
  return reclassifyAnalysisMoves(entries).map((entry, index) => ({ ...entry,
    // Both are candidate hints only; neither can replace fresh practice evidence.
    practiceCandidateClassification: [entry.classification, entries[index].classification].find(label => errors.has(label)) ?? null,
  }))
}

export async function buildPracticeCandidates({ pgn, entries = [], side = 'w', ply = null }) {
  const document = describePgn(pgn), game = new Chess(document.baseFen)
  const gameId = await digest(document.pgn)
  let history = { initialFen: game.fen(), moves: [] }
  const candidates = []
  for (const [index, san] of document.moves.entries()) {
    const fen = game.fen(), color = game.turn(), moveNumber = game.moveNumber()
    const move = game.move(san), originalUci = uciOf(move)
    const entry = entries.find(e => e.ply === index + 1)
    const candidateLabel = entry?.practiceCandidateClassification ?? entry?.classification
    if (entry?.fenBefore === fen && entry.fenAfter === game.fen() && (entry.playedMove ?? entry.san) === san
      && errors.has(candidateLabel) && color === side && (ply === null || ply === index + 1)
      && !new Chess(fen).isGameOver() && new Chess(fen).moves().length > 1) {
      candidates.push({ gameId, ply: index + 1, side: color, moveNumber,
        fen, history, originalUci, originalSan: san, classification: candidateLabel })
    }
    history = appendHistory(history, originalUci)
  }
  const selected = candidates.sort((a, b) => priority[a.classification] - priority[b.classification] || a.ply - b.ply).slice(0, 5)
  const criteria = { scoreModel: { id: CLASSIFICATION_SCORE_MODEL.id, cpScale: CLASSIFICATION_SCORE_MODEL.cpScale,
    calibrated: CLASSIFICATION_SCORE_MODEL.calibrated },
    thresholds: Object.fromEntries(['best', 'excellent', 'good', 'inaccuracy', 'mistake'].map(key => [key, ENGINE_CONFIG.classification[key]])),
    opportunity: { winningProbability: ENGINE_CONFIG.missedOpportunity.winningProbability,
      nonWinningProbability: ENGINE_CONFIG.missedOpportunity.nonWinningProbability } }
  // Preserve existing progress IDs for the original grading criteria; changed criteria get a separate namespace.
  const matchesLegacy = Object.entries(legacyCriteria).every(([group, values]) =>
    Object.entries(values).every(([key, value]) => criteria[group][key] === value))
  const criteriaNamespace = matchesLegacy ? [] : [criteria]
  return Promise.all(selected.map(async c => ({ ...c, id: await digest(JSON.stringify([PRACTICE_POLICY_VERSION,
    gameId, c.ply, historyKey(c.history), analysisMetadataKey(createAnalysisMetadata({ multiPv: PRACTICE_MULTI_PV })),
    REVIEW_POLICY_VERSION, ...criteriaNamespace])) })))
}

function exact(line) {
  return line && !line.bound && !line.lowerbound && !line.upperbound && !/\b(?:lowerbound|upperbound)\b/.test(line.raw ?? '')
    && (Number.isFinite(line.evalCp) || Number.isInteger(line.mate) && line.mate !== 0)
}

export function validPracticeSearch(result, candidate, multiPv = PRACTICE_MULTI_PV, searchMoves) {
  try {
    const expected = { ...createAnalysisMetadata({ nodes: ENGINE_CONFIG.nodes, multiPv }),
      ...(searchMoves ? { searchMoves } : {}) }
    if (result?.fen !== candidate.fen || historyKey(result.history) !== historyKey(candidate.history)
      || analysisMetadataKey(result.analysisMetadata) !== analysisMetadataKey(expected)
      || !Number.isSafeInteger(result.actualNodes) || result.actualNodes < 1
      || result.actualNodes > ENGINE_CONFIG.nodes + 5000) return false
    normalizeHistory(result.history, candidate.fen)
    const legal = new Chess(candidate.fen).moves({ verbose: true }).map(uciOf)
    const lines = result.specialLines
    if (!Array.isArray(lines) || lines.length !== Math.min(multiPv, searchMoves?.length ?? legal.length)
      || !lines.length || result.bestmove !== lines[0].pv?.[0] || new Set(lines.map(l => l.pv?.[0])).size !== lines.length) return false
    return lines.every((line, i) => {
      if (!exact(line) || !Number.isInteger(line.depth) || line.depth < 1 || line.depth !== lines[0].depth
        || line.multipv !== i + 1 || !Array.isArray(line.pv) || !line.pv.length || line.pv.length > 256
        || !legal.includes(line.pv[0]) || searchMoves && !searchMoves.includes(line.pv[0])) return false
      const board = new Chess(candidate.fen)
      for (const uci of line.pv) playUci(board, uci)
      return true
    })
  } catch { return false }
}

export function comparePracticeMoves(lines, referenceUci, playedUci) {
  const reference = lines?.find(l => l.pv?.[0] === referenceUci), played = lines?.find(l => l.pv?.[0] === playedUci)
  if (!exact(reference) || !exact(played)) return { status: 'inconclusive' }
  const dropPct = 100 * (probability(reference) - probability(played))
  // A contradictory comparison needs another search, never a penalty.
  if (dropPct < -ENGINE_CONFIG.classification.excellent) return { status: 'inconclusive' }
  const mateLost = reference.mate > 0 && !(played.mate > 0)
  const newlyMated = !(reference.mate < 0) && played.mate < 0
  const classification = classifyMove({ dropPct })
  return { status: !mateLost && !newlyMated && ['best', 'excellent'].includes(classification) ? 'correct' : 'incorrect',
    classification, dropPct, mateLost, newlyMated, reference, played }
}

export function createPracticeAnalyzer({ analyzePosition, maxEntries = 40 } = {}) {
  const cache = new Map()
  async function search(candidate, { signal, searchMoves } = {}) {
    abort(signal)
    const multiPv = searchMoves?.length ?? PRACTICE_MULTI_PV
    const key = JSON.stringify([candidate.fen, historyKey(candidate.history),
      analysisMetadataKey(createAnalysisMetadata({ multiPv })), searchMoves ?? null])
    if (cache.has(key)) return cache.get(key)
    const result = await analyzePosition(candidate.fen, ENGINE_CONFIG.nodes, multiPv, { history: candidate.history, signal,
      ...(searchMoves ? { searchMoves } : {}) })
    abort(signal)
    if (!validPracticeSearch(result, candidate, multiPv, searchMoves)) return null
    if (cache.size >= maxEntries) cache.delete(cache.keys().next().value)
    cache.set(key, result)
    return result
  }
  async function comparison(candidate, root, playedUci, signal) {
    const referenceUci = root.bestmove
    const covered = root.specialLines.some(l => l.pv[0] === playedUci)
    const result = covered ? root : await search(candidate, { signal, searchMoves: [referenceUci, playedUci] })
    abort(signal)
    return result ? { ...comparePracticeMoves(result.specialLines, referenceUci, playedUci), engine: result } : { status: 'inconclusive' }
  }
  return {
    async prepare(candidate, { signal } = {}) {
      const root = await search(candidate, { signal })
      if (!root) return { status: 'inconclusive', candidate }
      const original = await comparison(candidate, root, candidate.originalUci, signal)
      if (original.status === 'inconclusive') return { status: 'inconclusive', candidate }
      const useful = original.status === 'incorrect' && (original.mateLost || original.newlyMated
        || errors.has(original.classification)
        || probability(original.reference) >= ENGINE_CONFIG.missedOpportunity.winningProbability
          && probability(original.played) <= ENGINE_CONFIG.missedOpportunity.nonWinningProbability)
      return { status: useful ? 'ready' : 'not-applicable', candidate, root, original, referenceUci: root.bestmove }
    },
    async evaluate(prepared, input, { signal } = {}) {
      abort(signal)
      if (prepared.status !== 'ready') return { status: 'inconclusive' }
      const board = new Chess(prepared.candidate.fen)
      let move
      try { move = board.move(input) }
      catch { return { status: 'illegal' } }
      const uci = uciOf(move)
      const verdict = await comparison(prepared.candidate, prepared.root, uci, signal)
      return { ...verdict, uci, san: move.san, fenAfter: board.fen() }
    },
  }
}

export function practiceHint(prepared, level) {
  const board = new Chess(prepared.candidate.fen)
  const move = playUci(board, prepared.referenceUci)
  if (level === 1) return prepared.original.mateLost ? 'Cerca una continuazione che conservi il matto.'
    : prepared.original.newlyMated ? 'Cerca una difesa contro la minaccia di matto.' : 'Confronta scacchi, catture e minacce prima di scegliere.'
  if (level === 2) return `Considera il pezzo in ${move.from}.`
  return `La mossa suggerita è ${move.san}.`
}

export function practiceExplanation(prepared, verdict) {
  const candidate = prepared.candidate, board = new Chess(candidate.fen)
  const pv = verdict?.status === 'correct' ? verdict.played?.pv : prepared.original.reference.pv
  const san = []
  for (const uci of (pv ?? []).slice(0, 4)) {
    try { san.push(playUci(board, uci).san) } catch { break }
  }
  const reason = prepared.original.mateLost ? 'La scelta originale non conservava il matto rilevato dal motore.'
    : prepared.original.newlyMated ? 'La scelta originale consentiva un matto rilevato dal motore.'
      : 'La verifica aggiornata rileva una perdita di valutazione con la scelta originale.'
  return `${reason} In partita hai giocato ${candidate.originalSan}. ${san.length ? `Continuazione illustrativa: ${san.join(' ')}. ` : ''}La linea mostrata non è dichiarata unica; la valutazione è una stima di Stockfish.`
}

export function practiceExplanationEntry(prepared, displayedFen, verdict) {
  const pv = verdict?.status === 'correct' ? verdict.played?.pv : prepared?.original?.reference?.pv
  if (!prepared?.candidate || !Array.isArray(pv)) return null
  try {
    const board = new Chess(prepared.candidate.fen)
    for (const uci of pv.slice(0, 2)) {
      const fenBefore = board.fen(), move = playUci(board, uci)
      if (board.fen() === displayedFen) {
        // Root scores belong to the initial position, not to the displayed reply.
        return { fenBefore, fenAfter: displayedFen, playedUci: uci, playedMove: move.san }
      }
    }
  } catch { /* An unsupported branch must not inherit the original error's explanation. */ }
  return null
}
