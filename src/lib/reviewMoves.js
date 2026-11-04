import { classifyReviewedMove, applyMoveFacts } from './reviewEvaluation.js'
import { reclassifySpecialMoves } from './specialClassification.js'
import { annotateClassification } from './classificationDecision.js'
import { createClassificationPolicy } from './classificationPolicy.js'

// Recompute derived scores and facts from the stored engine evidence. This
// migrates old archives without mutating them or starting an engine search.
export function reclassifyReviewedMoves(entries = []) {
  const policy = createClassificationPolicy()
  return reclassifySpecialMoves(entries.map(classifyReviewedMove)).map(applyMoveFacts)
    .map((entry, index) => annotateClassification(entry, entries[index], policy))
}
