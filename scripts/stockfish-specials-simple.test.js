import test from 'node:test'
import assert from 'node:assert/strict'
import { Chess } from 'chess.js'
import { classifySimpleSpecial } from './stockfish-specials-simple.js'

const fen = 'rnbq1rk1/ppp2ppp/3bpn2/3p4/3P4/2NBPN2/PPP2PPP/R1BQ1RK1 w - - 0 1'
const line = (multipv, evalCp, pv) => ({ multipv, evalCp, mate: null, depth: 15, pv })
function sequence(fen, sans) {
  const game = new Chess(fen)
  return sans.map(san => { const m = game.move(san); return `${m.from}${m.to}${m.promotion ?? ''}` })
}
function sample({ best = 100, alternative = 50, child = -100, sacrifice = false, initialFen = fen } = {}) {
  const game = new Chess(initialFen)
  const sans = sacrifice ? ['Bxh7+', 'Kxh7', 'Ng5+', 'Kg8', 'Qh5', 'Re8', 'Qxf7+', 'Kh8', 'Qxe8+'] : ['e4', 'dxe4', 'Nxe4']
  const pv = sequence(initialFen, sans)
  game.move({ from: pv[0].slice(0, 2), to: pv[0].slice(2, 4) })
  return { classification: 'best', isBookMove: false, fenBefore: initialFen, fenAfter: game.fen(), playedUci: pv[0],
    engine: { lines: [line(1, best, pv), line(2, alternative, sequence(initialFen, [sacrifice ? 'e4' : 'a3']))] },
    playedEngine: { lines: [line(1, child, pv.slice(1))] } }
}
test('ordinary near-equal best move remains best', () => {
  const entry = sample(), snapshot = JSON.stringify(entry)
  assert.equal(classifySimpleSpecial(entry).classification, 'best')
  assert.equal(JSON.stringify(entry), snapshot)
})
test('only-good and only-winning are estimates, not full alternative proofs', () => {
  const saved = classifySimpleSpecial(sample({ best: 0, alternative: -400, child: 0 }))
  assert.equal(saved.specialReason, 'only-good-estimate')
  assert.equal(saved.classification, 'great')
  assert.equal(saved.specialEvidence.fullAlternativeProof, false)
  const winning = classifySimpleSpecial(sample({ best: 600, alternative: 0, child: -600 }))
  assert.equal(winning.specialReason, 'only-winning-estimate')
})
test('two winning alternatives including two mating lines do not establish Grande', () => {
  const entry = sample({ best: 800, alternative: 700, child: -800 })
  assert.equal(classifySimpleSpecial(entry).special, null)
  entry.engine.lines.forEach(l => { l.mate = 5; l.evalCp = null })
  entry.playedEngine.lines[0].mate = -5
  assert.equal(classifySimpleSpecial(entry).special, null)
})
test('missing, bound, mismatched depth, duplicate roots and illegal PV abstain', () => {
  const cases = [
    e => { e.engine.lines[1].depth = 14 },
    e => { e.engine.lines[0].raw = 'info score cp 100 lowerbound' },
    e => { e.playedEngine.lines[0].evalCp = null },
    e => { e.engine.lines[1].pv[0] = e.playedUci },
    e => { e.engine.lines[1].pv.push('a1a8') },
    e => { e.fenAfter = e.fenBefore },
  ]
  for (const change of cases) { const e = sample(); change(e); assert.equal(classifySimpleSpecial(e).specialStatus, 'insufficient') }
})
test('independent child disagreement prevents a special classification', () => {
  const result = classifySimpleSpecial(sample({ best: 600, alternative: 0, child: 400 }))
  assert.equal(result.specialReason, 'unstable-root-child')
})
test('accepted bishop sacrifice with a quiet continuation is a brilliant candidate', () => {
  const result = classifySimpleSpecial(sample({ sacrifice: true }))
  assert.equal(result.classification, 'brilliant')
  assert.equal(result.specialEvidence.acceptance, 'Kxh7')
  assert.equal(result.specialEvidence.materialDeltas[0], -2)
  assert.equal(result.specialEvidence.compensationIsEngineEstimate, true)
})
test('already winning alternative and truncated sacrifice prevent brilliant', () => {
  const winning = sample({ sacrifice: true, alternative: 500, best: 550, child: -550 })
  assert.notEqual(classifySimpleSpecial(winning).classification, 'brilliant')
  const short = sample({ sacrifice: true })
  short.playedEngine.lines[0].pv = short.playedEngine.lines[0].pv.slice(0, 2)
  assert.equal(classifySimpleSpecial(short).specialStatus, 'insufficient')
})
test('ordinary capture and recapture is not a piece sacrifice', () => {
  assert.notEqual(classifySimpleSpecial(sample()).classification, 'brilliant')
  const before = '6kr/8/8/7Q/8/3B4/8/6K1 w - - 0 1'
  const pv = sequence(before, ['Bh7+', 'Rxh7', 'Qxh7+', 'Kf8', 'Qh8+', 'Ke7', 'Qe5+', 'Kd7', 'Qd5+'])
  const game = new Chess(before); game.move('Bh7+')
  const exchange = { classification: 'best', fenBefore: before, fenAfter: game.fen(), playedUci: pv[0],
    engine: { lines: [line(1, 100, pv), line(2, 50, sequence(before, ['Bc4+']))] },
    playedEngine: { lines: [line(1, -100, pv.slice(1))] } }
  assert.notEqual(classifySimpleSpecial(exchange).classification, 'brilliant')
})
test('book, missed, non-best and mate delivered are protected', () => {
  for (const classification of ['book', 'missed', 'excellent', 'blunder', 'unclassified']) {
    assert.equal(classifySimpleSpecial({ ...sample(), classification }).classification, classification)
  }
  const game = new Chess(); ['f3', 'e5', 'g4'].forEach(san => game.move(san))
  const entry = { classification: 'best', fenBefore: game.fen(), playedUci: 'd8h4' }
  game.move('Qh4#'); entry.fenAfter = game.fen()
  assert.equal(classifySimpleSpecial(entry).specialReason, 'terminal-after')
})
test('black scores use the mover perspective too', () => {
  const game = new Chess(); game.move('e4')
  const fenBefore = game.fen(); game.move('e5')
  const e = { classification: 'best', fenBefore, fenAfter: game.fen(), playedUci: 'e7e5',
    engine: { lines: [line(1, 0, ['e7e5', 'g1f3']), line(2, -400, ['a7a6'])] },
    playedEngine: { lines: [line(1, 0, ['g1f3'])] } }
  assert.equal(classifySimpleSpecial(e).classification, 'great')
})
test('opponent-error context requires a legally adjacent opposite-color move', () => {
  const game = new Chess(); game.move('e4')
  const previousFen = game.fen(); game.move('e5')
  const fenBefore = game.fen(); game.move('Nf3')
  const entry = { classification: 'best', fenBefore, fenAfter: game.fen(), playedUci: 'g1f3',
    engine: { lines: [line(1, 600, ['g1f3', 'b8c6']), line(2, 500, ['b1c3'])] },
    playedEngine: { lines: [line(1, -600, ['b8c6'])] } }
  const previous = { classification: 'blunder', fenBefore: previousFen, fenAfter: fenBefore, playedUci: 'e7e5', playedProbability: 0.1,
    engine: { lines: [line(1, 0, ['e7e5'])] } }
  assert.equal(classifySimpleSpecial(entry, previous).specialReason, 'opponent-error-opportunity')
  assert.equal(classifySimpleSpecial(entry, { ...previous, playedUci: 'e7e6' }).special, null)
  assert.equal(classifySimpleSpecial(entry, { ...previous, playedProbability: null }).special, null)
})
