import test from 'node:test'
import assert from 'node:assert/strict'
import { rootFailure, pairFailure, completeDecision } from './grande-policy.js'
const cp = evalCp => ({ evalCp, mate: null, bound: false })
test('exact guard boundaries and early rejection', () => {
  assert.equal(rootFailure(cp(50), 'played'), null)
  assert.equal(rootFailure(cp(49), 'played'), 'played-below-guard')
  assert.equal(rootFailure(cp(-250), 'alternative'), null)
  assert.equal(rootFailure(cp(-249), 'alternative'), 'alternative-above-guard')
})
test('mate, bound and missing scores abstain', () => {
  for (const score of [null, { evalCp: NaN }, { evalCp: 100, mate: 3 }, { ...cp(100), bound: true }]) assert.equal(rootFailure(score, 'played'), 'insufficient-score')
})
test('stability applies to both roots and budgets', () => {
  assert.equal(pairFailure(cp(50), cp(100), 'played'), null)
  assert.equal(pairFailure(cp(50), cp(101), 'played'), 'unstable-score')
  assert.equal(pairFailure(cp(-250), cp(-301), 'alternative'), 'unstable-score')
})
test('all legal alternatives are required including roots outside original MultiPV', () => {
  const played = [cp(80), cp(90)], alternatives = [[cp(-300), cp(-320)]]
  assert.equal(completeDecision(played, alternatives, 2).verified, true)
  assert.equal(completeDecision(played, alternatives, 3).reason, 'incomplete-coverage')
  assert.equal(completeDecision(played, [], 1).verified, false)
  assert.equal(completeDecision(played, [...alternatives, [cp(0), cp(0)]], 3).verified, false)
})
test('early rejection implies the full decision fails regardless of missing companion score', () => {
  for (const first of [-249, -100, 0, 300]) for (const second of [-500, -250, 0]) {
    assert.notEqual(rootFailure(cp(first), 'alternative'), null)
    assert.equal(completeDecision([cp(80), cp(90)], [[cp(first), cp(second)]], 2).verified, false)
  }
})
