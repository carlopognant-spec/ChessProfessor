import fs from 'node:fs'
import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { classifyMoveOpportunity, formatMoveOpportunity, reclassifyMoveOpportunities } from '../src/lib/moveOpportunities.js'
import { analyzeGame, createGameAnalysisSession } from '../src/lib/gameAnalysis.js'
import { createOpeningBook } from '../src/lib/openingBook.js'

function candidate() {
  const game = new Chess()
  game.move('f3'); game.move('e5'); game.move('g4')
  const fenBefore = game.fen()
  game.move('Nc6')
  return { fenBefore, fenAfter: game.fen(), classification: 'excellent', playedUci: 'b8c6',
    bestMate: 1, playedMate: null, bestProbability: 1, playedProbability: 0.95,
    engine: { mate: 1, pv: ['d8h4'] }, playedEngine: { mate: null, evalCp: -1200 } }
}

describe('missed mating opportunity', () => {
  it('recognizes a verified mating line lost even when a material win remains', () => {
    const result = classifyMoveOpportunity(candidate())
    expect(result.classification).toBe('missed')
    expect(result.baseClassification).toBe('excellent')
    expect(result.missedOpportunity).toMatchObject({ kind: 'forced-mate', mateIn: 1,
      matingLine: { uci: ['d8h4'], san: ['Qh4#'] } })
    expect(formatMoveOpportunity(result.missedOpportunity)).toContain('Matto in 1 non mantenuto')
  })

  it.each(['book', 'unclassified', 'great', 'brilliant'])('preserves %s', classification => {
    const entry = { ...candidate(), classification }
    expect(classifyMoveOpportunity(entry).classification).toBe(classification)
  })

  it('does not mistake a retained or shortened winning mate for a miss', () => {
    const entry = candidate()
    for (const change of [{ playedMate: 5 }, { playedMate: 0 },
      { playedEngine: { mate: -4 } }, { isEngineBest: true },
      { engine: { lines: [{ multipv: 1, mate: 1, pv: ['d8h4'] }, { multipv: 2, mate: 3, pv: ['b8c6'] }] } }]) {
      expect(classifyMoveOpportunity({ ...entry, ...change }).classification).toBe('excellent')
    }
  })

  it('rejects bounds, incomplete PVs, missing child scores and inconsistent positions', () => {
    const entry = candidate()
    for (const change of [
      { engine: { mate: 1, pv: ['d8h4'], raw: 'score mate 1 lowerbound' } },
      { playedEngine: { mate: null, evalCp: -1200, bound: true } },
      { engine: { mate: 2, pv: ['d8h4'] }, bestMate: 2 },
      { engine: { mate: 1, pv: ['b8c6'] } },
      { engine: { mate: 1, pv: ['d8h3'] } },
      { playedEngine: null }, { playedProbability: null },
      { playedUci: 'e2e4' }, { fenAfter: new Chess().fen() },
    ]) expect(classifyMoveOpportunity({ ...entry, ...change }).classification).toBe('excellent')
  })

  it('recalculates archived labels idempotently without changing the stored entries', () => {
    const entries = [candidate()], before = JSON.stringify(entries)
    const updated = reclassifyMoveOpportunities(entries)
    expect(updated[0].classification).toBe('missed')
    expect(reclassifyMoveOpportunities(updated)).toEqual(updated)
    expect(JSON.stringify(entries)).toBe(before)
    const missing = reclassifyMoveOpportunities([{ ...updated[0], engine: null }])
    expect(missing[0].classification).toBe('excellent')
    expect(missing[0].missedOpportunity).toBeNull()
  })

  it('uses the same recognition during game analysis and on cache hits', async () => {
    const entry = candidate(), session = createGameAnalysisSession()
    const options = { baseFen: entry.fenBefore, moves: ['Nc6'], openingBook: createOpeningBook(), session,
      analyzePosition: async () => entry.engine, analyzePlayedPosition: async () => entry.playedEngine }
    const first = await analyzeGame(options)
    expect(first[0].classification).toBe('missed')
    expect(await analyzeGame(options)).toEqual(first)
    expect(session.get(`analysis:${entry.fenBefore}:Nc6`).missedOpportunity).toBeUndefined()
  })

  it('recognizes both recorded missed mates in personal game 2 from cached evidence', async () => {
    const cache = JSON.parse(fs.readFileSync(new URL(
      './fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/personal-02.json', import.meta.url), 'utf8'))
    for (const ply of [51, 69]) {
      const raw = cache.entries[ply - 1]
      const [entry] = await analyzeGame({ baseFen: raw.fenBefore, moves: [raw.san], openingBook: createOpeningBook(),
        analyzePosition: async () => raw.engine, analyzePlayedPosition: async () => raw.playedEngine })
      expect(entry.classification).toBe('missed')
      expect(entry.missedOpportunity.kind).toBe('forced-mate')
      expect(entry.baseClassification).toBe('inaccuracy')
    }
  })
})
