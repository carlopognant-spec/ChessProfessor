import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { buildMoveExplanation } from '../src/lib/moveExplanation.js'

const line = (multipv, evalCp, pv, mate = null) => ({ multipv, evalCp, pv, mate, depth: 12 })
function entryFor(fen, san, lines) {
  const board = new Chess(fen), move = board.move(san)
  return { fenBefore: fen, fenAfter: board.fen(), playedMove: san,
    playedUci: move.from + move.to + (move.promotion ?? ''),
    engine: { fen, bestmove: lines[0]?.pv[0], lines, specialLines: lines, analysisMetadata: { multiPv: lines.length } },
    playedEngine: { fen: board.fen() } }
}
function comparison(side = 'w') {
  const board = new Chess()
  if (side === 'b') board.move('e4')
  return side === 'w' ? entryFor(board.fen(), 'e4', [line(1, 100, ['d2d4', 'd7d5']), line(2, -100, ['e2e4', 'e7e5', 'g1f3'])])
    : entryFor(board.fen(), 'e5', [line(1, 100, ['c7c5', 'g1f3', 'd7d6']), line(2, -100, ['e7e5', 'g1f3', 'b8c6'])])
}

describe('legal deterministic move explanations', () => {
  it.each(['w', 'b'])('compares a complete legal root pair for %s without requiring a scored child', side => {
    const entry = comparison(side), explanation = buildMoveExplanation(entry)
    expect(explanation.alternative).toContain('Il confronto registrato favorisce')
    expect(explanation.lines.alternative.illustrative).toBe(true)
    expect(explanation.lines.alternative.forced).toBe(false)
    expect(explanation.lines.punishment.uci[0]).toBe(entry.playedUci)
    expect(explanation.limitations.join(' ')).toContain('non dimostra risposte obbligate')
  })

  it('describes a capture and legal recapture without treating an equal exchange as a lost piece', () => {
    const entry = entryFor('3qk3/8/8/3r4/3R4/8/8/4K3 w - - 0 1', 'Rxd5',
      [line(1, 0, ['d4d5', 'd8d5', 'e1f1']), line(2, 0, ['e1f1', 'd5d4'])])
    const explanation = buildMoveExplanation(entry)
    expect(explanation.why).toContain('cattura torre')
    expect(explanation.why).toContain('ripresa Qxd5')
    expect(explanation.why).toContain('non dimostra un guadagno netto')
    expect(explanation.facts.material.playedLineDelta).toBe(0)
    expect(explanation.punishment).toContain('cambia di 0')
    expect(explanation.why).not.toContain('perde una torre')
  })

  it('describes a complete legal mating reference conditionally, without proving a forced win', () => {
    const board = new Chess(); for (const san of ['f3', 'e5', 'g4']) board.move(san)
    const entry = entryFor(board.fen(), 'Nc6', [line(1, null, ['d8h4'], 1), line(2, 0, ['b8c6', 'b1c3'])])
    const explanation = buildMoveExplanation(entry)
    expect(explanation.opportunity).toContain('matto a favore dei Neri')
    expect(explanation.opportunity).toContain('non dimostra che ogni difesa')
    expect(explanation.lines.alternative.san).toEqual(['Qh4#'])
    expect(explanation.alternative).toContain('favorisce Qh4# rispetto a Nc6')
  })

  it('describes mate suffered in the played variation without saying all replies are forced', () => {
    const board = new Chess(); for (const san of ['f3', 'e5']) board.move(san)
    const entry = entryFor(board.fen(), 'g4', [line(1, 0, ['g1h3', 'd7d5']), line(2, null, ['g2g4', 'd8h4'], -1)])
    const explanation = buildMoveExplanation(entry)
    expect(explanation.punishment).toContain('matto a favore dei Neri')
    expect(explanation.punishment).toContain('non una prova contro ogni difesa')
    expect(explanation.lines.punishment.endsInMate).toBe(true)
    expect(explanation.why).toContain('Qh4# conclude con matto')
    expect(explanation.why).not.toContain('causa tattica non è dimostrabile')
  })

  it('proves a delivered mate directly from the actual board even without engine data', () => {
    const board = new Chess(); for (const san of ['f3', 'e5', 'g4']) board.move(san)
    const entry = entryFor(board.fen(), 'Qh4#', []); delete entry.engine; delete entry.playedEngine
    expect(buildMoveExplanation(entry).why).toBe('Qh4# dà scacco matto nella posizione verificata.')
  })

  it.each(['illegal-tail', 'lowerbound', 'upperbound', 'bound-raw', 'incomplete', 'wrong-fen'])
  ('rejects %s evidence instead of claiming a better alternative', kind => {
    const entry = comparison()
    if (kind === 'illegal-tail') entry.engine.specialLines[0].pv.push('a1a8')
    if (kind === 'lowerbound') entry.engine.specialLines[1].lowerbound = true
    if (kind === 'upperbound') entry.engine.specialLines[0].upperbound = true
    if (kind === 'bound-raw') entry.engine.specialLines[0].raw = 'info score cp 100 lowerbound'
    if (kind === 'incomplete') entry.engine.specialLines.pop()
    if (kind === 'wrong-fen') entry.engine.fen = entry.fenAfter
    const explanation = buildMoveExplanation(entry)
    expect(explanation.lines.alternative).toBeNull()
    expect(explanation.alternative).not.toContain('favorisce')
    expect(explanation.limitations.length).toBeGreaterThan(0)
  })

  it('uses a one-ply exact root score for comparison without inventing an opponent continuation', () => {
    const entry = comparison()
    entry.engine.specialLines[1].pv = ['e2e4']
    const explanation = buildMoveExplanation(entry)
    expect(explanation.alternative).toContain('favorisce d4 rispetto a e4')
    expect(explanation.lines.punishment).toBeNull()
    expect(explanation.punishment).toBe('La causa tattica non è dimostrabile dai dati disponibili.')
    entry.engine.specialLines[0].pv = ['d2d4']
    expect(buildMoveExplanation(entry).lines.alternative.san).toEqual(['d4'])
    expect(buildMoveExplanation(entry).alternative).toContain('favorisce d4 rispetto a e4')
  })

  it('rejects a false or truncated mating score even when the surviving PV prefix is legal', () => {
    const board = new Chess(); for (const san of ['f3', 'e5', 'g4']) board.move(san)
    for (const pv of [['d8h3'], ['d8h4']]) {
      const entry = entryFor(board.fen(), 'Nc6', [line(1, null, pv, 2), line(2, 0, ['b8c6', 'b1c3'])])
      const explanation = buildMoveExplanation(entry)
      expect(explanation.lines.alternative).toBeNull()
      expect(explanation.opportunity).not.toContain('termina con matto')
    }
  })

  it('keeps legal legacy lines illustrative and declines an unproven superiority claim', () => {
    const entry = comparison(); delete entry.engine.specialLines
    const explanation = buildMoveExplanation(entry)
    expect(explanation.lines.alternative.san).toEqual(['d4', 'd5'])
    expect(explanation.alternative).toContain('non dimostrano che sia migliore')
    expect(explanation.limitations.join(' ')).toContain('legacy')
  })

  it('allows a legal child continuation only as illustration and rejects a wrong-position or bounded child', () => {
    const entry = comparison(); delete entry.engine
    entry.playedEngine = { fen: entry.fenAfter, ...line(1, 100, ['e7e5', 'g1f3']) }
    expect(buildMoveExplanation(entry).lines.punishment.san).toEqual(['e4', 'e5', 'Nf3'])
    entry.playedEngine.lowerbound = true
    expect(buildMoveExplanation(entry).lines.punishment).toBeNull()
    delete entry.playedEngine.lowerbound; entry.playedEngine.fen = entry.fenBefore
    expect(buildMoveExplanation(entry).lines.punishment).toBeNull()
  })

  it('falls back explicitly when no tactical cause is demonstrated', () => {
    const entry = comparison(); delete entry.engine; delete entry.playedEngine
    const explanation = buildMoveExplanation(entry)
    expect(explanation.status).toBe('limited')
    expect(explanation.why).toContain('causa tattica non è dimostrabile')
    expect(explanation.lines).toEqual({ alternative: null, punishment: null })
  })

  it.each(['fenBefore', 'fenAfter', 'playedUci', 'san'])('rejects an inconsistent %s before explaining the move', field => {
    const entry = comparison()
    if (field === 'fenBefore') entry.fenBefore = 'invalid fen'
    if (field === 'fenAfter') entry.fenAfter = entry.fenBefore
    if (field === 'playedUci') entry.uci = 'd2d4'
    if (field === 'san') entry.playedMove = 'd4'
    expect(buildMoveExplanation(entry).status).toBe('invalid')
  })

  it('does not mutate frozen input entries, metadata or PV arrays', () => {
    const entry = comparison(), before = JSON.stringify(entry)
    const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value) } }
    freeze(entry)
    const result = buildMoveExplanation(entry)
    expect(result.alternative).toContain('favorisce')
    result.lines.alternative.uci.push('not-an-input-mutation')
    expect(JSON.stringify(entry)).toBe(before)
  })

  it.each([{}, 'unavailable', null])('handles malformed legacy engine lines %j without crashing the explanation', lines => {
    const entry = comparison(); delete entry.engine.specialLines
    entry.engine.lines = lines
    entry.playedEngine.lines = lines
    expect(() => buildMoveExplanation(entry)).not.toThrow()
    expect(buildMoveExplanation(entry).alternative).toContain('Non è disponibile')
  })
})
