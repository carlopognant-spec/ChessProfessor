import test from 'node:test'
import assert from 'node:assert/strict'
import { Chess } from 'chess.js'
import { readFile } from 'node:fs/promises'
import { attributeOffer, classifyAttributedBrilliant } from './brilliant-offer-attribution-v3.js'

const cache = async id => JSON.parse(await readFile(new URL(`../tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/${id}.json`, import.meta.url)))
const personal = await cache('personal-06')
const sample = personal.entries[10]
const history = earlierFen => {
  const earlier = new Chess(earlierFen)
  const reply = earlier.moves({ verbose: true })[0]; earlier.move(reply)
  return [{ ply: 1, fenAfter: earlierFen }, { ply: 2, fenBefore: earlierFen, fenAfter: earlier.fen() },
    { ply: 3, fenBefore: earlier.fen() }]
}

test('moved piece remains attributable without history', () => {
  assert.equal(attributeOffer(sample, { isMovedPiece: true }, null, null).status, 'new')
  assert.equal(classifyAttributedBrilliant(sample, 'Migliore').brilliant, true)
})
test('left-hanging offer without history is unknown', () => {
  assert.equal(attributeOffer(sample, { isMovedPiece: false }, null, null).status, 'unknown')
})
test('existing legal capture makes the stationary offer persistent', () => {
  const [prev, between, current] = history('6k1/8/8/8/5n2/3B4/8/6K1 b - - 0 1')
  // White bishop d3 was capturable by Nf4 before White's next move.
  assert.equal(attributeOffer(current, { offeredSquare: 'd3', offeredType: 'b' }, prev, between).status, 'persistent')
})
test('pinned attackers do not create a previous legal capture', () => {
  const [prev, between, current] = history('4k3/4n3/8/5B2/8/8/8/K3R3 b - - 0 1')
  assert.equal(new Chess(prev.fenAfter).attackers('f5', 'b').length, 1)
  assert.equal(attributeOffer(current, { offeredSquare: 'f5', offeredType: 'b' }, prev, between).status, 'new')
})
test('broken history fails instead of pretending attribution is new', () => {
  const [prev, between, current] = history('6k1/8/8/8/5n2/3B4/8/6K1 b - - 0 1')
  assert.throws(() => attributeOffer(current, { offeredSquare: 'd3', offeredType: 'b' }, { ...prev, ply: 0 }, between))
})
test('repeated historical knight offer is filtered without mutating cache', async () => {
  const data = await cache('game-1-chigorin-steinitz-1892'), entry = data.entries[54]
  const saved = JSON.stringify(data.entries.slice(52, 55))
  assert.equal(classifyAttributedBrilliant(entry, 'Migliore', data.entries[52], data.entries[53]).reason, 'persistent-offer')
  assert.equal(JSON.stringify(data.entries.slice(52, 55)), saved)
})
