import { describe, it, expect } from 'vitest'
import { Chess } from 'chess.js'
import { detectMaterialRealization } from '../src/lib/materialRealization.js'
import { classifySpecialMove, formatSpecialAssessment, reclassifySpecialMoves } from '../src/lib/specialClassification.js'

function history(fen, sans) {
  const game = new Chess(fen)
  return sans.map((san, index) => {
    const fenBefore = game.fen(), move = game.move(san)
    return { ply: index + 1, fenBefore, fenAfter: game.fen(), playedMove: move.san,
      playedUci: `${move.from}${move.to}${move.promotion ?? ''}`, classification: 'best' }
  })
}
function evidence(entry, best = 650, second = -650) {
  const game = new Chess(entry.fenBefore), alternative = game.moves({ verbose: true }).find(move => `${move.from}${move.to}${move.promotion ?? ''}` !== entry.playedUci)
  const first = { multipv: 1, depth: 15, evalCp: best, pv: [entry.playedUci] }
  const next = { multipv: 2, depth: 15, evalCp: second, pv: [`${alternative.from}${alternative.to}${alternative.promotion ?? ''}`] }
  const after = new Chess(entry.fenAfter), reply = after.moves({ verbose: true })[0]
  const child = { multipv: 1, depth: 15, evalCp: -best, pv: [`${reply.from}${reply.to}${reply.promotion ?? ''}`] }
  return { ...entry, engine: { ...first, lines: [first, next] }, playedEngine: { ...child, lines: [child] } }
}

describe('material realization distinct from new critical decisions', () => {
  it.each([
    ['white', '4k3/8/8/8/8/8/1r6/RR2K3 b - - 0 1', ['Rxb1+', 'Rxb1']],
    ['black', 'rr2k3/1R6/8/8/8/8/8/4K3 w - - 0 1', ['Rxb8+', 'Rxb8']],
  ])('recognizes an immediate equal material recovery for %s', (_, fen, sans) => {
    const [previous, entry] = history(fen, sans)
    expect(detectMaterialRealization(entry, previous)?.kind).toBe('immediate-material-recovery')
  })

  it('does not treat a lower-value capture as equal recovery', () => {
    const [previous, entry] = history('4k3/8/8/8/8/8/1b6/RR2K3 b - - 0 1', ['Bxa1', 'Rxa1'])
    expect(detectMaterialRealization(entry, previous)).toBeNull()
  })

  it.each([
    ['white', '4k3/8/8/1q6/2N5/8/8/4K3 w - - 0 1', ['Nd6+', 'Kf8', 'Nxb5']],
    ['black', '4k3/8/8/2n5/1Q6/8/8/4K3 b - - 0 1', ['Nd3+', 'Kf1', 'Nxb4']],
  ])('recognizes a checking fork realization for %s after a king reply outside the PV', (_, fen, sans) => {
    const [own, previous, entry] = history(fen, sans)
    expect(detectMaterialRealization(entry, previous, own)?.kind).toBe('checking-fork-realization')
    expect(detectMaterialRealization(entry, { ...previous, fenAfter: own.fenAfter }, own)).toBeNull()
    expect(detectMaterialRealization(entry, previous, { ...own, ply: 99 })).toBeNull()
    expect(detectMaterialRealization(entry, previous)).toBeNull()
  })

  it('keeps a recapture numeric when novelty is not established and preserves new opportunities', () => {
    const [previous, raw] = history('4k3/8/8/8/8/8/1r6/RR2K3 b - - 0 1', ['Rxb1+', 'Rxb1'])
    const entry = evidence(raw)
    const context = { ...previous, engine: { depth: 15, evalCp: -650 } }
    const result = classifySpecialMove(entry, context)
    expect(result.classification).toBe('best')
    expect(result.specialAssessment.grande.status).toBe('candidate')
    expect(formatSpecialAssessment(result)).toContain('Ripresa materiale')
    expect(classifySpecialMove(entry, { ...context, engine: { depth: 15, evalCp: 0 } }).classification).toBe('great')
    expect(classifySpecialMove(entry).classification).toBe('great')
  })

  it('does not infer a checking fork from a nonchecking attack or a changed target', () => {
    const [own, previous, entry] = history('7k/8/8/1q6/2N5/8/8/4K3 w - - 0 1', ['Nd6', 'Kh7', 'Nxb5'])
    expect(detectMaterialRealization(entry, previous, own)).toBeNull()
    const [first, reply, last] = history('4k3/8/8/1q6/2N5/8/8/4K3 w - - 0 1', ['Nd6+', 'Kd7', 'Nc4'])
    expect(detectMaterialRealization(last, reply, first)).toBeNull()
  })

  it('applies the fork novelty check equally to live classification and saved history', () => {
    const [own, rawPrevious, raw] = history('4k3/p7/8/1q6/2N5/8/P7/4K3 w - - 0 1', ['Nd6+', 'Kf8', 'Nxb5'])
    const previous = { ...rawPrevious, engine: { depth: 15, evalCp: -650 } }, entry = evidence(raw)
    const live = classifySpecialMove(entry, previous, own)
    const saved = reclassifySpecialMoves([own, previous, entry]).at(-1)
    expect(live.classification).toBe('best')
    expect(saved.specialAssessment.grande).toEqual(live.specialAssessment.grande)
    expect(formatSpecialAssessment(saved)).toContain('precedente doppio attacco')
  })

  it('recomputes labels saved by the previous policy instead of protecting stale Grande', () => {
    const [previous, raw] = history('4k3/8/8/8/8/8/1r6/RR2K3 b - - 0 1', ['Rxb1+', 'Rxb1'])
    const entry = { ...evidence(raw), classification: 'great', baseClassification: 'best', specialAssessment: { version: 'counterfactual-v1' } }
    expect(classifySpecialMove(entry, { ...previous, engine: { depth: 15, evalCp: -650 } }).classification).toBe('best')
    expect(entry.classification).toBe('great')
  })
})
