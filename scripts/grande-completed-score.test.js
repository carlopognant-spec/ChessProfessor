import test from 'node:test'
import assert from 'node:assert/strict'
import { completedRootScore } from './grande-completed-score.js'
test('a later bound preserves the prior completed depth and node counter', () => {
  const lines = ['info depth 15 score cp 109 nodes 88913 pv d2c3 g8f6', 'info depth 16 score cp 112 lowerbound nodes 200202 pv d2c3 g8f6']
  const result = completedRootScore(lines, 'd2c3')
  assert.equal(result.completed.evalCp, 109)
  assert.equal(result.completed.depth, 15)
  assert.equal(result.completed.nodesAtScore, 88913)
  assert.equal(result.latest.bound, true)
})
test('bounds alone never become completed scores', () => {
  assert.equal(completedRootScore(['info depth 15 score cp -300 upperbound nodes 200000 pv d2c3'], 'd2c3').completed, null)
})
test('wrong root, secondary PV and absent depth do not qualify', () => {
  for (const raw of ['info depth 15 score cp 10 nodes 200000 pv e2e4', 'info depth 15 multipv 2 score cp 10 nodes 200000 pv d2c3', 'info score cp 10 nodes 200000 pv d2c3']) assert.equal(completedRootScore([raw], 'd2c3').completed, null)
})
test('new complete scores replace old ones, with mate preserved', () => {
  const result = completedRootScore(['info depth 12 score cp 300 nodes 10000 pv d2c3', 'info depth 13 score mate 4 nodes 15000 pv d2c3'], 'd2c3')
  assert.equal(result.completed.evalCp, null)
  assert.equal(result.completed.mate, 4)
})
