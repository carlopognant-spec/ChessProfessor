import { ENGINE_CONFIG } from './engineConfig.js'

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
}

export function classifyMove({
  evalDelta = 0,
  isBookMove = false,
  previousOpponentError = false,
  missedOpportunity = false,
  thresholds = ENGINE_CONFIG.classification,
} = {}) {
  if (isBookMove) return MOVE_CLASSIFICATION.book
  if (previousOpponentError && missedOpportunity) return MOVE_CLASSIFICATION.missed
  if (evalDelta >= thresholds.brilliant) return MOVE_CLASSIFICATION.brilliant
  if (evalDelta >= thresholds.great) return MOVE_CLASSIFICATION.great
  if (evalDelta >= thresholds.best) return MOVE_CLASSIFICATION.best
  if (evalDelta >= thresholds.excellent) return MOVE_CLASSIFICATION.excellent
  if (evalDelta >= thresholds.good) return MOVE_CLASSIFICATION.good
  if (evalDelta >= thresholds.inaccuracy) return MOVE_CLASSIFICATION.inaccuracy
  if (evalDelta >= thresholds.mistake) return MOVE_CLASSIFICATION.mistake
  return MOVE_CLASSIFICATION.blunder
}

export function classifyAnalysisEntries(entries = [], thresholds = ENGINE_CONFIG.classification) {
  let previousOpponentError = false

  return entries.map((entry) => {
    const evalDelta = entry.playedEval == null || entry.bestEval == null
      ? 0
      : entry.playedEval - entry.bestEval
    const classification = classifyMove({
      evalDelta,
      isBookMove: entry.isBookMove,
      previousOpponentError,
      missedOpportunity: entry.missedOpportunity,
      thresholds,
    })

    previousOpponentError = classification === MOVE_CLASSIFICATION.mistake
      || classification === MOVE_CLASSIFICATION.blunder

    return { ...entry, evalDelta, classification }
  })
}
