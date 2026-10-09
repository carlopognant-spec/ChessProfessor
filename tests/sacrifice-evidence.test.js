import { readFileSync } from 'node:fs'
import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { collectSacrificeEvidence, confirmedCompensation } from '../src/lib/sacrificeEvidence.js'
import { classifySpecialMove, reclassifySpecialMoves, displaySpecialMoves, formatSpecialAssessment } from '../src/lib/specialClassification.js'
import { analyzeGame } from '../src/lib/gameAnalysis.js'
import { createOpeningBook } from '../src/lib/openingBook.js'

const archived = JSON.parse(readFileSync(new URL('../agent-output/external-specials-probe-2026-10-09T14-03-37-245Z/results.json', import.meta.url)))
const example = () => structuredClone(archived.entries.slice(12, 16))
function mirroredExample() {
  const entries = example(), fields = entries[0].fenBefore.split(' ')
  fields[0] = fields[0].split('/').reverse().map(row => row.replace(/[a-zA-Z]/g,
    c => c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase())).join('/')
  fields[1] = fields[1] === 'w' ? 'b' : 'w'
  fields[2] = fields[2].replace(/[a-zA-Z]/g, c => c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase())
  const flip = uci => uci.replace(/[1-8]/g, rank => String(9 - Number(rank)))
  if (fields[3] !== '-') fields[3] = flip(fields[3])
  const game = new Chess(fields.join(' '))
  for (const entry of entries) {
    entry.fenBefore = game.fen()
    entry.playedUci = flip(entry.playedUci)
    const move = game.move({ from: entry.playedUci.slice(0, 2), to: entry.playedUci.slice(2, 4) })
    entry.playedMove = move.san; entry.fenAfter = game.fen()
    for (const [engine, fen] of [[entry.engine, entry.fenBefore], [entry.playedEngine, entry.fenAfter]]) {
      engine.fen = fen
      for (const line of [...engine.lines, ...(engine.specialLines ?? [])]) {
        line.pv = line.pv.map(flip); delete line.raw
      }
    }
  }
  return entries
}
describe('reuse of exact-position sacrifice evidence', () => {
  it('recovers real acceptance coverage and corroborates compensation without changing default labels', () => {
    const [own, previous, entry, next] = example()
    const original = JSON.stringify([entry, next])
    const evidence = collectSacrificeEvidence(entry, next)
    expect(evidence.acceptanceLines).toHaveLength(5)
    expect(evidence.confirmations[0]).toMatchObject({ captureUci: 'g4f3', line: { evalCp: 442 } })
    expect(classifySpecialMove(entry, previous, own).classification).toBe('best')
    expect(classifySpecialMove(entry, previous, own, { ...evidence, allowConfirmation: false })
      .specialAssessment.brilliant.reason).toBe('unresolved-tactical-sequence')
    const result = classifySpecialMove(entry, previous, own, evidence)
    expect(result.classification).toBe('brilliant')
    expect(result.specialAssessment.version).toBe('counterfactual-v6')
    expect(result.specialAssessment.brilliant.offers[0].corroboration).toMatchObject({
      acceptanceDepth: 12, confirmationDepth: 17, proofAgainstEveryDefense: false })
    expect(JSON.stringify([entry, next])).toBe(original)
  })

  it('rejects stale FEN, nonadjacent ply, illegal played move and incorrect engine position', () => {
    for (const mutate of [
      next => { next.fenBefore = next.fenAfter },
      next => { next.ply++ },
      next => { next.playedUci = 'a1a8' },
      next => { next.fenAfter = next.fenBefore },
    ]) {
      const [, , entry, next] = example(); mutate(next)
      expect(collectSacrificeEvidence(entry, next)).toBeNull()
    }
    const [, , entry, next] = example()
    next.engine.fen = next.fenAfter
    expect(collectSacrificeEvidence(entry, next).acceptanceLines).toEqual([])
    next.playedEngine.fen = next.fenBefore
    expect(collectSacrificeEvidence(entry, next).confirmations).toEqual([])
  })

  it('does not reconstruct incomplete snapshots from newer legacy scores or choose around conflicts', () => {
    for (const mutate of [
      next => { next.engine.specialLines = [] },
      next => { next.engine.specialLines.pop() },
      next => { next.engine.specialLines[1].depth++ },
      next => { next.engine.specialLines[1].pv = [...next.engine.specialLines[0].pv] },
      next => { next.engine.specialLines[0].evalCp = 500 },
      next => { next.engine.specialLines[2].bound = true },
      next => { next.engine.specialLines[2].pv.push('a1a8') },
    ]) {
      const [, , entry, next] = example(); mutate(next)
      expect(collectSacrificeEvidence(entry, next)?.acceptanceLines ?? []).toEqual([])
    }
  })

  it('requires unbounded favorable and legal confirmation, not the actual game result', () => {
    for (const mutate of [
      next => { next.playedEngine.lines[0].bound = true },
      next => { next.playedEngine.lines[0].depth = 0 },
      next => { next.playedEngine.lines[0].evalCp = -500 },
      next => { next.playedEngine.lines[0].pv = ['a1a8'] },
      next => { next.playedEngine.lines[0].pv = next.playedEngine.lines[0].pv.slice(0, 1) },
    ]) {
      const [own, previous, entry, next] = example(); mutate(next)
      const evidence = collectSacrificeEvidence(entry, next)
      expect(classifySpecialMove(entry, previous, own, evidence).classification).toBe('best')
    }
    const [own, previous, entry, next] = example()
    next.playedEngine.lines[0].evalCp = 1800
    const evidence = collectSacrificeEvidence(entry, next)
    expect(classifySpecialMove(entry, previous, own, evidence).classification).toBe('best')
  })

  it('never repairs an existing bounded or duplicate acceptance by replacing it', () => {
    for (const duplicate of [false, true]) {
      const [own, previous, entry, next] = example()
      const evidence = collectSacrificeEvidence(entry, next)
      const root = { ...evidence.acceptanceLines[2], multipv: 2, depth: 16, bound: !duplicate }
      entry.playedEngine.lines.push(root)
      if (duplicate) entry.playedEngine.lines.push({ ...root, multipv: 3 })
      expect(classifySpecialMove(entry, previous, own, evidence).classification).toBe('best')
    }
  })

  it('does not trust a confirmation for another capture or position', () => {
    const [, , entry, next] = example(), evidence = collectSacrificeEvidence(entry, next)
    const acceptance = evidence.acceptanceLines[2]
    expect(confirmedCompensation(evidence, 'g4f3', next.fenAfter, acceptance)).not.toBeNull()
    expect(confirmedCompensation(evidence, 'g4h3', next.fenAfter, acceptance)).toBeNull()
    expect(confirmedCompensation(evidence, 'g4f3', entry.fenAfter, acceptance)).toBeNull()
    expect(confirmedCompensation(evidence, 'g4f3', next.fenAfter, { ...acceptance, bound: true })).toBeNull()
  })

  it('normalizes both searches correctly for a Black sacrifice', () => {
    const [own, previous, entry, next] = mirroredExample()
    expect(new Chess(entry.fenBefore).turn()).toBe('b')
    const evidence = collectSacrificeEvidence(entry, next)
    const result = classifySpecialMove(entry, previous, own, evidence)
    expect(result.classification).toBe('brilliant')
    expect(result.specialAssessment.brilliant.offers[0]).toMatchObject({ san: 'gxf6',
      corroboration: { acceptanceDepth: 12, confirmationDepth: 17 } })
  })

  it('refreshes v5 archives using subsequent evidence without searches or mutation and remains idempotent', () => {
    const entries = structuredClone(archived.entries), original = JSON.stringify(entries)
    const first = reclassifySpecialMoves(entries), second = reclassifySpecialMoves(first)
    expect(first[14].classification).toBe('brilliant')
    expect(first[16].classification).toBe('brilliant')
    expect(first[20].classification).toBe('great')
    expect(first[18].classification).toBe('best')
    expect(first.map(e => e.classification)).toEqual(second.map(e => e.classification))
    expect(JSON.stringify(second)).toBe(JSON.stringify(first))
    expect(JSON.stringify(entries)).toBe(original)
    expect(displaySpecialMoves(first)[14].classification).toBe('best')
    expect(formatSpecialAssessment(first[14])).toContain('confermata anche')
  })

  it('updates the live previous move only after its acceptance search arrives, with the same result as archives', async () => {
    const entries = archived.entries.slice(0, 16), snapshots = []
    let before = 0, after = 0
    const results = await analyzeGame({ moves: entries.map(e => e.playedMove), openingBook: createOpeningBook([]),
      analyzePosition: async fen => { const e = entries[before++]; expect(fen).toBe(e.fenBefore); return e.engine },
      analyzePlayedPosition: async fen => { const e = entries[after++]; expect(fen).toBe(e.fenAfter); return e.playedEngine },
      onEntry: (_entry, rows) => { if (rows.length >= 15) snapshots.push(rows[14].classification) } })
    expect(snapshots).toEqual(['best', 'brilliant'])
    expect(before).toBe(16); expect(after).toBe(16)
    expect(results.map(e => e.classification)).toEqual(reclassifySpecialMoves(results).map(e => e.classification))
  })
})
