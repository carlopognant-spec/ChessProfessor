import test from 'node:test'
import assert from 'node:assert/strict'
import { Chess } from 'chess.js'
import { captureContextFeatures } from './grande-capture-context.js'

function entry(game, san, cp = 0) {
  const fenBefore = game.fen(), move = game.move(san)
  return { fenBefore, fenAfter: game.fen(), uci: `${move.from}${move.to}${move.promotion ?? ''}`,
    engine: { lines: [{ multipv: 1, depth: 12, evalCp: cp, mate: null }] } }
}
test('captures the preceding moved piece and records legal recapture without mutation', () => {
  const game = new Chess(), own = entry(game, 'e4'), previous = entry(game, 'd5'), current = entry(game, 'exd5')
  const before = JSON.stringify([current, previous, own]), features = captureContextFeatures(current, previous, own)
  assert.equal(features.capturesPreviousMovedPiece, true)
  assert.equal(features.opponentCanRecapture, true)
  assert.equal(features.previousOwnCapture, false)
  assert.equal(JSON.stringify([current, previous, own]), before)
})
test('pinned geometric defender does not create a legal recapture', () => {
  const game = new Chess('4k3/4n3/2p5/1B6/8/8/8/4R1K1 w - - 0 1')
  const current = entry(game, 'Bxc6+')
  assert.equal(captureContextFeatures(current).opponentCanRecapture, false)
})
test('promotion square can be recaptured', () => {
  const game = new Chess('1r5k/P7/8/8/8/8/8/7K w - - 0 1')
  const current = entry(game, 'a8=Q')
  assert.equal(captureContextFeatures(current).opponentCanRecapture, true)
})
test('en passant capture identifies the actual captured pawn square', () => {
  const game = new Chess('7k/8/8/8/3p4/8/4P3/7K w - - 0 1')
  const current = entry(game, 'e4')
  assert.equal(captureContextFeatures(current).opponentCanRecapture, true)
})
test('previous probabilities use each position side and missing/bound evidence stays unknown', () => {
  const game = new Chess(), own = entry(game, 'e4', 600), previous = entry(game, 'e5', 0), current = entry(game, 'Nf3')
  assert.equal(captureContextFeatures(current, previous, own).alreadyWinningAtPreviousOwnMove, true)
  assert.equal(captureContextFeatures(current, previous, own).nonWinningBeforeOpponent, true)
  previous.engine.lines[0].evalCp = -600
  assert.equal(captureContextFeatures(current, previous, own).nonWinningBeforeOpponent, false)
  previous.engine.lines[0].raw = 'info score cp -600 upperbound'
  assert.equal(captureContextFeatures(current, previous, own).nonWinningBeforeOpponent, null)
})
test('broken history never contributes contextual features; black material is normalized', () => {
  const game = new Chess(), own = entry(game, 'e4'), previous = entry(game, 'd5'), current = entry(game, 'exd5')
  previous.fenAfter = previous.fenBefore
  assert.equal(captureContextFeatures(current, previous, own).previousOpponentCapture, null)
  const blackGame = new Chess('7k/8/8/8/8/8/8/Q6K b - - 0 1'), black = entry(blackGame, 'Kh7')
  assert.equal(captureContextFeatures(black).materialNonPositive, true)
})
