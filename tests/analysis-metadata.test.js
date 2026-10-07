import { describe, expect, it } from 'vitest'
import { createAnalysisMetadata, analysisMetadataKey, isAnalysisCurrent } from '../src/lib/analysisMetadata.js'
import { analyzeGame, createGameAnalysisSession } from '../src/lib/gameAnalysis.js'
import { createAnalysisCache } from '../src/lib/analysisCache.js'
import { createOpeningBook } from '../src/lib/openingBook.js'

describe('analysis engine identity and budget', () => {
  it('survives serialization and marks old/mismatched engine, budget or conditions stale', () => {
    const analysisMetadata = createAnalysisMetadata({ actualEngineId: 'Stockfish 19 WASM' })
    const record = JSON.parse(JSON.stringify({ schemaVersion: 1, analysisMetadata }))
    expect(record.analysisMetadata).toMatchObject({ engine: { name: 'Stockfish', version: '19', packageVersion: '19.0.0', build: 'large-single', actualEngineId: 'Stockfish 19 WASM' }, budget: { kind: 'nodes', value: 200000 }, multiPv: 5, threads: 1, hashMb: 16, hashPolicy: 'clear-per-search' })
    expect(isAnalysisCurrent(record)).toBe(true)
    expect(isAnalysisCurrent({})).toBe(false)
    for (const change of [m => { m.engine.build = 'lite-single' }, m => { m.engine.version = '16' }, m => { m.budget.value = 800000 }, m => { m.budget.kind = 'depth' }, m => { m.multiPv = 1 }, m => { m.hashPolicy = 'retained' }]) {
      const stale = structuredClone(record)
      change(stale.analysisMetadata)
      expect(isAnalysisCurrent(stale)).toBe(false)
    }
  })

  it('retains engine metadata in serializable game entries and keeps search conditions out of each other’s cache', async () => {
    const session = createGameAnalysisSession({ cache: createAnalysisCache() })
    let calls = 0
    const run = async nodes => {
      const metadata = createAnalysisMetadata({ nodes })
      const entries = await analyzeGame({ moves: ['e4'], openingBook: createOpeningBook(), session, analysisKey: analysisMetadataKey(metadata),
        analyzePosition: async () => { calls++; return { evalCp: 25, mate: null, lines: [], analysisMetadata: metadata } },
        analyzePlayedPosition: async () => ({ evalCp: -20, mate: null, lines: [], analysisMetadata: metadata }) })
      return JSON.parse(JSON.stringify(entries))
    }
    expect((await run(200000))[0].analysisMetadata.budget.value).toBe(200000)
    await run(200000)
    expect(calls).toBe(1)
    expect((await run(800000))[0].analysisMetadata.budget.value).toBe(800000)
    expect(calls).toBe(2)
  })
})
