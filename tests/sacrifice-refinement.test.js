import { readFileSync } from 'node:fs'
import { Chess } from 'chess.js'
import { webcrypto } from 'node:crypto'
import { IDBFactory } from 'fake-indexeddb'
import { describe, expect, it, vi } from 'vitest'
import { createAnalysisMetadata } from '../src/lib/analysisMetadata.js'
import { buildRefinementPlan, refineGameEntries, selectRefinementView } from '../src/lib/analysisRefinement.js'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'
import { validSacrificeSearch, SACRIFICE_SEARCH_POLICY, preferredSacrificeConfirmation } from '../src/lib/sacrificeSearches.js'
import { createGameArchive } from '../src/lib/gameArchive.js'

const archive = JSON.parse(readFileSync(new URL('../agent-output/new-references-200k-v1/game-184316820266.json', import.meta.url)))
const packet = JSON.parse(readFileSync(new URL('../agent-output/targeted-special-evidence-v1/search-0.json', import.meta.url)))
function fixture({ reuse = true, full = false } = {}) {
  // Reuse recorded scores; synthetic 1M metadata exercises orchestration only.
  const entries = reclassifyReviewedMoves(structuredClone(full ? archive.entries : archive.entries.slice(38, 42)).map((e, i) => ({ ...e, ply: i + 1 })))
  const target = full ? 40 : 2, next = target + 1
  for (const e of entries) {
    const deep = engine => engine ? { ...engine, analysisMetadata: createAnalysisMetadata({ nodes: 1000000 }) } : null
    e.refinement = { version: 'optional-refinement-v1', engine: deep(e.engine), playedEngine: deep(e.playedEngine) }
    if (e.ply !== target + 1) { e.specialAssessment = null; e.isBookMove = true }
  }
  const acceptance = structuredClone(packet.engine)
  acceptance.analysisMetadata = { ...createAnalysisMetadata({ nodes: 200000, multiPv: 1 }), searchMoves: ['f8f7'] }
  const confirmation = structuredClone(entries[next].playedEngine)
  if (!reuse) {
    entries[next].playedEngine = null
    entries[next].refinement.playedEngine = null
    // No unrelated uncertainty is selected in this fixture.
    entries[next].evaluationEvidence = { status: 'coherent' }; entries[next].dropPct = 0
  }
  return { entries, acceptance, confirmation, target, next }
}

describe('bounded optional sacrifice searches', () => {
  it('caps acceptance targets at four even when many legal captures need evidence', () => {
    const entries = structuredClone(archive.entries).map(e => {
      const offers = new Chess(e.fenAfter).moves({ verbose: true }).filter(m => ['n', 'b', 'r', 'q'].includes(m.captured))
        .map(m => ({ uci: `${m.from}${m.to}${m.promotion ?? ''}` }))
      return { ...e, isBookMove: false, classification: 'good', playedMate: null, dropPct: 0,
        evaluationEvidence: { status: 'coherent' }, specialAssessment: {
          brilliant: { status: 'candidate', reason: 'missing-acceptance-analysis', offers } } }
    })
    const plan = buildRefinementPlan(entries)
    expect(plan.sacrifices).toHaveLength(4)
    expect(plan.extraSearches).toBeLessThanOrEqual(8)
  })
  it('verifies Qxe5 through the optional flow and keeps the initial engines unchanged', async () => {
    const { entries, acceptance } = fixture(), original = JSON.stringify(entries)
    const plan = buildRefinementPlan(entries)
    expect(plan.positions).toEqual([])
    expect(plan.sacrifices).toEqual([expect.objectContaining({ ply: 3, captureUci: 'f8f7' })])
    expect(plan.extraSearches).toBe(1)
    expect(plan.actualNodeCap).toBe(205000)
    const analyzePosition = vi.fn(async () => acceptance)
    const result = await refineGameEntries({ entries, analyzePosition })
    expect(analyzePosition).toHaveBeenCalledWith(entries[2].fenAfter, 200000, 1, { searchMoves: ['f8f7'] })
    expect(result.searches).toBe(1)
    expect(result.entries[2].refinement.sacrifices[0].confirmation).toBe(entries[3].refinement.playedEngine)
    expect(JSON.stringify(entries)).toBe(original)
    expect(selectRefinementView(result.entries, false)[2].classification).toBe('best')
    expect(selectRefinementView(result.entries, true)[2].classification).toBe('brilliant')
    expect(result.entries[2].playedEngine).toBe(entries[2].playedEngine)
    expect(buildRefinementPlan(result.entries).sacrifices).toEqual([])
    expect((await refineGameEntries({ entries: result.entries, analyzePosition })).searches).toBe(0)
  })

  it('upgrades completed archived proofs from exact deep searches without queries or baseline mutation', async () => {
    const { entries, acceptance, confirmation } = fixture(), original = JSON.stringify(entries)
    entries[2].refinement.sacrifices = [{ version: SACRIFICE_SEARCH_POLICY.version, captureUci: 'f8f7',
      fen: entries[2].fenAfter, acceptedFen: entries[3].fenAfter, acceptance, confirmation }]
    const saved = JSON.stringify(entries)
    const view = selectRefinementView(entries, true)
    expect(view[2].sacrificeSearches[0].confirmation).toBe(entries[3].refinement.playedEngine)
    expect(JSON.stringify(entries)).toBe(saved)
    expect(selectRefinementView(entries, false)).toBe(entries)
    const analyzePosition = vi.fn()
    const result = await refineGameEntries({ entries, analyzePosition })
    expect(result.searches).toBe(0)
    expect(analyzePosition).not.toHaveBeenCalled()
    expect(result.entries[2].refinement.sacrifices[0].confirmation).toBe(entries[3].refinement.playedEngine)
    expect(result.entries[2].engine).toEqual(JSON.parse(original)[2].engine)
  })

  it('falls back to valid initial confirmation when the deep packet is invalid or restricted', () => {
    const { entries, confirmation } = fixture(), deep = entries[3].refinement.playedEngine, fen = entries[3].fenAfter
    expect(preferredSacrificeConfirmation(fen, confirmation, deep)).toBe(deep)
    expect(preferredSacrificeConfirmation(fen, deep, confirmation)).toBe(deep)
    for (const mutate of [r => { r.fen = entries[2].fenBefore }, r => { r.specialLines.pop() },
      r => { r.specialLines[0].lowerbound = true }, r => { r.analysisMetadata.searchMoves = [r.bestmove] }]) {
      const bad = structuredClone(deep); mutate(bad)
      expect(preferredSacrificeConfirmation(fen, bad, confirmation)).toBe(confirmation)
    }
    expect(preferredSacrificeConfirmation(fen, null, { ...deep, fen: entries[2].fenBefore })).toBeNull()
  })

  it('retains acceptance on interruption and resumes only the missing confirmation', async () => {
    const { entries, acceptance, confirmation, next } = fixture({ reuse: false })
    let partial, calls = 0
    const controller = new AbortController()
    await expect(refineGameEntries({ entries, signal: controller.signal, onEntries: e => { partial = e },
      analyzePosition: async () => {
        if (++calls === 1) return acceptance
        controller.abort(); return confirmation
      } })).rejects.toMatchObject({ name: 'AbortError' })
    expect(partial[2].refinement.sacrifices[0].acceptance).toEqual(acceptance)
    expect(partial[2].refinement.sacrifices[0].confirmation).toBeNull()
    const analyzePosition = vi.fn(async () => confirmation)
    const plan = buildRefinementPlan(partial)
    expect(plan.extraSearches).toBe(1)
    const resumed = await refineGameEntries({ entries: partial, analyzePosition })
    expect(analyzePosition).toHaveBeenCalledTimes(1)
    expect(analyzePosition).toHaveBeenCalledWith(entries[next].fenAfter, 200000, 5, {})
    expect(selectRefinementView(resumed.entries, true)[2].classification).toBe('brilliant')
  })

  it.each(['scope', 'fen', 'bound', 'root', 'budget'])('rejects invalid %s without publishing a sacrifice result', async kind => {
    const { entries, acceptance } = fixture()
    if (kind === 'scope') delete acceptance.analysisMetadata.searchMoves
    if (kind === 'fen') acceptance.fen = entries[2].fenBefore
    if (kind === 'bound') acceptance.specialLines[0].upperbound = true
    if (kind === 'root') acceptance.specialLines[0].pv[0] = 'f8d8'
    if (kind === 'budget') acceptance.actualNodes = 205001
    const onEntries = vi.fn()
    await expect(refineGameEntries({ entries, analyzePosition: async () => acceptance, onEntries })).rejects.toThrow()
    expect(onEntries).not.toHaveBeenCalled()
  })

  it('archives the separate evidence and preserves it when resaving ordinary refinement', async () => {
    const { entries, acceptance } = fixture({ full: true })
    const result = await refineGameEntries({ entries, analyzePosition: async () => acceptance })
    const pgn = readFileSync(new URL('../Partite/Confermate/chesscom-184316820266/partita.pgn', import.meta.url), 'utf8')
    const storage = createGameArchive({ indexedDB: new IDBFactory(), crypto: webcrypto })
    try {
      const saved = await storage.save({ pgn, analysisEntries: result.entries })
      await storage.save({ pgn, analysisEntries: entries })
      const partial = structuredClone(result.entries)
      partial[40].refinement.sacrifices[0].confirmation = null
      await storage.save({ pgn, analysisEntries: partial })
      const older = structuredClone(result.entries)
      older[40].refinement.sacrifices[0].confirmation = older[41].playedEngine
      await storage.save({ pgn, analysisEntries: older })
      const loaded = await storage.get(saved.record.id)
      expect(selectRefinementView(loaded.analysisEntries, true)[40].classification).toBe('brilliant')
      expect(buildRefinementPlan(loaded.analysisEntries).sacrifices).toEqual([])
      expect(loaded.analysisEntries[40].refinement.sacrifices).toHaveLength(1)
      expect(loaded.analysisEntries[40].refinement.sacrifices[0].confirmation.analysisMetadata.budget.value).toBe(1000000)
    } finally { await storage.close() }
  })

  it('never accepts a restricted search as a general confirmation', () => {
    const { acceptance, entries } = fixture()
    expect(validSacrificeSearch(acceptance, entries[2].fenAfter)).toBe(false)
    expect(SACRIFICE_SEARCH_POLICY.maxOffers).toBe(4)
  })
})
