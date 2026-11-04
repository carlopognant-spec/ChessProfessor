import { Chess } from 'chess.js'
import { expect, it } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { webcrypto } from 'node:crypto'
import { analyzeGame } from '../src/lib/gameAnalysis.js'
import { createOpeningBook } from '../src/lib/openingBook.js'
import { createAnalysisMetadata } from '../src/lib/analysisMetadata.js'
import { createGameArchive, archiveAnalysisStatus } from '../src/lib/gameArchive.js'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'
import { replayNumericalDecision } from '../src/lib/classificationDecision.js'
import { refineGameEntries, selectRefinementView } from '../src/lib/analysisRefinement.js'
import { buildPracticeCandidates, createPracticeAnalyzer, prepareLegacyPracticeEntries } from '../src/lib/reviewPractice.js'

function score(fen, nodes = 200000, history) {
  const lines = new Chess(fen).moves({ verbose: true }).slice(0, 5).map((m, i) => ({ multipv: i + 1,
    depth: 12, evalCp: 300 - i * 20, mate: null, pv: [m.from + m.to + (m.promotion ?? '')] }))
  return { ...lines[0], fen, bestmove: lines[0]?.pv[0], lines, specialLines: lines, actualNodes: 1000,
    analysisMetadata: createAnalysisMetadata({ nodes }), ...(history ? { history } : {}) }
}
async function analyzed(openingBook = createOpeningBook()) {
  const game = new Chess(); game.move('e4'); game.move('e5')
  const analyzePosition = async (fen, options) => score(fen, 200000, options?.history)
  const entries = await analyzeGame({ moves: game.history(), openingBook, historyAware: true,
    analyzePosition, analyzePlayedPosition: analyzePosition })
  return { game, entries }
}

it('records reproducible numerical criteria on live rows without changing scores or search profiles', async () => {
  const { entries } = await analyzed()
  for (const entry of entries) {
    expect(entry.classificationDecision.policy.thresholds.mistake).toBe(20)
    expect(entry.classificationDecision.evidence.historyMode).toBe('game-history')
    expect(entry.classificationDecision.engineProfiles.root).toEqual(entry.engine.analysisMetadata)
    expect(replayNumericalDecision(entry.classificationDecision)).toMatchObject({ status: 'reproduced', classification: entry.classification })
    expect(entry.classificationOrigin).toBeUndefined()
  }
})

it('records the actual opening database identity only when it is known', async () => {
  const board = new Chess(); board.move('e4')
  const metadata = { source: 'test-repertoire', revision: 'r1' }
  const { entries } = await analyzed({ ...createOpeningBook([board.fen()]), metadata })
  expect(entries[0]).toMatchObject({ classification: 'blunder', numericalClassification: 'blunder',
    isBookMove: true, openingBookMetadata: metadata, classificationDecision: { rule: 'opening-book-error' } })
  expect(entries[0].classificationDecision.openingBookMetadata).toEqual(metadata)
  expect(replayNumericalDecision(entries[0].classificationDecision).status).toBe('reproduced')
  metadata.revision = 'r2'
  expect(entries[0].classificationDecision.openingBookMetadata.revision).toBe('r1')
})

it('keeps the unversioned original label across migration, saving and a later fresh analysis', async () => {
  const { game, entries } = await analyzed(), archive = createGameArchive({ indexedDB: new IDBFactory(), crypto: webcrypto })
  const legacy = entries.map(e => {
    const { classificationDecision, ...row } = e
    return { ...row, classification: 'good' }
  })
  const before = JSON.stringify(legacy)
  try {
    await archive.save({ pgn: game.pgn(), analysisEntries: legacy })
    const migrated = reclassifyReviewedMoves(legacy)
    expect(migrated[0]).toMatchObject({ classification: 'blunder', classificationOrigin: { schemaVersion: 0, classification: 'good', policy: null } })
    expect(JSON.stringify(legacy)).toBe(before)
    const saved = await archive.save({ pgn: game.pgn(), analysisEntries: migrated })
    expect(archiveAnalysisStatus(saved.record)).toBe('current')
    const fresh = await archive.save({ pgn: game.pgn(), analysisEntries: entries })
    expect(fresh.record.analysisEntries[0].classificationOrigin).toEqual(migrated[0].classificationOrigin)
    expect(fresh.record.analysisEntries[0].classificationDecision).toEqual(entries[0].classificationDecision)
    expect(reclassifyReviewedMoves(fresh.record.analysisEntries)).toEqual(reclassifyReviewedMoves(reclassifyReviewedMoves(fresh.record.analysisEntries)))
  } finally { await archive.close() }
})

it('keeps both numerical profiles and their decisions when showing optional refinement', async () => {
  const { entries } = await analyzed(), initial = JSON.stringify(entries)
  const refined = await refineGameEntries({ entries,
    analyzePosition: async (fen, nodes, _multiPv, options) => score(fen, nodes, options?.history) })
  const displayed = selectRefinementView(refined.entries, true)
  expect(JSON.stringify(entries)).toBe(initial)
  expect(displayed[0].classificationDecision.engineProfiles.root.budget.value).toBe(1000000)
  expect(displayed[0].classificationOrigin.engineProfiles.root.budget.value).toBe(200000)
  expect(replayNumericalDecision(displayed[0].classificationDecision).status).toBe('reproduced')
})

it('uses both legacy and reconstructed error labels only as hints before a fresh practice search', async () => {
  const { game, entries } = await analyzed()
  const oldGood = entries.map(({ classificationDecision, ...entry }) => ({ ...entry, classification: 'good' }))
  const reconsidered = prepareLegacyPracticeEntries(oldGood)
  expect(reconsidered[0]).toMatchObject({ classification: 'blunder', practiceCandidateClassification: 'blunder' })
  expect(await buildPracticeCandidates({ pgn: game.pgn(), entries: reconsidered })).toHaveLength(1)
  const oldError = oldGood.map(entry => ({ ...entry, classification: 'blunder',
    engine: { fen: entry.fenBefore, evalCp: 0, mate: null, analysisMetadata: createAnalysisMetadata() },
    playedEngine: { fen: entry.fenAfter, evalCp: 0, mate: null, analysisMetadata: createAnalysisMetadata() } }))
  const hints = prepareLegacyPracticeEntries(oldError)
  expect(hints[0]).toMatchObject({ classification: 'best', practiceCandidateClassification: 'blunder' })
  const [candidate] = await buildPracticeCandidates({ pgn: game.pgn(), entries: hints })
  let searches = 0
  const analyzer = createPracticeAnalyzer({ analyzePosition: async (fen, nodes, multiPv, options) => {
    searches++
    const moves = options.searchMoves ?? new Chess(fen).moves({ verbose: true }).slice(0, multiPv).map(m => m.from + m.to + (m.promotion ?? ''))
    const lines = moves.map((move, index) => ({ multipv: index + 1, depth: 12, evalCp: 0, mate: null, pv: [move] }))
    return { fen, history: options.history, actualNodes: nodes, bestmove: moves[0], lines, specialLines: lines,
      analysisMetadata: { ...createAnalysisMetadata({ nodes, multiPv }), ...(options.searchMoves ? { searchMoves: options.searchMoves } : {}) } }
  } })
  expect(await analyzer.prepare(candidate)).toMatchObject({ status: 'not-applicable' })
  expect(searches).toBeGreaterThan(0)
  expect(oldGood[0].classification).toBe('good')
})
