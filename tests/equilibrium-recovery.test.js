import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import { readFileSync } from 'node:fs'
import { classifyAnalysisEntries, moveEvaluationFields } from '../src/lib/classification.js'
import { classifySpecialMove, formatSpecialAssessment, reclassifySpecialMoves } from '../src/lib/specialClassification.js'

const line = (rank, cp, pv) => ({ multipv: rank, depth: 15, evalCp: cp, mate: null, pv })
function example(side) {
  const white = side === 'w'
  const game = new Chess(white ? '4kr2/p7/8/8/2B5/8/P7/4K3 b - - 0 1' : '4k3/p7/8/2b5/8/8/P7/4KR2 w - - 0 1')
  const fenBefore = game.fen(), prior = game.move(white ? 'Rf7' : 'Rf2')
  const uci = `${prior.from}${prior.to}`, currentUci = white ? 'c4f7' : 'c5f2'
  const p1 = line(1, 500, [white ? 'e8e7' : 'e1e2']), p2 = line(2, 0, [uci])
  const previous = { ply: 1, classification: 'book', isBookMove: true, fenBefore, fenAfter: game.fen(),
    playedMove: prior.san, playedUci: uci, engine: { ...p1, lines: [p1, p2] },
    playedEngine: { ...line(1, 0, [currentUci]), lines: [line(1, 0, [currentUci])] } }
  const before = game.fen(), move = game.move(white ? 'Bxf7+' : 'Bxf2+')
  const root = line(1, 0, [currentUci]), alternative = line(2, -100, [white ? 'c4d3' : 'c5d6'])
  const child = line(1, 0, [white ? 'e8f7' : 'e1f2'])
  const entry = { ply: 2, classification: 'best', fenBefore: before, fenAfter: game.fen(), playedMove: move.san,
    playedUci: currentUci, engine: { ...root, lines: [root, alternative] }, playedEngine: { ...child, lines: [child] } }
  return { previous, entry }
}

describe('recovery from poor to approximately equal positions', () => {
  it.each(['w', 'b'])('recognizes the recovery for %s with an independently checked opponent error', side => {
    const { previous, entry } = example(side)
    const result = classifySpecialMove(entry, previous)
    expect(result.classification).toBe('great')
    expect(result.specialAssessment.grande).toMatchObject({ reason: 'equilibrium-recovery',
      previousNumericalClassification: 'blunder', coverage: { allLegal: false }, maintainedIndex: 0.5 })
    expect(formatSpecialAssessment(result)).toContain('Recupera una posizione circa equilibrata')
  })

  it('rejects missing history, a retained good alternative, invalid scores and incoherent adjacent searches', () => {
    for (const change of [
      e => { e.previous.fenAfter = e.previous.fenBefore },
      e => { e.previous.engine.lines[0].evalCp = 0 },
      e => { e.previous.engine.lines[1].bound = true },
      e => { e.previous.playedEngine.lines[0].evalCp = 400 },
      e => { e.entry.engine.lines[1].evalCp = 0 },
      e => { e.entry.engine.lines[1].depth-- },
    ]) {
      const e = example('w'); change(e)
      expect(classifySpecialMove(e.entry, e.previous).classification).toBe('best')
    }
    const e = example('w')
    expect(classifySpecialMove(e.entry).classification).toBe('best')
  })

  it('recognizes the actual Bxf7 and migrates numerical results saved under the previous policy', () => {
    const cache = JSON.parse(readFileSync(new URL('./fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/personal-02.json', import.meta.url)))
    const entries = cache.entries.slice(18, 21).map(e => classifyAnalysisEntries([{ ...e, playedMove: e.san,
      ...moveEvaluationFields(e.engine, e.playedEngine, e.uci), isBookMove: false }])[0])
    const original = JSON.stringify(entries)
    entries[2].specialAssessment = { version: 'counterfactual-v4' }
    const result = reclassifySpecialMoves(entries).at(-1)
    expect(result.playedMove).toBe('Bxf7')
    expect(result.classification).toBe('great')
    expect(result.specialAssessment.grande.reason).toBe('equilibrium-recovery')
    delete entries[2].specialAssessment
    expect(JSON.stringify(entries)).toBe(original)
  })
})
