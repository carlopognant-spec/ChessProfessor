import { classifyReviewedMove, applyMoveFacts } from './reviewEvaluation.js'
import { reclassifySpecialMoves } from './specialClassification.js'

// Recompute derived scores and facts from the stored engine evidence. This
// migrates old archives without mutating them or starting an engine search.
export function reclassifyReviewedMoves(entries = []) {
  return reclassifySpecialMoves(entries.map(classifyReviewedMove)).map(applyMoveFacts)
}
