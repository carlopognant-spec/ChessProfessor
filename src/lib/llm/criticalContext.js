import { getPositionFacts } from '../positionFacts.js'

const CRITICAL_CLASSIFICATIONS = new Set(['mistake', 'blunder', 'missed'])

export function shouldUseCriticalLlm({ classification, isFirstBookDeviation = false } = {}) {
  return isFirstBookDeviation || CRITICAL_CLASSIFICATIONS.has(classification)
}

export function buildCriticalContext({
  fen,
  opening = null,
  question,
  moveHistorySan = [],
  analysisEntry = null,
} = {}) {
  return {
    fen,
    question,
    moveHistorySan: [...moveHistorySan],
    opening: opening
      ? { eco: opening.eco ?? null, name: opening.name ?? null }
      : null,
    classification: analysisEntry?.classification ?? null,
    playedMove: analysisEntry?.playedMove ?? null,
    bestEval: analysisEntry?.bestEval ?? null,
    playedEval: analysisEntry?.playedEval ?? null,
    evalDelta: analysisEntry?.evalDelta ?? null,
    pv: analysisEntry?.engine?.pv ?? analysisEntry?.pv ?? [],
    facts: getPositionFacts(fen),
  }
}
