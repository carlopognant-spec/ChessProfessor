import { Chess } from 'chess.js'
import { describe, expect, it, vi } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { webcrypto } from 'node:crypto'
import { appendHistory, historyFromSan, historyKey, normalizeHistory, positionHistories, historyAwareSearch } from '../src/lib/analysisHistory.js'
import { analyzeGame, createGameAnalysisSession } from '../src/lib/gameAnalysis.js'
import { createOpeningBook } from '../src/lib/openingBook.js'
import { createAnalysisMetadata } from '../src/lib/analysisMetadata.js'
import { buildRefinementPlan, refineGameEntries, refinementFor, REFINEMENT_POLICY } from '../src/lib/analysisRefinement.js'
import { archiveAnalysisStatus, createGameArchive, validatedAnalysis } from '../src/lib/gameArchive.js'

function score(fen, nodes = 200000, history) {
  const moves = new Chess(fen).moves({ verbose: true }).slice(0, 5)
  const lines = moves.map((m, i) => ({ depth: 12, multipv: i + 1, evalCp: 100 - i * 20, mate: null, pv: [m.from + m.to + (m.promotion ?? '')] }))
  return { ...lines[0], fen, lines, specialLines: lines, bestmove: lines[0]?.pv[0], actualNodes: 1000,
    analysisMetadata: createAnalysisMetadata({ nodes }), ...(history ? { history: structuredClone(history) } : {}) }
}
const analyze = vi.fn(async (fen, options) => score(fen, 200000, options?.history))
const run = (moves, options = {}) => analyzeGame({ moves, historyAware: true, openingBook: createOpeningBook(),
  analyzePosition: analyze, analyzePlayedPosition: analyze, ...options })

describe('game-aware Stockfish history', () => {
  it('preserves SetUp, Black to move, castling, en passant and promotions', () => {
    for (const [fen, moves, expected] of [
      ['r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 17', ['O-O', 'O-O-O'], ['e8g8', 'e1c1']],
      ['7k/8/8/3pP3/8/8/8/K7 w - d6 0 22', ['exd6'], ['e5d6']],
      ['7k/P7/8/8/8/8/8/K7 w - - 0 40', ['a8=N'], ['a7a8n']],
    ]) {
      const history = historyFromSan(fen, moves), game = new Chess(fen)
      moves.forEach(m => game.move(m))
      expect(history.moves).toEqual(expected)
      expect(normalizeHistory(history, game.fen())).toEqual(history)
      expect(() => normalizeHistory(history, fen)).toThrow('corrispondono')
    }
  })

  it('keeps adjacent reuse, exact histories and cache hits without repeating searches', async () => {
    analyze.mockClear()
    const session = createGameAnalysisSession(), moves = ['Nf3', 'Nf6', 'Ng1', 'Ng8', 'Nf3']
    const entries = await run(moves, { session })
    expect(analyze).toHaveBeenCalledTimes(moves.length + 1)
    expect(entries[1].engine).toBe(entries[0].playedEngine)
    expect(entries[4].engine.history.moves).toEqual(['g1f3', 'g8f6', 'f3g1', 'f6g8'])
    expect(entries[4].playedEngine.history.moves).toHaveLength(5)
    expect(await run(moves, { session })).toEqual(entries)
    expect(analyze).toHaveBeenCalledTimes(moves.length + 1)
  })

  it('separates transposed histories and legacy cache entries with the same FEN and SAN', async () => {
    const session = createGameAnalysisSession()
    const a = ['Nf3', 'Nf6', 'Nc3', 'Nc6', 'e4'], b = ['Nc3', 'Nc6', 'Nf3', 'Nf6', 'e4']
    const legacy = await run(a, { session, historyAware: false })
    const first = await run(a, { session }), second = await run(b, { session })
    expect(first[4].fenBefore).toBe(second[4].fenBefore)
    expect(first[4].engine).not.toBe(legacy[4].engine)
    expect(second[4].engine).not.toBe(first[4].engine)
    expect(historyKey(first[4].engine.history)).not.toBe(historyKey(second[4].engine.history))
  })

  it('resumes completed rows after cancellation with their original histories', async () => {
    const session = createGameAnalysisSession(), controller = new AbortController(), onEntry = vi.fn(() => controller.abort())
    await expect(run(['e4', 'e5'], { session, signal: controller.signal, onEntry })).rejects.toMatchObject({ name: 'AbortError' })
    expect(onEntry).toHaveBeenCalledTimes(1)
    const completed = onEntry.mock.calls[0][0]
    analyze.mockClear()
    const entries = await run(['e4', 'e5'], { session })
    expect(entries[0].engine).toBe(completed.engine)
    expect(analyze).toHaveBeenCalledTimes(1)
    expect(entries[1].playedEngine.history.moves).toEqual(['e2e4', 'e7e5'])
  })

  it('rejects a history-aware callback that silently drops its context', async () => {
    await expect(run(['e4'], { analyzePosition: async fen => score(fen) })).rejects.toThrow('storico')
  })

  it('propagates mainline history into deeper analysis and retains deduplication', async () => {
    const entries = (await run(['e4', 'e5'])).map(e => ({ ...e, isBookMove: false, classification: 'good',
      dropPct: 4, evaluationEvidence: { status: 'independent' } }))
    const engine = vi.fn(async (fen, nodes, _multiPv, options) => score(fen, nodes, options?.history))
    const result = await refineGameEntries({ entries, analyzePosition: engine })
    expect(engine).toHaveBeenCalledTimes(3)
    expect(result.entries[0].refinement.playedEngine.history).toEqual(entries[0].playedEngine.history)
    expect(buildRefinementPlan(result.entries).positions).toEqual([])
    const stale = { ...entries[0], refinement: { version: REFINEMENT_POLICY.version, engine: score(entries[0].fenBefore, 1000000) } }
    expect(refinementFor(stale)).toBeNull()
    await expect(refineGameEntries({ entries: [stale], analyzePosition: engine })).rejects.toThrow('incompatibile')
  })

  it('extends only the hypothetical branch and preserves restricted search options', async () => {
    const entries = await run(['e4'])
    const game = new Chess(entries[0].fenAfter); game.move('d5')
    const acceptedFen = game.fen(); game.move('exd5')
    const recoveryFen = game.fen()
    const alt = new Chess(entries[0].fenBefore); alt.move('d4')
    const plan = { sacrifices: [{ fen: entries[0].fenAfter, captureUci: 'd7d5', acceptedFen,
      recoveries: [{ uci: 'e4d5', afterFen: recoveryFen }] }],
      targets: [{ ply: 1, alternatives: [{ uci: 'd2d4', fen: alt.fen() }] }] }
    const histories = positionHistories(entries, plan)
    const engine = vi.fn(async (fen, nodes, _multiPv, options) => score(fen, nodes, options.history))
    const search = historyAwareSearch(engine, histories)
    await search(acceptedFen, 200000, 1, { searchMoves: ['e4d5'] })
    expect(engine.mock.calls[0][3]).toEqual({ searchMoves: ['e4d5'], history: { initialFen: entries[0].fenBefore, moves: ['e2e4', 'd7d5'] } })
    expect(histories.get(recoveryFen).moves).toEqual(['e2e4', 'd7d5', 'e4d5'])
    expect(histories.get(alt.fen()).moves).toEqual(['d2d4'])
    expect(entries[0].playedEngine.history.moves).toEqual(['e2e4'])
    await expect(search(new Chess().fen().replace(' 1', ' 2'), 200000, 5)).rejects.toThrow('mancante')
  })

  it('saves histories, rejects wrong PGN contexts and never merges old FEN-only refinements', async () => {
    const entries = await run(['e4', 'e5']), game = new Chess(); game.move('e4'); game.move('e5')
    const pgn = game.pgn(), archive = createGameArchive({ indexedDB: new IDBFactory(), crypto: webcrypto })
    const legacy = structuredClone(entries)
    for (const e of legacy) { delete e.engine.history; delete e.playedEngine.history; delete e.classificationDecision }
    legacy[0].refinement = { version: REFINEMENT_POLICY.version, engine: score(legacy[0].fenBefore, 1000000) }
    try {
      await archive.save({ pgn, analysisEntries: legacy })
      const saved = await archive.save({ pgn, analysisEntries: entries })
      expect(archiveAnalysisStatus(saved.record)).toBe('current')
      expect(saved.record.analysisEntries[0].refinement).toBeUndefined()
      expect(saved.record.analysisEntries[1].playedEngine.history.moves).toEqual(['e2e4', 'e7e5'])
      const corrupt = structuredClone(entries)
      corrupt[0].playedEngine.history = appendHistory(corrupt[0].engine.history, 'd2d4')
      expect(validatedAnalysis(pgn, corrupt)).toEqual([])
      await expect(archive.save({ pgn, analysisEntries: corrupt })).rejects.toThrow('corrisponde')
      expect(saved.record.analysisEntries[0].classificationOrigin).toMatchObject({ schemaVersion: 0, policy: null })
      expect((await archive.get(saved.record.id)).analysisEntries).toEqual(saved.record.analysisEntries)
    } finally { await archive.close() }
  })
})
