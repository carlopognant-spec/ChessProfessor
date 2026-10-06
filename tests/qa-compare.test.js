import { describe, it, expect } from 'vitest'
import { Chess } from 'chess.js'
import { fixtureMoves, validateCache, compare, renderReport } from '../scripts/qa/compare.js'
import { ENGINE_CONFIG } from '../src/lib/engineConfig.js'

function sample(categories = ['Migliore', 'Ottima', 'Imprecisione', 'Errore grave']) {
  const game = new Chess()
  const moves = ['f3', 'e5', 'g4', 'Nc6']
  const fixture = { id: 'sample', label: 'Sample', pgn: '1. f3 e5 2. g4 Nc6 *', annotations: moves.map((san, index) => ({ ply: index + 1, san, category: categories[index] })) }
  const deltas = [0, -32, -100, -500]
  const entries = moves.map((san, index) => {
    const fenBefore = game.fen()
    const move = game.move(san)
    return { ply: index + 1, san, uci: move.from + move.to, fenBefore, fenAfter: game.fen(), engine: { evalCp: 0, mate: null, lines: [] }, playedEngine: { evalCp: -deltas[index], mate: null, lines: [] } }
  })
  return { fixture, cache: { schemaVersion: 1, pgn: fixture.pgn, depth: ENGINE_CONFIG.defaultDepth, multiPv: ENGINE_CONFIG.multiPv, engineVersion: 'test data, not real engine', entries } }
}

describe('QA comparison', () => {
  it('shares opponent-error context with the app and gives missed labels no ordinal distance', () => {
    const game = new Chess()
    const fixture = { pgn: '1. f3 e5 *', annotations: [
      { ply: 1, san: 'f3', category: 'Errore grave' },
      { ply: 2, san: 'e5', category: 'Mossa mancata' },
    ] }
    const scores = [{ evalCp: 0, mate: null, pv: ['e2e4', 'e7e5'], lines: [] }, { evalCp: 600, mate: null, pv: ['b8c6', 'e2e4'], lines: [] }, { evalCp: 0, mate: null, pv: [], lines: [] }]
    const entries = ['f3', 'e5'].map((san, index) => {
      const fenBefore = game.fen()
      const move = game.move(san)
      return { san, uci: move.from + move.to, fenBefore, fenAfter: game.fen(), engine: scores[index], playedEngine: scores[index + 1] }
    })
    const report = compare(fixture, { entries })
    expect(report.exactPct).toBe(100)
    expect(report.ordinalIncluded).toBe(1)
    expect(report.withinOnePct).toBe(100)
    expect(report.rows[1]).toMatchObject({ actual: 'Mossa mancata', baseClassification: 'blunder' })
    fixture.annotations = [fixture.annotations[1], fixture.annotations[0]]
    expect(compare(fixture, { entries }).rows[0].actual).toBe('Mossa mancata')
  })
  it('reports shortened losing mate separately from the unchanged outcome loss', () => {
    const { fixture, cache } = sample()
    cache.entries[0].engine = { evalCp: null, mate: -6, lines: [] }
    cache.entries[0].playedEngine = { evalCp: null, mate: 3, lines: [] }
    const report = compare(fixture, cache)
    expect(report.rows[0]).toMatchObject({ dropPct: 0, mateComparison: { outcome: 'losing', bestMoves: 6, playedMoves: 3, change: 'accelerated' } })
    expect(renderReport([report])).toContain('Matto subito: 6 → 3 mosse (anticipato). Stime da analisi separate.')
  })
  it('uses cached root PV identity and score instead of the independent child score', () => {
    const { fixture, cache } = sample()
    cache.entries[0].engine.lines = [{ multipv: 1, depth: 12, evalCp: 0, mate: null, pv: [cache.entries[0].uci] }]
    cache.entries[0].playedEngine.evalCp = 500
    expect(compare(fixture, cache).rows[0]).toMatchObject({ actual: 'Migliore', dropPct: 0, evaluationSource: 'root-pv', isEngineBest: true })
  })
  it('computes percentages and confusion counts with actual local classification', () => {
    const { fixture, cache } = sample()
    const report = compare(fixture, cache)
    expect(report.included).toBe(4)
    expect(report.exactPct).toBe(100)
    expect(report.withinOnePct).toBe(100)
    expect(report.matrix.Imprecisione.Imprecisione).toBe(1)
    fixture.annotations[1].category = 'Buona'
    fixture.annotations[2].category = 'Migliore'
    const changed = compare(fixture, cache)
    expect(changed.exactPct).toBe(50)
    expect(changed.withinOnePct).toBe(75)
  })
  it('excludes overlapping reasons once from denominators and preserves category counts', () => {
    const { fixture, cache } = sample(['Libro', 'Geniale', 'Grande', 'Mossa mancata'])
    cache.entries[0].engine.evalCp = null
    const report = compare(fixture, cache, [{ game: 'sample', ply: 1 }])
    expect(report.excluded).toBe(3)
    expect(report.included).toBe(1)
    expect(report.exclusions).toEqual({ book: 1, unsupported: 2, suspect: 1, missing: 1, forced: 0 })
    expect(report.exactPct).toBe(0)
    expect(report.withinOnePct).toBeNull()
    expect(report.expectedCounts.Geniale).toBe(1)
    expect(report.rows[0].actual).toBe('Non valutabile')
  })
  it('keeps mate scores separate from missing evaluations', () => {
    const { fixture, cache } = sample()
    cache.entries[0].playedEngine = { evalCp: null, mate: -2, lines: [] }
    const row = compare(fixture, cache).rows[0]
    expect(row.playedMate).toBe(2)
    expect(row.playedEval).toBeNull()
    expect(row.reasons).toEqual([])
  })
  it('rejects wrong SAN, duplicate annotations and incomplete fixture data', () => {
    const { fixture } = sample()
    fixture.annotations[0].san = 'e4'
    expect(() => fixtureMoves(fixture)).toThrow('Annotazione')
    fixture.annotations[0].san = 'f3'
    fixture.annotations[1].ply = 1
    expect(() => fixtureMoves(fixture)).toThrow('Annotazione')
    fixture.annotations.pop()
    fixture.annotations[1].ply = 2
    expect(() => fixtureMoves(fixture)).toThrow('annotazione per ogni ply')
  })
  it('validates cached positions and production settings without a motor', () => {
    const { fixture, cache } = sample()
    expect(validateCache(cache, fixture, ENGINE_CONFIG)).toBe(cache)
    cache.depth++
    expect(() => validateCache(cache, fixture, ENGINE_CONFIG)).toThrow('incompatibile')
    cache.depth--
    cache.entries[1].fenBefore = cache.entries[0].fenBefore
    expect(() => validateCache(cache, fixture, ENGINE_CONFIG)).toThrow('ply 2')
  })
  it('marks sanity data separately and reports missing inputs without invented metrics', () => {
    const { fixture, cache } = sample()
    fixture.sanity = true
    const report = compare(fixture, cache)
    expect(renderReport([report], ['Fixture assente'])).toContain('sanity, separata')
    expect(renderReport([], ['Fixture assente'])).toContain('Fixture assente')
    expect(report.rows.every(row => Number.isFinite(row.dropPct))).toBe(true)
  })
})
