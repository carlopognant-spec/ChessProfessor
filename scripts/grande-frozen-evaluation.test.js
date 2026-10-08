import test from 'node:test'
import assert from 'node:assert/strict'
import { Chess } from 'chess.js'
import { applyFrozenGrande, validateFrozenModel, frozenMetrics, evaluateFrozenGame } from './grande-frozen-evaluation.js'

const model = { schemaVersion: 1, version: 'grande-prudent-candidate-v1', category: 'great',
  eligibility: { commonClassification: 'best', playedIsPv1: true, isBookMove: false, deliveredMate: false, minimumLegalMoves: 2, preserveBrilliantV1: true },
  model: { rules: [{ predicates: [{ name: 'afterError', value: true }, { name: 'capture', value: false }] }] } }
function history(last = 'Nf3') {
  const game = new Chess(); game.move('e4')
  const previous = { fenBefore: game.fen(), playedUci: 'e7e5', classification: 'blunder' }
  game.move('e5'); previous.fenAfter = game.fen()
  const entry = { fenBefore: game.fen(), classification: 'best', isEngineBest: true, isBookMove: false }
  const m = game.move(last); entry.playedUci = `${m.from}${m.to}${m.promotion ?? ''}`; entry.fenAfter = game.fen()
  return { entry, previous }
}
test('fixed rule is applied without labels, training or mutation', () => {
  const { entry, previous } = history(), before = JSON.stringify({ entry, previous, model })
  const result = applyFrozenGrande(entry, previous, model)
  assert.equal(result.classification, 'great')
  assert.equal(JSON.stringify({ entry, previous, model }), before)
  entry.expected = 'Errore grave'
  assert.equal(applyFrozenGrande(entry, previous, model).classification, 'great')
})
test('missing preceding score or broken chain causes insufficient evidence', () => {
  for (const change of [p => { p.classification = 'unclassified' }, p => { p.fenAfter = p.fenBefore }, p => { p.playedUci = 'e7e6' }]) {
    const { entry, previous } = history(); change(previous)
    assert.equal(applyFrozenGrande(entry, previous, model).frozenStatus, 'insufficient')
  }
})
test('first move, ordinary preceding move and non-best roots cannot match', () => {
  const { entry, previous } = history()
  assert.equal(applyFrozenGrande(entry, null, model).classification, 'best')
  previous.classification = 'best'
  assert.equal(applyFrozenGrande(entry, previous, model).classification, 'best')
  previous.classification = 'blunder'; entry.isEngineBest = false
  assert.equal(applyFrozenGrande(entry, previous, model).classification, 'best')
})
test('protected categories including Geniale remain unchanged', () => {
  for (const classification of ['book', 'missed', 'brilliant', 'excellent']) {
    const { entry, previous } = history(); entry.classification = classification
    assert.equal(applyFrozenGrande(entry, previous, model).classification, classification)
  }
})
test('changed model or feature contract is rejected rather than silently interpreted', () => {
  const wrong = structuredClone(model); wrong.model.rules[0].predicates[0].name = 'expected'
  assert.throws(() => validateFrozenModel(wrong))
  const wrongEligibility = structuredClone(model); wrongEligibility.eligibility.minimumLegalMoves = 1
  assert.throws(() => validateFrozenModel(wrongEligibility))
})
test('unannotated predictions never count as false positives; no assignments means undefined precision', () => {
  const rows = [
    { predicted: 'Grande', expected: 'Grande', excluded: false },
    { predicted: 'Grande', expected: null, excluded: false },
    { predicted: 'Grande', expected: 'Forzata', excluded: true },
  ]
  const m = frozenMetrics(rows)
  assert.equal(m.tp, 1); assert.equal(m.fp, 0); assert.equal(m.unlabelledGrande, 1)
  assert.equal(frozenMetrics([{ predicted: 'Migliore', expected: 'Grande', excluded: false }]).precision, null)
})

function syntheticGame() {
  const game = new Chess(), entries = []
  for (const [index, san] of ['e4', 'e5', 'Nf3'].entries()) {
    const fenBefore = game.fen(), move = game.move(san), uci = `${move.from}${move.to}`
    const best = index === 1 ? 'c7c5' : uci, cp = index === 0 ? 0 : 1000
    const rootLines = [{ multipv: 1, depth: 12, evalCp: cp, mate: null, pv: [best] }]
    if (index === 1) rootLines.push({ multipv: 2, depth: 12, evalCp: -1000, mate: null, pv: [uci] })
    entries.push({ ply: index + 1, san, uci, fenBefore, fenAfter: game.fen(),
      engine: { evalCp: cp, mate: null, lines: rootLines },
      playedEngine: { evalCp: index === 2 ? -1000 : index === 1 ? 1000 : 0, mate: null, lines: [] } })
  }
  const fixture = { id: 'synthetic', pgn: game.pgn(), annotations: [{ ply: 1, san: 'e4', category: 'Migliore' }] }
  const cache = { pgn: fixture.pgn, packageVersion: '19.0.0', searchLimit: { kind: 'nodes', value: 200000 }, multiPv: 5,
    threads: 1, hashMb: 16, scorePerspective: 'side-to-move at each FEN', entries }
  return { fixture, cache, book: { hasPosition: () => false } }
}
test('direct evaluator accepts partial annotations and reproduces the frozen rule', () => {
  const { fixture, cache, book } = syntheticGame()
  const rows = evaluateFrozenGame(fixture, cache, model, book)
  assert.equal(rows[2].predicted, 'Grande')
  assert.equal(rows[2].expected, null)
  assert.equal(frozenMetrics(rows).unlabelledGrande, 1)
  assert.equal(frozenMetrics(rows).fp, 0)
})
test('missing scores remain unknown; incoherent PGN, cache or annotations fail', () => {
  const { fixture, cache, book } = syntheticGame()
  delete cache.entries[1].playedEngine
  cache.entries[1].engine.lines.pop()
  const rows = evaluateFrozenGame(fixture, cache, model, book)
  assert.equal(rows[2].status, 'insufficient')
  assert.equal(rows[2].reason, 'missing-previous-score')
  const short = structuredClone(cache); short.entries.pop()
  assert.throws(() => evaluateFrozenGame(fixture, short, model, book))
  const duplicate = structuredClone(fixture); duplicate.annotations.push(duplicate.annotations[0])
  assert.throws(() => evaluateFrozenGame(duplicate, cache, model, book))
  const wrong = structuredClone(cache); wrong.pgn = '1. d4 *'
  assert.throws(() => evaluateFrozenGame(fixture, wrong, model, book))
})
test('a PGN starting from a custom FEN and Black to move is evaluated from that position', () => {
  const initial = '7k/8/8/8/8/8/8/R6K b - - 0 10'
  const game = new Chess(initial), move = game.move('Kh7')
  const pgn = '[SetUp "1"]\n[FEN "' + initial + '"]\n\n10... Kh7 *'
  const { cache, book } = syntheticGame()
  cache.pgn = pgn
  cache.entries = [{ ply: 1, san: move.san, uci: 'h8h7', fenBefore: initial, fenAfter: game.fen(),
    engine: { evalCp: 0, mate: null, lines: [{ multipv: 1, depth: 12, evalCp: 0, mate: null, pv: ['h8h7'] }] },
    playedEngine: { evalCp: 0, mate: null, lines: [] } }]
  const rows = evaluateFrozenGame({ pgn, annotations: [] }, cache, model, book)
  assert.equal(rows.length, 1)
  assert.equal(rows[0].san, 'Kh7')
  assert.equal(rows[0].predicted, 'Migliore')
})
