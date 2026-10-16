import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { detectMaterialRealization } from '../src/lib/materialRealization.js'
import { classifySpecialMove, formatSpecialAssessment } from '../src/lib/specialClassification.js'

const position = '7k/8/8/q4n2/8/2NQ4/3B4/4K3 w - - 0 1'
function history(fen, moves) {
  const board = new Chess(fen)
  return moves.map((san, i) => {
    const fenBefore = board.fen(), m = board.move(san)
    return { ply: i + 1, fenBefore, fenAfter: board.fen(), playedUci: m.from + m.to,
      playedMove: m.san, classification: 'best' }
  })
}
function mirror(fen) {
  const fields = fen.split(' ')
  fields[0] = fields[0].split('/').reverse().join('/').replace(/[a-z]/gi,
    c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())
  fields[1] = fields[1] === 'w' ? 'b' : 'w'
  return fields.join(' ')
}
function evidence(entry) {
  const board = new Chess(entry.fenBefore), first = { multipv: 1, depth: 15, evalCp: 650, pv: [entry.playedUci] }
  const other = board.moves({ verbose: true }).find(m => m.from + m.to !== entry.playedUci)
  const second = { multipv: 2, depth: 15, evalCp: -650, pv: [other.from + other.to] }
  const reply = new Chess(entry.fenAfter).moves({ verbose: true })[0]
  const child = { multipv: 1, depth: 15, evalCp: -650, pv: [reply.from + reply.to] }
  return { ...entry, engine: { ...first, lines: [first, second] }, playedEngine: { ...child, lines: [child] } }
}

describe('material realization after a discovered queen attack', () => {
  it.each([
    ['white', position, ['Ne2', 'Qc7', 'Qxf5']],
    ['black', mirror(position), ['Ne7', 'Qc2', 'Qxf4']],
  ])('recognizes the delayed capture for %s and keeps a new opportunity distinct', (_, fen, moves) => {
    const [own, previous, raw] = history(fen, moves), entry = evidence(raw)
    const untouched = JSON.stringify([own, previous, entry])
    expect(detectMaterialRealization(entry, previous, own)).toMatchObject({
      kind: 'discovered-attack-realization', initiatingMove: moves[0], displacedQueen: moves[1] })
    const context = { ...previous, engine: { depth: 15, evalCp: -650 } }
    const result = classifySpecialMove(entry, context, own)
    expect(result.classification).toBe('best')
    expect(result.specialAssessment.grande).toMatchObject({ status: 'candidate', reason: 'decision-novelty-not-established' })
    expect(formatSpecialAssessment(result)).toContain('precedente attacco scoperto')
    // A fresh large swing is not suppressed by the material description alone.
    expect(classifySpecialMove(entry, { ...context, engine: { depth: 15, evalCp: 0 } }, own).classification).toBe('great')
    expect(classifySpecialMove(entry, context).classification).toBe('great')
    expect(JSON.stringify([own, previous, entry])).toBe(untouched)
    const migrated = classifySpecialMove({ ...entry, classification: 'great', baseClassification: 'best',
      specialAssessment: { version: 'counterfactual-v9' } }, context, own)
    expect(migrated.classification).toBe('best')
    expect(migrated.specialAssessment.version).toBe('counterfactual-v24')
    expect(classifySpecialMove(migrated, context, own)).toEqual(migrated)
  })

  it.each([
    ['an already existing queen attack', '7k/8/8/q4n2/8/3Q4/3B4/1N2K3 w - - 0 1', ['Na3', 'Qc7', 'Qxf5']],
    ['a capture during setup', '7k/8/8/q2p1n2/8/2NQ4/3B4/4K3 w - - 0 1', ['Nxd5', 'Qc7', 'Qxf5']],
    ['a queen capture in reply', '7k/2P5/8/q4n2/8/2NQ4/3B4/4K3 w - - 0 1', ['Ne2', 'Qxc7', 'Qxf5']],
    ['a reply with another piece', position, ['Ne2', 'Kh7', 'Qxf5+']],
    ['a geometrically attacking but pinned bishop', '3r2k1/8/8/q4n2/8/2N4Q/3B4/3K4 w - - 0 1', ['Ne2', 'Qc7', 'Qxf5']],
  ])('does not infer a realization from %s', (_, fen, moves) => {
    const [own, previous, entry] = history(fen, moves)
    expect(detectMaterialRealization(entry, previous, own)).toBeNull()
  })

  it('requires the complete coherent history rather than similar piece placement', () => {
    const [own, previous, entry] = history(position, ['Ne2', 'Qc7', 'Qxf5'])
    for (const prior of [{ ...own, ply: 99 }, { ...own, fenAfter: own.fenBefore }, { ...own, playedUci: 'c3a4' }]) {
      expect(detectMaterialRealization(entry, previous, prior)).toBeNull()
    }
    expect(detectMaterialRealization(entry, { ...previous, fenAfter: own.fenBefore }, own)).toBeNull()
  })
})
