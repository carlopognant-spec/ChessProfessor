import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { classifyBrilliantOffer } from './brilliant-offer-v2.js'

const cache = async id => JSON.parse(await readFile(new URL(`../tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/${id}.json`, import.meta.url)))
const personal = await cache('personal-06')
const sacrifice = personal.entries.find(e => e.ply === 11)
const historical = await cache('game-1-chigorin-steinitz-1892')
const supplemental = JSON.parse(await readFile(new URL('../agent-output/brilliant-rb3-acceptance-2026-10-08T02-03-27-001Z/results.json', import.meta.url))).searches

test('legal compensated sacrifice qualifies without mutating evidence', () => {
  const saved = JSON.stringify(sacrifice)
  assert.equal(classifyBrilliantOffer(sacrifice, 'Migliore').brilliant, true)
  assert.equal(JSON.stringify(sacrifice), saved)
})
test('ordinary categories remain protected', () => {
  for (const base of ['Libro', 'Mossa mancata', 'Buona', 'Errore']) assert.equal(classifyBrilliantOffer(sacrifice, base).reason, 'protected-category')
})
test('missing acceptance abstains even if the best defense refuses', () => {
  const entry = structuredClone(sacrifice)
  entry.playedEngine.lines = [{ multipv: 1, evalCp: 0, pv: [] }]
  assert.equal(classifyBrilliantOffer(entry, 'Ottima').reason, 'missing-acceptance-score')
})
test('opponent positive score correctly vetoes compensation', () => {
  const entry = structuredClone(sacrifice)
  for (const line of entry.playedEngine.lines) { line.evalCp = 1000; line.mate = null }
  assert.equal(classifyBrilliantOffer(entry, 'Migliore').reason, 'poor-after-position')
})
test('bound acceptance and insufficient PV are unknown rather than positive', () => {
  const entry = structuredClone(sacrifice)
  const primary = entry.playedEngine.lines.find(l => l.multipv === 1)
  primary.raw += ' upperbound'
  assert.equal(classifyBrilliantOffer(entry, 'Migliore').status, 'insufficient')
  delete primary.raw
  primary.pv = primary.pv.slice(0, 2)
  assert.equal(classifyBrilliantOffer(entry, 'Migliore').reason, 'short-acceptance-pv')
})
test('Rb3 keeps nonsacrificing alternative veto despite targeted acceptance evidence', () => {
  const entry = historical.entries.find(e => e.ply === 53)
  assert.equal(classifyBrilliantOffer(entry, 'Ottima', supplemental).reason, 'winning-nonsacrifice-alternative')
})
test('matching supplements cover a left-hanging piece, wrong FEN never covers it', () => {
  // Remove root alternatives only to isolate coverage behavior, not to measure the classifier.
  const entry = structuredClone(historical.entries.find(e => e.ply === 53))
  entry.engine.lines = []
  assert.equal(classifyBrilliantOffer(entry, 'Ottima').status, 'insufficient')
  const result = classifyBrilliantOffer(entry, 'Ottima', supplemental)
  assert.equal(result.brilliant, true)
  assert.equal(result.evidence.supplementalUsed[0].budgetNodes, 1000000)
  assert.equal(result.evidence.bestDefenseRefuses, true)
  assert.equal(result.evidence.qualifyingAcceptances[0].isMovedPiece, false)
  assert.equal(classifyBrilliantOffer(entry, 'Ottima', supplemental.map(s => ({ ...s, fen: 'wrong' }))).status, 'insufficient')
})
test('invalid supplement fails instead of silently generating a score', () => {
  const entry = structuredClone(historical.entries.find(e => e.ply === 53)); entry.engine.lines = []
  assert.throws(() => classifyBrilliantOffer(entry, 'Ottima', supplemental.map(s => ({ ...s, engineVersion: 'wrong' }))))
})
