import test from 'node:test'
import assert from 'node:assert/strict'
import { completeMultiPv } from './stockfish-complete-multipv.js'

const moves = ['e2e4', 'd2d4', 'g1f3', 'c2c4', 'b1c3']
const line = (depth, rank, root = moves[rank - 1], suffix = '') => `info depth ${depth} multipv ${rank} score cp ${30 - rank} nodes ${depth * 100 + rank} ${suffix} pv ${root}`
const block = depth => moves.map((move, i) => line(depth, i + 1, move))
test('incomplete next iteration keeps a complete snapshot, unlike latest-by-rank', () => {
  const result = completeMultiPv([...block(10), line(11, 1), 'bestmove e2e4'])
  assert.deepEqual(result.lines.map(l => l.depth), [10, 10, 10, 10, 10])
  assert.deepEqual(result.latestLines.map(l => l.depth), [11, 10, 10, 10, 10])
  assert.equal(result.actualNodes, 1101)
  assert.equal(result.nodesAtSnapshot, 1005)
  assert.equal(result.bestmoveMatchesSnapshot, true)
})
test('duplicate roots never overwrite the last valid block', () => {
  const bad = block(11); bad[1] = line(11, 2, 'e2e4')
  assert.equal(completeMultiPv([...block(10), ...bad]).completedDepth, 10)
})
test('bounds and missing rank break a block without destroying prior completion', () => {
  for (const next of [[line(11, 1), line(11, 2, 'd2d4', 'upperbound'), ...block(11).slice(2)],
    [line(11, 1), ...block(11).slice(2)]]) {
    assert.equal(completeMultiPv([...block(10), ...next]).completedDepth, 10)
  }
})
test('new PV1 begins a fresh block and may replace the previous snapshot', () => {
  const result = completeMultiPv([...block(10), line(11, 1), ...block(12)])
  assert.equal(result.completedDepth, 12)
  assert.equal(result.completeBlocks, 2)
})
test('missing PV/depth and absence of complete blocks remain unknown', () => {
  assert.equal(completeMultiPv(['info depth 10 score cp 20 nodes 30', ...block(10).slice(1)]).completedDepth, null)
  assert.deepEqual(completeMultiPv([line(10, 1)]).lines, [])
  assert.throws(() => completeMultiPv([], 0), TypeError)
})
test('mate scores and final bestmove disagreement are explicit', () => {
  const raw = block(10); raw[0] = raw[0].replace('score cp 29', 'score mate 5')
  const result = completeMultiPv([...raw, 'bestmove d2d4'])
  assert.equal(result.lines[0].mate, 5)
  assert.equal(result.lines[0].evalCp, null)
  assert.equal(result.bestmoveMatchesSnapshot, false)
})
