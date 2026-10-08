import test from 'node:test'
import assert from 'node:assert/strict'
import { Chess } from 'chess.js'
import { auditSacrifices, auditProbability } from './brilliant-sacrifice-audit.js'

function sample(fen, san, replySans) {
  const game = new Chess(fen), move = game.move(san), fenAfter = game.fen()
  const pv = replySans.map(san => { const m = game.move(san); return `${m.from}${m.to}${m.promotion ?? ''}` })
  return { fenBefore: fen, fenAfter, uci: `${move.from}${move.to}${move.promotion ?? ''}`,
    playedEngine: { lines: [{ multipv: 1, depth: 12, evalCp: 0, mate: null, pv }] }, engine: { lines: [] } }
}
test('accepted bishop offering records loss without immediate recapture', () => {
  const e = sample('rnbq1rk1/ppp2ppp/3bpn2/3p4/3P4/2NBPN2/PPP2PPP/R1BQ1RK1 w - - 0 1', 'Bxh7+', ['Kxh7', 'Ng5+', 'Kg8'])
  const saved = JSON.stringify(e), r = auditSacrifices(e), offer = r.offers.find(o => o.replySan === 'Kxh7')
  assert.equal(offer.materialDeltaAfterAcceptance, -2)
  assert.equal(offer.continuation.immediateRecoveryByCapture, false)
  assert.equal(offer.continuation.completeHorizon, false)
  assert.equal(JSON.stringify(e), saved)
})
test('ordinary exchange records immediate material recovery', () => {
  const e = sample('6kr/8/8/7Q/8/3B4/8/6K1 w - - 0 1', 'Bh7+', ['Rxh7', 'Qxh7+', 'Kf8'])
  const offer = auditSacrifices(e).offers.find(o => o.replySan === 'Rxh7')
  assert.equal(offer.materialDeltaAfterAcceptance, -3)
  assert.equal(offer.continuation.immediateRecoveryByCapture, true)
})
test('an acceptance outside cached MultiPV is unknown, not assigned a score', () => {
  const e = sample('rnbq1rk1/ppp2ppp/3bpn2/3p4/3P4/2NBPN2/PPP2PPP/R1BQ1RK1 w - - 0 1', 'Bxh7+', [])
  const offer = auditSacrifices(e).offers.find(o => o.replySan === 'Kxh7')
  assert.equal(offer.cachedAcceptance, false)
  assert.equal(offer.continuation, null)
})
test('bound/mate zero are unknown and negative mate normalizes opponent loss', () => {
  assert.equal(auditProbability({ evalCp: 100, raw: 'score cp 100 upperbound' }), null)
  assert.equal(auditProbability({ mate: 0 }), null)
  assert.equal(auditProbability({ mate: -3 }), 0)
})
test('incoherent FEN and illegal continuation fail explicitly', () => {
  const e = sample('6kr/8/8/7Q/8/3B4/8/6K1 w - - 0 1', 'Bh7+', ['Rxh7'])
  e.playedEngine.lines[0].pv.push('a1a8')
  assert.throws(() => auditSacrifices(e))
  e.fenAfter = e.fenBefore
  assert.throws(() => auditSacrifices(e))
})
