import { classifyReviewedMove, applyMoveFacts, applyBookQuality } from './reviewEvaluation.js'
import { reclassifySpecialMoves } from './analysisSpecialClassification.js'
import { annotateClassification } from './classificationDecision.js'
import { createClassificationPolicy } from './classificationPolicy.js'
import { classifyGrandeCandidateV3 } from './grandeCandidateV3.js'

// Recompute derived scores and facts from the stored engine evidence. This
// migrates old archives without mutating them or starting an engine search.
export function reclassifyReviewedMoves(entries = []) {
  const policy = createClassificationPolicy()
  return reclassifySpecialMoves(entries.map(classifyReviewedMove)).map(applyMoveFacts)
    .map((entry, index) => annotateClassification(entry, entries[index], policy))
}

// Application pipeline: frozen published stage, then v3 using that same context.
// Keep reclassifyReviewedMoves unchanged for the reproducible v1/v2 studies.
export function reclassifyAnalysisMoves(entries = []) {
  const published = reclassifyReviewedMoves(entries.map(({ candidateAssessment, ...entry }) => entry)).map(applyBookQuality)
  return published.map((entry, i) => classifyGrandeCandidateV3(entry, published[i - 1], published[i - 2], null, entry))
}
