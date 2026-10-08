import test from 'node:test'
import assert from 'node:assert/strict'
import { Chess } from 'chess.js'
import { filterPredictedContinuation } from './stockfish-specials-continuation.js'

function history(sans = ['e4', 'e5', 'Nf3'], firstIndex = 0) {
  const game = new Chess(), rows = []
  for (const [index, san] of sans.entries()) {
    const fenBefore = game.fen(), move = game.move(san)
    const numerical = { ply: index + 1, san, fenBefore, fenAfter: game.fen(), playedUci: `${move.from}${move.to}${move.promotion ?? ''}`, classification: 'best' }
    const candidate = { ...numerical, baseClassification: 'best', classification: 'great', special: 'great', specialReason: 'only-good-estimate' }
    rows.push({ numerical, candidate })
  }
  rows[firstIndex].numerical.engine = { lines: [{ multipv: 1, pv: rows.slice(firstIndex).map(r => r.numerical.playedUci) }] }
  rows.forEach((row, i) => { if (i !== firstIndex && i !== rows.length - 1) row.candidate.special = null })
  return rows
}
test('exact predicted continuation restores common classification without mutation', () => {
  const rows = history(), saved = JSON.stringify(rows), result = filterPredictedContinuation(rows)
  assert.equal(result.classification, 'best')
  assert.equal(result.specialReason, 'predicted-continuation')
  assert.deepEqual(result.continuation.prefix, ['e4', 'e5', 'Nf3'])
  assert.equal(JSON.stringify(rows), saved)
})
test('an intervening opponent error allows a new critical decision', () => {
  for (const classification of ['mistake', 'blunder']) {
    const rows = history(); rows[1].numerical.classification = classification
    assert.equal(filterPredictedContinuation(rows).special, 'great')
  }
})
test('PV divergence, missing PV, invalid FEN and stale candidate do not suppress', () => {
  for (const alter of [
    rows => { rows[0].numerical.engine.lines[0].pv[1] = 'c7c5' },
    rows => { delete rows[0].numerical.engine },
    rows => { rows[1].numerical.fenAfter = rows[1].numerical.fenBefore },
    rows => { rows.at(-1).candidate.playedUci = 'b1c3' },
  ]) { const rows = history(); alter(rows); assert.equal(filterPredictedContinuation(rows).special, 'great') }
})
test('ordinary preceding move and opportunity or brilliant categories are preserved', () => {
  const ordinary = history(); ordinary[0].candidate.special = null
  assert.equal(filterPredictedContinuation(ordinary).special, 'great')
  const opportunity = history(); opportunity.at(-1).candidate.specialReason = 'opponent-error-opportunity'
  assert.equal(filterPredictedContinuation(opportunity).special, 'great')
  const brilliant = history(); brilliant.at(-1).candidate.special = 'brilliant'
  assert.equal(filterPredictedContinuation(brilliant).special, 'brilliant')
})
test('black uses the same temporal rule; a previous brilliant can initiate a tactic', () => {
  const rows = history(['e4', 'e5', 'Nf3', 'Nc6'], 1)
  rows[1].candidate.special = 'brilliant'
  assert.equal(filterPredictedContinuation(rows).classification, 'best')
  assert.equal(filterPredictedContinuation(rows).continuation.previousPly, 2)
})
test('eight ply window is enforced', () => {
  const sans = ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'd3', 'd6', 'Nc3', 'Nf6', 'O-O']
  assert.equal(filterPredictedContinuation(history(sans)).special, 'great')
  assert.equal(filterPredictedContinuation(history(sans.slice(0, 9))).classification, 'best')
})
