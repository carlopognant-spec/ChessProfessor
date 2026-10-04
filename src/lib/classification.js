import { ENGINE_CONFIG } from './engineConfig.js'
import { moverWinProb } from './evaluation.js'

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
  dropPct = 0,
  isBookMove = false,
  previousOpponentError = false,
  missedOpportunity = false,
  thresholds = ENGINE_CONFIG.classification,
} = {}) {
  if (isBookMove) return MOVE_CLASSIFICATION.book

  if (!Number.isFinite(dropPct)) {
    throw new TypeError('dropPct must be a finite number')
  }

  // Point 1 intentionally disables brilliant/great/missed.
  const safeDropPct = Math.max(0, dropPct)

  if (safeDropPct <= thresholds.best) return MOVE_CLASSIFICATION.best
  if (safeDropPct <= thresholds.excellent) return MOVE_CLASSIFICATION.excellent
  if (safeDropPct <= thresholds.good) return MOVE_CLASSIFICATION.good
  if (safeDropPct <= thresholds.inaccuracy) return MOVE_CLASSIFICATION.inaccuracy
  if (safeDropPct <= thresholds.mistake) return MOVE_CLASSIFICATION.mistake
  return MOVE_CLASSIFICATION.blunder
}

export function classifyAnalysisEntries(entries = [], thresholds = ENGINE_CONFIG.classification) {
  let previousOpponentError = false

  return entries.map((entry) => {
    const bestProbability = moverWinProb({
      evalCp: entry.bestEval,
      mate: entry.bestMate ?? entry.engine?.mate ?? null,
    })
    const playedProbability = moverWinProb({
      evalCp: entry.playedEval,
      mate: entry.playedMate ?? entry.playedEngine?.mate ?? null,
    })
    const dropPct = Math.max(0, (bestProbability - playedProbability) * 100)
    const evalDelta = entry.playedEval == null || entry.bestEval == null
      ? 0
      : entry.playedEval - entry.bestEval
    const classification = classifyMove({
      dropPct,
      isBookMove: entry.isBookMove,
      previousOpponentError,
      missedOpportunity: entry.missedOpportunity,
      thresholds,
    })

    previousOpponentError = classification === MOVE_CLASSIFICATION.mistake
      || classification === MOVE_CLASSIFICATION.blunder

    return { ...entry, evalDelta, dropPct, classification }
  })
}
