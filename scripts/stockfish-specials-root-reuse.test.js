import test from 'node:test'
import assert from 'node:assert/strict'
import { Chess } from 'chess.js'
import { comparableRoot, selectRootSnapshot } from './stockfish-specials-root-reuse.js'

const engine = () => ({ lines: [
  { multipv: 1, depth: 12, evalCp: 10, mate: null, pv: ['e7e5'] },
  { multipv: 2, depth: 12, evalCp: 8, mate: null, pv: ['c7c5'] },
] })
function inputs() {
  const game = new Chess(), fenBefore = game.fen(); game.move('e4')
  return { entry: { fenBefore: game.fen(), engine: engine() },
    previous: { fenBefore, fenAfter: game.fen(), uci: 'e2e4', playedEngine: engine() } }
}
test('valid current source is preferred regardless of alternate scores', () => {
  const { entry, previous } = inputs(); previous.playedEngine.lines[0].evalCp = 2000
  assert.equal(selectRootSnapshot(entry, previous).engine, entry.engine)
})
test('structural failure can reuse an adjacent snapshot without mutation', () => {
  const { entry, previous } = inputs(); entry.engine.lines[0].depth++
  const saved = JSON.stringify({ entry, previous }), selected = selectRootSnapshot(entry, previous)
  assert.equal(selected.engine, previous.playedEngine)
  assert.equal(selected.source, 'previous-child-same-fen')
  assert.equal(JSON.stringify({ entry, previous }), saved)
})
test('depth, bound, missing score and duplicated root invalidate comparison', () => {
  for (const change of [
    e => { e.lines[0].depth++ }, e => { e.lines[0].bound = 'upperbound' },
    e => { e.lines[1].evalCp = null }, e => { e.lines[1].pv[0] = e.lines[0].pv[0] },
    e => { e.lines[1].raw = 'info score cp 8 lowerbound' },
  ]) { const e = engine(); change(e); assert.equal(comparableRoot(e), false) }
})
test('invalid FEN adjacency or previous move never supplies a replacement', () => {
  for (const change of [p => { p.fenAfter = p.fenBefore }, p => { p.uci = 'e2e3' }, p => { p.fenBefore = 'invalid' }]) {
    const { entry, previous } = inputs(); entry.engine.lines[0].depth++; change(previous)
    assert.equal(selectRootSnapshot(entry, previous).engine, entry.engine)
  }
})
test('mate scores and the black-to-white boundary are supported', () => {
  const game = new Chess(); game.move('e4'); const before = game.fen(); game.move('e5')
  const entry = { fenBefore: game.fen(), engine: {} }
  const replacement = engine(); replacement.lines[0].mate = 4; replacement.lines[0].evalCp = null
  const previous = { fenBefore: before, fenAfter: game.fen(), uci: 'e7e5', playedEngine: replacement }
  assert.equal(selectRootSnapshot(entry, previous).engine, replacement)
})
