import { ENGINE_CONFIG } from './engineConfig.js'
import { calculateWinProbability } from './evaluation.js'
import { compareMateDistance } from './mateComparison.js'

export const MOVE_CLASSIFICATION = {
  book: 'book',
  brilliant: 'brilliant',
  great: 'great',
  best: 'best',
  excellent: 'excellent',
  good: 'good',
  inaccuracy: 'inaccuracy',
  mistake: 'mistake',
  blunder: 'blunder',
  missed: 'missed',
  unclassified: 'unclassified',
}

export function classifyMove({
  dropPct = null,
  isBookMove = false,
  thresholds = ENGINE_CONFIG.classification,
} = {}) {
  if (isBookMove) return MOVE_CLASSIFICATION.book
  if (!Number.isFinite(dropPct)) throw new TypeError('dropPct must be a finite number')
  for (const category of ['best', 'excellent', 'good', 'inaccuracy', 'mistake']) {
    if (Math.max(0, dropPct) <= thresholds[category]) return MOVE_CLASSIFICATION[category]
  }
  return MOVE_CLASSIFICATION.blunder
}

function probability(evalCp, mate, mateZeroWins) {
  if (Number.isFinite(mate)) return mate === 0 ? Number(mateZeroWins) : Number(mate > 0)
  return Number.isFinite(evalCp) ? calculateWinProbability(evalCp) : null
}

// Scores are normalized to the player making the move. After the move,
// mate 0 means the opponent (now side-to-move) has been checkmated.
export function classifyAnalysisEntries(entries = [], thresholds = ENGINE_CONFIG.classification) {
  return entries.map((entry) => {
    // A delivered checkmate proves a winning move even if the preceding
    // engine score was unavailable. Missing nonterminal scores stay unknown.
    const bestProbability = entry.playedMate === 0 ? 1 : probability(entry.bestEval, entry.bestMate, false)
    const playedProbability = probability(entry.playedEval, entry.playedMate, true)
    const dropPct = bestProbability == null || playedProbability == null
      ? null : Math.max(0, 100 * (bestProbability - playedProbability))
    const evalDelta = entry.bestMate != null || entry.playedMate != null || !Number.isFinite(entry.playedEval) || !Number.isFinite(entry.bestEval)
      ? null
      : entry.playedEval - entry.bestEval
    let classification = dropPct == null && !entry.isBookMove ? MOVE_CLASSIFICATION.unclassified : classifyMove({
      dropPct,
      isBookMove: entry.isBookMove,
      thresholds,
    })
    if (classification === MOVE_CLASSIFICATION.best && entry.isEngineBest === false && entry.playedMate !== 0) {
      classification = MOVE_CLASSIFICATION.excellent
    }

    return { ...entry, evalDelta, bestProbability, playedProbability, dropPct, classification, mateComparison: compareMateDistance(entry) }
  })
}

// MultiPV scores are already from the mover's perspective. Prefer the
// played root move from the same search over an independent child search.
export function moveEvaluationFields(engine, playedEngine, playedUci, options = {}) {
  const fields = evaluationFields(engine, playedEngine, options)
  const primary = engine.lines?.find(line => line.multipv === 1) ?? engine
  const bestUci = primary.pv?.[0] ?? null
  const isEngineBest = bestUci && playedUci ? bestUci === playedUci : null
  const line = isEngineBest ? primary : playedUci ? engine.lines?.find(line => line.pv?.[0] === playedUci) : null
  const sameDepth = line && (primary.depth == null && line.depth == null || primary.depth === line.depth)
  const hasScore = line && (Number.isFinite(line.mate) || Number.isFinite(line.evalCp))
  const useRoot = !options.isCheckmate && sameDepth && hasScore
  return {
    ...fields,
    ...(useRoot ? { playedEval: line.mate == null ? line.evalCp : null, playedMate: line.mate ?? null } : {}),
    playedUci,
    bestUci,
    isEngineBest,
    evaluationSource: options.isCheckmate ? 'checkmate' : useRoot ? 'root-pv' : 'independent-position',
  }
}

// Stockfish reports scores from side-to-move at each FEN.
export function evaluationFields(engine, playedEngine, { isCheckmate = false } = {}) {
  return {
    bestEval: engine.mate == null ? engine.evalCp : null,
    bestMate: engine.mate ?? null,
    playedEval: playedEngine.mate == null && playedEngine.evalCp != null ? -playedEngine.evalCp : null,
    playedMate: isCheckmate ? 0 : playedEngine.mate == null ? null : -playedEngine.mate + 0,
  }
}
