import test from 'node:test'
import assert from 'node:assert/strict'
import { Chess } from 'chess.js'
import { auditLegalFork } from './grande-fork-legal.js'

function entry(fenBefore, san) {
  const game = new Chess(fenBefore), move = game.move(san)
  return { fenBefore, fenAfter: game.fen(), san: move.san, uci: `${move.from}${move.to}${move.promotion ?? ''}` }
}

test('king and queen fork enumerates every legal defense without treating the king as capturable', () => {
  const candidate = entry('3q3k/8/3N4/8/8/8/8/K7 w - - 0 1', 'Nf7+')
  const audit = auditLegalFork(candidate)
  assert.equal(audit.summary.legalReplies, new Chess(candidate.fenAfter).moves().length)
  assert.equal(audit.summary.everyReplyAllowsPositiveImmediateIncrement, true)
  assert.equal(audit.summary.minimumBestIncrementalDelta, 9)
  assert.ok(audit.targets.some(target => target.type === 'k'))
  assert.ok(audit.replies.every(reply => reply.captures.every(capture => capture.capturedType !== 'k')))
})

test('a pinned rook geometrically attacks targets but cannot legally capture them sideways', () => {
  const audit = auditLegalFork(entry('4r2k/8/8/8/q5n1/4R3/8/4K3 w - - 0 1', 'Re4'))
  const reply = audit.replies.find(reply => reply.san === 'Kg7')
  assert.ok(reply)
  assert.ok(reply.trackedTargets.filter(target => ['a4', 'g4'].includes(target.id)).every(target => target.attackedBySamePiece))
  assert.ok(reply.captures.every(capture => !['a4', 'g4'].includes(capture.targetId)))
  assert.equal(audit.summary.everyReplyAllowsPositiveImmediateIncrement, false)
})

test('en passant removes the attacking pawn from its real square', () => {
  const audit = auditLegalFork(entry('7k/8/8/8/3p4/8/4P3/K7 w - - 0 1', 'e4'))
  const reply = audit.replies.find(reply => reply.uci === 'd4e3')
  assert.ok(reply)
  assert.equal(reply.attackerCaptured, true)
  assert.equal(reply.materialDeltaAfterReply, -1)
  assert.deepEqual(reply.captures, [])
})

test('immediate legal recapture can erase an apparent queen capture gain', () => {
  const audit = auditLegalFork(entry('r6k/6b1/8/8/r7/3Q4/8/1K6 w - - 0 1', 'Qd4'))
  const reply = audit.replies.find(reply => reply.san === 'Kh7')
  const capture = reply.captures.find(capture => capture.uci === 'd4a4')
  assert.equal(capture.afterCaptureDelta, 5)
  assert.ok(capture.recaptures.some(recapture => recapture.uci === 'a8a4'))
  assert.equal(capture.worstImmediateDelta, -4)
  assert.equal(capture.incrementalDelta, -4)
})

test('black uses the same material perspective and all legal check evasions', () => {
  const audit = auditLegalFork(entry('k7/8/8/8/8/3n4/8/3Q3K b - - 0 1', 'Nf2+'))
  assert.equal(audit.side, 'b')
  assert.equal(audit.summary.everyReplyAllowsPositiveImmediateIncrement, true)
  assert.equal(audit.summary.minimumBestIncrementalDelta, 9)
})

test('target identity follows an escaping rook instead of another piece on its old square', () => {
  const audit = auditLegalFork(entry('r6k/6b1/8/8/r7/3Q4/8/1K6 w - - 0 1', 'Qd4'))
  const reply = audit.replies.find(reply => reply.uci === 'a4b4')
  const target = reply.trackedTargets.find(target => target.id === 'a4')
  assert.equal(target.square, 'b4')
  assert.equal(target.moved, true)
  assert.ok(reply.captures.some(capture => capture.uci === 'd4b4' && capture.targetId === 'a4'))
})

test('castling follows both the king and the rook identities', () => {
  const audit = auditLegalFork(entry('4k2r/8/8/8/8/8/1B6/1K6 w k - 0 1', 'Ba1'))
  const reply = audit.replies.find(reply => reply.san === 'O-O')
  assert.ok(reply)
  const rook = reply.trackedTargets.find(target => target.id === 'h8')
  assert.equal(rook.square, 'f8')
  assert.equal(rook.moved, true)
})

test('a promoted target keeps its identity and contributes its actual value to material', () => {
  const audit = auditLegalFork(entry('6k1/8/8/8/8/1Q6/p7/7K w - - 0 1', 'Qa3'))
  const reply = audit.replies.find(reply => reply.uci === 'a2a1q')
  const target = reply.trackedTargets.find(target => target.id === 'a2')
  assert.equal(target.square, 'a1')
  assert.equal(target.type, 'q')
  const capture = reply.captures.find(capture => capture.uci === 'a3a1')
  assert.equal(capture.targetId, 'a2')
  assert.equal(capture.capturedType, 'q')
  assert.equal(capture.afterCaptureDelta, 1)
})

test('a terminal candidate has no universal-defense claim and invalid cached PVs fail', () => {
  const mate = auditLegalFork(entry('7k/8/5KQ1/8/8/8/8/8 w - - 0 1', 'Qg7#'))
  assert.equal(mate.summary.legalReplies, 0)
  assert.equal(mate.summary.everyReplyAllowsPositiveImmediateIncrement, false)
  const candidate = entry('3q3k/8/3N4/8/8/8/8/K7 w - - 0 1', 'Nf7+')
  assert.throws(() => auditLegalFork({ ...candidate, fenAfter: candidate.fenBefore }), /mismatch/)
  assert.throws(() => auditLegalFork({ ...candidate, playedEngine: { lines: [{ pv: ['h8h6'] }] } }))
})
