import test from 'node:test'
import assert from 'node:assert/strict'
import { learnGrandeRules, predictsGrande, matchesRule, trainingWithoutGame } from './grande-rule-learning.js'

test('three clean positives support a prudent rule without mutating data', () => {
  const rows = [true, true, true, false, false].map(label => ({ label, features: { tactical: label } }))
  const before = JSON.stringify(rows), model = learnGrandeRules(rows, ['tactical'])
  assert.equal(model.rules.length, 1)
  assert.equal(predictsGrande({ tactical: true }, model), true)
  assert.equal(predictsGrande({ tactical: false }, model), false)
  assert.equal(JSON.stringify(rows), before)
})
test('false-positive cost changes selection at the declared operating points', () => {
  const rows = [true, true, true, true, false].map(label => ({ label, features: { tactical: true } }))
  assert.equal(learnGrandeRules(rows, ['tactical'], 'cautious').rules.length, 0)
  assert.equal(learnGrandeRules(rows, ['tactical'], 'exploratory').rules.length, 1)
})
test('insufficient positive support cannot create an exception for a single move', () => {
  const rows = [true, true, false].map(label => ({ label, features: { tactical: label } }))
  assert.equal(learnGrandeRules(rows, ['tactical']).rules.length, 0)
})
test('two-predicate conjunction can distinguish positives from separate negatives', () => {
  const rows = [
    ...Array.from({ length: 3 }, () => ({ label: true, features: { a: true, b: true } })),
    ...Array.from({ length: 4 }, () => ({ label: false, features: { a: true, b: false } })),
    ...Array.from({ length: 4 }, () => ({ label: false, features: { a: false, b: true } })),
  ]
  const model = learnGrandeRules(rows, ['a', 'b'])
  assert.equal(model.rules[0].predicates.length, 2)
  assert.equal(predictsGrande({ a: true, b: false }, model), false)
})
test('unknown evidence is not interpreted as a false predicate', () => {
  assert.equal(matchesRule({ gap: null }, [{ name: 'gap', value: false }]), false)
  assert.equal(matchesRule({ gap: null }, [{ name: 'gap', value: true }]), false)
})
test('selection is deterministic and needs new positive support for a second rule', () => {
  const rows = Array.from({ length: 3 }, () => ({ label: true, features: { a: true, b: true } }))
  const first = learnGrandeRules(rows, ['b', 'a']), second = learnGrandeRules([...rows].reverse(), ['a', 'b'])
  assert.deepEqual(first, second)
  assert.equal(first.rules.length, 1)
})
test('missing features, invalid policies or labels are rejected', () => {
  assert.throws(() => learnGrandeRules([{ label: true, features: {} }], ['a']), TypeError)
  assert.throws(() => learnGrandeRules([], [], 'unknown'), TypeError)
  assert.throws(() => learnGrandeRules([{ label: 'Grande', features: { a: true } }], ['a']), TypeError)
})
test('held-out and historical labels cannot enter training or affect its model', () => {
  const samples = [
    ...Array.from({ length: 3 }, () => ({ gameId: 'p1', eligible: true, label: true, features: { a: true } })),
    { gameId: 'p2', eligible: true, label: false, features: { a: true } },
    { gameId: 'historical', eligible: true, label: false, features: { a: true } },
    { gameId: 'p1', eligible: false, label: false, features: { a: true } },
  ]
  const training = trainingWithoutGame(samples, ['p1', 'p2'], 'p2')
  assert.equal(training.length, 3)
  const model = learnGrandeRules(training, ['a'])
  samples[3].label = true; samples[4].label = true
  assert.deepEqual(learnGrandeRules(trainingWithoutGame(samples, ['p1', 'p2'], 'p2'), ['a']), model)
  assert.throws(() => trainingWithoutGame(samples, ['p1', 'p2'], 'historical'), TypeError)
})
