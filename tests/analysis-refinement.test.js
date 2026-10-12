import { Chess } from 'chess.js'
import { describe, expect, it, vi } from 'vitest'
import { createAnalysisMetadata } from '../src/lib/analysisMetadata.js'
import { buildRefinementPlan, refineGameEntries, selectRefinementView, refinementFor, refinementReason, REFINEMENT_POLICY } from '../src/lib/analysisRefinement.js'
import { createGameArchive, archiveAnalysisStatus } from '../src/lib/gameArchive.js'
import { IDBFactory } from 'fake-indexeddb'
import { webcrypto } from 'node:crypto'

function score(fen, nodes = 200000) {
  const game = new Chess(fen), lines = game.moves({ verbose: true }).slice(0, 5)
    .map((m, i) => ({ multipv: i + 1, depth: 12, evalCp: 100 - i * 20, mate: null, pv: [`${m.from}${m.to}${m.promotion ?? ''}`] }))
  return { ...lines[0], fen, lines, specialLines: lines, bestmove: lines[0]?.pv[0], actualNodes: 1000,
    analysisMetadata: createAnalysisMetadata({ nodes }) }
}
function gameEntries(moves = ['e4', 'e5', 'Nf3', 'Nc6']) {
  const game = new Chess()
  const entries = moves.map((playedMove, i) => {
    const fenBefore = game.fen(); game.move(playedMove)
    return { ply: i + 1, playedMove, fenBefore, fenAfter: game.fen(), side: fenBefore.split(' ')[1],
      engine: score(fenBefore), playedEngine: score(game.fen()), analysisMetadata: createAnalysisMetadata(),
      classification: 'good', playedEval: 50, playedMate: null, dropPct: 4,
      evaluationEvidence: { status: 'independent' }, isBookMove: false }
  })
  return { game, entries }
}
describe('optional game refinement', () => {
  it('limits requests to 12 moves and deduplicates adjacent positions', () => {
    const { entries } = gameEntries(Array.from({ length: 20 }, (_, i) => ['Nf3', 'Nf6', 'Ng1', 'Ng8'][i % 4]))
    const plan = buildRefinementPlan(entries)
    expect(plan.selectedPlies).toHaveLength(12)
    expect(plan.positions).toHaveLength(13)
    expect(plan.candidateCount).toBe(20)
    expect(plan.nominalNodes).toBe(13000000)
  })
  it('selects uncertainty and boundaries while protecting book, forced and delivered mate', () => {
    const e = gameEntries().entries[0]
    for (const fields of [{ isBookMove: true }, { classification: 'forced' }, { playedMate: 0 }]) {
      expect(refinementReason({ ...e, ...fields })).toBeNull()
    }
    expect(refinementReason({ ...e, evaluationEvidence: { status: 'coherent' }, dropPct: 9.4 })).toBe('near-boundary')
    expect(refinementReason({ ...e, evaluationEvidence: { status: 'coherent' }, dropPct: 15 })).toBeNull()
  })
  it('preserves initial data and uses one deep score per FEN in adjacent rows', async () => {
    const { entries } = gameEntries(), original = JSON.stringify(entries)
    const analyzePosition = vi.fn(async (fen, nodes) => score(fen, nodes))
    const result = await refineGameEntries({ entries, analyzePosition })
    expect(analyzePosition).toHaveBeenCalledTimes(5)
    expect(JSON.stringify(entries)).toBe(original)
    expect(result.entries[0].engine).toEqual(entries[0].engine)
    const deep = selectRefinementView(result.entries, true)
    expect(deep[0].playedEngine).toBe(deep[1].engine)
    expect(deep[0].engine.analysisMetadata.budget.value).toBe(1000000)
    expect(selectRefinementView(result.entries, false)).toBe(result.entries)
    expect(deep[0].refinementComparison.initialClassification).toBe('good')
    expect(buildRefinementPlan(result.entries).positions).toEqual([])
    expect(buildRefinementPlan(result.entries).selectedPlies).toEqual([])
    expect(await refineGameEntries({ entries: result.entries, analyzePosition })).toMatchObject({ searches: 0 })
    expect(analyzePosition).toHaveBeenCalledTimes(5)
  })
  it('rejects altered plans and mismatched game chains before calling the engine', async () => {
    const { entries } = gameEntries(), analyzePosition = vi.fn()
    await expect(refineGameEntries({ entries, plan: { ...buildRefinementPlan(entries), nodes: 2000000 }, analyzePosition })).rejects.toThrow('Piano')
    const wrong = structuredClone(entries); wrong[1].fenBefore = wrong[0].fenBefore
    expect(() => buildRefinementPlan(wrong)).toThrow('coerente')
    expect(analyzePosition).not.toHaveBeenCalled()
  })
  it('rejects invalid profile, position, bounds and illegal variations without replacing the baseline', async () => {
    for (const mutate of [r => { r.fen = new Chess().fen() }, r => { r.analysisMetadata.budget.value = 800000 },
      r => { r.lines[0].bound = true }, r => { r.lines[0].pv = ['a1a8'] }]) {
      const { entries } = gameEntries(), original = JSON.stringify(entries)
      const plan = buildRefinementPlan(entries)
      // Check a noninitial FEN so a stale initial position can be detected.
      const onEntries = vi.fn()
      let calls = 0
      await expect(refineGameEntries({ entries, plan, onEntries, analyzePosition: async (fen, nodes) => {
        const r = score(fen, nodes); if (++calls === 2) mutate(r); return r
      } })).rejects.toThrow()
      expect(onEntries).toHaveBeenCalledTimes(1)
      expect(JSON.stringify(entries)).toBe(original)
    }
  })
  it('retains successful partial positions and can resume without querying them again', async () => {
    const { entries } = gameEntries(), originals = JSON.stringify(entries)
    let partial, calls = 0
    await expect(refineGameEntries({ entries, onEntries: e => { partial = e }, analyzePosition: async (fen, nodes) => {
      if (++calls === 2) throw Error('Engine failed'); return score(fen, nodes)
    } })).rejects.toThrow('Engine failed')
    expect(partial).toHaveLength(4)
    expect(JSON.stringify(entries)).toBe(originals)
    const analyzePosition = vi.fn(async (fen, nodes) => score(fen, nodes))
    await refineGameEntries({ entries: partial, analyzePosition })
    expect(analyzePosition).toHaveBeenCalledTimes(4)
  })
  it('ignores a late engine result after cancellation', async () => {
    const { entries } = gameEntries(), controller = new AbortController(), onEntries = vi.fn()
    let resolve
    const pending = refineGameEntries({ entries, signal: controller.signal, onEntries,
      analyzePosition: () => new Promise(r => { resolve = r }) })
    controller.abort()
    resolve(score(entries[0].fenBefore, REFINEMENT_POLICY.nodes))
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    expect(onEntries).not.toHaveBeenCalled()
  })
  it('stops on an actual-node cap overrun', async () => {
    const { entries } = gameEntries(), plan = buildRefinementPlan(entries), onEntries = vi.fn()
    await expect(refineGameEntries({ entries, plan, onEntries, analyzePosition: async (fen, nodes) => ({
      ...score(fen, nodes), actualNodes: plan.actualNodeCap + 1,
    }) })).rejects.toThrow('Budget')
    expect(onEntries).not.toHaveBeenCalled()
  })
  it('ignores obsolete refinements without hiding the initial analysis', () => {
    const { entries } = gameEntries()
    entries[0].refinement = { version: REFINEMENT_POLICY.version, engine: score(entries[0].fenBefore, 800000) }
    expect(refinementFor(entries[0])).toBeNull()
    expect(selectRefinementView(entries, true)).toBe(entries)
  })

  it('resolves a terminal position locally instead of searching it', async () => {
    const game = new Chess('7k/5K2/6Q1/8/8/8/8/8 w - - 0 1'), fenBefore = game.fen()
    game.move('Qf5'); expect(game.isStalemate()).toBe(true)
    const entry = { ply: 1, playedMove: 'Qf5', fenBefore, fenAfter: game.fen(), engine: score(fenBefore),
      playedEngine: { fen: game.fen(), evalCp: 0, mate: null, lines: [], analysisMetadata: createAnalysisMetadata() },
      classification: 'good', dropPct: 4, evaluationEvidence: { status: 'independent' } }
    const analyzePosition = vi.fn(async (fen, nodes) => score(fen, nodes))
    const result = await refineGameEntries({ entries: [entry], analyzePosition })
    expect(analyzePosition).toHaveBeenCalledTimes(1)
    expect(result.entries[0].refinement.playedEngine).toMatchObject({ evalCp: 0, actualNodes: 0, terminal: true })
  })
  it('persists both profiles and comparisons without marking the initial archive stale', async () => {
    const { game, entries } = gameEntries()
    const refined = await refineGameEntries({ entries, analyzePosition: async (fen, nodes) => score(fen, nodes) })
    const options = { indexedDB: new IDBFactory(), crypto: webcrypto }
    const archive = createGameArchive(options)
    const saved = await archive.save({ pgn: game.pgn(), analysisEntries: refined.entries })
    expect(archiveAnalysisStatus(saved.record)).toBe('current')
    await archive.save({ pgn: game.pgn(), analysisEntries: entries })
    await archive.close()
    const reopened = createGameArchive(options), record = await reopened.get(saved.record.id)
    expect(record.analysisEntries[0].engine.analysisMetadata.budget.value).toBe(200000)
    expect(record.analysisEntries[0].refinement.engine.analysisMetadata.budget.value).toBe(1000000)
    expect(selectRefinementView(record.analysisEntries, true)[0].refinementComparison).toBeTruthy()
    expect(archiveAnalysisStatus(record)).toBe('current')
    await reopened.close()
  })
})
