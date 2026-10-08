import test from 'node:test'
import assert from 'node:assert/strict'
import { assertAllowedEvaluationPath } from './grande-frozen-input-path.js'

test('reserved paths and env files are rejected across path styles and casing', () => {
  for (const filename of ['C:\\repo\\Partite\\7\\game.json', 'C:/repo/Partite/10/PGN.txt',
    'tests/fixtures/qa/personal-08.json', 'cache/personal-9.json', 'C:/repo/.env.local', '.env']) {
    assert.throws(() => assertAllowedEvaluationPath(filename))
  }
})
test('development and future named inputs are allowed without treating unrelated numbers as games', () => {
  for (const filename of ['tests/fixtures/qa/personal-01.json', 'new-games/session-2026-10-08.json', 'C:/repo/Partite/17/game.json']) {
    assert.doesNotThrow(() => assertAllowedEvaluationPath(filename))
  }
})
