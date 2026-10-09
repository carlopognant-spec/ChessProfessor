import { getPositionFacts } from '../positionFacts.js'

const CRITICAL_CLASSIFICATIONS = new Set(['mistake', 'blunder', 'missed', 'great', 'brilliant'])

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
  if (analysisEntry?.fenAfter !== fen) analysisEntry = null
  return {
    fen,
    question,
    moveHistorySan: [...moveHistorySan],
    opening: opening
      ? { eco: opening.eco ?? null, name: opening.name ?? null }
      : null,
    classification: analysisEntry?.classification ?? null,
    numericalClassification: analysisEntry?.numericalClassification ?? null,
    moveFacts: analysisEntry?.moveFacts ?? null,
    evaluationEvidence: analysisEntry?.evaluationEvidence ?? null,
    playedMove: analysisEntry?.playedMove ?? null,
    bestEval: analysisEntry?.bestEval ?? null,
    playedEval: analysisEntry?.playedEval ?? null,
    bestMate: analysisEntry?.bestMate ?? null,
    playedMate: analysisEntry?.playedMate ?? null,
    mateComparison: analysisEntry?.mateComparison ?? null,
    missedOpportunity: analysisEntry?.missedOpportunity ?? null,
    specialAssessment: analysisEntry?.specialAssessment ?? null,
    evalDelta: analysisEntry?.evalDelta ?? null,
    pv: analysisEntry?.comparisonPv ?? analysisEntry?.engine?.pv ?? analysisEntry?.pv ?? [],
    facts: getPositionFacts(fen),
  }
}
