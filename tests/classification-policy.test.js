import { expect, it } from 'vitest'
import { calculateWinProbability, CLASSIFICATION_SCORE_MODEL } from '../src/lib/evaluation.js'
import { ENGINE_CONFIG } from '../src/lib/engineConfig.js'
import { createClassificationPolicy, classificationPolicyKey } from '../src/lib/classificationPolicy.js'

it('records the existing formula and bands without changing their numerical results', () => {
  const policy = createClassificationPolicy()
  expect(policy.scoreModel).toEqual({ id: 'cp-logistic-v1', cpScale: 400, calibrated: false })
  expect(policy.evidenceVersion).toBe('exact-score-flags-v1')
  expect(policy.thresholds).toEqual({ best: 1, excellent: 3, good: 5, inaccuracy: 10, mistake: 20 })
  for (const cp of [-2000, -400, -100, -1, 0, 1, 100, 400, 2000]) {
    expect(calculateWinProbability(cp)).toBe(1 / (1 + Math.exp(-cp / 400)))
    expect(calculateWinProbability(cp, 'black')).toBe(1 / (1 + Math.exp(cp / 400)))
  }
  expect(CLASSIFICATION_SCORE_MODEL.cpScale).toBe(400)
})

it('snapshots every criterion independently of the live settings', () => {
  const policy = createClassificationPolicy(), originalKey = classificationPolicyKey(policy)
  policy.thresholds.best = 0.5
  policy.special.winning = 0.9
  expect(ENGINE_CONFIG.classification.best).toBe(1)
  expect(createClassificationPolicy().special.winning).toBe(0.75)
  expect(classificationPolicyKey(policy)).not.toBe(originalKey)
  expect(classificationPolicyKey()).toBe(originalKey)
})
