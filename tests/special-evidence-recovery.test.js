import { readFileSync } from 'node:fs'
import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { classifyAnalysisEntries, moveEvaluationFields } from '../src/lib/classification.js'
import { classifySpecialMove, formatSpecialAssessment, displaySpecialMoves } from '../src/lib/specialClassification.js'

const line = (rank, cp, pv, depth = 15) => ({ multipv: rank, depth, evalCp: cp, mate: null, pv })
function history(moves) {
  const game = new Chess()
  return moves.map((san, i) => {
    const fenBefore = game.fen(), move = game.move(san)
    return { ply: i + 1, classification: 'best', playedMove: san, fenBefore, fenAfter: game.fen(),
      playedUci: `${move.from}${move.to}${move.promotion ?? ''}` }
  })
}
function responseExample(capture = false) {
  const [, previous, entry] = history(['e4', capture ? 'd5' : 'e5', capture ? 'exd5' : 'Nf3'])
  const p1 = line(1, 500, [capture ? 'e7e5' : 'd7d5'])
  const p2 = line(2, -300, [previous.playedUci])
  previous.engine = { ...p1, lines: [p1, p2] }
  previous.playedEngine = { ...line(1, 300, [entry.playedUci]), lines: [line(1, 300, [entry.playedUci])] }
  const current = line(1, 500, [entry.playedUci]), child = line(1, -500, ['b8c6'])
  entry.engine = { ...current, lines: [current] }
  entry.playedEngine = { ...child, lines: [child] }
  return { previous, entry }
}

describe('recovery of previously validated evidence families', () => {
  it('uses the actual numerical opponent error even when the stored label is book', () => {
    const { previous, entry } = responseExample()
    previous.classification = 'book'; previous.isBookMove = true
    const result = classifySpecialMove(entry, previous)
    expect(result.classification).toBe('great')
    expect(result.specialAssessment.grande).toMatchObject({ evidenceKind: 'empirical-family',
      modelVersion: 'grande-prudent-candidate-v1', previousNumericalClassification: 'blunder',
      coverage: { allLegal: false, scope: 'best-move-and-opponent-error' } })
    expect(formatSpecialAssessment(result)).toContain('modello sperimentale')
    expect(displaySpecialMoves([result])[0].classification).toBe('best')
  })

  it('does not infer an opponent error from its stored label or from stale history', () => {
    const { previous, entry } = responseExample()
    expect(classifySpecialMove(entry, { ...previous, classification: 'blunder',
      engine: { ...line(1, -300, [previous.playedUci]), lines: [line(1, -300, [previous.playedUci])] } }).classification).toBe('best')
    expect(classifySpecialMove(entry, { ...previous, fenAfter: previous.fenBefore }).classification).toBe('best')
  })

  it('keeps capture and non-best moves outside the fixed empirical family', () => {
    const captured = responseExample(true)
    expect(classifySpecialMove(captured.entry, captured.previous).classification).toBe('best')
    const { previous, entry } = responseExample()
    expect(classifySpecialMove({ ...entry, classification: 'excellent' }, previous).classification).toBe('excellent')
  })

  it('requires legal, unbounded current and previous evidence and independent confirmation', () => {
    for (const change of [
      ({ entry }) => { entry.playedEngine.lines[0].evalCp = 500 },
      ({ entry }) => { entry.engine.lines[0].bound = true },
      ({ previous }) => { previous.engine.lines[1].bound = true },
      ({ entry }) => { entry.engine.lines[0].pv.push('a1a8') },
      ({ entry }) => { entry.playedEngine.lines[0].pv = ['a1a8'] },
    ]) {
      const example = responseExample(); change(example)
      expect(classifySpecialMove(example.entry, example.previous).classification).toBe('best')
    }
  })

  it('recognizes a real compensated offer without requiring unrelated alternatives to have the same depth', () => {
    const cache = JSON.parse(readFileSync(new URL('./fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/personal-06.json', import.meta.url)))
    const entries = cache.entries.slice(8, 11).map(e => classifyAnalysisEntries([{ ...e, playedMove: e.san,
      ...moveEvaluationFields(e.engine, e.playedEngine, e.uci), isBookMove: false }])[0])
    const result = classifySpecialMove(entries[2], entries[1], entries[0])
    expect(result.classification).toBe('brilliant')
    expect(result.specialAssessment.coverage).toMatchObject({ analyzed: 2, available: 5, allLegal: false })
    expect(result.specialAssessment.brilliant.offers[0].san).toBe('Nxe5')
    expect(result.specialAssessment.brilliant.offers[0].continuation[1].san).toBe('d4')
    expect(JSON.stringify(cache)).not.toContain('specialAssessment')
  })

  it('keeps the broad mixed-depth contrast experiment from assigning Grande', () => {
    const cache = JSON.parse(readFileSync(new URL('./fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/personal-03.json', import.meta.url)))
    const e = cache.entries[28]
    const [entry] = classifyAnalysisEntries([{ ...e, playedMove: e.san,
      ...moveEvaluationFields(e.engine, e.playedEngine, e.uci), isBookMove: false }])
    const result = classifySpecialMove(entry)
    expect(result.classification).toBe('best')
    expect(result.specialAssessment.grande.reason).toBe('incomplete-common-depth-snapshot')
  })
})
