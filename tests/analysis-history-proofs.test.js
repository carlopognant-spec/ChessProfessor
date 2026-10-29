import { readFileSync } from 'node:fs'
import { Chess } from 'chess.js'
import { expect, it, vi } from 'vitest'
import { appendHistory, normalizeHistory, uciOf, refinementHistoryMatches } from '../src/lib/analysisHistory.js'
import { buildRefinementPlan, refineGameEntries } from '../src/lib/analysisRefinement.js'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'

const json = path => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url)))
const cases = json('agent-output/special-completion-v1/cohorts.json').cases
function withHistory(raw) {
  const game = new Chess(raw[0].fenBefore)
  let history = { initialFen: game.fen(), moves: [] }
  return reclassifyReviewedMoves(structuredClone(raw).map((e, i) => {
    delete e.refinement
    e.engine.history = history
    history = appendHistory(history, uciOf(game.move(e.playedMove ?? e.san)))
    e.playedEngine.history = history
    return { ...e, ply: i + 1 }
  }))
}

// Recorded FEN-only scores simulate replies here; these tests verify orchestration, not chess accuracy.
it.each([
  ['sacrifice', 'game-1-chigorin-steinitz-1892', undefined, 50, 53, ['all-sacrifice-proofs-v1'], { sacrificeOnly: true }],
  ['native alternatives', 'game-2-saintamant-staunton-1843', 'old', 53, 56,
    ['native-wdl-evidence-v1', 'native-alternative-evidence-v1', 'special-completion-evidence-v1', 'native-edge-study-v1'], { criticalOnly: true }],
])('carries and preserves history through the complete %s proof flow', async (_kind, id, cohort, from, to, collections, mode) => {
  const source = cases.find(c => c.id === id && (!cohort || c.cohort === cohort))
  const packets = new Map()
  for (const collection of collections) {
    for (const record of json(`agent-output/${collection}/collection.json`).records) {
      const packet = json(record.path)
      packets.set(`${packet.fen}|${packet.searchMoves?.[0] ?? '*'}`, packet.engine)
    }
  }
  let entries = withHistory(source.entries.slice(from, to))
  const initial = structuredClone(entries)
  const search = vi.fn(async (fen, _nodes, _multiPv, options) => {
    expect(normalizeHistory(options.history, fen)).toEqual(options.history)
    const packet = packets.get(`${fen}|${options.searchMoves?.[0] ?? '*'}`)
    expect(packet).toBeTruthy()
    return { ...structuredClone(packet), history: structuredClone(options.history) }
  })
  let finished = false
  for (let step = 0; step < 6; step++) {
    const plan = buildRefinementPlan(entries, mode)
    if (!plan.selectedPlies.length) { finished = true; break }
    entries = (await refineGameEntries({ entries, plan, analyzePosition: search })).entries
    expect(entries.every(e => refinementHistoryMatches(e))).toBe(true)
  }
  expect(finished).toBe(true)
  expect(search.mock.calls.length).toBeGreaterThan(0)
  expect(entries.map(e => [e.engine, e.playedEngine])).toEqual(initial.map(e => [e.engine, e.playedEngine]))
  const branched = search.mock.calls.some(([_fen, _nodes, _multiPv, options]) =>
    !initial.some(e => JSON.stringify(e.engine.history) === JSON.stringify(options.history)
      || JSON.stringify(e.playedEngine.history) === JSON.stringify(options.history)))
  expect(branched).toBe(true)
}, 60000)
