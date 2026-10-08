import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { Chess } from 'chess.js'
import { auditCompensationHistory } from './brilliant-compensation-history.js'

const cache = JSON.parse(await readFile(new URL('../tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/personal-02.json', import.meta.url)))
function sample(previousCp = 1000, currentCp = -1000) {
  const [previous, between, current] = structuredClone(cache.entries.slice(11, 14))
  const old = new Chess(previous.fenAfter).moves({ verbose: true }).filter(m => m.captured === 'n' && m.to === 'a6')
    .map((m, i) => ({ multipv: i + 1, depth: 10, evalCp: previousCp, pv: [`${m.from}${m.to}`] }))
  previous.playedEngine.lines = old
  between.engine.lines = structuredClone(old)
  for (const line of current.playedEngine.lines) { line.evalCp = currentCp; line.mate = null; line.bound = false; delete line.raw }
  return [current, previous, between]
}
test('opponent-perspective scores show previously poor and now compensated', () => {
  const args = sample(), saved = JSON.stringify(args)
  const r = auditCompensationHistory(...args).offers.find(o => o.offer.offeredSquare === 'a6')
  assert.equal(r.status, 'previously-poor-now-compensated')
  assert.equal(r.previous[0].usableCount, 2)
  assert.equal(JSON.stringify(args), saved)
})
test('already favorable acceptance is recorded rather than credited as new', () => {
  const r = auditCompensationHistory(...sample(-1000)).offers[0]
  assert.equal(r.status, 'already-compensated')
})
test('two searches disagreeing across threshold are not cherry-picked', () => {
  const args = sample(); args[2].engine.lines[0].evalCp = -1000
  const r = auditCompensationHistory(...args).offers[0]
  assert.equal(r.status, 'previous-score-or-defense-disagreement')
  assert.ok(r.previous[0].minProbability < 0.45 && r.previous[0].maxProbability > 0.45)
})
test('bound scores and uncovered replies yield missing coverage', () => {
  const args = sample(); args[1].playedEngine.lines[0].bound = true; args[2].engine.lines = []
  assert.equal(auditCompensationHistory(...args).offers[0].status, 'missing-score-coverage')
})
test('poor current acceptance cannot be called compensated', () => {
  assert.equal(auditCompensationHistory(...sample(1000, 1000)).offers[0].status, 'currently-uncompensated')
})
test('missing history is unknown for a stationary offered piece', () => {
  assert.equal(auditCompensationHistory(sample()[0]).offers[0].status, 'missing-history')
})
test('invalid temporal chain fails explicitly', () => {
  const args = sample(); args[2].fenAfter = args[2].fenBefore
  assert.throws(() => auditCompensationHistory(...args))
})
