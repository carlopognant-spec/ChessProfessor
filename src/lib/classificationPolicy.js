import { ENGINE_CONFIG } from './engineConfig.js'
import { CLASSIFICATION_SCORE_MODEL } from './evaluation.js'
import { REVIEW_POLICY_VERSION } from './reviewEvaluation.js'
import { SPECIAL_POLICY } from './specialPolicy.js'

const CLASSIFICATION_POLICY_VERSION = 'classification-policy-v1'

export function createClassificationPolicy() {
  return {
    version: CLASSIFICATION_POLICY_VERSION,
    numericalVersion: 'loss-bands-v1',
    evidenceVersion: 'exact-score-flags-v1',
    scoreModel: { ...CLASSIFICATION_SCORE_MODEL },
    thresholds: { ...ENGINE_CONFIG.classification },
    reviewVersion: REVIEW_POLICY_VERSION,
    special: { ...SPECIAL_POLICY },
    opportunity: { version: 'opportunity-and-mate-v1', ...ENGINE_CONFIG.missedOpportunity },
    bookVersion: 'position-path-v1',
    stages: ['review-numerical-and-book', 'opportunity-and-special', 'forced-override'],
  }
}

export const classificationPolicyKey = (policy = createClassificationPolicy()) => JSON.stringify(policy)
