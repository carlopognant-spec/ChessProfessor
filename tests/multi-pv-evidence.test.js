import { describe, expect, it } from 'vitest'
import { createMultiPvEvidence } from '../src/lib/multiPvEvidence.js'

const info = (depth, rank, cp, uci, suffix = '') => `info depth ${depth} multipv ${rank} score cp ${cp}${suffix} pv ${uci}`
function complete(evidence, depth, first, cp) {
  evidence.accept(info(depth, 1, cp, first))
  evidence.accept(info(depth, 2, cp - 20, first === 'e2e4' ? 'd2d4' : 'e2e4'))
}
describe('complete snapshots aligned to the returned first choice', () => {
  it('retains A when a later completed B precedes an unfinished return to A', () => {
    const e = createMultiPvEvidence(2)
    complete(e, 10, 'e2e4', 80); complete(e, 11, 'd2d4', 100)
    e.accept(info(12, 1, 150, 'e2e4'))
    expect(e.finish('e2e4').map(l => [l.depth, l.evalCp])).toEqual([[10, 80], [10, 60]])
    expect(e.finish('d2d4')[0].depth).toBe(11)
    expect(e.finish('g1f3')).toEqual([])
  })
  it('uses the most recent complete matching iteration rather than the most favorable score', () => {
    const e = createMultiPvEvidence(2)
    complete(e, 10, 'e2e4', 200); complete(e, 11, 'e2e4', 30)
    expect(e.finish('e2e4').map(l => l.evalCp)).toEqual([30, 10])
  })
  it.each(['bound', 'duplicate', 'mixed-depth', 'wrong-order'])('does not replace a complete snapshot with a %s iteration', kind => {
    const e = createMultiPvEvidence(2); complete(e, 10, 'e2e4', 80)
    e.accept(info(11, 1, 120, 'e2e4'))
    e.accept(info(kind === 'mixed-depth' ? 10 : 11, kind === 'wrong-order' ? 3 : 2, 100,
      kind === 'duplicate' ? 'e2e4' : 'd2d4', kind === 'bound' ? ' upperbound' : ''))
    expect(e.finish('e2e4')[0].depth).toBe(10)
  })
  it('rejects invalid requested counts', () => {
    for (const count of [0, -1, NaN, 1.5]) expect(() => createMultiPvEvidence(count)).toThrow(RangeError)
  })
})
